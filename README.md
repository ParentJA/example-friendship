# Programming Friendships in Django (Part 1 of 2)

**By Jason Parent**

Many of the most popular apps use social networking and it is easy to see why--people like to connect with each other. The best apps let users communicate, create and distribute content, and share opinions and experiences. These features are all built on a foundation of simple connections between users. The following tutorial is going to demonstrate one way to program a social network for a web app, using Django and AngularJS.

## Setup

```bash
local:~ user$ mkvirtualenv example
(example)local:~ user$ pip install Django djangorestframework django-nose lettuce
(example)local:~ user$ pip install git+https://github.com/ParentJA/example-accounts-django#egg=example-accounts-django
(example)local:~ user$ cd ~/Projects
(example)local:Projects user$ django-admin.py startproject example && cd example
```

## Requesting a Friendship

Add some users to your app. Clear any friendships that may be lingering in your database. Log in as a user. Send a friendship request to another user. Get a response that confirms the creation your friendship.

**example/friendships/features/forming_friendships.feature**

```cucumber
Feature: Forming friendships between users

  Scenario: Setup

    Given I empty my "auth.User" table
    And I add the following rows for "auth.User":
      | id | username | email             |
      | 1  | Jason    | jason@example.com |
      | 2  | Peter    | peter@example.com |
      | 3  | James    | james@example.com |
      | 4  | Casey    | casey@example.com |
      | 5  | Annie    | annie@example.com |

  Scenario: Requesting a friendship

    Given I empty my "friendships.Friendship" table
    And I log in as "Jason"

    When I send a request for a friendship with "Peter"
    Then I get a response with the following dict:
      | sender | receiver | status |
      | Jason  | Peter    | P      |
```

The first scenario has two steps. Clear the user table and then populate it with new users. 

The second scenario has four steps. First, remove any existing friendships from the database. Next, log in as one of the new users. Finally, send a friendship request to another user and examine the server response. When the server processes your request, it should

**example/terrain.py**

```python
# Third-party imports...
from lettuce import before, step, world
from nose.tools import assert_dict_equal

# Django imports...
import django
from django.apps import apps
from django.contrib.auth import get_user_model
from django.test import Client

User = None


@before.all
def setup():
    global User
    django.setup()
    User = get_user_model()


@before.each_scenario
def scenario_setup(scenario):
    world.client = Client()


@step(r'I empty my "(.+)" table')
def empty_database_table(step, model_path):
    model = apps.get_model(*model_path.split('.'))

    # Some model managers do not have a delete() method (e.g. django.contrib.auth.User).
    try:
        model.objects.delete()
    except AttributeError:
        model.objects.all().delete()


@step(r'I add the following rows for "(.+)":')
def add_database_table_rows(step, model_path):
    model = apps.get_model(*model_path.split('.'))
    model_objects = [model(**row) for row in step.hashes]
    model.objects.bulk_create(model_objects)


@step(r'I log in as "(.+)"$')
def log_in_user(step, username):
    user = User.objects.get(username=username)
    world.client.force_login(user)


@step(r'I get a response with the following dict:')
def get_response_with_dict(step):
    assert_dict_equal(step.hashes.first, world.response.json())
```

**example/friendships/features/forming_friendships_steps.py**

```python
# Third-party imports...
from lettuce import step, world

# Django imports...
from django.test import Client


@step(r'I send a request for a friendship with "(.+)"')
def send_friendship_request(step, username):
    world.response = world.client.post('/api/v1/friendships/friendship/', {
        'username': username, 
        'action': 'request'
    })
```

**example/friendships/models.py**

```python
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
```

```bash
(example)local:Projects user$ python manage.py makemigrations
(example)local:Projects user$ python manage.py migrate
```

**example/example/urls.py**

```python
# Django imports...
from django.conf.urls import include, url
from django.contrib import admin

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^api/v1/friendships/', include('friendships.urls'))    
]
```

**example/friendships/urls.py**

```python
# Django imports...
from django.conf.urls import url

# Local imports...
from .views import FriendshipView

urlpatterns = [
    url(r'friendship/$', FriendshipView.as_view())
]
```

**example/friendships/views.py**

