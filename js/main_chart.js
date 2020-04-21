// relative path

// soloLearn (Game)

import {dataset} from './dataset.js'

let rows = dataset.split('\n');
let dataObj  = {};
let len = rows.length;

rows[0].split(',').forEach((i,key)=>{
	dataObj[i] = [];
	for(let j = 1; j < len; j++){
		dataObj[i].push(rows[j].split(',')[key])
	}
})
let labels = dataObj['Name'];
delete dataObj['Name'];

let colors = ["#cd4dcc","#ff971d","#e1f4f3","#91bc3a"]


new Chart(document.getElementById("bar-chart").getContext('2d'), {
	type: 'bar',
    data: {

	  	labels: labels,

      datasets: Object.keys(dataObj).map((i,key)=>({

		      label: i,
				  backgroundColor: colors[key],
				  borderColor: "white",
				  borderWidth: 1,
				  data: dataObj[i]

			}))
    },
    options: {
		tooltips:{
			backgroundColor:"yellow",
			bodyFontColor:"black",
			titleFontColor:"black",
			titleFontSize:15,
			borderWidth:1,
			borderColor: "red"
		},
		legend: {
			position: "top",
			labels:{
				fontSize:18,
				fontColor:"white",
				boxWidth:50
			}
		},

      title: {
    display: true,
    text: 'Task Per Person (Jan 2019 - Jan 2020)',
		fontColor:"white",
		fontSize:30,
	  },
	  scales: {
		yAxes: [{
		  gridLines: {
			color: 'white',
			drawOnChartArea: false,
		  },
		  ticks: {
			fontColor: "white",
			fontSize: 11,
			stepSize: 40,
			beginAtZero: true
		}
		}],

		xAxes: [{
			gridLines: {
			  color: 'whtie',
			  drawOnChartArea: false,
			},
			ticks: {
				fontColor: "white",
				fontSize: 10,
				stepSize: 5,
				beginAtZero: true,
				maxRotation: 0,
        minRotation: 0
			}

		  }],

		  scaleLabel: {
			display: true,
			labelString: 'Y axe name',
			fontColor: '#fff',
			fontSize:10
		},

	  }

    }
});
