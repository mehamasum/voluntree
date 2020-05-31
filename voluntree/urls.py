from .views import (FacebookApiViewSet, PageViewSet, PostViewSet,
                    VolunteerViewSet, NotificationViewSet, InterestViewSet)
def register_urls(router):
    router.register('pages', PageViewSet, 'page')
    router.register('posts', PostViewSet, 'post')
    router.register('interests', InterestViewSet, 'interest')
    router.register('volunteers', VolunteerViewSet, 'voluteer')
    router.register('notifications', NotificationViewSet, 'notification')
    router.register('facebook', FacebookApiViewSet, 'facebook')
