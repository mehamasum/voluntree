from channels import layers
from asgiref.sync import async_to_sync

from .tasks import send_notification_on_interested_person, send_email


def update_interests_volunteer_list(sender, instance, created, **kwargs):
    if created and instance.interested:
        # TODO interest is not tied to posts anymore
        group_name = 'interested_%s' % str(instance.post.id)
        # group_name = 'todo'

        channel_layer = layers.get_channel_layer()

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'send_post_intereset_response',
                'data': {
                    'status': 'created',
                    'id': instance.id
                }
            }
        )


def send_notification_on_create(sender, instance, created, **kwargs):
    if created:
        send_notification_on_interested_person.apply_async((instance.id, ))


def send_verficiation_mail_on_create(sender, instance, created, **kwargs):
    if created:
        send_email.apply_async((instance.email, instance.pin))