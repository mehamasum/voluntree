from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path('ws/voluntree/posts/<slug:post_id>/interests',
         consumers.PostInterestConsumer),
]
