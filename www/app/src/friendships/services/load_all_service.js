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