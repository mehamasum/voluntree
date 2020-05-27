from datetime import datetime
from rest_framework import serializers
from .models import Page, Post, Volunteer, Interest, Notification


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
        fields = ('id', 'status', 'page', 'page_name', 'facebook_page_id', 'facebook_post_id', 'created_at',
                  'message_for_new_volunteer',
                  'message_for_returning_volunteer')
        read_only_fields = ('facebook_post_id', 'created_at')

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
        fields = ('id', 'facebook_user_id', 'facebook_page_id')


class InterestGeterializer(serializers.ModelSerializer):
    volunteer = VolunteerSerializer(read_only=True)
    class Meta:
        model = Interest
        fields = ('post', 'volunteer', 'interested', 'created_at')


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('message', 'post')
        
    def create(self, validated_data):
        user = self.context.get('request').user
        notification = Notification.objects.create(user=user, **validated_data)
        return notification
