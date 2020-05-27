import json
import logging

import channels.layers
from asgiref.sync import async_to_sync

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Interest


def update_interests_volunteer_list(sender, instance, created, **kwargs):
    if created and instance.interested:
        group_name = 'interested_%s' % str(instance.post.id)
        channel_layer = channels.layers.get_channel_layer()

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'generate_response',
                'data': {
                    'status': 201,
                    'response': {
                        'post': str(instance.post.id),
                        'volunteer': {
                            'id': str(instance.volunteer.id),
                            'facebook_user_id': instance.volunteer.facebook_user_id,
                            'facebook_page_id': instance.volunteer.facebook_page_id,
                            'first_name': instance.volunteer.first_name,
                            'last_name': instance.volunteer.last_name,
                            'profile_pic': instance.volunteer.profile_pic
                        },
                        'interested': instance.interested,
                        'created_at': str(instance.created_at)
                    }
                }
            }
        )
