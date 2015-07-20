'use strict';

var app = angular.module('ctLoginsApp.logins.controller', []);

app.controller('LoginsController', ['$rootScope', '$scope', '$routeParams', 'CT', '$location', '$compile', '$localStorage', '$timeout', '$window', 'Client',

  function($rootScope, $scope, $routeParams, CT, $location, $compile, $localStorage, $timeout, $window, Client) {

    // $rootScope.bodylayout = 'login-layout';

    // $rootScope.state = { status: 'loading', hidden: true };

    var init = function(client) {

      $.ajax({
        type: 'GET',
        contentType: 'application/json',
        url: 'https://c7e5c5a6.ngrok.io/api/v1/ping.json',
        success: function(data) {
          console.log(data)
        }
      });
      // var head = angular.element('head');
      // var template;

      // CT.init({request_uri: client.requestUri, clientMac: client.clientMac, apMac: client.apMac, tags: client.apTags}).then(function(results) {
      //   $scope.products = results.products;
      //   if ($location.path() === '/shop' && ($scope.products === undefined || $scope.products.length < 1)) {
      //     $scope.goHome();
      //   }
      //   $scope.store      = results.store;
      //   $scope.cart       = { cart_id: null, products: null };
      //   $scope.custom_url = results.splash.custom_url;
      //   $scope.custom_css = results.splash.custom_css;
      //   $scope.splash     = results.splash;
      //   $scope.form       = results.form.body;
      //   $scope.redirects  = results.redirects;
      // }, function(err) {

      // });

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
      var token = $routeParams.token;
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

