# Third-party imports...
from rest_framework import serializers

# Local imports...
from .models import Friendship


class FriendshipSerializer(serializers.ModelSerializer):
    sender = serializers.SlugRelatedField(slug_field='username', read_only=True)
    receiver = serializers.SlugRelatedField(slug_field='username', read_only=True)

    class Meta:
        model = Friendship
        fields = ('sender', 'receiver', 'status')
