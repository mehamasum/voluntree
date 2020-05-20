import requests
from django.conf import settings

class FacebookService:
    FACEBOOK_APP_ID = getattr(settings, 'FACEBOOK_APP_ID', '')
    FACEBOOK_APP_SECRET = getattr(settings, 'FACEBOOK_APP_SECRET', '')
    REDIRECT_URI = getattr(settings, 'FACEBOOK_OAUTH_REDIRECT_URI', '')
    STATE = getattr(settings, 'FACEBOOK_OAUTH_STATE', '')
    SCOPE = getattr(settings, 'FACEBOOK_OAUTH_SCOPE', '')
    OAUTH_BASE_URL = 'https://www.facebook.com/v6.0/dialog/oauth'
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
    def save_pages_access_token(code):
        #TODO need to store pages token here
        access_token = FacebookService.get_access_token(code)
        user_id = FacebookService.get_user_id(access_token)
        pages_token = FacebookService.get_pages_access_token(
            user_id, access_token)
        if not access_token or not user_id or not pages_token:
            return False
        return True
