import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    payment_info = models.TextField(max_length=1000, null=True)
    volunteer_info = models.TextField(max_length=3000, null=True)
    volunteer_verification = models.BooleanField(default=True)


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

    def __str__(self):
        return self.name


class Volunteer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    facebook_user_id = models.CharField(max_length=200) #PSID
    facebook_page_id = models.CharField(max_length=200) #PSID for this page
    first_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    profile_pic = models.CharField(max_length=500, null=True, blank=True)
    email = models.CharField(max_length=200, null=True, blank=True)

    def __str__(self):
        return "PSID " + self.facebook_user_id + " for " + self.facebook_page_id



class Integration(models.Model):
    NATION_BUILDER = 'NATION_BUILDER'
    TYPE_CHOICES = (
        (NATION_BUILDER, 'Nation Builder'),
    )

    integration_type = models.CharField(
        choices=TYPE_CHOICES, max_length=15)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    integration_data = models.TextField()
    integration_access_token = models.CharField(max_length=200)
    integration_expiry_date = models.DateField(null=True, blank=True)


class VolunteerThirdPartyIntegration(models.Model):
    volunteer = models.ForeignKey(
        Volunteer,
        on_delete=models.CASCADE,
        related_name='volunteer_third_party_integrations')
    integration = models.ForeignKey(
        Integration,
        on_delete=models.CASCADE,
        related_name='volunteer_third_party_integrations')
    data = models.CharField(max_length=200)


class SignUp(models.Model):
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=1000)
    facts = models.TextField(null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='signups')
    disabled = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class DateTime(models.Model):
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    signup = models.ForeignKey(SignUp, related_name='date_times', on_delete=models.CASCADE)

    def __str__(self):
        time = str(self.start_time) + "-" + str(self.end_time)
        return "Date: {} Time: {}".format(self.date, time)


class Slot(models.Model):
    date_times = models.ManyToManyField(DateTime, related_name='slots')
    required_volunteers = models.IntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField()

    def __str__(self):
        return self.title + " (" + str(self.required_volunteers) + ")"


class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name='posts')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    status = models.TextField()
    facebook_post_id = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    signup = models.ForeignKey(SignUp, on_delete=models.CASCADE, related_name='posts', null=True, blank=True)
    append_signup_info = models.BooleanField(default=False)

    def __str__(self):
        return self.status

class Interest(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='interests', null=True)
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='interests')
    interested = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    datetime = models.ForeignKey(DateTime, on_delete=models.CASCADE, related_name='interests', null=True)
    slot = models.ForeignKey(Slot, on_delete=models.CASCADE, related_name='interests', null=True)

    def __str__(self):
        return str(self.slot)

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    signup = models.ForeignKey(SignUp, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.message)

class Verification(models.Model):
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='verifications')
    pin = models.IntegerField()
    attempts = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    referred_post = models.ForeignKey(Post, related_name='verifications', null=True, blank=True, on_delete=models.SET_NULL)
    email = models.CharField(max_length=200, null=True, blank=True)
