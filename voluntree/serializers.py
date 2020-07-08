from datetime import datetime
from django.db.models.functions import Coalesce
from django.db.models import Count, Sum
from rest_framework import serializers
from .models import (Page, Post, Volunteer, Interest, Notification,
                     Organization, Slot, SignUp, DateTime, Integration,
                     VolunteerThirdPartyIntegration, Rating)
import six
from timezone_field import TimeZoneField as TimeZoneField_


class TimeZoneField(serializers.ChoiceField):
    def __init__(self, **kwargs):
        super().__init__(TimeZoneField_.CHOICES + [(None, "")], **kwargs)

    def to_representation(self, value):
        return six.text_type(super().to_representation(value))


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
        fields = ('id', 'status', 'page', 'page_name', 'facebook_page_id', 'facebook_post_id', 'created_at', 'signup',
                  'append_signup_info')
        read_only_fields = ('facebook_post_id', 'created_at',)

    def get_page_name(self, obj):
        return obj.page.name

    def get_facebook_page_id(self, obj):
        return obj.page.facebook_page_id

    def create(self, validated_data):
        user = self.context.get('request').user
        post = Post.objects.create(user=user, **validated_data)
        return post


class VolunteerThirdPartyIntegrationSerializer(serializers.ModelSerializer):
    integration_type = serializers.CharField(source='integration.integration_type')
    integration_data = serializers.CharField(source='integration.integration_data')

    class Meta:
        model = VolunteerThirdPartyIntegration
        fields = '__all__'


class VolunteerSerializer(serializers.ModelSerializer):
    rating_summary = serializers.SerializerMethodField()
    total_rating = serializers.SerializerMethodField()
    rating_sum = serializers.SerializerMethodField()
    integrations = VolunteerThirdPartyIntegrationSerializer(
        source='volunteer_third_party_integrations',
        many=True, read_only=True)

    class Meta:
        model = Volunteer
        fields = ('id', 'facebook_user_id', 'facebook_page_id', 'first_name',
                  'last_name', 'profile_pic', 'integrations', 'email',
                  'rating_summary', 'total_rating', 'rating_sum')

    def get_rating_summary(self, valunteer):
        return valunteer.ratings.values('rating').annotate(
            total=Count('id')).order_by('-rating')

    def get_total_rating(self, volunteer):
        total = volunteer.ratings.count()
        return total

    def get_rating_sum(self, volunteer):
        rating_sum = volunteer.ratings.aggregate(total=Sum('rating')).get('total')
        return rating_sum


class InterestGeterializer(serializers.ModelSerializer):
    volunteer = VolunteerSerializer(read_only=True)
    rating = serializers.SerializerMethodField()

    class Meta:
        model = Interest
        fields = ('id', 'post', 'volunteer', 'interested', 'created_at',
                  'datetime', 'slot', 'rating')

    def get_rating(self, interest):
        volunteer = interest.volunteer
        signup = self.context.get('signup')
        total = Rating.objects.filter(volunteer=volunteer, signup=signup).count()
        sum = Rating.objects.filter(volunteer=volunteer, signup=signup).aggregate(sum=Coalesce(Sum('rating'), 0)).get('sum')
        if total:
            return sum/total
        return 0


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'message', 'signup', 'created_at')
        
    def create(self, validated_data):
        user = self.context.get('request').user
        notification = Notification.objects.create(user=user, **validated_data)
        return notification


class OrganizationSerializer(serializers.ModelSerializer):
    timezone = TimeZoneField()

    class Meta:
        model = Organization
        fields = ('id', 'name', 'payment_info', 'volunteer_info', 'volunteer_verification', 'timezone')


class SlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slot
        fields = ('id', 'required_volunteers', 'title', 'description', 'date_times')


class SignUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = SignUp
        fields = ('id', 'title', 'description', 'created_at', 'disabled', 'facts')
        read_only_fields = ('created_at', 'disabled')

    def create(self, validated_data):
        user = self.context.get('request').user
        organization = user.organization
        return SignUp.objects.create(
            user=user, organization=organization, **validated_data)



class DurationSerializer(serializers.Serializer):
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()

    def validate(self, data):
        """
        Check that start is before end.
        """
        if data['start_time'] > data['end_time']:
            raise serializers.ValidationError("endtime must be occur before start")
        return data

class DurationListSerializer(serializers.ListSerializer):
    child = DurationSerializer()


class DateTimeSetializer(serializers.ModelSerializer):
    slots = SlotSerializer(many=True, read_only=True)
   
    class Meta:
        model = DateTime
        fields = ('id', 'date', 'start_time', 'end_time', 'signup', 'slots')


    



class IntegrationSerializer(serializers.ModelSerializer):
    is_expired = serializers.SerializerMethodField()

    def get_is_expired(self, obj):
        return obj.integration_expiry_date < datetime.now().date()

    class Meta:
        model = Integration
        fields = ('id', 'integration_expiry_date', 'integration_type',
                  'is_expired')


class RatingSerializer(serializers.ModelSerializer):
    signup = SignUpSerializer(read_only=True)
    rated_by = serializers.SerializerMethodField()
    
    class Meta:
        model = Rating
        fields = ('volunteer', 'user', 'remark', 'rating', 'signup', 'rated_by')
    
    def get_rated_by(self, obj):
        return obj.user.username if obj.user else ''
