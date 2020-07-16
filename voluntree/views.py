from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet, ReadOnlyModelViewSet, ModelViewSet
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response

from config.logshim import LogShim
from .interaction import InteractionHandler
from .services import (FacebookService, OrganizationService,
                       NationBuilderService, SignUpService)

from .serializers import (PageSerializer, PostSerializer, InterestGeterializer,
                          VolunteerSerializer, NotificationSerializer, OrganizationSerializer,
                          SlotSerializer, SignUpSerializer, DateTimeSetializer,
                          IntegrationSerializer, RatingSerializer, DurationListSerializer, UploadSerializer)
from .models import (Post, Interest, Volunteer, Notification, Organization,
                     Slot, DateTime, SignUp, Page, Integration, Rating, Upload)
from .paginations import CreationTimeBasedPagination
from .decorators import date_range_params_check
from datetime import datetime, timedelta
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponseRedirect, HttpResponseNotFound
from django.shortcuts import render

import logging
logger = LogShim(logging.getLogger(__file__))


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
            else:
                fb_status = request.data.get('status')

            upload_id = request.data.get('upload')
            if upload_id:
                try:
                    upload = Upload.objects.get(id=upload_id)
                    if settings.USE_S3:
                        file_url = upload.file.url
                    else:
                        file_url = settings.APP_URL + upload.file.url
                except Upload.DoesNotExist:
                    return Response({'message': 'File does not exist'}, status=status.HTTP_400_BAD_REQUEST)

                # file_url = 'https://cdn.searchenginejournal.com/wp-content/uploads/2019/11/how-to-do-a-reverse-image-search-on-google-1-5dbd15dddd843.png'
                fb_image = FacebookService.create_photo_on_facebook_page(page, file_url)
                if fb_image.status_code != 200:
                    err = fb_image.json()
                    logger.error('Photo upload failed', err)
                    return Response(err, status=status.HTTP_400_BAD_REQUEST)

            fb_image_ids = [fb_image.json()["id"]] if upload_id else []
            fb_post = FacebookService.create_post_on_facebook_page(page, fb_status, fb_image_ids)

            if fb_post.status_code != 200:
                err = fb_post.json()
                logger.error('Post creation failed', err)
                return Response(err, status=status.HTTP_400_BAD_REQUEST)


            post = serializer.save()
            post.facebook_post_id = fb_post.json().get('id', 'x_y').split('_')[1]
            post.status = fb_status
            post.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=True)
    def interests(self,request, pk):
        post = self.get_object()
        paginator = CreationTimeBasedPagination()
        queryset = Interest.objects.filter(post=pk, interested=True)
        queryset = paginator.paginate_queryset(queryset, self.request, view=self)
        serializer = InterestGeterializer(
            queryset, many=True, context={'signup': post.signup})
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
    permission_classes = (IsAuthenticated, )
    serializer_class = OrganizationSerializer

    def get_queryset(self):
        organization = self.request.user.organization
        return Organization.objects.filter(id=organization.id)

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
                        logger.debug('comment', value)
                        InteractionHandler.handle_new_comment(change)

            elif 'messaging' in entry:
                # this is a messenger event
                messages = entry['messaging']
                for message in messages:
                    psid = message['sender']['id']
                    page_id = message['recipient']['id']

                    logger.info(psid, 'on', page_id, 'says', message)

                    if 'postback' in message:
                        logger.debug(psid, 'on', page_id, 'postback', message['postback'])
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

    @action(detail=True)
    def notifications(self, request, pk):
        queryset = self.get_object().notifications.all().order_by('-created_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = NotificationSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = NotificationSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True)
    def interests(self, request, pk):
        signup = self.get_object()
        paginator = CreationTimeBasedPagination()
        queryset = Interest.objects.filter(slot__date_times__in=self.get_object().date_times.all()).distinct()

        page = paginator.paginate_queryset(queryset, self.request, view=self)
        serializer = InterestGeterializer(
            page, many=True, context={'signup': signup})
        return paginator.get_paginated_response(serializer.data)

    @action(detail=True)
    def posts(self, request, pk):
        queryset = Post.objects.filter(signup_id=pk).order_by('-created_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PostSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = PostSerializer(queryset, many=True)
        return Response(serializer.data)


class VolunteerViewSet(ModelViewSet):
    queryset = Volunteer.objects.all()
    permission_classes = (IsAuthenticated, )
    serializer_class = VolunteerSerializer

    @action(detail=True, methods=['post'])
    def rate(self, request, pk):
        data = {
            'user': request.user.id,
            **request.data
        }
        try:
            instance = Rating.objects.get(signup=request.data.get('signup'), volunteer=pk)
            serializer = RatingSerializer(instance, data=data)
        except ObjectDoesNotExist:
            serializer = RatingSerializer(data=data)
        
        serializer.is_valid(raise_exception=True)
        rating = serializer.save()

        res = InteractionHandler.send_sharable_certificate(rating.volunteer, rating.signup)
        logger.debug(res.json())

        return Response(serializer.data)

    @action(detail=True)
    def rating(self, request, pk):
        
        signup = request.query_params.get('signup')
        try:
            queryset = Rating.objects.get(signup=signup, volunteer=pk)
            serializer = RatingSerializer(queryset)
            return Response(serializer.data)
        except ObjectDoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True)
    def rating_list(self, request, pk):
        queryset = Rating.objects.filter(volunteer=pk)
        serializer = RatingSerializer(queryset, many=True)
        return Response(serializer.data)

    


       
    
class SlotViewSet(ModelViewSet):
    queryset = Slot.objects.all()
    permission_classes = (IsAuthenticated, )
    serializer_class = SlotSerializer

    @action(detail=True)
    def volunteers(self, request, pk):
        datetime = request.query_params.get('datetime')
        volunteer_ids = Interest.objects.filter(slot=pk,datetime=datetime).values('volunteer')
        queryset = Volunteer.objects.filter(id__in=volunteer_ids)
        serializer = VolunteerSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)



