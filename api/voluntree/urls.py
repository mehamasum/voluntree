from rest_framework.routers import DefaultRouter
from .views import (FacebookApiViewSet, PageViewSet, PostViewSet,
                    VolunteerViewSet, NotificationViewSet, InterestViewSet, OrganizationViewSet)

router = DefaultRouter()

router.register('pages', PageViewSet, 'page')
router.register('posts', PostViewSet, 'post')
router.register('interests', InterestViewSet, 'interest')
router.register('volunteers', VolunteerViewSet, 'voluteer')
router.register('notifications', NotificationViewSet, 'notification')
router.register('facebook', FacebookApiViewSet, 'facebook')
router.register('organizations', OrganizationViewSet, 'organization')

urlpatterns = router.urls