```python
# Third-party imports...
from rest_framework import views
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK


class FriendshipView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(status=HTTP_200_OK)
```

**example/friendships/serializers.py**

```python
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
```

**example/friendships/views.py**

```python
# Third-party imports...
from rest_framework import views
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK

# Django imports...
from django.contrib.auth import get_user_model

# Local imports...
from .models import Friendship
from .serializers import FriendshipSerializer

User = get_user_model()


class FriendshipView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        other_username = request.data.get('username')
        other_user = User.objects.get(username=other_username)
        action = request.data.get('action')

        # Request friendship.
        if action == 'request':
            friendship = Friendship.objects.create(sender=request.user, receiver=other_user)
        else:
            friendship = {}

        friendship_serializer = FriendshipSerializer(friendship)

        return Response(status=HTTP_200_OK, data=friendship_serializer.data)
```

## Accepting or Rejecting a Friendship Request

**example/friendships/features/forming_friendships.feature**

```cucumber
Scenario: Accepting a friendship request

    Given I empty my "friendships.Friendship" table
    And I add the following rows for "friendships.Friendship":
      | sender_id | receiver_id | status |
      | 1         | 2           | P      |
    And I log in as "Peter"

    When I accept a friendship request from "Jason"
    Then I get a response with the following dict:
      | sender | receiver | status |
      | Jason  | Peter    | A      |
```

**example/friendships/features/forming_friendships_steps.py**

```python
@step(r'I accept a friendship request from "(.+)"')
def accept_friendship_request(step, username):
    world.response = world.client.post('/api/v1/friendships/friendship/', {
        'username': username,
        'action': 'accept'
    })
```

**example/friendships/views.py**

```python
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

        else:
            friendship = {}

        friendship_serializer = FriendshipSerializer(friendship)

        return Response(status=HTTP_200_OK, data=friendship_serializer.data)
```

**example/friendships/features/forming_friendships.feature**

```cucumber
Scenario: Rejecting a friendship request

    Given I empty my "friendships.Friendship" table
    And I add the following rows for "friendships.Friendship":
      | sender_id | receiver_id | status |
      | 1         | 2           | P      |
    And I log in as "Peter"

    When I reject a friendship request from "Jason"
    Then I get a response with the following dict:
      | sender | receiver | status |
      | Jason  | Peter    | R      |
```

**example/friendships/features/forming_friendships_steps.py**

```python
@step(r'I reject a friendship request from "(.+)"')
def reject_friendship_request(step, username):
    world.response = world.client.post('/api/v1/friendships/friendship/', {
        'username': username,
        'action': 'reject'
    })
```

**example/friendships/views.py**

```python
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
```

## Viewing Your Friends

**example/friendships/features/forming_friendships.feature**

```cucumber
Scenario: Getting current friends

    Given I empty my "friendships.Friendship" table
    And I add the following rows for "friendships.Friendship":
      | sender_id | receiver_id | status |
      | 1         | 2           | A      |
      | 1         | 3           | R      |
      | 1         | 4           | P      |
      | 5         | 1           | A      |
      | 2         | 3           | A      |
    And I log in as "Jason"

    When I get my current friends
    Then I get a response with the following list:
      | username | email             |
      | Peter    | peter@example.com |
      | Annie    | annie@example.com |
```

**example/terrain.py**

```python
# Standard library imports...
from itertools import izip_longest


@step(r'I get a response with the following list:')
def get_response_with_list(step):
    for expected, actual in izip_longest(list(step.hashes), world.response.json()):
        assert_dict_equal(expected, actual)
```

**example/friendships/features/forming_friendships_steps.py**

```python
# Standard-library imports...
from itertools import izip_longest


@step(r'I get my current friends')
def get_current_friends(step):
    world.response = world.client.get('/api/v1/friendships/friend/?status=A')
```

**example/friendships/urls.py**

```python
# Django imports...
from django.conf.urls import url

# Local imports...
from .views import FriendView, FriendshipView

urlpatterns = [
    url(r'friend/$', FriendView.as_view()),
    url(r'friendship/$', FriendshipView.as_view())
]
```

**example/friendships/views.py**

