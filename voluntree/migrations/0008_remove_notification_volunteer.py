# Generated by Django 3.0.6 on 2020-05-27 06:11

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('voluntree', '0007_volunteer_facebook_page_id'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='notification',
            name='Volunteer',
        ),
    ]
