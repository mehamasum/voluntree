from rest_framework.routers import DefaultRouter
from .views import (FacebookApiViewSet, PageViewSet, PostViewSet,
                    VolunteerViewSet, NotificationViewSet)

router = DefaultRouter()

router.register('pages', PageViewSet, 'page')
router.register('posts', PostViewSet, 'post')
router.register('volunteers', VolunteerViewSet, 'voluteer')
router.register('notifications', NotificationViewSet, 'notification')
router.register('facebook', FacebookApiViewSet, 'facebook')

urlpatterns = router.urls