```python
# Django imports...
from django.db.models import Q

# Local imports...
from .serializers import FriendshipSerializer, UserSerializer


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
        else:
            user_list = []

        user_serializer = UserSerializer(user_list, many=True)

        return Response(status=HTTP_200_OK, data=user_serializer.data)
```

**example/friendships/serializers.py**

```python
# Django imports...
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'email')
```

**example/friendships/features/forming_friendships.feature**

```cucumber
Scenario: Getting pending friends

    Given I empty my "friendships.Friendship" table
    And I add the following rows for "friendships.Friendship":
      | sender_id | receiver_id | status |
      | 1         | 2           | P      |
      | 3         | 1           | P      |
      | 1         | 4           | A      |
      | 1         | 5           | R      |
      | 2         | 3           | P      |
    And I log in as "Jason"

    When I get my pending friends
    Then I get a response with the following list:
      | username | email             |
      | James    | james@example.com |
```

**example/friendships/features/forming_friendships_steps.py**

```python
@step(r'I get my pending friends')
def get_pending_friends(step):
    world.response = world.client.get('/api/v1/friendships/friend/?status=P')
```

**example/friendships/views.py**

```python
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

        else:
            user_list = {}

        user_serializer = UserSerializer(user_list, many=True)

        return Response(status=HTTP_200_OK, data=user_serializer.data)
```

**example/friendships/features/forming_friendships.feature**

```cucumber
Scenario: Getting users that are not friends

    Given I empty my "friendships.Friendship" table
    And I add the following rows for "friendships.Friendship":
      | sender_id | receiver_id | status |
      | 1         | 2           | P      |
      | 1         | 3           | A      |
      | 1         | 4           | R      |
    And I log in as "Jason"

    When I get users that are not friends
    Then I get a response with the following list:
      | username | email             |
      | Annie    | annie@example.com |
```

**example/friendships/features/forming_friendships_steps.py**

```python
@step(r'I get users that are not friends')
def get_users_not_friends(step):
    world.response = world.client.get('/api/v1/friendships/friend/')
```

**example/friendships/views.py**

```python
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
```

# Programming Friendships in Django (Part 2 of 2)

**By Jason Parent**

## Setup

**example/www/app/src/index.html**

```html
<!-- Unknown -->
<section ng-show="hasUser()">
  <h1>Unknown</h1>
  <ul>
    <li ng-repeat="friend in getUnknown()">{{ friend.username }}</li>
  </ul>
</section>
```

**example/www/app/src/core.js**

```javascript
function MainController($scope, AccountModel, FriendModel) {
  $scope.getUser = function getUser() {
    return AccountModel.getUser();
  };

  $scope.hasUser = function hasUser() {
    return AccountModel.hasUser();
  };

  $scope.getUnknown = function getUnknown() {
    return FriendModel.getUnknown();
  };
}

angular.module("example", ["example-accounts"])
  .controller("MainController", ["$scope", "AccountModel", "FriendModel", MainController]);
```

**example/www/app/src/friendships/models/friend_model.js**

```javascript
(function (window, angular, undefined) {

  "use strict";

  function FriendModel() {
    var unknown = [];

    this.getUnknown = function getUnkown() {
      return unknown;
    };

    this.updateList = function updateList(list, status) {
      unknown = list;
    };
  }

  angular.module("example")
    .service("FriendModel", [FriendModel]);

})(window, window.angular);
```

**example/www/app/src/core.js**

```javascript
function MainController($scope, AccountModel, FriendModel, loadFriendService) {
  $scope.getUser = function getUser() {
    return AccountModel.getUser();
  };

  $scope.hasUser = function hasUser() {
    return AccountModel.hasUser();
  };

  $scope.getUnknown = function getUnknown() {
    return FriendModel.getUnknown();
  };

  if (AccountModel.hasUser()) {
    loadFriendService();
  }
}

angular.module("example", ["example-accounts"])
  .controller("MainController", ["$scope", "AccountModel", "FriendModel", "loadFriendService", MainController]);
```

**example/www/app/src/friendships/services/load_friend_service.js**

