from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/volunteers/(?P<post_id>[0-9a-f-]+)/$', consumers.VolunteerInterestConsumer),
]