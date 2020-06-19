import json

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework import status
from rest_framework.response import Response

from voluntree.models import Post, Volunteer, SignUp
from voluntree.services import FacebookService, VolunteerService, SignUpService, NationBuilderService
from voluntree.tasks import send_private_reply_on_comment, reply, comment


class Intents:
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

        nlp = FacebookService.run_wit(comment_text)
        print('wit', nlp)

        intent = InteractionHandler.first_intent(nlp)
        print('intent', intent)

        if intent and intent['name'] == 'SIGN_UP_AS_VOLUNTEER' and intent['confidence'] > 0.8:
            message = 'Thank you for your interest. We have sent you a private reply.'
            print('public comment', message)
            InteractionHandler.send_comment(page_id, post_id, comment_id, message)
            send_private_reply_on_comment.apply_async((data,))
        elif intent and intent['name'] == Intents.HOW_CAN_I_SIGNUP and intent['confidence'] > 0.8:
            message = 'Thank you for your interest. We have sent you a private reply.'
            print('public comment', message)
            InteractionHandler.send_comment(page_id, post_id, comment_id, message)
            send_private_reply_on_comment.apply_async((data,))
        elif intent and intent['name'] == Intents.QUES_EVENT_INFO and intent['confidence'] > 0.8:
            if post.signup:
                message = post.signup.description
                print('public comment', message)
                InteractionHandler.send_comment(page_id, post_id, comment_id, message)
        elif intent and intent['name'] == Intents.APPRECIATION and intent['confidence'] > 0.8:
            message = 'Thank you'
            print('public comment', message)
            InteractionHandler.send_comment(page_id, post_id, comment_id, message)
        elif intent and intent['name'] == Intents.PAYMENT_INFO and intent['confidence'] > 0.8:
            payment_info = post.page.organization.payment_info
            if payment_info:
                message = 'Here is how you can send donations\n%s' % payment_info
                print('public comment', message)
                InteractionHandler.send_comment(page_id, post_id, comment_id, message)
        elif intent and intent['name'] == Intents.VOLUNTEER_REQUIRMENTS and intent['confidence'] > 0.8:
            volunteer_info = post.page.organization.volunteer_info
            if volunteer_info:
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
                slot_query = InteractionHandler.first_entity(nlp, 'custom_signup-slot:signup-slot')
                day_query = InteractionHandler.first_entity(nlp, 'custom_signup-day:signup-day')
                if day_query and slot_query:
                    day_count = int(day_query['body'].lower().replace("day ", ""))
                    slot_count = int(slot_query['body'].lower().replace("slot ", ""))
                    match = [field for field in fields if field['day_count'] == day_count and field['slot_count'] == slot_count]
                    if match and match[0]:
                        message = str(match[0]['available']) + " of " + str(match[0]['required_volunteers']) + " volunteers required",
                    else:
                        message = 'Sorry, no data found'
                elif day_query:
                    day_count = day_query['body'].lower().replace("day ", "")
                    matches = [field for field in fields if field['day_count'] == day_count]
                    if matches:
                        slot_strings = []
                        for field in matches:
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
                        message = "We need volunteers across slots on that day. Here are the details:\n{}\n{}\n\nSlots:\n{}\n{}".format(
                            signup.title,
                            signup.description,
                            separator,
                            newline_with_separator.join(slot_strings),
                        )
                    else:
                        message = 'Sorry, no data found'
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
                    message = "We need volunteers across slots. Here are the details:\n{}\n{}\n\nSlots:\n{}\n{}".format(
                        signup.title,
                        signup.description,
                        separator,
                        newline_with_separator.join(slot_strings),
                    )
                print('public comment', message)
                InteractionHandler.send_comment(page_id, post_id, comment_id, message)

        else:
            # TODO: skip for now
            pass
        return Response(status.HTTP_200_OK)

    @staticmethod
    def handle_new_postback(psid, page_id, postback):
        # BOOL_PAGE_POST
        payload = postback['payload'].split("_")
        consent = payload[0]
        page_id = payload[1]
        post_id = payload[2]

        if consent == 'NO':
            # TODO: ignore for now
            return Response(status.HTTP_200_OK)

        # TODO: handle already clicked
        volunteer, created = VolunteerService \
            .get_or_create_volunteer(psid, page_id)

        post = Post.objects.get(facebook_post_id=post_id)

        if created:
            InteractionHandler.set_context(psid, page_id, {
                'post_id': post_id,
                'state': InteractionHandler.ASKED_FOR_EMAIL
            })
            InteractionHandler.send_reply(psid, page_id, {
                'text': 'What is your email?'
            })
        else:
            InteractionHandler.reset_context(psid, page_id)
            InteractionHandler.reply_with_slot_picker(psid, page_id, post)

        return Response(status.HTTP_200_OK)

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
        # if re.fullmatch('\d{6}', otp):
        if 99999 < otp <= 999999:
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

        intent = InteractionHandler.first_entity(nlp, 'intent')
        print('intent', intent)

        email_entity = InteractionHandler.first_entity(nlp, 'email')
        print('email intent', email_entity)

        otp_entity = InteractionHandler.first_entity(nlp, 'otp')
        print('otp intent', otp_entity)

        if intent and intent['value'] == 'SIGN_UP_AS_VOLUNTEER' and intent['confidence'] > 0.8:
            print('sign up intent', intent)

            # todo: design chips
            InteractionHandler.send_reply(psid, page_id, {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "button",
                        "text": "Which event?",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Event 1",
                                "payload": 'SIGNUP_event_1'
                            },
                            {
                                "type": "postback",
                                "title": "Event 2",
                                "payload": 'SIGNUP_event_2'
                            },
                        ]
                    }
                }
            })

            InteractionHandler.set_context(psid, page_id, {
                'state': InteractionHandler.ASKED_FOR_SIGNUP_ID,
            })
            return Response(status.HTTP_200_OK)

        elif email_entity and InteractionHandler.validate_email(email_entity['value']) and email_entity['confidence'] > 0.8:
            email = email_entity['value']
            context = InteractionHandler.get_context(psid, page_id)
            if not context:
                return InteractionHandler.handle_expired_session(psid, page_id)

            post_instance = Post.objects.get(facebook_post_id=context['post_id'])
            VolunteerService.send_verification_email(psid, page_id, post_instance.id, email)

            InteractionHandler.set_context(psid, page_id, {
                'post_id': context['post_id'],
                'state': InteractionHandler.ASKED_FOR_PIN,
                'email': email
            })
            InteractionHandler.send_reply(psid, page_id, {
                'text': 'What is the OTP?'
            })

        elif otp_entity and InteractionHandler.validate_otp(otp_entity['value']) and otp_entity['confidence'] > 0.7:
            pin = otp_entity['value']

            context = InteractionHandler.get_context(psid, page_id)
            if not context:
                return InteractionHandler.handle_expired_session(psid, page_id)

            post_id = context['post_id']
            email = context['email']

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

            InteractionHandler.reply_with_slot_picker(psid, page_id, post)
            InteractionHandler.reset_context(psid, page_id)

        return Response(status.HTTP_200_OK)

    @staticmethod
    def reply_with_slot_picker(psid, page_id, post):
        InteractionHandler.send_reply(psid, page_id, {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": "Pick slots to sign up",
                    "buttons": [
                        {
                            "type": "web_url",
                            "url": "%s/messenger/%s/signup/%s/%s/?post_id=%s" % (
                                getattr(settings, 'APP_URL'),
                                page_id,
                                str(post.signup.id),
                                psid,
                                str(post.id)
                            ),
                            "title": "Select Slots",
                            "webview_height_ratio": "tall",
                            "messenger_extensions": "true"
                        }
                    ]
                }
            }
        })
