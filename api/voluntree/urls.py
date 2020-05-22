from rest_framework.routers import DefaultRouter
from .views import FacebookApiViewSet, PageViewSet, PostViewSet

router = DefaultRouter()

router.register('pages', PageViewSet, 'page')
router.register('posts', PostViewSet, 'post')
router.register('facebook', FacebookApiViewSet, 'facebook')

urlpatterns = router.urls
