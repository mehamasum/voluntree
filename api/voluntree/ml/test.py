from pipeline import pipleline

if __name__ == '__main__':

    hook_payloads= [
        {
            "field": "feed",
            "value": {
                "item": "comment",
                "comment_id": "44444444_4444444441",
                "verb": "add",
                "published": 1,
                "created_time": 1590054191,
                "message": "Nice! I'm interested. See you then!",
                "from": {
                "name": "User",
                "id": "1067280970047460"
                }
            }
        },
        {
            "field": "feed",
            "value": {
                "item": "comment",
                "comment_id": "44444444_4444444442",
                "verb": "add",
                "published": 1,
                "created_time": 1590054191,
                "message": "I can't come but still want to help. Do you accept donations on credit card?",
                "from": {
                "name": "User",
                "id": "1067280970047460"
                }
            }
        }
    ]


    for payload in hook_payloads:
        pipleline(payload) 