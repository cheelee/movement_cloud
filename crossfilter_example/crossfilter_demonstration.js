// Crossfilter Demonstration
//
// By date, hour, and two other variables
//
"use strict";

// Parse the date.  Assume it is the year 2001.
function parseDate(d) {  // (parseDate is like d3.time.format, but faster)
    return new Date(2001,
        d.substring(0, 2) - 1,
        d.substring(2, 4),
        d.substring(4, 6),
        d.substring(6, 8));
}


// Ensure at least 790px height if running in an iframe (bl.ocks)
// http://bl.ocks.org/mbostock/1093025
d3.select(self.frameElement).transition().duration(500).style("height",
                                                              "790px");

// Get the data
d3.csv(CROSSFILTER_PARAMETERS.data_file, function(error, data_rows) {
    if (error) {
        console.log(error);
    }

    // Set the titles in the report
    document.title = CROSSFILTER_PARAMETERS.report_title;
    report_title.innerHTML = CROSSFILTER_PARAMETERS.report_title;

    // Create the crossfilter
    create_crossfilter(data_rows);
});


function create_crossfilter(data_rows) {
    // Array that holds the currently selected "in-filter" selected records
    var selected = [];

    // Various formatters.
    var formatNumber = d3.format(",d"),
        formatChange = d3.format("+,d"),
        formatDate = d3.time.format("%B %d, %Y"),
        formatDateWithDay = d3.time.format("%a %B %d, %Y"),
        formatTime = d3.time.format("%I:%M %p");

    // A nest operator, for grouping the selected data list.
    var nestByDate = d3.nest()
        .key(function(d) {
            return d3.time.day(d.date);
        });

    // A little coercion, since the CSV is untyped.
    data_rows.forEach(function(d, i) {
        d.index = i;
        d.date = parseDate(d.date);
        d.delay = +d.delay;
        d.distance = +d.distance;
        d.selected = false; // BoE add
    });

    // Create the crossfilter for the relevant dimensions and groups.
    var data_xfilter = crossfilter(data_rows);
    var all = data_xfilter.groupAll();

    // date dimension
    var date = data_xfilter.dimension(function(d) {
        return d.date;
    }); // date dim
    var dates = date.group(d3.time.day); // date group
    dates.groupId = "dates";

    // hour dimension
    var hour = data_xfilter.dimension(function(d) {
        return d.date.getHours() + d.date.getMinutes() / 60;
    }); // hour dim
    var hours = hour.group(Math.floor); // hour group
    hours.groupId = "hours";

    // USER DIMENSION 1
    // delay dimension
    var delay = data_xfilter.dimension(function(d) {
        return d.delay;
    }); // delay dim
    var delays = delay.group(function(d) {
        return Math.floor(d / 10) * 10;
    }); // delay group
    delays.groupId = "delays";

    // USER DIMENSION 2
    // distances dimension
    var distance = data_xfilter.dimension(function(d) {
        return d.distance;
    }); // distance dim
    var distances = distance.group(function(d) {
        return Math.floor(d / 50) * 50;
    }); // distance group
    distances.groupId = "distances";

    
    // Add new day dimension
    var dayNumber = data_xfilter.dimension(function(d) {
        return d.date.getDay();
    });
    var dayNumbers = dayNumber.group(function(d) {
        return d;
    });

    // Date selection radio buttons
    // Day selection variables
    var days = {
            mon: {
                state: true,
                name: "days",
                text: "Monday",
                type: "workDay",
                dayNumber: 1,
                order: 0
            },
            tue: {
                state: true,
                name: "days",
                text: "Tuesday",
                type: "workDay",
                dayNumber: 2,
                order: 1
            },
            wed: {
                state: true,
                name: "days",
                text: "Wednesday",
                type: "workDay",
                dayNumber: 3,
                order: 2
            },
            thu: {
                state: true,
                name: "days",
                text: "Thursday",
                type: "workDay",
                dayNumber: 4,
                order: 3
            },
            fri: {
                state: true,
                name: "days",
                text: "Friday",
                type: "workDay",
                dayNumber: 5,
                order: 4
            },
            sat: {
                state: true,
                name: "days",
                text: "Saturday",
                type: "weekendDay",
                dayNumber: 6,
                order: 5
            },
            sun: {
                state: true,
                name: "days",
                text: "Sunday",
                type: "weekendDay",
                dayNumber: 0,
                order: 6
            }
        }

    var workDays = Object.keys(days).filter(function(d) {
            if (days[d].type == "workDay") return true;
        }).map(function(d) {return d;})

    var weekendDays = Object.keys(days).filter(function(d) {
            if (days[d].type == "weekendDay") return true;
        }).map(function(d) {return d;})

    var dayNumbers = (function() {
        var obj = {};
        Object.keys(days).forEach(function(d) {
            var key = days[d].dayNumber;
            var value = d;
            obj[key] = value
        });
        return obj;
    })()

    var dayTypes = {
        weekendDays: {
            state: false,
            name: "dayType",
            text: "Weekend Days",
            order: 2
        },
        allDays: {
            state: true,
            name: "dayType",
            text: "All Days",
            order: 0
        },
        workDays: {
            state: false,
            name: "dayType",
            text: "Work Days",
            order: 1
        },
    };

    /*
    // BoE: uncomment this to see the day related variables
    console.log("workDays", workDays)
    console.log("weekendDays", weekendDays)
    console.log("dayNumbers", dayNumbers)
    */

    // BoE: prep add radio buttons and checkbox data
    var radioData = Object.keys(dayTypes).map(function(d) {
        dayTypes[d].value = d;
        return dayTypes[d];
    }).sort(function(a, b) {
        return (a.order > b.order ? 1 : (a.order < b.order) ? -1 : 0)
    })
    var checkboxData = Object.keys(days).map(function(d) {
        days[d].value = d;
        return days[d];
    }).sort(function(a, b) {
        return (a.order > b.order ? 1 : (a.order < b.order) ? -1 : 0)
    })

    // Create radio buttons
    // http://stackoverflow.com/questions/19302318/
    var fieldset = d3.select("#daySelectionDiv").append("fieldset")
    fieldset.append("legend").text("Day of Week");

    // Add spans to hold radio buttons
    var radioSpan = fieldset.selectAll(".radio")
        .data(radioData)
        .enter().append("span")
        .attr("class", "radio")
        .style("margin-right", function(d) {
            return d.last == true ? "30px" : "0px"
        });

    // Add radio button to each span
    radioSpan.append("input")
        .attr({
            type: "radio",
            name: function(d) {
                return d.name
            },
        })
        .property({
            checked: function(d) {
                return d.state
            },
            value: function(d) {
                return d.value
            }
        });

    // Add radio button label
    radioSpan.append("label")
        .text(function(d) {
            return d.text
        });

    // Add spans to hold checkboxes
    var checkboxSpan = fieldset.selectAll(".checkbox")
        .data(checkboxData)
        .enter().append("span")
        .attr("class", "checkbox")
    //.style("margin-right", "10px")

    // Add checkbox to each span
    checkboxSpan
        .append("input")
        //.attr("type", "checkbox")
        //.attr("name", function(d) { return d.name })
        .attr({
            type: "checkbox",
            name: function(d) {
                return d.name
            }
        })
        //.property("value", function(d) { return d.value })
        //.property("checked", function(d) { return d.state })
        .property({
            value: function(d) {
                return d.value
            },
            checked: function(d) {
                return d.state
            }
        })

    // Add checkbox label
    checkboxSpan
        .append("label")
        .text(function(d) {
            return d.text
        })


    // Add radio button event handler
    d3.selectAll("input[type=radio][name=dayType]")
        .on("change", function() {
            var elem = d3.select(this);
            var dayType = elem.property("value");
            switch (dayType) {
                case "allDays":
                case "workDays":
                    workDays.forEach(function(day) {
                        days[day].state = true;
                    })
                    weekendDays.forEach(function(day) {
                        days[day].state = false;
                    })
                    break;
                case "weekendDays":
                    workDays.forEach(function(day) {
                        days[day].state = false;
                    })
                    weekendDays.forEach(function(day) {
                        days[day].state = true;
                    })
                    break;
            }

            updateDaySelection();
            renderAll();
        });

    // Init checkboxes and add event handler
    d3.selectAll("input[type=checkbox][name=days]")
        .property("checked", function(d, i, a) {
            var elem = d3.select(this);
            var day = elem.property("value");
            //console.log("elem", elem, "day", day, days[day])
            return days[day].state;
        })
        .on("change", function() {
            var elem = d3.select(this);
            var checked = elem.property("checked");
            var day = elem.property("value");
            days[day].state = checked;

            updateDaySelection();
            renderAll();
        })


    // Update the state of the day selection radio buttons and checkboxes
    // (called after "change" events from those elements)
    function updateDaySelection() {
        // BoE: update checkboxes
        d3.selectAll("input[type=checkbox][name=days]")
            .property("checked", function(d, i, a) {
                var elem = d3.select(this);
                var day = elem.property("value");
                return days[day].state;
            })

        // BoE: process selected days
        var workDayCount = workDays.reduce(function(p, c) {
            return (days[c].state) ? p + 1 : p
        }, 0);
        var weekendDayCount = weekendDays.reduce(function(p, c) {
            return (days[c].state) ? p + 1 : p
        }, 0);

        // BoE: determine day type
        var dayType;
        if ((workDayCount + weekendDayCount) == 7) dayType = "allDays"
        else if (workDayCount == 5 && weekendDayCount == 0) dayType = "workDays"
        else if (workDayCount == 0 && weekendDayCount == 2) dayType = "weekendDays"

        // BoE: set the selected radio button
        d3.selectAll("input[type=radio][value=" + dayType + "]").property("checked", true);

        // Create/update day number filter
        dayNumber.filter(function(d) {
            return days[dayNumbers[d]].state;
        })
    }    
                                     
    // DATASET VIEW
    // Create canvas element that holds one record per canvas pixel
    var canvasWidth = d3.select("body").property("clientWidth") - 10,
        canvasHeight = Math.ceil(data_xfilter.size() / canvasWidth),
        canvas,
        ctx,
        canvasDiv,
        currentLabel;

    selected = date.top(Infinity);

    // Get reference to canvas div
    canvasDiv = d3.select("#canvasDiv")
        .style("padding", "2px")
        .style("width", "100%")
        .style("margin-bottom", "20px")

    // Add div to hold description of canvas content
    canvasDiv
        .append("div")
        .attr("class", "title")
        .style("margin-bottom", "20px")
        .style("margin-bottom", "10px")
        .html("<span>Dataset View – Each of the " + formatNumber(data_xfilter.size()) + " pixels represents a data record (White = Selected, Black = Not Selected, Red = Out of Bounds)</span><br><span style='font-style: italic; font-size: 14px; color: red;'>Move the mouse over the canvas below to see individual data records</span>");

    // Add canvas element and mouse handler
    canvas = canvasDiv
        .append("canvas")
        .attr("width", canvasWidth)
        .attr("height", canvasHeight)
        .style("width", canvasWidth + "px")
        .style("height", canvasHeight + "px")
        .style("border", "1px solid lightgray")
        .style("display", "block")
        .style("cursor", "crosshair")
        .on("mousemove", function() {
            var mouse = d3.mouse(canvas.node()),
                x = Math.round(mouse[0]),
                y = Math.round(mouse[1]),
                index = y * canvasWidth + x;

            // BoE: event handler delivers mouse mousemove events outside the canvas sometimes (don't know why);
            //     therefore, ensure that only valid x and y values are processed
            if (x < 0 || x > canvasWidth - 1 || y < 0 || y > canvasHeight - 1) {
                currentLabel.html("&nbsp;");
                return;
            }
            // then check if the index is out of bounds (the right part of the last row is NOT part of the dataset)        
            if (index > data_xfilter.size() - 1) {
                currentLabel.html("&nbsp;");
                return;
            }

            var item = data_rows[index],
                dateText = formatDateWithDay(item.date),
                timeText = formatTime(item.date);

            var labelText = labelText = "Selected: " + item.selected + ", Date: " + dateText + " " + timeText + ", Delay: ";
            labelText += item.delay + ", Distance: " + item.distance + ", Route: " + item.origin + "-->" + item.destination + " (idx: " + index + ")";
            currentLabel
                .attr("class", function(d) {
                    return item.selected ? "selected" : "notSelected"
                })
                .text(labelText);
        })
        .on("mouseleave", function() {
            currentLabel.html("&nbsp;");
        })

    // Create label for mousemove
    currentLabel = canvasDiv.append("label").html("&nbsp;");

    // Get context to canvas elem
    ctx = canvas.node().getContext('2d');

    var delay_min = d3.min(data_rows, function(d) { return +d.delay});
    var delay_max = d3.max(data_rows, function(d) { return +d.delay});

    var distance_min = d3.min(data_rows, function(d) { return +d.distance});
    var distance_max = d3.max(data_rows, function(d) { return +d.distance});

    // BoE: this code defines the four charts in an array
    var charts = [

        barChart()
        .dimension(hour)
        .group(hours)
        .x(d3.scale.linear()
            .domain([0, 24])
            .rangeRound([0, 10 * 24])) // 10 pixels per bar, 240 pixels total
        .filter([8, 18]), // added by BoE

        barChart()
        .dimension(delay)
        .group(delays)
        .x(d3.scale.linear()
            .domain([delay_min, delay_max])
            .rangeRound([0, 10 * 21])), // 21 delay groups, 210 pixels total

        barChart()
        .dimension(distance)
        .group(distances)
        .x(d3.scale.linear()
            .domain([distance_min, distance_max])
            .rangeRound([0, 10 * 40])), // 40 distance groups

        barChart()
        .dimension(date)
        .group(dates)
        .round(d3.time.day.round) // ensures whole days
        .x(d3.time.scale()
            .domain([new Date(2001, 0, 1), new Date(2002, 0, 1)]) // full year
            .rangeRound([0, 10 * 90]))
        // set an arbitrary filter from Feb to Mar to start as a demonstration
        .filter([new Date(2001, 1, 1), new Date(2001, 2, 1)]) 
    ];


    // Given our array of charts, which we assume are in the same order as the
    // .chart elements in the DOM, bind the charts to the DOM and render them.
    // We also listen to the chart's brush events to update the display.
    var chart = d3.selectAll(".chart")
        // The charts array defined above are provided as data to
        // the d3 selection of ".charts"
        .data(charts)
        .each(function(chart) {
            chart
                .on("brush", function() {
                    renderAll();
                })
                .on("brushend", function() {
                    renderAll();
                });
        });

    // Render the initial lists
    var list = d3.selectAll(".list")
        .data([resultsList]);

    // Render the total
    d3.selectAll("#total")
        .text(formatNumber(data_xfilter.size()));

    // Initial render
    renderAll();

    // BoE debug...
    var sum = dates.all().reduce(function(p, c, i, a) {
        return {
            value: p.value + c.value
        };
    })
    //console.log("sum", sum.value);

    // BoE debug...
    var groups = [dates, hours, delays, distances]
    groups.forEach(function(group) {
        var grp = group.group;
        var sum = group.all().reduce(function(p, c, i, a) {
            return {
                value: p.value + c.value
            }
        })
        //console.log("sum: ", sum, "grp", grp)
    })

    // Renders the specified chart or list.
    function render(method) {
        // "method" is the "d" value of data binding to chart above,
        // which happens to be the chart function from barChart
        d3.select(this).call(method);
    }

    // Whenever the brush moves, re-rendering everything.
    function renderAll() {
        // BoE: uncomment the next lines to see the what's being rendered
        //console.log("renderAll", chart[0].length, list[0].length, all.value())
        //chart.each(function(d, i) { console.log("this", this, "d", d, "i", i) })

        // render is called with this set to div and d set to the
        // chart function from barChart
        chart.each(render); 
        list.each(render);
        d3.select("#active").text(formatNumber(all.value()));

        // Update the "selected" array, which holds
        // the currently selected (in-filter) items
        selected = date.top(Infinity);

        // Set the selected status in the data source ("data_rows")
        data_rows.forEach(function(d) {
            d.selected = false;
        }); // first clear all
        selected.forEach(function(d) {
            data_rows[d.index].selected = true;
        }) // then set some 

        // Clear canvas
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Add red out of bounds pixels 
        var xSpan = (canvasWidth * canvasHeight) % data_xfilter.size();
        var x = canvasWidth - xSpan;
        var y = canvasHeight - 1;
        ctx.fillStyle = "rgb(255, 0, 0)";
        ctx.fillRect(x, y, xSpan, 1);


        // Add: draw white pixel for each active element
        ctx.fillStyle = "rgb(255,255,255)";
        selected.forEach(function(d) {
            var x = d.index % canvasWidth;
            var y = Math.floor(d.index / canvasWidth)
            ctx.fillRect(x, y, 1, 1);
        })
    }

    


    // This (window.resetAll) isn't used, therefore
    //    repurposed this to reset all filters by JavaScript
    //    triggered by a new "a" tag in the DOM
    window.resetAll = function() {
        var filters = [null, null, null, null];
        filters.forEach(function(d, i) {
            charts[i].filter(d);
        });
        Object.keys(days).forEach(function(d) {
            days[d].state = true
        });
        updateDaySelection();
        renderAll();
    };

    // Resets the filter for a particular dimension
    window.reset = function(i) {
        charts[i].filter(null);
        renderAll();
    };

    // Results list
    function resultsList(div) {

        var resultsByDate = nestByDate.entries(date.top(10));

        div.each(function() {
            var date = d3.select(this).selectAll(".date")
                .data(resultsByDate, function(d) {
                    return d.key;
                });

            date.enter().append("div")
                .attr("class", "date")
                .append("div")
                .attr("class", "day")
                .text(function(d) {
                    return formatDate(d.values[0].date);
                });

            date.exit().remove();

            var results_row = date.order().selectAll(".results_list_row")
                .data(function(d) {
                    return d.values;
                }, function(d) {
                    return d.index;
                });

            var results_row_all = results_row.enter().append("div")
                .attr("class", "results_list_row");

            results_row_all.append("div")
                .attr("class", "time")
                .text(function(d) {
                    return formatTime(d.date);
                });

            results_row_all.append("div")
                .attr("class", "origin")
                .text(function(d) {
                    return d.origin;
                });

            results_row_all.append("div")
                .attr("class", "destination")
                .text(function(d) {
                    return d.destination;
                });

            results_row_all.append("div")
                .attr("class", "distance")
                .text(function(d) {
                    return formatNumber(d.distance) + " mi.";
                });

            results_row_all.append("div")
                .attr("class", "delay")
                .classed("early", function(d) {
                    return d.delay < 0;
                })
                .text(function(d) {
                    return formatChange(d.delay) + " min.";
                });

            results_row.exit().remove();

            results_row.order();
        });
    }
}
