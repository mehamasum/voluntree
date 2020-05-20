from rest_framework.routers import DefaultRouter
from .views import FacebookApiViewSet

router = DefaultRouter()

router.register('facebook', FacebookApiViewSet, 'facebook')

urlpatterns = router.urls
