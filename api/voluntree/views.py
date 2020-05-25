from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet, ReadOnlyModelViewSet, ModelViewSet
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .services import (FacebookService, PostService, VolunteerService,
                       InterestService)
from .serializers import PageSerializer, PostSerializer
from .models import Post
from .ml.pipeline import pipleline


class VoluntreeApiListView(APIView):
    permission_classes = (AllowAny, )

    def get(self, request):
        return Response("Gis api root")


class PageViewSet(ReadOnlyModelViewSet):
    permission_classes = (IsAuthenticated, )
    serializer_class = PageSerializer

    def get_queryset(self):
        return self.request.user.pages.all()


class PostViewSet(ModelViewSet):
    permission_classes = (IsAuthenticated, )
    serializer_class = PostSerializer

    def get_queryset(self):
        return self.request.user.posts.all()

    def create(self, request):
        serializer = self.serializer_class(
            data=request.data, context={'request': request})
        if serializer.is_valid():
            page = request.user.pages.get(id=request.data.get('page'))
            fb_post = PostService.create_post_on_facebook_page(
                page, request.data.get('status'))
            if fb_post.status_code != 200:
                return Response(
                    fb_post.json(), status=status.HTTP_400_BAD_REQUEST)
            post = serializer.save()
            post.facebook_post_id = fb_post.json().get('id', 'x_y').split('_')[1]
            post.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FacebookApiViewSet(ViewSet):
    permission_classes = (IsAuthenticated, )

    @action(detail=False, methods=['post'])
    def verify_oauth(self, request):
        code = request.data.get('code')
        if FacebookService.save_pages_access_token(code, request.user):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False)
    def oauth_url(self, request):
        url = FacebookService.get_oauth_url()
        return Response(url)

    @action(detail=False, methods=['get', 'post'], url_path='webhook:page',
            permission_classes=[AllowAny])
    def page_webhook(self, request):
        if request.method == 'GET':
            mode = request.query_params.get('hub.mode')
            token = request.query_params.get('hub.verify_token')
            challenge = request.query_params.get('hub.challenge')
            if mode == 'subscribe' and token == 'xyz':
                return Response(int(challenge))
            return Response('BAD REQUEST', status.HTTP_400_BAD_REQUEST)
        
        pipleline(request.data)
        return Response(status.HTTP_200_OK)

    @action(detail=False, methods=['get', 'post'],
            url_path='webhook:messenger', permission_classes=[AllowAny])

    def messenger_webhook(self, request):
        if request.method == 'GET':
            mode = request.query_params.get('hub.mode')
            token = request.query_params.get('hub.verify_token')
            challenge = request.query_params.get('hub.challenge')
            if mode == 'subscribe' and token == 'xyz':
                return Response(int(challenge))
            return Response('BAD REQUEST', status.HTTP_400_BAD_REQUEST)
        
        print(request.data)
        volunteer = VolunteerService \
            .get_or_create_volunteer_from_postback_data(request.data)
        InterestService.create_or_update_intereset_from_postback_data(
            volunteer, request.data)
        print("Volunteer", volunteer)
        return Response(status.HTTP_200_OK)
