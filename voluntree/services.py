from django.core import signing
import json
from datetime import datetime, timedelta
import requests
from django.conf import settings

from config.logshim import LogShim
from .models import (Page, Volunteer, Post, Interest, Verification, SignUp,
                     Integration, VolunteerThirdPartyIntegration)
from random import randint
from wit import Wit
from itertools import groupby
from rauth import OAuth2Service
import logging
logger = LogShim(logging.getLogger(__file__))

class VerificationService:
    @staticmethod
    def verify_volunteer(volunteer_id, email, send_pin):
        try:
            verification_object = Verification.objects.filter(volunteer_id=volunteer_id, email=email).last()

        except Verification.DoesNotExist:
            return False
        
        if verification_object.attempts == 3:
            return False
        
        if send_pin == verification_object.pin:
            verification_object.is_verifed = True
            verification_object.save()
            return True
        
        verification_object.attempts = verification_object.attempts + 1
        verification_object.save()
        return False
    
    @staticmethod
    def generate_verfication_pin(volunteer_id, email, referred_post_id):
        try:
            verification_object = Verification.objects.get(
                volunteer_id=volunteer_id, email=email, referred_post_id=referred_post_id)
        except Verification.DoesNotExist as e:
            pin = randint(100000, 999999) # generate 6 digit random pin
            logger.debug('-'*50)
            logger.debug('OTP', pin)
            logger.debug('-'*50)
            verification_object = Verification.objects.create(
                volunteer_id=volunteer_id, email=email, pin=pin, referred_post_id=referred_post_id)

        return verification_object



class VolunteerService:
    @staticmethod
    def get_or_create_volunteer(psid, page_id):
        volunteer, created = Volunteer.objects.get_or_create(
            facebook_user_id=psid,
            facebook_page_id=page_id
        )
        if created:
            meta_data = FacebookService.get_user_metadata(page_id, psid)
            # TODO: this might fail for some users
            volunteer.first_name = meta_data['first_name']
            volunteer.last_name = meta_data['last_name']
            volunteer.profile_pic = meta_data['profile_pic']
            volunteer.save()

        return [volunteer, created]
    
    @staticmethod
    def get_volunteer_from_interaction(facebook_user_id, facebook_page_id):
        try:
            volunteer = Volunteer.objects.get(
                facebook_user_id=facebook_user_id,
                facebook_page_id=facebook_page_id
            )
        except Volunteer.DoesNotExist:
            # TODO: action need to be taken for not existing volunteer
            pass
        
        return volunteer
    
# VolunteerService.verify_volunteer( '3106639519402532', '105347197864298',  )
    @staticmethod
    def verify_volunteer(facebook_user_id, facebook_page_id, email, send_pin):
        volunteer = VolunteerService.get_volunteer_from_interaction(facebook_user_id, facebook_page_id)
        res = VerificationService.verify_volunteer(volunteer.id, email, send_pin)
        if res is True:
            volunteer.email = email
            volunteer.save()
        return res
    

# VolunteerService.send_verification_email( '3106639519402532', '105347197864298' ,'28f86e98-81f6-47ed-afd9-ac8efb64610f', "two@gmail.com" )
    @staticmethod
    def send_verification_email(facebook_user_id, facebook_page_id, facebook_post_id, email):
        volunteer = VolunteerService.get_volunteer_from_interaction(
            facebook_user_id, facebook_page_id)
        VerificationService.generate_verfication_pin(volunteer.id, email, facebook_post_id)


class InterestService:
    def get_interested_status_from_postback_data(postback_data):
        payload = postback_data['payload'].split("_")

        status = payload[0]
        return status

    @staticmethod
    def create_or_update_intereset_from_postback_data(volunteer, post, status):
        if post is None:
            return False

        intereset, _ = Interest.objects.get_or_create(
            post=post, volunteer=volunteer)

        interested = False
        if status == 'YES':
            interested = True
        intereset.interested = interested
        intereset.save()
        return True


