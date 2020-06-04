import json
from datetime import datetime, timedelta

import requests
from django.conf import settings

from .models import Page, Volunteer, Post, Interest


class VolunteerService:
    @staticmethod
    def get_or_create_volunteer_from_postback_data(data):
        facebook_user_id = data.get('entry', [{}])[0] \
            .get('messaging', [{}])[0].get('sender', {}).get('id')
        facebook_page_id = data.get('entry', [{}])[0] \
            .get('messaging', [{}])[0].get('recipient', {}).get('id')
        volunteer, created = Volunteer.objects.get_or_create(
            facebook_user_id=facebook_user_id,
            facebook_page_id=facebook_page_id
        )
        if created:
            post = PostService.get_post_from_postback_data(data)
            meta_data = FacebookService.get_user_metadata(
                post.page, facebook_user_id)
            volunteer.first_name = meta_data['first_name']
            volunteer.last_name = meta_data['last_name']
            volunteer.profile_pic = meta_data['profile_pic']
            volunteer.save()

        return [volunteer, created]


class InterestService:
    @staticmethod
    def get_interested_status_from_postback_data(data):
        payload = data.get('entry', [{}])[0] \
            .get('messaging', [{}])[0].get('postback', {}) \
            .get('payload', 'NO_x_y').split("_")

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


class PostService:
    @staticmethod
    def get_post_from_postback_data(data):
        payload = data.get('entry', [{}])[0] \
            .get('messaging', [{}])[0].get('postback', {}) \
            .get('payload', 'NO_x_y').split("_")
        post_id = payload[2]

        try:
            post = Post.objects.get(facebook_post_id=post_id)
        except Post.DoesNotExist:
            post = None
        return post

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
    FACEBOOK_GRAPH_BASE_URL = 'https://graph.facebook.com/'
    FACEBOOK_GRAPH_API_VERSION = getattr(settings, 'FACEBOOK_GRAPH_API_VERSION')
    FACEBOOK_GRAPH_API_URL = FACEBOOK_GRAPH_BASE_URL + FACEBOOK_GRAPH_API_VERSION

    FACEBOOK_APP_ID = getattr(settings, 'FACEBOOK_APP_ID', '')
    FACEBOOK_APP_SECRET = getattr(settings, 'FACEBOOK_APP_SECRET', '')
    REDIRECT_URI = getattr(settings, 'FACEBOOK_OAUTH_REDIRECT_URI', '')
    STATE = getattr(settings, 'FACEBOOK_OAUTH_STATE', '')
    SCOPE = getattr(settings, 'FACEBOOK_OAUTH_SCOPE', '')

    # TODO: remove hard coded version
    OAUTH_BASE_URL = 'https://www.facebook.com/v7.0/dialog/oauth'
    ACCESS_TOKEN_BASE_URL = 'https://graph.facebook.com/v7.0/oauth/access_token'
    DEBUG_TOKEN_BASE_URL = 'https://graph.facebook.com/debug_token'

    WEBHOOK_SUBSCRIPTION_FIELDS = 'messages,messaging_postbacks,feed'
    WEBHOOK_URL = getattr(settings, 'APP_PUBLIC_URL', '') + '/facebook/webhook/'
    WEBHOOK_VERIFY_TOKEN = getattr(settings, 'FACEBOOK_WEBHOOK_VERIFY_TOKEN')

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
        # TODO: use graph api version
        url = 'https://graph.facebook.com/%s/accounts' % user_id
        pages_token = requests.get(url, params).json()
        return pages_token

    @staticmethod
    def verify_oauth(code, user):
        access_token = FacebookService.get_access_token(code)
        user_id = FacebookService.get_user_id(access_token)
        pages_token = FacebookService.get_pages_access_token(
            user_id, access_token).get('data', [])
        if not access_token or not user_id or not pages_token:
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
            print(res)

            # save page in model
            name = page.get('name', '')
            page_expiry_token_date = datetime.now() + timedelta(days=59)
            Page.objects.update_or_create(
                facebook_page_id=facebook_page_id,
                defaults={'organization': organization, 'name': name,
                          'user': user, 'page_access_token': page_access_token,
                          'page_expiry_token_date': page_expiry_token_date})
        return True

    # SEND message on comment
    # send_private_message(page, {"comment_id": "commentId"}, {"text": "msg"})
    # SEND message on conversation
    # send_private_message(page, {"id": "psid"}, {"text": "msg"})

    def send_private_message(page, recipient, message):
        headers = {'content-type': "application/json"}
        # TODO: use graph api version
        url = 'https://graph.facebook.com/%s/messages' % page.facebook_page_id
        params = json.dumps({
            "access_token": page.page_access_token,
            "recipient": recipient,
            "message": message
        })

        return requests.post(url, headers=headers, data=params)

    def get_user_metadata(page, recipient_id):
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


class OrganizationService:
    def number_of_posts(organization_id, from_date, to_date):
        post_count = Post.objects.filter(
            user__organization=organization_id,
            created_at__date__range=(from_date, to_date),
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
