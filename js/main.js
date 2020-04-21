//Begin a eself-executing anonymous function to move to local scope
(function(){

//Begin Global variables
var attrArray = ["Total Tasks", "Tasks - COLO", "Tasks - ROW",
				"Tasks - NON-CAPITAL", "Tasks Assigned Over Month","Tasks Closed Out Over Month"]; //list of attributes from csv data file

//Attribute to be siplayed on the bar chart(Fields from csv data file)
var expressed = attrArray[0];
//End Global variables


//Chart frame dimensions
var chartWidth = window.innerWidth * 0.42,
	chartHeight = 503,
	leftPadding = 35,
	rightPadding = 5,
	topBottomPadding =45,
	innerWidth = chartWidth - leftPadding - rightPadding,
	innerHeight = chartHeight - topBottomPadding,
	translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
	.range([1, chartHeight])
	.domain([322,0]);



//Begin script when window loads
window.onload = setMap();


//Begine setMap function - (choropleth)
function setMap(){
	//map frame dimensions
	var width = window.innerWidth * 0.534,
        height = 615;


	//creating svg container for the map
	var map = d3.select("body")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height)

	//create Albers equal area conic projection centered on USA

	var projection = d3.geoAlbersUsa()
		.scale(950)
		.translate([width / 2, height /2])

	var path = d3.geoPath()
        .projection(projection);

/* 	 var projection = d3.geoAlbers()
        .center([-1, 24.6])
        .rotate([96.53, -15.56, 0])
        .parallels([18.5, 33.18])
        .scale(780) */
      /*   .translate([width / 2, height /2]); */
	// Define a geoPath



	//use Promises to parallelize asynchronous data loading
	var promises = [];
    promises.push(d3.csv("data/ROW_WORKFLOW.csv")); //loading the csv data file or the attributes file
    promises.push(d3.json("data/States.topojson")); //loading the special data file (States)
    Promise.all(promises).then(callback);

	function callback(data, csvData, states){
		csvData = data[0];
		states = data[1];

		//Translate USStates back to JSON and adding US States to map
		var usStates = topojson.feature(states, states.objects.States).features;
		//This part of the script came here after the Join Data function was defined.
		usStates = joinData(usStates, csvData);

		//Create the color scale. This part of the script came here after the COlor Scale function was defined,
		var colorScale = makeColorScale(csvData);

		//Add enumeration units to the map. This part of the script came here after the enumeration function was defined.
		setEnumerationUnits(usStates, map, path, colorScale);

		//Add coordinated visualization to the map.This part of the script came her after the SetChart function was defined
		setChart(csvData, colorScale);
		// Calling the dropdown from callback function
		createDropdown(csvData)
	};
};
//End of function setMap - choropleth



//Begine function Joining CSV attributes to the USStates special datasest
function joinData(usStates, csvData){
	//loop through csv to assign each set of csv attribute values to geojson region
	for (var i=0; i<csvData.length; i++){
		var csvstates = csvData[i]; //the current region
		var csvKey = csvstates.NAME; //the CSV primary key

		//loop through geojson regions to find correct region
		for (var a=0; a<usStates.length; a++){

			var geojsonProps = usStates[a].properties; //the current region geojson properties
			var geojsonKey = geojsonProps.NAME; //the geojson primary key

			//where primary keys match, transfer csv data to geojson properties object
			if (geojsonKey == csvKey){

				//assign all attributes and values
				attrArray.forEach(function(attr){
					var val = parseFloat(csvstates[attr]); //get csv attribute value
					geojsonProps[attr] = val; //assign attribute and value to geojson properties
				});
			};
		};
	};

	return usStates;
};
//End function Joining CSV attributes to the USStates special datasest



//Begine function to create color scale generator
function makeColorScale(data){
	//Picked colors from colorbrwer
	var colorClasses = [
		"#feebe2",
		"#f768a1",
		"#fa9fb5",
		"#d9f0a3",
		"#31a354",
		"#006837"
		];

	//create color scale generator
	var colorScale = d3.scaleThreshold()
		.range(colorClasses);

	//build array of all values of the expressed attribute
	var domainArray = [];
	for (var i=0; i<data.length; i++){
		var val = parseFloat(data[i][expressed]);
		domainArray.push(val);

	};

	//cluster data using ckmeans clustering algorithm to create natural breaks. This is why we have the Statistic library linked in index html file
	var clusters = ss.ckmeans(domainArray, 8);
	//reset domain array to cluster minimums
	domainArray = clusters.map(function(d){
		return d3.min(d);
	});
	//remove first value from domain array to create class breakpoints
	domainArray.shift();

	//assign array of last 4 cluster minimums as domain
	colorScale.domain(domainArray);

	return colorScale;

};
//End function to create color scale generator


// Begine function Setting up the Enumeration.
function setEnumerationUnits(usStates, map, path, colorScale){

	//add USStates to map
	var allstates = map.selectAll(".allstates")
        .data(usStates)
        .enter()
        .append("path")
        .attr("class", function(d){
             return "allstates "+ d.properties.NAME ;
		})
        .attr("d", path)
		.style("fill", function(d){
			return choropleth(d.properties, colorScale);
		})
	// Added at the later stage when highlight and dehighlight were defined
		.on("mouseover", function(d){

            highlight(d.properties);
        })
		.on("mouseout", function(d){
			dehighlight(d.properties);
        })
		.on("mousemove", moveLabel);
		// Add style description
	var desc = allstates.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');

};
// End function Setting up the Enumeration.


//Begine function to test for data value and return color
function choropleth(props, colorScale){
	//make sure attribute value is a number
	var val = parseFloat(props[expressed]);
	//if attribute value exists, assign a color; otherwise assign gray
	if (typeof val == 'number' && !isNaN(val)){
		return colorScale(val);
	} else {
		return "blue";
	};

};
//End function to test for data value and return color


//Begine function to create coordinated bar chart
function setChart(csvData, colorScale){

	//create a second svg element to hold the bar chart
	var chart = d3.select("body")
		.append("svg")
		.attr("width", chartWidth)
		.attr("height", chartHeight)
		.attr("class", "chart");

	//create a rectangle for chart background fill
	var chartBackground = chart.append("rect")
		.attr("class", "chartBackground")
		.attr("width", innerWidth)
		.attr("height", innerHeight)
		.attr("transform", translate);

	   //create frame for chart border
	var chartFrame = chart.append("rect")
		.attr("class", "chartFrame")
		.attr("width", innerWidth)
		.attr("height", innerHeight)
		.attr("transform", translate);


	//set bars for each state
	var bars = chart.selectAll(".bar")
		.data(csvData)
		.enter()
		.append("rect")
		.sort(function(a, b){
			return parseFloat(b[expressed])-parseFloat(a[expressed]);
		})
		.attr("class", function(d){
			return "bar " + d.NAME;
		})

	// Added at the later stage when highlight and dehighlight functions were defined
		.attr("width", innerWidth / csvData.length-1)
		.on("mouseover", highlight)
		.on("mouseout", dehighlight)
		.on("mousemove", moveLabel);
		//Adding style to the descriptor.
	var desc = bars.append("desc")
		.text('{"stroke": "none", "stroke-width": "0px"}');


	//create a text element for the chart title
	var chartTitle = chart.append("text")
		.attr("x", 280)
		.attr("y", 45)
		.attr("class", "chartTitle")
		.text(expressed)

	//Creating a vertical axis generator
	var yAxis = d3.axisLeft()
		.scale(yScale);

	//placing the axis
	var axis = chart.append("g")
		.attr("class", "axis")
		.attr("transform", translate)
		.call(yAxis);

	updateChart(bars, csvData.length, colorScale);

};
//End function to create coordinated bar chart


//Begin function create dropdown
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
		.on("change", function(){
            changeAttribute(this.value, csvData)

        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};
//End function create dropdown


//Begin function change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;


    // change yscale dynamically
    csvmax = d3.max(csvData, function(d) { return parseFloat(d[expressed]); });

    yScale = d3.scaleLinear()
        .range([chartHeight, 0])
        .domain([0, csvmax]);

    //updata vertical axis
    d3.select(".axis").remove();
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = d3.select(".chart")
        .append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);


    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var allstates = d3.selectAll(".allstates")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });

    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return parseFloat(b[expressed])-parseFloat(a[expressed]);
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 90
        })
        .duration(300);

    updateChart(bars, csvData.length, colorScale);
};
//End function change listener handler


//Begin function updata chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (innerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 503 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding-0;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
	var chartTitle = d3.select(".chartTitle")
        .text(expressed);
};
//End function updata chart



//Begin function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.NAME)
        .style("stroke", "blue")
        .style("stroke-width", "3.5");

	setLabel(props);
};
//End function to highlight enumeration units and bars


//Begin function to reset the element style on mouseout
function dehighlight(props){

    var selected = d3.selectAll("." + props.NAME)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleObject];
    };
	// remove infolabel
	 d3.select(".infolabel")
        .remove();
};
//End function to reset the element style on mouseout


//Begin function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1> <b>" + props[expressed] +"</b>" +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.NAME + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};
//End function to create dynamic label



//Begin function to move info label with user's mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1;

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};
$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

})();
//End a eself-executing anonymous function to move to local scope
