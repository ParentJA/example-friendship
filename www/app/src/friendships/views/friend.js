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