class SignUpService:
    @staticmethod
    def get_human_readable_version(signup_id):
        # TODO: optimize
        signup = SignUp.objects.get(id=signup_id)
        date_times = signup.date_times.all().order_by('date', 'start_time', 'end_time')

        form_fields = []

        iterator = groupby(date_times, lambda x: x.date)
        days = 0
        for group, grouped_date_times in iterator:
            logger.debug(group, grouped_date_times)
            days += 1

            slot_count = 0
            for dt in grouped_date_times:
                slots = dt.slots.all()
                for slot in slots:
                    slot_count += 1
                    interests = Interest.objects.filter(datetime=dt, slot=slot)
                    filled = interests.count()
                    available = slot.required_volunteers - filled

                    form_fields.append({
                        'datetime_id': dt.id,
                        'slot_id': slot.id,
                        'day_count': days,
                        'slot_count': slot_count,
                        'date': dt.date,
                        'start_time': dt.start_time,
                        'end_time': str(dt.end_time),
                        'title': slot.title,
                        'available': available,
                        'required_volunteers': slot.required_volunteers,
                        'description': slot.description,
                    })
        return form_fields, signup

    @staticmethod
    def get_human_readable_version_personal(signup, volunteer):
        # TODO: optimize
        date_times = signup.date_times.all().order_by('date', 'start_time', 'end_time')

        form_fields = []

        iterator = groupby(date_times, lambda x: x.date)
        days = 0
        for group, grouped_date_times in iterator:
            logger.debug(group, grouped_date_times)
            days += 1

            slot_count = 0
            for dt in grouped_date_times:
                slots = dt.slots.all()
                for slot in slots:
                    slot_count += 1
                    interests = Interest.objects.filter(datetime=dt, slot=slot)
                    filled = interests.count()
                    available = slot.required_volunteers - filled
                    interested = interests.filter(volunteer=volunteer)
                    field_name = 'dt_%s:slot_%s' % (str(dt.id), str(slot.id))

                    form_fields.append({
                        'id': 'id_' + field_name,
                        'name': field_name,
                        'datetime_id': dt.id,
                        'slot_id': slot.id,
                        'day_count': days,
                        'slot_count': slot_count,
                        'date': dt.date,
                        'start_time': dt.start_time,
                        'end_time': dt.end_time,
                        'title': slot.title,
                        'available': available,
                        'required_volunteers': slot.required_volunteers,
                        'description': slot.description,
                        'initial': True if interested else False
                    })
        return form_fields, signup


