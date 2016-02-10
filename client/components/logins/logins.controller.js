'use strict';

var app = angular.module('ctLoginsApp.logins.controller', []);

app.controller('LoginsController', ['$rootScope', '$scope', '$routeParams', 'CT', '$location', '$compile', '$localStorage', '$timeout', '$window', 'Client', 'CTDebugger', 'Ping', 'DebugMe',

  function($rootScope, $scope, $routeParams, CT, $location, $compile, $localStorage, $timeout, $window, Client, CTDebugger, Ping, DebugMe) {

    $rootScope.bodylayout = 'login-layout';

    $rootScope.state = { status: 'loading', hidden: true };

    var init = function(client) {

      var head = angular.element('head');
      var template;

      var params = {
        request_uri: client.requestUri,
        clientMac: client.clientMac,
        clientIp: client.clientIp,
        apMac: client.apMac,
        uamip: client.uamip,
        tags: client.apTags
      };

      CT.init(params).then(function(results) {

        $scope.products = results.products;
        if ($location.path() === '/shop' && ($scope.products === undefined || $scope.products.length < 1)) {
          $scope.goHome();
        }
        if (results && results.splash) {
          if (results.splash.display_console === true || DebugMe.active === true) {
            doDebug();
          }
          $scope.store      = results.store;
          $scope.cart       = { cart_id: null, products: null };
          $scope.custom_url = results.splash.custom_url;
          $scope.custom_css = results.splash.custom_css;
          $scope.splash     = results.splash;
          $scope.form       = results.form.body;
          $scope.redirects  = results.redirects;
          if (results.splash.registration === true && results.form && results.form.body && results.form.body.fields ) {
            $scope.registration = true;
            console.log('Displaying a registration page');
          } else if (results.splash.registration === true) {
            console.log('Welcome back, looks like you\'ve been here before.');
          }
        } else {
          genericError();
        }
      }, function(err) {
        doDebug(err);
      });

    };

    var doDebug = function(msg) {
      CTDebugger.debug(msg);
      Ping.ct();
    };

    var genericError = function() {
      var message = 'Incompatible device, please contact support';
      $rootScope.state.errors = '<br><h1>' + message + '</h1>';

      $rootScope.bodylayout = undefined;
      $rootScope.hidden = undefined;

      $rootScope.state.hidden = undefined;
      $rootScope.state.status = undefined;
    };

    $scope.$on('$routeChangeSuccess', function () {
      Client.details().then(init);
    });

    $scope.goHome = function() {
      $location.path('/');
    };

    $scope.goShop = function() {
      $location.path('/shop');
    };
  }
]);

app.controller('LoginsShopController', ['$q', '$cookies', '$rootScope', '$scope', '$routeParams', 'CT', '$location', 'Order', '$localStorage', '$timeout', '$window',

  function($q, $cookies, $rootScope, $scope, $routeParams, CT, $location, Order, $localStorage, $timeout, $window) {

    $rootScope.bodylayout = 'login-layout';
    $rootScope.state = { status: 'loading', hidden: true, order: 'loading' };
    var cartId = $cookies.get('cartId');

    var searchParams = $localStorage.searchParams;
    if (searchParams) {
      var client = JSON.parse($localStorage.searchParams);
    }

    var init = function() {
      var deferred = $q.defer();
      CT.init({request_uri: client.requestUri, clientMac: client.clientMac, apMac: client.apMac, tags: client.apTags}).then(function(results) {
        $scope.custom_url = results.splash.custom_url;
        $scope.custom_css = results.splash.custom_css;
        $scope.splash = results.splash;
        deferred.resolve();
      }, function() {

      });
      return deferred.promise;
    };

    function updateCt() {
      var deferred = $q.defer();

      var orderId = $routeParams.orderId;
      var token = $routeParams.token || $routeParams.crypt;
      var payerId = $routeParams.PayerID;

      Order.update({cart_id: cartId, id: orderId, token: token, payerId: payerId }).$promise.then(function(results) {
        $rootScope.state = {};
        $rootScope.bodylayout = undefined;
        $scope.order = { state: results.state, orderId: results.orderId };
        handleInvalid();
        deferred.resolve();
      }, function(err) {
        handleInvalid();
        $scope.order = {errors: err, state: 'having problems'};
      });
      return deferred.promise;
    }

    var handleInvalid = function() {
      if ($scope.order === undefined || $scope.order.state !== 'pending') {
        // $window.location.href = 'http://bbc.co.uk/';
      }
    };

    if (cartId === undefined || cartId === null) {
      handleInvalid();
    } else {
      init().then(updateCt);
    }
  }
]);

app.controller('LoginsResetGuestController', ['$q', '$scope', '$routeParams', '$location', '$rootScope', 'CT',

  function($q, $scope, $routeParams, $location, $rootScope, CT) {
    CT.init({request_uri: $location.host()}).then(function(results) {
      $rootScope.bodylayout = 'login-reset';
      $scope.brand = results;
    }, function() {
    });
  }

]);

