import logging
from config.celery import app
from .models import Post, Volunteer, Notification, Page
from .services import FacebookService
from .utils import (build_comment_chip_message,
                    build_notification_message)
from mail_templated import send_mail
import environ
env = environ.Env()
    
@app.task
def send_private_reply_on_comment(data):
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
def reply(psid, page_id, message):
    recipient = {'id': psid}
    page = Page.objects.get(facebook_page_id=page_id)
    res = FacebookService.send_private_message(
        page, recipient, message)
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
    page = notification.post.page
    interests = notification.post.interests.filter(interested=True)
    for interest in interests:
        volunteer = interest.volunteer
        recipient = {'id': volunteer.facebook_user_id}
        message = build_notification_message(notification)
        FacebookService.send_private_message(page, recipient, message)

@app.task
def send_email(to_email, send_pin):
    send_mail('email/confirmation.tpl', {'code': send_pin}, "welcome@voluntree.com", [to_email])