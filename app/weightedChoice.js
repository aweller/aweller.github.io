angular.module('choiceApp', [])
angular.module('choiceApp')
    .controller('weightedChoiceController', function($scope, $timeout) {

        $scope.$on('highchart:requestResetX', function(event, msg) {
            $scope.$broadcast('highchart:resetX')
        })

        $scope.$on('highchart:requestNewX', function(event, msg) {
            $scope.$broadcast('highchart:newX', msg)
        })
    });


angular.module('choiceApp')
    .directive('choiceLines', function($window, $timeout, $compile) {
        return {
            restrict: 'E',
            template: [
                '<div style="width: 100%, height=1000px, margin: 0 auto"></div>',
                '<button type="button" class="btn btn-default" ng-click="start()">Start</button>',
                '<button type="button" class="btn btn-default" ng-click="stop()">Stop</button>',
            ].join(''),
            link: function choiceLinesLink(scope, elem, attrs) {

                scope.spec = { 0: 0.6, 1: 0.3, 2: 0.1 }
                scope.series = [createSeries('Common', '#18bc9c'), createSeries('Medium', '#2c3e50'), createSeries('Rare', '#e74c3c')]
                scope.offset = 0 // Series below this dont get updated anymore
                scope.maxDraws = 100 // stop after this number of draws
                scope.frequency = 1 // ms between draws
                scope.counter = 1 // current X

                function build() {

                    scope.highchartsConfig = {
                        options: {
                            chart: {
                                spacingTop: 30,
                                spacingRight: 30,
                                type: 'spline',
                            },
                            legend: {
                                enabled:false
                            },
                            // legend: {
                            //     layout: 'vertical',
                            //     align: 'right',
                            //     verticalAlign: 'top',
                            //     x: -10,
                            //     y: 10,
                            //     floating: true,
                            //     borderWidth: 1,
                            //     backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
                            //     shadow: true
                            // },
                            plotOptions: {
                                series: {
                                    marker: {
                                        radius: 0
                                    }
                                }
                            }
                        },
                        series: scope.series,
                        yAxis: [{
                            title: {
                                text: 'Ratios'
                            },
                            min: 0,
                            max: 1,
                            minRange: 0.1,
                            // plotLines: [{
                            //     color: '#18bc9c',
                            //     width: 2,
                            //     value: 0.6 // Need to set this probably as a var.
                            // }, {
                            //     color: '#2c3e50',
                            //     width: 2,
                            //     value: 0.3 // Need to set this probably as a var.
                            // }, {
                            //     color: '#e74c3c',
                            //     width: 2,
                            //     value: 0.1 // Need to set this probably as a var.
                            // }]
                        }],
                        xAxis: { // Primary yAxis
                            title: {
                                text: 'Random draws'
                            },
                            minorTickInterval: "auto",
                            minorTickColor: '#f8f8f8',
                            min: 0,
                            max: scope.maxDraws
                        },
                        title: {
                            text: ''
                        },
                        loading: false,

                    };


                    console.log('Adding lines', scope.series)
                    elem.append($compile('<highchart id="chart1" config="highchartsConfig" chart="instance"></highchart>')(scope));
                    angular.element($window).bind('resize', setSize);

                    scope.defaultMin = scope.highchartsConfig.xAxis.currentMin
                    scope.defaultMax = scope.highchartsConfig.xAxis.currentMax

                    $timeout(function() {
                        setSize();
                    }, 10);
                }

                build()

                function weightedRand() {
                    var i, sum = 0,
                        r = Math.random();
                    for (i in scope.spec) {
                        sum += scope.spec[i];
                        if (r <= sum) return parseInt(i);
                    }
                }

                function appendSeries(currX) {
                    var choice = weightedRand()
                    choice += scope.offset
                    for (i = scope.offset; i < scope.series.length; i++) {
                        var series = scope.series[i]
                        if (i == choice) {
                            series.count++
                        }
                        series.data.push({ x: currX, y: series.count / currX })
                    }
                    scope.$apply()
                }

                function createSeries(name, color) {
                    return {
                        name: name,
                        color: color,
                        data: [{ x: 0, y: 0 }],
                        count: 0
                    }
                }

                scope.start = function() {
                    console.log('Start')
                    scope.ticker = setInterval(function() {
                        appendSeries(scope.counter)
                        scope.counter++
                        if (scope.counter > scope.maxDraws) {
                            scope.stop()
                            scope.reset()
                            scope.start()
                        }
                    }, scope.frequency);
                }

                scope.stop = function() {
                    console.log('Stop')
                    clearInterval(scope.ticker);
                }

                scope.reset = function() {
                    scope.counter = 1
                    scope.offset += 3
                    scope.series.push(createSeries('Common', '#18bc9c'))
                    scope.series.push(createSeries('Medium', '#2c3e50'))
                    scope.series.push(createSeries('Rare', '#e74c3c'))
                        // console.log(scope.series)
                }

                function setSize() {
                    scope.instance.setSize(angular.element(elem.parent())[0].offsetWidth, 300);
                }
            }
        };
    });
