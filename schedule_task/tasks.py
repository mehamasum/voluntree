import json
import logging
from urllib.parse import urlparse

import environ
import redis
import requests

from django.conf import settings
from config.celery import app
from config.logshim import LogShim
from .services import FacebookWebHookService

logger = LogShim(logging.getLogger(__file__))
env = environ.Env()

@app.task(name="schedule_task.webhook.fetch_comment")
def fetch_comment():
    server = env.str('APP_URL', default='http://localhost:8000')
    conn = redis.from_url(settings.REDIS_LOCATION)
    if not conn.ping():
        # raise Exception('Redis unavailable')
        return
    logger.debug('Connected to redis')

    url = server + '/facebook/webhook/'
    headers = {'content-type': "application/json"}
    new_comments = FacebookWebHookService.get_new_comments()
    logger.info("new_comments", new_comments)
    for comment in new_comments:
        comment_id = comment['value']['comment_id']
        cache_key = 'fetched_' + comment_id
        fetched = conn.get(cache_key) or None

        if fetched:
            logger.debug('skipping already sent callback', comment)
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


@app.task(name="schedule_task.internal.ingest_interests")
def ingest_interests():
    logging.debug(f"Ingesting interests from interest stream")

    url = urlparse(env.str('REDIS_URL', default='redis://127.0.0.1:6379'))
    conn = redis.Redis(host=url.hostname, port=url.port, decode_responses=True)
    if not conn.ping():
        # raise Exception('Redis unavailable')
        return

    counts = 10
    blocks = 30 * 1000  # wait for 30 sec for data to be available

    last_read = conn.get("last-read-comment") or b"0-0"
    res = conn.xread({'interests:fb': last_read}, counts, blocks)

    if len(res) == 0:
        return res

    # [['logs2', [('1590697214180-0', {'foo': 'bar'}), ('1590697598107-0', {'me': 'meha'})]]]
    interests = res[0][1]

    for interest in interests:
        key = interest[0]

        res = conn.set("last-read-comment", key)

        data = interest[1]['comment']
        logger.debug('new interest', data)
        data = json.loads(data)
        app.send_task('voluntree.tasks.send_message_on_comment', (data,))

    return res