def make_comment_webhook_response_format(comment):
    return {
        "field": "feed",
        "value": {
            "item": "comment",
            "comment_id": comment['id'],
            "verb": "add",
            "published": 1,
            "created_time": comment['message'],
            "message": comment['message'],
            "from": comment['from']
        }
    }
