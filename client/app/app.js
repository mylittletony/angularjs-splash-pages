'use strict';

var app = angular.module('ctLoginsApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'ngStorage',
  'ctLoginsApp.controllers',
  'ctLoginsApp.services',
  'ctLoginsApp.directives',
  'config'
]);

app.config(function ($routeProvider, $locationProvider, $httpProvider) {

  $httpProvider.interceptors.push('apInterceptor');

  // console.log('%cI do it with Tony everyday.', 'font: 3em sans-serif; color: red;');
  // console.log('%cFrom time to time, we\'ll need some information from this console. This will help us debug problems you\'re having, we hope it\'s not too much bother.', 'font: 1.4em sans-serif; color: black; line-height: 1.4em;');
  // console.log('%cThank you for for helping us build the awesome.', 'font: 1em sans-serif; color: black; line-height: 4em; border-bottom: 1px solid black;');

  $httpProvider.defaults.useXDomain = true;
  delete $httpProvider.defaults.headers.commonXRequestedWith;
  $httpProvider.defaults.headers.common.Accept = 'application/json';
  $httpProvider.defaults.headers.common.ContentType = 'application/json';

  $routeProvider
    .when('/oh', {
      templateUrl: 'components/layouts/oh.html',
      reloadOnSearch: false,
      controller: 'LoginsController'
    })
    .when('/welcome', {
      templateUrl: 'components/logins/welcome.html',
      reloadOnSearch: false,
      controller: 'LoginsController'
    })
    .when('/shop', {
      templateUrl: 'components/logins/index.html',
      reloadOnSearch: false,
      controller: 'LoginsController'
    })
    .when('/reset', {
      templateUrl: 'components/guests/reset.html',
      reloadOnSearch: false,
      controller: 'LoginsResetGuestController'
    })
    .when('/confirm', {
      templateUrl: 'components/orders/confirm.html',
      reloadOnSearch: false,
      controller: 'LoginsShopController'
    })
    .when('/hello', {
      templateUrl: 'components/logins/hello.html',
    })
    .when('/:splash_id', {
      templateUrl: 'components/logins/index.html',
      reloadOnSearch: false,
      controller: 'LoginsController'
    })
    .when('/', {
      templateUrl: 'components/logins/index.html',
      reloadOnSearch: false,
      controller: 'LoginsController'
    })
    .otherwise({
      redirectTo: '/'
    });

  $locationProvider.html5Mode(true);
});

app.constant('DEVICES', {
  ct: '1',
  aruba: '2',
  meraki: '3',
  ruckus: '4',
  aerohive: '5',
  xirrus: '6',
  vsz: '7',
  microtik: '8',
  preview: '500',
  unknown: '999'
});

app.factory('apInterceptor', ['$q', '$location', '$rootScope', '$routeParams', 'DEVICES',
  function($q, $location, $rootScope, $routeParams, DEVICES) {
    return {

      response: function (response) {
        return response;
      },

      request: function(config) {
        if ($routeParams.debug) {
          console.log($routeParams);
        }
        var setDevice = function() {
          if ($routeParams.preview === 'true') {
            $rootScope.deviceId = DEVICES.preview;
          } else if ($routeParams.uamip !== undefined && $routeParams.uamport !== undefined && $routeParams.called !== undefined) {
            $rootScope.deviceId = DEVICES.ct;
          } else if ( $routeParams.switchip !== undefined && $routeParams.cmd !== undefined ) {
            $rootScope.deviceId = DEVICES.aruba;
          } else if ( $routeParams['Called-Station-Id'] !== undefined && $routeParams['NAS-ID'] !== undefined) {
            $rootScope.deviceId = DEVICES.aerohive;
          } else if ( $routeParams.login_url !== undefined && $routeParams.ap_tags !== undefined) {
            $rootScope.deviceId = DEVICES.meraki;
          } else if ($routeParams.uamip !== undefined && $routeParams.uamport !== undefined && $routeParams.apmac !== undefined) {
            $rootScope.deviceId = DEVICES.xirrus;
          } else if ( $routeParams.sip !== undefined && $routeParams.nbiIP !== undefined) {
            $rootScope.deviceId = DEVICES.vsz;
          } else if ( $routeParams.sip !== undefined && $routeParams.uip !== undefined && $routeParams.nbiIp === undefined) {
            $rootScope.deviceId = DEVICES.ruckus;
          } else if ( $routeParams.mac_client !== undefined && $routeParams.device !== undefined ) {
            $rootScope.deviceId = DEVICES.microtik;
          } else if ( $location.path() !== '/confirm' && $location.path() !== '/reset') {
            // $location.path('/hello');
          }
        };

        $rootScope.$on('$routeChangeSuccess', function () {
          if ($rootScope.deviceId === undefined) {
            setDevice();
          }
        });
        return config;
      },

      responseError: function(response) {
        return $q.reject(response);
      }
    };
  }
]);

