function objValues(obj) {
    var res = [];
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            res.push(obj[i]);
        }
    }
    return res;
}
function groupingitems(items, type, assetslength) {
    var main = [];
    for (var i = 0; i < Object.keys(items).length; i++) {
        if(Object.values){
            var arr = Object.values(items);
        }
        else{
            var arr = objValues(items);
        }
        var maininner = [];
        var groups = {};
        for (var j = 0; j < arr[i].length; j++) {
            var groupName = '';
            if (type == 1) {
                groupName = parseInt(arr[i][j].assetName);
            } else if (type == 2) {
                if (arr[i][j].isasset) {
                    groupName = parseInt(arr[i][j].assetName);
                } else {
                    groupName = parseInt(arr[i][j].debtType) + assetslength;
                }
            }
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(arr[i][j]);
        }
        for (var groupName in groups) {
            var total = 0;
            for (var amount in groups[groupName]) {
                if (type == 1) {
                    total += parseFloat(groups[groupName][amount].assetsEstimation);
                } else if (type == 2) {
                    if (groups[groupName][amount].isasset) {
                        total += parseFloat(groups[groupName][amount].outstandingLoanValue);
                    } else {
                        total += parseFloat(groups[groupName][amount].debyEstimation);
                    }
                }
            }
            maininner.push({
                id: groupName,
                list: groups[groupName],
                total: total
            });
        }
        main.push(maininner);
    }
    return main;
}
var app = angular.module('project', ['ngRoute', 'ngAnimate', 'toaster', 'ui.select2', 'vAccordion', 'ngMaterial', 'ngMask', 'ui.calendar', 'angularMoment', 'dndLists', 'ui.bootstrap', 'ngScrollbars', 'ui.date', 'angularFileUpload', 'ngFileUpload']);
app.config(['$routeProvider', '$mdDateLocaleProvider',
    function($routeProvider, $mdDateLocaleProvider) {
        $routeProvider.
        when('/logout', {
            title: 'Logout',
            templateUrl: 'api/auth/logout',
            controller: 'authCtrl'
        }).when('/signup', {
            title: 'Signup',
            templateUrl: BASE_URL + 'account/view/register/',
            controller: 'authCtrl'
        }).when('/dashboard', {
            title: 'Dashboard',
            templateUrl: BASE_URL + 'account/view/dashboard/',
            controller: 'dashboard'
        }).when('/forgot_password', {
            title: 'ForgotPassword',
            templateUrl: BASE_URL + 'account/view/forgot_password',
            controller: 'authCtrl'
        }).when('/basic', {
            templateUrl: BASE_URL + 'account/view/basic',
            controller: 'basic'
        }).when('/kids', {
            templateUrl: BASE_URL + 'account/view/kids',
            controller: 'kidsCtrl'
        }).when('/kids/:id', {
            templateUrl: BASE_URL + 'account/view/kids',
            controller: 'kidsCtrl'
        }).when('/Deal', {
            templateUrl: BASE_URL + 'account/view/deal',
            controller: 'DealCtrl'
        }).when('/welcome', {
            title: 'welcome',
            templateUrl: BASE_URL + 'account/view/welcome_process',
            controller: 'welcomePr'
        }).when('/priceComparison', {
            title: 'Price Comparison',
            templateUrl: BASE_URL + 'account/view/price_comparison',
            controller: 'authCtrl'
        }).when('/404', {
            templateUrl: BASE_URL + 'account/view/404',
            controller: 'authCtrl'
        }).when('/HaveOwe', {
            templateUrl: BASE_URL + 'account/view/have_owe',
            controller: 'haveOwe'
        }).when('/MakeSpend', {
            templateUrl: BASE_URL + 'account/view/make_spend',
            controller: 'makeSpend'
        }).otherwise({
            redirectTo: '/dashboard'
        });
    }
]).run(function($rootScope, $location, Data) {
    $rootScope.pageName = $location.path();
    $rootScope.pageName = $rootScope.pageName.substring(1, ($rootScope.pageName.length));
    $rootScope.$on("$routeChangeStart", function(event, next, current) {
        $rootScope.authenticated = false;
        $rootScope.data = [];
        $rootScope.kidsList = [{}];
        Data.get('session').then(function(results) {
            if (results.uid) {
                $rootScope.authenticated = true;
                $rootScope.welcome = results.welcome;
                $rootScope.uid = results.uid;
                $rootScope.email = results.email;
                $rootScope.formdata = results.data;
                $rootScope.userType = results.userType;
                if (results.welcome) {
                    $location.path("/welcome");
                } else if (next.$$route.originalPath == '/welcome') {
                    $location.path("/dashboard");
                }
            } else {
                window.location.reload();
                var nextUrl = angular.isUndefined(next.$$route) ? '/login' : next.$$route.originalPath;
                if (nextUrl == '/dashboard') {
                    $location.path('/login');
                }
                if (nextUrl == '/welcome') {
                    $location.path('/login');
                }
                if (nextUrl == '/logout') {
                    $location.path('/login');
                }
                if (nextUrl == '/form/:id') {
                    $location.path('/login');
                }
                if (nextUrl == '/form/:id' || nextUrl == '/HaveOwe' || nextUrl == '/MakeSpend' || nextUrl == '/Deal') {
                    $location.path('/login');
                } else if (nextUrl == '/signup' || nextUrl == '/login') {
                    $location.path(nextUrl);
                } else {
                    //  $location.path("/");
                }
            }
        });
    });
});
app.controller('authCtrl', function($rootScope, $scope, $window, $compile, $filter, $routeParams, $location, $http, Data, Chat, Upload, ContactTypesService, FileUploader, $mdDialog, moment, uiCalendarConfig, GoogleApi, $timeout, Pay, Filenow, sharedProperties) {
    $rootScope.GetContactTypes = ContactTypesService.ContactTypes();
    $scope.today = new Date();
    $scope.menu = '';
    $scope.currentTpl = 'one';
    $scope.login = {};
    $scope.logindisable = false;
    $scope.hidenav = false;
    $scope.signup = {};
    $scope.plan = "TRIAL";
    $scope.plan_id = 0;
    $scope.data = [{
        'myInfo': [],
        'spouseinfo': [],
        'ourProfile': [],
        'kids': [{
            'kidsaddress': [{}]
        }],
        'kidsRelation': []
    }];
    $scope.welcome_data = '';
    $scope.signup_error = '';
    $scope.datatest = 'test';
    $scope.loginerror = '';
    $scope.forgoterror = '';
    $scope.signup.noc_under_18 = '0';
    $scope.signup.cresponse = null;
    $scope.widgetId = null;
    $scope.menu = [];
    $scope.formPosition = {
        i: 0,
        j: 0,
        k: 0
    };
    $scope.uploadError = '';
    $scope.isSkip = false;
    $scope.isloading = false;
    $scope.skipNav = true;
    $scope.displayPop = false;
    $scope.profilePic = '3';
    $scope.noofdayeswithme = 0;
    $scope.noofdayeswithspouse = 0;
    $scope.eventTitle = '';
    $scope.eventTime = '';
    $scope.calPre = false;
    $scope.calendarDate = [{
        events: []
    }];
    $scope.spouseFlagQs = null;
    $scope.spouseFlagAns = null;
    $scope.spouseFlagAnsin = {};
    $scope.mailData = {};
    $scope.spouseFlagAnsChanges = false;
    $scope.openContact = false;
    $scope.userinfo = [];
    //plan function starts          
    $scope.initProcessPlan = function() {
        Data.get('loaduserplan').then(function(response) {
            if(response.data){
                if (response.data.plan_id != 0) {
                    $scope.plan_id = response.data.plan_id;
                    $scope.plan = response.data.stripe_plan;
                    $scope.confirmation_code = response.data.stripe_token;
                }
                if ($scope.plan_id == 1 || $scope.plan_id == 2) {
                    if (USERTYPE == 2) {
                        $scope.enabledBtn = true;
                    } else if (USERTYPE == 3 && $scope.plan_id == 2) {
                        $scope.enabledBtn = true;
                    }
                }
            }
            $scope.newplanAmount();
        });
        Data.get('loaduserdetails').then(function(response) {
            $scope.useremail = response.data.useremail.user_email;
        });
        $scope.filingstatus = function() {
            Data.get('loadfilenowstatus').then(function(response) {
                if(response.data){
                    $scope.filingStatusOne = response.data.filenow_status_one;
                    $scope.filingStatusTwo = response.data.filenow_status_two;
                }
            });
        }
        $scope.filingstatus();
        $scope.clickbtnstatus = function() {
            Data.get('loadclickbtnstatus').then(function(response) {
                $scope.btnstatus = response.status;
            });
        }
        $scope.clickbtnstatus();
    }
    $scope.initProcessPlan();
    $scope.basicAmount = "750";
    $scope.proAmount = "1,500";
    $scope.preAmount = "2,500";
    $scope.newplanAmount = function() {
        if ($scope.plan_id == 3) {
            $scope.basicAmount = "750";
            $scope.proAmount = "750";
            $scope.preAmount = "1,750";
        } else if ($scope.plan_id == 1) {
            $scope.basicAmount = "750";
            $scope.proAmount = "1,500";
            $scope.preAmount = "1,000";
        }
    }
    //Sidebar Restrictions Starts
    $scope.openSideBar = function(arg) {
        $(window).scrollTop(0);
        if ($rootScope.userType == 2) {
            if ($scope.plan_id == 0) {
                $scope.planStep = 'upgradePlan';
                $scope.defaultPlanPopup = true;
                $scope.sidebarEnabled = false;
            } else {
                if (arg != '' && angular.isDefined(arg)) {
                    if (arg == 'download' || arg == 'basicdownload') {
                        $scope.generateFormsDeal(arg);
                    } else {
                        $scope.downloadForm(arg);
                    }
                } else {
                    $scope.openSidebars();
                }
            }
        } else if ($rootScope.userType == 3 && $scope.plan_id == 0) {
            $scope.planStep = 'informToPetitioner';
            $scope.defaultPlanPopup = true;
        } else {
            if (arg != '' && angular.isDefined(arg)) {
                if (arg == 'download' && arg != 'basicdownload') {
                    $scope.generateFormsDeal();
                } else {
                    $scope.downloadForm(arg);
                }
            } else {
                $scope.openSidebars();
            }
        }
    }
    $scope.downloadForm = function(a) {
        $window.location.href = BASE_URL + 'api/gov/' + a;
    }
    //Sidebar Restrictions Starts
    //Support Calculator Restrictions Starts
    $scope.openPopSupCal = function(arg) {
        $(window).scrollTop(0);
        if ($rootScope.userType == 2) {
            if ($scope.plan_id == 0) {
                $scope.planStep = 'upgradePlan';
                $scope.defaultPlanPopup = true;
            } else if ($scope.plan_id == 3) {
                $scope.planStep = 'upgradePlan';
                $scope.defaultPlanPopup = true;
            } else {
                if (arg == 'child') {
                    $scope.estiChildPaymentDetail();
                } else {
                    $scope.estiSpousePaymentDetail();
                }
            }
        } else if ($rootScope.userType == 3) {
            if ($scope.plan_id == 0 || $scope.plan_id == 3) {
                $scope.planStep = 'informToPetitioner';
                $scope.defaultPlanPopup = true;
            } else {
                if (arg == 'child') {
                    $scope.estiChildPaymentDetail();
                } else {
                    $scope.estiSpousePaymentDetail();
                }
            }
        }
    }
    //Support Calculator Restrictions Ends
    /*Child Support Payment in Detail Open Popup*/
    $scope.estiChildPaymentDetail = function() {
        $("body, html").css('overflow', 'auto');
        $scope.PopUpTemp2 = 'openChildPaymentDetailPopup';
        $scope.openPopUp2 = true;
    }
    /*Child Support Payment in Detail Close Popup*/
    $scope.PopUpHide2 = function() {
        $scope.openPopUp2 = false;
        $("body, html").css('overflow', 'auto');
        $scope.PopUpTemp2 = 'openChildPaymentDetailPopup';
    }
    /*Spouse Support Payment in Detail Open Popup*/
    $scope.estiSpousePaymentDetail = function() {
        $("body, html").css('overflow', 'auto');
        $scope.PopUpTemp2 = 'openSpousePaymentDetailPopup';
        $scope.openPopUp2 = true;
    }
    /*Spouse Support Payment in Detail Close Popup*/
    $scope.PopUpHide2 = function() {
        $scope.openPopUp2 = false;
        $("body, html").css('overflow', 'auto');
        $scope.PopUpTemp2 = 'openSpousePaymentDetailPopup';
    }
    $scope.openPopUp3 = false;
    $scope.inviteForm = function() {
        $scope.PopUpTemp3 = 'invitePopup';
        $(".PopUpClose2").css('display', 'block');
        $("body, html").css('overflow', 'hidden');
        $scope.openPopUp3 = true;
    }
    $scope.clickStatus = function(arg) {
        if ($scope.btnstatus != 'SUCCESS') {
            $scope.openPop();
            Data.post('continueBtnStatus', {
                data: arg
            }).then(function(results) {
                $scope.clickbtnstatus();
            });
        } else {
            $location.path('dashboard');
        }
    }
    $scope.openPop = function(arg) {
        $(window).scrollTop(0);
        if ($rootScope.userType == 2) {
            if ($scope.plan_id == 0) {
                $scope.planStep = 'upgradePlan';
                $scope.defaultPlanPopup = true;
            } else if ($scope.plan_id == 3) {
                $scope.planStep = 'upgradePlan';
                $scope.defaultPlanPopup = true;
            } else if ($scope.plan_id == 1 && arg == 'upgrade') {
                $scope.planStep = 'upgradePlan';
                $scope.defaultPlanPopup = true;
            } else {
                $scope.filenowProcess(arg);
            }
        } else if ($rootScope.userType == 3 && $scope.plan_id != 2) {
            if ($scope.plan_id == 1) {
                $scope.planStep = 'resPremium';
                $scope.defaultPlanPopup = true;
            } else if ($scope.plan_id == 0 || $scope.plan_id == 3) {
                $scope.planStep = 'informToPetitioner';
                $scope.defaultPlanPopup = true;
            }
        } else {
            $scope.filenowProcess(arg);
        }
    }
    //Filenow Process Starts        
    $scope.filenowProcess = function(arg) {
        $scope.defaultPlanPopup = true;
        $scope.planStep = 'filebeingprocessed';
        Filenow.post('fileProcess', {
            data: arg
        }).then(function(response) {
            $scope.initProcessPlan();
            if (response.status == "SUCCESS") {
                $scope.planStep = 'filesProcessing';
            } else {
                $scope.defaultPlanPopup = false;
            }
            $scope.initProcess();
            $scope.filingStatus();
        });
    }
    //Filenow Process Ends  
    $scope.dhpopClose = function() {
        $scope.defaultPlanPopup = false;
    }
    $scope.choosedPlan = null;
    $scope.choosePlan = function(plan) {
        if (plan == 1 && $rootScope.userType == 2) {
            if ($scope.plan_id == 3) {
                $scope.planAmount = 750;
            } else {
                $scope.planAmount = 1500;
            }
        } else if (plan == 2 && $rootScope.userType == 2) {
            if ($scope.plan_id == 3) {
                $scope.planAmount = 1750;
            } else if ($scope.plan_id == 1) {
                $scope.planAmount = 1000;
            } else {
                $scope.planAmount = 2500;
            }
        } else if (plan == 3 && $rootScope.userType == 2) {
            $scope.planAmount = 750;
        } else {
            $scope.planAmount = 635;
        }
        $(window).scrollTop(0);
        $scope.choosedPlan = plan;
        $scope.planStep = 'stripePay';
    }
    $scope.paynextStep = function(step) {
        $scope.planStep = step;
    }
    $scope.basicdownloadstatus = false;
    $scope.Payplan = function(data, pay) {
        $scope.payLoading = true;
        Pay.post('', {
            data: data,
            pay: pay
        }).then(function(response) {
            $scope.payLoading = false;
            if (response.status == "SUCCESS") {
                $scope.initProcessPlan();
                $scope.basicdownloadstatus = sharedProperties.getProperty();
                $scope.defaultPlanPopup = true;
                $scope.planStep = 'planSelected';
            } else if (response.status == "ERROR") {
                $scope.payError = response.data;
            }
        });
    };
    //Plan function ends
    $scope.getUserinfo = function() {
        Data.get('loaduserinfo').then(function(response) {
            $scope.userinfo = response.data;
        });
    }
    $scope.getUserinfo();
    $scope.getMyName = function() {
        var out = 'N/A';
        if ($scope.userinfo.myinfo != null && $scope.userinfo.myinfo.fname != '') {
            out = $scope.userinfo.myinfo.fname;
        } else {
            if (USERTYPE == 2) {
                out = 'Petitioner';
            } else {
                out = 'Respondent';
            }
        }
        return out;
    }
    $scope.getSpouseName = function() {
        var out = 'N/A';
        if ($scope.userinfo.spouseinfo != null && $scope.userinfo.spouseinfo.fname != '') {
            out = $scope.userinfo.spouseinfo.fname;
        } else {
            if (USERTYPE == 3) {
                out = 'Petitioner';
            } else {
                out = 'Respondent';
            }
        }
        return out;
    }
    //add kids
    $scope.birthDayHoliday = function(data) {
        data.push({
            'date': {
                'start': ['', '12:00 AM'],
                'end': ['', '12:00 PM']
            }
        });
    }
    $scope.kidsprotective = function(data) {
        data.push({});
    }
    $scope.AddContactTypeControl = function() {
        $scope.singleKid++;
        $scope.kidsList.push($scope.singleKid);
    }
    $scope.welcomeStep = 0;
    $scope.nextStep = function() {
        if ($scope.welcomeStep == 2) {
            $scope.welcomeStep = 0;
        } else {
            $scope.welcomeStep++;
        }
    }
    $scope.previousStep = function() {
        if ($scope.welcomeStep == 0) {
            $scope.welcomeStep = 2;
        } else {
            $scope.welcomeStep--;
        }
    }
    $scope.saveWelcome = function(data) {
        Data.post('welcomeData', {
            welcomecontent: data
        }).then(function(results) {
            if (results.status == "SUCCESS") {
                Data.toast(results);
                $window.location.href = BASE_URL + "home/ourProcess";
            } else {
                $scope.logindisable = false;
                Data.toast(results);
                $scope.loginerror = results.message;
            }
        });
    };
    $scope.showPop = '';
    var element = angular.element(document.querySelector('.popevent'));
    element.hide();
    $scope.setCalDate = function(date, jsEvent, view) {
        element = angular.element(document.querySelector('.popevent'));
        element.css({
            top: jsEvent.pageY - 303 + "px",
            left: jsEvent.pageX - 200 + "px",
            position: 'absolute',
        });
        element.show();
        $scope.startDate = date.format();
        $scope.showPop = 'popupForm';
    };
    $scope.eventClickCal = function(calEvent, jsEvent, view) {
        $scope.eventId = calEvent.id;
        $scope.eventTitle = calEvent.title;
        $scope.startDate = calEvent.start.format();
        $scope.endDate = calEvent.end != null ? calEvent.end.format() : calEvent.start.format();
        element.css({
            top: jsEvent.pageY - 303 + "px",
            left: jsEvent.pageX - 200 + "px",
            position: 'absolute',
        });
        element.show();
        $scope.showPop = 'popupEventForm';
    };
    $scope.closeEventPop = function() {
        element.hide();
        $scope.eventUpdateFlag = false;
        $scope.showPop = '';
    }
    $scope.deleteEvent = function(eventId) {
        if (!angular.isUndefined(eventId)) {
            GoogleApi.post('deleteEvent', {
                id: eventId
            }).then(function(response) {
                element.hide();
                $scope.showPop = '';
                angular.forEach($scope.calendarDate[0].events, function(value, key) {
                    if (value.id == eventId) {
                        $scope.calendarDate[0].events.slice(key, 1);
                    }
                })
                $window.location.reload();
                GoogleApi.toast(response);
            });
        }
    }
    $scope.addEvent = function(data) {
        GoogleApi.post('addEvent', {
            data: data
        }).then(function(response) {
            var bg = '';
            var txtColor = '';
            if (data.title == 'Petitioner (You)') {
                bg = '#a4bdfc';
                txtColor = '#000';
            } else {
                bg = '#7ae7bf';
                txtColor = '#000';
            }
            var start = moment(new Date(data.start));
            var end = moment(new Date(data.end));
            var formatedStart = start.format();
            var formatedEnd = end.add(1, 'days').format();
            var me = 0,spouse = 0;
            if (data.title == 'Petitioner (You)') {
                var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                var firstDate = new Date(data.start);
                var secondDate = new Date(data.end);
                var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                me += diffDays;
            } else {
                var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                var firstDate = new Date(data.start);
                var secondDate = new Date(data.end);
                var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                spouse += diffDays;
            }
            $scope.noofdayeswithme += me;
            $scope.noofdayeswithspouse += spouse;
        });
        $scope.showPop = '';
        element.hide();
        $window.location.reload();
    }
    $scope.uiConfig = {
        calendar: {
            editable: false,
            header: {
                left: 'today prev,next title',
                center: '',
                right: 'agendaDay,agendaWeek,month,agendaFourDay,listWeek'
            },
            dayClick: $scope.setCalDate,
            eventClick: $scope.eventClickCal,
            views: {
                agendaFourDay: {
                    type: 'agenda',
                    duration: {
                        days: 4
                    },
                    buttonText: '4 day'
                }
            },
            background: '#f26522',
        },
    };
    $scope.createCalendarForm = false;
    $scope.createNewCal = function() {
        $scope.createCalendarForm = true;
    }
    $scope.closeCalFrom = function() {
        $scope.createCalendarForm = false;
    }
    $scope.createCustomCal = function(calName) {
        $scope.calInputError = false;
        if (calName != '' && !angular.isUndefined(calName)) {
            $scope.calInputError = false;
            GoogleApi.post('createCustomCal', {
                name: calName
            }).then(function(response) {
                $scope.createCalendarForm = false;
                $scope.loadCalendarList();
            });
        } else {
            $scope.calInputError = true;
        }
    }
    $scope.loadGoogleApi = function() {
        $scope.uiConfig = {
            calendar: {
                editable: false,
                header: {
                    left: 'today prev,next title',
                    center: '',
                    right: 'agendaDay,agendaWeek,month,agendaFourDay,listWeek'
                },
                dayClick: $scope.setCalDate,
                eventClick: $scope.eventClickCal,
                views: {
                    agendaFourDay: {
                        type: 'agenda',
                        duration: {
                            days: 4
                        },
                        buttonText: '4 day'
                    }
                },
                background: '#f26522',
            },
        };
        $scope.loadCalendarList();
    }
    $scope.createCalendar = function() {
        GoogleApi.post('createCalendar', {
            data: 'Child Support'
        }).then(function(response) {});
    };
    $scope.loadCalendarList = function() {
        $scope.loadingGoogleApi = true;
        GoogleApi.get('getCalendarAll').then(function(response) {
            if (response.status == 'SUCCESS') {
                $scope.googleCalendar = true;
                $scope.uiConfig.calendar.events = [];
                $scope.calenderlist = response.data;
                $scope.tempSelecter = response.data[0].eventType;
                $scope.loadEvents(response.data[0].id, response.data[0].backgroundColor);
                angular.forEach(response.data[0], function(value, key) {
                    if (value.selected == 1) {
                        $scope.loadEvents(value.id, value.backgroundColor);
                    } else {
                        $scope.uiConfig.calendar.events = [];
                        $scope.loadingGoogleApi = false;
                    }
                });
            } else {
                $scope.loadingGoogleApi = false;
                $scope.googleCalendar = false;
            }
        });
    };
    $scope.loadEvents = function(data, eventColor) {
        GoogleApi.post('getEventList', {
            data: data
        }).then(function(response) {
            var me = 0;
            var spouse = 0;
            $scope.calendarDate.length = 0;
            $scope.calendarDate.push({
                'events': response
            });
            angular.forEach(response, function(value, key) {
                if (value.title == 'Petitioner (You)') {
                    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                    var firstDate = new Date(value.start);
                    var secondDate = new Date(value.end);
                    var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                    me += diffDays;
                } else {
                    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                    var firstDate = new Date(value.start);
                    var secondDate = new Date(value.end);
                    var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                    spouse += diffDays;
                }
            });
            $scope.noofdayeswithme = me;
            $scope.noofdayeswithspouse = spouse;
            $scope.loadingGoogleApi = false;
        });
    };
    $scope.updateEvent = function(temp) {
        $scope.loadingGoogleApi = true;
        if (temp == '' || angular.isUndefined(temp)) {
            GoogleApi.toast({
                'status': 'ERROR',
                'message': 'Please Select any template'
            });
        } else {
            GoogleApi.post('updateEvent', {
                data: temp,
                start: $scope.today
            }).then(function(response) {
                $scope.loadCalendarList();
            });
        }
    };
    $scope.clearCal = function() {
        GoogleApi.post('ClearEvents', {
            data: 'yes'
        }).then(function(response) {
            if (response.status == 'SUCCESS') {
                $scope.loadGoogleApi();
                $window.location.reload();
            }
        });
    };
    $scope.calClickFlag = false;
    $scope.calClick = function(calId, Flag) {
        GoogleApi.post('selectCal', {
            data: calId,
            selected: Flag
        }).then(function(response) {
            $scope.loadGoogleApi();
            $window.location.reload();
        });
    }
    $scope.editEV = {};
    $scope.eventUpdateFlag = false;
    $scope.editEventPopUp = function() {
        $scope.eventUpdateFlag = true;
        $scope.editEV.title = $scope.eventTitle;
        $scope.editEV.start = $scope.startDate;
        $scope.editEV.end = $scope.endDate;
    };
    $scope.updateEventSingle = function(data) {
        GoogleApi.post('updateSingleEvent', {
            id: $scope.eventId,
            data: data
        }).then(function(response) {
            GoogleApi.toast(response);
            $window.location.reload();
        });
    }
    $scope.holidayList = {
        'standardholidays': {
            'title': 'Standard Holidays',
            'dynamic': false,
            'list': [{
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Martin Luther King Jr Day (Observed)',
                'date': {
                    'start': ['01/16/17', '12:00 AM'],
                    'end': ['01/16/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Valentine’s Day',
                'date': {
                    'start': ['02/14/17', '12:00 AM'],
                    'end': ['02/14/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'President’s Day (Observed)',
                'date': {
                    'start': ['02/20/17', '12:00 AM'],
                    'end': ['02/20/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'St. Patrick’s Day',
                'date': {
                    'start': ['03/17/17', '12:00 AM'],
                    'end': ['03/17/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Mother’s Day',
                'date': {
                    'start': ['05/14/17', '12:00 AM'],
                    'end': ['05/14/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Memorial Day',
                'date': {
                    'start': ['05/29/17', '12:00 AM'],
                    'end': ['05/29/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Father’s Day',
                'date': {
                    'start': ['06/18/17', '12:00 AM'],
                    'end': ['06/18/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Independence Day',
                'date': {
                    'start': ['07/04/17', '12:00 AM'],
                    'end': ['07/04/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Labor Day',
                'date': {
                    'start': ['09/04/17', '12:00 AM'],
                    'end': ['09/04/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Columbus Day',
                'date': {
                    'start': ['10/09/17', '12:00 AM'],
                    'end': ['10/09/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Halloween',
                'date': {
                    'start': ['10/31/17', '12:00 AM'],
                    'end': ['10/31/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Thanksgiving',
                'date': {
                    'start': ['11/23/17', '12:00 AM'],
                    'end': ['11/23/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Veteran’s Day',
                'date': {
                    'start': ['11/11/17', '12:00 AM'],
                    'end': ['11/11/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Christmas Eve',
                'date': {
                    'start': ['12/24/17', '12:00 AM'],
                    'end': ['12/24/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Christmas Day',
                'date': {
                    'start': ['12/25/17', '12:00 AM'],
                    'end': ['12/25/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Christmas Day (Observed)',
                'date': {
                    'start': ['12/25/17', '12:00 AM'],
                    'end': ['12/25/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'New Year’s Eve',
                'date': {
                    'start': ['12/31/17', '12:00 AM'],
                    'end': ['12/31/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'New Year’s Day',
                'date': {
                    'start': ['01/01/17', '12:00 AM'],
                    'end': ['01/01/17', '12:00 PM'],
                }
            }]
        },
        'religiousholidays': {
            'title': 'Religious Holidays',
            'dynamic': false,
            'list': [{
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Maha Shivaratri',
                'date': {
                    'start': ['02/24/17', '12:00 AM'],
                    'end': ['02/24/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Ash Wednesday',
                'date': {
                    'start': ['03/01/17', '12:00 AM'],
                    'end': ['03/01/17', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Purim',
                'date': {
                    'start': ['03/09/2017', '12:00 AM'],
                    'end': ['03/12/2017', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Holi',
                'date': '02-25',
                'date': {
                    'start': ['03/13/2017', '12:00 AM'],
                    'end': ['03/13/2017', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Ramanavami',
                'date': {
                    'start': ['04/05/2017', '12:00 AM'],
                    'end': ['04/05/2017', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Passover',
                'date': {
                    'start': ['04/10/2017', '12:00 AM'],
                    'end': ['04/18/2017', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Good Friday',
                'date': {
                    'start': ['04/14/2017', '12:00 AM'],
                    'end': ['04/14/2017', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Easter',
                'date': {
                    'start': ['04/16/2017', '12:00 AM'],
                    'end': ['04/16/2017', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Ramadan',
                'date': {
                    'start': ['05/26/2017', '12:00 AM'],
                    'end': ['05/26/2017', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Eid al-Fitr (End of Ramadan)',
                'date': {
                    'start': ['06/25/2017', '12:00 AM'],
                    'end': ['06/25/2017', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Eid al-Adha',
                'date': {
                    'start': ['08/31/2017', '12:00 AM'],
                    'end': ['08/31/2017', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Muharram (Al Hijrah - New Year) ',
                'date': {
                    'start': ['09/22/2017', '12:00 AM'],
                    'end': ['09/22/2017', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Rosh Hashanah',
                'date': {
                    'start': ['09/20/2017', '12:00 AM'],
                    'end': ['09/20/2017', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Yom Kippur',
                'date': {
                    'start': ['09/29/2017', '12:00 AM'],
                    'end': ['09/29/2017', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Diwali',
                'date': {
                    'start': ['10/19/2017', '12:00 AM'],
                    'end': ['10/19/2017', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Navaratri / Dassehra',
                'date': {
                    'start': ['09/21/2017', '12:00 AM'],
                    'end': ['09/21/2017', '12:00 PM'],
                }
            }, {
                'odd': false,
                'even': false,
                'current': false,
                'text': 'Hanukkah',
                'date': {
                    'start': ['12/12/2017', '12:00 AM'],
                    'end': ['12/20/2017', '12:00 PM'],
                }
            }]
        },
        'mybirthday': {
            'title': 'Birthdays',
            'option': false,
            'value': '',
            'text': 'Your Birth Day',
            'dynamic': true,
            'list': [{
                'date': {
                    'start': ['', '12:00 AM'],
                    'end': ['', '12:00 PM']
                }
            }, ]
        },
    };
    $scope.holidaySortme = true;
    $scope.holidaySortspouse = false;
    $scope.noofholidayswithme = 0;
    $scope.noofholidayswithspouse = 0;
    $scope.alreadyAdded = false;
    $scope.submitHolidy = function(holidayList) {
        Data.post('updateHoliday', {
            data: holidayList
        }).then(function(response) {
            $scope.alreadyAdded = false;
            $scope.noofholidayswithme = 0;
            $scope.noofholidayswithspouse = 0;
            angular.forEach(holidayList.religiousholidays.list, function(key, value) {
                var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                //key.date.start[0] = key.date.start[]
                var firstDate = new Date(key.date.start[0]);
                var secondDate = new Date(key.date.end[0]);
                var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                if (key.odd == 'Petitioner' || key.even == 'Petitioner' || key.current == 'Petitioner') {
                    $scope.noofholidayswithme += diffDays + 1;
                }
                if (key.odd == 'Respondent' || key.even == 'Respondent' || key.current == 'Respondent') {
                    $scope.noofholidayswithspouse += diffDays + 1;
                }
                $scope.alreadyAdded = true;
            });
            angular.forEach(holidayList.standardholidays.list, function(key, value) {
                var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                var firstDate = new Date(key.date.start[0]);
                var secondDate = new Date(key.date.end[0]);
                var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                if (key.odd == 'Petitioner' || key.even == 'Petitioner' || key.current == 'Petitioner') {
                    $scope.noofholidayswithme += diffDays + 1;
                }
                if (key.odd == 'Respondent' || key.even == 'Respondent' || key.current == 'Respondent') {
                    $scope.noofholidayswithspouse += diffDays + 1;
                }
                $scope.alreadyAdded = true;
            });
            angular.forEach(holidayList.mybirthday.list, function(key, value) {
                var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                var firstDate = new Date(key.date.start[0]);
                key.date.end[0] = (key.date.end[0] == '') ? key.date.start[0] : key.date.end[0];
                var secondDate = new Date(key.date.end[0]);
                var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                if (key.odd == 'Petitioner' || key.even == 'Petitioner' || key.current == 'Petitioner') {
                    $scope.noofholidayswithme += diffDays + 1;
                }
                if (key.odd == 'Respondent' || key.even == 'Respondent' || key.current == 'Respondent') {
                    $scope.noofholidayswithspouse += diffDays + 1;
                }
                $scope.alreadyAdded = true;
            });
            $("body, html").css('overflow', 'auto');
            $scope.openPopUp = false;
        });
    };
    $scope.addHoliday = false;
    $scope.initHolidayList = function() {
        Data.get('getHolidays').then(function(response) {
            if (angular.isUndefined(response.status)) {
                $scope.holidayList = response;
                $scope.noofholidayswithme = 0;
                $scope.noofholidayswithspouse = 0;
                angular.forEach($scope.holidayList.religiousholidays.list, function(key, value) {
                    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                    var firstDate = new Date(key.date.start[0]);
                    var secondDate = new Date(key.date.end[0]);
                    var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                    if (key.odd == 'Petitioner' || key.even == 'Petitioner' || key.current == 'Petitioner') {
                        $scope.noofholidayswithme += diffDays + 1;
                    }
                    if (key.odd == 'Respondent' || key.even == 'Respondent' || key.current == 'Respondent') {
                        $scope.noofholidayswithspouse += diffDays + 1;
                    }
                });
                angular.forEach($scope.holidayList.standardholidays.list, function(key, value) {
                    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                    var firstDate = new Date(key.date.start[0]);
                    var secondDate = new Date(key.date.end[0]);
                    var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                    if (key.odd == 'Petitioner' || key.even == 'Petitioner' || key.current == 'Petitioner') {
                        $scope.noofholidayswithme += diffDays + 1;
                    }
                    if (key.odd == 'Respondent' || key.even == 'Respondent' || key.current == 'Respondent') {
                        $scope.noofholidayswithspouse += diffDays + 1;
                    }
                });
                angular.forEach($scope.holidayList.mybirthday.list, function(key, value) {
                    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                    var firstDate = new Date(key.date.start[0]);
                    key.date.end[0] = (key.date.end[0] == '') ? key.date.start[0] : key.date.end[0];
                    var secondDate = new Date(key.date.end[0]);
                    var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                    if (key.odd == 'Petitioner' || key.even == 'Petitioner' || key.current == 'Petitioner') {
                        $scope.noofholidayswithme += diffDays + 1;
                    }
                    if (key.odd == 'Respondent' || key.even == 'Respondent' || key.current == 'Respondent') {
                        $scope.noofholidayswithspouse += diffDays + 1;
                    }
                    $scope.alreadyAdded = true;
                });
                $scope.alreadyAdded = true;
            } else {
                $scope.alreadyAdded = false;
            }
        });
    }
    $scope.openPopUp = false;
    $scope.PopUpShow = function(temp) {
        $scope.openPopUp = true;
        $("body, html").css('overflow', 'hidden');
        $scope.PopUpTemp = temp;
    }
    $scope.PopUpHide = function() {
        $scope.openPopUp = false;
        $("body, html").css('overflow', 'auto');
        $scope.PopUpTemp = 'holidayPop';
    }
    $scope.openPopUp2 = false;
    $scope.PopUpHide2 = function() {
        $scope.openPopUp2 = false;
        $("body, html").css('overflow', 'auto');
        $scope.PopUpTemp2 = 'holidayPop';
        //    $location.path('dashboard');
    }
    $scope.holidaysPopupClose = function() {
        $scope.addHoliday = false;
    }
    
    $scope.calendarSchedule = false;
    $rootScope.Iconclick2 = false;

    $scope.GuideLine = function() {
        $scope.displayPop = true;
    };
    $scope.popupClose = function() {
        $('[data-popup="popup-1"]').fadeOut(350);
    };
    $scope.popupClose2 = function() {
        $('#upload_process').fadeOut(350);
    }
    $scope.popupClose3 = function() {
        $('.popup2').fadeOut(350);
    }
    $scope.enableBackToReview = false;
    // $scope.reviewEdit = function(j, k, ans = null, qs = null, mailData = {}, innercou = {}) {
    //     $scope.spouseFlagQs = qs;
    //     $scope.spouseFlagAns = ans;
    //     $scope.spouseFlagAnsin = innercou;
    //     $scope.mailData = mailData;
    //     $scope.spouseFlagAnsChanges = true;
    //     $scope.j = parseInt(j);
    //     $scope.k = parseInt(k);
    //     $scope.enableBackToReview = true;
    //     $scope.currentStep = $scope.first_step[$scope.i].inner[j].forms[k].id;
    //     //$scope.skipNav = true;
    //     if ($scope.i == 0) {
    //         $scope.BackToReviewValue = 'basic_info_review';
    //     } else if ($scope.i == 1) {
    //         $scope.BackToReviewValue = 'kidsReview';
    //     }
    // }
    $scope.backToReview = function() {
        $scope.save($scope.data);
        $scope.enableBackToReview = false;
        $scope.currentStep = $scope.BackToReviewValue;
    }
    $scope.showInviteForm = false;
    $scope.invited = false;
    $scope.initInvite = function() {
        Data.get('initInvite').then(function(response) {
            if (response.status == 'SUCCESS') {
                if (response.result != null) {
                    $scope.invited = true;
                    $scope.spouseEmail = response.result.email;
                    if (response.result.status != 0) {
                        $scope.inviteaccepted = true;
                    } else {
                        $scope.inviteaccepted = false;
                    }
                }
            }
        });
    }
    $scope.errorMsg = '';
    $scope.invite = function() {
        $scope.PopUpTemp3 = 'invitePopup';
        $("body, html").css('overflow', 'hidden');
        $scope.openPopUp3 = true;
    }
    $scope.closePopup3 = function() {
        $scope.PopUpTemp3 = '';
        $("body, html").css('overflow', 'auto');
        $scope.openPopUp3 = false;
    }
    $scope.submitInvite = function(email) {
        $scope.errorInvite = '';
        var regexp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (angular.isUndefined(email) || email == '') {
            $scope.errorInvite = 'Email is required';
        } else if (!regexp.test(email)) {
            $scope.errorInvite = 'Enter correct email format';
        } else {
            Data.post('invite', {
                email: email
            }).then(function(response) {
                Data.toast(response);
                if (response.status == "SUCCESS") {
                    $scope.showInviteForm = false;
                    $scope.invited = true;
                    $scope.initInvite();
                    $scope.closePopup3();
                } else {
                    $scope.errorInvite = response.message;
                }
            })
        }
    }
    $scope.cancelInvite = function(email) {
        Data.post('cancelInvite', {
            email: email
        }).then(function(response) {
            if (response.status == 'SUCCESS') {
                $scope.invited = false;
                $scope.inviteaccepted = false;
            }
        })
    }
    $scope.afterKidsComplete = function() {
        $scope.openPopUp2 = true;
        $("body, html").css('overflow', 'hidden');
        $scope.PopUpTemp2 = 'afterKidPopup';
    }
    $scope.generateForms = function() {
        $window.setTimeout(function() {
            $window.location.href = BASE_URL + 'app';
        }, 3000);
        $window.location.href = BASE_URL + 'api/gov';
        //$location.path('dashboard');
    }
    /*Show stripe payment process popup*/
    $scope.stripePayment = function() {
        Data.get('getPaymentDetails').then(function(response) {
            if (response.status == 'ERROR') {
                $('body, html').css('overflow', 'auto');
                $scope.whatnext_popup = true;
                $scope.confirmation_popup = false;
                $('.PopUp2').fadeOut(350);
                $(".whatnext_popup").show();
                $(".overlay").show();
            }
            if (response.data.stripe_token.length > 0 && response.status == 'SUCCESS') {
                $window.setTimeout(function() {
                    $window.location.href = BASE_URL + 'app/#!/Dashboard';
                }, 3000);
                $scope.confirmation_code = response.data.stripe_token;
                $scope.plan_name = response.data.stripe_plan;
                $scope.whatnext_popup = false;
                $(window).scrollTop(0);
            }
        });
    }
    /*Stripe Payment in Detail Close Popup*/
    $scope.PopUpHide3 = function() {
        $scope.whatnext_popup = false;
        $("body, html").css('overflow', 'auto');
    }
    $scope.generateFormsDeal = function(arg) {
        if (arg = 'basicdownload') {
            $window.location.href = BASE_URL + 'api/gov/basicdownload';
        } else {
            $window.location.href = BASE_URL + 'api/gov/deal';
        }
    }
    $scope.skipgenerateForm = function() {
        $scope.openPopUp2 = false;
        $("body, html").css('overflow', 'auto');
        $scope.PopUpTemp2 = 'holidayPop';
        $location.path('dashboard');
    }
    $scope.lauravideo = function() {
        $("body, html").css('overflow', 'auto');
        $scope.PopUpTemp2 = 'laura_video';
        $scope.openPopUp2 = true;
    }
    // $scope.spouseFlag = function(reasonId, reason, status, ans, kid = 0, kidaddress = 0, kidlegal = 0, kidprotective = 0, kidlegalclaims = 0) {
    //     if ($location.url() == '/basic') {
    //         $scope.i = 0;
    //     } else if ($location.url() == '/kdis') {
    //         $scope.i = 1;
    //     } else if ($location.url() == '/HaveOwe') {
    //         $scope.i = 2;
    //     } else if ($location.url() == '/MakeSpend') {
    //         $scope.i = 3;
    //     }
    //     Chat.post('SpouseFlag', {
    //         reasonId: reasonId,
    //         reason: reason,
    //         status: status,
    //         ans: ans,
    //         review: $scope.i,
    //         kid: kid,
    //         kidaddress: kidaddress,
    //         kidlegal: kidlegal,
    //         kidprotective: kidprotective,
    //         kidlegalclaims: kidlegalclaims
    //     }).then(function(response) {
    //         $scope.loadSpouseFlag();
    //     });
    // }
    $scope.loadInviteFlag = function() {
        Data.get('loadInviteFlag').then(function(response) {
            $scope.inviteFlagData = response;
        });
    }
    $scope.loadSpouseFlag = function() {
        Chat.get('loadSpouseFlag').then(function(response) {
            $scope.inviteFlagData = response.data;
            $timeout(function() {
                //$scope.loadFlagResponse();
                $scope.loadSpouseFlag();
                $scope.loadChatEnabled();
            }, 1000);
        })
    }
    $scope.chatenabledList = [];
    $scope.loadChatEnabled = function() {
        Chat.get('checkChatEnabled').then(function(response) {
            $scope.chatenabledList = response.data;
        });
    }
    $scope.FlagResponse = {};
    $scope.loadFlagResponse = function() {
        Chat.get('loadFlagResponse').then(function(response) {
            if ($scope.FlagResponse != response.data) {
                if ($rootScope.userType == 3) {
                    $scope.loadBasicAndkids();
                    //  $rootScope.loadAssetsAnddebt();
                    //                    $rootScope.loadMakeSpendComplete();
                }
            }
            $scope.FlagResponse = response.data;
            $timeout($scope.loadFlagResponse, 1000);
        })
    }
    $scope.changeFlagResponse = function(newValue, oldValue) {
        if (newValue == oldValue) {
            $scope.spouseFlagAnsChanges = false;
        } else {
            $scope.spouseFlagAnsChanges = true;
        }
        // $scope.$watch('data.myInfo.why', function(newva, old){
        //         console.log(newva);
        //         console.log(old);
        // }, true);
    }
    $scope.updateFlagResponse = function(qs, ans, ansinner, mailData) {
        if (ans != null) {
            mailData.review = $scope.i;
            Chat.post('updateFlagResponse', {
                qs: qs,
                ans: ans,
                innerans: ansinner,
                maildata: mailData
            }).then(function(response) {})
        }
    }
    $scope.chatboxopend = false;
    $scope.newmsglist = {};
    $scope.openchat = function(msg, step) {
        $scope.chatboxopend = false;
        //$scope.loadChat(msg, step);
        $scope.responseid = step;
        $scope.responsetext = msg;
        $scope.newmsglist[step] = null;
        //$scope.newmsglist = null;
        $timeout(function() {
            $scope.chatboxopend = true;
        }, 0);
    }
    $scope.loadChat = function(msg, id) {
        $scope.chatList = [];
        Chat.post('loadChat', {
            id: id,
            msg: msg
        }).then(function(response) {
            $scope.chatList = response.data;
            $scope.loadUnread(id);
            $timeout(function() {
                $('.chat_window_main_body')[0].scrollTop = $('.chat_window_main_body')[0].scrollHeight;
            }, 100);
        });
    }
    $scope.closeChat = function() {
        $scope.chatboxopend = false;
    }
    $scope.sidebarEnabled = false;
    $scope.closesidebar = function() {
        $("body, html").css('height', 'auto');
        $scope.sidebarEnabled = false;
    }
    $scope.openSidebars = function() {
        $(window).scrollTop(0);
        $("body, html").css('height', '100vh');
        $scope.sidebarEnabled = true;
    }
    $scope.nosidebar = true;
    $scope.checksidebar = function(i, j, k) {
        if (angular.isUndefined(j) || angular.isUndefined(k)) {
            return false;
        }
        var id = 0;
        for (var loop = 0; loop < j; loop++) {
            id += $scope.first_step[i].inner[loop].forms.length;
        }
        id += parseInt(k) + 1;
        if (i == 1) {
            id = id + 12;
        }
        Data.post('checksidebar', {
            id: id
        }).then(function(response) {
            $scope.nosidebar = (response.data.status == 1) ? false : true;
        });
    }
    $scope.sidebar = {};
    $scope.loadSidebar = function(i, j, k) {
        $scope.sidebar = {};
        var id = 0;
        for (var loop = 0; loop < j; loop++) {
            id += $scope.first_step[i].inner[loop].forms.length;
        }
        id += parseInt(k) + 1;
        if (i == 1) {
            id = id + 12;
        }
        Data.post('loadsidebar', {
            id: id
        }).then(function(response) {
            $scope.sidebar = response.data;
        });
    };
    // $scope.spouseResponse = function(responseTxt, responseId, inner = {}) {
    //     Chat.post('spouseResponse', {
    //         status: responseTxt,
    //         reasonId: responseId,
    //         inner: inner
    //     }).then(function(response) {
    //         if (response.status == 'SUCCESS') {
    //             $scope.loadSpouseFlag();
    //         }
    //     });
    // }
    $scope.checkUnread = function() {
        Chat.get('checkUnread').then(function(response) {
            if (response.status == 'SUCCESS') {
                $scope.newmsglist = response.data;
                $timeout($scope.checkUnread, 1000);
            }
        });
    }
    var timer = function() {
         $scope.loadChatEnabled();
         $scope.checkUnread();
        //$timeout(timer, 30000);    
    }
    $timeout(timer, 3000);
    $scope.contactSuccess = false;
    $scope.openContactpop = function() {
        $scope.contactSuccess = false;
        $("body, html").css('overflow', 'hidden');
        $('#openContact').show();
        $('#openContact').scrollTop(0);
    }
    $scope.closecontact = function() {
        $scope.contactSuccess = false;
        $("body, html").css('overflow', 'auto');
        $('#openContact').hide();
    }
    $scope.cnErrorFields = false;
    $scope.cnError = function() {
        $scope.cnErrorFields = true;
    }
    $scope.submitContact = function(ContactData) {
        Data.post('sendContact', {
            data: ContactData
        }).then(function(response) {
            if (response.status == 'SUCCESS') {
                $scope.contactSuccess = true;
            }
        });
    }
    $scope.sidebarInToggleid = false;
    $scope.sidebarInToggle = function() {
        $scope.sidebarInToggleid = !$scope.sidebarInToggleid;
    }
    $scope.globalInv = null;
    $scope.loadinviteData = function() {
        Data.get('loadinviteData').then(function(response) {
            if (response.status == 'SUCCESS') {
                $scope.globalInv = response.data;
            }
        });
    }
    $timeout(function() {
        $scope.loadinviteData();
    }, 10);
    $scope.qsBookmarklist = {};
    $scope.loadqsBookmark = function() {
        Data.get('loadqsBookmark').then(function(response) {
            $scope.qsBookmarklist = response.data;
        });
    }
    $scope.loadqsBookmark();
    $scope.qsBookmark = function(id, response) {
        if (angular.isDefined(id)) {
            if (angular.isDefined(response)) {
                response = !response;
            } else {
                response = true;
            }
            Data.post('updateqsbookmark', {
                id: id,
                response: response
            }).then(function(serverresponse) {
                if (serverresponse.status == 'SUCCESS') {
                    $scope.qsBookmarklist[id] = response;
                }
            });
        }
    }
    $scope.IOE_ER_MSG = '';
    $scope.IOEvalidation = function(e) {
        angular.forEach(e.$error.required, function(value, key) {
            document.getElementsByName(value.$name)[0].classList.add("ioe_error");
        });
        var inputs = e.$$controls;
        //var inputs = document.getElementsByTagName('input');
        angular.forEach(inputs, function(value, key) {
            var input = document.getElementsByName(value.$name)[0];
            if (input.type == 'text') {
                input.addEventListener('keyup', function(ev) {
                    if (this.required) {
                        if (this.validity.valid) {
                            this.classList.remove("ioe_error");
                        } else {
                            this.classList.add("ioe_error");
                        }
                    }
                    if (e.$valid) {
                        $scope.IOE_ER_MSG = '';
                    }
                });
                $(input).blur(function() {
                    if (this.required) {
                        if (this.validity.valid) {
                            this.classList.remove("ioe_error");
                        } else {
                            this.classList.add("ioe_error");
                        }
                    }
                    if (e.$valid) {
                        $scope.IOE_ER_MSG = '';
                    }
                });
            } else {}
        })
    }
    $scope.IOEradiochange = function(f, e) {
        document.getElementsByName(e.$name)[0].classList.remove("ioe_error");
        if (f.$valid) {
            $scope.IOE_ER_MSG = '';
        }
    }
    $scope.stringmatch = function(s1, s2) {
        return (s1===s2);
    }
});
app.factory("Data", ['$http', 'toaster',
    function($http, toaster) { // This service connects to our REST API
        var serviceBase = BASE_URL + 'api/auth/';
        var obj = {};
        obj.toast = function(data) {
            toaster.pop(data.status.toLowerCase(), "", data.message, 10000, 'trustedHtml');
        }
        obj.get = function(q) {
            return $http.get(serviceBase + q).then(function(results) {
                return results.data;
            });
        };
        obj.post = function(q, object) {
            //object["ioe_csrf_token"] = IOE_CSRF_TOKEN;
            return $http.post(serviceBase + q, object).then(function(response) {
                return response.data;
            });
        };
        obj.put = function(q, object) {
            return $http.put(serviceBase + q, object).then(function(results) {
                return results.data;
            });
        };
        obj.delete = function(q) {
            return $http.delete(serviceBase + q).then(function(results) {
                return results.data;
            });
        };
        return obj;
    }
]);
app.factory("GoogleApi", ['$http', 'toaster',
    function($http, toaster) { // This service connects to our REST API
        var serviceBase = BASE_URL + 'api/googleApi/';
        var obj = {};
        obj.toast = function(data) {
            toaster.pop(data.status.toLowerCase(), "", data.message, 10000, 'trustedHtml');
        }
        obj.get = function(q) {
            return $http.get(serviceBase + q).then(function(results) {
                return results.data;
            });
        };
        obj.post = function(q, object) {
            //object.ioe_csrf_token = IOE_CSRF_TOKEN;
            return $http.post(serviceBase + q, object).then(function(response) {
                return response.data;
            });
        };
        obj.put = function(q, object) {
            return $http.put(serviceBase + q, object).then(function(results) {
                return results.data;
            });
        };
        obj.delete = function(q) {
            return $http.delete(serviceBase + q).then(function(results) {
                return results.data;
            });
        };
        return obj;
    }
]);
app.directive('focus', function() {
    return function(scope, element) {
        element[0].focus();
    }
});
app.directive('passwordMatch', [function() {
    return {
        restrict: 'A',
        scope: true,
        require: 'ngModel',
        link: function(scope, elem, attrs, control) {
            var checker = function() {
                //get the value of the first password
                var e1 = scope.$eval(attrs.ngModel);
                //get the value of the other password  
                var e2 = scope.$eval(attrs.passwordMatch);
                if (e2 != null) return e1 == e2;
            };
            scope.$watch(checker, function(n) {
                //set the form control to valid if both 
                //passwords are the same, else invalid
                control.$setValidity("passwordNoMatch", n);
            });
        }
    };
}]);
app.directive('notEmpty', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attr, mCtrl) {
            function myValidation(value) {
                if (value.indexOf("e") > -1) {
                    mCtrl.$setValidity('charE', true);
                } else {
                    mCtrl.$setValidity('charE', false);
                }
                return value;
            }
            mCtrl.$parsers.push(myValidation);
        }
    };
});
app.directive('routeLoadingIndicator', function($rootScope) {
    return {
        restrict: 'E',
        template: "<div ng-show='isRouteLoading' class='loading-indicator'>" + "<div class='loading-indicator-body'>" + '<div class="sk-spinner sk-spinner-double-bounce"><div class="sk-double-bounce1"></div><div class="sk-double-bounce2"></div></div>' + "</div>" + "</div>",
        replace: true,
        link: function(scope, elem, attrs) {
            scope.isRouteLoading = false;
            $rootScope.$on('$routeChangeStart', function() {
                scope.isRouteLoading = true;
            });
            $rootScope.$on('$routeChangeSuccess', function() {
                scope.isRouteLoading = false;
            });
        }
    };
});
app.directive('contactType', function() {
    return {
        restrict: "E",
        scope: {},
        template: '<div class="row"><div class="col-lg-12"><input class="fr_name" type="text" name="" ng-model="data.kids.fname[\'id\']" placeholder="First Name"><input class="mid_int" type="text" name="" ng-model="data.kids.mname" placeholder="Middle Initial"><input class="lst_name" ng-model="data.kids.lname" type="text" name="" placeholder="Last Name"><input class="st_birth" type="text" name="" ng-model="data.kids.birthPlace" placeholder="City, State of Birth"><input class="dob" type="text" name="" ng-model="data.kids.dob" placeholder="DOB mm/dd/yyyy"></div></div><div class="row">   <div class="col-lg-12 text-right"><br><md-radio-group ng-model="data.kids.gender"><md-radio-button class="md-primary" value="M">Male</md-radio-button><md-radio-button class="md-primary" value="F">Female</md-radio-button></md-radio-group></div></div>',
        controller: function($rootScope, $scope, $element) {
            $scope.contacts = $rootScope.GetContactTypes;
            $scope.Delete = function(e) {
                //remove element and also destoy the scope that element
                $element.remove();
                $scope.$destroy();
            }
        }
    }
});
app.service("ContactTypesService", [function() {
    var list = [];
    return {
        ContactTypes: function() {
            return list;
        }
    }
}]);
app.filter('toDate', function() {
    return function(input) {
        return (angular.isUndefined(input) || input == null) ? null : new Date(input);
    }
});

app.directive('alphapet', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attr, ngModelCtrl) {
            function fromUser(text) {
                var transformedInput = text.replace(/[^A-Za-z ]/g, '');
                if (transformedInput !== text) {
                    ngModelCtrl.$setViewValue(transformedInput);
                    ngModelCtrl.$render();
                }
                return transformedInput;
            }
            ngModelCtrl.$parsers.push(fromUser);
        }
    };
});
app.directive('alphapetWithcomma', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attr, ngModelCtrl) {
            function fromUser(text) {
                var transformedInput = text.replace(/[^A-Za-z ,]/g, '');
                if (transformedInput !== text) {
                    ngModelCtrl.$setViewValue(transformedInput);
                    ngModelCtrl.$render();
                }
                return transformedInput;
            }
            ngModelCtrl.$parsers.push(fromUser);
        }
    };
});
app.directive('numbers', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attr, ngModelCtrl) {
            function fromUser(text) {
                var transformedInput = text.replace(/[^0-9]/g, '');
                if (transformedInput !== text) {
                    ngModelCtrl.$setViewValue(transformedInput);
                    ngModelCtrl.$render();
                }
                return transformedInput;
            }
            ngModelCtrl.$parsers.push(fromUser);
        }
    };
});
app.filter('strLimit', ['$filter', function($filter) {
    return function(input, limit) {
        if (!input) return;
        if (input.length <= limit) {
            return input;
        }
        return $filter('limitTo')(input, limit) + '...';
    };
}]);
String.prototype.splice = function(idx, rem, s) {
    return (this.slice(0, idx) + s + this.slice(idx + Math.abs(rem)));
};
app.directive('currencyInput', function() {
    return {
        restrict: 'A',
        scope: {
            field: '='
        },
        replace: true,
        template: '<span><input type="text" ng-model="field"></input></span>',
        link: function(scope, element, attrs) {
            $(element).bind('keyup', function(e) {
                var input = element.find('input');
                var inputVal = input.val();
                //clearing left side zeros
                while (scope.field.charAt(0) == '0') {
                    scope.field = scope.field.substr(1);
                }
                scope.field = scope.field.replace(/[^\d.\',']/g, '');
                var point = scope.field.indexOf(".");
                if (point >= 0) {
                    scope.field = scope.field.slice(0, point + 3);
                }
                var decimalSplit = scope.field.split(".");
                var intPart = decimalSplit[0];
                var decPart = decimalSplit[1];
                intPart = intPart.replace(/[^\d]/g, '');
                if (intPart.length > 3) {
                    var intDiv = Math.floor(intPart.length / 3);
                    while (intDiv > 0) {
                        var lastComma = intPart.indexOf(",");
                        if (lastComma < 0) {
                            lastComma = intPart.length;
                        }
                        if (lastComma - 3 > 0) {
                            intPart = intPart.splice(lastComma - 3, 0, ",");
                        }
                        intDiv--;
                    }
                }
                if (decPart === undefined) {
                    decPart = "";
                } else {
                    decPart = "." + decPart;
                }
                var res = '$' + intPart + decPart;
                scope.$apply(function() {
                    scope.field = res
                });
            });
        }
    };
});
app.directive('customSelect', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, el, atr, ctrl) {
            var id = el[0];
            id.style.display = "none";
            //ctrl.$setViewValue(ctrl.$modelValue);
            ctrl.$valid = false;
            ctrl.$render();
            Element.prototype.appendAfter = function(element) {
                element.parentNode.insertBefore(this, element.nextSibling);
            }, false;
            Element.prototype.addClass = function(element) {
                this.classList.add(element);
            };
            Element.prototype.removeClass = function(element) {
                this.classList.remove(element);
            };
            Element.prototype.hasClass = function(className) {
                return this.classList.contains(className);
            }
            var custom = document.createElement('div')
            custom.addClass('select');
            var div = document.createElement('div');
            div.addClass('select-styled');
            var spanVal = document.createElement('span');
            var imgVal = document.createElement('img');
            scope.$watch(atr.ngModel, function(newVal) {
                // if new value is not null do your all computation
                if (newVal != null && newVal.length > 0) {
                    spanVal.innerHTML = id.options[newVal].text;
                    imgVal.src = id.options[newVal].getAttribute('src');
                } else {
                    spanVal.innerHTML = id.options[0].text;
                    imgVal.style.display = 'none';
                    // imgVal.src = id.options[0].getAttribute('src');    
                }
            });
            var ul = document.createElement('ul');
            ul.addClass('select-options');
            div.addEventListener('click', function(event) {
                if (!ul.hasClass('active-select')) {
                    ul.addClass('active-select');
                    div.addClass('isOpen');
                } else {
                    ul.removeClass('active-select');
                    div.removeClass('isOpen');
                }
                event.stopPropagation();
            });
            for (var i = 1; i < id.length; i++) {
                var li = document.createElement('li');
                var img = document.createElement('img');
                var span = document.createElement('span');
                span.innerHTML = id.options[i].text;
                li.setAttribute('rel', id.options[i].value);
                if (id.options[i].getAttribute('src') != null || id.options[i].getAttribute('src') != 'undefined') {
                    img.src = id.options[i].getAttribute('src');
                }
                li.addEventListener('click', function(e) {
                    spanVal.innerHTML = this.children[1].innerHTML;
                    imgVal.src = this.children[0].src;
                    imgVal.style.display = 'block';
                    ctrl.$setViewValue(this.getAttribute('rel'));
                    ctrl.$render();
                    ul.removeClass('active-select');
                    div.removeClass('isOpen');
                });
                li.appendChild(img);
                li.appendChild(span);
                ul.appendChild(li);
            }
            div.appendChild(imgVal);
            div.appendChild(spanVal);
            custom.appendChild(div);
            custom.appendChild(ul);
            custom.appendAfter(id);
            document.body.addEventListener('click', function() {
                ul.removeClass('active-select');
                div.removeClass('isOpen');
            });
        }
    }
});
app.controller('login', function($scope, Data, $location) {
    $scope.doLogin = function(customer) {
        $scope.logindisable = true;
        Data.post('login', {
            customer: customer
        }).then(function(results) {
            if (results.status == "SUCCESS") {
                Data.toast(results);
                if (results.welcome) {
                    $location.path('welcome');
                } else {
                    $location.path('dashboard');
                }
            } else {
                $scope.logindisable = false;
                Data.toast(results);
                $scope.loginerror = results.message;
            }
        });
    };
});
app.controller('dashboard', function($scope, $location, Data, $window, Chat, $rootScope, Pay, $http, sharedProperties) {
    $scope.isDealCompleted = false;
    $scope.dashItems = [{
        id: 'basic',
        title: 'Basic Info',
        status: 0,
        url: 'basic',
        inner: [{
            id: 'basic-info',
            title: 'Petitioner Info'
        }, {
            id: 'spouse-info',
            title: "Respondent Info"
        }, {
            id: 'joint-info',
            title: 'Joint info'
        }]
    }, {
        id: 'kids',
        title: 'Kids',
        status: 0,
        url: 'kids',
        inner: [{
            id: 'Custody-Visitation',
            title: 'About Your Kids'
        }, {
            id: 'child-support',
            title: "Custody & Co-parenting"
        }, {
            id: 'fine-details',
            title: 'Final Details'
        }]
    }, {
        id: 'haveOwe',
        title: 'Have/Owe',
        status: 0,
        url: 'HaveOwe',
        inner: [{
            id: 'Add-Asset-Debt',
            title: 'Add Asset/Debt'
        }, {
            id: 'have-owe-review',
            title: "Review"
        }]
    }, {
        id: 'makeSpend',
        title: 'Make/Spend',
        status: 0,
        url: 'MakeSpend',
        inner: [{
            id: 'job',
            title: 'Job'
        }, {
            id: 'income-expense',
            title: "Income/Expense"
        }, {
            id: 'make-spend-review',
            title: 'Review'
        }]
    }, {
        id: 'deal',
        title: 'The Deal',
        status: 0,
        url: 'Deal',
        inner: [{
            id: 'final-step',
            title: 'Final Step'
        }]
    }];
    $scope.basic = {
        j: [4, 3, 5]
    };
    $scope.kids = {
        j: [8, 2, 8]
    };
    $scope.noofkids = 0;
    $scope.dashboardisloading = false;
    $scope.name = 'Dashboard';
    $scope.spouseName = null;
    $scope.completionDate = 'not available';
    $scope.invite = {};
    $scope.initProcess = function() {
        $(window).scrollTop(0);
        $scope.dashboardisloading = true;
        Data.get('loadDashboard').then(function(response) {
            $scope.dashboardisloading = false;
            if (response.data.myinfo != null) {
                if (response.data.myinfo.fname != null && !angular.isUndefined(response.data.myinfo.fname)) {
                    // $scope.name = response.data.myinfo.fname+"'s Dashboard";
                }
                if (!angular.isUndefined(response.data.myinfo.created_date)) {
                    var createdDate = new Date(response.data.myinfo.created_date);
                    createdDate.setMonth(createdDate.getMonth() + 7);
                    $scope.completionDate = createdDate.toDateString();
                }
            }
            if ($rootScope.userType == 2) {
                $scope.name = response.data.myinfo.fname + "'s Dashboard";
            } else if ($rootScope.userType == 3) {
                if (response.data.spouseinfo != null && !angular.isUndefined(response.data.spouseinfo.sfname)) {
                    $scope.name = response.data.spouseinfo.sfname + "'s Dashboard";
                }
            }
            if (!angular.isUndefined(response.data.inv)) {
                $scope.invite = response.data.inv;
            } else {
                $scope.invite = null;
            }
            if ($scope.invite != null) {
                $scope.spouseName = response.data.spouseinfo != null ? response.data.spouseinfo.sfname : '';
                $scope.invite.sname = response.data.spouseinfo != null ? response.data.spouseinfo.sfname : '';
            }
            if (!angular.isUndefined(response.data.steps)) {
                if (response.data.steps.basic == '1') {
                    $scope.dashItems[0].status = 100;
                    if (response.data.noofchild == 0) {
                        sharedProperties.setProperty(true);
                    }
                } else {
                    var j = (angular.isUndefined(response.data.steps.basic) || response.data.steps.basic == '') ? 0 : response.data.steps.basic.j;
                    var k = (angular.isUndefined(response.data.steps.basic) || response.data.steps.basic == '') ? 0 : response.data.steps.basic.k;
                    $scope.dashItems[0].status = (j / $scope.basic.j.length) * 100 + ((k / $scope.basic.j[j]) * 100) / $scope.basic.j.length;
                }
                if (response.data.steps.kids == '1') {
                    $scope.dashItems[1].status = 100;
                    sharedProperties.setProperty(true);
                } else {
                    var j = (angular.isUndefined(response.data.steps.kids) || response.data.steps.kids == '') ? 0 : response.data.steps.kids.j;
                    var k = (angular.isUndefined(response.data.steps.kids) || response.data.steps.kids == '') ? 0 : response.data.steps.kids.k;
                    $scope.dashItems[1].status = (j / $scope.kids.j.length) * 100 + ((k / $scope.kids.j[j]) * 100) / $scope.kids.j.length;
                }
                if (response.data.steps.haveOwe == '1') {
                    $scope.dashItems[2].status = 100;
                } else {
                    $scope.dashItems[2].status = response.data.steps.haveOwe;
                }
                if (response.data.steps.makeSpend == '1') {
                    $scope.dashItems[3].status = 100;
                } else {
                    $scope.dashItems[3].status = response.data.steps.makeSpend;
                }
                if ($rootScope.userType == 2) {
                    if (response.data.steps.basic == '1' && response.data.steps.kids == '1' && response.data.steps.haveOwe == '1' && response.data.steps.makeSpend == '1') {
                        $scope.dashItems[4].status = 100;
                    } else if (response.data.steps.basic == '1' && response.data.steps.haveOwe == '1' && response.data.steps.makeSpend == '1') {
                        if (response.data.noofchild == 0) {
                            $scope.dashItems[4].status = 100;
                        }
                    }
                } else {
                    if (response.data.steps.basic == '1' && response.data.steps.kids == '1' && response.data.steps.haveOwe == '1') {
                        $scope.dashItems[4].status = 100;
                    } else if (response.data.steps.basic == '1' && response.data.steps.haveOwe == '1') {
                        if (response.data.noofchild == 0) {
                            $scope.dashItems[4].status = 100;
                        }
                    }
                }
            }
            if (response.data.noofchild == 0) {
                //$scope.dashItems.splice(1,1);
                $scope.dashItems[1] = null;
            }
            $scope.noofkids = response.data.noofchild;
        });
    };
    $scope.overlayEnable = false;
    $scope.overlayShow = function() {
        for (var a = 0; a < $scope.panesA.length; a++) {
            $scope.panesA[a].isExpanded = false;
        }
        $('v-accordion').css('margin-bottom', 0);
        $scope.overlayEnable = true;
    }
    $scope.closeOverlay = function() {
        $scope.panesA[0].isExpanded = true;
        $scope.overlayEnable = false;
    };
    $scope.viewForm = function($page, $isicon, stepsV) {
        if ($isicon) {
            $rootScope.Iconclick = true;
            $rootScope.iconI = stepsV;
        }
        else{
            $rootScope.Iconclick = false;
        }
        $location.path($page);
        $(window).scrollTop(0);
    };
    $scope.generateForms = function() {
        $window.location.href = BASE_URL + 'api/gov';
    }
    $scope.closePopup3 = function() {
        $scope.PopUpTemp3 = '';
        $("body, html").css('overflow', 'auto');
        $scope.openPopUp3 = false;
    }
    $scope.submitInvite = function(email) {
        $scope.errorInvite = '';
        var regexp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (angular.isUndefined(email) || email == '') {
            $scope.errorInvite = 'Email is required';
        } else if (!regexp.test(email)) {
            $scope.errorInvite = 'Enter correct email format';
        } else {
            Data.post('invite', {
                email: email
            }).then(function(response) {
                Data.toast(response);
                if (response.status == "SUCCESS") {
                    $scope.showInviteForm = false;
                    $scope.invite = {
                        email: email,
                        status: 0,
                        sname: $scope.spouseName
                    };
                    $scope.invited = true;
                    $scope.closePopup3();
                } else {
                    $scope.errorInvite = response.message;
                }
            })
        }
    }
    $scope.cancelInvite = function(email) {
        Data.post('cancelInvite', {
            email: email
        }).then(function(response) {
            if (response.status == 'SUCCESS') {
                $scope.invite = null;
            }
        })
    }
    $scope.dhpopClose = function() {
        $("body, html").css('height', 'auto');
        $("body, html").css('overflow', 'auto');
        $scope.dhPopup = false;
    }
    // $scope.loadmessage = function() {
    //     var dateTime = new Date()
    //     $http.post(BASE_URL + 'pull/get-new-messages/', {
    //         timestamp: dateTime,
    //         ioe_csrf_token : IOE_CSRF_TOKEN
    //     }).then(function(results) {
    //         //$scope.loadmessage();
    //     });
    // }
    // $scope.loadmessage();    
});
app.factory("Pay", ['$http', 'toaster',
    function($http, toaster) { // This service connects to our REST API
        var serviceBase = BASE_URL + 'Payment/';
        var obj = {};
        obj.toast = function(data) {
            toaster.pop(data.status.toLowerCase(), "", data.message, 10000, 'trustedHtml');
        }
        obj.get = function(q) {
            return $http.get(serviceBase + q).then(function(results) {
                return results.data;
            });
        };
        obj.post = function(q, object) {
            //object.ioe_csrf_token = IOE_CSRF_TOKEN;
            return $http.post(serviceBase + q, object).then(function(response) {
                return response.data;
            });
        };
        obj.put = function(q, object) {
            return $http.put(serviceBase + q, object).then(function(results) {
                return results.data;
            });
        };
        obj.delete = function(q) {
            return $http.delete(serviceBase + q).then(function(results) {
                return results.data;
            });
        };
        return obj;
    }
]);
app.factory("Filenow", ['$http', 'toaster',
    function($http, toaster) { // This service connects to our REST API
        var serviceBase = BASE_URL + 'api/Gov/';
        var obj = {};
        obj.toast = function(data) {
            toaster.pop(data.status.toLowerCase(), "", data.message, 10000, 'trustedHtml');
        }
        obj.get = function(q) {
            return $http.get(serviceBase + q).then(function(results) {
                return results.data;
            });
        };
        obj.post = function(q, object) {
            //object.ioe_csrf_token = IOE_CSRF_TOKEN;
            return $http.post(serviceBase + q, object).then(function(response) {
                return response.data;
            });
        };
        obj.put = function(q, object) {
            return $http.put(serviceBase + q, object).then(function(results) {
                return results.data;
            });
        };
        obj.delete = function(q) {
            return $http.delete(serviceBase + q).then(function(results) {
                return results.data;
            });
        };
        return obj;
    }
]);
app.controller('haveOwe', function($scope, $rootScope, uiSelect2Config, Data, $window, Chat, $timeout, Haveowe, $location) {
    $scope.isloading = false;
    $scope.assetsnewshow = false;
    $scope.debtnewshow = false;
    $scope.addAssetsValidate = false;
    $scope.addDebtValidate = false;
    $scope.spouseFlagQs = null;
    $scope.spouseFlagAns = null;
    $scope.flagAnsChanged = false;
    $scope.spouseFlagAnsin = null;
    $scope.mailData = null;
    $scope.assetCardrequired = false;
    $scope.debtCardrequired = false;
    $scope.topNavList = [{
        title: 'Basic Info',
        id: 'basic',
        completed: false,
        url: 'basic',
    }, {
        title: 'Kids',
        id: 'kids',
        url: 'kids',
        completed: false
    }, {
        title: 'Have/Owe',
        id: 'haveOwe',
        url: 'HaveOwe',
        completed: true,
        inner: [{
            id: 'additem',
            title: 'Add Asset/Debt',
            completed: true
        }, {
            id: 'review',
            title: 'Review',
            completed: true
        }]
    }, {
        title: 'Make/Spend',
        id: 'makeSpend',
        url: 'MakeSpend',
        completed: false
    }, {
        title: 'The Deal',
        id: 'deal',
        url: 'deal',
        completed: false
    }];
    $scope.formReview = false;
    $scope.groupedmodel = {
        'assets': [],
        'debts': []
    };
    $scope.assetsTypeList = ['', 'Checking Account', 'Savings Account', 'Investment Account', 'Qualified Retirement Account', 'Non-Qualified retirement account', 'Personal Item', 'Vehicle', 'Property', 'Pets'];
    $scope.debtTypeList = ['', 'Credit card', 'Past due child or spousal support', 'Personal loans', 'Student loans', 'Taxes', 'Property'];
    $scope.models = {
        selected: null,
        listsAssets: {},
        listDebt: {}
    };
    $scope.total = {
        assetsTotal: '',
        debtTotal: ''
    };
    $scope.newnotification = false;
    $scope.history = [];
    $scope.dataassetlastupdate = (new Date).getTime();
    $scope.datadebtlastupdate = (new Date).getTime();
    $scope.flaglastupdate = (new Date).getTime();
    $scope.flagissueitems = {};
    $scope.assetError = false;
    $scope.assetErrorMsg = '';
    $scope.debtError = false;
    $scope.debtErrorMsg = "";
    $scope.IOE_ER_MSG = '';
    $scope.reloadfunction = function() {
        window.location.reload(true);
    }
    $scope.overlayEnable = false;
    $scope.openOverlay = function() {
        $scope.overlayEnable = true;
    }
    $scope.closeOverlay = function() {
        $scope.overlayEnable = false;
    };
    //adding section
    $scope.assetCardrequireditem = [1, 2, 3, 4, 5];
    $scope.changeAsset = function(itemid, f, e) {
        $scope.IOEradiochange(f, e);
        if ($scope.assetCardrequiredcheck(itemid)) {
            $scope.assetCardrequired = true;
        } else {
            $scope.assetCardrequired = false;
        }
    }
    $scope.assetCardrequiredcheck = function(itemid) {
        var flag = false;
        if ($scope.assetCardrequireditem.indexOf(parseInt(itemid)) != -1) {
            flag = true;
        } else {
            flag = false;
        }
        return flag;
    }
    $scope.debtCardrequireditem = [1];
    $scope.changeDebt = function(itemid, f, e) {
        $scope.IOEradiochange(f, e);
        if ($scope.debtCardrequiredcheck(itemid)) {
            $scope.debtCardrequired = true;
        } else {
            $scope.debtCardrequired = false;
        }
    }
    $scope.debtCardrequiredcheck = function(itemid) {
        var flag = false;
        if ($scope.debtCardrequireditem.indexOf(parseInt(itemid)) != -1) {
            flag = true;
        } else {
            flag = false;
        }
        return flag;
    }
    $scope.addNewToggle = function(id) {
        $scope.addAssetsValidate = false;
        $scope.addDebtValidate = false;
        if (id == 'assets') {
            $scope.assetError = false;
            $scope.assetErrorMsg = "";
            $scope.assetsnewshow = !$scope.assetsnewshow;
        } else if (id == 'debt') {
            $scope.debtnewshow = !$scope.debtnewshow;
        }
    }
    $scope.addNewClose = function(id) {
        if (id == 'assets') {
            $scope.assetsnewshow = false;
        } else if (id == 'debt') {
            $scope.debtnewshow = false;
        }
    }
    $scope.addAssets = function(data, e) {
        $scope.IOE_ER_MSG = '';
        if (e.$invalid) {
            $scope.IOEvalidation(e);
            $scope.IOE_ER_MSG = 'Please fill the required fields';
            return;
        } else if (e.$valid) {
            if (data.whoWillKeep == '4') {
                if (parseInt(data.my_assetvalue) > parseInt(data.assetsEstimation) || parseInt(data.spouse_assetvalue) > parseInt(data.assetsEstimation) || (parseInt(data.my_assetvalue) + parseInt(data.spouse_assetvalue)) > parseInt(data.assetsEstimation)) {
                    $scope.assetError = true;
                    $scope.assetErrorMsg = "You entered amount is more than estimation value";
                    return;
                }
            }
            var timestamp = (new Date).getTime();
            Data.post('addAssets', {
                data: data,
                timestamp: timestamp
            }).then(function(response) {
                if (response.status == 'SUCCESS') {
                    $scope.loadAssets();
                    $scope.loadDebt();
                }
                $scope.addAssetsValidate = false;
                Data.toast(response);
                $scope.addNewClose('assets');
            });
        }
    };
    $scope.addDebt = function(data, e) {
        $scope.IOE_ER_MSG = '';
        if (e.$invalid) {
            $scope.IOEvalidation(e);
            $scope.IOE_ER_MSG = 'Please fill the required fields';
            return;
        } else if (e.$valid) {
            if (data.howMuchDebtGot == 0) {
                $scope.debtError = true;
                $scope.debtErrorMsg = "Your debt value not valid";
                return;
            }
            var timestamp = (new Date).getTime();
            Data.post('addDebt', {
                data: data,
                timestamp: timestamp
            }).then(function(response) {
                if (response.status == 'SUCCESS') {
                    $scope.loadDebt();
                }
                Data.toast(response);
                $scope.addNewClose('debt');
            });
        }
    };
    //adding section
    //init section
    $scope.viewForm = function($page) {
        $location.path($page);
        $(window).scrollTop(0);
    };
    $scope.initHaveOwe = function() {
        $scope.isloading = true;
        Data.get('loadAssets').then(function(assetresponse) {
            $scope.models.listsAssets = assetresponse.data;
            $scope.total.assetsTotal = assetresponse.total;
            $scope.dataassetlastupdate = (new Date).getTime();
            Data.get('loadDebt').then(function(debtresponse) {
                $scope.models.listDebt = debtresponse.data;
                $scope.total.debtTotal = debtresponse.total;
                $scope.datadebtlastupdate = (new Date).getTime();
                $scope.loadHistory();
                Data.get('haveoweStatus').then(function(response) {
                    if (response.data != null) {
                        if (response.data.basic == '1') {
                            $scope.topNavList[0].completed = true;
                        }
                        if (response.data.kids == '1') {
                            $scope.topNavList[1].completed = true;
                        }
                        if (response.data.makespend == '1') {
                            $scope.topNavList[3].completed = true;
                        }
                        if (response.data.haveowe == '1') {
                            if ($scope.formReview) {
                                $scope.formReview = false;
                                $scope.ShowReview = false;
                            } else {
                                $scope.ShowReview = true;
                                Data.get('loadflagissue').then(function(response) {
                                    angular.forEach(response.data, function(value, key) {
                                        $scope.flaglastupdate = (new Date).getTime();
                                        $scope.flagissueitems[value.qs_id] = {
                                            'status': value.status,
                                            'who_update': value.who_update
                                        };
                                    });
                                    $scope.loadHaveOweReview();
                                    $scope.getflagissue();
                                    $scope.getAssets();
                                    // $scope.loadflagissue();
                                    // $scope.checkissuestatus();
                                });
                                //$scope.loadHaveOweReview();
                            }
                            $scope.closeOverlay();
                        } else {}
                    } else {
                        $scope.ShowReview = false;
                    }
                    $scope.isloading = false;
                });
            });
        });
    }
    //init section
    $scope.closeOverlay = function() {
        $scope.overlayEnable = false;
    };
    $scope.loadHistory = function() {
        Data.get('loadHistory').then(function(response) {
            $scope.history = response.data;
            angular.forEach($scope.history, function(value, key) {
                value.updated = ValidDate(parseInt(value.updated));
            })
        });
    }
    $scope.delete = function(type, id, paindex, index, where) {
        Data.post('delete', {
            type: type,
            id: id
        }).then(function(response) {
            if (response.status == 'SUCCESS') {
                Data.toast(response);
                $scope.loadAssets();
                $scope.loadDebt();
                if (paindex != null) {
                    if (index != null) {
                        if (type == 'assets') {
                            if ($scope.groupedmodel.assets[where][paindex].list[index].outstandingLoanValue != 0) {
                                angular.forEach($scope.groupedmodel.debts[where], function(value, key) {
                                    if (value.id == $scope.groupedmodel.assets[where][paindex].id) {
                                        angular.forEach(value.list, function(value2, key2) {
                                            if (value2.id == $scope.groupedmodel.assets[where][paindex].list[index].id) {
                                                $scope.groupedmodel.debts[where][key].list.splice(key2, 1);
                                                if ($scope.groupedmodel.debts[where][key].list.length == 0) {
                                                    $scope.groupedmodel.debts[where].splice(key, 1);
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                            $scope.groupedmodel.assets[where][paindex].list.splice(index, 1);
                            if ($scope.groupedmodel.assets[where][paindex].list.length == 0) {
                                $scope.groupedmodel.assets[where].splice(paindex, 1);
                            }
                        } else if (type == 'debt') {
                            $scope.groupedmodel.debts[where][paindex].list.splice(index, 1);
                            if ($scope.groupedmodel.debts[where][paindex].list.length == 0) {
                                $scope.groupedmodel.debts[where].splice(paindex, 1);
                            }
                        }
                    }
                }
            }
        });
    }
    //Edit section
    $scope.dropCallback = function(event, index, item, external, type) {
        return item;
    };
    $scope.dropCallbackDebt = function(event, index, item, external, type) {
        return item;
    };
    $scope.logEvent = function(id, event) {
        if (id != null) {
            angular.forEach($scope.models.listsAssets, function(value, key) {
                angular.forEach(value, function(value2, key2) {
                    if (value2.addedby == 'me') {
                        if (id == value2.id) {
                            var timestamp = (new Date).getTime();
                            Data.post('dragUpdate', {
                                type: 'assets',
                                id: id,
                                who: key,
                                timestamp: timestamp
                            }).then(function(response) {
                                $scope.loadHistory();
                                $scope.models.listsAssets = response.assets.result2;
                                $scope.total.assetsTotal = response.assets.total;
                                $scope.models.listDebt = response.debts.result2;
                                $scope.total.debtTotal = response.debts.total;
                            });
                        }
                    }
                });
            });
        }
    };
    $scope.logEventDebt = function(message, event) {
        if (message.id != null) {
            angular.forEach($scope.models.listDebt, function(value, key) {
                angular.forEach(value, function(value2, key2) {
                    if (message.id == value2.id) {
                        if (message.type == 'debt') {
                            var timestamp = (new Date).getTime();
                            Data.post('dragUpdate', {
                                type: message.type,
                                id: message.id,
                                who: key,
                                amount: value2.debyEstimation,
                                timestamp: timestamp
                            }).then(function(response) {
                                $scope.loadHistory();
                                $scope.models.listsAssets = response.assets.result2;
                                $scope.total.assetsTotal = response.assets.total;
                                $scope.models.listDebt = response.debts.result2;
                                $scope.total.debtTotal = response.debts.total;
                                //$scope.loadHaveOwe();
                            });
                        } else if (message.type == 'assets') {
                            Data.post('dragUpdate', {
                                type: message.type,
                                id: message.id,
                                who: key,
                            }).then(function(response) {
                                $scope.loadHistory();
                                $scope.models.listsAssets = response.assets.result2;
                                $scope.total.assetsTotal = response.assets.total;
                                $scope.models.listDebt = response.debts.result2;
                                $scope.total.debtTotal = response.debts.total;
                                //$scope.loadHaveOwe();
                            });
                        }
                    }
                })
            });
        }
    };
    $scope.$watch('models', function(model) {}, true);
    $scope.edit = function(id, type) {
        $scope.addAssetsValidate = false;
        $scope.assetError = false;
        $scope.assetErrorMsg = '';
        Data.post('getSingle', {
            id: id,
            type: type
        }).then(function(response) {
            if (response.status == 'SUCCESS') {
                if (type == 'assets') {
                    $scope.PopUpShow('editPopUpAssets');
                    $scope.editAssetsData = response.data;
                } else if (type == 'debt') {
                    $scope.PopUpShow('editPopUpDebt');
                    $scope.editDebtValue = response.data;
                }
            } else {
                Data.toast(response);
            }
        });
    };
    $scope.editAssets = function(data, e) {
        $scope.IOE_ER_MSG = '';
        if (e.$invalid) {
            $scope.IOEvalidation(e);
            $scope.IOE_ER_MSG = 'Please fill the required fields';
            return;
        } else if (e.$valid) {
            if (data.whoWillKeep == '4') {
                if (parseInt(data.my_assetvalue) > parseInt(data.assetsEstimation) || parseInt(data.spouse_assetvalue) > parseInt(data.assetsEstimation) || (parseInt(data.my_assetvalue) + parseInt(data.spouse_assetvalue)) > parseInt(data.assetsEstimation)) {
                    $scope.assetError = true;
                    $scope.assetErrorMsg = "You entered amount is more than estimation value";
                    return;
                }
            }
            var timestamp = (new Date).getTime();
            Data.post('editAssetsUpdate', {
                data: data,
                timestamp: timestamp
            }).then(function(response) {
                if (response.status == 'SUCCESS') {
                    Data.toast(response);
                    $scope.models.listsAssets = response.assets.result2;
                    $scope.total.assetsTotal = response.assets.total;
                    $scope.models.listDebt = response.debts.result2;
                    $scope.total.debtTotal = response.debts.total;
                    // if ($scope.flagAnsChanged) {
                    //     $scope.updateFlagResponse($scope.spouseFlagQs, $scope.spouseFlagAns, $scope.spouseFlagAnsin, $scope.mailData)
                    // }
                    $scope.editPopUpSec = false;
                    $scope.loadHaveOweReview();
                    $scope.PopUpHide();
                } else {
                    Data.toast(response);
                }
            });
        }
    };
    $scope.editDebt = function(data, e) {
        $scope.IOE_ER_MSG = '';
        if (e.$invalid) {
            $scope.IOEvalidation(e);
            $scope.IOE_ER_MSG = 'Please fill the required fields';
            return;
        } else if (e.$valid) {
            if (data.howMuchDebtGot == 0) {
                $scope.debtError = true;
                $scope.debtErrorMsg = "Enter correct debt value";
                return;
            }
            var timestamp = (new Date).getTime();
            Data.post('editDebtUpdate', {
                data: data,
                timestamp: timestamp
            }).then(function(response) {
                if (response.status == 'SUCCESS') {
                    $scope.models.listsAssets = response.assets.result2;
                    $scope.total.assetsTotal = response.assets.total;
                    $scope.models.listDebt = response.debts.result2;
                    $scope.total.debtTotal = response.debts.total;
                    $scope.editPopUpSec = false;
                    $scope.loadHaveOweReview();
                    $scope.PopUpHide();
                }
            });
        }
    };
    //Edit section
    $scope.complete = function() {
        $scope.ShowReview = true;
        Data.post('updateBookmark', {
            data: {
                haveowe: '1'
            }
        }).then(function(response) {
            //$scope.loadHaveOweReview();
            $scope.loadflagissue();
        });
    }
    $scope.loadHaveOweReview = function() {
        $scope.groupedmodel.assets = groupingitems($scope.models.listsAssets, 1, $scope.assetsTypeList.length);
        $scope.groupedmodel.debts = groupingitems($scope.models.listDebt, 2, $scope.assetsTypeList.length);
    }
    // proposal
    $scope.getflagissue = function() {
        Data.post('loadflagissue', {
            timestamp: $scope.flaglastupdate
        }).then(function(response) {
            angular.forEach(response.data, function(value, key) {
                $scope.flagissueitems[value.qs_id] = {
                    'status': value.status,
                    'who_update': value.who_update
                };
            });
            $scope.checkissuestatus();
            $scope.flaglastupdate = (new Date).getTime();
            $timeout(function() {
                $scope.getflagissue();
            }, 7000);
        });
    }
    $scope.loadflagissue = function() {
        Data.get('loadflagissue').then(function(response) {
            angular.forEach(response.data, function(value, key) {
                $scope.flagissueitems[value.qs_id] = {
                    'status': value.status,
                    'who_update': value.who_update
                };
            });
            $scope.groupedmodel.assets = groupingitems($scope.models.listsAssets, 1, $scope.assetsTypeList.length);
            $scope.groupedmodel.debts = groupingitems($scope.models.listDebt, 2, $scope.assetsTypeList.length);
            $scope.checkissuestatus();
        });
    }
    $scope.issuestatus = 0;
    $scope.checkissuestatus = function() {
        var unresolved = 0;
        if (Object.keys($scope.flagissueitems).length > 0) {
            angular.forEach($scope.flagissueitems, function(value, key) {
                if (value.status != '2') {
                    unresolved++;
                }
            });
            if (unresolved > 0) {
                $scope.issuestatus = 1;
            } else {
                $scope.issuestatus = 2;
            }
        }
    }
    $scope.disableflag = false;
    $scope.flagissue = function(qsid, type, pindex, index, who, itemid) {
        if (!$scope.disableflag) {
            $scope.disableflag = true;
            if (who != 0) {
                if ($scope.flagissueitems[qsid] == null) {
                    var data = {};
                    if (type == 1) {
                        data.acquire = $scope.groupedmodel.assets[who][pindex].list[index].acquireAssets;
                        if ($scope.groupedmodel.assets[who][pindex].list[index].whoWillKeep == 'shared') {
                            data.whowillkeep = 3;
                            data.sharedtype = 1;
                        } else {
                            data.whowillkeep = 2;
                        }
                        data.estimation = $scope.groupedmodel.assets[who][pindex].list[index].assetsEstimation;
                        data.itemtype = 1;
                    } else {
                        if (type == 2) {
                            data.acquire = $scope.groupedmodel.debts[who][pindex].list[index].acquireDeby;
                            if ($scope.groupedmodel.debts[who][pindex].list[index].whoWillKeep == 'shared') {
                                data.whowillkeep = 3;
                                data.sharedtype = 1;
                            } else {
                                data.whowillkeep = 2;
                            }
                            data.estimation = $scope.groupedmodel.debts[who][pindex].list[index].debyEstimation;
                            data.itemtype = 2;
                        } else {
                            data.acquire = $scope.groupedmodel.assets[who][pindex].list[index].acquireAssets;
                            if ($scope.groupedmodel.assets[who][pindex].list[index].whoWillKeep == 'shared') {
                                data.whowillkeep = 3;
                                data.sharedtype = 1;
                            } else {
                                data.whowillkeep = 2;
                            }
                            data.estimation = $scope.groupedmodel.assets[who][pindex].list[index].assetsEstimation;
                            data.itemtype = 1;
                        }
                    }
                    if (Object.keys(data).length > 0) {
                        data.itemid = itemid;
                        data.lastupdated = (new Date).getTime();
                        data.qs_id = qsid;
                        Data.post('flagissue', data).then(function(response) {
                            $scope.flagissueitems[qsid] = {
                                'status': 0,
                                'who_update': 2
                            };
                            $scope.openproposalpop(1, qsid, pindex, index, type, who, 1);
                            $scope.checkissuestatus();
                            $scope.disableflag = false;
                        });
                    }
                } else {
                    console.log('Already Issue flaged');
                }
            }
        }
    }
    $scope.enablesubmit = false;
    $scope.enablecloseconfirm = false;
    $scope.closeproposal = function() {
        if (!$scope.enablesubmit) {
            $scope.enablecloseconfirm = false;
            $scope.proposalerror = '';
            $scope.enablesubmit = false;
            $scope.openproposal = false;
            $scope.iscounter = false;
            $("html").css('overflow', 'auto');
        } else {
            $scope.enablecloseconfirm = true;
        }
    }
    $scope.confirmclose = function() {
        $scope.enablesubmit = false;
        $scope.closeproposal();
    }
    $scope.cancelconfirm = function() {
        $scope.enablecloseconfirm = false;
    }
    $scope.iscounter = false;
    $scope.opencounterproposalpop = function(poptype, tempqsid, temppindex, tempindex, temptype, tempwhere, who_update) {
        $scope.iscounter = true;
        $scope.openproposalpop(poptype, tempqsid, temppindex, tempindex, temptype, tempwhere, who_update);
    }
    $scope.openproposalpop = function(poptype, qsid, paindex, index, type, where, who) {
        $scope.proposal = {};
        $scope.disableEdit = false;
        $scope.Confirmrejection = false;
        $scope.temppindex = paindex;
        $scope.tempindex = index;
        $scope.temptype = type;
        $scope.tempqsid = qsid;
        $scope.tempwhere = where;
        $scope.proposalerror = '';
        var title = null;
        if (type == 1) {
            $scope.currentissuedata = $scope.groupedmodel.assets[where][paindex].list[index];
            $scope.currentissuedata.type = 'assets';
            title = $scope.currentissuedata.assetTypeName;
        } else {
            $scope.currentissuedata = $scope.groupedmodel.debts[where][paindex].list[index];
            if (type == 3) {
                $scope.currentissuedata.type = 'assets';
            } else {
                $scope.currentissuedata.type = 'debt';
            }
            title = $scope.currentissuedata.debtTypeName;
        }
        $scope.who_update = who;
        Data.post('loadsingleProposal', {
            qs_id: qsid,
            who_update: $scope.who_update
        }).then(function(response) {
            $scope.submitedvaluepro = response.data;
            $scope.proposalqsid = qsid;
            switch (poptype) {
                case 1:
                    $scope.openchatwithproposal(title, qsid)
                    break;
                case 2:
                    $scope.disableEdit = true;
                    $scope.proposal = $scope.submitedvaluepro;
                    $scope.openpopuppro('proposal');
                    break;
                case 3:
                    $scope.openpopuppro('viewResolve');
                    break;
                case 4:
                    $scope.openpopuppro('proposal');
                    break;
                default:
                    break;
            }
        });
    }
    $scope.proposalnotify = false;
    $scope.openchatwithproposal = function(title, id) {
        $scope.proposalnotify = true;
        $scope.openpopuppro('proposal');
    }
    $scope.openchatwithoutproposal = function(title, id) {
        $scope.proposalnotify = false;
        $scope.openchat(title, id);
    }
    $scope.openpopuppro = function(temp) {
        if (temp != null && temp != '') {
            $scope.IOE_ER_MSG = "";
            $scope.openproposaltemp = temp;
            $(window).scrollTop(0);
            $("html").css('overflow', 'hidden');
            $scope.openproposal = true;
        }
    }
    $scope.viewProposal = function(qsid, paindex, index, type, where) {
        if (type == 'assets') {
            $scope.currentissuedata = $scope.groupedmodel.assets[where][paindex].list[index]
            $scope.currentissuedata.type = type;
        }
        $(window).scrollTop(0);
        $("html").css('overflow', 'hidden');
        $scope.proposalqsid = qsid;
        if ($scope.flagissueitems[qsid].status == '0') {} else if ($scope.flagissueitems[qsid].status == '1') {
            if ($scope.flagissueitems[qsid].who_update == '1') {
                $scope.openproposaltemp = 'viewResolve';
            } else if ($scope.flagissueitems[qsid].who_update == '2') {
                $scope.openproposaltemp = 'pstatus1';
            }
            $scope.openproposal = true;
        } else {
            $scope.openproposaltemp = 'presolved';
        }
    }
    $scope.loadsingleProposal = function(who) {
        Data.post('loadsingleProposal', {
            qs_id: $scope.proposalqsid,
            who: who
        }).then(function(response) {});
    }
    $scope.beforeSubmit = function(e) {
        if (e.$invalid) {
            $scope.IOEvalidation(e);
            $scope.IOE_ER_MSG = 'Please fill the required fields';
            return;
        } else if (e.$valid) {
            $scope.IOE_ER_MSG = "";
            $scope.enablesubmit = true;
        }
    }
    $scope.proposalupdate = function(e, data) {
        if (e.$invalid) {
            $scope.IOEvalidation(e);
            $scope.IOE_ER_MSG = 'Please fill the required fields';
            return;
        } else if (e.$valid) {
            $scope.IOE_ER_MSG = "";
            $scope.proposalerror = '';
            if (!$scope.enablesubmit) {
                return false;
            }
            if (!$scope.who_update) {
                return;
            }
            if (data.whowillkeep == 4) {
                if (data.splittype == 1) {
                    if ($scope.currentissuedata.type == 'assets') {
                        if (data.doller.me > $scope.currentissuedata.assetsEstimation || data.doller.spouse > $scope.currentissuedata.assetsEstimation || (parseInt(data.doller.me) + parseInt(data.doller.spouse)) > parseInt($scope.currentissuedata.assetsEstimation)) {
                            $scope.IOE_ER_MSG = "You entered amount is more than estimation value";
                            return;
                        }
                    }
                } else if (data.splittype == 2) {
                    if ($scope.currentissuedata.type == 'assets') {
                        if (data.percent.me > 100 || data.percent.spouse > 100 || (parseInt(data.percent.me) + parseInt(data.percent.spouse)) > 100) {
                            $scope.IOE_ER_MSG = "More than 100 percent value not allowed";
                            return;
                        }
                    }
                }
            }
            if ($scope.proposalqsid != null) {
                data['who_update'] = $scope.who_update;
                data['lastupdated'] = (new Date).getTime();
                Data.post('updateFlagissue', {
                    qs_id: $scope.proposalqsid,
                    data: data,
                    counter: $scope.iscounter
                }).then(function(response) {
                    if (response.status == 'SUCCESS') {
                        $scope.flagissueitems[$scope.proposalqsid] = {
                            'status': 1,
                            'who_update': $scope.who_update
                        };
                        $scope.enablesubmit = false;
                        $scope.openpopuppro('pstatus1');
                    }
                    $scope.checkissuestatus();
                });
            }
        }
    }
    $scope.Confirmrejection = false;
    $scope.Confirmrejectionfunc = function() {
        $scope.Confirmrejection = true;
    }
    $scope.proposalresponse = function(data, who, msg) {
        $scope.Confirmrejection = false;
        if ($scope.proposalqsid != null) {
            data.lastupdated = (new Date).getTime();
            Data.post('responseFlagissue', {
                qs_id: $scope.proposalqsid,
                data: data,
                who: who,
                msg: msg
            }).then(function(response) {
                if (response.status == 'SUCCESS') {
                    who = who == 1 ? 2 : 1;
                    if (data == 1) {
                        $scope.flagissueitems[$scope.proposalqsid] = {
                            'status': 2,
                            'who_update': who
                        };
                        $scope.openpopuppro('presolved');
                        $scope.loadAssets();
                        $scope.loadDebt();
                        $timeout(function() {
                            $scope.loadHaveOweReview();
                        }, 300);
                    } else {
                        $scope.flagissueitems[$scope.proposalqsid] = {
                            'status': 0,
                            'who_update': who
                        };
                        $scope.closeproposal();
                    }
                    $scope.checkissuestatus();
                    $rootScope.loadAssetsAnddebt();
                }
            });
        }
    }
    // proposal
    $scope.gobackHaveOwe = function(id) {
        $scope.debtnewshow = false;
        $scope.assetsnewshow = false;
        $scope.addNewToggle(id);
        $scope.formReview = true;
        $scope.ShowReview = false;
    }
    $scope.loadAssets = function() {
        Data.get('loadAssets').then(function(response) {
            $scope.models.listsAssets = response.data;
            $scope.total.assetsTotal = response.total;
            $scope.loadHistory();
        });
    };
    $scope.getAssets = function() {
        Data.post('loadAssets', {
            timestamp: $scope.dataassetlastupdate
        }).then(function(response) {
            if (response.data['spouse'].length > 0 || response.data['shared'].length > 0) {
                $scope.newnotification = true;
            } else {
                $timeout(function() {
                    $scope.getAssets();
                }, 30000);
            }
        });
    };
    $scope.loadDebt = function() {
        Data.get('loadDebt').then(function(response) {
            $scope.models.listDebt = response.data;
            $scope.total.debtTotal = response.total;
            $scope.loadHistory();
        });
    };
    $scope.initHaveOwe();
    $scope.resetcustomsplit = function(f, e, proposal) {
        $scope.IOEradiochange(f, e);
        proposal.doller = {};
        proposal.percent = {};
    }
    $scope.checkisopen = function(item) {
        var flag = false;
        if (item.isasset) {
            if ($scope.flagissueitems['myAssest_' + item.id] != undefined) {
                if ($scope.flagissueitems['myAssest_' + item.id].who_update != '1' && $scope.flagissueitems['myAssest_' + item.id].status == '0') {
                    if (item.addedby != 'me') flag = true;
                }
            }
        } else {
            if ($scope.flagissueitems['myDebt_' + item.id] != undefined) {
                if ($scope.flagissueitems['myDebt_' + item.id].who_update != '1' && $scope.flagissueitems['myDebt_' + item.id].status == '0') {
                    if (item.addedby != 'me') flag = true;
                }
            }
        }
        return flag;
    }
    $scope.spoverlayclick = function(f, e, proposal, a) {
        proposal.splittype = a;
        $scope.resetcustomsplit(f, e, proposal);
    }
});
app.factory("Haveowe", ['$http', 'toaster',
    function($http, toaster) { // This service connects to our REST API
        var serviceBase = BASE_URL + 'api/haveowe/';
        var obj = {};
        obj.toast = function(data) {
            toaster.pop(data.status.toLowerCase(), "", data.message, 10000, 'trustedHtml');
        }
        obj.get = function(q) {
            return $http.get(serviceBase + q, {
                timeout: 500000
            }).then(function(results) {
                return results.data;
            });
        };
        obj.post = function(q, object) {
            //object.ioe_csrf_token = IOE_CSRF_TOKEN;
            return $http.post(serviceBase + q, object).then(function(response) {
                return response.data;
            });
        };
        obj.put = function(q, object) {
            return $http.put(serviceBase + q, object).then(function(results) {
                return results.data;
            });
        };
        obj.delete = function(q) {
            return $http.delete(serviceBase + q).then(function(results) {
                return results.data;
            });
        };
        return obj;
    }
]);
app.controller('makeSpend', function($scope, Data, Chat, $rootScope, $timeout){
    $scope.isloading = false;
    $scope.incomenewshow = false;
    $scope.expensenewshow = false;
    $scope.who;
    $scope.saveCurrentJoberror = false;
    $scope.addIncomeValidate = false;
    $scope.addExpenseValidate = false;
    $scope.emForm = {};
    $scope.spouseFlagQs = null;
    $scope.spouseFlagAns = null;
    $scope.flagAnsChanged = false;
    $scope.spouseFlagAnsin = null;
    $scope.mailData = null;
    $scope.ShowReview = false;
    $scope.first_step = [
        {
            title:'Basic Info',
            icon:'/static/img/icons/progressBar/basic.png',
            color: '#25b7d3',
            url : '#!/basic',
            status:'incomplete',
            inner:[]
        },
        {
            title:'Kids',
            icon:'/static/img/icons/progressBar/kids.png',
            color: '#e04f5f',
            url : '#!/kids',
            status:'incomplete',
            inner:[]
        },
        {
            title:'Have/Owe',
            icon:'/static/img/icons/progressBar/haveOwe.png',
            color: '#f8bc3c',
            url : '#!/HaveOwe',
            status:'incomplete',
        },
        {
            title:'Make/Spend',
            icon:'/static/img/icons/progressBar/makeSpend.png',
            color: '#52b74a',
            url : '#!/MakeSpend',
            status:'incomplete',
            inner:[
                {
                    id:'1',
                    status:'',
                    title:'Work Info',
                    forms:[
                        {
                            id:'Step1'
                        },
                        {
                            id:'Step2',
                        },
                        {
                            id:'Step3'
                        },
                        {
                            id:'Step4'
                        }
                    ]
                },
                {
                    id:'2',
                    status:'',
                    title:'Add Income/ Expense',
                    forms:[]
                },
                {
                    id:'3',
                    status:'',
                    title:'Review',
                    forms:[]
                }
            ]
        },
        {
            title:'The Deal',
            icon:'/static/img/icons/progressBar/deal.png',
            color: '#9f6aac',
            url : '#!/Deal',
            status:'incomplete',
            inner:[]
        },
    ];
    $scope.howoftentype = ['','Monthly', 'Bi-Weekly', 'Weekly', 'Hourly'];
    $scope,firstformsitems = [
        {
            qs:'Employer',
            myans:'',
            id:'selfEmp',
            location:{j:0}
        },
        {
            qs:'I work about',
            myans:'',
            id:'workinghours',
            location:{}
        },
        {
            qs:'Employer\'s Address (includes self-employment work address)',
            myans:'',
            id:'address1',
            location:{}
        },
        {
            qs:'Suite, unit, building',
            myans:'',
            id:'address2',
            location:{}
        },
        {
            qs:'City',
            myans:'',
            id:'city',
            location:{}
        },
        {
            qs:'State',
            myans:'',
            id:'state',
            location:{}
        },
        {
            qs:'Zip code',
            myans:'',
            id:'zip',
            location:{}
        },
        {
            qs:'Phone number',
            myans:'',
            id:'phone',
            location:{}
        },
        {
            qs:'What is your tax status?',
            myans:'',
            id:'taxStatus',
            location:{}
        },
        {
            qs:'I last field taxes for tax year (specify year)',
            myans:'',
            id:'taxyear',
            location:{}
        },
        {
            qs:'I claim the following number of exemptions',
            myans:'',
            id:'taxExemption',
            location:{}
        },
        {
            qs:'Have you completed high school or have your GED?',
            myans:'',
            id:'schoolCompleted',
            location:{}
        },
        {
            qs:'How many years of college have you completed?',
            myans:'',
            id:'noofyears',
            location:{}
        },
        {
            qs:'What college degrees do you have?',
            myans:'',
            id:'DegreeObtained',
            location:{}
        },
        {
            qs:'How many years of grad school do you have?',
            myans:'',
            id:'noofyearsgrad',
            location:{}
        },
        {
            qs:'What graduate degrees do you have?',
            myans:'',
            id:'DegreeObtained2',
            location:{}
        },
        {
            qs:'I have these professional/occupational license(s) and/or vocational training',
            myans:'',
            id:'ihaveText',
            location:{}
        }
    ];
    $scope.initmakespend = function(){
        $scope.isloading = true;
        Data.get('initloadmakespend').then(function(response){
            if(response.status == 'SUCCESS'){
                $scope.loadHistory();
                if(response.firstforms){
                    $scope.emForm = response.firstforms;
                }
                if(response.incomeandexpense){
                    $scope.models.listsIncome = response.incomeandexpense.data.income;
                    $scope.models.listExpense = response.incomeandexpense.data.expense;
                    $scope.total.incomeTotal = response.incomeandexpense.total.income;
                    $scope.total.expenseTotal = response.incomeandexpense.total.expense;
                }
                if(response.progressstatus){
                    if(response.progressstatus.basic=='1'){
                        $scope.first_step[0].status = 'completed';
                    }
                    if(response.progressstatus.kids=='1'){
                        $scope.first_step[1].status = 'completed';
                    }
                    if(response.progressstatus.haveowe=='1'){
                        $scope.first_step[2].status = 'completed';
                    }
                    if(response.progressstatus.makeSpendFirst!=''){
                        if(response.progressstatus.makespend=='1'){
                            $scope.ShowReview = true;
                            $scope.formHide = true;   
                            $scope.overlayEnable = false;
                        }
                        else{
                            if(response.progressstatus.makeSpendFirst == '4'){
                                $scope.formHide = true;
                            }
                            else{
                                $scope.k = parseInt(response.progressstatus.makeSpendFirst);
                                $scope.loadTemp($scope.k);
                            }
                        }
                    }
                    else{
                        $scope.k = 0;
                        $scope.loadTemp($scope.k);
                    }
                }
                else{
                    $scope.k = 0;
                    $scope.loadTemp($scope.k);
                }
                if($rootScope.Iconclick){
                    if($rootScope.iconI == 0){
                        $scope.k = $rootScope.iconI;
                        $scope.formReview = false;
                        $scope.iconEdit = true;
                        $scope.ShowReview = false;
                        $scope.formHide = false;
                        $scope.loadTemp($scope.k);
                    }
                    else if($rootScope.iconI == 1){
                        $scope.formHide = true;
                        $scope.ShowReview = false;
                        $scope.formHide = true;
                        //$scope.gobackMakeSpend();
                    }
                    else{
                        $scope.formHide = true;
                        $scope.formReview = false;
                        $scope.ShowReview = true;   
                    }
                }
                $scope.isloading = false;
            }
        });
    }
    $scope.nextQs = function(f){
        if(f.$valid){
            $scope.IOE_ER_MSG = '';
            $scope.saveCurrentJoberror = false;
            if(!angular.isUndefined($scope.first_step[3].inner[0].forms[$scope.k+1])){
                $scope.k++;
                $scope.loadTemp($scope.k);
                $scope.updateStep($scope.k);
                $scope.percent_t = ($scope.k/$scope.first_step[3].inner[0].forms.length)*100;
            }
            else if($scope.k == 3){
                //$scope.saveCurrentJob($scope.emForm);
                $scope.updateStep(4);
                $scope.formHide = true;
            }
        }
        else{
            $scope.IOEvalidation(f);
            $scope.IOE_ER_MSG = 'Please fill the required fields';
            return;
        }
    }
    $scope.prevQs = function(){
        $scope.IOE_ER_MSG = '';
        if(!angular.isUndefined($scope.first_step[3].inner[0].forms[$scope.k-1])){
            $scope.k--;
            $scope.loadTemp($scope.k);
            $scope.percent_t = ($scope.k/$scope.first_step[3].inner[0].forms.length)*100;
        }   
        $scope.checksidebar($scope.k);
    }
    $scope.firstformchange = function(f,e){
        $scope.emForm.empName='';
        $scope.IOEradiochange(f,e);
    }
    $scope.loadTemp = function(k){
        if(angular.isDefined(k)){
            if(angular.isDefined($scope.first_step[3].inner[0].forms[k])){
                $scope.percent_t = (k/$scope.first_step[3].inner[0].forms.length)*100;
                $scope.MakeSpendStep = $scope.first_step[3].inner[0].forms[k].id;
            }
        }
    }
    $scope.updateStep = function(step){
        Data.post('updateStep',{
            data : step
        }).then(function(response){
            $scope.saveCurrentJob($scope.emForm);
        }); 
    }
    $scope.saveCurrentJob = function(data){
        Data.post('saveCurrentJob',{
            data : $scope.emForm
        }).then(function(response){
            Data.toast(response);
        });
    };
    $scope.loadData = function(){
        Data.get('loadmakespend').then(function(response){
            $scope.models.listsIncome = response.result.data.income;
            $scope.models.listExpense = response.result.data.expense;
            $scope.total.incomeTotal = response.result.total.income;
            $scope.total.expenseTotal = response.result.total.expense;
            // $scope.loadHistory();
            $scope.models($scope.models);
        });
    };
    $scope.initmakespend();

    $scope.addNewToggle = function(id, who){
        $scope.addIncomeValidate = false;
        $scope.addExpenseValidate = false;
        if(id == 'income'){
            $scope.who = who;
            $scope.incomenewshow = !$scope.incomenewshow;
        }
        else if(id == 'expense'){
            $scope.who = who;
            $scope.expensenewshow = !$scope.expensenewshow;
        }
    }
    $scope.addNewClose = function(id){
        if(id == 'income'){
            $scope.incomenewshow = false;
        }
        else if(id == 'expense'){
            $scope.expensenewshow = false;
        }
    }
    
    $scope.validateAddIncome = function(){
        $scope.addIncomeValidate = true;
    }    
    $scope.validateAddExpense = function(){
        $scope.addExpenseValidate = true;
    }    
    $scope.invalid = function(){
        $scope.saveCurrentJoberror = true;
    }
    $scope.overlayEnable = false;
    $scope.openOverlay = function(){
        $scope.overlayEnable = true;
    }
    $scope.closeOverlay = function(){
        $scope.overlayEnable = false;
    };
    $scope.formHide = false;
    $scope.loadCurrentJob = function(){
        $scope.isloading = true;
        Data.get('loadCurrentJob').then(function(response){
            if(response.result){
                $scope.emForm = response.result;
                //$scope.overlayEnable = true;
                //$scope.formHide = true;
            }
            if(response.step != null){
                $scope.first_step[0].status = response.step.basic == '1' ? 'complete' : 'incomplete';
                $scope.first_step[1].status = response.step.kids == '1' ? 'complete' : 'incomplete';
                $scope.first_step[2].status = response.step.haveOwe == '1' ? 'complete' : 'incomplete';
                $scope.first_step[3].status = response.step.makeSpend == '1' ? 'complete' : 'incomplete';
            }
            
            if(!$scope.formReview){
                if(response.step != null && response.step != ''){
                    $scope.MakeSpendStep = response.step.makeSpendFirst;
                    switch ($scope.MakeSpendStep){
                        case 'Step1':
                            $scope.k = 0;
                        break;
                        case 'Step2':
                            $scope.k = 1;
                        break;
                        case 'Step3':
                            $scope.k = 2;
                        break;
                        case 'Step4':
                            $scope.k = 3;
                        break;
                        case 'completed':
                           // $scope.overlayEnable = true;
                            $scope.formHide = true;
                        break;
                        default:
                            $scope.MakeSpendStep = 'Step1'; 
                            $scope.k = 0;        
                            $scope.percent_t = 25 ;   
                        break;
                    }
                    $scope.percent_t = ($scope.k/$scope.first_step[3].inner[0].forms.length)*100;

                }
                else{
                    $scope.MakeSpendStep = 'Step1'; 
                    $scope.k = 0;        
                    $scope.percent_t = 25 ;   
                }
            }
            if($scope.iconEdit){
                $scope.MakeSpendStep = 'Step1'; 
                $scope.k = 0;        
                $scope.percent_t = 25 ;
            }
            $scope.isloading = false;
            
            $scope.checksidebar($scope.k);
        });
    }
    
    
    $scope.first_step[3].status = 'current';
    $scope.i = 3;
    $scope.j = 0;
    //$scope.k = 0;
  //  $scope.percent_t = 25 ;
    
    $scope.history = [];
    $scope.incomeTypeList = [
        {},
        {
            'title':'Salary or wages',
            'subtitle':'gross, before taxes'
        },
        {
            'title':'Overtime',
            'subtitle':'gross, before taxes'
        },
        {
            'title':'Commissions or bonus',
            'subtitle':''
        },
        {
            'title':'Public assistance',
            'subtitle':'for example: TANF,SSI,GA/GR'
        },
        {
            'title':'Spousal support',
            'subtitle':'from different marriage'
        },
        {
            'title':'Pension/retirement fund payments',
            'subtitle':''
        },
        {
            'title':'Social security retirement',
            'subtitle':'not SSI'
        },
        {
            'title':'Disability',
            'subtitle':''
        },
        {
            'title':'Unemployment compensation',
            'subtitle':''
        },
        {
            'title':'Workers\' compensation',
            'subtitle':''
        },
        {
            'title':'Other',
            'subtitle':'military BAQ, royalty payments, etc.'
        },
        {
            'title':'Self-employment',
            'subtitle':''
        },
    ];
    $scope.expenseTypeList = [
        {},
        {
            'title':'Auto',
            'subtitle':''
        },
        {
            'title':'Charitable contributions',
            'subtitle':''
        },
        {
            'title':'Child care',
            'subtitle':''
        },
        {   
            'title':'Clothes',
            'subtitle':''
        },
        {
            'title':'Education',
            'subtitle':''
        },
        {
            'title':'Groceries/household',
            'subtitle':'not SSI'
        },
        {
            'title':'Home',
            'subtitle':''
        },
        {
            'title':'Health-care cost not paid insurance',
            'subtitle':''
        },
        {
            'title':'Homeowner\'s insurance',
            'subtitle':''
        },
        {
            'title':'Installment payments',
            'subtitle':''
        },
        {
            'title':'Insurance',
            'subtitle':''
        },
        {
            'title':'Laundry/cleaning',
            'subtitle':''
        },
        {
            'title':'Maintenance and Repair',
            'subtitle':''
        },
        {
            'title':'Other',
            'subtitle':''
        },
        {
            'title':'Property taxes',
            'subtitle':''
        },
        {
            'title':'Recreational',
            'subtitle':''
        },
        {
            'title':'Savings/investment',
            'subtitle':''
        },
        {
            'title':'Telephone',
            'subtitle':''
        },
        {
            'title':'Utilities',
            'subtitle':''
        },
        {
            'title':'Past due child or spousal support',
            'subtitle':''
        }
    ];
    $scope.delete = function(type, id){
        Data.post('delete',{
            type: type,
            id: id
        }).then(function(response){
            Data.toast(response);
            $scope.loadData();
        });
    }
    $scope.menuOptions = [
        ['Delete', function ($itemScope, event, modelValue) {
            Data.post('delete',{
                type: modelValue.type,
                id: modelValue.id
            }).then(function(response){
                Data.toast(response);
                $scope.loadData();
            });
        }],
        ['Edit', function ($itemScope, event, modelValue) {
            $scope.edit(modelValue.id, modelValue.type)
            
        }],
    ];
    $scope.models = {
        selected: null,
        listsIncome: {},
        listExpense: {}
    };  
    $scope.total = {
        incomeTotal :'',
        expenseTotal : ''
    };
    $scope.formReview = false;
    $timeout(function(){
        if($rootScope.userType == 3){
          //  $rootScope.loadMakeSpendComplete();
        }
    }, 7000);
    $rootScope.loadMakeSpendComplete = function(){
        Data.get('loadCurrentJob').then(function(response){
            if(response.result){
                $scope.emForm = response.result;
            }
        });
        Data.get('loadData').then(function(response){
            $scope.models.listsIncome = response.data.income;
            $scope.models.listExpense = response.data.expense;
            $scope.total.incomeTotal = response.total.income;
            $scope.total.expenseTotal = response.total.expense;
        });
        $timeout(function(){
            if($rootScope.userType == 3){
              //  $rootScope.loadMakeSpendComplete();
            }
        }, 7000);
    }
    // $scope.loadData = function(){
    //     $scope.isloading = true;
    //     Data.get('loadData').then(function(response){
    //         $scope.models.listsIncome = response.data.income;
    //         $scope.models.listExpense = response.data.expense;
    //         $scope.total.incomeTotal = response.total.income;
    //         $scope.total.expenseTotal = response.total.expense;
    //         $scope.loadHistory();
    //         Data.get('makespendStatus').then(function(response){
    //             if(response.data.makespend == '1'){

    //                 if($scope.formReview){
    //                    // $scope.formReview = false;
    //                     $scope.ShowReview = false;
    //                 }
    //                 else{
    //                     $scope.ShowReview = true;    
    //                 }
                    
    //                 $scope.closeOverlay();
    //             }
    //             $scope.isloading = false;
    //         });
    //     });
    // };
    $scope.loadHistory = function(){
        Data.get('loadHistoryMS').then(function(response){
            $scope.history = response.data;
        });
    };
    $scope.addIncome = function(data){
        data.incomeBelongto = $scope.who;
        Data.post('addIncome',{
            data : data
        }).then(function(response){
            Data.toast(response);
            $scope.addNewClose('income');
            $scope.loadData();
        });
    };
    $scope.addExpense = function(data){
        data.belongTo = $scope.who;
        Data.post('addExpense',{
            data : data
        }).then(function(response){
            Data.toast(response);
            $scope.loadData();
            $scope.addNewClose('expense');
        });
    };
    $scope.jobEdit = function(id){
        $scope.k = id;
        $scope.MakeSpendStep = $scope.first_step[3].inner[0].forms[id].id;
        $scope.formReview = true;
        $scope.ShowReview = false;
        $scope.formHide = false;
    }
    $scope.saveReview = function(f){
        if(f.$valid){
            $scope.saveCurrentJob($scope.emForm);
            $scope.ShowReview = true;
            $scope.formHide = true;   
            $scope.overlayEnable = false;
        }
        else{
            $scope.IOEvalidation(f);
            $scope.IOE_ER_MSG = 'Please fill the required fields';
            return;
        }
    }
    $scope.edit = function(id, type){
        Data.post('getSingle', {
            id : id,
            type : type
        }).then(function(response){
            if(response.status == 'SUCCESS'){
                if(type == 'income'){
                    $scope.PopUpShow('editPopUpIncome');
                    $scope.editIncomeData = response.data;
                }
                else if(type == 'expense'){
                    $scope.PopUpShow('editPopUpExpense');
                    $scope.editExpenseData = response.data;
                }
            }
            else{
                Data.toast(response);
            }
        });
    };
    $scope.editIncome = function(data){
        Data.post('editIncomeUpdate',{
            data : data
        }).then(function(response){
            if($scope.flagAnsChanged){
                $scope.updateFlagResponse($scope.spouseFlagQs, $scope.spouseFlagAns, $scope.spouseFlagAnsin, $scope.mailData)
            }
            $scope.loadData();
            //$scope.editPopUpSec = false; 
            $scope.PopUpHide();
        });
    };
    $scope.editExpense = function(data){
        Data.post('editExpenseUpdate',{
            data : data
        }).then(function(response){
            if($scope.flagAnsChanged){
                $scope.updateFlagResponse($scope.spouseFlagQs, $scope.spouseFlagAns, $scope.spouseFlagAnsin, $scope.mailData)
            }
            $scope.loadData();
            //$scope.editPopUpSec = false; 
            $scope.PopUpHide();
        });
    };
    $scope.PopUpShow = function(temp){
        $scope.openPopUp = true;
        $("html").css('overflow','hidden');
        $scope.PopUpTemp = temp;
    }
    $scope.PopUpHide = function(){
        $scope.openPopUp = false;
        $("html").css('overflow','auto');
        $scope.PopUpTemp = 'holidayPop';
    }
    $scope.complete = function(){
        $scope.ShowReview = true;
        Data.post('updateBookmark', {
            data : {makespend:'1'}
        }).then(function(response){

        });
    }
    $scope.gobackMakeSpend = function(){
        // Data.post('updateBookmark', {
        //     data : {makeSpend:'incomplete'}
        // }).then(function(response){

        // });
        $scope.formReview = true;
        $scope.ShowReview = false;   
    }
    $scope.nosidebar = true;
    $scope.checksidebar = function(j){
        var id=30+parseInt(j)+1;        
        Data.post('checksidebar',{
            id: id
        }).then(function(response){
            if(response.data){
                $scope.nosidebar = (response.data.status == 1) ? false : true;
            }
        });
    }
    $scope.sidebar = {};
    $scope.loadSidebar = function(j){
        $scope.sidebar = {};
        var id=30+parseInt(j)+1;
        
        Data.post('loadsidebar',{
            id: id
        }).then(function(response){
            $scope.sidebar = response.data;
        });
    }
    $scope.updateFlagResponse = function(qs, ans, ansinner, mailData){
        if(ans != null){
            mailData.review = 3;
            Chat.post('updateFlagResponse', {
                qs:qs,
                ans:ans,
                innerans:ansinner,
                maildata:mailData
            }).then(function(response){

            })
        }
    }
});
app.controller('DealCtrl', function($scope, Data, GoogleApi, $location, $rootScope) {
    $scope.first_step = [
        {
            title:'Basic Info',
            icon:BASE_URL+'static/img/icons/progressBar/basic.png',
            color: '#25b7d3',
            url : '#!/basic',
            status:'incomplete',
            inner:[]
        },
        {
            title:'Kids',
            icon:BASE_URL+'static/img/icons/progressBar/kids.png',
            color: '#e04f5f',
            url : '#!/form/kids',
            status:'incomplete',
            inner:[]
        },
        {
            title:'Have/Owe',
            icon:BASE_URL+'static/img/icons/progressBar/haveOwe.png',
            color: '#f8bc3c',
            url : '#!/HaveOwe',
            status:'incomplete',
            inner:[]
        },
        {
            title:'Make/Spend',
            icon:BASE_URL+'static/img/icons/progressBar/makeSpend.png',
            color: '#52b74a',
            url : '#!/MakeSpend',
            status:'incomplete',
            inner:[]
        },
        {
            title:'The Deal',
            icon:BASE_URL+'static/img/icons/progressBar/deal.png',
            color: '#9f6aac',
            url : '#!/Deal',
            status:'incomplete',
            inner:[]
        },
    ];
    $scope.dealData = [];
    $scope.skipNav = false;
    $scope.currentStep = 'Deal';
    $scope.isloading = false;
    $scope.loadStatus = function() {
        $scope.isloading = true;
        Data.get('DealStatus').then(function(response) {
            if (response.status == 'SUCCESS') {
                if (response.data != null) {
                    if ($rootScope.userType == 2) {
                        Data.get('loadkidscount').then(function(responsekidscount) {
                            if (response.data.basic != '1' || (response.data.kids != '1' && (responsekidscount.data == null || responsekidscount.data.meta_value != 0)) || response.data.haveOwe != '1' || response.data.makeSpend != '1') {
                                $location.path('dashboard');
                            }
                        });
                    } else {
                        Data.get('loadkidscount').then(function(responsekidscount) {
                            if (response.data.basic != '1' || (response.data.kids != '1' && (responsekidscount.data == null || responsekidscount.data.meta_value != 0)) || response.data.haveOwe != '1') {
                                $location.path('dashboard');
                            }
                        });
                    }
                } else {
                    $location.path('dashboard');
                }
                //$scope.noofchild = response.data.noofchild;
                //if(response.data)
                // if(response.data.basic != 'completed' || (response.data.kids != 'completed' && response.data.noofchild != 0) || response.data.haveOwe != 'completed' || response.data.makeSpend != 'completed'){
            }
            $scope.isloading = false;
        });
    }
    //$scope.loadStatus();
    Data.get('loadkidscount').then(function(response) {
        if (response.status == 'SUCCESS') {
            if (response.data != null) {
                $scope.kidscount = response.data.meta_value;
            }
        }
    });
    $scope.loadDeal = function() {
        Data.get('getDealData').then(function(response) {
            $scope.dealData = response.data;
            $scope.initHolidayList();
            $scope.loadCalendarList();
        });
    }
    $scope.noofdayeswithme = 0;
    $scope.noofdayeswithspouse = 0;
    $scope.loadEvents = function(data, eventColor) {
        GoogleApi.post('getEventList', {
            data: data
        }).then(function(response) {
            var me = 0;
            var spouse = 0;
            //$scope.uiConfig.calendar.events = response;
            angular.forEach(response, function(value, key) {
                if (value.title == 'Petitioner (You)') {
                    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                    var firstDate = new Date(value.start);
                    var secondDate = new Date(value.end);
                    var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                    me += diffDays;
                } else {
                    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                    var firstDate = new Date(value.start);
                    var secondDate = new Date(value.end);
                    var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                    spouse += diffDays;
                }
            });
            $scope.noofdayeswithme = me;
            $scope.noofdayeswithspouse = spouse;
            $scope.loadingGoogleApi = false;
        });
    };
    $scope.loadCalendarList = function() {
        $scope.loadingGoogleApi = true;
        GoogleApi.get('getCalendarAll').then(function(response) {
            if (response.status == 'SUCCESS') {
                if (response.data.length != 0) {
                    angular.forEach(response.data[0], function(value, key) {
                        $scope.loadEvents(value.id, value.backgroundColor);
                    });
                } else {
                    $scope.loadingGoogleApi = false;
                }
            }
        });
    };
    $scope.noofholidayswithme = 0;
    $scope.noofholidayswithspouse = 0;
    $scope.initHolidayList = function() {
        Data.get('getHolidays').then(function(response) {
            if (angular.isUndefined(response.status)) {
                $scope.holidayList = response;
                angular.forEach($scope.holidayList.religiousholidays.list, function(key, value) {
                    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                    var firstDate = new Date(key.date.start[0]);
                    var secondDate = new Date(key.date.end[0]);
                    var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                    if (key.odd == 'Petitioner' || key.even == 'Petitioner' || key.current == 'Petitioner') {
                        $scope.noofholidayswithme += diffDays + 1;
                    }
                    if (key.odd == 'Respondent' || key.even == 'Respondent' || key.current == 'Respondent') {
                        $scope.noofholidayswithspouse += diffDays + 1;
                    }
                });
                angular.forEach($scope.holidayList.standardholidays.list, function(key, value) {
                    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                    var firstDate = new Date(key.date.start[0]);
                    var secondDate = new Date(key.date.end[0]);
                    var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                    if (key.odd == 'Petitioner' || key.even == 'Petitioner' || key.current == 'Petitioner') {
                        $scope.noofholidayswithme += diffDays + 1;
                    }
                    if (key.odd == 'Respondent' || key.even == 'Respondent' || key.current == 'Respondent') {
                        $scope.noofholidayswithspouse += diffDays + 1;
                    }
                });
                $scope.alreadyAdded = true;
            } else {
                $scope.alreadyAdded = false;
            }
        });
        $scope.assetsTotal = {
            "me": 0,
            "shared": 0,
            "spouse": 0
        };
        $scope.debtTotal = {
            "me": 0,
            "shared": 0,
            "spouse": 0
        };
        Data.get('loadAssets').then(function(response) {
            $scope.assetsTotal = response.total;
        });
        Data.get('loadDebt').then(function(response) {
            $scope.debtTotal = response.total;
        });
        $scope.expenseTotal = 0;
        $scope.incomeTotal = 0;
        Data.get('loadData').then(function(response) {
            $scope.incomeTotal = response.total.income;
            $scope.expenseTotal = response.total.expense;
            $scope.cscalcincomeTotal = response.cscalc.income;
            $scope.cscalcexpenseTotal = response.cscalc.expense;
            $scope.confirmationCode = response.payment.stripe_token;
            $scope.planName = response.payment.stripe_plan;
        });
        Data.get('loadCurrentJobData').then(function(response) {
            $scope.empName = response.result[0].empName;
            $scope.taxStatus = response.result[0].taxStatus;
        });
    }
});
app.controller('chat', function($scope, Chat, $timeout) {
    $scope.chat_side = true;
    $timeout(function() {
        $scope.chat_side = false;
    }, 7000);
    $scope.chat_msg = '';
    $scope.chatList = [{
        message: 'Hey! What should I put down?',
        who: 'spouse',
        dateTime: '2017-04-14T18:30:00.000Z'
    }, {
        message: 'I don’t know.',
        who: 'me',
        dateTime: '2017-04-14T18:30:00.000Z'
    }];
    $scope.SendMsg = function(message, responsemsg, responseid, usertype) {
        var chinput = document.getElementById('cheditor');
        message = chinput.innerHTML;
        if (message != '') {
            var d = new Date();
            $scope.chat_msg = '';
            Chat.post('send', {
                who: usertype,
                message: message,
                dateTime: d,
                reason: responsemsg,
                reason_id: responseid
            }).then(function(response) {
                if (response.status == 'SUCCESS') {
                    $scope.chatList.push({
                        who: usertype,
                        message: message,
                        dateTime: d
                    });
                    chinput.innerHTML = '';
                    $scope.chatenabledList[responseid] = true;
                    //$scope.lastChat();
                    $timeout(function() {
                        $('.chat_window_main_body')[0].scrollTop = $('.chat_window_main_body')[0].scrollHeight;
                    }, 100);
                } else {
                    $scope.chatList.push({
                        sender: 'me',
                        message: response.message,
                        dateTime: d
                    });
                    $timeout(function() {
                        $('.chat_window_main_body')[0].scrollTop = $('.chat_window_main_body')[0].scrollHeight;
                    }, 100);
                }
            });
        }
    }
    $scope.loadChat = function(msg, id) {
        $scope.chatList = [];
        Chat.post('loadChat', {
            id: id,
            msg: msg
        }).then(function(response) {
            $scope.chatList = response.data;
            $scope.loadUnread(id);
            $timeout(function() {
                $('.chat_window_main_body')[0].scrollTop = $('.chat_window_main_body')[0].scrollHeight;
            }, 100);
        });
    }
    $scope.loadUnread = function(id) {
        Chat.post('loadUnread', {
            id: id
        }).then(function(response) {
            angular.forEach(response.data, function(value, key) {
                $scope.chatList.push(value);
                $timeout(function() {
                    $('.chat_window_main_body')[0].scrollTop = $('.chat_window_main_body')[0].scrollHeight;
                }, 100);
            });
            $timeout(function() {
                if ($scope.chatboxopend) {
                    $scope.loadUnread(id);
                }
            }, 1000);
        });
    }
    $scope.lastChat = function() {
        Chat.get('lastChat').then(function(response) {
            if (response.status == 'SUCCESS') {
                angular.forEach(response.data, function(value, key) {
                    $scope.chatList.push(value);
                });
                // $scope.lastChat();
            }
        });
    }
    $timeout($scope.checkUnread, 3000);
    var timer = function() {
        // $scope.loadUnread('why');
        //$scope.loadChat('', 'why');
        $timeout(timer, 10000);
    }
    $timeout(timer, 3000);
});
app.factory("Chat", ['$http', 'toaster',
    function($http, toaster) { // This service connects to our REST API
        var serviceBase = BASE_URL + 'api/chatApi/';
        var obj = {};
        obj.toast = function(data) {
            toaster.pop(data.status.toLowerCase(), "", data.message, 10000, 'trustedHtml');
        }
        obj.get = function(q) {
            return $http.get(serviceBase + q, {
                timeout: 500000
            }).then(function(results) {
                return results.data;
            });
        };
        obj.post = function(q, object) {
            //object.ioe_csrf_token = IOE_CSRF_TOKEN;
            return $http.post(serviceBase + q, object).then(function(response) {
                return response.data;
            });
        };
        obj.put = function(q, object) {
            return $http.put(serviceBase + q, object).then(function(results) {
                return results.data;
            });
        };
        obj.delete = function(q) {
            return $http.delete(serviceBase + q).then(function(results) {
                return results.data;
            });
        };
        return obj;
    }
]);
app.directive('whenScrollEnds', function() {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            var visibleHeight = element.height();
            var threshold = 100;
            element.scroll(function() {
                var scrollableHeight = element.prop('scrollHeight');
                var hiddenContentHeight = scrollableHeight - visibleHeight;
                if (hiddenContentHeight - element.scrollTop() <= threshold) {
                    // Scroll is almost at the bottom. Loading more rows
                    scope.$apply(attrs.whenScrollEnds);
                }
            });
        }
    };
});
app.filter("trust", ['$sce', function($sce) {
    return function(htmlCode) {
        return $sce.trustAsHtml(htmlCode);
    }
}]);
app.constant('keyCodes', {
    esc: 27,
    enter: 13,
    tab: 9,
    backspace: 8,
    shift: 16,
    ctrl: 17,
    alt: 18,
    capslock: 20,
    numlock: 144
}).directive('keyBind', ['keyCodes', function(keyCodes) {
    function map(obj) {
        var mapped = {};
        for (var key in obj) {
            var action = obj[key];
            if (keyCodes.hasOwnProperty(key)) {
                mapped[keyCodes[key]] = action;
            }
        }
        return mapped;
    }
    return function(scope, element, attrs) {
        var bindings = map(scope.$eval(attrs.keyBind));
        element.bind("keypress", function(event) {
            if (bindings.hasOwnProperty(event.which)) {
                scope.$apply(function() {
                    scope.$eval(bindings[event.which]);
                });
            }
        });
    };
}]);
app.directive('scrollToBottom', function($timeout, $window) {
    return {
        scope: {
            scrollToBottom: "="
        },
        restrict: 'A',
        link: function(scope, element, attr) {
            scope.$watchCollection('scrollToBottom', function(newVal) {
                if (newVal) {
                    $timeout(function() {
                        element[0].scrollTop = element[0].scrollHeight;
                    }, 0);
                }
            });
        }
    };
});
app.filter('mydate', function($filter) {
    return function(input) {
        if (input == null) {
            return "";
        }
        var today = new Date('today');
        var inputdate = new Date(input);

        function isSame(d1, d2) {
            return d1.getUTCFullYear() == d2.getUTCFullYear() && d1.getUTCMonth() == d2.getUTCMonth() && d1.getUTCDate() == d2.getUTCDate();
        }
        if (isSame(today, inputdate)) {
            var _date = 'Today';
        } else {
            var _date = $filter('date')(new Date(input), 'EEEE, MMM d, h:mm a');
        }
        return _date;
    };
});
/*Generate Petition Stripe Payment*/
app.controller('generatepetition', function($scope, Data, $window) {
    $scope.getgpVal = function(result) {
        if (result == 'Yes') {
            $scope.gpselectedVal = "Yes";
        } else {
            //$('.PopUp2').fadeOut(350);
            $('.dh_overlay, .dh_popup').fadeOut(350);
            $window.location.reload();
            $window.location.href = BASE_URL + 'app/#!/dashboard';
            // $scope.dhpopClose();
        }
    }
    $scope.showPlan = function() {
        $scope.whatnextsectiondiv = "display:none";
        $scope.showPlanpopup = "Yes";
    }
});
app.controller('welcomePr', function($rootScope, $scope, Data, $timeout, $location) {
    $scope.agreed = false;
    $scope.openedAgree = false;
    $scope.invited = false;
    $scope.isinvite = '';
    $scope.spouse = {};
    $scope.error = {};
    $scope.slideitems = [{
        id: 's1',
        title: 'Welcome!'
    }, {
        id: 's2',
        title: 'Invite Your Spouse'
    }, {
        id: 's3',
        title: 'Understanding the Process'
    }, {
        id: 's4',
        title: 'Understanding the Process'
    }];
    Data.get('getAgree').then(function(response) {
        $scope.cstep = response.data.welcome;
        $scope.agreed = response.data.agree == '1' ? true : false;
        if ($rootScope.userType == 3) {
            $scope.slideitems.splice(1, 1);
        }
        if ($rootScope.userType == 2) {
            if ($scope.cstep == 2) {
                $scope.spouse.isinvite = 'N';
            }
            if (response.data.inv != null) {
                $scope.invited = true;
                $scope.spouse.isinvite = 'Y';
            }
        }
    });
    $scope.openAgree = function() {
        $scope.openedAgree = true;
    }
    $scope.isenabled = true;
    $scope.enableAgree = function() {
        $('#disBtn').hide();
        $('#enBtn').show();
    }
    $scope.agree = function() {
        Data.post('agree', {
            aggreed: true
        }).then(function(response) {
            if (response.status == 'SUCCESS') {
                $scope.next();
                $scope.agreed = true;
                $scope.openedAgree = false;
            }
        });
    }
    $scope.closeAgree = function() {
        $scope.openedAgree = false;
    }
    $scope.submitInvite = function() {
        if ($scope.spouse.isinvite == 'Y') {
            var regexp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if ($scope.spouse.fname == '' || angular.isUndefined($scope.spouse.fname)) {
                $scope.error.fname = "This field is required";
            } else {
                delete $scope.error.fname;
                //$scope.error.remove('fname');
            }
            if ($scope.spouse.lname == '' || angular.isUndefined($scope.spouse.lname)) {
                $scope.error.lname = "This field is required";
            } else {
                delete $scope.error.lname;
                //$scope.error.splice(index, 1);;   
            }
            if ($scope.spouse.email == '' || angular.isUndefined($scope.spouse.email)) {
                $scope.error.email = "This field is required";
            } else if (!regexp.test($scope.spouse.email)) {
                $scope.error.email = "Please enter valid email";
            } else {
                delete $scope.error.email;
                //$scope.error.splice(index, 1);;   
            }
            if (Object.keys($scope.error).length != 0) {
                return false;
            } else {
                Data.post('welcomeInvite', {
                    data: $scope.spouse
                }).then(function(response) {
                    if (response.status == 'SUCCESS') {
                        $scope.invited = true;
                    } else {
                        $scope.error.email = response.message;
                    }
                });
            }
        }
    }
    $scope.next = function() {
        if ($scope.cstep < $scope.slideitems.length - 1) {
            $scope.cstep++;
            Data.post('welcomeStep', {
                welcome: $scope.cstep
            }).then(function(response) {
                if (response.status == 'SUCCESS') {}
            });
        }
    }
    $scope.back = function() {
        if ($scope.cstep > 0) {
            $scope.cstep--;
        }
    }
    $scope.submit = function() {
        Data.post('welcomeData', {
            welcomecontent: 'skipped'
        }).then(function(response) {
            if (response.status == 'SUCCESS') {
                $location.path("/dashboard");
            }
        });
    }
});
app.directive('scrollToEnd', function($window) {
    // Get the specified element's computed style (height, padding, etc.) in integer form
    function getStyleInt(elem, prop) {
        try {
            return parseInt(window.getComputedStyle(elem, null).getPropertyValue(prop), 10);
        } catch (e) {
            return parseInt(elem.currentStyle[prop], 10);
        }
    }
    // Get the 'innerHeight' equivalent for a non-window element, including padding
    function getElementDimension(elem, prop) {
        switch (prop) {
            case 'width':
                return getStyleInt(elem, 'width') + getStyleInt(elem, 'padding-left') + getStyleInt(elem, 'padding-right');
            case 'height':
                return getStyleInt(elem, 'height') + getStyleInt(elem, 'padding-top') + getStyleInt(elem, 'padding-bottom');
                /*default:
                  return null;*/
        }
    }
    return {
        restrict: 'A',
        scope: {
            callback: '=scrollToEnd'
        },
        link: function(scope, elem, attr) {
            var callback = scope.callback || function() {};
            var boundToWindow = attr.bindToWindow;
            var body = document.body;
            var html = document.documentElement;
            var boundElement = boundToWindow ? angular.element($window) : elem;
            var oldScrollX = 0;
            var oldScrollY = 0;
            var handleScroll = function() {
                // Dimensions of the content, including everything scrollable
                var contentWidth;
                var contentHeight;
                // The dimensions of the container with the scrolling, only the visible part
                var viewportWidth;
                var viewportHeight;
                // The offset of how much the user has scrolled
                var scrollX;
                var scrollY;
                if (boundToWindow) {
                    // Window binding case - Populate Dimensions
                    contentWidth = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth);
                    contentHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
                    viewportWidth = window.innerWidth;
                    viewportHeight = window.innerHeight;
                    scrollX = (window.pageXOffset || html.scrollLeft) - (html.clientLeft || 0);
                    scrollY = (window.pageYOffset || html.scrollTop) - (html.clientTop || 0);
                } else {
                    // DOM element case - Populate Dimensions
                    var domElement = boundElement[0];
                    contentWidth = domElement.scrollWidth;
                    contentHeight = domElement.scrollHeight;
                    viewportWidth = getElementDimension(domElement, 'width');
                    viewportHeight = getElementDimension(domElement, 'height');
                    scrollX = domElement.scrollLeft;
                    scrollY = domElement.scrollTop;
                }
                var scrollWasInXDirection = oldScrollX !== scrollX;
                var scrollWasInYDirection = oldScrollY !== scrollY;
                oldScrollX = scrollX;
                oldScrollY = scrollY;
                if (scrollWasInYDirection && scrollY === 0) {
                    callback('top');
                } else if (scrollWasInYDirection && scrollY === contentHeight - viewportHeight) {
                    callback('bottom');
                } else if (scrollWasInXDirection && scrollX === 0) {
                    callback('left');
                } else if (scrollWasInXDirection && scrollX === contentWidth - viewportWidth) {
                    callback('right');
                }
            };
            boundElement.bind('scroll', handleScroll);
            // Unbind the event when scope is destroyed
            scope.$on('$destroy', function() {
                boundElement.unbind('scroll', handleScroll);
            });
        }
    };
});
app.service('validationService', function() {
    this.validate = function(form) {
        if (form.$invalid) {
            angular.forEach(form.$error.required, function(value, key) {});
            angular.forEach(form.$error.mask, function(value, key) {});
        }
    }
});
app.controller('basic', function($scope, Data, $timeout, $rootScope, validationService, $location) {
    $scope.kidscount = 0;
    $scope.data = [];
    $scope.conterror = false;
    $scope.reviewEdited = false;
    $scope.topNavList = [{
        title: 'Basic Info',
        id: 'basic',
        completed: false,
        url: 'basic',
        inner: [{
            id: 'myinfo',
            title: 'Petitioner Info',
            completed: false,
            forms: [{
                id: 'myInfo1',
            }, {
                id: 'myInfo2',
            }, {
                id: 'myInfo3'
            }, {
                id: 'myInfo4'
            }]
        }, {
            id: 'spouseinfo',
            title: 'Respondent Info',
            completed: false,
            forms: [{
                id: 'spouseInfo1'
            }, {
                id: 'spouseInfo2',
            }, {
                id: 'spouseInfo3'
            }]
        }, {
            id: 'ourprfile',
            title: 'Our Profile',
            completed: false,
            forms: [{
                id: 'ourprofile1'
            }, {
                id: 'ourprofile2',
            }, {
                id: 'ourprofile3'
            }, {
                id: 'ourprofile4'
            }, {
                id: 'ourprofile5'
            }]
        }]
    }, {
        title: 'Kids',
        id: 'kids',
        url: 'kids',
        completed: false
    }, {
        title: 'Have/Owe',
        id: 'haveOwe',
        url: 'HaveOwe',
        completed: false
    }, {
        title: 'Make/Spend',
        id: 'makeSpend',
        url: 'MakeSpend',
        completed: false
    }, {
        title: 'The Deal',
        id: 'deal',
        url: 'deal',
        completed: false
    }];
    $scope.reviewItems = [{
        qs: 'Why are you getting divorced?',
        pet: '',
        res: '',
        id: 'why',
        location: {
            j: 0,
            k: 0
        },
        compare: true
    }, {
        qs: 'Name of the petitioner (the person filing for divorce)',
        pet: '',
        res: '',
        id: 'petName',
        location: {
            j: 0,
            k: 1
        },
        compare: false
    }, {
        qs: 'Gender',
        pet: '',
        res: '',
        id: 'petGender',
        location: {
            j: 0,
            k: 1
        },
        compare: false
    }, {
        qs: 'Address',
        pet: '',
        res: '',
        id: 'petAddress',
        location: {
            j: 0,
            k: 2
        },
        compare: false
    }, {
        qs: 'Are you currently employed?',
        pet: '',
        res: '',
        id: 'petcuemp',
        location: {
            j: 0,
            k: 3
        },
        compare: true
    }, {
        qs: 'Date Employment Started',
        pet: '',
        res: '',
        id: 'petempstarted',
        location: {
            j: 0,
            k: 3
        },
        compare: true
    }, {
        qs: 'If you\'re unemployed, let us know when this began',
        pet: '',
        res: '',
        id: 'petUnempBegin',
        location: {
            j: 0,
            k: 3
        },
        compare: true
    }, {
        qs: 'Name of the respondent (the spouse)',
        pet: '',
        res: '',
        id: 'spName',
        location: {
            j: 1,
            k: 0
        },
        compare: false
    }, {
        qs: 'Spouse Gender',
        pet: '',
        res: '',
        id: 'spGender',
        location: {
            j: 1,
            k: 0
        },
        compare: false
    }, {
        qs: 'Spouse Address',
        pet: '',
        res: '',
        id: 'spAddress',
        location: {
            j: 1,
            k: 1
        },
        compare: false
    }, {
        qs: 'Is your spouse employed?',
        pet: '',
        res: '',
        id: 'spcuemp',
        location: {
            j: 1,
            k: 2
        },
        compare: true
    }, {
        qs: 'Date Employment Started',
        pet: '',
        res: '',
        id: 'spempStarted',
        location: {
            j: 1,
            k: 2
        },
        compare: true
    }, {
        qs: 'If they\'re unemployed, let us know when this began',
        pet: '',
        res: '',
        id: 'unempBegin',
        location: {
            j: 1,
            k: 2
        },
        compare: true
    }, {
        qs: 'Date Married',
        pet: '',
        res: '',
        id: 'married',
        location: {
            j: 2,
            k: 0
        },
        compare: true
    }, {
        qs: 'Date of Separation',
        pet: '',
        res: '',
        id: 'dateSperation',
        location: {
            j: 2,
            k: 1
        },
        compare: true
    }, {
        qs: 'Are you currently living together?',
        pet: '',
        res: '',
        id: 'livingStatus',
        location: {
            j: 2,
            k: 2
        },
        compare: true
    }, {
        qs: 'Do you and your spouse share any assets (home, cars, boats etc.)?',
        pet: '',
        res: '',
        id: 'assets',
        location: {
            j: 2,
            k: 3
        },
        compare: true
    }, {
        qs: 'Do you and your spouse share any debts (credit cards, mortgages, loans, etc.)?',
        pet: '',
        res: '',
        id: 'debts',
        location: {
            j: 2,
            k: 4
        },
        compare: true
    }];
    var basic_completed = false,
        alreadyCompleted = false;
    $scope.i = 0;
    $scope.j = 0;
    $scope.k = 0;
    $scope.diff = 0;
    $scope.diffcount = function(index) {
        $scope.diff++;
    }
    $scope.viewForm = function($page) {
        $location.path($page);
        $(window).scrollTop(0);
    };
    $scope.loadBasic = function() {
        Data.get('loadBasic').then(function(response) {
            $scope.data = response.data;
            if (angular.isDefined(response.data.steps) && response.data.steps != null) {
                if (response.data.steps.basic && response.data.steps.basic == 1) {
                    $scope.j = $scope.topNavList[0].inner.length;
                    $scope.k = 0;
                    alreadyCompleted = true;
                    if (!$rootScope.Iconclick) {
                        $scope.loadReview();
                    }
                } else {
                    $scope.j = angular.isDefined(response.data.steps.basic.j) ? response.data.steps.basic.j : 0;
                    $scope.k = angular.isDefined(response.data.steps.basic.k) ? response.data.steps.basic.k : 0;
                    $scope.currentStep = $scope.topNavList[0].inner[$scope.j].forms[$scope.k].id
                }
                for (var l = 0; $scope.j > l; l++) {
                    $scope.topNavList[0].inner[l].completed = true;
                }
                $scope.topNavList[1].completed = response.data.steps.kids == 1 ? true : false;
                $scope.topNavList[2].completed = response.data.steps.haveowe == 1 ? true : false;
                $scope.topNavList[3].completed = response.data.steps.makespend == 1 ? true : false;
                $scope.topNavList[4].completed = (response.data.steps.basic == 1 && response.data.steps.kids == 1 && response.data.steps.haveowe == 1 && response.data.steps.makespend == 1) ? true : false;
            } else {
                $scope.currentStep = $scope.topNavList[0].inner[$scope.j].forms[$scope.k].id
            }
            if ($rootScope.Iconclick) {
                $scope.j = $rootScope.iconI;
                $scope.k = 0;
                $scope.currentStep = $scope.topNavList[0].inner[$scope.j].forms[$scope.k].id;
            }
        });
    }
    $scope.loadBasic();
    $scope.validate = function(form) {
        $scope.conterror = true;
    }
    $scope.nextStep = function(f) {
        if(f.$valid){
            $scope.IOE_ER_MSG = '';
            $scope.k++;
            if ($scope.j < $scope.topNavList[0].inner.length) {
                if ($scope.k < $scope.topNavList[0].inner[$scope.j].forms.length) {} else if ($scope.k == $scope.topNavList[0].inner[$scope.j].forms.length) {
                    $scope.topNavList[0].inner[$scope.j].completed = true;
                    $scope.k = 0;
                    $scope.j++;
                    if ($scope.j < $scope.topNavList[0].inner.length) {} else {
                        basic_completed = true;
                    }
                }
            } else if ($scope.j == $scope.topNavList[0].inner.length) {
                basic_completed = true;
            }
            $scope.SaveBasic(basic_completed);
        }
        else{
            $scope.IOEvalidation(f);
            $scope.IOE_ER_MSG = 'Please fill the required fields';
            return;
        }
    }
    $scope.preStep = function() {
        $scope.IOE_ER_MSG = '';
        if ($scope.k > 0) {
            $scope.k--;
        } else {
            if ($scope.j > 0) {
                $scope.j--;
                $scope.k = $scope.topNavList[0].inner[$scope.j].forms.length - 1;
            }
        }
        $scope.currentStep = $scope.topNavList[0].inner[$scope.j].forms[$scope.k].id;
    }
    $scope.SaveBasic = function(completed) {
        if (!alreadyCompleted) {
            if (completed) {
                $scope.data.steps = true;
            } else {
                $scope.data.steps = {
                    j: $scope.j,
                    k: $scope.k
                };
            }
        } else {
            $scope.data.steps = true;
        }
        Data.post('saveBasic', {
            data: $scope.data
        }).then(function(response) {
            if (response.status == 'SUCCESS') {
                $scope.conterror = false;
                if (completed) {
                    $scope.reviewEdited = false;
                    $scope.diff = 0;
                    $scope.loadReview();
                } else {
                    $scope.currentStep = $scope.topNavList[0].inner[$scope.j].forms[$scope.k].id;
                }
                $(window).scrollTop(0);
            }
        });
    }
    $scope.reviewEdit = function(j, k) {
        $scope.reviewEdited = true;
        $scope.currentStep = $scope.topNavList[0].inner[j].forms[k].id;
        $scope.j = parseInt(j);
        $scope.k = parseInt(k);
        $(window).scrollTop(0);
        // $scope.spouseFlagQs = qs;
        // $scope.spouseFlagAns = ans;
        // $scope.spouseFlagAnsin = innercou;
        // $scope.mailData = mailData;
        // $scope.spouseFlagAnsChanges = true;
        // $scope.j = parseInt(j);
        // $scope.k = parseInt(k);
        // $scope.enableBackToReview = true;
        // $scope.currentStep = $scope.first_step[$scope.i].inner[j].forms[k].id;
        // //$scope.skipNav = true;
        // if($scope.i == 0){
        //     $scope.BackToReviewValue = 'basic_info_review';
        // }
        // else if($scope.i == 1){
        //     $scope.BackToReviewValue = 'kidsReview';
        // }
    }
    $scope.resStatus = false;
    $scope.loadReview = function() {
        $scope.reviewItems[2].qs = $scope.data.myinfo.fname + "'s Gender";
        $scope.reviewItems[3].qs = $scope.data.myinfo.fname + "'s Address";
        $scope.reviewItems[4].qs = "Is " + $scope.data.myinfo.fname + " employed?";
        $scope.reviewItems[5].qs = "Date " + $scope.data.myinfo.fname + "'s employment started";
        $scope.reviewItems[6].qs = "Date " + $scope.data.myinfo.fname + "'s unemployment started";
        //$scope.reviewItems[7].qs = $scope.data.spouseinfo.fname + "'s Name";
        $scope.reviewItems[8].qs = $scope.data.spouseinfo.fname + "'s Gender";
        $scope.reviewItems[9].qs = $scope.data.spouseinfo.fname + "'s Address";
        $scope.reviewItems[10].qs = "Is " + $scope.data.spouseinfo.fname + " employed?";
        $scope.reviewItems[11].qs = "Date " + $scope.data.spouseinfo.fname + "'s employment started";
        $scope.reviewItems[12].qs = "Date " + $scope.data.spouseinfo.fname + "'s unemployment started";
        $scope.reviewItems[16].qs = "Do " + $scope.data.myinfo.fname + " and " + $scope.data.spouseinfo.fname + " share any assets (home, cars, boats etc.)?";
        $scope.reviewItems[17].qs = "Do " + $scope.data.myinfo.fname + " and " + $scope.data.spouseinfo.fname + " share any debts (credit cards, mortgages, loans, etc.)?";
        Data.get('loadkidscount').then(function(response) {
            if (response.status == 'SUCCESS') {
                if (response.data != null) {
                    $scope.kidscount = response.data.meta_value;
                }
            }
        });
        Data.get('loadBasicReview').then(function(response) {
            if (angular.isDefined(response.res)) {
                $scope.resStatus = true;
            }
            for (var i = 0; i < $scope.reviewItems.length; i++) {
                $scope.reviewItems[i].pet = response.pet[i];
                if (angular.isDefined(response.res)) {
                    $scope.reviewItems[i].res = response.res[i];
                }
                $scope.currentStep = 'basic_info_review';
            }
        })
    }
    $scope.saveBacktoreview = function(f) {
        if(f.$valid){
            $scope.IOE_ER_MSG = '';
            alreadyCompleted = true;
            $scope.SaveBasic(true);
            //$scope.reviewEdited = false;
            $scope.j = 3;
            $scope.k = 0;
        }
        else{
            $scope.IOEvalidation(f);
            $scope.IOE_ER_MSG = 'Please fill the required fields';
            return;
        }
    }
});
app.controller('kidsCtrl', function($scope, $rootScope, Data, GoogleApi, $timeout, $location, $routeParams, Upload) {
    $scope.allCount = 0;
    $scope.matchCount = 0;
    $scope.data = [];
    $scope.i = 1;
    $scope.topNavList = [{
        title: 'Basic Info',
        id: 'basic',
        url: 'basic',
        completed: false
    }, {
        title: 'Kids',
        id: 'kids',
        url: 'kids',
        completed: false,
        inner: [{
            id: 'custody',
            title: 'Custody',
            forms: [{
                id: 'Custody1'
            }, {
                id: 'Custody2',
            }, {
                id: 'Custody3'
            }, {
                id: 'Custody4'
            }, {
                id: 'Custody5'
            }, {
                id: 'Custody6'
            }, {
                id: 'Custody7'
            }, {
                id: 'Custody8'
            }]
        }, {
            id: 'schedule',
            title: 'Schedule',
            forms: [{
                id: 'Schedule1'
            }, {
                id: 'Schedule2',
            }]
        }, {
            id: 'finaldetails',
            title: 'Final Details',
            forms: [{
                id: 'FinalDetails1'
            }, {
                id: 'FinalDetails2',
            }, {
                id: 'FinalDetails3'
            }, {
                id: 'FinalDetails4'
            }]
        }]
    }, {
        title: 'Have/Owe',
        id: 'haveOwe',
        url: 'HaveOwe',
        completed: false
    }, {
        title: 'Make/Spend',
        id: 'makeSpend',
        url: 'MakeSpend',
        completed: false
    }, {
        title: 'The Deal',
        id: 'deal',
        url: 'deal',
        completed: false
    }];
    $scope.kidsRelationList = [{
        qs: 'Number of Kids',
        pet: '',
        res: '',
        id: 'noofchild',
        location: {
            j: 0,
            k: 0
        },
        compare: true,
        matching: false
    }, {
        qs: 'Do you have a child that isn’t born yet?',
        pet: '',
        res: '',
        id: 'notborn',
        location: {
            j: 0,
            k: 0
        },
        compare: true,
        matching: false
    }, {
        qs: 'Would you and your spouse like to share legal custody?',
        pet: '',
        res: '',
        id: 'kidlegalCustody',
        location: {
            j: 0,
            k: 3
        },
        compare: true,
        matching: false
    }, {
        qs: 'Would you and your spouse like to share physical custody?',
        pet: '',
        res: '',
        id: 'kidphysicalCustody',
        location: {
            j: 0,
            k: 5
        },
        compare: true,
        matching: false
    }];
    $scope.kidsGeneral = [];
    $scope.kidsList = [];
    $scope.kidsPetCustoday = [];
    $scope.kidsResCustoday = [];
    $scope.viewForm = function($page) {
        $location.path($page);
        $(window).scrollTop(0);
    };
    var kids_completed = false,
        alreadyCompleted = false;
    $scope.i = 1;
    $scope.j = 0;
    $scope.k = 0;
    $scope.petname = null;
    $scope.resname = null;
    // $scope.currentStep = $scope.topNavList[$scope.i].inner[$scope.j].forms[$scope.k].id;
    $scope.loadKids = function() {
        Data.get('loadKids').then(function(response) {
            $scope.data = response.data;
            if (angular.isDefined(response.data.steps) && response.data.steps != null) {
                if (response.data.steps.kids && response.data.steps.kids == 1) {
                    $scope.j = $scope.topNavList[1].inner.length;
                    $scope.k = 0;
                    alreadyCompleted = true;
                    $scope.currentStep = 'kidsReview';
                } else {
                    $scope.j = angular.isDefined(response.data.steps.kids.j) ? response.data.steps.kids.j : 0;
                    $scope.k = angular.isDefined(response.data.steps.kids.k) ? response.data.steps.kids.k : 0;
                    $scope.currentStep = $scope.topNavList[1].inner[$scope.j].forms[$scope.k].id;
                }
                for (var l = 0; $scope.j > l; l++) {
                    $scope.topNavList[1].inner[l].completed = true;
                }
                $scope.topNavList[0].completed = response.data.steps.basic == 1 ? true : false;
                $scope.topNavList[2].completed = response.data.steps.haveowe == 1 ? true : false;
                $scope.topNavList[3].completed = response.data.steps.makespend == 1 ? true : false;
                $scope.topNavList[4].completed = (response.data.steps.basic == 1 && response.data.steps.kids == 1 && response.data.steps.haveowe == 1 && response.data.steps.makespend == 1) ? true : false;
            } else {
                $scope.currentStep = $scope.topNavList[1].inner[$scope.j].forms[$scope.k].id;
            }
            if (angular.isDefined($scope.data.kids) && $scope.data.kids != null) {
                if (angular.isDefined($scope.data.kidsrelation) && $scope.data.kidsrelation != null) {
                    if (angular.isDefined($scope.data.kidsrelation.noofchild)) {
                        if (!$scope.data.kids.length && $scope.data.kids.length == 0) {
                            for (var i = 0; i < $scope.data.kidsrelation.noofchild; i++) {
                                $scope.data.kids.push({
                                    'kidsaddress': [{}],
                                    'kidslegalissue': [{}],
                                    'kidsprotective': [{}],
                                    'kidslegalclaims': [{}]
                                });
                            }
                        } else {
                            angular.forEach($scope.data.kids, function(value, key) {
                                if (!value.kidsaddress.length && value.kidsaddress.length == 0) {
                                    value.kidsaddress.push({});
                                }
                                if (!value.kidslegalissue.length && value.kidslegalissue.length == 0) {
                                    value.kidslegalissue.push({});
                                }
                                if (!value.kidsprotective.length && value.kidsprotective.length == 0) {
                                    value.kidsprotective.push({});
                                }
                                if (!value.kidslegalclaims.length && value.kidslegalclaims.length == 0) {
                                    value.kidslegalclaims.push({});
                                }
                            });
                        }
                    }
                }
            }
            if ($rootScope.Iconclick) {
                $scope.j = $rootScope.iconI;
                $rootScope.Iconclick = false;
                $scope.k = 0;
                $scope.currentStep = $scope.topNavList[1].inner[$scope.j].forms[$scope.k].id;
            }
            if ($routeParams.id == 'calendar') {
                $scope.j = 1;
                $scope.k = 1;
                $scope.currentStep = $scope.topNavList[1].inner[$scope.j].forms[$scope.k].id;
            }
        });
    }
    $scope.loadKids();
    $scope.validate = function(form) {
        $scope.conterror = true;
    }
    
    $scope.IOE_ER_MSG = '';
    $scope.nextStep = function(e) {
        $scope.IOE_ER_MSG = '';
        if (e.$invalid) {
            $scope.IOEvalidation(e);
            $scope.IOE_ER_MSG = 'Please fill the required fields';
            return;
        } else if (e.$valid) {
            if ($scope.j == 0) {
                if ($scope.k == 3) {
                    if ($scope.data.kidsrelation.legalCustody == 'Y') {
                        $scope.k++;
                    }
                }
                if ($scope.k == 5) {
                    if ($scope.data.kidsrelation.physicalCustody == 'Y') {
                        $scope.k++;
                    }
                }
            }
            if ($scope.j == 2) {
                if ($scope.k == 6) {
                    if ($scope.data.legalClaims == 'N') {
                        $scope.k++;
                    }
                }
            }
            $scope.k++;
            if ($scope.j < $scope.topNavList[$scope.i].inner.length) {
                if ($scope.k < $scope.topNavList[$scope.i].inner[$scope.j].forms.length) {} else if ($scope.k == $scope.topNavList[$scope.i].inner[$scope.j].forms.length) {
                    $scope.topNavList[1].inner[$scope.j].completed = true;
                    $scope.k = 0;
                    $scope.j++;
                    if ($scope.j < $scope.topNavList[$scope.i].inner.length) {} else {
                        kids_completed = true;
                    }
                }
            } else if ($scope.j == $scope.topNavList[$scope.i].inner.length) {
                kids_completed = true;
            }
            $scope.saveKids(kids_completed);
        }
    }
    $scope.preStep = function() {
        $scope.IOE_ER_MSG = '';
        if ($scope.j == 0) {
            if ($scope.k == 5) {
                if ($scope.data.kidsrelation.legalCustody == 'Y') {
                    $scope.k--;
                }
            }
            if ($scope.k == 7) {
                if ($scope.data.kidsrelation.physicalCustody == 'Y') {
                    $scope.k--;
                }
            }
        }
        if ($scope.j == 2) {}
        if ($scope.k > 0) {
            $scope.k--;
        } else {
            if ($scope.j > 0) {
                $scope.j--;
                $scope.k = $scope.topNavList[$scope.i].inner[$scope.j].forms.length - 1;
            }
        }
        $scope.currentStep = $scope.topNavList[$scope.i].inner[$scope.j].forms[$scope.k].id;
    }
    $scope.addKid = function() {
        $scope.data.kidsrelation.noofchild++;
        $scope.data.kids.push({
            'kidsaddress': [{}],
            'kidslegalissue': [{}],
            'kidsprotective': [{}]
        });
    }
    $scope.kidsaddress = function(data) {
        data.push({});
    }
    $scope.removekids = function(index, where) {
        if (angular.isDefined(index)) {
            if (angular.isDefined($scope.data.kids[index].id)) {
                Data.post('removekids', {
                    id: $scope.data.kids[index].id,
                    where: where
                }).then(function(response) {});
            }
            $scope.data.kids.splice(index, 1);
        } else {}
    }
    $scope.removekidsinner = function(paindex, index, where) {
        if (angular.isDefined(paindex)) {
            if (angular.isDefined(index)) {
                var id = null;
                switch (where) {
                    case 'kidsaddress':
                        id = $scope.data.kids[paindex].kidsaddress[index].id;
                        break;
                    case 'kidslegalissue':
                        id = $scope.data.kids[paindex].kidslegalissue[index].id;
                        break;
                    case 'kidsprotective':
                        id = $scope.data.kids[paindex].kidsprotective[index].id;
                        break;
                    case 'kidslegalclaims':
                        //id = $scope.data.kids[paindex].kidsaddress[index].id;
                        break;
                    default:
                        id = null;
                        break;
                }
                if (angular.isDefined(id) && id != null) {
                    Data.post('removekidsinner', {
                        id: id,
                        kid: $scope.data.kids[paindex].id,
                        where: where
                    }).then(function(response) {});
                }
                $scope.data.kids[paindex][where].splice(index, 1);
            }
        }
    }
    $scope.clearFields = function(index, where) {
        var i = index;
        //for(var i=0; i<$scope.data.kids.length; i++){
        switch (where) {
            case 'kidsaddress':
                $scope.data.kids[i][where][0].street = '';
                $scope.data.kids[i][where][0].city = '';
                $scope.data.kids[i][where][0].state = '';
                $scope.data.kids[i][where][0].zip = '';
                $scope.data.kids[i][where][0].livedWith = '';
                $scope.data.kids[i][where][0].Relationship = '';
                $scope.data.kids[i][where][0].fromDate = '';
                $scope.data.kids[i][where][0].toDate = '';
                break;
            case 'kidslegalissue':
                $scope.data.kids[i][where][0].type = '';
                $scope.data.kids[i][where][0].caseNumber = '';
                $scope.data.kids[i][where][0].court = '';
                $scope.data.kids[i][where][0].judgementDate = '';
                $scope.data.kids[i][where][0].caseStatus = '';
                break;
            case 'kidsprotective':
                $scope.data.kids[i][where][0].protectiveCourt = '';
                $scope.data.kids[i][where][0].protectiveCountry = '';
                $scope.data.kids[i][where][0].protectiveState = '';
                $scope.data.kids[i][where][0].protectiveCaseNumber = '';
                $scope.data.kids[i][where][0].protectiveExpire = '';
                $scope.data.kids[i][where][0].protectiveExpire = '';
                break;
            case 'kidslegalclaims':
                $scope.data.kids[i][where][0].legalClaimspersonName = '';
                $scope.data.kids[i][where][0].legalClaimspersonAddress = '';
                $scope.data.kids[i][where][0].legalClaimspersonCustodyRights = false;
                $scope.data.kids[i][where][0].legalClaimspersonHasphysicalcustody = false;
                $scope.data.kids[i][where][0].legalClaimspersonVisitationRights = false;
                break;
            default:
                break;
        }
        //  }
    }
    $scope.saveKids = function(completed) {
        if (!alreadyCompleted) {
            if (completed) {
                $scope.data.steps = true;
            } else {
                $scope.data.steps = {
                    j: $scope.j,
                    k: $scope.k
                };
            }
        } else {
            $scope.data.steps = true;
        }
        Data.post('saveKids', {
            data: $scope.data
        }).then(function(response) {
            $scope.data = response.data;
            if (!$scope.data.kids.length && $scope.data.kids.length == 0) {
                for (var i = 0; i < $scope.data.kidsrelation.noofchild; i++) {
                    $scope.data.kids.push({
                        'kidsaddress': [{}],
                        'kidslegalissue': [{}],
                        'kidsprotective': [{}],
                        'kidslegalclaims': [{}]
                    });
                }
            } else {
                angular.forEach($scope.data.kids, function(value, key) {
                    if (!value.kidsaddress.length && value.kidsaddress.length == 0) {
                        value.kidsaddress.push({});
                    }
                    if (!value.kidslegalissue.length && value.kidslegalissue.length == 0) {
                        value.kidslegalissue.push({});
                    }
                    if (!value.kidsprotective.length && value.kidsprotective.length == 0) {
                        value.kidsprotective.push({});
                    }
                    if (!value.kidslegalclaims.length && value.kidslegalclaims.length == 0) {
                        value.kidslegalclaims.push({});
                    }
                });
            }
        });
        if (completed) {
            $scope.currentStep = 'kidsReview';
        } else {
            $scope.currentStep = $scope.topNavList[1].inner[$scope.j].forms[$scope.k].id;
            if ($routeParams.id == "calendar") {
                $location.path('kids');
            }
        }
        //$scope.currentStep = $scope.topNavList[$scope.i].inner[$scope.j].forms[$scope.k].id;
    }
    $scope.reviewEdit = function(j, k) {
        $scope.allCount = 0;
        $scope.matchCount = 0;
        $scope.reviewEdited = true;
        $scope.j = parseInt(j);
        $scope.k = parseInt(k);
        $scope.currentStep = $scope.topNavList[1].inner[j].forms[k].id;
        $(window).scrollTop(0);
        // $scope.spouseFlagQs = qs;
        // $scope.spouseFlagAns = ans;
        // $scope.spouseFlagAnsin = innercou;
        // $scope.mailData = mailData;
        // $scope.spouseFlagAnsChanges = true;
        // $scope.j = parseInt(j);
        // $scope.k = parseInt(k);
        // $scope.enableBackToReview = true;
        // $scope.currentStep = $scope.first_step[$scope.i].inner[j].forms[k].id;
        // //$scope.skipNav = true;
        // if($scope.i == 0){
        //     $scope.BackToReviewValue = 'basic_info_review';
        // }
        // else if($scope.i == 1){
        //     $scope.BackToReviewValue = 'kidsReview';
        // }
    }
    $scope.uploadFiles = function(file, errFiles, id, kid, pindex, index) {
        if (angular.isUndefined(id)) {
            Data.post('addEmpty', {
                kid: kid,
            }).then(function(response) {
                if (response.status == 'SUCCESS') {
                    $scope.data.kids[pindex].kidslegalissue[index].id = response.id;
                    $scope.uploadFilesSend(file, errFiles, response.id, pindex, index);
                }
            });
        } else {
            $scope.uploadFilesSend(file, errFiles, id, pindex, index);
        }
    };
    $scope.uploadFilesSend = function(file, errFiles, id, pindex, index) {
        $scope.f = file;
        $scope.errFile = errFiles && errFiles[0];
        if (file) {
            file.upload = Upload.upload({
                url: BASE_URL + 'api/auth/do_upload',
                data: {
                    file: file,
                    id: id
                }
            });
            file.upload.then(function(evt) {
                if (evt.data.status == 'SUCCESS') {
                    $scope.data.kids[pindex].kidslegalissue[index].uploaded = evt.data.datetime;
                    $scope.data.kids[pindex].kidslegalissue[index].documentName = file.name;
                }
                file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
            });
        }
    };
    $scope.removeDoc = function(pindex, index) {
        alert($scope.data.kids[pindex].kidslegalissue[index].documentName);
    }
    $scope.petCalDays = {};
    $scope.resCalDays = {};
    $scope.loadchart = false;
    $scope.calnotfound = false;
    $scope.loadingreview = false;
    $scope.reviewcompletedata = [];
    $scope.pushvaluearr = function(data){
        $scope.reviewcompletedata.push(data);
    }
    $scope.loadReview = function() {
        $scope.reviewcompletedata = [];
        $scope.loadingreview = true;
        $scope.loadchart = true;
        GoogleApi.get('getCalendarAll').then(function(response) {
            if (response.status == 'SUCCESS') {
                GoogleApi.post('getEventList', {
                    data: response.data[0].id
                }).then(function(responsecal) {
                    var pet = 0;
                    var res = 0;
                    angular.forEach(responsecal, function(value, key) {
                        var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                        var startdate = new Date(value.start);
                        var enddate = new Date(value.end);
                        var diffDays = Math.round(Math.abs((startdate.getTime() - enddate.getTime()) / (oneDay)));
                        if (value.title == 'Petitioner (You)') {
                            pet = pet + diffDays;
                        } else {
                            res += diffDays;
                        }
                    });
                    $scope.petCalDays.calendar = pet;
                    $scope.resCalDays.calendar = res;
                    Data.get('getHolidays').then(function(responsehol) {
                        var pet = 0;
                        var res = 0;
                        if (responsehol.status != 'ERROR') {
                            angular.forEach(responsehol.religiousholidays.list, function(key, value) {
                                var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                                var firstDate = new Date(key.date.start[0]);
                                var secondDate = new Date(key.date.end[0]);
                                var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                                if (key.odd == 'Petitioner' || key.even == 'Petitioner' || key.current == 'Petitioner') {
                                    pet += diffDays + 1;
                                }
                                if (key.odd == 'Respondent' || key.even == 'Respondent' || key.current == 'Respondent') {
                                    res += diffDays + 1;
                                }
                            });
                            angular.forEach(responsehol.standardholidays.list, function(key, value) {
                                var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                                var firstDate = new Date(key.date.start[0]);
                                var secondDate = new Date(key.date.end[0]);
                                var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                                if (key.odd == 'Petitioner' || key.even == 'Petitioner' || key.current == 'Petitioner') {
                                    pet += diffDays + 1;
                                }
                                if (key.odd == 'Respondent' || key.even == 'Respondent' || key.current == 'Respondent') {
                                    res += diffDays + 1;
                                }
                            });
                            angular.forEach(responsehol.mybirthday.list, function(key, value) {
                                var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                                var firstDate = new Date(key.date.start[0]);
                                key.date.end[0] = (key.date.end[0] == '') ? key.date.start[0] : key.date.end[0];
                                var secondDate = new Date(key.date.end[0]);
                                var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
                                if (key.odd == 'Petitioner' || key.even == 'Petitioner' || key.current == 'Petitioner') {
                                    pet += diffDays + 1;
                                }
                                if (key.odd == 'Respondent' || key.even == 'Respondent' || key.current == 'Respondent') {
                                    res += diffDays + 1;
                                }
                            });
                        }
                        $scope.petCalDays.holidays = pet;
                        $scope.resCalDays.holidays = res;
                        $scope.loadchart = false;
                    });
                });
            } else {
                $scope.loadchart = false;
                $scope.calnotfound = true;
            }
            $scope.resStatus = false;
            Data.get('loadkidsreview').then(function(response) {
                $scope.kidsPetCustoday = [];
                $scope.kidsResCustoday = [];
                $scope.petname = response.data.pet;
                $scope.resname = response.data.res;
                if (angular.isDefined(response.data.kidsrelation.pet) && response.data.kidsrelation.pet != null) {
                    $scope.kidsRelationList[0].pet = response.data.kidsrelation.pet.noofchild;
                    $scope.kidsRelationList[1].pet = response.data.kidsrelation.pet.notborn == '1' ? 'Yes' : 'No';
                    $scope.kidsRelationList[2].pet = response.data.kidsrelation.pet.legalCustody == 'N' ? 'No' : response.data.kidsrelation.pet.legalCustody == 'Y' ? 'Yes' : '---';
                    $scope.kidsRelationList[3].pet = response.data.kidsrelation.pet.physicalCustody == 'N' ? 'No' : response.data.kidsrelation.pet.physicalCustody == 'Y' ? 'Yes' : '---';
                }
                if (angular.isDefined(response.data.kidsrelation.res) && response.data.kidsrelation.res != null) {
                    $scope.kidsRelationList[0].res = response.data.kidsrelation.res.noofchild;
                    $scope.kidsRelationList[1].res = response.data.kidsrelation.res.notborn == '1' ? 'Yes' : 'No';
                    $scope.kidsRelationList[2].res = response.data.kidsrelation.res.legalCustody == 'N' ? 'No' : response.data.kidsrelation.res.legalCustody == 'Y' ? 'Yes' : '---';
                    $scope.kidsRelationList[3].res = response.data.kidsrelation.res.physicalCustody == 'N' ? 'No' : response.data.kidsrelation.res.physicalCustody == 'Y' ? 'Yes' : '---';
                }
                $scope.kidsRelationList[0].matching = $scope.kidsRelationList[0].pet === $scope.kidsRelationList[0].res;
                $scope.kidsRelationList[1].matching = $scope.kidsRelationList[1].pet === $scope.kidsRelationList[1].res;
                $scope.kidsRelationList[2].matching = $scope.kidsRelationList[2].pet === $scope.kidsRelationList[2].res;
                $scope.kidsRelationList[3].matching = $scope.kidsRelationList[3].pet === $scope.kidsRelationList[3].res;
                var kidscount = 0;
                if(angular.isDefined(response.data.kidsrelation.pet) && angular.isDefined(response.data.kidsrelation.res)){
                    kidscount = Math.max(response.data.kidsrelation.pet.noofchild, response.data.kidsrelation.res.noofchild);
                }
                else{
                    if(angular.isDefined(response.data.kidsrelation.pet)){
                        kidscount = response.data.kidsrelation.pet.noofchild;
                    }
                    else if(angular.isDefined(response.data.kidsrelation.res)){
                        kidscount = response.data.kidsrelation.res.noofchild;
                    }
                }
                $scope.pushvaluearr($scope.kidsRelationList[0]);
                $scope.pushvaluearr($scope.kidsRelationList[1]);
                $scope.pushvaluearr($scope.kidsRelationList[2]);
                $scope.pushvaluearr($scope.kidsRelationList[3]);
                if (angular.isDefined(response.data.kids)) {
                    if (angular.isDefined(response.data.kids.res) && angular.isDefined(response.data.kids.pet)) {
                        $scope.resStatus = true;
                        if (response.data.kids.pet.length >= response.data.kids.res.length) {
                            for (var i = 0; i < response.data.kids.pet.length; i++) {
                                var custody = {};
                                $scope.pushvaluearr(reviewJson(response.data.kids.pet[i].firstName," "," ","",!1,!0,'blue'));
                                $scope.pushvaluearr(reviewJson('Full Name', response.data.kids.pet[i].firstName + ' ' + response.data.kids.pet[i].middleName + ' ' + response.data.kids.pet[i].lastName, angular.isDefined(response.data.kids.res[i]) ? (response.data.kids.res[i].firstName + ' ' + response.data.kids.res[i].middleName + ' ' + response.data.kids.res[i].lastName) : '', 'kidsname' + response.data.kids.pet[i].id, {j: 0,k: 1}, !0));
                                $scope.pushvaluearr(reviewJson('Sex', response.data.kids.pet[i].gender == 'F' ? 'Female' : response.data.kids.pet[i].gender == 'M' ? 'Male' : '', angular.isDefined(response.data.kids.res[i]) ? (response.data.kids.res[i].gender == 'F' ? 'Female' : response.data.kids.res[i].gender == 'M' ? 'Male' : '') : '---', 'kidsgender' + response.data.kids.pet[i].id, {j: 0,k: 1}, !0));
                                $scope.pushvaluearr(reviewJson('City and state of birth', response.data.kids.pet[i].birthPlace, angular.isDefined(response.data.kids.res[i]) ? response.data.kids.res[i].birthPlace : '---', 'kidsbirthplace' + response.data.kids.pet[i].id, {j: 0,k: 1}, !0));
                                $scope.pushvaluearr(reviewJson('Birth Date', ValidDate(response.data.kids.pet[i].dob), angular.isDefined(response.data.kids.res[i]) ? ValidDate(response.data.kids.pet[i].dob) : '---', 'kidsdob' + response.data.kids.pet[i].id, {j: 0,k: 1}, !0));
                                custody.kidName = response.data.kids.pet[i].firstName + ' ' + response.data.kids.pet[i].middleName + ' ' + response.data.kids.pet[i].lastName;
                                if (response.data.kidsrelation.pet.legalCustody == 'N') {
                                    custody.legal = response.data.kids.pet[i].legalCustody;
                                } else {
                                    custody.legal = 'Shared';
                                }
                                if (response.data.kidsrelation.pet.physicalCustody == 'N') {
                                    custody.physical = response.data.kids.pet[i].physicalCustody;
                                } else {
                                    custody.physical = 'Shared';
                                }
                                $scope.kidsPetCustoday.push(custody);
                                custody = {};
                                if (angular.isDefined(response.data.kids.res[i])) {
                                    custody.kidName = response.data.kids.res[i].firstName + ' ' + response.data.kids.res[i].middleName + ' ' + response.data.kids.res[i].lastName;
                                }
                                if (angular.isDefined(response.data.kidsrelation.res) && response.data.kidsrelation.res != null) {
                                    if (response.data.kidsrelation.res.legalCustody == 'N') {
                                        if (angular.isDefined(response.data.kids.res[i])) {
                                            custody.legal = response.data.kids.res[i].legalCustody;
                                        }
                                    } else {
                                        custody.legal = 'Shared';
                                    }
                                    if (response.data.kidsrelation.res.physicalCustody == 'N') {
                                        if (angular.isDefined(response.data.kids.res[i])) {
                                            custody.physical = response.data.kids.res[i].physicalCustody;
                                        }
                                    } else {
                                        custody.physical = 'Shared';
                                    }
                                }
                                $scope.kidsResCustoday.push(custody);
                                if (angular.isDefined(response.data.kids.pet[i].kidsaddress)) {
                                    for (var ij = 0; ij < response.data.kids.pet[i].kidsaddress.length; ij++) {
                                        $scope.pushvaluearr(reviewJson('-- Street', response.data.kids.pet[i].kidsaddress[ij].street, angular.isDefined(response.data.kids.res[i]) && angular.isDefined(response.data.kids.res[i].kidsaddress[ij]) ? response.data.kids.res[i].kidsaddress[ij].street : '---', 'kidsaddressstreet' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].kidsaddress[ij].id, {j: 2,k: 0}, !0));
                                        $scope.pushvaluearr(reviewJson('-- City', response.data.kids.pet[i].kidsaddress[ij].city, angular.isDefined(response.data.kids.res[i]) && angular.isDefined(response.data.kids.res[i].kidsaddress[ij]) ? response.data.kids.res[i].kidsaddress[ij].city : '---', 'kidsaddresscity' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].kidsaddress[ij].id, {j: 2,k: 0}, !0));
                                        $scope.pushvaluearr(reviewJson('-- State', response.data.kids.pet[i].kidsaddress[ij].state, angular.isDefined(response.data.kids.res[i]) && angular.isDefined(response.data.kids.res[i].kidsaddress[ij]) ? response.data.kids.res[i].kidsaddress[ij].state : '---', 'kidsaddressstate' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].kidsaddress[ij].id, {j: 2,k: 0}, !0));
                                        $scope.pushvaluearr(reviewJson('-- Zip Code', response.data.kids.pet[i].kidsaddress[ij].zip, angular.isDefined(response.data.kids.res[i]) && angular.isDefined(response.data.kids.res[i].kidsaddress[ij]) ? response.data.kids.res[i].kidsaddress[ij].zip : '---', 'kidsaddresszip' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].kidsaddress[ij].id, {j: 2,k: 0}, !0));
                                        var myself = '---';
                                        if (angular.isDefined(response.data.kids.pet[i]) && angular.isDefined(response.data.kids.pet[i].kidsaddress[ij])) {
                                            var myname = "Myself";
                                            var spousename = "Spouse";
                                            if (angular.isDefined($scope.userinfo.myinfo) && $scope.userinfo.myinfo) {
                                                myname = $scope.userinfo.myinfo.fname;
                                            }
                                            if (angular.isDefined($scope.userinfo.spouseinfo) && $scope.userinfo.spouseinfo) {
                                                spousename = $scope.userinfo.spouseinfo.fname;
                                            }
                                            myself = getcustodyname(response.data.kids.pet[i].kidsaddress[ij].livedWith, myname, spousename);
                                        }
                                        var spouse = '---';
                                        if (angular.isDefined(response.data.kids.res[i]) && angular.isDefined(response.data.kids.res[i].kidsaddress[ij])) {
                                            var myname = "Myself";
                                            var spousename = "Spouse";
                                            if (angular.isDefined($scope.userinfo.myinfo) && $scope.userinfo.myinfo) {
                                                myname = $scope.userinfo.myinfo.fname;
                                            }
                                            if (angular.isDefined($scope.userinfo.spouseinfo) && $scope.userinfo.spouseinfo) {
                                                spousename = $scope.userinfo.spouseinfo.fname;
                                            }
                                            spouse = getcustodyname(response.data.kids.res[i].kidsaddress[ij].livedWith, myname, spousename);
                                        }
                                        $scope.pushvaluearr(reviewJson('-- Person kid lived with', myself, spouse, 'kidsaddresslivedwith' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].kidsaddress[ij].id, {j: 2,k: 0}, !0));
                                        $scope.pushvaluearr(reviewJson('-- Period of residence', ValidDate(response.data.kids.pet[i].kidsaddress[ij].fromDate) + '-' + ValidDate(response.data.kids.pet[i].kidsaddress[ij].toDate), angular.isDefined(response.data.kids.res[i]) && angular.isDefined(response.data.kids.res[i].kidsaddress[ij]) ? ValidDate(response.data.kids.res[i].kidsaddress[ij].fromDate) + '-' + ValidDate(response.data.kids.res[i].kidsaddress[ij].toDate) : '---', 'kidspetiodres' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].kidsaddress[ij].id, {j: 2,k: 0}, !0));
                                    }
                                }
                                $scope.pushvaluearr(reviewJson('Are there any legal issues to report?', response.data.kids.pet[i].hasLegalissue == '0' ? 'No' : 'Yes', angular.isDefined(response.data.kids.res[i]) ? (response.data.kids.res[i].hasLegalissue == '0' ? 'No' : 'Yes') : '---', 'kidshaslegalissue' + response.data.kids.pet[i].id, {j: 2,k: 1}, !0));
                                if (response.data.kids.pet[i].hasLegalissue == '1' && angular.isDefined(response.data.kids.pet[i].kidsLegalissue)) {
                                    for (var ij = 0; ij < response.data.kids.pet[i].kidsLegalissue.length; ij++) {
                                        $scope.pushvaluearr(reviewJson('–– Legal issue is for ' + response.data.kids.pet[i].firstName, '', '', '', !1, !0));
                                        $scope.pushvaluearr(reviewJson('–– Type', response.data.kids.pet[i].kidsLegalissue[ij].type, angular.isDefined(response.data.kids.res[i]) && response.data.kids.res[i].hasLegalissue == '1' && angular.isDefined(response.data.kids.res[i].kidsLegalissue[ij]) ? response.data.kids.res[i].kidsLegalissue[ij].type : '---', 'kidslegalissuetype' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].kidsLegalissue[ij].id, {j: 2,k: 1}, !0));
                                        $scope.pushvaluearr(reviewJson('–– Case Number', response.data.kids.pet[i].kidsLegalissue[ij].caseNumber, angular.isDefined(response.data.kids.res[i]) && response.data.kids.res[i].hasLegalissue == '1' && angular.isDefined(response.data.kids.res[i].kidsLegalissue[ij]) ? response.data.kids.res[i].kidsLegalissue[ij].caseNumber : '---', 'kidslegalissuecasenumber' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].kidsLegalissue[ij].id, {j: 2,k: 1}, !0));
                                        $scope.pushvaluearr(reviewJson('–– Court', response.data.kids.pet[i].kidsLegalissue[ij].court, angular.isDefined(response.data.kids.res[i]) && response.data.kids.res[i].hasLegalissue == '1' && angular.isDefined(response.data.kids.res[i].kidsLegalissue[ij]) ? response.data.kids.res[i].kidsLegalissue[ij].court : '---', 'kidslegalissuecourt' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].kidsLegalissue[ij].id, {j: 2,k: 1}, !0));
                                        $scope.pushvaluearr(reviewJson('–– Court order or judgment date', ValidDate(response.data.kids.pet[i].kidsLegalissue[ij].judgementDate), angular.isDefined(response.data.kids.res[i]) && response.data.kids.res[i].hasLegalissue == '1' && angular.isDefined(response.data.kids.res[i].kidsLegalissue[ij]) ? ValidDate(response.data.kids.res[i].kidsLegalissue[ij].judgementDate) : '---', 'kidslegalissuejudgedate' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].kidsLegalissue[ij].id, {j: 2,k: 1}, !0));
                                        $scope.pushvaluearr(reviewJson('–– Case status', response.data.kids.pet[i].kidsLegalissue[ij].caseStatus, angular.isDefined(response.data.kids.res[i]) && response.data.kids.res[i].hasLegalissue == '1' && angular.isDefined(response.data.kids.res[i].kidsLegalissue[ij]) ? response.data.kids.res[i].kidsLegalissue[ij].caseStatus : '---', 'kidslegalissuecasestatus' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].kidsLegalissue[ij].id, {j: 2,k: 1}, !0));
                                    }
                                }
                                $scope.pushvaluearr(reviewJson('Are there any protective or restraining orders in effect?', response.data.kids.pet[i].hasProtective == '0' ? 'No' : 'Yes', angular.isDefined(response.data.kids.res[i]) ? (response.data.kids.res[i].hasProtective == '0' ? 'No' : 'Yes') : '---', 'kidshasprotective' + response.data.kids.pet[i].id, {j: 2,k: 2}, !0));
                                if (response.data.kids.pet[i].hasProtective == '1' && angular.isDefined(response.data.kids.pet[i].protective)) {
                                    for (var ij = 0; ij < response.data.kids.pet[i].protective.length; ij++) {
                                        $scope.pushvaluearr(reviewJson('–– Protective or restraining order is for ' + response.data.kids.pet[i].firstName, '', '', '', !1, !0));
                                        $scope.pushvaluearr(reviewJson('–– Court', response.data.kids.pet[i].protective[ij].protectiveCourt, angular.isDefined(response.data.kids.res[i]) && response.data.kids.res[i].hasProtective == '1' && angular.isDefined(response.data.kids.res[i].protective[ij]) ? response.data.kids.res[i].protective[ij].protectiveCourt : '---', 'kidsprotectivecourt' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].protective[ij].id, {j: 2,k: 2}, !0));
                                        $scope.pushvaluearr(reviewJson('–– County', response.data.kids.pet[i].protective[ij].protectiveCountry, angular.isDefined(response.data.kids.res[i]) && response.data.kids.res[i].hasProtective == '1' && angular.isDefined(response.data.kids.res[i].protective[ij]) ? response.data.kids.res[i].protective[ij].protectiveCountry : '---', 'kidsprotectivecounty' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].protective[ij].id, {j: 2,k: 2}, true));
                                        $scope.pushvaluearr(reviewJson('–– State', response.data.kids.pet[i].protective[ij].protectiveState, angular.isDefined(response.data.kids.res[i]) && response.data.kids.res[i].hasProtective == '1' && angular.isDefined(response.data.kids.res[i].protective[ij]) ? response.data.kids.res[i].protective[ij].protectiveState : '---', 'kidsprotectivestate' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].protective[ij].id, {j: 2,k: 2}, true));
                                        $scope.pushvaluearr(reviewJson('–– Case number', response.data.kids.pet[i].protective[ij].protectiveCaseNumber, angular.isDefined(response.data.kids.res[i]) && response.data.kids.res[i].hasProtective == '1' && angular.isDefined(response.data.kids.res[i].protective[ij]) ? response.data.kids.res[i].protective[ij].protectiveCaseNumber : '---', 'kidsprotectivecasenumber' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].protective[ij].id, {j: 2,k: 2}, true));
                                        $scope.pushvaluearr(reviewJson('–– Order expires', ValidDate(response.data.kids.pet[i].protective[ij].protectiveExpire), angular.isDefined(response.data.kids.res[i]) && response.data.kids.res[i].hasProtective == '1' && angular.isDefined(response.data.kids.res[i].protective[ij]) ? ValidDate(response.data.kids.res[i].protective[ij].protectiveExpire) : '---', 'kidsprotectiveexpire' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].protective[ij].id, {j: 2,k: 2}, true));
                                    }
                                }
                                $scope.pushvaluearr(reviewJson('Does any other person have legal claims for your kid(s)?', response.data.kids.pet[i].haslegalclaims == '0' ? 'No' : 'Yes', angular.isDefined(response.data.kids.res[i]) ? (response.data.kids.res[i].haslegalclaims == '0' ? 'No' : 'Yes') : '---', 'kidshaslegalclaims' + response.data.kids.pet[i].id, {j: 2,k: 3}, true));
                                if (response.data.kids.pet[i].haslegalclaims == '1' && angular.isDefined(response.data.kids.pet[i].kidslegalclaims)) {
                                    for (var ij = 0; ij < response.data.kids.pet[i].kidslegalclaims.length; ij++) {
                                        $scope.pushvaluearr(reviewJson('legalclaims for ' + response.data.kids.pet[i].firstName, '', '', '', !1, !0));
                                        $scope.pushvaluearr(reviewJson('–– Name', response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonName, angular.isDefined(response.data.kids.res[i]) && response.data.kids.res[i].haslegalclaims == '1' && angular.isDefined(response.data.kids.res[i].kidslegalclaims[ij]) ? response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonName : '---', 'kidslegalClaimspersonName' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].kidslegalclaims[ij].id, {j: 2,k: 3}, true));
                                        $scope.pushvaluearr(reviewJson('–– Address', response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonAddress, angular.isDefined(response.data.kids.res[i]) && response.data.kids.res[i].haslegalclaims == '1' && angular.isDefined(response.data.kids.res[i].kidslegalclaims[ij]) ? response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonAddress : '---', 'kidslegalClaimspersonAddress' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].kidslegalclaims[ij].id, {j: 2,k: 3}, true));
                                        $scope.pushvaluearr(reviewJson('–– Has physical custody', response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonHasphysicalcustody == '0' ? 'No' : response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonHasphysicalcustody == '1' ? 'Yes' : '', angular.isDefined(response.data.kids.res[i]) && response.data.kids.res[i].haslegalclaims == '1' && angular.isDefined(response.data.kids.res[i].kidslegalclaims[ij]) ? response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonHasphysicalcustody == '0' ? 'No' : response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonHasphysicalcustody == '1' ? 'Yes' : '' : '---', 'kidslegalClaimsphysicalcustody' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].kidslegalclaims[ij].id, {j: 2,k: 3}, true));
                                        $scope.pushvaluearr(reviewJson('–– Has custody rights', response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonCustodyRights == '0' ? 'No' : response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonCustodyRights == '1' ? 'Yes' : '', angular.isDefined(response.data.kids.res[i]) && response.data.kids.res[i].haslegalclaims == '1' && angular.isDefined(response.data.kids.res[i].kidslegalclaims[ij]) ? response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonCustodyRights == '0' ? 'No' : response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonCustodyRights == '1' ? 'Yes' : '' : '---', 'kidslegalClaimsCustodyRights' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].kidslegalclaims[ij].id, {j: 2,k: 3}, true));
                                        $scope.pushvaluearr(reviewJson('–– Has visitation rights', response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonVisitationRights == '0' ? 'No' : response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonVisitationRights == '1' ? 'Yes' : '', angular.isDefined(response.data.kids.res[i]) && response.data.kids.res[i].haslegalclaims == '1' && angular.isDefined(response.data.kids.res[i].kidslegalclaims[ij]) ? response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonVisitationRights == '0' ? 'No' : response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonVisitationRights == '1' ? 'Yes' : '' : '---', 'kidslegalClaimsVisitationRights' + response.data.kids.pet[i].id + '_' + response.data.kids.pet[i].kidslegalclaims[ij].id, {j: 2,k: 3}, true));
                                    }
                                }
                            }
                        } else {
                            var kids = [];
                            for (var i = 0; i < response.data.kids.res.length; i++) {
                                var custody = {};
                                $scope.pushvaluearr(reviewJson(response.data.kids.res[i].firstName, ' ', ' ', '', !1, !0, 'blue'));
                                $scope.pushvaluearr(reviewJson('Full Name', angular.isDefined(response.data.kids.pet[i]) ? (response.data.kids.pet[i].firstName + ' ' + response.data.kids.pet[i].middleName + ' ' + response.data.kids.pet[i].lastName) : '---', response.data.kids.res[i].firstName + ' ' + response.data.kids.res[i].middleName + ' ' + response.data.kids.res[i].lastName, 'kidsname' + response.data.kids.res[i].id, {j: 0,k: 1}, !0));
                                $scope.pushvaluearr(reviewJson('Sex', angular.isDefined(response.data.kids.pet[i]) ? (response.data.kids.pet[i].gender == 'F' ? 'Female' : response.data.kids.pet[i].gender == 'M' ? 'Male' : '') : '--', response.data.kids.res[i].gender == 'F' ? 'Female' : response.data.kids.res[i].gender == 'M' ? 'Male' : '', 'kidsgender' + response.data.kids.res[i].id, {j: 0,k: 1}, !0));
                                $scope.pushvaluearr(reviewJson('City and state of birth', angular.isDefined(response.data.kids.pet[i]) ? (response.data.kids.pet[i].birthPlace) : '---', response.data.kids.res[i].birthPlace, 'kidsbirthplace' + response.data.kids.res[i].id, {j: 0,k: 1}, !0));
                                $scope.pushvaluearr(reviewJson('Birth Date', angular.isDefined(response.data.kids.pet[i]) ? ValidDate(response.data.kids.pet[i].dob) : '---', ValidDate(response.data.kids.res[i].dob), 'kidsdob' + response.data.kids.res[i].id, {j: 0,k: 1}, !0));
                                if (angular.isDefined(response.data.kids.pet[i])) {
                                    custody.kidName = response.data.kids.pet[i].firstName + ' ' + response.data.kids.pet[i].middleName + ' ' + response.data.kids.pet[i].lastName;
                                    if (response.data.kidsrelation.pet.legalCustody == 'N') {
                                        custody.legal = response.data.kids.pet[i].legalCustody;
                                    } else {
                                        custody.legal = 'Shared';
                                    }
                                    if (response.data.kidsrelation.pet.physicalCustody == 'N') {
                                        custody.physical = response.data.kids.pet[i].physicalCustody;
                                    } else {
                                        custody.physical = 'Shared';
                                    }
                                }
                                $scope.kidsPetCustoday.push(custody);
                                custody = {};
                                if (angular.isDefined(response.data.kids.res[i])) {
                                    custody.kidName = response.data.kids.res[i].firstName + ' ' + response.data.kids.res[i].middleName + ' ' + response.data.kids.res[i].lastName;
                                }
                                if (angular.isDefined(response.data.kidsrelation.res)) {
                                    if (response.data.kidsrelation.res.legalCustody == 'N') {
                                        custody.legal = response.data.kids.res[i].legalCustody;
                                    } else {
                                        custody.legal = 'Shared';
                                    }
                                    if (response.data.kidsrelation.res.physicalCustody == 'N') {
                                        custody.physical = response.data.kids.res[i].physicalCustody;
                                    } else {
                                        custody.physical = 'Shared';
                                    }
                                }
                                $scope.kidsResCustoday.push(custody);
                                if (angular.isDefined(response.data.kids.res[i].kidsaddress)) {
                                    for (var ij = 0; ij < response.data.kids.res[i].kidsaddress.length; ij++) {
                                        $scope.pushvaluearr(reviewJson('-- Street', angular.isDefined(response.data.kids.pet[i]) && angular.isDefined(response.data.kids.pet[i].kidsaddress[ij]) ? response.data.kids.pet[i].kidsaddress[ij].street : '---', response.data.kids.res[i].kidsaddress[ij].street, 'kidsaddressstreet' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].kidsaddress[ij].id, {j: 2,k: 0}, true));
                                        $scope.pushvaluearr(reviewJson('-- City', angular.isDefined(response.data.kids.pet[i]) && angular.isDefined(response.data.kids.pet[i].kidsaddress[ij]) ? response.data.kids.pet[i].kidsaddress[ij].city : '---', response.data.kids.res[i].kidsaddress[ij].city, 'kidsaddresscity' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].kidsaddress[ij].id, {j: 2,k: 0}, true));
                                        $scope.pushvaluearr(reviewJson('-- State', angular.isDefined(response.data.kids.pet[i]) && angular.isDefined(response.data.kids.pet[i].kidsaddress[ij]) ? response.data.kids.pet[i].kidsaddress[ij].state : '---', response.data.kids.res[i].kidsaddress[ij].state, 'kidsaddressstate' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].kidsaddress[ij].id, {j: 2,k: 0}, true));
                                        //address.push(reviewJson('Address #'+(ij+1), '', '', '', {j:0, k:0}, true));
                                        $scope.pushvaluearr(reviewJson('-- Zip Code', angular.isDefined(response.data.kids.pet[i]) && angular.isDefined(response.data.kids.pet[i].kidsaddress[ij]) ? response.data.kids.pet[i].kidsaddress[ij].zip : '---', response.data.kids.res[i].kidsaddress[ij].zip, 'kidsaddresszip' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].kidsaddress[ij].id, {j: 2,k: 0}, true));
                                        var myself = '---';
                                        if (angular.isDefined(response.data.kids.pet[i]) && angular.isDefined(response.data.kids.pet[i].kidsaddress[ij])) {
                                            var myname = "Myself";
                                            var spousename = "Spouse";
                                            if (angular.isDefined($scope.userinfo.myinfo) && $scope.userinfo.myinfo) {
                                                myname = $scope.userinfo.myinfo.fname;
                                            }
                                            if (angular.isDefined($scope.userinfo.spouseinfo) && $scope.userinfo.spouseinfo) {
                                                spousename = $scope.userinfo.spouseinfo.fname;
                                            }
                                            myself = getcustodyname(response.data.kids.pet[i].kidsaddress[ij].livedWith, myname, spousename);
                                        }
                                        var spouse = '---';
                                        if (angular.isDefined(response.data.kids.res[i]) && angular.isDefined(response.data.kids.res[i].kidsaddress[ij])) {
                                            var myname = "Myself";
                                            var spousename = "Spouse";
                                            if (angular.isDefined($scope.userinfo.myinfo) && $scope.userinfo.myinfo) {
                                                myname = $scope.userinfo.myinfo.fname;
                                            }
                                            if (angular.isDefined($scope.userinfo.spouseinfo) && $scope.userinfo.spouseinfo) {
                                                spousename = $scope.userinfo.spouseinfo.fname;
                                            }
                                            spouse = getcustodyname(response.data.kids.res[i].kidsaddress[ij].livedWith, myname, spousename);
                                        }
                                        $scope.pushvaluearr(reviewJson('-- Person kid lived with', myself, spouse, 'kidsaddresslivedwith' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].kidsaddress[ij].id, {j: 2,k: 0}, true));
                                        $scope.pushvaluearr(reviewJson('-- Period of residence', angular.isDefined(response.data.kids.pet[i]) && angular.isDefined(response.data.kids.pet[i].kidsaddress[ij]) ? ValidDate(response.data.kids.pet[i].kidsaddress[ij].fromDate) + '-' + ValidDate(response.data.kids.pet[i].kidsaddress[ij].toDate) : '---', ValidDate(response.data.kids.res[i].kidsaddress[ij].fromDate) + '-' + ValidDate(response.data.kids.res[i].kidsaddress[ij].toDate), 'kidspetiodres' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].kidsaddress[ij].id, {j: 2,k: 0}, true));
                                    }
                                }
                                $scope.pushvaluearr(reviewJson('Are there any legal issues to report?', angular.isDefined(response.data.kids.pet[i]) ? (response.data.kids.pet[i].hasLegalissue == '0' ? 'No' : 'Yes') : '---', response.data.kids.res[i].hasLegalissue == '0' ? 'No' : 'Yes', 'kidshaslegalissue' + response.data.kids.res[i].id, {j: 2,k: 1}, true));
                                if (response.data.kids.res[i].hasLegalissue == '1' && angular.isDefined(response.data.kids.res[i].kidsLegalissue)) {
                                    for (var ij = 0; ij < response.data.kids.res[i].kidsLegalissue.length; ij++) {
                                        $scope.pushvaluearr(reviewJson('–– Legal issue is for ' + response.data.kids.res[i].firstName, '', '', '', !1, true));
                                        $scope.pushvaluearr(reviewJson('–– Type', angular.isDefined(response.data.kids.pet[i]) && response.data.kids.pet[i].hasLegalissue == '1' && angular.isDefined(response.data.kids.pet[i].kidsLegalissue[ij]) ? response.data.kids.pet[i].kidsLegalissue[ij].type : '---', response.data.kids.res[i].kidsLegalissue[ij].type, 'kidslegalissuetype' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].kidsLegalissue[ij].id, {j: 2,k: 1}, true));
                                        $scope.pushvaluearr(reviewJson('–– Case Number', angular.isDefined(response.data.kids.pet[i]) && response.data.kids.pet[i].hasLegalissue == '1' && angular.isDefined(response.data.kids.pet[i].kidsLegalissue[ij]) ? response.data.kids.pet[i].kidsLegalissue[ij].caseNumber : '---', response.data.kids.res[i].kidsLegalissue[ij].caseNumber, 'kidslegalissuecasenumber' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].kidsLegalissue[ij].id, {j: 2,k: 1}, true));
                                        $scope.pushvaluearr(reviewJson('–– Court', angular.isDefined(response.data.kids.pet[i]) && response.data.kids.pet[i].hasLegalissue == '1' && angular.isDefined(response.data.kids.pet[i].kidsLegalissue[ij]) ? response.data.kids.pet[i].kidsLegalissue[ij].court : '---', response.data.kids.res[i].kidsLegalissue[ij].court, 'kidslegalissuecourt' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].kidsLegalissue[ij].id, {j: 2,k: 1}, true));
                                        $scope.pushvaluearr(reviewJson('–– Court order or judgment date', angular.isDefined(response.data.kids.pet[i]) && response.data.kids.pet[i].hasLegalissue == '1' && angular.isDefined(response.data.kids.pet[i].kidsLegalissue[ij]) ? ValidDate(response.data.kids.pet[i].kidsLegalissue[ij].judgementDate) : '---', ValidDate(response.data.kids.res[i].kidsLegalissue[ij].judgementDate), 'kidslegalissuejudgedate' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].kidsLegalissue[ij].id, {j: 2,k: 1}, true));
                                        $scope.pushvaluearr(reviewJson('–– Case status', angular.isDefined(response.data.kids.pet[i]) && response.data.kids.pet[i].hasLegalissue == '1' && angular.isDefined(response.data.kids.pet[i].kidsLegalissue[ij]) ? response.data.kids.pet[i].kidsLegalissue[ij].caseStatus : '---', response.data.kids.res[i].kidsLegalissue[ij].caseStatus, 'kidslegalissuecasestatus' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].kidsLegalissue[ij].id, {j: 2,k: 1}, true));
                                    }
                                }
                                $scope.pushvaluearr(reviewJson('Are there any protective or restraining orders in effect?', angular.isDefined(response.data.kids.pet[i]) ? (response.data.kids.pet[i].hasProtective == '0' ? 'No' : 'Yes') : '---', response.data.kids.res[i].hasProtective == '0' ? 'No' : 'Yes', 'kidshasprotective' + response.data.kids.res[i].id, {j: 2,k: 2}, true));
                                if (response.data.kids.res[i].hasProtective == '1' && angular.isDefined(response.data.kids.res[i].protective)) {
                                    for (var ij = 0; ij < response.data.kids.res[i].protective.length; ij++) {
                                        $scope.pushvaluearr(reviewJson('–– Protective or restraining order is for ' + response.data.kids.res[i].firstName, '', '', '', !1, true));
                                        $scope.pushvaluearr(reviewJson('–– Court', angular.isDefined(response.data.kids.pet[i]) && response.data.kids.pet[i].hasProtective == '1' && angular.isDefined(response.data.kids.pet[i].protective[ij]) ? response.data.kids.pet[i].protective[ij].protectiveCourt : '---', response.data.kids.res[i].protective[ij].protectiveCourt, 'kidsprotectivecourt' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].protective[ij].id, {j: 2,k: 2}, true));
                                        $scope.pushvaluearr(reviewJson('–– County', angular.isDefined(response.data.kids.pet[i]) && response.data.kids.pet[i].hasProtective == '1' && angular.isDefined(response.data.kids.pet[i].protective[ij]) ? response.data.kids.pet[i].protective[ij].protectiveCountry : '---', angular.isDefined(response.data.kids.res[i]) && response.data.kids.res[i].hasProtective == '1' && angular.isDefined(response.data.kids.res[i].protective[ij]) ? response.data.kids.res[i].protective[ij].protectiveCountry : '---', 'kidsprotectivecourt' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].protective[ij].id, {j: 2,k: 2}, true));
                                        $scope.pushvaluearr(reviewJson('–– State', angular.isDefined(response.data.kids.pet[i]) && response.data.kids.pet[i].hasProtective == '1' && angular.isDefined(response.data.kids.pet[i].protective[ij]) ? response.data.kids.pet[i].protective[ij].protectiveState : '---', response.data.kids.res[i].protective[ij].protectiveState, 'kidsprotectivestate' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].protective[ij].id, {j: 2,k: 2}, true));
                                        $scope.pushvaluearr(reviewJson('–– Case number', angular.isDefined(response.data.kids.pet[i]) && response.data.kids.pet[i].hasProtective == '1' && angular.isDefined(response.data.kids.pet[i].protective[ij]) ? response.data.kids.pet[i].protective[ij].protectiveCaseNumber : '---', response.data.kids.res[i].protective[ij].protectiveCaseNumber, 'kidsprotectivecasenumber' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].protective[ij].id, {j: 2,k: 2}, true));
                                        $scope.pushvaluearr(reviewJson('–– Order expires', angular.isDefined(response.data.kids.pet[i]) && response.data.kids.pet[i].hasProtective == '1' && angular.isDefined(response.data.kids.pet[i].protective[ij]) ? ValidDate(response.data.kids.pet[i].protective[ij].protectiveExpire) : '---', ValidDate(response.data.kids.res[i].protective[ij].protectiveExpire), 'kidsprotectiveexpire' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].protective[ij].id, {j: 2,k: 2}, true));
                                    }
                                }
                                $scope.pushvaluearr(reviewJson('Does any other person have legal claims for your kid(s)?', angular.isDefined(response.data.kids.pet[i]) ? (response.data.kids.pet[i].haslegalclaims == '0' ? 'No' : 'Yes') : '---', response.data.kids.res[i].haslegalclaims == '0' ? 'No' : 'Yes', 'kidshasprotective' + response.data.kids.res[i].id, {j: 2,k: 3}, true));
                                if (response.data.kids.res[i].haslegalclaims == '1' && angular.isDefined(response.data.kids.res[i].kidslegalclaims)) {
                                    for (var ij = 0; ij < response.data.kids.res[i].kidslegalclaims.length; ij++) {
                                        $scope.pushvaluearr(reviewJson('legalclaims for ' + response.data.kids.res[i].firstName, '', '', '', !1, true));
                                        $scope.pushvaluearr(reviewJson('–– Name', angular.isDefined(response.data.kids.pet[i]) && response.data.kids.pet[i].haslegalclaims == '1' && angular.isDefined(response.data.kids.pet[i].kidslegalclaims[ij]) ? response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonName : '---', response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonName, 'kidslegalClaimspersonName' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].kidslegalclaims[ij].id, {j: 2,k: 3}, true));
                                        $scope.pushvaluearr(reviewJson('–– Address', angular.isDefined(response.data.kids.pet[i]) && response.data.kids.pet[i].haslegalclaims == '1' && angular.isDefined(response.data.kids.pet[i].kidslegalclaims[ij]) ? response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonAddress : '---', response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonAddress, 'kidslegalClaimspersonAddress' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].kidslegalclaims[ij].id, {j: 2,k: 3}, true));
                                        $scope.pushvaluearr(reviewJson('–– Has physical custody', angular.isDefined(response.data.kids.pet[i]) && response.data.kids.pet[i].haslegalclaims == '1' && angular.isDefined(response.data.kids.pet[i].kidslegalclaims[ij]) ? response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonHasphysicalcustody == '0' ? 'No' : response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonHasphysicalcustody == '1' ? 'Yes' : '' : '---', response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonHasphysicalcustody == '0' ? 'No' : response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonHasphysicalcustody == '1' ? 'Yes' : '', 'kidslegalClaimsphysicalcustody' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].kidslegalclaims[ij].id, {j: 2,k: 3}, true));
                                        $scope.pushvaluearr(reviewJson('–– Has custody rights', angular.isDefined(response.data.kids.pet[i]) && response.data.kids.pet[i].haslegalclaims == '1' && angular.isDefined(response.data.kids.pet[i].kidslegalclaims[ij]) ? response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonCustodyRights == '0' ? 'No' : response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonCustodyRights == '1' ? 'Yes' : '' : '---', response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonCustodyRights == '0' ? 'No' : response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonCustodyRights == '1' ? 'Yes' : '', 'kidslegalClaimsCustodyRights' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].kidslegalclaims[ij].id, {j: 2,k: 3}, true));
                                        $scope.pushvaluearr(reviewJson('–– Has visitation rights', angular.isDefined(response.data.kids.pet[i]) && response.data.kids.pet[i].haslegalclaims == '1' && angular.isDefined(response.data.kids.pet[i].kidslegalclaims[ij]) ? response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonVisitationRights == '0' ? 'No' : response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonVisitationRights == '1' ? 'Yes' : '' : '---', response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonVisitationRights, 'kidslegalClaimsVisitationRights' + response.data.kids.res[i].id + '_' + response.data.kids.res[i].kidslegalclaims[ij].id, {j: 2,k: 3}, true));
                                    }
                                }
                            }
                        }
                    } else {
                        if (angular.isDefined(response.data.kids.pet)) {
                            for (var i = 0; i < response.data.kids.pet.length; i++) {
                                var custody = {};
                                $scope.pushvaluearr(reviewJson(response.data.kids.pet[i].firstName, ' ', ' ', '', !1, !0, 'blue'));
                                $scope.pushvaluearr(reviewJson('Full Name', response.data.kids.pet[i].firstName + ' ' + response.data.kids.pet[i].middleName + ' ' + response.data.kids.pet[i].lastName, '---', '', {j: 0,k: 1}, !0));
                                $scope.pushvaluearr(reviewJson('Sex', response.data.kids.pet[i].gender == 'F' ? 'Female' : response.data.kids.pet[i].gender == 'M' ? 'Male' : '', '---', '', {j: 0,k: 1}, !0));
                                $scope.pushvaluearr(reviewJson('City and state of birth', response.data.kids.pet[i].birthPlace, '---', '', {j: 0,k: 1}, !0));
                                $scope.pushvaluearr(reviewJson('Birth Date', ValidDate(response.data.kids.pet[i].dob), '---', '', {j: 0,k: 1}, !0));
                                
                                custody.kidName = response.data.kids.pet[i].firstName + ' ' + response.data.kids.pet[i].middleName + ' ' + response.data.kids.pet[i].lastName;
                                if (response.data.kidsrelation.pet.legalCustody == 'N') {
                                    custody.legal = response.data.kids.pet[i].legalCustody;
                                } else {
                                    custody.legal = 'Shared';
                                }
                                if (response.data.kidsrelation.pet.physicalCustody == 'N') {
                                    custody.physical = response.data.kids.pet[i].physicalCustody;
                                } else {
                                    custody.physical = 'Shared';
                                }
                                $scope.kidsPetCustoday.push(custody);
                                if (angular.isDefined(response.data.kids.pet[i].kidsaddress)) {
                                    for (var ij = 0; ij < response.data.kids.pet[i].kidsaddress.length; ij++) {
                                        $scope.pushvaluearr(reviewJson('-- Street', response.data.kids.pet[i].kidsaddress[ij].street, '---', '', {j: 2,k: 0}, true));
                                        $scope.pushvaluearr(reviewJson('-- City', response.data.kids.pet[i].kidsaddress[ij].city, '---', '', {j: 2,k: 0}, true));
                                        $scope.pushvaluearr(reviewJson('-- State', response.data.kids.pet[i].kidsaddress[ij].state, '---', '', {j: 2,k: 0}, true));
                                        $scope.pushvaluearr(reviewJson('-- Zip Code', response.data.kids.pet[i].kidsaddress[ij].zip, '---', '', {j: 2,k: 0}, true));

                                        //address.push(reviewJson('Address #'+(ij+1), '', '', '', {j:0, k:0}, true));
                                        var myself = '---';
                                        if (angular.isDefined(response.data.kids.pet[i]) && angular.isDefined(response.data.kids.pet[i].kidsaddress[ij])) {
                                            var myname = "Myself";
                                            var spousename = "Spouse";
                                            if (angular.isDefined($scope.userinfo.myinfo) && $scope.userinfo.myinfo) {
                                                myname = $scope.userinfo.myinfo.fname;
                                            }
                                            if (angular.isDefined($scope.userinfo.spouseinfo) && $scope.userinfo.spouseinfo) {
                                                spousename = $scope.userinfo.spouseinfo.fname;
                                            }
                                            myself = getcustodyname(response.data.kids.pet[i].kidsaddress[ij].livedWith, myname, spousename);
                                        }
                                        var spouse = '---';
                                        $scope.pushvaluearr(reviewJson('-- Person kid lived with', myself, '---', '', {j: 2,k: 0}, true));
                                        $scope.pushvaluearr(reviewJson('-- Period of residence', ValidDate(response.data.kids.pet[i].kidsaddress[ij].fromDate) + '-' + ValidDate(response.data.kids.pet[i].kidsaddress[ij].toDate), '---', '', {j: 2,k: 0}, true));
                                    }
                                }
                                $scope.pushvaluearr(reviewJson('Are there any legal issues to report?', response.data.kids.pet[i].hasLegalissue == '0' ? 'No' : 'Yes', '---', 'kidshaslegalissue' + response.data.kids.pet[i].id, {j: 2,k: 1}, true));
                                if (response.data.kids.pet[i].hasLegalissue == '1' && angular.isDefined(response.data.kids.pet[i].kidsLegalissue)) {
                                    for (var ij = 0; ij < response.data.kids.pet[i].kidsLegalissue.length; ij++) {
                                        $scope.pushvaluearr(reviewJson('–– Legal issue is for ' + response.data.kids.pet[i].firstName, '', '', '', !1, true));
                                        $scope.pushvaluearr(reviewJson('–– Type', response.data.kids.pet[i].kidsLegalissue[ij].type, '---', '', {j: 2,k: 1}, true));
                                        $scope.pushvaluearr(reviewJson('–– Case Number', response.data.kids.pet[i].kidsLegalissue[ij].caseNumber, '---', '', {j: 2,k: 1}, true));
                                        $scope.pushvaluearr(reviewJson('–– Court', response.data.kids.pet[i].kidsLegalissue[ij].court, '---', '', {j: 2,k: 1}, true));
                                        $scope.pushvaluearr(reviewJson('–– Court order or judgment date', ValidDate(response.data.kids.pet[i].kidsLegalissue[ij].judgementDate), '---', '', {j: 2,k: 1}, true));
                                        $scope.pushvaluearr(reviewJson('–– Case status', response.data.kids.pet[i].kidsLegalissue[ij].caseStatus, '---', '', {j: 2,k: 1}, true));
                                    }
                                }
                                $scope.pushvaluearr(reviewJson('Are there any protective or restraining orders in effect?', response.data.kids.pet[i].hasProtective == '0' ? 'No' : 'Yes', '---', 'kidshasprotective' + response.data.kids.pet[i].id, {j: 2,k: 2}, true));
                                if (response.data.kids.pet[i].hasProtective == '1' && angular.isDefined(response.data.kids.pet[i].protective)) {
                                    for (var ij = 0; ij < response.data.kids.pet[i].protective.length; ij++) {
                                        $scope.pushvaluearr(reviewJson('–– Protective or restraining order is for ' + response.data.kids.pet[i].firstName, '', '', '', !1, true));
                                        $scope.pushvaluearr(reviewJson('–– Court', response.data.kids.pet[i].protective[ij].protectiveCourt, '---', '', {j: 2,k: 2}, true));
                                        $scope.pushvaluearr(reviewJson('–– County', response.data.kids.pet[i].protective[ij].protectiveCountry, '---', '', {j: 2,k: 2}, true));
                                        $scope.pushvaluearr(reviewJson('–– State', response.data.kids.pet[i].protective[ij].protectiveState, '---', '', {j: 2,k: 2}, true));
                                        $scope.pushvaluearr(reviewJson('–– Case number', response.data.kids.pet[i].protective[ij].protectiveCaseNumber, '---', '', {j: 2,k: 2}, true));
                                        $scope.pushvaluearr(reviewJson('–– Order expires', ValidDate(response.data.kids.pet[i].protective[ij].protectiveExpire), '---', '', {j: 2,k: 2}, true));
                                    }
                                }
                                $scope.pushvaluearr(reviewJson('Does any other person have legal claims for your kid(s)?', response.data.kids.pet[i].haslegalclaims == '0' ? 'No' : 'Yes', '---', {j: 2,k: 3}, true));
                                if (response.data.kids.pet[i].haslegalclaims == '1' && angular.isDefined(response.data.kids.pet[i].kidslegalclaims)) {
                                    for (var ij = 0; ij < response.data.kids.pet[i].kidslegalclaims.length; ij++) {
                                        $scope.pushvaluearr(reviewJson('legalclaims for ' + response.data.kids.pet[i].firstName, '', '', '', !1, true));
                                        $scope.pushvaluearr(reviewJson('–– Name', response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonName, '---', '', {j: 2,k: 3}, true));
                                        $scope.pushvaluearr(reviewJson('–– Address', response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonAddress, '---', '', {j: 2,k: 3}, true));
                                        $scope.pushvaluearr(reviewJson('–– Has physical custody', response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonHasphysicalcustody == '0' ? 'No' : response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonHasphysicalcustody == '1' ? 'Yes' : '', '---', '', {j: 2,k: 3}, true));
                                        $scope.pushvaluearr(reviewJson('–– Has custody rights', response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonCustodyRights == '0' ? 'No' : response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonCustodyRights == '1' ? 'Yes' : '', '---', '', {j: 2,k: 3}, true));
                                        $scope.pushvaluearr(reviewJson('–– Has visitation rights', response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonVisitationRights == '0' ? 'No' : response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonVisitationRights == '1' ? 'Yes' : '', '---', '', {j: 2,k: 3}, true));
                                    }
                                }
                            }
                        } else {
                            for (var i = 0; i < response.data.kids.res.length; i++) {
                                var custody = {};
                                $scope.pushvaluearr(reviewJson(response.data.kids.res[i].firstName," "," ","",!1,!0,'blue'));
                                $scope.pushvaluearr(reviewJson("Full Name","---",response.data.kids.res[i].firstName+" "+response.data.kids.res[i].middleName+" "+response.data.kids.res[i].lastName,"",{j:0,k:1},!0));
                                $scope.pushvaluearr(reviewJson("Sex","---","F"==response.data.kids.res[i].gender?"Female":"M"==response.data.kids.res[i].gender?"Male":"","",{j:0,k:1},!0));
                                $scope.pushvaluearr(reviewJson("City and state of birth","---",response.data.kids.res[i].birthPlace,"",{j:0,k:1},!0));
                                $scope.pushvaluearr(reviewJson("Birth Date","---",ValidDate(response.data.kids.res[i].dob),"",{j:0,k:1},!0));

                                custody.kidName = response.data.kids.res[i].firstName + ' ' + response.data.kids.res[i].middleName + ' ' + response.data.kids.res[i].lastName;
                                if (response.data.kidsrelation.res.legalCustody == 'N') {
                                    custody.legal = response.data.kids.res[i].legalCustody;
                                } else {
                                    custody.legal = 'Shared';
                                }
                                if (response.data.kidsrelation.res.physicalCustody == 'N') {
                                    custody.physical = response.data.kids.res[i].physicalCustody;
                                } else {
                                    custody.physical = 'Shared';
                                }
                                $scope.kidsPetCustoday.push(custody);
                                if (angular.isDefined(response.data.kids.res[i].kidsaddress)) {
                                    for (var ij = 0; ij < response.data.kids.res[i].kidsaddress.length; ij++) {
                                        //address.push(reviewJson('Address #'+(ij+1), '', '', '', {j:0, k:0}, true));
                                        $scope.pushvaluearr(reviewJson("-- Street","---",response.data.kids.res[i].kidsaddress[ij].street,"",{j:2,k:0},!0));
                                        $scope.pushvaluearr(reviewJson("-- City","---",response.data.kids.res[i].kidsaddress[ij].city,"",{j:2,k:0},!0));
                                        $scope.pushvaluearr(reviewJson("-- State","---",response.data.kids.res[i].kidsaddress[ij].state,"",{j:2,k:0},!0));
                                        $scope.pushvaluearr(reviewJson("-- Zip Code","---",response.data.kids.res[i].kidsaddress[ij].zip,"",{j:2,k:0},!0));
                                        var myself = '---';
                                        var spouse = '---';
                                        if (angular.isDefined(response.data.kids.res[i]) && angular.isDefined(response.data.kids.res[i].kidsaddress[ij])) {
                                            var myname = "Myself";
                                            var spousename = "Spouse";
                                            if (angular.isDefined($scope.userinfo.myinfo) && $scope.userinfo.myinfo) {
                                                myname = $scope.userinfo.myinfo.fname;
                                            }
                                            if (angular.isDefined($scope.userinfo.spouseinfo) && $scope.userinfo.spouseinfo) {
                                                spousename = $scope.userinfo.spouseinfo.fname;
                                            }
                                            spouse = getcustodyname(response.data.kids.res[i].kidsaddress[ij].livedWith, myname, spousename);
                                        }
                                        $scope.pushvaluearr(reviewJson("-- Period of residence","---",ValidDate(response.data.kids.res[i].kidsaddress[ij].fromDate)+"-"+ValidDate(response.data.kids.res[i].kidsaddress[ij].toDate),"",{j:2,k:0},!0));
                                    }
                                }
                                $scope.pushvaluearr(reviewJson("Are there any legal issues to report?","---",response.data.kids.res[i].hasLegalissue == '0' ? 'No' : 'Yes' ,"kidshaslegalissue"+response.data.kids.res[i].id,{j:2,k:1},!0));
                                if (response.data.kids.res[i].hasLegalissue == '1' && angular.isDefined(response.data.kids.res[i].kidsLegalissue)) {
                                    for (var ij = 0; ij < response.data.kids.res[i].kidsLegalissue.length; ij++) {
                                        $scope.pushvaluearr(reviewJson("–– Legal issue is for "+response.data.kids.res[i].firstName,"","","",!1,!0));
                                        $scope.pushvaluearr(reviewJson("–– Type","---",response.data.kids.res[i].kidsLegalissue[ij].type,"",{j:2,k:1},!0));
                                        $scope.pushvaluearr(reviewJson("–– Case Number","---",response.data.kids.res[i].kidsLegalissue[ij].caseNumber,"",{j:2,k:1},!0));
                                        $scope.pushvaluearr(reviewJson("–– Court","---",response.data.kids.res[i].kidsLegalissue[ij].court,"",{j:2,k:1},!0));
                                        $scope.pushvaluearr(reviewJson("–– Court order or judgment date","---",ValidDate(response.data.kids.res[i].kidsLegalissue[ij].judgementDate),"",{j:2,k:1},!0));
                                        $scope.pushvaluearr(reviewJson("–– Case status","---",response.data.kids.res[i].kidsLegalissue[ij].caseStatus,"",{j:2,k:1},!0));
                                    }
                                }
                                $scope.pushvaluearr(reviewJson("Are there any protective or restraining orders in effect?","---",response.data.kids.res[i].hasProtective == '0' ? 'No' : 'Yes',"kidshasprotective"+response.data.kids.res[i].id,{j:2,k:2},!0));
                                if (response.data.kids.res[i].hasProtective == '1' && angular.isDefined(response.data.kids.res[i].protective)) {
                                    for (var ij = 0; ij < response.data.kids.res[i].protective.length; ij++) {
                                        $scope.pushvaluearr(reviewJson("–– Protective or restraining order is for "+response.data.kids.res[i].firstName,"","","",!1,!0));
                                        $scope.pushvaluearr(reviewJson("–– Court","---",response.data.kids.res[i].protective[ij].protectiveCourt,"",{j:2,k:2},!0));
                                        $scope.pushvaluearr(reviewJson("–– County","---",response.data.kids.res[i].protective[ij].protectiveCountry,"",{j:2,k:2},!0));
                                        $scope.pushvaluearr(reviewJson("–– State","---",response.data.kids.res[i].protective[ij].protectiveState,"",{j:2,k:2},!0));
                                        $scope.pushvaluearr(reviewJson("–– Case number","---",response.data.kids.res[i].protective[ij].protectiveCaseNumber,"",{j:2,k:2},!0));
                                        $scope.pushvaluearr(reviewJson("–– Order expires","---",ValidDate(response.data.kids.res[i].protective[ij].protectiveExpire),"",{j:2,k:2},!0));
                                    }
                                }
                                $scope.pushvaluearr(reviewJson("Does any other person have legal claims for your kid(s)?","---",response.data.kids.res[i].haslegalclaims == '0' ? 'No' : 'Yes',{j:2,k:3},!0));
                                if (response.data.kids.res[i].haslegalclaims == '1' && angular.isDefined(response.data.kids.res[i].kidslegalclaims)) {
                                    for (var ij = 0; ij < response.data.kids.res[i].kidslegalclaims.length; ij++) {
                                        $scope.pushvaluearr(reviewJson("legalclaims for "+response.data.kids.res[i].firstName,"","","",!1,!0));
                                        $scope.pushvaluearr(reviewJson("–– Name","---",response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonName,"",{j:2,k:3},!0));
                                        $scope.pushvaluearr(reviewJson("–– Address","---",response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonAddress,"",{j:2,k:3},!0));
                                        $scope.pushvaluearr(reviewJson("–– Has physical custody","---","0"==response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonHasphysicalcustody?"No":"1"==response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonHasphysicalcustody?"Yes":"","",{j:2,k:3},!0));
                                        $scope.pushvaluearr(reviewJson("–– Has custody rights","---","0"==response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonCustodyRights?"No":"1"==response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonCustodyRights?"Yes":"","",{j:2,k:3},!0));
                                        $scope.pushvaluearr(reviewJson("–– Has visitation rights","---","0"==response.data.kids.res[i].kidslegalclaims[ij].legalClaimspersonVisitationRights?"No":"1"==response.data.kids.pet[i].kidslegalclaims[ij].legalClaimspersonVisitationRights?"Yes":"","",{j:2,k:3},!0));
                                    }
                                }
                            }
                        }
                    }
                }
                for(var c=0; c<$scope.reviewcompletedata.length;c++){
                    if($scope.reviewcompletedata[c].matching){
                        $scope.matchCount++;
                    }
                }
                $scope.allCount = $scope.reviewcompletedata.length;
                $scope.loadingreview = false;
            });
        });
    }
    $scope.countAll = function() {
        $scope.allCount++;
    }
    $scope.countMatch = function() {
        $scope.matchCount++;
    }
    $scope.saveBacktoreview = function(e) {
        $scope.IOE_ER_MSG = '';
        if (e.$invalid) {
            $scope.IOEvalidation(e);
            $scope.IOE_ER_MSG = 'Please fill the required fields';
            return;
        } else if (e.$valid) {
            $scope.reviewEdited = false;
            alreadyCompleted = true;
            $scope.saveKids(true);
            $scope.j = 3;
            $scope.k = 0;
        }
        // $scope.reviewEdited = false;
    }
    $scope.useSameAddress = function(index, issame) {
        $scope.data.kids[index].kidsaddress = [];
        if (issame) {
            for (var i = 0; i < $scope.data.kids[0].kidsaddress.length; i++) {
                // alert(i);
                // $scope.data.kids[index].kidsaddress[i].street = angular.isDefined($scope.data.kids[0].kidsaddress[i].street) ? $scope.data.kids[0].kidsaddress[i].street : '';
                // var pushval = {
                //     'street': angular.isDefined($scope.data.kids[0].kidsaddress[i].street) ? $scope.data.kids[0].kidsaddress[i].street : '',
                //     'city' : angular.isDefined($scope.data.kids[0].kidsaddress[i].city) ? $scope.data.kids[0].kidsaddress[i].city : '',
                //     'state' : angular.isDefined($scope.data.kids[0].kidsaddress[i].state) ? $scope.data.kids[0].kidsaddress[i].state : '',
                //     'zip' : angular.isDefined($scope.data.kids[0].kidsaddress[i].zip) ? $scope.data.kids[0].kidsaddress[i].zip : '',
                //     'livedWith' : angular.isDefined($scope.data.kids[0].kidsaddress[i].livedWith) ? $scope.data.kids[0].kidsaddress[i].livedWith : '',
                //     'Relationship' : angular.isDefined($scope.data.kids[0].kidsaddress[i].Relationship) ? $scope.data.kids[0].kidsaddress[i].Relationship : '',
                //     'fromDate' : angular.isDefined($scope.data.kids[0].kidsaddress[i].fromDate) ? $scope.data.kids[0].kidsaddress[i].fromDate : '',
                //     'toDate' : angular.isDefined($scope.data.kids[0].kidsaddress[i].toDate) ? $scope.data.kids[0].kidsaddress[i].toDate : ''
                // }
                // $scope.data.kids[index].kidsaddress.push(pushval);
            }
            //$scope.data.kids[index].kidsaddress = $scope.data.kids[0].kidsaddress;
        } else {
            // $scope.data.kids[index].kidsaddress.push({});
        }
        //        $scope.data.kids[index].kidsaddress = $scope.data.kids[0].kidsaddress;
    }
});
$(document).on("click", "body", function(e) {
    if (!$(e.target).is('.calDisplay *') && !$(e.target).is('.popevent *') && !$(e.target).is('#ui-datepicker-div *')) {
        $('.popevent').find('.close').click();
    }
});
app.directive('autofocus', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        link: function($scope, $element) {
            $timeout(function() {
                $element[0].focus();
                $element[0].addEventListener('blur', function(e) {
                    if ($element[0].innerText.length < 2) {
                        if ($element[0].firstElementChild != null) {
                            $element[0].innerHTML = '';
                        }
                    }
                });
            });
        }
    }
}]);
app.directive('pieChart', [function() {
    return {
        restrict: 'E',
        scope: {
            value: '=data'
        },
        link: function(scope, element) {
            var value = scope.value;
            var classic = (value.withyou / value.total) * 100;
            var alter = 100 - classic;
            var myCanvas = document.createElement("Canvas");
            myCanvas.width = 70;
            myCanvas.height = 70;
            var ctx = myCanvas.getContext("2d");
            var myVinyls = {
                "Classical music": classic,
                "Alternative rock": alter,
            };

            function drawPieSlice(ctx, centerX, centerY, radius, startAngle, endAngle, color) {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                ctx.closePath();
                ctx.fill();
            }
            var Piechart = function(options) {
                this.options = options;
                this.canvas = options.canvas;
                this.ctx = this.canvas.getContext("2d");
                this.colors = options.colors;
                this.draw = function() {
                    var total_value = 0;
                    var color_index = 0;
                    for (var categ in this.options.data) {
                        var val = this.options.data[categ];
                        total_value += val;
                    }
                    var start_angle = 3 * Math.PI / 2;
                    for (categ in this.options.data) {
                        val = this.options.data[categ];
                        var slice_angle = 2 * Math.PI * val / total_value;
                        drawPieSlice(this.ctx, this.canvas.width / 2, this.canvas.height / 2, Math.min(this.canvas.width / 2, this.canvas.height / 2), start_angle, start_angle + slice_angle, this.colors[color_index % this.colors.length]);
                        start_angle += slice_angle;
                        color_index++;
                    }
                }
            }
            var myPiechart = new Piechart({
                canvas: myCanvas,
                data: myVinyls,
                colors: [value.color1, value.color2, "#57d9ff", "#937e88"]
            });
            myPiechart.draw();
            element[0].append(myCanvas);
        }
    }
}]);

function idleLogout() {
    var t;
    window.onload = resetTimer;
    window.onmousemove = resetTimer;
    window.onmousedown = resetTimer; // catches touchscreen presses
    window.onclick = resetTimer; // catches touchpad clicks
    window.onscroll = resetTimer; // catches scrolling with arrow keys
    window.onkeypress = resetTimer;

    function logout() {
        window.location.href = '/home/logout';
    }

    function resetTimer() {
        clearTimeout(t);
        t = setTimeout(logout, 15 * 60000); // time is in milliseconds
    }
}
idleLogout();
function reviewJson(qs, pet, res, id, location, compare, cus_class) {
    var matching = false;
    pet = (typeof pet === 'undefined' || pet === '') ? '---' : pet;
    res = (typeof res === 'undefined' || res === '') ? '---' : res;
    cus_class = (typeof cus_class === 'undefined' || cus_class === '') ? '' : cus_class;
    matching = (pet.toLowerCase()===res.toLowerCase());
    return {
        'qs': qs,
        'pet': pet,
        'res': res,
        'id': id,
        'location': location,
        'compare': compare,
        'class': cus_class,
        'matching': matching,
    };
}
function ValidDate(date) {
    var out = '';
    if (date !== null && date !== '' && typeof date !== 'undefined') {
        var datetime = new Date(date);
        out = datetime.toLocaleDateString('en-US');
    }
    return out;
}

function getcustodyname(w, m, s) {
    var out = "";
    switch (w) {
        case '1':
            out = m;
            break;
        case '2':
            out = s;
            break;
        case '3':
            out = "Both(" + m + ", " + s + ")";
            break;
        default:
            break;
    }
    return out;
}
app.service('sharedProperties', function() {
    var property = false;
    return {
        getProperty: function() {
            // alert("test" + property);
            return property;
        },
        setProperty: function(value) {
            // alert("set" +value);
            property = value;
        }
    };
});