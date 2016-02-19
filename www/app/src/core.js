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