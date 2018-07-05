
// Everything starts with the data.
// Charter expects a JavaScript object where the keys are the titles for each vote option,
// and the values are the number of votes.
// In this case the data is hardcoded in this file,
// but under normal usage it should be pulled from a database when building and delivering the page.
const VOTES_DATASET = {
    "I Like it a lot": 742,
    "I Like it": 604,
    "I'm indifferent": 123,
    "I hate it": 293,
    "I hate it a lot": 60
};

// Another alternative is to use an array of strings for each vote option.
// In this mode, Charter will still count each vote, but also allow a user to copy a list of people who voted for a certain option.
// CURRENTLY NOT IMPLEMENTED, NOT USED, SORRY.
const USERVOTES_DATASET = {
    "I Like it a lot": ["Håkan Persson (hpersson@email.se)",
					    "August Ahlberg (aahlberg@email.se)",
					    "Isak Haroldson (iharoldson@email.se)",
						"Anne Ljunggren (aljunggren@email.se)",
						"Torsten Ljungman (tljungman@email.se)"],

	"I Like it": ["Oliver Abrahamsson (oabrahamsson@email.se)",
			      "Nathalie Holgersson (nholgersson@email.se)",
				  "Veronika Ljungborg (vljungborg@email.se)",
				  "Christer Engman (cengman@email.se)"],

	"I'm indifferent": ["Nina Ottosson (nottosson@email.se)"],

	"I hate it": ["Emil Berg (eberg@email.se)"],

	"I hate it a lot": [],

	"I don't care at all": []
};

// When creating a graph with Charter, you are creating a new object and passing in a number of arguments.
// What arguments you need to pass in depends on what graph you are creating.
// The following graphs are currently available:

// CircleChart( canvas_id:string, data:object, color_scheme?:array, diameter?:number, thickness?:number, sort_order?:string )
// RowChart( canvas_id:string, data:object, color_scheme?:array, row_thickness?:number, sort_order?:string )

// For now we create a RowChart with only the required arguments,
// which is the ID of a canvas element, and an object containing vote data.
// view the HTML code for more information on implementation.

let rowChart = new RowChart("rowChart1", VOTES_DATASET);

// The optional arguments are the following:

// Color Scheme; An array containing color hex values, preferably a gradient going from dark to light with at least 10 colors.
// Row Thickness; The height number value of each vote bar. If this is changed, you will likely have to adjust additional properties for a good look.
// Sort Order; "NONE" for no sorting, "DESC" for descending, "ASC" for ascending.

// For reference purposes, these are the default properties of the RowChart, but they can be changed for a different design.

rowChart.langString_votes = "Röster"; // String for displaying the word "Votes" in any preferred language.
rowChart.sidePadding = 20;            // Left-hand padding of the graph
rowChart.bottomPadding = 10;          // Bottom padding of the graph
rowChart.rowPadding = 16;             // The spacing between each row
rowChart.titlePadding = 12;           // The padding between the title of each vote option and its corresponding bar
rowChart.titleFontSize = 14;          // Title font size
rowChart.percentNumSize = 16;         // Size of the percentage numbers
rowChart.percentNumPadding = 6;       // The padding between the end of a bar and a percentage number. If negative, percentage value will display inside of the bar
rowChart.sideIndentSize = 10;         // The length of the visible dividers between each row
rowChart.disableIntervals = false;    // Disables the intervals in the graph
rowChart.intervalDashSize = [2, 8];   // Controls how the interval lines are dashed
rowChart.intervalNumSize = 12;        // The number size for each interval
rowChart.intervalNumPadding = 6;      // Padding between a number and its interval line
rowChart.desiredNumOfIntervals = 5;   // How many interval lines are desired in the graph, this will change depending on number of votes to find evenly spaced integers.
rowChart.animDelayInterval = 0.1;     // The delay between start animations of each vote bar, for effect.
rowChart.animLinearConstant = 25;     // Constant speed of animation before easing takes over, defined in pixels.
rowChart.animEase = 5;                // Hybrid Time/ease value for easing the animation to an end, 1 = no ease.

// When all properties have been set, the "startChart()" method has to be called in order to initiate the display of the graph.
// Once the "startChart()" method is called, properties are no longer allowed to change.
// This applies to all graphs.

rowChart.startChart(300);

// The method takes a number as an optional argument, which is a delay defined in milliseconds.
// This can either be used for effect so that not all charts are introduced at the same time,
// or it can be used to offset the calculations for each chart so as to not stress the page load.

// We're creating a default CircleChart.

let circleChart1 = new CircleChart("circleChart1", VOTES_DATASET);

// The optional arguments are the following:

// Color Scheme; As with RowChart.
// Diameter; The width of the circle.
// Thickness; A value between 0-100, represents the circle's inner diameter. If set to 100, the circle graph becomes a proper pie-chart.
// Sort Order; As with RowChart.

// For reference purposes, these are the default properties of the CircleChart.

circleChart1.langString_votes = "Röster";	// As with RowChart.
circleChart1.circleCompletionEase = 10;  	// Hybrid Time/ease value for easing the circle completion animation, 1 = no animation.
circleChart1.pieceOffsetAmount = 25;     	// How far a selected circle piece offsets from the circle.
circleChart1.pieceOffsetSmooth = 4;      	// Hybrid Time/ease value for easing the offset, 1 = no animation.
circleChart1.disablePercentNums = false; 	// Disables percentage numbers.
circleChart1.disableCenterInfo = false;  	// Disables the votes information in the center of the circle.
circleChart1.percentNumFontSize = 16;    	// Size of percentage numbers.
circleChart1.percentNumOffset = 20;      	// How far from the circle's radius the percentage numbers are offset. Negative values places numbers inside of circle.
circleChart1.centerInfoSizeMult = 0.6;   	// A multiplier for the size of the votes information in the center of the circle.
circleChart1.voteListWidth = 200;        	// The width of the vote list.
circleChart1.votelistPadding = 8;        	// Padding for the text in vote list.
circleChart1.voteListFontSize = 12;      	// Font size for the vote list.
circleChart1.voteListOffset = 20;        	// Padding between the circle and the vote list, useful for aligning multiple circle charts with different dimensions.
circleChart1.horizontalPadding = 0;		 	// Additional padding left and right of chart, for aligning multiple circle charts with different dimensions.

circleChart1.startChart(600);

// Two more circle charts with tweaked values.

let circleChart2 = new CircleChart("circleChart2", VOTES_DATASET, undefined, undefined, 100);

circleChart2.disableCenterInfo = true;
circleChart2.percentNumFontSize = 12;
circleChart2.percentNumOffset = -24;
circleChart2.voteListOffset = 57;
circleChart2.horizontalPadding = 28;

circleChart2.startChart(900);

let circleChart3 = new CircleChart("circleChart3", VOTES_DATASET, undefined, undefined, 45);

circleChart3.percentNumFontSize = 12;
circleChart3.percentNumOffset = -18;
circleChart3.voteListOffset = 57;
circleChart3.horizontalPadding = 28;

circleChart3.startChart(1200);