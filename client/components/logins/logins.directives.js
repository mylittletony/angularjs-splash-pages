'use strict';

var app = angular.module('ctLoginsApp.logins.directives', []);

app.directive('formCode', ['$q', '$sce', '$timeout', 'Client', '$routeParams', '$location', '$window', '$compile', '$localStorage', '$rootScope', 'CT',
  function($q, $sce, $timeout, Client, $routeParams, $location, $window, $compile, $localStorage, $rootScope, CT) {

  var link = function(scope,element,attrs) {

    scope.submit = function() {
      if ($routeParams.preview === 'true') {
        scope.preview = 'This is just a preview, you cannot actually login.';
      } else {
        scope.error = undefined;
        $rootScope.banneralert = undefined;
        $rootScope.error = undefined;
        scope.state.hidden = true;
        scope.state.status = 'login';
        CT.login({
          username: scope.username,
          password: scope.password,
          email: scope.email,
          newsletter: scope.newsletter
        }).then(onSuccess, onFail);
      }
    };

    var onSuccess = function(auth) {
      if ( auth !== undefined && auth.type === 'ruckus' ) {
        loginRuckus(auth);
      } else {
        finishLogin();
      }
    };

    var onFail = function(err) {
      // Insert a CT service error handler //
      cleanUp();
      $rootScope.banneralert = 'banner-alert alert-box alert';
      $rootScope.error = err;
      addForm();
    };

    var finishLogin = function() {
      cleanUp();
      scope.success = true;
      CT.reporter().then(redirectUser);
    };

    var loginRuckus = function(auth) {
      Client.details().then(function(client) {
        var openUrl = 'http://' + client.uamip + ':' + client.uamport +'/login?username='+ auth.username +'&password=' + auth.password;
        scope.detailFrame =  $sce.trustAsResourceUrl(openUrl);
        $timeout(function() {
          finishLogin();
        },3000);
      });
    };

    var cleanUp = function() {
      $rootScope.bodylayout   = undefined;
      scope.state.hidden      = undefined;
      scope.state.status      = undefined;
      scope.password          = undefined;
      scope.username          = undefined;
      scope.error             = undefined;
    };

    var init = function() {
      CT.status().then(function(res) {
        addForm();
        scope.email_required  = (attrs.emailRequired === 'true');
        scope.newsletter      = (attrs.newsletter === 'true') || scope.email_required;

      }, function(err) {
        scope.state.status = undefined;
        scope.state.hidden = undefined;
        scope.state.errors = err;
        $rootScope.bodylayout = 'login-error';
      });
    };

    var addForm = function() {
      scope.code = attrs.code;
      var template =
        '<iframe style="display: none;" width="0" height="0" ng-src="{{detailFrame}}"></iframe>'+
        '<div ng-show=\'preview\' class=\'alert-box\'><small>{{ preview }}</small></div>'+
        '<div ng-hide=\'disabled || success\'>'+
        '<div ng-hide=\'login == true\'>' + scope.code + '</div>'+
        '</div>';

      var templateObj = $compile(template)(scope);
      element.html(templateObj);
      cleanUp();
    };

    var redirectUser = function() {
      if ( attrs.redirects !== undefined || attrs.redirects !== '') {
        var redirects = JSON.parse(attrs.redirects);
        if (redirects.show_welcome ) {
          $location.path('/welcome');
        } else {
          var redirectTo;
          if ( redirects.success_url !== '' && redirects.success_url !== null) {
            redirectTo = redirects.success_url;
          } else {
            redirectTo = 'http://bbc.co.uk';
          }
          $window.location.href = redirectTo;
        }
      }
    };

    attrs.$observe('code', function(val){
      if (val !== '' ) {
        init();
      }
    });

  };

  return {
    link: link,
    scope: {
      code: '@',
      redirects: '@',
      state: '=',
      emailRequired: '@',
      newsletter: '@'
    }
  };

}]);

