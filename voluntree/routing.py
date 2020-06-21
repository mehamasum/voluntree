from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path('ws/posts/<uuid:post_id>/interests',
         consumers.PostInterestConsumer),
    path('ws/slots/<str:room_id>/interests',
         consumers.SlotInterestConsumer),
]
