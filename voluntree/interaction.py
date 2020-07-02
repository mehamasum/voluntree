import json
import re

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework import status
from rest_framework.response import Response
import arrow
import pytz
import datetime
from urllib.parse import quote

from voluntree.models import Post, Volunteer, SignUp, Interest, DateTime, Slot
from voluntree.services import FacebookService, VolunteerService, SignUpService, NationBuilderService
from voluntree.tasks import send_private_reply_on_comment, reply, comment, find_answer


def to_user_timezone(date, timezone=settings.TIME_ZONE):
    return date.replace(tzinfo=pytz.timezone(settings.TIME_ZONE)).astimezone(pytz.timezone(timezone))


def to_system_timezone(date, timezone=settings.TIME_ZONE):
    return date.replace(tzinfo=pytz.timezone(timezone)).astimezone(pytz.timezone(settings.TIME_ZONE))


def now_timezone():
    return datetime.datetime.now().replace(tzinfo=pytz.timezone(settings.TIME_ZONE)).astimezone(pytz.timezone(settings.TIME_ZONE))


class Intents:
    SIGN_UP_AS_VOLUNTEER = 'SIGN_UP_AS_VOLUNTEER'
    QUES_EVENT_INFO = 'QUES_EVENT_INFO'
    APPRECIATION = 'APPRECIATION'
    PAYMENT_INFO = 'PAYMENT_INFO'
    HOW_CAN_I_SIGNUP = 'HOW_CAN_I_SIGNUP'
    VOLUNTEER_REQUIRMENTS = 'VOLUNTEER_REQUIRMENTS'
    VACANCIES_ON_SLOT = 'VACANCIES_ON_SLOT'

