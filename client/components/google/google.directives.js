'use strict';

var app = angular.module('ctLoginsApp.google.directives', ['ngResource']);

app.directive('google', ['$window', '$compile', '$q', '$rootScope', '$timeout', '$interval', 'CT', 'Client', function($window, $compile, $q, $rootScope, $timeout, $interval, CT,Client) {

  var link = function(scope,element,attrs,controller) {

    // function signinCallback(authResult) {
    //   var msg;
    //   // console.log(123123, authResult);
    //   if (authResult.status.signed_in && (authResult.status.method !== 'AUTO' || authResult.status.method !== 'PROMPT')) {
    //     fetchUser(authResult).
    //       then(controller.autoLogin).
    //       then(controller.doCtLogin).
    //       then(function() {
    //         loginHandler();
    //       }, function(err) {
    //         $rootScope.banneralert = 'banner-alert alert-box alert';
    //         $rootScope.error = err.msg || 'A weird error just happened';
    //         console.log(err.res);
    //         scope.loggingIn = undefined;
    //         buildTemplate();
    //       });
    //   } else if (authResult.error === 'access_denied' || authResult.error === 'immediate_failed') {
    //     msg = 'Hey, something went wrong logging you in. Please try again.';
    //     errorMsg(msg);
    //     console.log(authResult);
    //   }
    // }

    // var additionalParams = {
    //   callback: signinCallback,
    //   clientid: attrs.gApiKey,
    //   cookiepolicy: 'single_host_origin',
    //   approvalprompt: 'force',
    //   scope: 'https://www.googleapis.com/auth/plus.profile.emails.read',
    //   requestvisibleactions: 'http://schema.org/AddAction'
    // };

    function signIn() {
      Client.details().then(function(client) {
        var host = window.location.host;
        // var params = JSON.stringify(client);
        var params = window.btoa(angular.toJson(client));

        var client_id = '243009309952-l81hcbvsf2sn0k5jjg38qski3v85cgaf.apps.googleusercontent.com';
        window.location = 'https://accounts.google.com/o/oauth2/v2/auth?client_id='+ client_id +'&redirect_uri=http://s.oh-mimo.com:9001/auth/google/callback&response_type=code&scope=https://www.googleapis.com/auth/plus.profile.emails.read&prompt=consent&state=' + params;
      })
    }

    scope.checkState = function() {

      scope.processing = true;
      // gapi.auth.checkSessionState(additionalParams, function(res) {
      //   // if (res === true) {
      //   //   // Log user in to CT
      //   // } else {
      //     scope.processing = undefined;
          signIn();
      //   // }

      // });
    };

    // function fetchUser(authResult) {
    //   var deferred = $q.defer();
    //   gapi.client.load('plus','v1', function(){
    //     var request = gapi.client.plus.people.get({
    //       'userId': 'me'
    //     });
    //     request.execute(function(resp) {
    //       controller.setSocialName(resp.displayName);
    //       controller.$scope.authResponse = authResult;
    //       deferred.resolve();
    //     });
    //   });
    //   return deferred.promise;
    // }

    // function loginHandler() {
    //   $window.location.href = redirectUrl();
    // }

    // function redirectUrl() {
    //   if (attrs.gPageRedirect === 'true') {
    //     return 'https://plus.google.com/' + attrs.gPageId;
    //   } else {
    //     return controller.$scope.attrs.ctSuccessUrl || 'https://google.com';
    //   }
    // }


    function buildTemplate() {
      var msg =
        '<div>'+
        '<a href=\'\' ng-click=\'checkState()\' class=\'social google\' >Continue with Google<span ng-if=\'processing\'><i class="fa fa-spinner fa-pulse"></i></span></a>'+
        '</div>';
        compileTemplate(msg);
    }

    function compileTemplate(msg) {
      var templateObj = $compile('<div>' + msg +'</div>')(scope);
      element.html(templateObj);
    }
    function errorMsg(msg) {
      $rootScope.banneralert = 'banner-alert alert-box alert';
      $rootScope.error = msg;
      scope.$apply();
    }

    var initialise = function() {
      var def = $q.defer();
      $.getScript('https://apis.google.com/js/client:platform.js', function success() {
        def.resolve();
      });

      return def.promise;
    };

    initialise().then(buildTemplate);
  };

  return {
    link: link,
    scope: {
      gApiKey: '@',
    },
    require: '^social'
  };

}]);
