from rest_framework import serializers
from .models import Page, Post, Volunteer, Interest


class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = ('id', 'name')


class PostSerializer(serializers.ModelSerializer):
    page_name = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ('id', 'status', 'page', 'page_name',
                  'message_for_new_volunteer',
                  'message_for_returning_volunteer')

    def get_page_name(self, obj):
        return obj.page.name

    def create(self, validated_data):
        user = self.context.get('request').user
        post = Post.objects.create(user=user, **validated_data)
        return post


class VolunteerGetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Volunteer
        fields = ('id', 'facebook_user_id')

class InterestGeterializer(serializers.ModelSerializer):
    volunteer = VolunteerGetSerializer(read_only=True)
    class Meta:
        model = Interest
        fields = ('post', 'volunteer', 'interested', 'created_at')