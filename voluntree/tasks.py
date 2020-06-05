import logging
from config.celery import app
from .models import Post, Volunteer, Notification, Page
from .services import FacebookService
from .utils import (build_comment_chip_message, build_confirmation_message,
                    build_notification_message)
import redis
import json
from urllib.parse import urlparse
from .preprocess import sentence_to_embeding


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
def send_message_on_comment(data):
    comment_id = data.get('value', {}).get('comment_id')
    post_id = comment_id.split('_')[0]
    try:
        post = Post.objects.get(facebook_post_id=post_id)
    except Post.DoesNotExist:
        msg = (
            "No post found in Voluntree System Associated with this comment %s"
            % comment_id
        )
        logging.warning(msg)
        return
    page = post.page
    recipient = {'comment_id': comment_id}
    message = build_comment_chip_message(post)
    wellcome_msg = FacebookService.send_private_message(
        page, recipient, message)
    return wellcome_msg.json()

@app.task
def send_message_on_yes_confirmation(volunteer_id, post_id):
    volunteer = Volunteer.objects.get(id=volunteer_id)
    post = Post.objects.get(id=post_id)
    page = post.page
    recipient = {'id': volunteer.facebook_user_id}
    message = build_confirmation_message(post)
    wellcome_msg = FacebookService.send_private_message(
        page, recipient, message)
    return wellcome_msg.json()

@app.task
def ask_for_email(volunteer_id):
    volunteer = Volunteer.objects.get(id=volunteer_id)
    page = Page.objects.get(facebook_page_id=volunteer.facebook_page_id)
    recipient = {'id': volunteer.facebook_user_id}
    message = {
        'text': 'Send us your email'
    }
    res = FacebookService.send_private_message(
        page, recipient, message)
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
    page = notification.post.page
    interests = notification.post.interests.filter(interested=True)
    for interest in interests:
        volunteer = interest.volunteer
        recipient = {'id': volunteer.facebook_user_id}
        message = build_notification_message(notification)
        FacebookService.send_private_message(page, recipient, message)

