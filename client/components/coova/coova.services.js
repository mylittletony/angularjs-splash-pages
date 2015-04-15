'use strict';

var app = angular.module('ctLoginsApp.coova.services', ['ngResource']);

app.factory('Coova', ['$resource', '$location',

  function($resource, $location){

    var port;
    if ( $location.protocol() === 'https' ) {
      port = 4990;
    }
    else {
      port = 3990;
    }


    return $resource( $location.protocol() + '://chilli.my-wifi.co:' + port + '/json/:action?',
      { callback: 'JSON_CALLBACK' },
      {
      status: {
        timeout: 100000,
        method: 'JSONP',
        isArray: false,
        params: {
          // uamip: '@uamip',
          // uamport: '@uamport',
          uamSsl: '@ssl',
          action: 'status'
        }
      },
      logon: {
        timeout: 10000,
        method: 'JSONP',
        isArray: false,
        params: {
          // uamip: '@uamip',
          // uamport: '@uamport',
          uamSsl: '@uamSsl',
          username: '@username',
          response: '@response',
          action: 'logon'
        }
      }
  });

}]);

