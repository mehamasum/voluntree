from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .services import FacebookService


class VoluntreeApiListView(APIView):
    permission_classes = (AllowAny, )

    def get(self, request):
        return Response("Gis api root")


class FacebookApiViewSet(ViewSet):
    permission_classes = (IsAuthenticated, )

    @action(detail=False, methods=['post'])
    def verify_oauth(self, request):
        code = request.data.get('code')
        if FacebookService.save_pages_access_token(code):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False)
    def oauth_url(self, request):
        url = FacebookService.get_oauth_url()
        return Response(url)

    @action(detail=False, methods=['get', 'post'])
    def webhook(self, request):
        if request.method == 'GET':
            mode = request.query_params.get('hub.mode')
            token = request.query_params.get('hub.verify_token')
            challenge = request.query_params.get('hub.challenge')
            print("mode", mode, "token", token, "challenge", challenge)
            if mode == 'subscribe' and token == 'xyz':
                return Response(int(challenge))
            return Response('BAD REQUEST', status.HTTP_400_BAD_REQUEST)
