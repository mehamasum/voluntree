from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet, ReadOnlyModelViewSet, ModelViewSet
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .services import (FacebookService, PostService, VolunteerService,
                       InterestService)

from .serializers import (PageSerializer, PostSerializer, InterestGeterializer,
                          VolunteerSerializer, NotificationSerializer)
from .models import Post, Interest, Volunteer, Notification
from .ml.pipeline import pipleline
from .paginations import CreationTimeBasedPagination
from .tasks import send_message_on_yes_confirmation


class VoluntreeApiListView(APIView):
    permission_classes = (AllowAny, )

    def get(self, request):
        return Response("Gis api root")


class VolunteerViewSet(ReadOnlyModelViewSet):
    permission_classes = (IsAuthenticated, )
    serializer_class = VolunteerSerializer

    def get_queryset(self):
        # TODO Need to change model design in future
        volunteer_ids = self.request.user.pages.values_list(
            'posts__interests__volunteer__id', flat=True).distinct()
        return Volunteer.objects.filter(id__in=volunteer_ids)


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

    @action(detail=True)
    def notifications(self, request, pk):
        queryset = self.get_object().notifications.all()
        serializer = NotificationSerializer(queryset, many=True)
        return Response(serializer.data)

    
    @action(detail=True)
    def interests(self,request, pk):
        paginator = CreationTimeBasedPagination()
        queryset = Interest.objects.filter(post=pk, interested=True)
        queryset = paginator.paginate_queryset(queryset, self.request, view=self)
        serializer = InterestGeterializer(queryset, many=True)
        paginated_response = paginator.get_paginated_response(serializer.data)
        return paginated_response


class NotificationViewSet(ModelViewSet):
    queryset = Notification.objects.all()
    permission_classes = (IsAuthenticated, )
    serializer_class = NotificationSerializer


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
        
        volunteer, created = VolunteerService \
            .get_or_create_volunteer_from_postback_data(request.data)
        post = PostService.get_post_from_postback_data(request.data)
        postback_status = InterestService \
            .get_interested_status_from_postback_data(request.data)
        success = InterestService \
            .create_or_update_intereset_from_postback_data(
                volunteer, post, postback_status)

        if success and postback_status == 'YES':
            send_message_on_yes_confirmation.apply_async((
                volunteer.id, created, post.id))
        if success:
            return Response(status.HTTP_200_OK)
        return Response('BAD REQUEST', status.HTTP_400_BAD_REQUEST)
