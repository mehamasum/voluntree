from channels import layers
from asgiref.sync import async_to_sync

from .tasks import send_notification_on_interested_person


def update_interests_volunteer_list(sender, instance, created, **kwargs):
    if created and instance.interested:
        group_name = 'interested_%s' % str(instance.post.id)
        channel_layer = layers.get_channel_layer()

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'send.post.intereset.response',
                'data': {
                    'status': 'created',
                    'id': instance.id
                }
            }
        )


def send_notification_on_create(sender, instance, created, **kwargs):
    if created:
        send_notification_on_interested_person.apply_async((instance.id, ))
