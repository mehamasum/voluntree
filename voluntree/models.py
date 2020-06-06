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


class SignUp(models.Model):
    title = models.CharField(max_length=200)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='signups')
    def __str__(self):
        datetimes = "\n".join(str(seg) for seg in self.date_times.all())
        return "{}".format(datetimes)


class DateTime(models.Model):
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    signup = models.ForeignKey(SignUp, related_name='date_times', on_delete=models.CASCADE)
    def __str__(self):
        slots_info = "\n".join(str(seg) for seg in self.slots.all())
        boundary = "-----------------------------------------------"
        return "{}\nDate: {}\n\nstart time: {}\nend time: {}\n\n{}\n{}".format(boundary,self.date, self.start_time, self.end_time, slots_info, boundary)


class Slot(models.Model):
    date_times = models.ManyToManyField(DateTime, related_name='slots')
    required_volunteers = models.IntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField()
    def __str__(self):
        return "title: {}\nVolunteer Needs: {}\n{}\n".format(self.title, self.required_volunteers, self.description)


class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name='posts')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    status = models.TextField()
    facebook_post_id = models.CharField(max_length=200, blank=True, null=True)
    message_for_new_volunteer = models.TextField()
    message_for_returning_volunteer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    disabled = models.BooleanField(default=False)
    signup = models.ForeignKey(SignUp, on_delete=models.CASCADE, related_name='posts', null=True, blank=True)

class Interest(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='interests')
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='interests')
    interested = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()

class Verification(models.Model):
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='verifications')
    pin = models.IntegerField()
    attempts = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    referred_post = models.ForeignKey(Post, related_name='verifications', null=True, blank=True, on_delete=models.SET_NULL)
    email = models.CharField(max_length=200, null=True, blank=True)