class FacebookService:
    CONFIRMED_EVENT_UPDATE = "CONFIRMED_EVENT_UPDATE"
    FACEBOOK_GRAPH_BASE_URL = 'https://graph.facebook.com/'
    FACEBOOK_GRAPH_API_VERSION = getattr(settings, 'FACEBOOK_GRAPH_API_VERSION')
    FACEBOOK_GRAPH_API_URL = FACEBOOK_GRAPH_BASE_URL + FACEBOOK_GRAPH_API_VERSION

    FACEBOOK_APP_ID = getattr(settings, 'FACEBOOK_APP_ID', '')
    FACEBOOK_APP_SECRET = getattr(settings, 'FACEBOOK_APP_SECRET', '')
    REDIRECT_URI = getattr(settings, 'APP_URL') + '/callback/facebook/'
    STATE = getattr(settings, 'FACEBOOK_OAUTH_STATE', '')
    SCOPE = getattr(settings, 'FACEBOOK_OAUTH_SCOPE', '')

    # TODO: remove hard coded version
    OAUTH_BASE_URL = 'https://www.facebook.com/v7.0/dialog/oauth'
    ACCESS_TOKEN_BASE_URL = 'https://graph.facebook.com/v7.0/oauth/access_token'
    DEBUG_TOKEN_BASE_URL = 'https://graph.facebook.com/debug_token'

    WEBHOOK_SUBSCRIPTION_FIELDS = 'messages,messaging_postbacks,feed'
    WEBHOOK_URL = getattr(settings, 'APP_URL', '') + '/facebook/webhook/'
    WEBHOOK_VERIFY_TOKEN = getattr(settings, 'FACEBOOK_WEBHOOK_VERIFY_TOKEN')

    WIT_AI_TOKEN = getattr(settings, 'WIT_AI_TOKEN')

    APP_URL = getattr(settings, 'APP_URL')

    @staticmethod
    def get_oauth_url():
        return "%s?client_id=%s&redirect_uri=%s&state=%s&scope=%s" % (
            FacebookService.OAUTH_BASE_URL, FacebookService.FACEBOOK_APP_ID,
            FacebookService.REDIRECT_URI, FacebookService.STATE,
            FacebookService.SCOPE)

    @staticmethod
    def get_access_token(code=''):
        params = {
            'redirect_uri': FacebookService.REDIRECT_URI,
            'client_id': FacebookService.FACEBOOK_APP_ID,
            'client_secret': FacebookService.FACEBOOK_APP_SECRET,
            'code': code
        }
        access_token_response = requests.get(
            FacebookService.ACCESS_TOKEN_BASE_URL, params).json()
        return access_token_response.get('access_token', None)

    @staticmethod
    def get_user_id(access_token=''):
        params = {
            'input_token': access_token,
            'access_token': access_token
        }
        debug_token = requests.get(
            FacebookService.DEBUG_TOKEN_BASE_URL, params).json()
        return debug_token.get('data', {}).get('user_id')

    @staticmethod
    def get_pages_access_token(access_token=''):
        params = {
            'access_token': access_token
        }
        # TODO: use graph api version
        url = 'https://graph.facebook.com/me/accounts'
        pages_token = requests.get(url, params).json()
        return pages_token

    @staticmethod
    def verify_oauth(code, user):
        access_token = FacebookService.get_access_token(code)
        pages_token = FacebookService.get_pages_access_token(access_token).get('data', [])
        if not access_token or not pages_token:
            logger.warning('Could not verify user')
            return False

        # TODO: throw error if more than one is connected
        # TODO: match if set page and reconnected page are same
        # TODO: check user has necessary role permissions

        organization = user.organization
        for page in pages_token:
            # register our webhook to listen to pages feed events and messages
            facebook_page_id = page['id']
            page_access_token = page['access_token']

            headers = {'content-type': "application/json"}

            # setup web hooks
            url = '%s/%s/subscribed_apps' % (
                FacebookService.FACEBOOK_GRAPH_API_URL,
                facebook_page_id
            )
            params = json.dumps({
                "access_token": page_access_token,
                "subscribed_fields": FacebookService.WEBHOOK_SUBSCRIPTION_FIELDS
            })
            webhook = requests.post(url, headers=headers, data=params)
            res = webhook.json()
            logger.info('Subscribed to page', facebook_page_id, res)

            # setup nlp
            url = '%s/me/nlp_configs' % (
                FacebookService.FACEBOOK_GRAPH_API_URL,
            )
            params = json.dumps({
                "access_token": page_access_token,
                "custom_token": FacebookService.WIT_AI_TOKEN,
                "model": "CUSTOM",
                "nlp_enabled": "true"
            })
            nlp = requests.post(url, headers=headers, data=params)
            res = nlp.json()
            logger.info('Added NLP to page', facebook_page_id, res)

            # setup whitelisted domains
            url = '%s/me/messenger_profile' % (
                FacebookService.FACEBOOK_GRAPH_API_URL,
            )
            params = json.dumps({
                "access_token": page_access_token,
                "whitelisted_domains": [
                    FacebookService.APP_URL,
                ]
            })
            whitelist = requests.post(url, headers=headers, data=params)
            res = whitelist.json()
            logger.info('Whitelisted', facebook_page_id, res)

            # save page in model
            name = page.get('name', '')
            page_expiry_token_date = datetime.now() + timedelta(days=59)
            Page.objects.update_or_create(
                facebook_page_id=facebook_page_id,
                defaults={'organization': organization, 'name': name,
                          'user': user, 'page_access_token': page_access_token,
                          'page_expiry_token_date': page_expiry_token_date})
        return True


    @staticmethod
    def send_private_message(page, recipient, message):
        # message on comment
        # send_private_message(page, {"comment_id": "commentId"}, {"text": "msg"})
        # message on conversation
        # send_private_message(page, {"id": "psid"}, {"text": "msg"})

        headers = {'content-type': "application/json"}
        # TODO: use graph api version
        url = 'https://graph.facebook.com/%s/messages' % page.facebook_page_id
        params = json.dumps({
            "access_token": page.page_access_token,
            "recipient": recipient,
            "message": message
        })

        return requests.post(url, headers=headers, data=params)

    @staticmethod
    def send_tag_message(page, recipient, message, tag):
        # send_tag_message(page, {"id": "psid"}, {"text": "msg"}, "CONFIRMED_EVENT_UPDATE")

        headers = {'content-type': "application/json"}
        url = 'https://graph.facebook.com/v7.0/me/messages'
        params = json.dumps({
            "access_token": page.page_access_token,
            "recipient": recipient,
            "message": message,
            "messaging_type": "MESSAGE_TAG",
            "tag": tag
        })

        return requests.post(url, headers=headers, data=params)

    @staticmethod
    def send_public_reply(page, post_id, comment_id, message):
        headers = {'content-type': "application/json"}
        url = '%s/%s_%s/comments' % (
            FacebookService.FACEBOOK_GRAPH_API_URL,
            post_id,
            comment_id,
        )
        params = json.dumps({
            "access_token": page.page_access_token,
            "message": message
        })

        return requests.post(url, headers=headers, data=params)

    @staticmethod
    def get_user_metadata(page_id, recipient_id):
        page = Page.objects.get(facebook_page_id=page_id)
        # TODO: use graph api version
        url = 'https://graph.facebook.com/%s' % recipient_id
        params = {
            "access_token": page.page_access_token,
        }
        return requests.get(url, params).json()

    @staticmethod
    def setup_webhook():
        headers = {'content-type': "application/json"}
        url = '%s/%s/subscriptions' % (
            FacebookService.FACEBOOK_GRAPH_API_URL,
            FacebookService.FACEBOOK_APP_ID
        )

        params = json.dumps({
            "access_token": FacebookService.FACEBOOK_APP_ID + "|" + FacebookService.FACEBOOK_APP_SECRET,
            "object": "page",
            "callback_url": FacebookService.WEBHOOK_URL,
            "verify_token": FacebookService.WEBHOOK_VERIFY_TOKEN,
            "fields": FacebookService.WEBHOOK_SUBSCRIPTION_FIELDS,
            "include_values": "true"
        })

        webhook = requests.post(url, headers=headers, data=params)
        res = webhook.json()
        return res

    @staticmethod
    def run_wit(text, context=None):
        client = Wit(FacebookService.WIT_AI_TOKEN)
        return client.message(text, context=context)

    @staticmethod
    def create_photo_on_facebook_page(page, photo_url, published=False):
        photo_create_url = '%s/%s/photos' % (
            FacebookService.FACEBOOK_GRAPH_API_URL,
            page.facebook_page_id
        )
        params = {
            'access_token': page.page_access_token,
            'url': photo_url,
            'published': published
        }
        return requests.post(photo_create_url, params)

    @staticmethod
    def create_post_on_facebook_page(page, status, photo_ids=[]):
        attached_media = []
        for photo_id in photo_ids:
            attached_media.append({
                'media_fbid': photo_id
            })
        post_create_url = '%s/%s/feed' % (
            FacebookService.FACEBOOK_GRAPH_API_URL,
            page.facebook_page_id
        )
        params = {
            'access_token': page.page_access_token,
            'message': status,
            'attached_media': json.dumps(attached_media)
        }
        return requests.post(post_create_url, params)

