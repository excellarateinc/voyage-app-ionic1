(function () {
  'use strict';

  /**
   * Oauth 2 authentication module for Voyage
   * @module voyage.authentication
   * @description
   * Core module for Voyage, contains all common dependencies so each module can access the dependencies by simply
   * importing the core module.
   */
  angular
    .module('voyage.core', [
      'ionic',
      'ngCookies',
      'ngCordova',
      'voyage.constants'
    ]);
}());
