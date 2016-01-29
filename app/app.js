angular.module('cv', [
    'ngRoute',
    'ngAnimate',
    'ui.bootstrap'
])

.config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/skills', {
        templateUrl: 'app/templates/skills.html',
        controller: 'MainController'
    });
    $routeProvider.when('/contact', {
        templateUrl: 'app/templates/contact.html',
        controller: 'MainController'
    });
    $routeProvider.otherwise({
        redirectTo: '/skills'
    });
}])

////////////////////////////////////////////////////////////////////
angular.module('cv')
    .controller('MainController', ['$scope', '$location',

        function($scope, $location) {

            $scope.isActive = function(viewLocation) {
                return viewLocation === $location.path();
            };

            $scope.hello = 'HelloWorld!'

        }
    ]);

////////////////////////////////////////////////////////////////////

angular.module('cv')
    .directive('skillTree', function() {

        function SkillTreeDirective(scope, el, attr, ctrl) {


            /////////////////////////
            /// Colors

            // #5CB85C // green
            // #5BC0DE // blue
            // #9bd8eb / light blue
            // #F0AD4E // yellow
            // #f6ce95 // light yellow
            // #DF691A // orange
            // #D9534F // red

            // default values (ugly)
            // var minColor = "hsl(152,80%,80%)"
            // var maxColor = "hsl(228,30%,40%)"

            // superhero bootstrap
            var minColor = "hsl(209.2,30.1%,24.1%)" // dark blue (superhero background color)
            var black = "#000000"
                // var maxColor = "hsl(210,16.1%,36.5%)" // darker
            var maxColor = "hsl(0,0%,92.2%)" // lighter

            var color = d3.scale.linear()
                .domain([-1, 5])
                .range([minColor, maxColor])
                .interpolate(d3.interpolateHcl);

            var backgroundColor = "rgb(43,62,80)"

            var skillDomains = ['flare', "Domain knowledge", "Coding", "Data Analysis"]
            var skillDomainMaxColors = {
                'flare': "#2b3e50",
                "Domain knowledge": "#5BC0DE",
                "Coding": "#F0AD4E",
                "Data Analysis": "#D9534F",
            };

            var skillDomainColorRanges = {};
            skillDomains.forEach(function(domain) {
                skillDomainColorRanges[domain] = d3.scale.linear()
                    .domain([-1, 5])
                    .range([minColor, skillDomainMaxColors[domain]])
                    .interpolate(d3.interpolateHcl);
            })
            console.log('skillDomainColorRanges', skillDomainColorRanges)

            /////////////////////////

            var margin = 20,
                diameter = angular.element(el.parent())[0].offsetWidth;
            diameter = diameter * (5 / 6) * (2 / 3) // adapt to bootstrap grid slotß

            var pack = d3.layout.pack()
                .padding(2)
                .size([diameter - margin, diameter - margin])
                .value(function(d) {
                    return d.size;
                })

            var svg = d3.select("#tree").append("svg")
                .attr("width", diameter)
                .attr("height", diameter)
                .append("g")
                .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

            d3.json(ctrl.skillFilePath, function(error, root) {
                if (error) throw error;

                var focus = root,
                    nodes = pack.nodes(root),
                    view;


                function nodeMouseIn() {
                    // console.log('nodeMouseIn!', [this, this.__data__])
                    var skill = this.__data__.name
                    var nodePath = getNodePath(this.__data__)
                    updateBreadcrumbs(nodePath)

                    ctrl.state.currentSkill = skill
                    ctrl.state.currentPath = nodePath.map(function(node) {
                        return node.name
                    })
                    ctrl.updateCurrentWorkplaces(skill)
                    ctrl.updateCurrentProjects(skill)
                    scope.$apply();
                }

                var _calculateFill = function(d) {
                    var skillDomain = getNodePath(d)[0]
                    if (skillDomain == undefined) {
                        skillDomain = 'flare'
                        return 'rgb(67, 89, 102)'
                    } else {
                        skillDomain = skillDomain.name
                        var scale = skillDomainColorRanges[skillDomain]
                            // console.log(skillDomainColorRanges, d, skillDomain, scale)
                        return scale(d.depth)
                    }
                }

                var circle = svg.selectAll("circle")
                    .data(nodes)
                    .enter().append("circle")
                    .attr("name", function(d) {
                        return d.name
                    })
                    .attr("data", function(d) {
                        return d
                    })
                    .attr("class", function(d) {
                        return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
                    })
                    // .style("fill", function(d) {
                    //     return d.children ? color(d.depth) : null;
                    // })
                    .style("fill", _calculateFill)
                    .on("click", function(d) {
                        if (focus !== d) zoom(d), d3.event.stopPropagation();
                    })
                    .on("mouseenter", nodeMouseIn);


                var text = svg.selectAll("text")
                    .data(nodes)
                    .enter().append("text")
                    .attr("class", "label")
                    .style("fill-opacity", function(d) {
                        return d.parent === root ? 1 : 0;
                    })
                    .style("display", function(d) {
                        var display = d.parent === root ? "inline" : "none"
                        return display;
                    })
                    .text(function(d) {
                        return d.name;
                    });


                var node = svg.selectAll("circle,text");

                d3.select("body")
                    .style("background", backgroundColor)
                    .on("click", function() {
                        zoom(root);
                    });

                zoomTo([root.x, root.y, root.r * 2 + margin]);

                function zoom(d) {
                    // avoid zooming to tip of branch
                    if (!d.children) {
                        d = d.parent
                    }


                    var focus0 = focus;
                    focus = d;

                    var transition = d3.transition()
                        .duration(d3.event.altKey ? 7500 : 750)
                        .tween("zoom", function(d) {
                            var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                            return function(t) {
                                zoomTo(i(t));
                            };
                        });

                    transition.selectAll("text")
                        .filter(function(d) {
                            return d.parent === focus || this.style.display === "inline";
                        })
                        .style("fill-opacity", function(d) {
                            var opacity = (d.parent === focus) || (d.name == focus.name) ? 1 : 0
                            return opacity;
                        })
                        .each("start", function(d) {
                            if (d.parent === focus) this.style.display = "inline";
                        })
                        .each("end", function(d) {
                            if (d.parent !== focus) this.style.display = "none";
                        });
                }

                function zoomTo(v) {
                    var k = diameter / v[2];
                    view = v;
                    node.attr("transform", function(d) {
                        return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
                    });
                    circle.attr("r", function(d) {
                        return d.r * k;
                    });
                }

                ////////////////////////////////////////////////////////////
                /// Breadcrumbs v2 from
                /// http://bl.ocks.org/kerryrodden/7090426

                function getNodePath(node) {
                    for (var path = [], n = node; n.parent;) path.unshift(n), n = n.parent;
                    return path
                }

                // Breadcrumb dimensions: width, height, spacing, width of tip/tail.
                var b = {
                    w: 175,
                    h: 30,
                    s: 3,
                    t: 10
                };

                function initializeBreadcrumbTrail() {
                    // Add the svg area.
                    var trail = d3.select("#breadcrumbs").append("svg:svg")
                        .attr("width", 750)
                        .attr("height", 50)
                        .attr("id", "trail");
                }
                initializeBreadcrumbTrail()

                // Generate a string that describes the points of a breadcrumb polygon.
                function _breadcrumbPoints(d, i) {
                    // var letters = d.name.length
                    // var polyWidth = letters * 15
                    var polyWidth = b.w

                    var points = [];
                    points.push("0,0");
                    points.push(polyWidth + ",0");
                    points.push(polyWidth + b.t + "," + (b.h / 2));
                    points.push(polyWidth + "," + b.h);
                    points.push("0," + b.h);
                    if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
                        points.push(b.t + "," + (b.h / 2));
                    }
                    return points.join(" ");
                }

                // Update the breadcrumb trail to show the current sequence.
                function updateBreadcrumbs(nodeArray) {

                    // Data join; key function combines name and depth (= position in sequence).
                    var g = d3.select("#trail")
                        .selectAll("g")
                        .data(nodeArray, function(d) {
                            return d.name + d.depth;
                        });

                    // Add breadcrumb and label for entering nodes.
                    var entering = g.enter()
                        .append("svg:g")

                    entering.append("svg:polygon")
                        .transition()
                        .duration(250)
                        .attr("points", _breadcrumbPoints)
                        .style("fill", _calculateFill)
                        // .style("fill", function(d) {
                        //     // return colors[d.name];
                        //     return 'white'
                        // });


                    entering.append("svg:text")
                        .attr("x", (b.w + b.t) / 2)
                        .attr("y", b.h / 2)
                        .attr("dy", "0.35em")
                        .attr("text-anchor", "middle")
                        .text(function(d) {
                            return d.name;
                        });

                    // Set position for entering and updating nodes.
                    g.attr("transform", function(d, i) {
                        return "translate(" + i * (b.w + b.s) + ", 0)";
                    });

                    // Remove exiting nodes.
                    g.exit().remove();

                    // Make the breadcrumb trail visible, if it's hidden.
                    d3.select("#trail")
                        .style("visibility", "");
                }
            });

            d3.select(self.frameElement).style("height", diameter + "px");

        }

        return {
            link: SkillTreeDirective,
            templateUrl: 'app/templates/skill_tree.html',
            controllerAs: 'ctrl', // allow referencing the controller from the directive fn 
            bindToController: true, // bind incoming scope to controller (i.e. that.x instead of scope.x)
            scope: {},
            controller: ['$scope', '$http', function($scope, $http) {

                var that = this

                $scope.hello = 'The skillTree controller!'
                that.skillFilePath = "app/data/skills.json"
                that.workplaces = ['ONT', 'COURSE', 'LIFE', 'PHD']
                that.prettyWorkplaces = {
                    'ONT': ['2014-2016', 'Oxford Nanopore Technologies', 'Data Scientist'],
                    'COURSE': ['2012-2014', 'various', 'Python course instructor'],
                    'LIFE': ['2013-2014', 'Life Technologies', 'Bioinformatics Scientist'],
                    'PHD': ['2007-2013', 'Max Planck Institute Tuebingen', 'Computational Biology PhD']
                }

                that.cv_data = {}
                that.currentWorkplaces = []
                that.currentProjects = []

                that.state = {};
                that.state.currentSkill = 'None'
                that.state.currentPath = 'None'
                that.state.currentProjects = []

                cv_url = "http://aweller.github.io/app/data/cv.json"
                $http({
                    method: 'get',
                    url: cv_url
                }).then(
                    function(response) {
                        console.log('Got data:', response)
                        that.cv_data = response.data
                    },
                    function(msg, code) {
                        console.error(msg, code)
                    });

                that.updateCurrentWorkplaces = function(skill) {
                    that.currentWorkplaces = that.workplaces.filter(function(place) {
                        if (that.cv_data[that.state.currentSkill] == undefined) {
                            return false
                        } else {
                            return that.cv_data[that.state.currentSkill][place] != null
                        }
                    })
                }

                that.updateCurrentProjects = function(skill) {
                    var projects = []
                    that.workplaces.forEach(function(place) {
                        if (that.cv_data[skill] != undefined) {
                            if (that.cv_data[skill][place] != undefined) {
                                that.cv_data[skill][place].forEach(function(project) {
                                    projects.push(project)
                                })
                            }
                        }
                    })
                    that.state.currentProjects = projects
                }
            }]
        }
    });
