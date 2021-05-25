
window.addEventListener('load', function() {	  
	 setTimeout(sayHi, 1000);
	 var datenew = new Date();
		datenew = datenew.toISOString();
		curnttime = datenew.slice(11,13);
		curnttime = parseInt(curnttime, 10)+3;		
		if (curnttime >= 24) {
			curnttime = 24;
		}



		datecurnt = datenew.slice(0,4)+"-"+datenew.slice(5,7)+"-"+ datenew.slice(8,10)+"T"+curnttime+":00:00Z";

	// Initialize the TimeSlider
	slider = new TimeSlider(document.getElementById('d3_timeslider'), {
		debounce: 100,
		ticksize: 8,
		brushTooltip: true,
		constrain: true,
		controls: true,
		tooltipFormatter: function(record) {
			return record[0].toString() + ' - ' + record[1].toString();
		},
		domain: {
			start: new Date("1999-01-01T00:00:00Z"),
			end: new Date("2021-12-31T23:59:59Z"),
		},
		brush: {
			start: new Date("2021-01-02T00:00:00Z"),
			// end: new Date("2021-01-03T00:00:00Z")
		},

		//selectionLimit: 60 * 60 * 12,
		selectionLimit: "P4H",

		displayLimit: "P1D",
		// display:{
		// 	start: new Date("2015-12-25T00:00:00Z"),
		// 	end: new Date("2016-05-10T00:00:00Z")
		// },
		display:{
			start: new Date("2021-01-02T00:00:00Z"),
			end: new Date(datecurnt),
		},
		datasets: [
			
			// test function as source
			{
				id: 'img2021',
				color: 'green',
				records: null,
				source: function(start, end, params, callback) {
					callback([
						[ new Date("1999-01-06T12:00:00Z"), new Date("1999-01-06T13:00:00Z") ],
					]);
				}
			},
			{
				id: 'igg2021',
				color: 'blue',
				records: null,
				source: function(start, end, params, callback) {
					callback([
						[ new Date("1999-01-06T12:00:00Z"), new Date(datenew) ],
					]);
				}
			},
			{
				id: 'imge2021',
				color: 'red',
				records: null,
				source: function(start, end, params, callback) {
					callback([
						[ new Date("1999-01-06T12:00:00Z"), new Date(datenew) ],
					]);
				}
			},

		],

		recordFilter: function(record, dataset) {
			var params = record[2];
			if (params && params.hasOwnProperty("visible")) {
				return params.visible;
			}
			return true;
		}
	});
	//slider.updateBBox([5,44,9,47], "spot4");
	// Register a callback for changing the selected time period

	// Add timetick
	//slider.setTimetick(new Date("Wed Dec 28 2011 08:10:10 GMT+0100"));

	// Add selection helpers
	slider.setBrushTooltip(true);

	// Set the offset of the tooltip
	slider.setBrushTooltipOffset([35,25]);

	/*slider.addDataset(
		{
				id: 'dst',
				color: 'purple',
				lineplot: true,
				data: new TimeSlider.Plugin.WPS({
					url: 'http://localhost:8300/ows',
					eoid: 'dst',
					dataset: 'dst',
					indices: true,
					processid: "get_indices",
					collectionid: "index_id",
					output: "output"
				})
			}
	);*/

	/*slider.addDataset(
			{
				id: 'img2013',
				color: 'blue',
				data: function(start, end, callback) {
					return callback('img2013', [
						[ new Date("2011-01-01T12:00:00Z"), new Date("2021-01-01T16:00:00Z") ],
						new Date("2021-01-02T12:00:00Z"),
						new Date("2021-01-04T00:00:00Z"),
						[ new Date("2021-01-05T00:00:00Z"), new Date("2021-01-06T00:00:00Z") ],
						[ new Date("2021-01-06T12:00:00Z"), new Date("2021-01-06T16:00:00Z") ],
					]);
				}
			}
	);

	slider.addDataset(

			{
				id: 'kp',
				color: 'red',
				lineplot: true,
				data: new TimeSlider.Plugin.WPS({
					url: 'http://localhost:8300/ows',
					eoid: 'kp',
					dataset: 'kp',
					indices: true,
					processid: "get_indices",
					collectionid: "index_id",
					output: "output"
				})
			}
	)*/

	/*slider.addDataset({
              id: "SW_OPER_MAGB_LR_1B",
              color: "#ff7f0e",
              data: new TimeSlider.Plugin.WPS({
                  url: "http://localhost:8300/ows",
                  eoid: "SW_OPER_MAGB_LR_1B",
                  dataset: "SW_OPER_MAGB_LR_1B" ,
                  bbox: [-74.99999997118637, -22.509452604501153, 105.00000002881363,  67.49054739549885]
               })
            });*/

var retimechange="";
	function sayHi() {
		var timechange= $("#timechange").val();
		var entertime = timechange;
		if (retimechange != timechange) {
		if (entertime) {
		entertime = entertime.slice(8,16);
		mounth_n = entertime.slice(0,3);		
		year_n = entertime.slice(4,8);
		switch (mounth_n) {
			case "Jan":
				mounth_n="01";
				break;
			case "Feb":
				mounth_n="02";
				break;
			case "Mar":
				mounth_n="03";
				break;
			case "Apr":
				mounth_n="04";	
				break;
			case "May":
				mounth_n="05";
				break;
			case "Jun":
				mounth_n="06";
				break;
			case "Jul":
				mounth_n="07";
				break;
			case "Aug":
				mounth_n="08";
				break;
			case "Sep":
				mounth_n="09";
				break;
			case "Oct":
				mounth_n="10";
				break;
			case "Nov":
				mounth_n="11";
				break;
			case "Dec":
				mounth_n="12";
				break;	
			default:
				break;
		}
		//console.log(year_n);
		var year_num = parseInt(year_n, 10)-1;
		
		slider.domain(year_num+"-12-01T00:00:00Z",year_n+"-"+mounth_n+"-31T23:59:59Z");
		slider.removeDataset("igg2021");		
		slider.addDataset(
			{
				id: 'igg2021',
				color: 'blue',
				records: null,
				source: function(start, end, params, callback) {
					callback([
						[new Date("1999-01-06T12:00:00Z"), new Date(year_n+"-"+mounth_n+"-01T01:01:01Z")],
					]);
				}
				}
			);

		
		}
			
		}
		retimechange = timechange;
		setTimeout(sayHi, 1000);
	}


	document.getElementById('d3_timeslider').addEventListener('selectionChanged', function(e) {
		
		// document.getElementById("info").textContent = "Selection changed to " + e.detail.start.toISOString() + "/" + e.detail.end.toISOString();
		slider.removeDataset("img2021");		
		slider.addDataset(
			{
				id: 'img2021',
				color: 'green',
				records: null,
				source: function(start, end, params, callback) {
					callback([
						[ new Date(e.detail.start), new Date(e.detail.end) ],
					]);
				}
				}
			);
		slider.removeDataset("igg2021");		
		slider.addDataset(
			{
				id: 'igg2021',
				color: 'blue',
				records: null,
				source: function(start, end, params, callback) {
					callback([
						[ new Date("1999-01-06T12:00:00Z"), new Date(e.detail.end) ],
					]);
				}
				}
			);
			

		//console.log(slider.datasets.img2021.records[0][0]);
		var startday= e.detail.start.toISOString();
		var startday = startday.slice(11,13);
		var endday= e.detail.end.toISOString();
		var endday = endday.slice(11,13);
		var startday = parseInt(startday, 10);
		var endday = parseInt(endday, 10);
		var entertime=0;
		if (startday == 24) {
			startday=0;
		}
		if (endday == 24) {
			endday=0;
		}
		if (startday<endday) {
			entertime=(endday+startday)/2;
		} else if(startday>endday){
			entertime=endday+startday;
		}else{
			entertime=startday;
		}

		$("#testchange").val(entertime);
	});

	document.getElementById('d3_timeslider').addEventListener('recordClicked', function(e) {
		var str = "current time - " + e.detail.end.toISOString();

		for (var key in e.detail.params) {
			if (e.detail.params.hasOwnProperty(key)) {
			str += " " + key + "=" + e.detail.params[key];
			}
		}

		document.getElementById("info").textContent =str;
	});

}, false);