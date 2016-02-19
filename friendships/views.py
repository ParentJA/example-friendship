# Third-party imports...
from rest_framework import views
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK

# Django imports...
from django.contrib.auth import get_user_model
from django.db.models import Q

# Local imports...
from .models import Friendship
from .serializers import FriendshipSerializer
from accounts.serializers import UserSerializer

User = get_user_model()


def get_friend_list(user, friendship_list):
    return set([f.sender if f.receiver == user else f.receiver for f in friendship_list])


class FriendView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        status = request.query_params.get('status')

        # Query friendships including user.
        query = Q(sender=request.user) | Q(receiver=request.user)

        # Current friends.
        if status == 'A':
            friendship_list = Friendship.objects.filter(status=status).filter(query)
            user_list = get_friend_list(request.user, friendship_list=friendship_list)

        # Pending friends.
        elif status == 'P':
            friendship_list = Friendship.objects.filter(status=status, receiver=request.user)
            user_list = get_friend_list(request.user, friendship_list=friendship_list)

        # Users that are not friends.
        else:
            friendship_list = Friendship.objects.filter(query)
            friend_list = get_friend_list(request.user, friendship_list=friendship_list)
            user_list = User.objects.exclude(username=request.user.username).filter(
                ~Q(username__in=[f.username for f in friend_list])
            )

        user_serializer = UserSerializer(user_list, many=True)

        return Response(status=HTTP_200_OK, data=user_serializer.data)


class FriendshipView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        other_username = request.data.get('username')
        other_user = User.objects.get(username=other_username)
        action = request.data.get('action')

        # Request friendship.
        if action == 'request':
            friendship = Friendship.objects.create(sender=request.user, receiver=other_user)

        # Accept friendship request.
        elif action == 'accept':
            friendship = Friendship.objects.get(sender=other_user, receiver=request.user)
            friendship.status = 'A'
            friendship.save()

        # Reject friendship request.
        elif action == 'reject':
            friendship = Friendship.objects.get(sender=other_user, receiver=request.user)
            friendship.status = 'R'
            friendship.save()

        else:
            friendship = {}

        friendship_serializer = FriendshipSerializer(friendship)

        return Response(status=HTTP_200_OK, data=friendship_serializer.data)
