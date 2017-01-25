(function () {
  'use strict';

  angular
    .module('voyage.app')
    .config(appConfig);

  appConfig.$inject = ['$stateProvider', '$urlRouterProvider'];

  function appConfig($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/dashboard');

    $stateProvider

      .state('main', {
        abstract: true,
        templateUrl: 'app/main-navigation/side-menu/side-menu.html',
        controller: 'SideMenuController',
        controllerAs: 'vm'
      })

      .state('main.dashboard', {
        url: '/dashboard',
        templateUrl: 'app/dashboard/dashboard.html',
        controller: 'DashboardController',
        controllerAs: 'vm'
      });
  }

}());
