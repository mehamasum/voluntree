# Generated by Django 3.0.6 on 2020-07-13 19:05

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('voluntree', '0034_upload'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='upload',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='posts', to='voluntree.Upload'),
        ),
    ]
