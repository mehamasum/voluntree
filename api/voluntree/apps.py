from django.apps import AppConfig
from django.db.models.signals import post_save

class VoluntreeConfig(AppConfig):
    name = 'voluntree'
    def ready(self):
        from .models import Interest, Notification
        from .signals import (update_interests_volunteer_list,
                              send_notification_on_create)
        post_save.connect(
            update_interests_volunteer_list,
            sender=Interest,
            dispatch_uid="update_interests_volunteer_list"
        )

        post_save.connect(
            send_notification_on_create,
            sender=Notification,
            dispatch_uid="send_notification_on_create"
        )
