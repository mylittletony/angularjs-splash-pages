'use strict';

var app = angular.module('ctLoginsApp.orders.directives', []);

app.directive('finaliseOrder', ['$q', '$rootScope', '$cookies', '$compile', '$routeParams', '$localStorage', '$window', 'Order', 'CT', '$timeout',

  function($q, $rootScope, $cookies, $compile, $routeParams, $localStorage, $window, Order, CT, $timeout) {

    function link(scope,element,attrs) {

      scope.finalise = function(guest) {
        scope.finalising = true;
        guest = guest || {};
        loadingTemplate();

        Order.finalise({
          guest_id: $cookies.guestId,
          email: guest.email,
          id: $routeParams.orderId,
          token: $routeParams.token,
          payerId: $routeParams.PayerID,
          cart_id: $cookies.cartId
        }).$promise.then(function(results) {
          scope.finalising = undefined;
          scope.finalised = true;
          if (results.vouchers !== undefined && results.vouchers.length) {
            displayVouchers(results.vouchers);
          }
          scope.state = 'complete!';
          delete $cookies.cartId;
        }, function() {
          scope.finalising = undefined;
          scope.finalised = undefined;
          scope.errors = true;
          delete $cookies.cartId;
        });

      };

      scope.showCart = function() {
        $window.location.href = 'http://bbc.co.uk';
      };

      scope.loginNow = function() {
        scope.loggingIn = true;
        guestLogin().then(function(a) {
          $window.location.href = 'http://google.com';
        }, function(err) {
          $rootScope.banneralert = 'banner alert-box alert';
          $rootScope.error = err;
        });
      };

      function guestLogin() {
        var deferred = $q.defer();
        var username, password;
        if (scope.vouchers !== undefined && scope.vouchers.length > 0) {
          username = scope.vouchers[0].username;
          password = scope.vouchers[0].password;
        }
        CT.login({guestId: $cookies.guestId, username: username, password: password}).then(function(res) {
          deferred.resolve();
        }, function(err) {
          console.log(err);
          deferred.reject('We were unable to log you in, go back to the home page and try again.');
          $timeout(function() {
            $window.location.href = 'http://bbc.co.uk';
          },2000);
        });
        return deferred.promise;
      }

      function loadingTemplate() {
        var template =
          '<div class=\'small-12 medium-8 medium-centered columns\'>'+
          '<span ng-show=\'finalised\'>' +
          '<div class=\'\'>' +
          '<p>Success! That\'s gone well, you can login now.</p>' +
          '</div>'+
          '<span ng-hide=\'guestLoginErrors\'><button ng-disabled=\'loggingIn\' ng-click=\'loginNow()\'>Login Now <span ng-show=\'loggingIn\'><i class="fa fa-spinner fa-pulse"></i></span></button></span>' +
          // '<p ng-show=\'guestLoginErrors\'><a href="http://bbc.co.uk/" class=\'button\' >Go Home</a></p>'+
          '<p>We will log you in automatically this time. Next time you will need to use your account details.</p>' +
          '</span>' +
          '<div class=\'alert-box alert\' ng-show=\'errors\'>' +
          'There was an error, please go <a href=\'\' ng-click=\'showCart()\'>back to the cart and start again</a>.<br><br>' +
          '<b>This has happened because your PayPal credentials were wrong.</b>' +
          '</div>' +
          '<span ng-hide=\'errors\'>' +
          '<div class=\'alert-box\'ng-show=\'finalising\'>'+
          'We\'re finalising your order, please wait. This can take a moment or two.<br><br> <b>Do not refresh this page, bad things will happen</b>' +
          '</div>' +
          '<span ng-hide=\'finalised || finalising\'>'+
          // '<p>Click to finalise your order</p>' +
          '<button ng-click=\'finalise()\'>Finalise Order</button>' +
          '</span>' +
          '</span>' +
          '</div>';
        var templateObj = $compile(template)(scope);
        element.html(templateObj);
      }

      function displayVouchers(vouchers) {
        scope.vouchers = vouchers;
        var template =
          '<div>'+
          '<div class=\'small-12 medium-8 small-centered columns\'>'+
          '<h3>Your purchase was a success.</h3>'+
          '<p><b>Here are you voucher details, we have emailed a copy to you.</b></p>'+
          '<div class=\'small-5 small-centered columns\'>'+
          '<table width=\'100%\'>'+
          '<tr>' +
          '<th>Username</th><th>Password</th>'+
          '<tr ng-repeat=\'voucher in vouchers\'>' +
          '<td>{{voucher.username}}</td>'+
          '<td>{{voucher.password}}</td>'+
          '</tr>'+
          '</table>' +
          '</div>' +
          '<button ng-click=\'loginNow()\'>Login Now</button>' +
          '</div>' +
          '</div>';
        var templateObj = $compile(template)(scope);
        element.html(templateObj);
      }
    }

    var controller = function($scope) {
      this.$scope = $scope;
    };

    return {
      link: link,
      scope: {
        state: '='
      },
      controller: controller
    };
  }
]);