app.directive('welcome', ['$routeParams', '$rootScope', '$location', '$window', 'Login', '$timeout', 'Client', function($routeParams, $rootScope, $location, $window, Login, $timeout, Client) {

  var link = function(scope,element,attrs) {

    // scope.loading = true;

    function init() {
      Client.details().then(function(client) {
        Login.welcome({request_uri: client.requestUri, apMac: client.apMac, clientMac: client.clientMac}).$promise.then(function(results) {
          cleanUp();
          scope.welcome = results.welcome;
          if (results.timeout > 0) {
            var timeout = results.timeout * 1000;
            var redirectTo = results.success_url || 'https://google.com';
            $timeout(function() {
              $window.location.href = redirectTo;
            },timeout);
          }
        });
      });

    }

    var cleanUp = function() {

      $rootScope.bodylayout = undefined;
      scope.state.hidden = undefined;
      scope.state.status = undefined;
      scope.password = undefined;
      scope.username = undefined;
      scope.error = undefined;

    };

    scope.$watch('routeParams', function(newVal, oldVal) {
      init();
    });

  };

  return {
    link: link,
    replace: true,
    scope: false,
    template: '<div><p ng-bind-html="welcome"></p></div>'
  };

}]);

app.directive('forgotPassword', ['$timeout', '$location', '$compile', 'CT', function($timeout,$location,$compile,CT) {

  var link = function(scope,element,attrs) {

    scope.init = function() {
      scope.remind = undefined;
      scope.email  = undefined;
      var template = '<div><p><b><a href=\'\' ng-click=\'showForm()\'>Forgot your details?</a></b></p></div>';
      var templateObj = $compile(template)(scope);
      element.html(templateObj);
    };

    scope.sendReminder = function(email, splash_id) {
      scope.reminding = true;
      CT.remind(email, splash_id).then(function(res) {
        scope.reminded = true;
        $timeout(function() {
          scope.init();
        },2000);
      }, function() {
        scope.errors = true;
        scope.remind = undefined;
      });
    };

    scope.showForm = function() {
      scope.remind = true;
      scope.splash_id = attrs.splashId;
      var template =
        '<div class=\'row\'>'+
        '<div class=\'small-12 medium-8 columns medium-centered\'>'+
        '<div ng-show=\'reminded\'>'+
        '<div class=\'alert-box success\'>'+
        'Reminder email send. It shouldn\'t take long.'+
        '</div>'+
        '</div>'+
        '<div ng-show=\'errors\'>'+
        '<div class=\'alert-box alert\'>'+
        'There was an error, try again later.'+
        '</div>'+
        '</div>'+
        '<form name=\'myForm\' ng-submit=\'sendReminder(email,splash_id)\'>'+
        '<label>Enter the email you signed-up with</label>'+
        '<input type=\'email\' ng-model=\'email\' placeholder=\'Enter the email you signed-up with\' autofocus required></input>'+
        '<br>'+
        '<button ng-disabled=\'myForm.$invalid || myForm.$pristine\' class=\'button small success\'>Remind me <span ng-if=\'reminding\'><i class="fa fa-spinner fa-spin"></i></span></button>'+
        '<p><a href=\'\' ng-click=\'init()\'>Cancel</a></p>'+
        '</form>'+
        '</div>'+
        '</div>';
      var templateObj = $compile(template)(scope);
      element.html(templateObj);
    };

    attrs.$observe('active', function(val){
      if (val !== '' && val === 'true') {
        scope.init();
      }
    });
  };

  return {
    link: link,
    scope: {
      active: '@',
      splash_id: '@',
      remind: '='
    }
  };

}]);

app.directive('loginsPartial', ['$location', function($location) {
  var link = function(scope, element, attrs) {
    scope.partial = function() {
      if ($location.path() === '/shop') {
        return 'components/logins/_shop.html';
      } else {
        return 'components/logins/_form.html';
      }
    };
  };

  return {
    link: link,
    scope: true,
    template: '<div ng-include="partial()" ng-hide=\'initialising\'></div>'
  };

}]);

