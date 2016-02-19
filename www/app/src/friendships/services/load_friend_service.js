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