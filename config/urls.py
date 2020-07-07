"""config URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf import settings
from django.urls import path, re_path
from django.conf.urls import include
from rest_framework.schemas import get_schema_view
from rest_framework.documentation import include_docs_urls
from .views import react
from .router import DefaultRouterWithAPIViews as DefaultRouter

from voluntree.urls import register_urls as register_voluntree_urls
from voluntree.views import (WebhookCallbackView, SetupWebhookCallbackView, volunteer_signup_view,
                             signup_confirmation_view, volunteer_signup_preview, share_activity, share_certificate)

schema_urls = get_schema_view(title=settings.API_BROWSER_HEADER, public=True)
doc_urls = include_docs_urls(title=settings.API_BROWSER_HEADER)
drf_urls = include('rest_framework.urls')

urlpatterns = [
    path('api/docs/', doc_urls),
    path('api/schema/', schema_urls),
    path('api/drf/', drf_urls),
    path('api/admin/', admin.site.urls),
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.authtoken')),
    path('facebook/webhook/', WebhookCallbackView.as_view()),
    path('facebook/setup/', SetupWebhookCallbackView.as_view()),
    path('messenger/<page_id>/signup/<int:signup_id>/', volunteer_signup_view),
    path('messenger/signup-preview/<int:signup_id>/', volunteer_signup_preview),
    path('messenger/signup/done/', signup_confirmation_view),
    path('share/register/<int:signup_id>/<volunteer_id>/', share_activity),
    path('share/volunteer/<int:signup_id>/<volunteer_id>/', share_certificate),
]

router = DefaultRouter()
register_voluntree_urls(router)
urlpatterns += [ path('api/', include(router.urls)),]

urlpatterns += [
    # match the root
    re_path(r'^$', react),
    # match all other pages
    re_path(r'^(?:.*)/?$', react),
]
