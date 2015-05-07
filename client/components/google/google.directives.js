'use strict';

var app = angular.module('ctLoginsApp.google.directives', ['ngResource']);

app.directive('google', ['$window', '$compile', '$q', '$rootScope', '$timeout', '$interval', 'CT', function($window, $compile, $q, $rootScope, $timeout, $interval, CT) {

  var link = function(scope,element,attrs,controller) {

    function signinCallback(authResult) {
      var msg;
      if (authResult.status.signed_in && authResult.status.method !== 'AUTO') {
        fetchUser(authResult).
          then(controller.autoLogin).
          then(controller.doCtLogin).
          then(function() {
            console.log(123123123123123);
            loginHandler();
          }, function(err) {
            $rootScope.banneralert = 'banner alert-box alert';
            $rootScope.error = err.msg;
            console.log(err.res);
            scope.loggingIn = undefined;
            buildTemplate();
          });
      } else if (authResult.error === 'access_denied') {
        msg = 'Hey, something went wrong logging you in. Please try again.';
        errorMsg(msg);
      } else if (authResult.error === 'immediate_failed') {
        msg = 'Hey, something went wrong logging you in. Please try again.';
        errorMsg(msg);
        console.log(authResult);
      }
    }

    var additionalParams = {
      callback: signinCallback,
      clientid: attrs.gApiKey,
      cookiepolicy: 'single_host_origin',
      approvalprompt: 'force',
      scope: 'https://www.googleapis.com/auth/plus.profile.emails.read',
      requestvisibleactions: 'http://schema.org/AddAction'
    };

    function signIn() {
      gapi.auth.signIn(additionalParams);
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

    function fetchUser(authResult) {
      var deferred = $q.defer();
      gapi.client.load('plus','v1', function(){
        var request = gapi.client.plus.people.get({
          'userId': 'me'
        });
        request.execute(function(resp) {
          controller.setSocialName(resp.displayName);
          controller.$scope.authResponse = authResult;
          deferred.resolve();
        });
      });
      return deferred.promise;
    }

    function loginHandler() {
      $window.location.href = redirectUrl();
    }

    function redirectUrl() {
      if (attrs.gPageRedirect === 'true') {
        return 'https://plus.google.com/' + attrs.gPageId;
      } else {
        return controller.$scope.attrs.ctSuccessUrl || 'https://google.com';
      }
    }


    function buildTemplate() {
      var msg =
        '<div>'+
        '<a href=\'\' ng-click=\'checkState()\' class=\'button google\' >Google+ <span ng-if=\'processing\'><i class="fa fa-spinner fa-pulse"></i></span></a>'+
        '</div>';
        compileTemplate(msg);
    }

    function compileTemplate(msg) {
      var templateObj = $compile('<div>' + msg +'</div>')(scope);
      element.html(templateObj);
    }
    function errorMsg(msg) {
      $rootScope.banneralert = 'banner alert-box alert';
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

