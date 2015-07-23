'use strict';

var app = angular.module('ctLoginsApp.facebook.directives', ['ngResource']);

app.directive('facebook', ['$window', '$compile', '$q', '$rootScope', function($window, $compile, $q, $rootScope) {

  var link = function(scope,element,attrs,controller) {

    var user, authResponse;

    scope.login = function() {
      login()
      .then(function(response) {
        validateAuth(response)
        .then(function() {
          fetchUser()
          .then(function() {
            autoLogin(response);
          });
        }, function(err) {
          errorMsg(err);
        });
      });
    };

    var autoLogin = function(response) {
      var msg = 'Ok ' + user.first_name + ', let\'s sign you in...';
      compileTemplate(msg);
      scope.ctLogin();
    };

    scope.ctLogin = function() {
      scope.processing = true;
      controller.$scope.loggingIn = true;
      controller.$scope.authResponse = authResponse;
      controller.doCtLogin().then(function(a) {
        loginHandler();
      }, function(err) {
        $rootScope.banneralert = 'banner-alert alert-box alert';
        $rootScope.error = err.msg || err;
        controller.$scope.loggingIn = undefined;
        scope.processing = undefined;
      });
    };

    function failOne() {
    }

    function loginHandler (params) {
      if (attrs.fbCheckin === 'true'){
        addCheckinForm(params);
      } else {
        redirect();
      }
    }

    function addCheckinForm() {
      controller.$scope.loggingIn = undefined;
      controller.$scope.redirectUrl = redirectUrl();
      controller.$scope.fbPageDirect = attrs.fbPageRedirect === 'true';
      controller.$scope.fbPageId = attrs.fbPageId;

      var msg =
        '<div class=\'small-12 medium-8 medium-centered columns\'>'+
        '<label for=\'checkin\'>Hey, ' + user.first_name + ', <b> you just logged in!</b> Please checkin in and leave a note on your Facebook page.</label>'+
        '<textarea ng-model=\'message\' rows=3 placeholder=\'Please type a message, this will be posted on your wall.\'></textarea>'+
        '<button ng-disabled=\'checkin\' ng-click=\'doCheckin()\'><span ng-hide=\'checkin\'>Checkin</span> <span ng-if=\'checkin\'>Checking in <i class="fa fa-spinner fa-pulse"></i></span> </button>' +
        '<p><small><a ng-disabled=\'checkin\' href="' + redirectUrl() + '">Or click here to get online.</a></small></p>' +
        '</div>';
      controller.compileTemplate(msg);
    }

    function login() {
      var deferred = $q.defer();
      FB.login(function(response){
        authResponse = response.authResponse;
        deferred.resolve(response);
      },{scope: 'publish_actions,public_profile,email'});
      return deferred.promise;
    }

    function redirectUrl() {
      if (attrs.fbPageRedirect === 'true') {
        return 'https://facebook.com/' + attrs.fbPageId;
      } else {
        if (controller.$scope.attrs.ctSuccessUrl !== null && controller.$scope.attrs.ctSuccessUrl !== '') {
          return controller.$scope.attrs.ctSuccessUrl;
        } else {
          return 'https://facebook.com';
        }
      }
    }

    function redirect() {
      $window.location.href = redirectUrl();
    }

    function handleReturningUser() {
      scope.backup = true;
      var msg;
      if (controller.$scope.attrs.autoLogin === 'true') {
        controller.autoLogin().then(scope.ctLogin);
      } else {
        controller.setSocialName(user.first_name);
        msg =
          '<div>' +
          '<a href=\'\' ng-click=\'ctLogin()\' class=\'button facebook\' >Facebook <span ng-if=\'processing\'><i class="fa fa-spinner fa-pulse"></i></span></a>'+
          '</div>'
        ;
        compileTemplate(msg);
      }
    }

    function validateAuth(resp) {
      var deferred = $q.defer();
      if (resp.status === 'connected') {
        deferred.resolve(resp);
      } else {
        var msg = 'Looks like you canceled the request, didn\'t fancy it? Please try again';
        deferred.reject(msg);
      }
      return deferred.promise;
    }

    function errorMsg(msg) {
      $rootScope.banneralert = 'banner-alert alert-box alert';
      $rootScope.error = msg;
    }

    function statusChangeCallback(response) {
      if (response.status === 'connected') {
        authResponse = response.authResponse;
        fetchUser().then(function() {
          handleReturningUser();
        });
      } else {
        var msg = '<a href=\'\' ng-click=\'login()\' class=\'button facebook\'>Facebook</a>';
        compileTemplate(msg);
      }
    }

    function compileTemplate(msg) {
      var templateObj = $compile('<div>' + msg +'</div>')(scope);
      element.html(templateObj);
    }

    function fetchUser() {
      var deferred = $q.defer();
      FB.api('/me', function(response) {
        user = response;
        deferred.resolve();
      });
      return deferred.promise;
    }

    window.fbAsyncInit = function() {
      FB.init({
        appId      : attrs.appId,
        cookie     : true,  // enable cookies to allow the server to access
        xfbml      : true,  // parse social plugins on this page
        version    : 'v2.2' // use version 2.1
      });

      FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
      });
    };

    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {
        return;
      }
      js = d.createElement(s); js.id = id;
      js.src = '//connect.facebook.net/en_US/sdk.js';
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

  };

  return {
    link: link,
    scope: {
      appId: '@',
      fbCheckin: '@',
      fbTimeout: '@',
      fbPageId: '@',
      fbPageRedirect: '@',
      backup: '='
    },
    template: '<div></div>',
    require: '^social'
  };

}]);

