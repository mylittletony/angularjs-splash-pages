'use strict';

var app = angular.module('ctLoginsApp.tony.services', ['ngResource']);

app.factory('CT', ['$routeParams', '$timeout', '$cookies', '$http', '$q', '$rootScope', '$location', '$window', 'Coova', 'Client', 'Tony', 'Aruba', 'Xirrus', 'Ruckus', 'API_END_POINT', '$sce',
  function($routeParams, $timeout, $cookies, $http, $q, $rootScope, $location, $window, Coova, Client, Tony, Aruba, Xirrus, Ruckus, API_END_POINT, $sce) {

    var auth, client, loginDetails = {};

    function init(params) {
      var deferred = $q.defer();
      params = params || {};
      params.splash_id = $routeParams.splash_id;
      getLogins(params).then(function(results) {
        if (results.error) {
          genericError(results.message);
          deferred.reject(results.message);
        } else {
          if (results.archived === true) {
            archivedLocation();
            deferred.reject(results);
          }
          else if ( results.error ) {
            var msg = results.error;
            genericError(msg);
            deferred.reject(results);
          } else {
            if ($location.path() === '/oh') {
              $location.path('');
            }
            deferred.resolve(results);
          }
        }

      }, function(err) {
        var generic =
            '<h2>Captive Portal Assistant Error.</h2>'+
            '<p>Please close this window, your device cannot connect to the Internet.</p>';
        var msg = err || generic;
        genericError(msg);
        deferred.reject(err);
      });

      return deferred.promise;

    }

    var archivedLocation = function() {
      var msg = '<p>This splash page has been archived and you can <b>no longer login</b>.</p><p>If you think this is an error, please contact the owner of the Wi-Fi Network</p>';
      genericError(msg);
    };

    var genericError = function(msg) {
      clearUp();
      var message = (msg.message === '' || msg.message === null || msg.message === undefined) ? msg : msg.message;
      $rootScope.state.errors = '<h1>' + message + '</h1>';
      $rootScope.bodylayout = 'login-error' ;
      // $timeout(function() {
      //   $window.location.href = 'http://bbc.co.uk/';
      // },1500);
    };

    var clearUp = function() {
      $rootScope.bodylayout = undefined;
      $rootScope.hidden = undefined;

      $rootScope.state.hidden = undefined;
      $rootScope.state.status = undefined;
    };

    var getLogins = function(options) {
      options.v = 2;
      var deferred = $q.defer();
      options.callback = 'JSON_CALLBACK';
      $http({
        method: 'JSONP',
        url: API_END_POINT + '/logins',
        params: options
      }).
      success(function(msg) {
        deferred.resolve(msg);
      }).
      error(function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    };

    function login(params) {

      var deferred = $q.defer();

      params = params || {};

      loginDetails.username           = params.username;
      loginDetails.password           = params.password;
      loginDetails.email              = params.email;
      loginDetails.newsletter         = params.newsletter;
      loginDetails.token              = params.token;
      loginDetails.expires            = params.expires;
      loginDetails.guestId            = params.guestId;
      loginDetails.userId             = params.userId;
      loginDetails.memberId           = params.memberId;
      loginDetails.signature          = params.signature;
      loginDetails.signature_order    = params.signature_order;
      loginDetails.signature_version  = params.signature_version;

      Client.details()
      .then(function(resp) {
        client = resp;
        status()
        .then(function(coovaResp) {
          loginDetails.authResp = coovaResp;
          createLogin()
          .then(function(response) {
            // Meraki login if state is present in response //
            if (response.state !== undefined) {
              if (response.state === 1) {
                deferred.resolve();
              } else {
                deferred.reject(response);
              }
            } else {
              finaliseLogin(response)
              .then(function() {
                deferred.resolve(auth);
              }, function(err) {
                deferred.reject(err);
              });
            }
          }, function(err) {
            deferred.reject(err);
          });
        });
      }, function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    function logout() {

    }

    function me () {

    }

    function addToCart(params) {
      var deferred = $q.defer();
      Tony.addToCart({store_id: params.store_id, product_ids: params.product_ids}).$promise.then(function(res) {
        if (res !== undefined && res.cart !== undefined) {
          $cookies.put('cartId', res.cart.cart_id);
        } else {
          $cookies.remove('cartId');
        }
        deferred.resolve(res);
      }, function(err) {
        $cookies.remove('cartId');
        deferred.reject(err);
      });
      return deferred.promise;
    }

    function getCart(id) {
      var deferred = $q.defer();
      Tony.getCart({id: id}).$promise.then(function(res) {
        deferred.resolve(res);
      }, function(err) {
        $cookies.remove('cartId');
        deferred.reject(err);
      });
      return deferred.promise;
    }

    function checkin(params) {
      var deferred = $q.defer();
      var options = {
        place: params.pageId,
        access_token: params.accessToken,
        message: params.message
      };
      fbCheckin(options).then(function(msg) {
        deferred.resolve(msg);
      }, function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    var fbCheckin = function(options) {
      var deferred = $q.defer();
      $http({
        method: 'post',
        url: 'https://graph.facebook.com/me/feed',
        params: options
      }).
      success(function(msg) {
        deferred.resolve(msg);
      }).
      error(function(err) {
        deferred.reject(err.error);
      });
      return deferred.promise;
    };

    function guestLogin(params) {
      var deferred = $q.defer();
      Client.details().then(function(client) {
        var data = {
          mac: client.clientMac,
          email: params.email,
          password: params.password
        };
        $http({
          method: 'post',
          url: API_END_POINT + '/guests/authenticate',
          params: data
        }).
        success(function(guest) {
          deferred.resolve(guest);
        }).
        error(function(err) {
          deferred.reject(err);
        });
      });
      return deferred.promise;
    }

    function guestCreate(params) {
      var deferred = $q.defer();
      Client.details().then(function(client) {
        var data = {
          guest: {
            mac: client.clientMac,
            email: params.email,
            password: params.password
          }
        };
        $http({
          method: 'post',
          url: API_END_POINT + '/guests',
          params: data
        }).
        success(function(guest) {
          deferred.resolve(guest);
        }).
        error(function(err) {
          deferred.reject(err);
        });
      });
      return deferred.promise;
    }

    function guestReset(params) {
      var deferred = $q.defer();
      Client.details().then(function(client) {
        var data = {
          guest: {
            mac: client.clientMac,
            email: params.email,
            host: $location.host()
          }
        };
        $http({
          method: 'post',
          url: API_END_POINT + '/guests/reset_password',
          params: data
        }).
        success(function(guest) {
          deferred.resolve(guest);
        }).
        error(function(err) {
          deferred.reject(err);
        });
      });
      return deferred.promise;
    }

    function guestUpdatePassword(params) {
      var deferred = $q.defer();
        var data = {
          // guest: {
            token: params.token,
            password: params.password,
          // }
        };
        $http({
          method: 'patch',
          url: API_END_POINT + '/guests/update_password',
          params: data
        }).
        success(function(guest) {
          deferred.resolve(guest);
        }).
        error(function(err) {
          deferred.reject(err);
        });
      // });
      return deferred.promise;
    }

    function reporter() {
      var deferred = $q.defer();
      Client.details().then(function(client) {
        var data = {
          request_uri: client.requestUri,
          mac: client.clientMac,
          ap_mac: client.apMmac,
          api_url: API_END_POINT
        };
        $http({
          method: 'post',
          url: '/api/v1/packer',
          params: data
        }).
        success(function() {
        });
      });
      deferred.resolve();
      return deferred.promise;
    }

    function status() {
      var deferred = $q.defer();
      if ($rootScope.deviceId === '1') {
        Coova.status({}).$promise.then(function(res) {
          if (res.clientState === 0) {
            deferred.resolve(res);
          } else {
            var msg = 'You\'re already logged in.';
            deferred.reject(msg);
          }
        }, function(err) {
          var msg = '<h1>Oh! Something\'s Gone Wrong </h1><p>You\'re connected to a wireless network that doesn\'t support splash pages. <br>Please check your settings and refresh the page.</p>';
          deferred.reject(msg);
        });
      } else {
        var msg = 'Are you in a hotspot?';
        deferred.resolve(msg);
      }
      return deferred.promise;
    }

    function remind(email, splash_id) {
      var deferred = $q.defer();
      var data = {
        email: email,
        splash_id: splash_id
      };
      $http({
        method: 'post',
        url: API_END_POINT + '/store_orders/remind',
        params: data
      }).
      success(function() {
        deferred.resolve(email);
      }).
      error(function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    var createLogin = function() {

      var deferred = $q.defer();
      var challenge = (loginDetails.authResp && loginDetails.authResp.challenge ) ? loginDetails.authResp.challenge : client.challenge; //? client.challenge : '';

      Tony.create({
        username:           loginDetails.username,
        password:           loginDetails.password,
        guestId:            loginDetails.guestId,
        challenge:          challenge,
        request_uri:        client.requestUri,
        clientMac:          client.clientMac,
        apMac:              client.apMac,
        loginUri:           client.loginUri,
        token:              loginDetails.token,
        userId:             loginDetails.userId,
        memberId:           loginDetails.memberId,
        expires:            loginDetails.expires,
        email:              loginDetails.email,
        newsletter:         loginDetails.newsletter,
        signature:          loginDetails.signature,
        signatureVersion:   loginDetails.signature_version,
        signatureOrder:     loginDetails.signature_order,
      }).$promise.then(function(res) {
        if (res.error) {
          deferred.reject(res.message);
        } else {
          var options = {username: res.username, password: res.challengeResp, state: res.clientState};
          console.log(options);
          deferred.resolve(options);
        }
      }, function(err) {
        var msg = 'Unable to log you in';
        if (err.data && err.data.message) {
          msg = err.data.message;
        }
        deferred.reject(msg);
      });
      return deferred.promise;
    };

    var finaliseLogin = function(resp) {
      var deferred = $q.defer();
      auth = resp;
      if ($rootScope.deviceId === '1') {
        coovaLogin().then(function() {
          deferred.resolve();
        }, function(err) {
          deferred.reject(err);
        });
      } else if ($rootScope.deviceId === '2') {
        return arubaLogin();
      } else if ($rootScope.deviceId === '4') {
        return ruckusLogin();
      } else if ($rootScope.deviceId === '5') {
        return hiveLogin();
      } else if ($rootScope.deviceId === '6') {
        return xirrusLogin();
      }
      return deferred.promise;
    };

    var coovaLogin = function() {
      var deferred = $q.defer();
      Coova.logon({
        uamSsl: client.uamSsl,
        username: auth.username,
        response: auth.password
      }).$promise.then(function(res) {
        if (res.clientState === 1) {
          deferred.resolve();
        } else {
          var msg = res.message || 'Unable to log you in.';
          deferred.reject(msg); // {msg: msg, res: auth});
        }
      }, function(err) {
        var msg;
        if (err.status === 0) {
          msg = 'Authentication failure. Please contact support. Ref: #9862';
        } else if (err.status === 404) {
          // Currently get this when the radius returns a response //
          // Chilli is formatting the JSON strangely and we get into the weirdness //
          msg = 'There was a problem logging you in. Please try again';
        } else {
          msg = err;
        }
        deferred.reject(msg);
      });
      return deferred.promise;
    };

    var hiveLogin = function() {
      // return Aruba.login({
      //   username: auth.username,
      //   password: auth.password,
      //   clientMac: client.clientMac,
      //   uamip: client.uamip
      // }).then(function() {
      // });
    };

    var arubaLogin = function() {
      return Aruba.login({
        username: auth.username,
        password: auth.password,
        clientMac: client.clientMac,
        uamip: client.uamip
      }).then(function() {
      });
    };

    var ruckusLogin = function() {
      var deferred = $q.defer();
      var openUrl = 'http://10.0.1.161:9997/login?username=xxxx&password=xxxxx';
      var redirectTo = 'http://bbc.co.uk';
      $rootScope.detailFrame =  $sce.trustAsResourceUrl(openUrl);
      // $timeout(function() {
        // $window.location.href = redirectTo;
        auth.type = 'ruckus';
        deferred.resolve();
      // },0);
      return deferred.promise;
      // return Ruckus.login({
      //   uamip: $routeParams.sip,
      //   uamport: 9997,
      //   username: auth.username,
      //   password: auth.password
      // }).then(function() {
      // });
    };

    var xirrusLogin = function() {
      return Xirrus.login({
        uamip: client.uamip,
        uamport: client.uamport,
        username: auth.username,
        response: auth.password
      }).then(function() {
      });
    };

    return {
      login: login,
      logout: logout,
      status: status,
      me: me,
      init: init,
      remind: remind,
      checkin: checkin,
      reporter: reporter,
      addToCart: addToCart,
      getCart: getCart,
      guestLogin: guestLogin,
      guestCreate: guestCreate,
      guestReset: guestReset,
      guestUpdatePassword: guestUpdatePassword,
    };

  }
]);

app.factory('Client', ['$routeParams', '$q', '$rootScope', '$location', '$localStorage',

  function($routeParams, $q, $rootScope, $location, $localStorage) {

    var clientMac, clientIp, apMac, redirectUri, loginUri, apTags, requestUri, challenge, uamip, uamport, uamSsl;
    var obj;

    var details = function() {
      var deferred = $q.defer();
      if ($rootScope.deviceId === '1') {
        clientMac = $routeParams.mac;
        apMac = $routeParams.called;
        redirectUri = $routeParams.userurl;
        uamip = $routeParams.uamip;
        uamport = $routeParams.uamport;
        uamSsl = $routeParams.ssl;
      } else if ($rootScope.deviceId === '2') {
        clientMac = $routeParams.mac;
        if ( $routeParams.apname !== undefined ) {
          apMac = $routeParams.apname.split(' ')[0];
        }
        redirectUri = $routeParams.url;
        apTags = $routeParams.essid;
        uamip = $routeParams.switchip;
      } else if ($rootScope.deviceId === '3') {
        clientMac = $routeParams.client_mac;
        apMac = $routeParams.ap_mac;
        redirectUri = $routeParams.continue_url;
        loginUri = $routeParams.login_url;
        apTags = $routeParams.ap_tags;
      } else if ($rootScope.deviceId === '4') {
        uamip = $routeParams.sip;
        uamport = 9997;
        clientMac = $routeParams.client_mac;
        apMac = $routeParams.mac;
        apTags = $routeParams.lid;
        clientIp = $routeParams.uip;
      } else if ($rootScope.deviceId === '5') {
        clientMac = $routeParams['Called-Station-Id'];
        apMac = $routeParams.mac;
        apTags = $routeParams.ssid;
        uamip = $routeParams['NAS-IP-Address'];
      } else if ($rootScope.deviceId === '6') {
        clientMac = $routeParams.mac;
        apMac = $routeParams.apmac;
        apTags = $routeParams.vlan;
        challenge = $routeParams.challenge;
        uamip = $routeParams.uamip;
        uamport = $routeParams.uamport;
      }
      obj = {
        clientMac: clientMac,
        clientIp: clientIp,
        apMac: apMac,
        redirectUri: redirectUri,
        deviceId: $rootScope.deviceId,
        loginUri: loginUri,
        uamport: uamport,
        uamip: uamip,
        apTags: apTags,
        requestUri: $location.host(),
        challenge: challenge,
        uamSsl: uamSsl
      };

      if (obj.clientMac === undefined) {
        var client = $localStorage.searchParams;
        if ( client !== undefined ) {
          obj = JSON.parse($localStorage.searchParams);
          $rootScope.deviceId = obj.deviceId;
        }
      }

      deferred.resolve(obj);
      return deferred.promise;
    };

    return {
      details: details
    };

  }

]);


app.factory('Tony', ['$resource', 'API_END_POINT',

  function($resource, API_END_POINT){

    return $resource(API_END_POINT + '/:action/:id',
      {},
      {
      create: {
        method: 'JSONP',
        isArray: false,
        params: {
          callback: 'JSON_CALLBACK',
          username: '@username',
          password: '@password',
          splash_id: '@splash_id',
          clientMac: '@clientMac',
          challenge: '@challenge',
          request_uri: '@request_uri',
          login_uri: '@loginUri',
          type: 'create', // important for CT and JSONP
          action: 'logins'
        }
      },
      addToCart: {
        method: 'POST',
        isArray: false,
        params: {
          login_uri: '@loginUri',
          action: 'store_carts',
          product_ids: '@product_ids',
          store_id: '@store_id'
        }
      },
      getCart: {
        method: 'GET',
        isArray: false,
        params: {
          login_uri: '@loginUri',
          action: 'store_carts',
          id: '@id'
        }
      }

  });


}]);

