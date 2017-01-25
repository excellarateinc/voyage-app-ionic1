(function () {
  'use strict';

  angular
    .module('launchpadApp.authentication')
    .controller('LoginController', LoginController);

  LoginController.$inject = ['authenticationService'];

  function LoginController(authenticationService) {
    const vm = this;
    vm.ionicLogin = authenticationService.ionicLogin;

    // TODO: Pull this check out into a separate service
    vm.isOnPhone = ionic.Platform.isWebView();   // eslint-disable-line no-undef
  }

}());