class OrganizationService:
    def number_of_posts(organization_id, from_date, to_date):
        post_count = Post.objects.filter(
            user__organization=organization_id,
            created_at__date__range=(from_date, to_date),
        ).count()
        return post_count

    def number_of_active_signups(organization_id, from_date, to_date):
        post_count = SignUp.objects.filter(
            user__organization=organization_id,
            created_at__date__range=(from_date, to_date),
            disabled=False
        ).count()
        return post_count

    def get_post_ids(organization_id, from_date, to_date):
        post_ids = Post.objects.filter(
            user__organization=organization_id,
            created_at__date__range=(from_date, to_date),
        ).values('id')
        return post_ids


    def number_of_interests(organization_id, from_date, to_date):
        post_ids = OrganizationService.get_post_ids(organization_id, from_date, to_date)
        total_interest = Interest.objects.filter(post__in=post_ids, interested=True).count()
        return total_interest

    def total_number_of_volunteers(organization_id, from_date, to_date):
        post_ids = OrganizationService.get_post_ids(organization_id, from_date, to_date)
        total_volunteers = Interest.objects.filter(
                                post__in=post_ids,
                                interested=True
                            ).values('volunteer').distinct().count()

        return total_volunteers


    def total_number_of_new_volunteers(organization_id, from_date, to_date):
        all_previous_post_ids = Post.objects.filter(
            user__organization=organization_id,
            created_at__lt=from_date,
        ).values('id')

        all_previous_volunteers = Interest.objects.filter(
                                post__in=all_previous_post_ids,
                                interested=True
                            ).values('volunteer').distinct()

        current_range_post_ids = OrganizationService.get_post_ids(
            organization_id, from_date, to_date)

        current_range_volunteers = Interest.objects.filter(
                                post__in=current_range_post_ids,
                                interested=True
                            ).values('volunteer').distinct()

        current_range_total_volunteers = len(current_range_volunteers)
        previous_volunteers = all_previous_volunteers.intersection(current_range_volunteers)

        new_volunteers = current_range_total_volunteers - len(previous_volunteers)
        return new_volunteers



    def get_stats(organization_id, from_date, to_date):
        start_date = datetime.strptime(from_date, "%Y-%m-%d").date()
        end_date = datetime.strptime(to_date, "%Y-%m-%d").date()

        results = {
            'active_signups': OrganizationService.number_of_active_signups(
                organization_id, start_date, end_date),
            'posts': OrganizationService.number_of_posts(
                organization_id, start_date, end_date),
            'interests': OrganizationService.number_of_interests(
                organization_id, start_date, end_date),
            'volunteers': OrganizationService.total_number_of_volunteers(
                organization_id, start_date, end_date),
            'new_volunteers': OrganizationService.total_number_of_new_volunteers(
                organization_id, start_date, to_date)
        }
        return results 


