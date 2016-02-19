(function (window, angular, undefined) {

  "use strict";

  function HttpConfig($httpProvider) {
    $httpProvider.defaults.xsrfHeaderName = "X-CSRFToken";
    $httpProvider.defaults.xsrfCookieName = "csrftoken";
  }

  function MainController($scope, AccountModel, FriendModel, loadAllService) {
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

    activate();

    function activate() {
      if (AccountModel.hasUser()) {
        loadAllService();
      }
    }
  }

  angular.module("example", ["example-accounts"])
    .constant("BASE_URL", "/api/v1/")
    .config(["$httpProvider", HttpConfig])
    .controller("MainController", [
      "$scope", "AccountModel", "FriendModel", "loadAllService", MainController
    ]);

})(window, window.angular);
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

    this.clear = function clear() {
      current = [];
      pending = [];
      unknown = [];
    };

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
(function (window, angular, undefined) {

  "use strict";

  function loadAllService($q, loadFriendService) {
    return function () {
      var deferred = $q.defer();
      $q.all({
        current: loadFriendService("A"),
        pending: loadFriendService("P"),
        unknown: loadFriendService()
      }).then(function (response) {
        deferred.resolve(response);
      }, function (response) {
        deferred.reject(response);
      });
      return deferred.promise;
    };
  }

  angular.module("example")
    .factory("loadAllService", ["$q", "loadFriendService", loadAllService]);

})(window, window.angular);
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