def build_comment_chip_message():
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
                        "payload": "YES"
                    },
                    {
                        "type": "postback",
                        "title": "No I'm Not Interested",
                        "payload": "NO"
                    },
                ]
            }
        }
    }
