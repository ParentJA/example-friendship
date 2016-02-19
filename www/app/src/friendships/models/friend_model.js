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