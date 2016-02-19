# Django imports...
from django.conf import settings
from django.db import models

AUTH_USER_MODEL = getattr(settings, 'AUTH_USER_MODEL')


class Friendship(models.Model):
    FRIENDSHIP_STATUSES = [
        ('P', 'pending'),
        ('A', 'accepted'),
        ('R', 'rejected')
    ]

    sender = models.ForeignKey(AUTH_USER_MODEL, related_name='sent_friendships')
    receiver = models.ForeignKey(AUTH_USER_MODEL, related_name='received_friendships')
    status = models.CharField(max_length=1, choices=FRIENDSHIP_STATUSES, default='P')

    class Meta:
        unique_together = ('sender', 'receiver')