```javascript
(function (window, angular, undefined) {

  "use strict";

  function loadFriendService($http, $q, BASE_URL, FriendModel) {
    return function (status) {
      var deferred = $q.defer();
      $http.get(BASE_URL + "friendships/friend/", {
        params: {status: status}
      }).then(function (response) {
        FriendModel.updateList(response.data, status);
        deferred.resolve(FriendModel);
      }, function (response) {
        deferred.reject(response.data);
      });
      return deferred.promise;
    };
  }

  angular.module("example")
    .factory("loadFriendService", ["$http", "$q", "BASE_URL", "FriendModel", loadFriendService]);

})(window, window.angular);
```

**example/www/app/src/accounts/views/sign_up.js**

```javascript
(function (window, angular, undefined) {

  "use strict";

  function signUp() {
    return {
      restrict: "A",
      template: "" +
      "<form ng-submit='signUp()'>" +
      "<input type='text' placeholder='username' ng-model='username' required>" +
      "<input type='text' placeholder='email' ng-model='email' required>" +
      "<input type='password' placeholder='password' ng-model='password' required>" +
      "<button type='submit'>Submit</button>" +
      "</form>",
      scope: {},
      controller: "SignUpController"
    };
  }

  function SignUpController($scope, loadFriendService, signUpService) {
    $scope.username = null;
    $scope.email = null;
    $scope.password = null;

    $scope.signUp = function signUp() {
      signUpService($scope.username, $scope.email, $scope.password).then(function () {
        loadFriendService();
      });
    };
  }

  angular.module("example")
    .directive("signUp", [signUp])
    .controller("SignUpController", ["$scope", "loadFriendService", "signUpService", SignUpController]);

})(window, window.angular);
```

**example/www/app/src/accounts/views/log_in.js**

```javascript
(function (window, angular, undefined) {

  "use strict";

  function logIn() {
    return {
      restrict: "A",
      template: "" +
      "<form ng-submit='logIn()'>" +
      "<input type='text' ng-model='username' required>" +
      "<input type='password' ng-model='password' required>" +
      "<button type='submit'>Submit</button>" +
      "</form>",
      scope: {},
      controller: "LogInController"
    };
  }

  function LogInController($scope, loadFriendService, logInService) {
    $scope.username = null;
    $scope.password = null;

    $scope.logIn = function logIn() {
      logInService($scope.username, $scope.password).then(function () {
        loadFriendService();
      });
    };
  }

  angular.module("example")
    .directive("logIn", [logIn])
    .controller("LogInController", ["$scope", "loadFriendService", "logInService", LogInController]);

})(window, window.angular);
```

**example/www/app/src/index.html**

```html
<!-- Unknown -->
<section ng-show="hasUser()">
  <h1>Unknown</h1>
  <ul>
    <li ng-repeat="friend in getUnknown()">{{ friend.username }}</li>
  </ul>
</section>

<!-- Current friends -->
<section ng-show="hasUser()">
  <h1>Current</h1>
  <ul>
    <li ng-repeat="friend in getCurrent()">{{ friend.username }}</li>
  </ul>
</section>

<!-- Pending friends -->
<section ng-show="hasUser()">
  <h1>Pending</h1>
  <ul>
    <li ng-repeat="friend in getPending()">{{ friend.username }}</li>
  </ul>
</section>
```

**example/www/app/src/core.js**

```javascript
function MainController($scope, AccountModel, FriendModel, loadFriendService) {
  $scope.getUser = function getUser() {
    return AccountModel.getUser();
  };

  $scope.hasUser = function hasUser() {
    return AccountModel.hasUser();
  };

  $scope.getCurrent = function getCurrent() {
    return FriendModel.getCurrent();
  };

  $scope.getPending = function getPending() {
    return FriendModel.getPending();
  };

  $scope.getUnknown = function getUnknown() {
    return FriendModel.getUnknown();
  };

  if (AccountModel.hasUser()) {
    // Load current, pending, and unknown friends.
    loadFriendService("A");
    loadFriendService("P");
    loadFriendService();
  }
}

angular.module("example", ["example-accounts"])
  .controller("MainController", ["$scope", "AccountModel", "FriendModel", "loadFriendService", MainController]);
```

**example/www/app/src/friendships/models/friend_model.js**

