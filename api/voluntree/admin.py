from django.contrib import admin
from voluntree.models import (
    User, Organization, PostMetaData, Post, Page, 
    Notification, Volunteer, Interest
    )


admin.site.register(User)
admin.site.register(Organization)
admin.site.register(PostMetaData)
admin.site.register(Post)
admin.site.register(Page)
admin.site.register(Volunteer)
admin.site.register(Notification)
admin.site.register(Interest)