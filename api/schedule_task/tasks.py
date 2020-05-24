import requests
import logging
from config.celery import app
from .services import FacebookWebHookService


@app.task(name="schedule_task.webhook.fetch_comment")
def fetch_comment():
    logging.debug(f"Running comment fetch task")
    url = 'http://localhost:8000/api/voluntree/facebook/webhook:page/'
    new_comments = FacebookWebHookService.get_new_comments()
    for comment in new_comments:
        print("comment", comment)
    return new_comments
