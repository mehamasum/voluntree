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
from django.urls import path
from django.conf.urls import include
from rest_framework.routers import SimpleRouter
from rest_framework.schemas import get_schema_view
from rest_framework.documentation import include_docs_urls
from voluntree.views import VoluntreeApiListView
from .router import DefaultRouterWithAPIViews
from rest_framework.authtoken.views import obtain_auth_token

router = SimpleRouter()

schema_view = get_schema_view(title=settings.API_BROWSER_HEADER, public=True)
doc_urls = include_docs_urls(title=settings.API_BROWSER_HEADER)
api_browser_urls = include('rest_framework.urls')
voluntree_api_urls = include(('voluntree.urls', 'voluntree'), 'voluntree')

urlpatterns = [
    path('api/', doc_urls),
    path('api/auth/token/', obtain_auth_token, name='api_token_auth'),
    path('api/schema/', schema_view),
    path('api/browser/', api_browser_urls),
    path('api/admin/', admin.site.urls),
    path('api/voluntree/', voluntree_api_urls),
]

urlpatterns += router.urls

root_router = DefaultRouterWithAPIViews()
root_router.register('api/voluntree', VoluntreeApiListView, 'test')
urlpatterns += root_router.urls
