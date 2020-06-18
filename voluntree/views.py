from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet, ReadOnlyModelViewSet, ModelViewSet
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from .interaction import InteractionHandler
from .services import (FacebookService, PostService, OrganizationService, SignUpService,
                       NationBuilderService)

from .serializers import (PageSerializer, PostSerializer, InterestGeterializer,
                          VolunteerSerializer, NotificationSerializer, OrganizationSerializer,
                          SlotSerializer, SignUpSerializer, DateTimeSetializer,
                          IntegrationSerializer)
from .models import (Post, Interest, Volunteer, Notification, Organization,
                     Slot, DateTime, SignUp, Page, Integration)
from .paginations import CreationTimeBasedPagination
from .decorators import date_range_params_check
from datetime import datetime, timedelta
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponseRedirect, HttpResponseNotFound
from django.shortcuts import render


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

            signup_id = request.data.get('signup')
            append_signup_info = request.data.get('append_signup_info', False)

            if signup_id and append_signup_info:
                # TODO: optimize
                fields, signup = SignUpService.get_human_readable_version(signup_id)

                slot_strings = []
                for field in fields:
                    row = '[Day %d][Slot %d]\nDate: %s\nTime: %s\n\nSlot: %s\nAvailability: %s\nDescription: %s\n' % (
                        field['day_count'],
                        field['slot_count'],
                        field['date'],
                        str(field['start_time']) + ' to ' + str(field['end_time']),
                        field['title'],
                        str(field['available']) + " of " + str(field['required_volunteers']) + " volunteers required",
                        field['description'],
                    )
                    slot_strings.append(row)

                separator = '-' * 50
                newline_with_separator = separator + '\n'
                fb_status = "{}\n\nDetails:\n{}\n{}\n\nSlots:\n{}\n{}".format(
                    request.data.get('status'),
                    signup.title,
                    signup.description,
                    separator,
                    newline_with_separator.join(slot_strings),
                )
                print('status', fb_status)
            else:
                fb_status = request.data.get('status')

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


class NationBuilderApiViewSet(ViewSet):
    permission_classes = (IsAuthenticated, )

    @action(detail=False, methods=['post'])
    def verify_oauth(self, request):
        code = request.data.get('code')
        state = request.data.get('state')
        if NationBuilderService.verify_oauth(code, state, request.user):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False)
    def oauth_url(self, request):
        slug = request.query_params.get('slug')
        url = NationBuilderService.get_oauth_url(slug)
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


class SignUpViewSet(ModelViewSet):
    permission_classes = (IsAuthenticated, )
    serializer_class = SignUpSerializer

    def get_queryset(self):
        return self.request.user.organization.signups.all()

    @action(detail=True)
    def date_times(self, request, pk):
        queryset = self.get_object().date_times.all()
        serializer = DateTimeSetializer(queryset, many=True)
        # TODO: paginate?
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def disable(self, request, pk):
        signup = self.get_object()
        signup.disabled = True
        signup.save()
        serializer = self.serializer_class(signup, context={'request': request})
        return Response(serializer.data)


class SlotViewSet(ModelViewSet):
    queryset = Slot.objects.all()
    permission_classes = (IsAuthenticated, )
    serializer_class = SlotSerializer


class DateTimeViewSet(ModelViewSet):
    queryset = DateTime.objects.all()
    permission_classes = (IsAuthenticated, )
    serializer_class = DateTimeSetializer


@csrf_exempt
def volunteer_signup_view(request, **kargs):
    psid = kargs['ps_id']
    page_id = kargs['page_id']
    signup_id = kargs['signup_id']

    # TODO: optimize this view

    try:
        signup = SignUp.objects.get(id=signup_id)
        date_times = signup.date_times.all()
    except SignUp.DoesNotExist:
        return HttpResponseNotFound('No Signup')

    try:
        volunteer = Volunteer.objects.get(facebook_user_id=psid, facebook_page_id=page_id)
    except Volunteer.DoesNotExist:
        return HttpResponseNotFound('No volunteer')

    post_id = request.GET.get('post_id', None)
    post = None

    if post_id:
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return HttpResponseNotFound('No Post')

    page = Page.objects.get(facebook_page_id=page_id)

    if request.method == 'POST':
        cleaned_data = request.POST
        print(cleaned_data)

        count = 0
        for dt in date_times:
            slots = dt.slots.all()

            for slot in slots:
                field_name = 'dt_%s:slot_%s' % (str(dt.id), str(slot.id))
                filters = {
                    'datetime': dt,
                    'slot': slot,
                    'volunteer': volunteer
                }

                if post:
                    filters['post'] = post

                if field_name in cleaned_data:
                    Interest.objects.get_or_create(**filters)
                    count += 1
                else:
                    try:
                        Interest.objects.get(**filters).delete()
                    except Interest.DoesNotExist:
                        pass

        InteractionHandler.send_reply(psid, page_id, {
            'text': "Cool, you signed up for %s slots" % count
        })
        return HttpResponseRedirect('/messenger/signup/done/')
    else:
        form = {'fields': []}

        for dt in date_times:
            slots = dt.slots.all()

            for slot in slots:
                interests = Interest.objects.filter(datetime=dt, slot=slot)
                filled = interests.count()
                interested = interests.filter(volunteer=volunteer)
                field_name = 'dt_%s:slot_%s' % (str(dt.id), str(slot.id))
                field = {
                    'id': 'id_' + field_name,
                    'name': field_name,
                    'date': dt.date,
                    'start_time': dt.start_time,
                    'end_time': dt.end_time,
                    'slot': slot,
                    'available': slot.required_volunteers - filled,
                    'initial': True if interested else False
                }
                form['fields'].append(field)

    return render(request, 'messenger/signup.html', {
        'signup': signup,
        'page': page.name,
        'form': form,
        'FACEBOOK_APP_ID': getattr(settings, 'FACEBOOK_APP_ID')
    })

@csrf_exempt
def signup_confirmation_view(request, **kargs):
    return render(request, 'messenger/done.html', {
        'FACEBOOK_APP_ID': getattr(settings, 'FACEBOOK_APP_ID')
    })


class IntegrationViewSet(ModelViewSet):
    serializer_class = IntegrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Integration.objects.filter(organization=self.request.user.organization)