app.directive('displayStore', ['CT', '$cookies', '$rootScope', '$location', '$window', 'Order', 'Client', '$localStorage', function(CT, $cookies, $rootScope, $location, $window, Order, Client, $localStorage) {

  var link = function(scope, element, attrs) {

    attrs.$observe('id', function(val){
      if (val !== '' ) {
        loadShop();
        cleanUp();
        // scope.state.status = undefined;
      }
    });

    function loadShop() {
      if ($cookies.get('cartId') === undefined) {
        scope.showstore = true;
      } else {
        scope.getCart();
      }
    }

    scope.getCart = function() {
      CT.getCart($cookies.get('cartId')).then(function(res) {
        scope.cart = res;
        scope.showcart = true;
        sliceProducts(scope.cart.products[0]._id);
      });
    };

    function sliceProducts(id) {
      for (var i = 0; i < scope.products.length; ++i) {
        if (scope.products[i]._id === id) {
          scope.products.splice(i, 1);
        }
      }
    }

    scope.addToCart = function(id) {
      scope.adding = id;
      CT.addToCart({store_id: attrs.id, product_ids: id}).then(function(res) {
        if (res && res.cart) {
          addProductToCart(res);
        } else {
          wipeCart();
        }
      }, function(err) {
        $rootScope.banneralert = 'banner-alert alert-box alert';
        $rootScope.error = 'Something\'s gone wrong.';
        scope.cart = { errors: err };
        scope.adding = undefined;
      });
    };

    function addProductToCart(res) {
      $rootScope.banneralert = 'banner-alert alert-box success';
      $rootScope.error = 'Voucher added to cart.';
      if (scope.cart !== undefined && scope.cart.products !== null) {
        scope.products.push(scope.cart.products[0]);
      }

      scope.cart = { products: res.products, cart: { cart_id: res.cart.cart_id } };
      scope.showstore = undefined;
      scope.showcart = true;
      sliceProducts(scope.cart.products[0]._id);
    }

    function wipeCart() {
      $rootScope.banneralert = 'banner-alert alert-box success';
      $rootScope.error = 'That\'s gone well. We\'ve emptied your cart.';
      scope.cart = undefined;
      scope.showcart = undefined;
    }

    scope.emptyCart = function() {
      scope.products.push(scope.cart.products[0]);
      scope.addToCart();
    };

    scope.paypal = function() {
      Client.details().then(function(client) {
        $localStorage.searchParams = JSON.stringify(client);
        scope.redirecting = true;
        var return_url = $location.protocol() + '://' + $location.host() + '/confirm';
        Order.create({clientMac: client.clientMac, return_url: return_url, cart_id: scope.cart.cart.cart_id }).$promise.then(function(results) {
          $window.location.href = results.redirect_url;
        });
      });
    };

    var cleanUp = function() {

      $rootScope.bodylayout = undefined;
      scope.state.hidden = undefined;
      scope.state.status = undefined;
      scope.error = undefined;

    };

  };

  return {
    link: link,
    scope: false,
    // scope: {
    //   state: '='
    // },
    templateUrl: 'components/logins/_display_store.html'
  };

}]);

