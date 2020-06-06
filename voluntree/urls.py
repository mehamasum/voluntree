from .views import (FacebookApiViewSet, PageViewSet, PostViewSet,
                    VolunteerViewSet, NotificationViewSet, InterestViewSet, OrganizationViewSet,
                    SignUpViewSet, SlotViewSet, DateTimeViewSet,
                    )
def register_urls(router):
    router.register('pages', PageViewSet, 'page')
    router.register('posts', PostViewSet, 'post')
    router.register('interests', InterestViewSet, 'interest')
    router.register('volunteers', VolunteerViewSet, 'voluteer')
    router.register('notifications', NotificationViewSet, 'notification')
    router.register('facebook', FacebookApiViewSet, 'facebook')
    router.register('organizations', OrganizationViewSet, 'organization')
    router.register('signups', SignUpViewSet, 'signup')
    router.register('datetimes', DateTimeViewSet, 'datetime')
    router.register('slots', SlotViewSet, 'slot')
