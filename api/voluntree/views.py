from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet
from rest_framework import status
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

    @action(detail=False, methods=['post'])
    def verify_oauth(self, request):
        code = request.POST.get('code')
        if FacebookService.save_pages_access_token(code):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False)
    def oauth_url(self, request):
        url = FacebookService.get_oauth_url()
        return Response(url)
