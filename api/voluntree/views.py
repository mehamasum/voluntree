from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .services import FacebookService


class VoluntreeApiListView(APIView):
    permission_classes = (AllowAny, )

    def get(self, request):
        return Response("Gis api root")


class FacebookApiViewSet(ViewSet):
    permission_classes = (AllowAny, )

    @action(detail=False)
    def oauth_url(self, request):
        url = FacebookService.get_oauth_url()
        return Response(url)