```javascript
(function (window, angular, undefined) {

  "use strict";

  function FriendModel(AccountModel) {
    var current = [];
    var pending = [];
    var unknown = [];

    this.getCurrent = function getCurrent() {
      return current;
    };

    this.getPending = function getPending() {
      return pending;
    };

    this.getUnknown = function getUnknown() {
      return unknown;
    };

    this.updateList = function updateList(list, status) {
      switch (status) {
        case "A":
          current = list;
          break;
        case "P":
          pending = list;
          break;
        default:
          unknown = list;
      }
    };
  }

  angular.module("example")
    .service("FriendModel", ["AccountModel", FriendModel]);

})(window, window.angular);
```

**example/www/app/src/index.html**

```html
<!-- Unknown -->
<section ng-show="hasUser()">
  <h1>Unknown</h1>
  <ul>
    <li ng-repeat="friend in getUnknown()">
      {{ friend.username }}
      <button type="button" ng-click="request(friend)">Request</button>
    </li>
  </ul>
</section>

<!-- Current friends -->
<section ng-show="hasUser()">
  <h1>Current</h1>
  <ul>
    <li ng-repeat="friend in getCurrent()">{{ friend.username }}</li>
  </ul>
</section>

<!-- Pending friends -->
<section ng-show="hasUser()">
  <h1>Pending</h1>
  <ul>
    <li ng-repeat="friend in getPending()">
      {{ friend.username }}
      <button type="button" ng-click="accept(friend)">Accept</button>
      <button type="button" ng-click="reject(friend)">Reject</button>
    </li>
  </ul>
</section>
```

**example/www/app/src/core.js**

```javascript
function MainController($scope, AccountModel, FriendModel, loadFriendService, saveFriendshipService) {
  $scope.getUser = function getUser() {
    return AccountModel.getUser();
  };

  $scope.hasUser = function hasUser() {
    return AccountModel.hasUser();
  };

  $scope.getCurrent = function getCurrent() {
    return FriendModel.getCurrent();
  };

  $scope.getPending = function getPending() {
    return FriendModel.getPending();
  };

  $scope.getUnknown = function getUnknown() {
    return FriendModel.getUnknown();
  };

  $scope.request = function request(friend) {
    saveFriendshipService(user.username, "request");
  };

  $scope.accept = function accept(friend) {
    saveFriendshipService(user.username, "accept");
  };

  $scope.reject = function reject(friend) {
    saveFriendshipService(user.username, "reject");
  };

  if (AccountModel.hasUser()) {
    // Load current, pending, and unknown friends.
    loadFriendService("A");
    loadFriendService("P");
    loadFriendService();
  }
}

angular.module("example", ["example-accounts"])
  .controller("MainController", ["$scope", "AccountModel", "FriendModel", "loadFriendService", "saveFriendshipService", MainController]);
```

**example/www/app/src/friendships/services/save_friendship_service.js**

```javascript
(function (window, angular, undefined) {

  "use strict";

  function saveFriendshipService($http, $q, BASE_URL, FriendModel) {
    return function (username, action) {
      var deferred = $q.defer();
      $http.post(BASE_URL + "friendships/friendship/", {
        username: username,
        action: action
      }).then(function (response) {
        FriendModel.updateDict(response.data, action);
        deferred.resolve(FriendModel);
      }, function (response) {
        deferred.reject(response.data);
      });
      return deferred.promise;
    };
  }

  angular.module("example")
    .factory("saveFriendshipService", ["$http", "$q", "BASE_URL", "FriendModel", saveFriendshipService]);

})(window, window.angular);
```

**example/www/app/src/friendships/models/friend_model.js**

```javascript
(function (window, angular, undefined) {

  "use strict";

  function FriendModel(AccountModel) {
    var current = [];
    var pending = [];
    var unknown = [];

    function removeUserFromList(list, user) {
      for (var i = 0, numUsers = list.length; i < numUsers; i++) {
        if (list[i].username == user) {
          return list.splice(i, 1).pop();
        }
      }
      return null;
    }

    this.getCurrent = function getCurrent() {
      return current;
    };

    this.getPending = function getPending() {
      return pending;
    };

    this.getUnknown = function getUnknown() {
      return unknown;
    };

    this.updateDict = function updateDict(dict, action) {
      var otherUser = (dict.sender == AccountModel.getUser().username) ? dict.receiver : dict.sender;
      switch (action) {
        case "request":
          removeUserFromList(unknown, otherUser);
          break;
        case "accept":
          current.push(removeUserFromList(pending, otherUser));
          break;
        case "reject":
          removeUserFromList(pending, otherUser);
          break;
      }
    };

    this.updateList = function updateList(list, status) {
      switch (status) {
        case "A":
          current = list;
          break;
        case "P":
          pending = list;
          break;
        default:
          unknown = list;
      }
    };
  }

  angular.module("example")
    .service("FriendModel", ["AccountModel", FriendModel]);

})(window, window.angular);
```

