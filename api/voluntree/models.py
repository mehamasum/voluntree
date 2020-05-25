import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    is_org_admin = models.BooleanField(default=True)


class Page(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='pages')
    name = models.CharField(max_length=200)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pages')
    facebook_page_id = models.CharField(max_length=200)
    page_access_token = models.CharField(max_length=200)
    page_expiry_token_date = models.DateField(blank=True, null=True)


class PostMetaData(models.Model):
    message_for_new_volunteer = models.TextField()
    message_for_returning_volunteer = models.TextField()


class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name='posts')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    status = models.TextField()
    facebook_post_id = models.CharField(max_length=200, blank=True, null=True)
    metadata = models.OneToOneField(PostMetaData, on_delete=models.SET_NULL, null=True, blank=True)


class Volunteer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    facebook_user_id = models.CharField(max_length=200)


class Interest(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='interests')
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='interests')
    interested = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    Volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='notifications')