class NationBuilderService:
    NATIONBUILDER_BASE_URL = 'https://voluntree.nationbuilder.com/'
    NATIONBUILDER_APP_ID = getattr(settings, 'NATIONBUILDER_APP_ID', '')
    NATIONBUILDER_APP_SECRET = getattr(settings, 'NATIONBUILDER_APP_SECRET', '')
    REDIRECT_URI = getattr(settings, 'APP_URL') + '/callback/nation-builder/'
    NATIONBUILDER_PUSH_ENDPOINT = 'https://voluntree.nationbuilder.com/api/v1/people/push'
    NATIONBUILDER_REGISTER_ENDPOINT = 'https://voluntree.nationbuilder.com/api/v1/people/%s/register'
    
    headers = {"Content-Type": "application/json"}

    nation_slug = 'voluntree'

    @staticmethod
    def get_oauth_service(slug):
        access_token_url = "https://" + slug + ".nationbuilder.com/oauth/token"
        authorize_url = slug + ".nationbuilder.com/oauth/authorize"
        return OAuth2Service(
            client_id=NationBuilderService.NATIONBUILDER_APP_ID,
            client_secret=NationBuilderService.NATIONBUILDER_APP_SECRET,
            name='Voluntree',
            authorize_url=authorize_url,
            access_token_url=access_token_url,
            base_url=slug + ".nationbuilder.com")

    @staticmethod
    def get_token(code, slug):
        service = NationBuilderService.get_oauth_service(slug)
        return service.get_access_token(
            decoder=json.loads, data={
                "code": code,
                "redirect_uri": NationBuilderService.REDIRECT_URI,
                "grant_type": "authorization_code"})

    @staticmethod
    def verify_oauth(code, state, user):
        slug = signing.loads(state)
        try:
            token = NationBuilderService.get_token(code, slug)
            expiry_token_date = datetime.now() + timedelta(days=59)
            Integration.objects.update_or_create(
                integration_type=Integration.NATION_BUILDER,
                organization=user.organization,
                defaults={
                    'integration_data': slug,
                    'integration_expiry_date': expiry_token_date,
                    'integration_access_token': token,
                })
            return True
        except KeyError:
            return False

    @staticmethod
    def get_integration(organization):
        try:
            return Integration.objects.get(
                integration_type=Integration.NATION_BUILDER,
                organization=organization)
        except Integration.DoesNotExist:
            return None

    @staticmethod
    def create_people(email, volunteer, post):
        organization = post.page.organization
        integration = NationBuilderService.get_integration(organization)

        if integration is None:
            return False

        service = NationBuilderService.get_oauth_service(integration.integration_data)
        session = service.get_session(integration.integration_access_token)
        data = {
            "person": {
                "email": email,
                "first_name": volunteer.first_name,
                "last_name": volunteer.last_name,
                "is_volunteer": True,
            }
        }
        res = session.put(
            NationBuilderService.NATIONBUILDER_PUSH_ENDPOINT,
            headers=NationBuilderService.headers,
            data=json.dumps(data))

        is_success = False
        if res.status_code == 200 or res.status_code == 201:
            id = res.json().get('person', {}).get('id')
            volunteer.email = email
            volunteer.save()

            VolunteerThirdPartyIntegration.objects.update_or_create(
                integration=integration,
                volunteer=volunteer,
                defaults={"data": id})
            is_success = True
        if res.status_code == 201:
            id = res.json().get('person', {}).get('id')
            register_endpoint = NationBuilderService.NATIONBUILDER_REGISTER_ENDPOINT % id
            session.get(register_endpoint, headers=NationBuilderService.headers)

        return is_success

    @staticmethod
    def get_oauth_url(slug):
        state = signing.dumps(slug)
        url = "%soauth/authorize" % NationBuilderService.NATIONBUILDER_BASE_URL
        return "%s?response_type=code&client_id=%s&redirect_uri=%s&state=%s" % (
            url, NationBuilderService.NATIONBUILDER_APP_ID,
            NationBuilderService.REDIRECT_URI, state)


# VolunteerService.send_verification_email( '3106639519402532', '105347197864298' ,'28f86e98-81f6-47ed-afd9-ac8efb64610f', "two@gmail.com" )