**example/www/app/src/accounts/views/sign_up.js**

```javascript
function SignUpController($scope, loadFriendService, signUpService) {
$scope.username = null;
$scope.email = null;
$scope.password = null;

$scope.signUp = function signUp() {
  signUpService($scope.username, $scope.email, $scope.password).then(function () {
      loadFriendService("A");
      loadFriendService("P");
      loadFriendService();
    });
  };
} 
```

**example/www/app/src/accounts/views/log_in.js**

```javascript
function LogInController($scope, loadFriendService, logInService) {
  $scope.username = null;
  $scope.password = null;

  $scope.logIn = function logIn() {
    logInService($scope.username, $scope.password).then(function () {
      loadFriendService();
    });
  };
}
```

## Using Directives

**example/www/app/src/index.html**

```html
<!-- Unknown -->
<section ng-show="hasUser()">
  <h1>Unknown</h1>
  <ul>
    <li friend="friend" ng-repeat="friend in getUnknown()"></li>
  </ul>
</section>

<!-- Current friends -->
<section ng-show="hasUser()">
  <h1>Current</h1>
  <ul>
    <li friend="friend" data-status="A" ng-repeat="friend in getCurrent()"></li>
  </ul>
</section>

<!-- Pending friends -->
<section ng-show="hasUser()">
  <h1>Pending</h1>
  <ul>
    <li friend="friend" data-status="P" ng-repeat="friend in getPending()"></li>
  </ul>
</section>
```

**example/www/app/src/core.js**

```javascript
function MainController($scope, AccountModel, FriendModel, loadFriendService) {
  $scope.getUser = function getUser() {
    return AccountModel.getUser();
  };

  $scope.hasUser = function hasUser() {
    return AccountModel.hasUser();
  };

  $scope.getCurrent = function getCurrent() {
    return FriendModel.getCurrent();
  };

  $scope.getPending = function getPending() {
    return FriendModel.getPending();
  };

  $scope.getUnknown = function getUnknown() {
    return FriendModel.getUnknown();
  };

  if (AccountModel.hasUser()) {
    // Load current, pending, and unknown friends.
    loadFriendService("A");
    loadFriendService("P");
    loadFriendService();
  }
}

angular.module("example", ["example-accounts"])
  .controller("MainController", ["$scope", "AccountModel", "FriendModel", "loadFriendService", MainController]);
```

**example/www/app/src/friendships/views/friend.js**

```javascript
(function (window, angular, undefined) {

  "use strict";

  function friend() {
    return {
      restrict: "A",
      template: "" +
      "<div>" +
      "{{ friend.username }}" +
      "<button type='button' ng-if='isUnknown' ng-click='request(friend)'>Request</button>" +
      "<button type='button' ng-if='isPending' ng-click='accept(friend)'>Accept</button>" +
      "<button type='button' ng-if='isPending' ng-click='reject(friend)'>Reject</button>" +
      "</div>",
      scope: {
        friend: "=",
        status: "@"
      },
      controller: "FriendController"
    };
  }

  function FriendController($scope, saveFriendshipService) {
    $scope.isPending = ($scope.status == 'P');
    $scope.isUnknown = ($scope.status == null);

    $scope.request = function request(user) {
      saveFriendshipService(user.username, "request");
    };

    $scope.accept = function accept(user) {
      saveFriendshipService(user.username, "accept");
    };

    $scope.reject = function reject(user) {
      saveFriendshipService(user.username, "reject");
    };
  }

  angular.module("example")
    .directive("friend", [friend])
    .controller("FriendController", ["$scope", "saveFriendshipService", FriendController]);

})(window, window.angular);
```