class InteractionHandler:
    ASKED_FOR_SIGNUP_ID = 'ASKED_FOR_SIGNUP_ID'
    ASKED_FOR_EMAIL = 'ASKED_FOR_EMAIL'
    ASKED_FOR_PIN = 'ASKED_FOR_PIN'

    @staticmethod
    def get_context(psid, page_id):
        cache_key = 'conversation_%s_%s' % (psid, page_id)
        cache_value = cache.get(cache_key)

        if not cache_value:
            return None

        return json.loads(cache_value)

    @staticmethod
    def set_context(psid, page_id, context):
        cache_key = 'conversation_%s_%s' % (psid, page_id)
        cache.set(cache_key, json.dumps(context), timeout=24*60*60)  # a day
        return cache.get(cache_key)

    @staticmethod
    def reset_context(psid, page_id):
        cache_key = 'conversation_%s_%s' % (psid, page_id)
        cache.expire(cache_key, timeout=0)

    @staticmethod
    def handle_new_comment(data):
        comment_id = data['value']['comment_id']
        comment_text = data['value']['message']
        post_id = comment_id.split('_')[0]
        try:
            post = Post.objects.get(facebook_post_id=post_id)
        except Post.DoesNotExist:
            # TODO: ignoring for now
            print('Ignoring comment for disabled or unknown post')
            return Response(status.HTTP_200_OK)
        print('Webhook callback handle comment', data)
        page_id = post.page.facebook_page_id

        nlp = FacebookService.run_wit(comment_text, {
            'timezone': str(post.page.organization.timezone)
        })
        print('wit', nlp)

        intent = InteractionHandler.first_intent(nlp)
        print('intent', intent)

        if intent and intent['name'] == Intents.SIGN_UP_AS_VOLUNTEER and intent['confidence'] > 0.8:
            if post.signup:
                fields, signup = SignUpService.get_human_readable_version(post.signup.id)

                slot_query = InteractionHandler.first_entity(nlp, 'custom_signup-slot:signup-slot')
                day_query = InteractionHandler.first_entity(nlp, 'custom_signup-day:signup-day')

                specific_time = InteractionHandler.first_entity(nlp, 'wit$datetime:datetime')

                if day_query and slot_query:
                    day_count = int(day_query['body'].lower().replace("day ", ""))
                    slot_count = int(slot_query['body'].lower().replace("slot ", ""))
                    print('got both day and slot in cmnt', day_count, slot_count)
                    match = [field for field in fields if
                             field['day_count'] == day_count and field['slot_count'] == slot_count]
                    InteractionHandler.reconfirm_about_day_and_slot(match, page_id, post_id, comment_id)

                elif specific_time and slot_query:
                    datetime_query = arrow.get(specific_time['value']).date()
                    slot_count = int(slot_query['body'].lower().replace("slot ", ""))
                    print('got specific day and slot in cmnt', datetime_query, slot_count)
                    match = [field for field in fields if
                             field['date'] == datetime_query and field['slot_count'] == slot_count]
                    InteractionHandler.reconfirm_about_day_and_slot(match, page_id, post_id, comment_id)

                elif day_query:
                    day_count = day_query['body'].lower().replace("day ", "")
                    matches = [field for field in fields if field['day_count'] == day_count]
                    # todo: need to have the slot id too
                    InteractionHandler.ask_for_reconfirmation(page_id, post_id, comment_id, None, None)

                elif specific_time:
                    datetime_query = arrow.get(specific_time['value']).date()
                    matches = [field for field in fields if field['date'] == datetime_query]
                    # todo: need to have the slot id too
                    InteractionHandler.ask_for_reconfirmation(page_id, post_id, comment_id, None, None)

                else:
                    InteractionHandler.ask_for_reconfirmation(page_id, post_id, comment_id, None, None)
            else:
                # todo: only onboarding
                pass

        elif intent and intent['name'] == Intents.HOW_CAN_I_SIGNUP and intent['confidence'] > 0.8:
            message = 'Thank you for your interest. We have sent you a private reply.'
            print('public comment', message)
            InteractionHandler.send_comment(page_id, post_id, comment_id, message)
            send_private_reply_on_comment.apply_async((data,))
        elif intent and intent['name'] == Intents.QUES_EVENT_INFO and intent['confidence'] > 0.6:
            if post.signup:
                message = find_answer(comment_text, post.signup.facts)
                if not message:
                    message = post.signup.description
                print('public comment', message)
                InteractionHandler.send_comment(page_id, post_id, comment_id, message)
        elif intent and intent['name'] == Intents.APPRECIATION and intent['confidence'] > 0.8:
            message = 'Thank you'
            print('public comment', message)
            InteractionHandler.send_comment(page_id, post_id, comment_id, message)
        elif intent and intent['name'] == Intents.PAYMENT_INFO and intent['confidence'] > 0.6:
            payment_info = post.page.organization.payment_info
            if payment_info:
                message = find_answer(comment_text, payment_info)
                if not message:
                    message = 'Here is how you can send donations\n%s' % payment_info
                print('public comment', message)
                InteractionHandler.send_comment(page_id, post_id, comment_id, message)
        elif intent and intent['name'] == Intents.VOLUNTEER_REQUIRMENTS and intent['confidence'] > 0.6:
            volunteer_info = post.page.organization.volunteer_info
            if volunteer_info:
                message = find_answer(comment_text, volunteer_info)
                if not message:
                    message = 'Here are the requirements\n%s' % volunteer_info
                print('public comment', message)
                InteractionHandler.send_comment(page_id, post_id, comment_id, message)
        elif intent and intent['name'] == Intents.VACANCIES_ON_SLOT and intent['confidence'] > 0.8:
            """
            'entities': {
                'custom_signup-slot:signup-slot': [{'id': '681286802715130', 'name': 'custom_signup-slot', 'role': 'signup-slot', 'start': 33, 'end': 39, 'body': 'slot 5', 'confidence': 0.9792, 'entities': [], 'value': 'slot 5', 'type': 'value'}], 
                'custom_signup-day:signup-day': [{'id': '314261056257055', 'name': 'custom_signup-day', 'role': 'signup-day', 'start': 27, 'end': 32, 'body': 'day 1', 'confidence': 0.9587, 'entities': [], 'value': 'day 1', 'type': 'value'}]},
            """
            if post.signup:
                fields, signup = SignUpService.get_human_readable_version(post.signup.id)
                print(fields)

                slot_query = InteractionHandler.first_entity(nlp, 'custom_signup-slot:signup-slot')
                day_query = InteractionHandler.first_entity(nlp, 'custom_signup-day:signup-day')

                specific_time = InteractionHandler.first_entity(nlp, 'wit$datetime:datetime')

                if day_query and slot_query:
                    day_count = int(day_query['body'].lower().replace("day ", ""))
                    slot_count = int(slot_query['body'].lower().replace("slot ", ""))
                    match = [field for field in fields if
                             field['day_count'] == day_count and field['slot_count'] == slot_count]
                    message = InteractionHandler.reply_about_day_and_slot(match)

                elif specific_time and slot_query:
                    datetime_query = arrow.get(specific_time['value']).date()
                    slot_count = int(slot_query['body'].lower().replace("slot ", ""))
                    match = [field for field in fields if
                             field['date'] == datetime_query and field['slot_count'] == slot_count]
                    message = InteractionHandler.reply_about_day_and_slot(match)

                elif day_query:
                    day_count = day_query['body'].lower().replace("day ", "")
                    matches = [field for field in fields if field['day_count'] == day_count]
                    message = InteractionHandler.reply_about_day(matches, signup)

                elif specific_time:
                    datetime_query = arrow.get(specific_time['value']).date()
                    print('date', datetime_query)
                    matches = [field for field in fields if field['date'] == datetime_query]
                    message = InteractionHandler.reply_about_day(matches, signup)

                else:
                    slot_strings = []
                    for field in fields:
                        row = '[Day %d][Slot %d]\nDate: %s\nTime: %s\n\nSlot: %s\nAvailability: %s\nDescription: %s\n' % (
                            field['day_count'],
                            field['slot_count'],
                            field['date'],
                            str(field['start_time']) + ' to ' + str(field['end_time']),
                            field['title'],
                            str(field['available']) + " of " + str(
                                field['required_volunteers']) + " volunteers required",
                            field['description'],
                        )
                        slot_strings.append(row)

                    separator = '-' * 50
                    newline_with_separator = separator + '\n'
                    message = "Thank you for your query. Here are the details:\n\n{}".format(
                        newline_with_separator.join(slot_strings),
                    )
                print('public comment', message)
                InteractionHandler.send_comment(page_id, post_id, comment_id, message)

        else:
            # TODO: skip for now
            pass
        return Response(status.HTTP_200_OK)


    @staticmethod
    def reconfirm_about_day_and_slot(matches, page_id, post_id, comment_id):
        if matches and matches[0]:
            datetime_id = matches[0]['datetime_id']
            slot_id = matches[0]['slot_id']
            print("Day and slot match for direct signup from comment", datetime_id, slot_id)
            InteractionHandler.ask_for_reconfirmation(page_id, post_id, comment_id, datetime_id, slot_id)
        else:
            InteractionHandler.ask_for_reconfirmation(page_id, post_id, comment_id, None, None)


    @staticmethod
    def reply_about_day(matches, signup):
        if matches:
            slot_strings = []
            for match in matches:
                row = '[Slot %d]\nTime: %s\n\nSlot: %s\nAvailability: %s\nDescription: %s\n' % (
                    match['slot_count'],
                    str(match['start_time']) + ' to ' + str(match['end_time']),
                    match['title'],
                    str(match['available']) + " of " + str(
                        match['required_volunteers']) + " volunteers required",
                    match['description'],
                )
                slot_strings.append(row)

            message = "Thank you for your query. "

            if len(slot_strings) > 1:
                message += 'We need volunteers across slots. '

            separator = '-' * 50
            newline_with_separator = separator + '\n'
            message += "Here are the details:\n{}".format(
                newline_with_separator.join(slot_strings),
            )

        else:
            message = 'Sorry, no data found'
        return message

    @staticmethod
    def reply_about_day_and_slot(match):
        if match and match[0]:
            message = str(match[0]['available']) + " of " + str(
                match[0]['required_volunteers']) + " volunteers required",
        else:
            message = 'Sorry, no data found'
        return message

    @staticmethod
    def handle_new_postback(psid, page_id, postback):
        # BOOL_PAGE_POST
        payload = postback['payload'].split("_")
        type = payload[0]

        if type == 'YES' or type == 'NO':
            consent = type
            page_id = payload[1]
            post_id = payload[2]

            if len(payload) > 3:
                datetime_id = payload[3]
                slot_id = payload[4]
            else:
                datetime_id = None
                slot_id = None

            if consent == 'NO':
                # TODO: ignore for now
                return Response(status.HTTP_200_OK)

            InteractionHandler.handle_consent(psid, page_id, post_id, datetime_id, slot_id)

        elif type == 'SIGNUP':
            post_id = payload[1]
            datetime_id = None
            slot_id = None
            InteractionHandler.handle_consent(psid, page_id, post_id, datetime_id, slot_id)

        return Response(status.HTTP_200_OK)


    @staticmethod
    def handle_consent(psid, page_id, fb_post_id, datetime_id, slot_id):
        # TODO: handle already clicked
        volunteer, created = VolunteerService \
            .get_or_create_volunteer(psid, page_id)

        post = Post.objects.get(facebook_post_id=fb_post_id)
        verification = post.page.organization.volunteer_verification

        if created and verification:
            InteractionHandler.set_context(psid, page_id, {
                'post_id': fb_post_id,
                'datetime_id': datetime_id,
                'slot_id': slot_id,
                'state': InteractionHandler.ASKED_FOR_EMAIL
            })
            nb_integration = NationBuilderService.get_integration(post.page.organization)
            prompt_email_msg = 'Please give us your email address.'
            if nb_integration:
                prompt_email_msg += ' We will use it to create an account for you in our volunteer management software.'
            InteractionHandler.send_reply(psid, page_id, {
                'text': prompt_email_msg
            })
        else:
            InteractionHandler.reset_context(psid, page_id)
            InteractionHandler.reply_with_slot_picker_or_add_interest(psid, page_id, post, volunteer, datetime_id, slot_id)

    @staticmethod
    def reply_with_slot_picker_or_add_interest(psid, page_id, post, volunteer, datetime_id, slot_id):
        if datetime_id and slot_id:
            # todo: optimize
            datetime = DateTime.objects.get(id=datetime_id)
            slot = Slot.objects.get(id=slot_id)
            Interest.objects.get_or_create(datetime=datetime, slot=slot, volunteer=volunteer)
            InteractionHandler.send_calendar_confirmation(psid, page_id, datetime, slot, volunteer, datetime.signup)
            InteractionHandler.reply_with_slot_picker(psid, page_id, post, first=False)
        else:
            InteractionHandler.reply_with_slot_picker(psid, page_id, post, first=True)

    @staticmethod
    def first_entity(nlp, name):
        return nlp and 'entities' in nlp and name in nlp['entities'] and len(nlp['entities'][name]) > 0 and nlp['entities'][name][0]

    @staticmethod
    def first_intent(nlp):
        return nlp and 'intents' in nlp and len(nlp['intents']) > 0 and nlp['intents'][0]

    @staticmethod
    def validate_email(email_input):
        try:
            validate_email(email_input)
            return True
        except ValidationError:
            return False

    @staticmethod
    def validate_otp(otp):
        if 99999 < otp <= 999999:
            return True
        else:
            return False

    @staticmethod
    def validate_otp_str(otp):
        if re.fullmatch('\d{6}', otp):
            return True
        else:
            return False

    @staticmethod
    def send_reply(psid, page_id, message):
        reply.apply_async((psid, page_id, json.dumps(message),))

    @staticmethod
    def send_comment(page_id, post_id, comment_id, message):
        # TODO: async
        comment.apply_async((page_id, post_id, comment_id, message,))

    @staticmethod
    def handle_expired_session(psid, page_id):
        InteractionHandler.send_reply(psid, page_id, {
            'text': 'Sorry the session expired. Please start over.'
        })
        return Response(status.HTTP_200_OK)

    @staticmethod
    def handle_text_message(psid, page_id, message):
        text = message['text']
        nlp = message['nlp']

        intent = InteractionHandler.first_intent(nlp) or InteractionHandler.first_entity(nlp, 'intent')
        intent_type = None
        if intent:
            intent_type = intent['name'] if 'name' in intent else intent['value']
        print('intent', intent)

        email_entity = InteractionHandler.first_entity(nlp, 'email')
        print('email intent', email_entity)

        otp_entity = InteractionHandler.first_entity(nlp, 'otp')
        print('otp intent', otp_entity)

        if intent_type and intent_type == Intents.SIGN_UP_AS_VOLUNTEER and intent['confidence'] > 0.8:
            print('sign up intent', intent)
            signups = SignUp.objects.filter(disabled=False)

            buttons = []
            for signup in signups:
                related_post = signup.posts.first()
                if related_post:
                    buttons.append({
                        "type": "postback",
                        "title": signup.title,
                        "payload": 'SIGNUP_%s' % str(related_post.facebook_post_id)
                    })

            # todo: design chips
            InteractionHandler.send_reply(psid, page_id, {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "button",
                        "text": "We are glad to hear that. Which event would you like to sign up for?",
                        "buttons": buttons
                    }
                }
            })

            InteractionHandler.set_context(psid, page_id, {
                'state': InteractionHandler.ASKED_FOR_SIGNUP_ID,
            })
            return Response(status.HTTP_200_OK)

        elif InteractionHandler.validate_email(text):
            email = text
            InteractionHandler.handle_email(psid, page_id, email)

        elif email_entity and InteractionHandler.validate_email(email_entity['value']) and email_entity['confidence'] > 0.8:
            email = email_entity['value']
            InteractionHandler.handle_email(psid, page_id, email)

        elif InteractionHandler.validate_otp_str(text):
            pin = text
            InteractionHandler.handle_pin(psid, page_id, pin)

        elif otp_entity and InteractionHandler.validate_otp(otp_entity['value']) and otp_entity['confidence'] > 0.7:
            pin = otp_entity['value']
            InteractionHandler.handle_pin(psid, page_id, pin)

        return Response(status.HTTP_200_OK)

    @staticmethod
    def handle_email(psid, page_id, email):
        context = InteractionHandler.get_context(psid, page_id)
        if not context:
            return InteractionHandler.handle_expired_session(psid, page_id)

        post_instance = Post.objects.get(facebook_post_id=context['post_id'])
        VolunteerService.send_verification_email(psid, page_id, post_instance.id, email)

        InteractionHandler.set_context(psid, page_id, {
            'post_id': context['post_id'],
            'datetime_id': context['datetime_id'] if 'datetime_id' in context else None,
            'slot_id': context['slot_id'] if 'slot_id' in context else None,
            'state': InteractionHandler.ASKED_FOR_PIN,
            'email': email
        })
        InteractionHandler.send_reply(psid, page_id, {
            'text': 'We have sent an OTP to the email address you provided. What is the OTP?'
        })

    @staticmethod
    def handle_pin(psid, page_id, pin):
        context = InteractionHandler.get_context(psid, page_id)
        if not context:
            return InteractionHandler.handle_expired_session(psid, page_id)

        post_id = context['post_id']
        email = context['email']
        datetime_id = context['datetime_id'] if 'datetime_id' in context else None
        slot_id = context['slot_id'] if 'slot_id' in context else None

        res = VolunteerService.verify_volunteer(psid, page_id, email, int(pin))
        print('got res', res)
        if not res:
            # TODO: handle wrong attempt
            pass

        volunteer = Volunteer.objects.get(facebook_user_id=psid, facebook_page_id=page_id)
        post = Post.objects.get(facebook_post_id=post_id)

        if NationBuilderService.create_people(email, volunteer, post):
            InteractionHandler.send_reply(psid, page_id, {
                'text': 'Your email is verified. ' +
                        'We have created an account for you in our volunteer management software.'
            })

        InteractionHandler.reply_with_slot_picker_or_add_interest(psid, page_id, post, volunteer, datetime_id, slot_id)
        InteractionHandler.reset_context(psid, page_id)

    @staticmethod
    def reply_with_slot_picker(psid, page_id, post, first=False):
        if first:
            msg = 'Please pick slots by clicking on this button. You can also use it to unregister later if you wish.'
        else:
            msg = 'You can use this button to unregister if you wish.'
        InteractionHandler.send_reply(psid, page_id, {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": msg,
                    "buttons": [
                        {
                            "type": "web_url",
                            "url": "%s/messenger/%s/signup/%s/?post_id=%s&psid=%s" % (
                                getattr(settings, 'APP_URL'),
                                page_id,
                                str(post.signup.id),
                                str(post.id),
                                psid,
                            ),
                            "title": "Select Slots",
                            "webview_height_ratio": "tall",
                            "messenger_extensions": "true"
                        }
                    ]
                }
            }
        })

    @staticmethod
    def ask_for_reconfirmation(page_id, post_id, comment_id, datetime_id, slot_id):
        our_comment = 'Thank you for your interest. We have sent you a private reply.'
        InteractionHandler.send_comment(page_id, post_id, comment_id, our_comment)

        if datetime_id and slot_id:
            yes = ("YES_%s_%s_%s_%s" % (page_id, post_id, datetime_id, slot_id))
        else:
            yes = ("YES_%s_%s" % (page_id, post_id))

        message = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": "We think you are interested to sign up as volunteer. Want to continue?",
                    "buttons": [
                        {
                            "type": "postback",
                            "title": "Yes, Lets do this!",
                            "payload": yes
                        },
                        {
                            "type": "postback",
                            "title": "No, Not Interested",
                            "payload": ("NO_%s_%s" % (
                                page_id, post_id))
                        },
                    ]
                }
            }
        }
        send_private_reply_on_comment.apply_async((comment_id, page_id, json.dumps(message),))


    @staticmethod
    def send_calendar_confirmation(psid, page_id, datetime, slot, volunteer, signup):
        timezone_str = 'America/Los_Angeles'
        title = slot.title
        desc = slot.description
        location = 'Location'
        start_date = end_date = arrow.get(datetime.date).format('YYYY-MM-DD HH:mm:ss')
        tail = 'e[0][date_start]=' + start_date + '&e[0][date_end]=' + end_date + '&e[0][timezone]=' + timezone_str + '&e[0][title]=' + title + '&e[0][description]=' + desc + '&e[0][location]=' + location + '&e[0][privacy]=private)'

        InteractionHandler.send_reply(psid, page_id, {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": "You signed up for this slot! You can add this event to your personal calendar:",
                    "buttons": [
                        {
                            "type": "web_url",
                            "url": "http://addtocalendar.com/atc/google?f=m&%s" % tail,
                            "title": "+Google Calendar",
                        },
                        {
                            "type": "web_url",
                            "url": "http://addtocalendar.com/atc/outlookonline?f=m&%s" % tail,
                            "title": "+Outlook Calendar",
                        },
                        {
                            "type": "web_url",
                            "url": "http://addtocalendar.com/atc/ical?f=m&%s" % tail,
                            "title": "+Apple Calendar",
                        }
                    ]
                }
            }
        })
        InteractionHandler.send_sharable_link(psid, page_id, volunteer, signup)

    @staticmethod
    def send_wo_calendar_confirmation(psid, page_id, count, volunteer, signup):
        InteractionHandler.send_reply(psid, page_id, {
            'text': "You signed up for %s slots :)" % count
        })
        InteractionHandler.send_sharable_link(psid, page_id, volunteer, signup)

    @staticmethod
    def send_sharable_link(psid, page_id, volunteer, signup):
        link = '%s/share/register/%s/%s/' % (settings.APP_URL, str(signup.id), str(volunteer.id))
        InteractionHandler.send_reply(psid, page_id, {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": 'You can share that you signed up with your friends <3',
                    "buttons": [
                        {
                            "type": "web_url",
                            "url": "https://www.facebook.com/dialog/share?app_id=%s&display=page&href=%s" % (
                                FacebookService.FACEBOOK_APP_ID,
                                quote(link)
                            ),
                            "title": "Share You Signed Up",
                        }
                    ]
                }
            }
        })
