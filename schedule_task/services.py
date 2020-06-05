import requests
from voluntree.models import Post
from .utils import make_comment_webhook_response_format

class FacebookWebHookService:
    FB_GRAPH_API_BASE_URL = 'https://graph.facebook.com/v7.0'

    @staticmethod
    def fetch_post_comments(post):
        page = post.page
        url_pattern = "%s/%s_%s/comments"
        url = url_pattern % (
            FacebookWebHookService.FB_GRAPH_API_BASE_URL,
            page.facebook_page_id, post.facebook_post_id)
        params = {
            'fields':'can_reply_privately,from,message',
            'access_token': page.page_access_token
        }
        return requests.get(url, params).json()

    @staticmethod
    def get_new_comments():
        new_comments = []
        for post in Post.objects.filter(disabled=False):
            print("Fetching comment for", post.facebook_post_id)
            comments = FacebookWebHookService \
                .fetch_post_comments(post).get('data', [])
            print("Fetching comment response", comments)
            can_reply_comments = list(
                filter(lambda c: c['can_reply_privately'] is True, comments))
            new_comments = new_comments + can_reply_comments
        return [make_comment_webhook_response_format(c) for c in new_comments]
