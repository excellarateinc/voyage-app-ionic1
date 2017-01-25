(function () {
  'use strict';

  angular
    .module('launchpadApp.authentication')
    .factory('authenticationService', authenticationService);

  authenticationService.$inject = ['$http', '$location', '$rootScope', '$q', '$state', '$ionicHistory', '$cordovaInAppBrowser', 'tokenService', 'API_URL', 'SERVER_URL'];

  function authenticationService($http, $location, $rootScope, $q, $state, $ionicHistory, $cordovaInAppBrowser, tokenService, API_URL, SERVER_URL) {

    return {
      initialize,
      ionicLogin,
      register,
      logout
    };

    function initialize() {
      redirectToLoginIfNoToken();
      handleEntryFromOauthRedirect();
      placeTokenOnHttpHeader();
    }

    function ionicLogin() {
      const onLoadStart = $rootScope.$on('$cordovaInAppBrowser:loadstart', ionicOnOauthCallbackStoreToken); // eslint-disable-line no-unused-vars

      ionicOpenOauthInAppBrowser();
    }

    function register(email, firstName, lastName, password, confirmPassword) {
      const user = {
        email,
        firstName,
        lastName,
        password,
        confirmPassword
      };

      return $http.post(`${API_URL}/account/register`, user)
        .then(response => response.data)
        .catch(failure => $q.reject(failure.data));
    }

    function logout() {
      tokenService.deleteToken();
      $state.go('login');
    }

    function redirectToLoginIfNoToken() {
      if (!$location.search().access_token && !tokenService.getToken()) {
        $state.go('login');
      }
    }

    function handleEntryFromOauthRedirect() {
      const accessToken = $location.search().access_token;

      if (accessToken) {
        const expiresIn = parseInt($location.search().expires_in);
        const expirationDate = convertExpiresInSecondsToExpirationDate(expiresIn);
        tokenService.setToken(accessToken, expirationDate);
      }
    }

    function placeTokenOnHttpHeader() {
      const token = tokenService.getToken();
      $http.defaults.headers.common.Authorization = `Bearer ${token}`;
    }

    function convertExpiresInSecondsToExpirationDate(expiresIn) {
      const expirationDate = new Date();
      expirationDate.setSeconds(expirationDate.getSeconds() + expiresIn);
      return expirationDate;
    }

    function getParameterByName(name, url) {
      const fixedName = name.replace(/[[\]]/g, "\\$&");
      const regex = new RegExp(`[?&]${fixedName}(=([^&#]*)|&|#|$)`);
      const results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    function ionicOpenOauthInAppBrowser() {
      const formHtml = removeExcessFormatting(`
        <!DOCTYPE html>
        <html>
        <head>
          <script>
            window.onload = function() {
              document.loginForm.submit();
            }
          </script>
        </head>
        <body>
          <form name="loginForm" method="POST" action="${ SERVER_URL }/oauth/authorize">
            <input id="client_id" type="hidden" name="client_id" value="client-super" />
            <input id="redirect_uri" type="hidden" name="redirect_uri" value="http://localhost:3000/#/?fix=1" />
            <input id="response_type" type="hidden" name="response_type" value="token"/>
            <input id="state" type="hidden" name="state" value="test" />
          </form>
        </body>
        </html>
      `);

      $cordovaInAppBrowser.open(`data:text/html,${encodeURIComponent(formHtml)}`, '_blank');
    }

    function ionicOnOauthCallbackStoreToken(angularEvent, inAppBrowserEvent) {
      const accessToken = getParameterByName('access_token', inAppBrowserEvent.url);

      if (accessToken) {
        const expiresInParam = getParameterByName('expires_in', inAppBrowserEvent.url);
        const expiresIn = parseInt(expiresInParam);
        const expirationDate = convertExpiresInSecondsToExpirationDate(expiresIn);
        tokenService.setToken(accessToken, expirationDate);
        placeTokenOnHttpHeader();
        $cordovaInAppBrowser.close();
        $ionicHistory.clearCache()
          .then(() => $location.url('/'));
      }
    }

    function removeExcessFormatting(formHtml) {
      return formHtml.replace(/\s+/g, ' ').trim();
    }
  }
}());
