(function () {
  'use strict';

  angular
    .module('launchpadApp.dashboard')
    .controller('DashboardController', DashboardController);

  DashboardController.$inject = ['$http', '$log', 'API_URL'];

  function DashboardController($http, $log, API_URL) {
    $http.get(`${API_URL}/users`)
      .then(response => {
        $log.log(response.data);
      }); // Temporary test for authentication
  }

}());




