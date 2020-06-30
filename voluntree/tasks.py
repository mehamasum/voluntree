import json
import logging
from config.celery import app
from .models import Post, Volunteer, Notification, Page, Interest
from .services import FacebookService
from .utils import build_notification_message
import redis
import json
from urllib.parse import urlparse
from .preprocess import sentence_to_embeding
from mail_templated import send_mail

from .drm import DocumentRetrievalModel as DRM
from .question import ProcessedQuestion as PQ

import environ
env = environ.Env()


@app.task
def preprocess_comment_for_ml(hook_payload):
    print('preprocess_comment_for_ml', hook_payload)
    url = urlparse(env.str('REDIS_URL', default='redis://127.0.0.1:6379'))
    conn = redis.Redis(host=url.hostname, port=url.port, decode_responses=True)
    if not conn.ping():
        raise Exception('Redis unavailable')

    logging.debug('redis', conn)
    sentence = hook_payload['value']['message']
    embeding = sentence_to_embeding(sentence)

    logging.debug('preprocess_comment_for_ml', sentence, embeding)
    res = {
        'payload': hook_payload,
        'embeding': embeding
    }
    conn.xadd('comments:fb', { 'comment': json.dumps(res) })
    return res


@app.task
def send_private_reply_on_comment(comment_id, page_id, message):
    recipient = {'comment_id': comment_id}
    page = Page.objects.get(facebook_page_id=page_id)
    res = FacebookService.send_private_message(
        page, recipient, json.loads(message))
    return res.json()

@app.task
def reply(psid, page_id, message):
    recipient = {'id': psid}
    page = Page.objects.get(facebook_page_id=page_id)
    res = FacebookService.send_private_message(
        page, recipient, json.loads(message))
    return res.json()

@app.task
def comment(page_id, post_id, comment_id, message):
    page = Page.objects.get(facebook_page_id=page_id)
    res = FacebookService.send_public_reply(
        page, post_id, comment_id, message)
    return res.json()

@app.task
def ask_for_pin(volunteer_id):
    volunteer = Volunteer.objects.get(id=volunteer_id)
    page = Page.objects.get(facebook_page_id=volunteer.facebook_page_id)
    recipient = {'id': volunteer.facebook_user_id}
    message = {
        'text': 'Send us the PIN we sent to your email'
    }
    res = FacebookService.send_private_message(
        page, recipient, message)
    return res.json()

@app.task
def send_notification_on_interested_person(notification_id):
    notification = Notification.objects.get(id=notification_id)
    signup = notification.signup
    volunteer_list = Interest.objects.all().filter(slot__date_times__signup=signup).values_list('volunteer_id', flat=True).distinct()
    volunteers = Volunteer.objects.filter(id__in=volunteer_list)
    for volunteer in volunteers:
        page = Page.objects.get(facebook_page_id=volunteer.facebook_page_id)
        recipient = {'id': volunteer.facebook_user_id}
        message = build_notification_message(notification)
        FacebookService.send_tag_message(
            page, recipient, message, FacebookService.CONFIRMED_EVENT_UPDATE)

@app.task
def send_email(to_email, send_pin):
    send_mail('email/confirmation.tpl', {'code': send_pin}, "welcome@voluntree.com", [to_email])


@app.task
def find_answer(q, data):
    paragraphs = data.split('\n')

    drm = DRM(paragraphs, True, True)

    # Process Question
    pq = PQ(q, True, False, True)

    # Get Response From Bot
    res = drm.query(pq)
    print('find answer', res)

    return res
