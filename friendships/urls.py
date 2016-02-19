# Django imports...
from django.conf.urls import url

# Local imports...
from .views import FriendView, FriendshipView

urlpatterns = [
    url(r'friend/$', FriendView.as_view()),
    url(r'friendship/$', FriendshipView.as_view())
]
