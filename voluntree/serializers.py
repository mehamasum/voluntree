from datetime import datetime
from rest_framework import serializers
from .models import (Page, Post, Volunteer, Interest, Notification, Organization, Slot, SignUp, DateTime)


class PageSerializer(serializers.ModelSerializer):
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = Page
        fields = ('id', 'name', 'is_expired', 'facebook_page_id', 'page_expiry_token_date')

    def get_is_expired(self, obj):
        return obj.page_expiry_token_date < datetime.now().date()


class PostSerializer(serializers.ModelSerializer):
    page_name = serializers.SerializerMethodField()
    facebook_page_id = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ('id', 'status', 'page', 'page_name', 'facebook_page_id', 'facebook_post_id', 'created_at', 'signup',)
        read_only_fields = ('facebook_post_id', 'created_at',)

    def get_page_name(self, obj):
        return obj.page.name

    def get_facebook_page_id(self, obj):
        return obj.page.facebook_page_id

    def create(self, validated_data):
        user = self.context.get('request').user
        post = Post.objects.create(user=user, **validated_data)
        return post


class VolunteerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Volunteer
        fields = ('id', 'facebook_user_id', 'facebook_page_id', 'first_name',
                  'last_name', 'profile_pic')


class InterestGeterializer(serializers.ModelSerializer):
    volunteer = VolunteerSerializer(read_only=True)
    class Meta:
        model = Interest
        fields = ('id', 'post', 'volunteer', 'interested', 'created_at')


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'message', 'post')
        
    def create(self, validated_data):
        user = self.context.get('request').user
        notification = Notification.objects.create(user=user, **validated_data)
        return notification


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ('id', 'name', 'payment_info', 'volunteer_info', 'volunteer_verification')


class SlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slot
        fields = ('id', 'required_volunteers', 'title', 'description', 'date_times')


class SignUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = SignUp
        fields = ('id', 'title', 'description', 'created_at', 'disabled')
        read_only_fields = ('created_at', 'disabled',)

    def create(self, validated_data):
        user = self.context.get('request').user
        organization = user.organization
        return SignUp.objects.create(
            user=user, organization=organization, **validated_data)


class DateTimeSetializer(serializers.ModelSerializer):
    slots = SlotSerializer(many=True, read_only=True)
    class Meta:
        model = DateTime
        fields = ('id', 'date', 'start_time', 'end_time', 'signup', 'slots')
