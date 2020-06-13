import json
import logging
from urllib.parse import urlparse

import environ
import redis
import requests

from config.celery import app
from .services import FacebookWebHookService

env = environ.Env()

@app.task(name="schedule_task.webhook.fetch_comment")
def fetch_comment():
    print(f"Running comment fetch task")
    server = env.str('APP_URL', default='http://localhost:8000')
    url = server + '/facebook/webhook/'
    headers = {'content-type': "application/json"}
    new_comments = FacebookWebHookService.get_new_comments()
    print("new_comments", new_comments)
    for comment in new_comments:
        comment_id = comment['value']['comment_id']
        cache_key = 'fetched_' + comment_id
        redis_url = urlparse(env.str('REDIS_URL', default='redis://127.0.0.1:6379/0'))
        conn = redis.Redis(
            host=redis_url.hostname,
            port=redis_url.port,
            decode_responses=True
        )
        if not conn.ping():
            # raise Exception('Redis unavailable')
            return

        fetched = conn.get(cache_key) or None

        if fetched:
            print('skipping already sent callback', comment)
            continue

        payload = {
            "object": "page",
            "entry": [
                {
                    "id": "0",
                    "time": 1591303387,
                    "changes": [comment]
                }
            ]
        }
        res = requests.post(url, headers=headers, data=json.dumps(payload))
        if res.status_code == 200:
            conn.set(cache_key, 1)
    return new_comments