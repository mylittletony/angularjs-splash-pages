'use strict';

describe("Coova Unit Tests", function() {

  beforeEach(module('ctLoginsApp'));

  var $httpBackend;
  var Coova;
  var routeParams;

  beforeEach(inject(function($injector, _Coova_, $routeParams) {

    routeParams = $routeParams;
    routeParams.uamip = '192.168.4.1';

    Coova = _Coova_;
    $httpBackend = $injector.get('$httpBackend');

    $httpBackend.when('JSONP', 'http://chilli.my-wifi.co:3990/json/status?&callback=JSON_CALLBACK')
      .respond(200, {});

    $httpBackend.when('JSONP', 'http://chilli.my-wifi.co:3990/json/logon?&callback=JSON_CALLBACK&password=passy&username=simon')
      .respond(200, {});

   }));

  afterEach(function() {
   $httpBackend.verifyNoOutstandingExpectation();
   $httpBackend.verifyNoOutstandingRequest();
  });

  it('should have sent a GET request to coova status', function() {
    var result = Coova.status({});
    $httpBackend.expectJSONP('http://chilli.my-wifi.co:3990/json/status?&callback=JSON_CALLBACK')
    $httpBackend.flush();
  });


  it('should have sent a GET request to coova logon', function() {
    var result = Coova.logon({username: 'simon', password: 'passy'});
    $httpBackend.expectJSONP('http://chilli.my-wifi.co:3990/json/logon?&callback=JSON_CALLBACK&password=passy&username=simon')
    $httpBackend.flush();
  });


})

