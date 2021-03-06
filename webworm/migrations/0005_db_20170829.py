# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-09-02 12:32
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('webworm', '0004_db_dev'),
    ]

    operations = [
        migrations.CreateModel(
            name='FileTypes',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, max_length=20, null=True, unique=True)),
                ('extension', models.CharField(blank=True, max_length=20, null=True, unique=True)),
                ('description', models.CharField(blank=True, max_length=700, null=True)),
            ],
            options={
                'db_table': 'file_types',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='ZenodoFiles',
            fields=[
                ('id', models.CharField(max_length=120, primary_key=True, serialize=False)),
                ('filename', models.CharField(blank=True, max_length=250, null=True)),
                ('filesize', models.BigIntegerField(blank=True, null=True)),
                ('checksum', models.CharField(blank=True, max_length=32, null=True)),
                ('download_link', models.CharField(blank=True, max_length=2083, null=True)),
            ],
            options={
                'db_table': 'zenodo_files',
                'managed': False,
            },
        ),
    ]
