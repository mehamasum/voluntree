from django.conf import settings

class FacebookService:
    FACEBOOK_APP_ID = getattr(settings, 'FACEBOOK_APP_ID', '')
    REDIRECT_URI = getattr(settings, 'FACEBOOK_OAUTH_REDIRECT_URI', '')
    STATE = getattr(settings, 'FACEBOOK_OAUTH_STATE', '')
    SCOPE = getattr(settings, 'FACEBOOK_OAUTH_SCOPE', '')
    OAUTH_BASE_URL = 'https://www.facebook.com/v6.0/dialog/oauth'

    @staticmethod
    def get_oauth_url():
        return "%s?client_id=%s&redirect_uri=%s&state=%s&scope=%s" % (
            FacebookService.OAUTH_BASE_URL, FacebookService.FACEBOOK_APP_ID,
            FacebookService.REDIRECT_URI, FacebookService.STATE,
            FacebookService.SCOPE)

