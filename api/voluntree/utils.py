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
                        "title": "YES I'm Interested",
                        "payload": ("YES_%s_%s" % (
                            post.page.facebook_page_id, post.facebook_post_id))
                    },
                    {
                        "type": "postback",
                        "title": "No I'm Not Interested",
                        "payload": ("NO_%s_%s" % (
                            post.page.facebook_page_id, post.facebook_post_id))
                    },
                ]
            }
        }
    }
