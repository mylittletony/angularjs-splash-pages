'use strict';

var app = angular.module('ctLoginsApp.guests.directives', []);

app.directive('guestReset', ['$q', '$rootScope', '$routeParams', '$compile', 'CT',
  function($q, $rootScope, $routeParams, $compile, CT) {

    function link(scope, element) {

      var token;

      token = $routeParams.token;

      if (token === undefined) {
        var template = '<div>404, nothing to be seen</div>';
        var templateObj = $compile(template)(scope);
        element.html(templateObj);
      }

      scope.submit = function(password) {
        scope.loading = true;

        CT.guestUpdatePassword({token: token, password: password}).then(function() {
          scope.loading = undefined;
          scope.reset = true;
        }, function(err) {
          scope.loading = undefined;
          scope.errors = err;
        });

      };

    }

    return {
      link: link,
      scope: {
        state: '='
      },
      template:
        '<div>' +
        '<div ng-show=\'reset\'>' +
        '<hr>'+
        '<div class=\'alert-box success\'>A password reset has been initiated. Good things will happen soon.</div><p>If the token has expired, you will need to request another one.</p>'+
        '</div>'+
        '<div ng-hide=\'loading || reset\'>' +
        '<form ng-submit=\'submit(guest.password)\' name=\'myForm\'>'+
        '<label for=\'password\'>Enter a new password</label>' +
        '<input type=\'password\' name=\'password\' ng-model=\'guest.password\' ng-minlength=\'5\' placeholder=\'Enter your password\'></input>' +
        '<br>'+
        '<button ng-disabled="myForm.$invalid || myForm.$pristine" class="button" id="update">Change</button>'+
        '</form>' +
        '</div>'+
        '</div>'

    };
  }
]);