class DateTimeViewSet(ModelViewSet):
    queryset = DateTime.objects.all()
    permission_classes = (IsAuthenticated, )
    serializer_class = DateTimeSetializer

    def create(self, request, *args, **kwargs):
        times = request.data.get('times', None)
        duration_serializer = DurationListSerializer(data=times)
        duration_serializer.is_valid(raise_exception=True)
        signup = request.data['signup']
        date = request.data['date']
        response = []
        for time in times:
            data = {
                'signup': signup,
                'date': date,
                'start_time': time['start_time'],
                'end_time': time['end_time']
            }
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            response.append(serializer.data)

        return Response(response, status=status.HTTP_201_CREATED)


@csrf_exempt
def volunteer_signup_view(request, **kargs):
    psid = request.GET.get('psid', None)
    if not psid:
        return HttpResponseNotFound('No PSID')

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
    last_slot = None
    last_dt = None

    if request.method == 'POST':
        cleaned_data = request.POST
        logger.debug(cleaned_data)

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
                    last_slot = slot
                    last_dt = dt
                    count += 1
                else:
                    try:
                        Interest.objects.get(**filters).delete()
                    except Interest.DoesNotExist:
                        pass

        if count == 0:
            InteractionHandler.send_reply(psid, page_id, {
                'text': "You unregistered from all the slots (y)"
            })
        elif count == 1:
            InteractionHandler.send_calendar_confirmation(psid, page_id, last_dt, last_slot, volunteer, signup)
        else:
            InteractionHandler.send_wo_calendar_confirmation(psid, page_id, count, volunteer, signup)
        return HttpResponseRedirect('/messenger/signup/done/')
    else:
        fields, _ = SignUpService.get_human_readable_version_personal(signup, volunteer)
        form = {'fields': fields}

    return render(request, 'messenger/signup.html', {
        'signup': signup,
        'page': page.name,
        'form': form,
        'psid': psid,
        'FACEBOOK_APP_ID': getattr(settings, 'FACEBOOK_APP_ID')
    })

@csrf_exempt
def volunteer_signup_preview(request, **kargs):
    signup_id = kargs['signup_id']
    signup = SignUp.objects.get(id=signup_id)
    fields, _ = SignUpService.get_human_readable_version_personal(signup, None)
    form = {'fields': fields}

    return render(request, 'messenger/signup.html', {
        'signup': signup,
        'page': 'Your Page Name',
        'form': form,
        'psid': None,
        'FACEBOOK_APP_ID': getattr(settings, 'FACEBOOK_APP_ID')
    })

@csrf_exempt
def share_activity(request, **kargs):
    signup_id = kargs['signup_id']
    volunteer_id = kargs['volunteer_id']

    try:
        signup = SignUp.objects.get(id=signup_id)
    except SignUp.DoesNotExist:
        return HttpResponseNotFound('No Signup')

    try:
        volunteer = Volunteer.objects.get(id=volunteer_id)
        page = Page.objects.get(facebook_page_id=volunteer.facebook_page_id)
    except Volunteer.DoesNotExist:
        return HttpResponseNotFound('No volunteer')

    fields, _ = SignUpService.get_human_readable_version_personal(signup, volunteer)

    title = '%s has signed up for %s' % (
        volunteer.first_name,
        signup.title
    )
    image = 'https://pixabay.com/images/id-2055010'
    description = '%s is looking for volunteers for their event. You can sign up too!' % signup.organization.name

    return render(request, 'share/registered.html', {
        'title': title,
        'description': description,
        'image': image,
        'signup': signup,
        'volunteer': volunteer,
        'organization': signup.organization,
        'url': settings.APP_URL,
        'page': page
    })

@csrf_exempt
def share_certificate(request, **kargs):
    signup_id = kargs['signup_id']
    volunteer_id = kargs['volunteer_id']

    try:
        signup = SignUp.objects.get(id=signup_id)
    except SignUp.DoesNotExist:
        return HttpResponseNotFound('No Signup')

    try:
        volunteer = Volunteer.objects.get(id=volunteer_id)
        page = Page.objects.get(facebook_page_id=volunteer.facebook_page_id)
    except Volunteer.DoesNotExist:
        return HttpResponseNotFound('No volunteer')

    fields, _ = SignUpService.get_human_readable_version_personal(signup, volunteer)

    title = '%s has volunteered in %s' % (
        volunteer.first_name,
        signup.title
    )
    image = 'https://pixabay.com/images/id-2055010'
    description = '%s is looking for volunteers for similar events. You can sign up too!' % signup.organization.name

    return render(request, 'share/volunteered.html', {
        'title': title,
        'description': description,
        'image': image,
        'signup': signup,
        'volunteer': volunteer,
        'organization': signup.organization,
        'url': settings.APP_URL,
        'page': page
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


class UploadViewSet(ModelViewSet):
    queryset = Upload.objects.all()
    permission_classes = (IsAuthenticated, )
    serializer_class = UploadSerializer
