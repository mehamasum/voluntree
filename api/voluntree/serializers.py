from rest_framework import serializers
from .models import Page, Post


class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = ('id', 'name')


class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ('id', 'status', 'page')

    def create(self, validated_data):
        user = self.context.get('request').user
        post = Post.objects.create(user=user, **validated_data)
        return post
