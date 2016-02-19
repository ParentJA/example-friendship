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