app.directive('guestLogin', ['$q', '$cookies', '$rootScope', '$compile', '$window', 'CT',
  function($q, $cookies, $rootScope, $compile, $window, CT) {

    function link(scope,element,attrs,controller) {

      scope.guestLogin = function(guest) {

        scope.loading = true;
        clearScope();

        CT.guestLogin({email: guest.email, password: guest.password}).then(function(resp) {
          scope.error = undefined;
          scope.loggedIn = true;
          $cookies.guestId = resp.guestId;
          scope.loading = undefined;
          scope.finaliseOrder({guest_id: resp.guestId});
        }, function() {
          scope.loggedIn = undefined;
          scope.error = true;
          scope.loading = undefined;
          scope.guest.password = undefined;
          $rootScope.banneralert = 'banner alert-box alert';
          $rootScope.error = 'Username or password incorrect or not a valid guest account';
        });

      };

      scope.guestRegister = function(guest) {

        scope.loading = true;
        CT.guestCreate({email: guest.email, password: guest.password}).then(function(resp) {
          scope.error = undefined;
          scope.loggedIn = true;
          $cookies.guestId = resp.guestId;
          scope.loading = undefined;
          scope.finaliseOrder({guest_id: resp.guestId});
        }, function() {
          scope.loggedIn = undefined;
          $rootScope.banneralert = 'banner alert-box alert';
          $rootScope.error = 'Invalid details, please try again. Are you already registered?';
          scope.error = true;
          scope.loading = undefined;
        });

      };

      var clearScope = function() {
        $rootScope.banneralert = undefined;
        $rootScope.error = undefined;
        scope.error = undefined;
      };

      scope.logout = function() {
        delete $cookies.guestId;
        scope.loginForm();
      };

      scope.finaliseOrder = function(g) {
        var guest = g || { guest_id: $cookies.guestId };
        controller.$scope.finalise(g);
      };

      scope.cancelOrder = function() {
        var msg = 'This will cancel the order completely. You will need to start again to purchase an Internet voucher.';
        if ( window.confirm(msg) ) {
          delete $cookies.cartId;
          $window.location.href = 'http://bbc.co.uk';
        }
      };

      scope.processReset = function(email) {
        scope.resetting = true;

        CT.guestReset({email: email}).then(function() {
          $rootScope.banneralert = undefined;
          $rootScope.error = undefined;
          scope.resetting = undefined;
          scope.reset = true;
          scope.error = undefined;

        }, function(err) {
          $rootScope.banneralert = 'banner alert-box alert';
          $rootScope.error = 'We were unable to reset your password. Please check your email and try again.';
          scope.guest.email = undefined;
          scope.resetting = undefined;
          scope.reset = undefined;
          scope.error = err;

        });
      };

      scope.loginForm = function() {
        var template;

        if ($cookies.guestId !== undefined) {

          template =
            '<div class=\'small-11 small-centered columns\'>' +
            '<p>Oh, you\'re logged in. <a href=\'\' ng-click=\'logout()\'>Click here to logout</a>.</p>' +
            '<p>To purchase this voucher, please confirm and we\'ll process your order</p>' +
            '<button ng-click=\'finaliseOrder(guest)\'>Finalise Order</button>' +
            '</div>';
        } else {
          template =
            '<div class=\'small-11 small-centered columns\'>' +
            '<form name=\'myForm\' ng-submit=\'guestLogin(guest)\'>' +
            '<fieldset>'+
            '<div class=\'\'><h2>Please sign-in or <a href=\'\' ng-click=\'registerUser()\'> register now.</a><br></div>'+
            '<label for=\'email\'>Enter the email you registered with.</label>'+
            '<input type=\'email\' ng-model=\'guest.email\' placeholder=\'Email address\' name=\'email\' required></input>' +
            '<label for=\'email\'>Enter your password.</label>'+
            '<input type=\'password\' ng-model=\'guest.password\' placeholder=\'Account password\' name=\'password\' ng-minlength="5" required></input>' +
            '<br>'+
            '<button ng-disabled="myForm.$invalid || myForm.$pristine" class="button" id="update">Finalise Order</button>'+
            '<p>Clicking finalise will confirm your purchase. <span ng-show=\'guest.email\'>You can then login with {{ guest.email }}.</span></p>' +
            '<p><a href=\'\' ng-click=\'resetPassword()\' ng-show=\'true\'>Forgot your password?</a> '+
            '| <a href=\'\' ng-click=\'cancelOrder()\' ng-show=\'true\'>Cancel this order</a>.</p>'+
            '</fieldset>'+
            '</form>' +
            '</div>' +
            '</div>';
          }
        var templateObj = $compile(template)(scope);
        element.html(templateObj);
      };

      var emailForm = function() {
        var template =
          '<div class=\'small-11 small-centered columns\'>' +
          '<form name=\'myForm\' ng-submit=\'finaliseOrder(guest)\'>' +
          '<fieldset>'+
          '<label for=\'email\'>Enter an email to validate the purchase.</label>'+
          '<input type=\'email\' ng-model=\'guest.email\' placeholder=\'Email address\' name=\'email\' required></input>' +
          '<br>'+
          '<button ng-disabled="myForm.$invalid || myForm.$pristine" class="button" id="update">Finalise</button>'+
          '</fieldset>'+
          '</form>' +
          '</div>';
        var templateObj = $compile(template)(scope);
        element.html(templateObj);
      };

      scope.registerUser = function() {
        var template =
          '<div class=\'small-11 small-centered columns\'>' +
          '<form name=\'myForm\' ng-submit=\'guestRegister(guest)\'>' +
          '<fieldset>'+
          '<div class=\'alert\' ng-hide=\'error\'><h2>Enter your details to complete your purchase.</h2>' +
          '<small>By registering, you\'ll have a single account to login with. Already registered? ' +
          '<a ng-click=\'loginForm()\'><b>Login now...</a></b></small></div>' +
          '<div class=\'\' ng-show=\'error\'><b>Are you already registered?</b> <a href=\'\' ng-click=\'loginForm()\'>Please login instead.</a></div>' +
          '<label for=\'email\'>First, what is your email address?</label>'+
          '<input type=\'email\' ng-model=\'guest.email\' placeholder=\'Enter your email.\' name=\'email\' required></input>' +
          '<p class="text text-danger" ng-show="myForm.email.$error.email || myForm.email.$error.required">Hey, no cheating, please enter a valid email.</p>'+
          '<span ng-show="guest.email">'+
          '<label for=\'email\'>Now enter a really secure password (min 5 chars).</label>'+
          '<input ng-focus=\'focus=true\' type=\'password\' ng-model=\'guest.password\' placeholder=\'Choose a really strong password\' name=\'password\' ng-minlength=\'5\'required></input>' +
          '</span>'+
          '<br>'+
          '<span ng-show="guest.email && !guest.password">'+
          '<p>Fill-in a password, then we\'ll confirm the order.</p>' +
          '</span>'+
          '<span ng-show="guest.email && guest.password">'+
          '<button ng-disabled="myForm.$invalid || myForm.$pristine" class="button" id="update">Finalise Order</button>'+
          '<p>Clicking finalise will sign you up and confirm your purchase. You can then login with {{ guest.email }}.</p>' +
          '</span>'+
          '</fieldset>'+
          '</form>' +
          '<br>'+
          '</div>';
        var templateObj = $compile(template)(scope);
        element.html(templateObj);
      };

      scope.resetPassword = function() {
        scope.error = undefined;
        scope.reset = undefined;
        var template =
          '<div class=\'small-11 small-centered columns\'>'+
          '<span ng-show=\'reset\'>' +
          '<br>'+
          '<br>'+
          '<div class=\'alert-box success small-12 medium-8 medium-centered columns\'>' +
          'Done, we\'ve sent you an email with a reset link.'+
          '</div>'+
          '<p><a href=\'\' ng-click=\'logout()\'>Click here to login with your new password.</a></p>' +
          '</span>'+
          '<div ng-show=\'resetting\'>' +
          '<br>'+
          '<br>'+
          '<h3>Resetting your password, hold tight.</h3>'+
          '</div>' +
          '<div ng-hide=\'reset || resetting\'>' +
          // '<form>' +
          '<form name=\'myForm\' ng-submit=\'processReset(guest.email)\'>' +
          '<fieldset>'+
          '<h2>Reset Your Password</h2>'+
          '<label for=\'email\'>Enter your email, we\'ll email you a reset link.</label>'+
          '<input type=\'email\' ng-model=\'guest.email\' placeholder=\'Account email\' name=\'email\' required></input>' +
          '<br>'+
          '<button ng-disabled="myForm.$invalid || myForm.$pristine" class="button" id="update">Reset</button>'+
          '</fieldset>'+
          // '</form>' +
          '</div>' +
          '</div>';
        var templateObj = $compile(template)(scope);
        element.html(templateObj);
      };

      scope.loggedIn = function() {
        if ( $cookies.guestId !== undefined ) {
          return true;
        }
      };

      attrs.$observe('reg', function(reg) {
        if (reg !== '') {
          if ( reg === 'true' || reg === true) {
            if ( scope.loggedIn()) {
              scope.loginForm();
            }
            else {
              scope.registerUser();
            }
          } else {
            delete $cookies.guestId;
            emailForm();
          }
        }
      });

    }

    return {
      link: link,
      scope: {
        reg: '@'
      },
      require: '^finaliseOrder'
    };

  }
]);
