import logging
from config.celery import app
from .models import Post, Volunteer
from .services import FacebookService
from .utils import build_comment_chip_message, build_confirmation_message


@app.task(name="voluntree.add")
def add():
    logging.debug(f"Run Task Add")
    return "hello"


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
def send_message_on_yes_confirmation(volunteer_id, created, post_id):
    volunteer = Volunteer.objects.get(id=volunteer_id)
    post = Post.objects.get(id=post_id)
    page = post.page
    recipient = {'id': volunteer.facebook_user_id}
    message = build_confirmation_message(post, created)
    wellcome_msg = FacebookService.send_private_message(
        page, recipient, message)
    return wellcome_msg.json()
