from .views import (FacebookApiViewSet, PageViewSet, PostViewSet,
                    NotificationViewSet, InterestViewSet, OrganizationViewSet,
                    SignUpViewSet, SlotViewSet, DateTimeViewSet,
                    NationBuilderApiViewSet, IntegrationViewSet, VolunteerViewSet, UploadViewSet)
def register_urls(router):
    router.register('pages', PageViewSet, 'page')
    router.register('posts', PostViewSet, 'post')
    router.register('interests', InterestViewSet, 'interest')
    router.register('notifications', NotificationViewSet, 'notification')
    router.register('facebook', FacebookApiViewSet, 'facebook')
    router.register('nationbuilder', NationBuilderApiViewSet, 'nationbuilder')
    router.register('organizations', OrganizationViewSet, 'organization')
    router.register('signups', SignUpViewSet, 'signup')
    router.register('datetimes', DateTimeViewSet, 'datetime')
    router.register('slots', SlotViewSet, 'slot')
    router.register('integrations', IntegrationViewSet, 'integration')
    router.register('volunteers', VolunteerViewSet, 'volunteer')
    router.register('uploads', UploadViewSet, 'upload')
