import json
import requests
import logging
from config.celery import app
from .services import FacebookWebHookService


@app.task(name="schedule_task.webhook.fetch_comment")
def fetch_comment():
    logging.debug(f"Running comment fetch task")
    url = 'http://localhost:8000/api/voluntree/facebook/webhook:page/'
    headers = {'content-type': "application/json"}
    new_comments = FacebookWebHookService.get_new_comments()
    print("new_comments", new_comments)
    for comment in new_comments:
        requests.post(url, headers=headers, data=json.dumps(comment))
    return new_comments
