from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path('ws/posts/<uuid:post_id>/interests',
         consumers.PostInterestConsumer),
    path('ws/slots/<int:slot_id>/interests',
         consumers.SlotInterestConsumer),
]
