(function () {
  'use strict';

  /**
   * @ngdoc service
   * @name core.service:routerHelper
   * @description
   * Helper service for registering routes from many independent modules.  Can be called from any module to register
   * routes.  Taken directly from the Johnpapa Angular Style Guide.
   */
  angular
    .module('voyage.core')
    .provider('routerHelper', routerHelperProvider);

  routerHelperProvider.$inject = ['$stateProvider', '$urlRouterProvider'];

  function routerHelperProvider($stateProvider, $urlRouterProvider) {
    /* jshint validthis:true */
    this.$get = RouterHelper;

    RouterHelper.$inject = ['$state'];

    function RouterHelper($state) {
      let hasOtherwise = false;

      const service = {
        configureStates,
        getStates
      };

      return service;

      /**
       * @ngdoc method
       * @name configureStates
       * @methodOf core.service:routerHelper
       * @description
       * Registers states and on 'otherwise' condition for the module calling it.
       * @param {Array} states An array of state objects to be registered
       * @param {Array} otherwisePath The url to navigate to if the current url doesn't match a state
       */
      function configureStates(states, otherwisePath) {
        states.forEach(state => $stateProvider.state(state.state, state.config));

        if (otherwisePath && !hasOtherwise) {
          hasOtherwise = true;
          $urlRouterProvider.otherwise(otherwisePath);
        }
      }

      function getStates() {
        return $state.get();
      }
    }
  }
}());
