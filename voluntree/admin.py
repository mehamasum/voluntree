from django.contrib import admin
from voluntree.models import (
    User, Organization, Post, Page, 
    Notification, Volunteer, Interest, Verification, Slot, SignUp, DateTime
    )


admin.site.register(User)
admin.site.register(Organization)
admin.site.register(Post)
admin.site.register(Page)
admin.site.register(Volunteer)
admin.site.register(Notification)
admin.site.register(Interest)
admin.site.register(Verification)
admin.site.register(Slot)
admin.site.register(SignUp)
admin.site.register(DateTime)