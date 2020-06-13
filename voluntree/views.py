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
from .tasks import send_message_on_yes_confirmation, send_private_reply_on_comment, reply
from .decorators import date_range_params_check
from datetime import datetime, timedelta
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
import re
from django.core.cache import cache
import json


class PageViewSet(ReadOnlyModelViewSet):
    permission_classes = (IsAuthenticated, )
    serializer_class = PageSerializer

    def get_queryset(self):
        return self.request.user.organization.pages.all()

    @action(detail=True)
    def volunteers(self, request, pk):
        fb_page_ids = self.request.user.organization.pages.filter(id=pk).values_list('facebook_page_id', flat=True)
        queryset = Volunteer.objects.filter(facebook_page_id__in=fb_page_ids)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = VolunteerSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = VolunteerSerializer(queryset, many=True)
        return Response(serializer.data)


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
            signup_object = request.user.organization.signups.get(id=request.data.get('signup'))
            print('before formating status')
            fb_status = "{}\n{}".format(request.data.get('status'), signup_object)
            print('status', fb_status)
            fb_post = PostService.create_post_on_facebook_page(
                page, fb_status)
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
    ASKED_FOR_SIGNUP_ID = 'ASKED_FOR_SIGNUP_ID'
    ASKED_FOR_EMAIL = 'ASKED_FOR_EMAIL'
    ASKED_FOR_PIN = 'ASKED_FOR_PIN'

    @staticmethod
    def get_context(psid, page_id):
        cache_key = 'conversation_%s_%s' % (psid, page_id)
        cache_value = cache.get(cache_key)

        if not cache_value:
            return None

        return json.loads(cache_value)

    @staticmethod
    def set_context(psid, page_id, context):
        cache_key = 'conversation_%s_%s' % (psid, page_id)
        cache.set(cache_key, json.dumps(context), timeout=24*60*60)  # a day
        return cache.get(cache_key)

    @staticmethod
    def reset_context(psid, page_id):
        cache_key = 'conversation_%s_%s' % (psid, page_id)
        cache.expire(cache_key, timeout=0)

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

        # TODO: contact wit.ai
        send_private_reply_on_comment.apply_async((data,))
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

        # TODO: handle already clicked
        volunteer, created = VolunteerService \
            .get_or_create_volunteer(psid, page_id)

        post = Post.objects.get(facebook_post_id=post_id)

        InterestService.create_interest_after_consent(volunteer, post)

        if created:
            InteractionHandler.set_context(psid, page_id, {
                'post_id': post_id,
                'state': InteractionHandler.ASKED_FOR_EMAIL
            })
            InteractionHandler.send_reply(psid, page_id, {
                'text': 'What is your email?'
            })
        else:
            InteractionHandler.reset_context(psid, page_id)
            send_message_on_yes_confirmation.apply_async((volunteer.id, post.id))

        return Response(status.HTTP_200_OK)

    @staticmethod
    def first_entity(nlp, name):
        return nlp and 'entities' in nlp and name in nlp['entities'] and nlp['entities'][name][0]

    @staticmethod
    def validate_email(email_input):
        try:
            validate_email(email_input)
            return True
        except ValidationError:
            return False

    @staticmethod
    def validate_otp(otp):
        # if re.fullmatch('\d{6}', otp):
        if 99999 < otp <= 999999:
            return True
        else:
            return False

    @staticmethod
    def send_reply(psid, page_id, message):
        # TODO: async
        reply(psid, page_id, message)

    @staticmethod
    def handle_expired_session(psid, page_id):
        InteractionHandler.send_reply(psid, page_id, {
            'text': 'Sorry the session expired. Please start over.'
        })
        return Response(status.HTTP_200_OK)

    @staticmethod
    def handle_text_message(psid, page_id, message):
        text = message['text']
        nlp = message['nlp']

        intent = InteractionHandler.first_entity(nlp, 'intent')
        print('intent', intent)

        email_entity = InteractionHandler.first_entity(nlp, 'email')
        print('email intent', email_entity)

        otp_entity = InteractionHandler.first_entity(nlp, 'otp')
        print('otp intent', otp_entity)

        if intent and intent['value'] == 'SIGN_UP_AS_VOLUNTEER' and intent['confidence'] > 0.8:
            print('sign up intent', intent)

            # todo: design chips
            InteractionHandler.send_reply(psid, page_id, {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "button",
                        "text": "Which event?",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Event 1",
                                "payload": 'SIGNUP_event_1'
                            },
                            {
                                "type": "postback",
                                "title": "Event 2",
                                "payload": 'SIGNUP_event_2'
                            },
                        ]
                    }
                }
            })

            InteractionHandler.set_context(psid, page_id, {
                'state': InteractionHandler.ASKED_FOR_SIGNUP_ID,
            })
            return Response(status.HTTP_200_OK)

        elif email_entity and InteractionHandler.validate_email(email_entity['value']) and email_entity['confidence'] > 0.8:
            email = email_entity['value']
            context = InteractionHandler.get_context(psid, page_id)
            if not context:
                return InteractionHandler.handle_expired_session(psid, page_id)

            post_instance = Post.objects.get(facebook_post_id=context['post_id'])
            VolunteerService.send_verification_email(psid, page_id, post_instance.id, email)

            InteractionHandler.set_context(psid, page_id, {
                'post_id': context['post_id'],
                'state': InteractionHandler.ASKED_FOR_PIN,
                'email': email
            })
            InteractionHandler.send_reply(psid, page_id, {
                'text': 'What is the OTP?'
            })

        elif otp_entity and InteractionHandler.validate_otp(otp_entity['value']) and otp_entity['confidence'] > 0.7:
            pin = otp_entity['value']

            context = InteractionHandler.get_context(psid, page_id)
            if not context:
                return InteractionHandler.handle_expired_session(psid, page_id)

            post_id = context['post_id']
            email = context['email']

            res = VolunteerService.verify_volunteer(psid, page_id, email, int(pin))
            print('got res', res)
            if not res:
                # TODO: handle wrong attempt
                pass

            volunteer = Volunteer.objects.get(facebook_user_id=psid, facebook_page_id=page_id)
            post = Post.objects.get(facebook_post_id=post_id)

            # TODO: get or create 3rd party account
            InteractionHandler.send_reply(psid, page_id, {
                'text': 'Your email is verified. ' +
                        'We have created an account for you in our volunteer management software.'
            })

            send_message_on_yes_confirmation.apply_async((volunteer.id, post.id))
            InteractionHandler.reset_context(psid, page_id)

        return Response(status.HTTP_200_OK)



class SignUpViewSet(ModelViewSet):
    permission_classes = (IsAuthenticated, )
    serializer_class = SignUpSerializer

    def get_queryset(self):
        return self.request.user.organization.signups.all()

    @action(detail=True)
    def date_times(self, request, pk):
        queryset = self.get_object().date_times.all()
        serializer = DateTimeSetializer(queryset, many=True)
        return Response(serializer.data)


class SlotViewSet(ModelViewSet):
    queryset = Slot.objects.all()
    permission_classes = (IsAuthenticated, )
    serializer_class = SlotSerializer


class DateTimeViewSet(ModelViewSet):
    queryset = DateTime.objects.all()
    permission_classes = (IsAuthenticated, )
    serializer_class = DateTimeSetializer
