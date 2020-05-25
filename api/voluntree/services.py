import json
import requests
from datetime import datetime, timedelta
from django.conf import settings
from .models import Page, Volunteer, Post, Interest


class VolunteerService:
    @staticmethod
    def get_or_create_volunteer_from_postback_data(data):
        facebook_user_id = data.get('entry', [{}])[0] \
            .get('messaging', [{}])[0].get('sender', {}).get('id')
        volunteer, _ = Volunteer.objects.get_or_create(
            facebook_user_id=facebook_user_id)
        return volunteer


class InterestService:
    @staticmethod
    def create_or_update_intereset_from_postback_data(volunteer, data):
        payload = data.get('entry', [{}])[0] \
            .get('messaging', [{}])[0].get('postback', {}) \
            .get('payload', 'NO_x_y').split("_")
        print("payload", payload)
        status = payload[0]
        post_id = payload[2]
        print("status", status)
        print("post_id", post_id)
        post = None

        try:
            post = Post.objects.get(facebook_post_id=post_id)
        except Post.DoesNotExist:
            return False

        print(post)
        intereset, _ = Interest.objects.get_or_create(
            post=post, volunteer=volunteer)

        interested = False
        if status == 'YES':
            interested = True
        intereset.interested = interested
        intereset.save()
        return True


class PostService:
    @staticmethod
    def create_post_on_facebook_page(page, status):
        post_create_url = ('https://graph.facebook.com/%s/feed'
                           % page.facebook_page_id)
        params = {
            'access_token': page.page_access_token,
            'message': status
        }
        return requests.post(post_create_url, params)


class FacebookService:
    FACEBOOK_APP_ID = getattr(settings, 'FACEBOOK_APP_ID', '')
    FACEBOOK_APP_SECRET = getattr(settings, 'FACEBOOK_APP_SECRET', '')
    REDIRECT_URI = getattr(settings, 'FACEBOOK_OAUTH_REDIRECT_URI', '')
    STATE = getattr(settings, 'FACEBOOK_OAUTH_STATE', '')
    SCOPE = getattr(settings, 'FACEBOOK_OAUTH_SCOPE', '')
    OAUTH_BASE_URL = 'https://www.facebook.com/v7.0/dialog/oauth'
    ACCESS_TOKEN_BASE_URL = 'https://graph.facebook.com/v7.0/oauth/access_token'
    DEBUG_TOKEN_BASE_URL = 'https://graph.facebook.com/debug_token'

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
    def get_pages_access_token(user_id='', access_token=''):
        params = {
            'access_token': access_token
        }
        url = 'https://graph.facebook.com/%s/accounts' % user_id
        pages_token = requests.get(url, params).json()
        return pages_token

    @staticmethod
    def save_pages_access_token(code, user):
        access_token = FacebookService.get_access_token(code)
        user_id = FacebookService.get_user_id(access_token)
        pages_token = FacebookService.get_pages_access_token(
            user_id, access_token).get('data', [])
        if not access_token or not user_id or not pages_token:
            return False

        organization = user.organization
        for page in pages_token:
            name = page.get('name', '')
            facebook_page_id = page.get('id', '')
            page_access_token = page.get('access_token', '')
            page_expiry_token_date = datetime.now() + timedelta(days=59)
            Page.objects.update_or_create(
                facebook_page_id=facebook_page_id,
                defaults={'organization': organization, 'name': name,
                          'user': user, 'page_access_token': page_access_token,
                          'page_expiry_token_date': page_expiry_token_date})
        return True

    #SEND message on comment
    # send_private_message(page, {"comment_id": "commentId"}, {"text": "msg"})
    #SEND message on conversation
    # send_private_message(page, {"id": "psid"}, {"text": "msg"})

    def send_private_message(page, recipient, message):
        headers = {'content-type': "application/json"}
        url = 'https://graph.facebook.com/%s/messages' % page.facebook_page_id
        params = json.dumps({
            "access_token": page.page_access_token,
            "recipient": recipient,
            "message": message
        })

        return requests.post(url, headers=headers, data=params)
