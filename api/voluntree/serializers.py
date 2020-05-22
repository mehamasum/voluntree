from rest_framework import serializers
from .models import Page, Post


class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = ('id', 'name')


class PostSerializer(serializers.ModelSerializer):
    page_name = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ('id', 'status', 'page', 'page_name')

    def get_page_name(self, obj):
        return obj.page.name

    def create(self, validated_data):
        user = self.context.get('request').user
        post = Post.objects.create(user=user, **validated_data)
        return post
