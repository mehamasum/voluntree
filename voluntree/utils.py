def build_notification_message(notification):
    return {
        'text': notification.message
    }

def build_confirmation_message(post):
    msg = post.message_for_returning_volunteer
    return {
        'text': msg
    }

def build_comment_chip_message(post):
    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "Are you Interested in this event?",
                "buttons": [
                    {
                        "type": "postback",
                        "title": "Yes, Lets do this!",
                        "payload": ("YES_%s_%s" % (
                            post.page.facebook_page_id, post.facebook_post_id))
                    },
                    {
                        "type": "postback",
                        "title": "No, Not Interested",
                        "payload": ("NO_%s_%s" % (
                            post.page.facebook_page_id, post.facebook_post_id))
                    },
                ]
            }
        }
    }