app.directive('buildPage', ['$location', '$compile', '$window', '$rootScope', '$timeout', function($location, $compile, $window, $rootScope, $timeout) {

  var link = function(scope, element, attrs) {

    var buildPage = function(data) {

      var head = angular.element('head');
      var template;

      template =

        'html {' +
        '\tbackground: url({{ splash.background_image_name }}) no-repeat center center fixed;\n' +
        '\t-webkit-background-size: cover;\n' +
        '\t-moz-background-size: cover;\n' +
        '\t-o-background-size: cover;\n'+
        '\tbackground-size: cover;\n'+
        '\tbackground-color: {{splash.background_image_name ? \'transparent\' : splash.body_background_colour}}!important;\n'+
        '}\n\n'+

        'body {\n'+
        '\tmargin-top: 0px;\n'+
        '\tfont-family: {{ splash.font_family }}!important;\n' +
        '}\n\n'+

        'h1 {\n'+
        '\tfont-size: {{ splash.heading_text_size}};\n'+
        '\tcolor: {{ splash.heading_text_colour}};\n'+
        '}\n\n'+

        'h2 {\n'+
        '\tfont-size: {{ splash.heading_2_text_size}};\n'+
        '\tcolor: {{ splash.heading_2_text_colour}};\n'+
        '\tline-height: 1.3em;\n'+
        '\tmargin-bottom: 20px;\n'+
        '}\n\n'+

        'h3 {\n'+
        '\tfont-size: {{ splash.heading_3_text_size}};\n'+
        '\tcolor: {{ splash.heading_3_text_colour}};\n'+
        '\tline-height: 1.3em;\n'+
        '}\n\n'+

        'p {\n'+
        '\tfont-size: {{ splash.body_font_size }}!important;\n'+
        '\tcolor: {{ splash.body_text_colour }};\n'+
        '}\n\n'+

        'label {\n'+
        '\tfont-size: {{ splash.body_font_size }}!important;\n'+
        '\tcolor: {{ splash.body_text_colour }};\n'+
        '}\n\n'+

        'a {\n'+
        '\tcolor: {{splash.link_colour}};\n'+
        '}\n\n'+

        '.btn {\n'+
        '\tdisplay: inline-block;\n'+
        '\tmargin-bottom: 0;\n'+
        '\ttext-align: center;\n'+
        '\tvertical-align: middle;\n'+
        '\tcursor: pointer;\n'+
        '\tbackground-image: none;\n'+
        '\tborder: 1px solid transparent;\n'+
        '\twhite-space: nowrap;\n'+
        '\tline-height: 1.428571429;\n'+
        '\tborder-radius: 0px;\n'+
        '\t-webkit-user-select: none;\n'+
        '\t-moz-user-select: none;\n'+
        '\t-ms-user-select: none;\n'+
        '\t-o-user-select: none;\n'+
        '\tuser-select: none;\n'+
        '\tfont-size: {{ splash.btn_font_size }}!important;\n'+
        '\tcolor: {{splash.btn_font_colour}}!important;\n'+
        '\tmargin: 10px 0 15px 0;\n'+
        '\tpadding: 10px 16px;\n'+
        '\tline-height: 1.33;\n'+
        '\tborder-radius: 6px;\n'+
        '\tbackground-color: {{splash.button_colour}};\n'+
        '\tborder-color: #cccccc;\n'+
        '}\n\n'+

        'small, .small {\n'+
        '\tfont-size: 11px;\n'+
        '}\n\n'+

        '.container {\n'+
        '\tfloat: {{ splash.container_float }}!important;\n'+
        '}\n\n'+

        '.splash-container {\n'+
        '\ttext-align: {{ splash.container_text_align }}!important;\n'+
        '\tpadding: 0px 0 0 0;\n'+
        '\tmargin: 0 auto;\n'+
        '\tmax-width: {{ splash.container_width }};\n'+
        '\twidth: 98%;\n'+
        '}\n\n'+

        '.inner_container {\n'+
        '\ttext-align: {{ splash.container_text_align }};\n'+
        '\tborder: 1px solid {{ splash.border_colour || \'#CCC\' }};\n'+
        '\tbackground-color: {{ splash.container_colour }}!important;\n'+
        '\topacity: {{ splash.container_transparency }};\n'+
        // '\tpadding: 20px 10px;\n'+
        '\twidth: {{splash.container_inner_width}};\n'+
        '\tmin-height: 300px;\n'+
        '\tdisplay: block;\n'+
        '}\n\n'+

        '.footer {\n'+
        '\tdisplay: block;\n'+
        '\tpadding: 10px 0;\n'+
        '\tfont-size: 10px;\n'+
        '}\n\n'+

        '.location_logo {\n'+
        '\ttext-align: {{ splash.logo_position }};\n'+
        '\tmargin-bottom: 20px;\n'+
        '}\n\n'+

        '.social {\n'+
        '\tmargin: 10px;\n'+
        '}\n\n'+

        '.social img {\n'+
        '\twidth: 32px;\n'+
        '\theight: 32px;\n'+
        '}\n\n'+

        '#container-c1 {\n'+
        '\tpadding: 10px 10px 0 10px;\n'+
        '}\n\n' +

        '.skinny-c1 {\n'+
        '\twidth: {{splash.container_inner_width}};\n'+
        '\tmargin: 0 auto;\n'+
        '}\n\n' +

        '#container-c2 {\n'+
        '\tdisplay: {{ splash.design_id === 2 ? \'block\' : \'none\' }};\n'+
        'float: left;\n' +
        '\tpadding-top: 15px;\n'+
        '}\n\n' +

        '.columns {\n' +
        '\tpadding-left: 0px!important;\n'+
        '\tpadding-right: 0px!important;\n'+
        '}\n\n'+

        'input {\n'+
        '\tmax-width: 400px!important;\n' +
        '}\n\n' +

        '{{ splash.custom_css }}';

      head.append($compile('<style>' + template + '</style>')(scope));
      head.append($compile('<link ng-href=\'{{splash.external_css}}\' rel=\'stylesheet\' />')(scope));
      // $window.document.title = scope.splash.location_name;
      addCopy(data);
    };

    var addCopy = function(data) {
      $timeout(function() {
        clearUp();
      },100);
    };

    var clearUp = function() {
    };

    buildPage();

  };

  return {
    link: link
  };

}]);



