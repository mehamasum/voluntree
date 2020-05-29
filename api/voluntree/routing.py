from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path('ws/voluntree/posts/<uuid:post_id>/interests',
         consumers.PostInterestConsumer),
]
