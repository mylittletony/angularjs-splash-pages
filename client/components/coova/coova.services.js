'use strict';

var app = angular.module('ctLoginsApp.coova.services', ['ngResource']);

app.factory('Coova', ['$http', '$q', '$location', '$routeParams',

  function($http, $q, $location, $routeParams){

    var host, port;
    if ( $location.protocol() === 'https' ) {
      host = 'chilli.my-wifi.co';
      port = $routeParams.uamport || 4990;
    }
    else {
      host = $routeParams.uamip;
      port = $routeParams.uamport || 3990;
    }

    var status = function(params) {
      var request = $http({
        method: 'JSONP',
        timeout: 10000,
        url: $location.protocol() + '://' + host + ':' + port + '/json/status?callback=JSON_CALLBACK',
      });
      return( request.then( handleSuccess, handleError ) );
    };

    var logon = function(params) {
      var request = $http({
        method: 'JSONP',
        timeout: 10000,
        url: $location.protocol() + '://' + host + ':' + port + '/json/logon?&username='+ params.username+'&response='+params.response+'&uamSsl='+params.uamSsl+'&callback=JSON_CALLBACK',
      });
      return( request.then( handleSuccess, handleError ) );
    };

    // Old skool chilli
    var cloudtrax = function(params) {
      console.log(params)
      var request = $http({
        method: 'GET',
        timeout: 3000,
        url: $location.protocol() + '://' + host + ':' + port + '/json/logon?&username='+ params.username+'&password='+params.password,
      });
      return( request.then( handleSuccess, handleError ) );
    };

    var handleError = function(response) {
      return(response);
    };

    var handleSuccess = function(response) {
      return(response.data);
    };

    return {
      status: status,
      logon: logon,
      cloudtrax: cloudtrax
    };

}]);

  // function($resource, $location){

  //   var port;
  //   var host;
  //   if ( $location.protocol() === 'https' ) {
  //     host = 'chilli.my-wifi.co';
  //     port = 4990;
  //   }
  //   else {
  //     alert(params);
  //     host = '123';
  //     port = 3990;
  //   }


  //   var url = $location.protocol() + '://' + host +':' + port;
  //   return $resource( $location.protocol() + '://' + host + ':' + port + '/json/:action?',
  //     { callback: 'JSON_CALLBACK' },
  //     {
  //     status: {
  //       timeout: 10000,
  //       method: 'JSONP',
  //       isArray: false,
  //       params: {
  //         uamSsl: '@ssl',
  //         action: 'status'
  //       }
  //     },
  //     logon: {
  //       timeout: 10000,
  //       method: 'JSONP',
  //       isArray: false,
  //       params: {
  //         uamSsl: '@uamSsl',
  //         username: '@username',
  //         response: '@response',
  //         action: 'logon'
  //       }
  //     }
  // });
