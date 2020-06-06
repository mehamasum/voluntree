from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet, ReadOnlyModelViewSet, ModelViewSet
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from .services import (FacebookService, PostService, VolunteerService,
                       InterestService, OrganizationService)

from .serializers import (PageSerializer, PostSerializer, InterestGeterializer,
                          VolunteerSerializer, NotificationSerializer, OrganizationSerializer,
                          SlotSerializer, SignUpSerializer, DateTimeSetializer)
from .models import (Post, Interest, Volunteer, Notification, Organization, Slot, DateTime, SignUp)
from .paginations import CreationTimeBasedPagination
from .tasks import send_message_on_yes_confirmation, preprocess_comment_for_ml, ask_for_email, ask_for_pin
from .decorators import date_range_params_check
from datetime import datetime, timedelta
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
import re
from django.core.cache import cache
import json

class VolunteerViewSet(ReadOnlyModelViewSet):
    permission_classes = (IsAuthenticated, )
    serializer_class = VolunteerSerializer

    def get_queryset(self):
        # TODO Need to change model design in future
        volunteer_ids = self.request.user.organization.pages.values_list(
            'posts__interests__volunteer__id', flat=True).distinct()
        return Volunteer.objects.filter(id__in=volunteer_ids)


class PageViewSet(ReadOnlyModelViewSet):
    permission_classes = (IsAuthenticated, )
    serializer_class = PageSerializer

    def get_queryset(self):
        return self.request.user.organization.pages.all()


class PostViewSet(ModelViewSet):
    permission_classes = (IsAuthenticated, )
    serializer_class = PostSerializer

    def get_queryset(self):
        return self.request.user.posts.all().order_by('-created_at')

    def create(self, request):
        serializer = self.serializer_class(
            data=request.data, context={'request': request})
        if serializer.is_valid():
            page = request.user.organization.pages.get(id=request.data.get('page'))
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

    @action(detail=True, methods=['post'])
    def disable(self, request, pk):
        post = self.get_object()
        post.disabled = True
        post.save()
        serializer = self.serializer_class(post, context={'request': request})
        return Response(serializer.data)

    
    @action(detail=True)
    def interests(self,request, pk):
        paginator = CreationTimeBasedPagination()
        queryset = Interest.objects.filter(post=pk, interested=True)
        queryset = paginator.paginate_queryset(queryset, self.request, view=self)
        serializer = InterestGeterializer(queryset, many=True)
        paginated_response = paginator.get_paginated_response(serializer.data)
        return paginated_response
    
    @action(detail=True)
    def volunteers(self,request, pk):
        volunteers = Interest.objects.filter(post=pk, interested=True).count()
        return Response({'count': volunteers})



class NotificationViewSet(ModelViewSet):
    queryset = Notification.objects.all()
    permission_classes = (IsAuthenticated, )
    serializer_class = NotificationSerializer


class InterestViewSet(ReadOnlyModelViewSet):
    queryset = Interest.objects.all()
    permission_classes = (IsAuthenticated, )
    serializer_class = InterestGeterializer


class FacebookApiViewSet(ViewSet):
    permission_classes = (IsAuthenticated, )

    @action(detail=False, methods=['post'])
    def verify_oauth(self, request):
        code = request.data.get('code')
        if FacebookService.verify_oauth(code, request.user):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False)
    def oauth_url(self, request):
        # TODO generate a STATE dynamically
        url = FacebookService.get_oauth_url()
        return Response(url)


class OrganizationViewSet(ModelViewSet):
    queryset = Organization.objects.all()
    permission_classes = (IsAuthenticated, )
    serializer_class = OrganizationSerializer

    @date_range_params_check
    @action(detail=False)
    def stats(self, request):
        from_date = self.request.query_params.get('from_date', None)
        to_date = self.request.query_params.get('to_date', None)
        if not from_date:
            start_from = datetime.now() - timedelta(days=28)
            from_date = start_from.strftime("%Y-%m-%d")

        if not to_date:
            today = datetime.now()
            to_date = today.strftime('%Y-%m-%d')

        organization = self.request.user.organization
        response = OrganizationService.get_stats(organization, from_date, to_date)
        return Response(response)
        

class WebhookCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        WEBHOOK_VERIFY_TOKEN = getattr(settings, 'FACEBOOK_WEBHOOK_VERIFY_TOKEN')

        mode = request.query_params.get('hub.mode')
        token = request.query_params.get('hub.verify_token')
        challenge = request.query_params.get('hub.challenge')
        if mode == 'subscribe' and token == WEBHOOK_VERIFY_TOKEN:
            return Response(int(challenge))
        return Response({'ok': False}, status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        body = request.data
        if body['object'] != 'page':
            return Response({'ok': False}, status.HTTP_400_BAD_REQUEST)

        entries = body['entry']
        for entry in entries:
            if 'changes' in entry:
                # this is a page event
                changes = entry['changes']
                for change in changes:
                    if change['field'] != 'feed':
                        continue
                    value = change['value']

                    if value['item'] == 'post':
                        # TODO: handle page post
                        pass
                    elif value['item'] == 'comment':
                        print('comment', value)
                        InteractionHandler.handle_new_comment(change)

            elif 'messaging' in entry:
                # this is a messenger event
                messages = entry['messaging']
                for message in messages:
                    psid = message['sender']['id']
                    page_id = message['recipient']['id']

                    print(psid, 'on', page_id, 'says', message)

                    if 'postback' in message:
                        InteractionHandler.handle_new_postback(psid, page_id, message['postback'])
                    if 'message' in message:
                        InteractionHandler.handle_text_message(psid, page_id, message['message'])

        return Response({'ok': True}, status.HTTP_200_OK)


class SetupWebhookCallbackView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        res = FacebookService.setup_webhook()
        return Response(res)


class InteractionHandler:
    ASKED_FOR_EMAIL = 'asked_for_email'
    ASKED_FOR_PIN = 'asked_for_pin'

    @staticmethod
    def handle_new_comment(data):
        comment_id = data.get('value', {}).get('comment_id')
        post_id = comment_id.split('_')[0]
        try:
            post = Post.objects.get(facebook_post_id=post_id, disabled=False)
        except Post.DoesNotExist:
            # TODO: ignoring for now
            print('Ignoring comment for disabled or unknown post')
            return Response(status.HTTP_200_OK)
        print('Webhook callback handle comment', data)
        preprocess_comment_for_ml.apply_async((data,))
        return Response(status.HTTP_200_OK)

    @staticmethod
    def handle_new_postback(psid, page_id, postback):
        # BOOL_PAGE_POST
        payload = postback['payload'].split("_")
        consent = payload[0]
        page_id = payload[1]
        post_id = payload[2]

        if consent == 'NO':
            # TODO: ignore for now
            return Response(status.HTTP_200_OK)

        volunteer, created = VolunteerService \
            .get_or_create_volunteer(psid, page_id)

        post = Post.objects.get(facebook_post_id=post_id)

        InterestService.create_interest_after_consent(volunteer, post)

        if created:
            cache_key = 'conversation_%s_%s' % (psid, page_id)
            cache_value = json.dumps({
                'post_id': post_id,
                'state': InteractionHandler.ASKED_FOR_EMAIL
            })
            cache.set(cache_key, cache_value, timeout=10*60)
            ask_for_email.apply_async((volunteer.id,))
        else:
            send_message_on_yes_confirmation.apply_async((volunteer.id, post.id))

        return Response(status.HTTP_200_OK)

    @staticmethod
    def handle_text_message(psid, page_id, message):
        text = message['text']

        def validate_email2(email_input):
            try:
                validate_email(email_input)
                return True
            except ValidationError:
                return False

        def validate_pin(pin_input):
            if re.fullmatch('\d{6}', pin_input):
                return True
            else:
                return False

        if validate_email2(text):
            print('IS AN EMAIL', text)
            email = text

            cache_key = 'conversation_%s_%s' % (psid, page_id)
            cache_value = cache.get(cache_key)

            if not cache_value:
                # TODO: handle late reply
                return Response(status.HTTP_200_OK)

            cache_value = json.loads(cache_value)
            post_id = cache_value['post_id']
            updated_cache_value = json.dumps({
                'post_id': cache_value['post_id'],
                'state': InteractionHandler.ASKED_FOR_PIN,
                'email': email
            })
            cache.set(cache_key, updated_cache_value, timeout=10 * 60)

            volunteer = Volunteer.objects.get(facebook_user_id=psid, facebook_page_id=page_id)
            post_instance = Post.objects.get(facebook_post_id=post_id)
            VolunteerService.send_verification_email(psid, page_id, post_instance.id, email)
            ask_for_pin.apply_async((volunteer.id,))

        elif validate_pin(text):
            # is a pin
            print('IS A PIN', text)
            pin = text

            cache_key = 'conversation_%s_%s' % (psid, page_id)
            cache_value = cache.get(cache_key)
            

            if not cache_value:
                # TODO: handle late reply
                return Response(status.HTTP_200_OK)

            cache_value = json.loads(cache_value)
            post_id = cache_value['post_id']
            email = cache_value['email']

            res = VolunteerService.verify_volunteer(psid, page_id, email, int(pin))
            print('got res', res)
            if not res:
                # TODO: handle wrong attempt
                pass

            volunteer = Volunteer.objects.get(facebook_user_id=psid, facebook_page_id=page_id)
            post = Post.objects.get(facebook_post_id=post_id)

            # TODO: get or create 3rd party account
            send_message_on_yes_confirmation.apply_async((volunteer.id, post.id))
            cache.expire(cache_value, timeout=0)

        return Response(status.HTTP_200_OK)



class SignUpViewSet(ModelViewSet):
    permission_classes = (IsAuthenticated, )
    serializer_class = SignUpSerializer
    def get_queryset(self):
        return self.request.user.organization.signups.all()


class SlotViewSet(ModelViewSet):
    queryset = Slot.objects.all()
    permission_classes = (IsAuthenticated, )
    serializer_class = SlotSerializer


class DateTimeViewSet(ModelViewSet):
    queryset = DateTime.objects.all()
    permission_classes = (IsAuthenticated, )
    serializer_class = DateTimeSetializer
