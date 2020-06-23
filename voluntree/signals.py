from channels import layers
from asgiref.sync import async_to_sync

from .tasks import send_notification_on_interested_person, send_email
from voluntree.models import Rating


def create_rating_from_interest(interest):
    if interest.post:
        rating, created = Rating.objects.get_or_create(
            signup=interest.post.signup,
            volunteer=interest.volunteer
        )


def update_interests_volunteer_list(sender, instance, created, **kwargs):
    if created and instance.interested:
        # TODO interest is not tied to posts anymore
        channel_layer = layers.get_channel_layer()

        if instance.post:
            create_rating_from_interest(instance)
            group_name = 'interested_%s' % str(instance.post.id)
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

        slot_group_name = 'slot_%s_%s' % (str(instance.slot.id), str(instance.datetime.id))
        async_to_sync(channel_layer.group_send)(
            slot_group_name,
            {
                'type': 'send_post_intereset_response',
                'data': {
                    'status': 'created',
                    'id': str(instance.volunteer.id)
                }
            }
        )


def send_notification_on_create(sender, instance, created, **kwargs):
    if created:
        send_notification_on_interested_person.apply_async((instance.id, ))


def send_verficiation_mail_on_create(sender, instance, created, **kwargs):
    if created:
        send_email.apply_async((instance.email, instance.pin))