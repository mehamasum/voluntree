import requests


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
        return requests.get(url, params)

    @staticmethod
    def get_new_comments():
        return {}
