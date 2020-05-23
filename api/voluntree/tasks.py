from config.celery import app
from .models import Post
from .services import FacebookService

@app.task
def nested():
    print("nested task")


@app.task
def add(x, y):
    nested.apply_async()
    return x+y


@app.task
def send_message_on_comment(data):
    comment_id = data.get('value', {}).get('comment_id')
    post_id = comment_id.split('_')[0]
    try:
        post = Post.objects.get(facebook_post_id=post_id)
    except Post.DoesNotExist:
        return
    page = post.page
    recipient = {'comment_id': comment_id}
    message = {'text': 'Welcome To %s' % page.name}
    wellcome_msg = FacebookService.send_private_message(
        page, recipient, message)
    return wellcome_msg.json()
