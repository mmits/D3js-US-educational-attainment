function distQuant(data, id){

	function getPoints(_, i){		return _.map(function(d,j){ return {x:j, y:d[i]};});	}
	/* function to return 0 for all attributes except k-th attribute.*/
	function getPointsZero(_, i, k){		return _.map(function(d,j){ return {x:j, y:(i==k ? d[i] : 0 )};});	}
	function toComma(x) {    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
		
	var width=400, height=300, margin=20;
	var colors = ["#7D74FE","#7DFF26","#F84F1B","#28D8D5","#FB95B6","#9D9931","#F12ABF","#27EA88","#549AD5","#FEA526","#7B8D8B","#BB755F","#432E16"];
	
	function draw(type){
		var maxT = d3.max(data[type].map(function(d){ return d3.sum(d); }));
		
		function tW(d){ return x(d*(data[type].length - 1)/50); }
		function tH(d){ return y(d*maxT/50); }
		
		var svg =d3.select("#"+id).select("."+type);
		
		//x and y axis maps.
		var x = d3.scale.linear().domain([0, data[type].length - 1]).range([0, width]);
		var y = d3.scale.linear().domain([0, maxT]).range([height, 0]);
		
		//draw yellow background for graph.
		svg.append("rect").attr("x",0).attr("y",0).attr("width",width).attr("height",height).style("fill","rgb(235,235,209)");
		
		// draw vertical lines of the grid.
		svg.selectAll(".vlines").data(d3.range(51)).enter().append("line").attr("class","vlines")
			.attr("x1",tW).attr("y1",0)
			.attr("x2", tW).attr("y2",function(d,i){ return d%10 ==0 && d!=50? height+12: height;});
		
		//draw horizontal lines of the grid.
		svg.selectAll(".hlines").data(d3.range(51)).enter().append("line").attr("class","hlines")
			.attr("x1",function(d,i){ return d%10 ==0 && d!= 50? -12: 0;})
			.attr("y1",tH).attr("x2", width).attr("y2",tH);
			
		// make every 10th line in the grid darker.	
		svg.selectAll(".hlines").filter(function(d){ return d%10==0}).style("stroke-opacity",0.7);
		svg.selectAll(".vlines").filter(function(d){ return d%10==0}).style("stroke-opacity",0.7);
		
		function getHLabel(d,i){
			if(type=="dist"){ // for distribution graph use the min and max to get the 5 label values.
				var r= data.distMin+i*(data.distMax-data.distMin)/5; 
				return Math.round(r*100)/100;
			}else{ // for quantile graph, use label 20, 40, 60, and 80.
				return (i*20)+' %';
			}	
		}
		
		function getVLabel(d,i){
			if(type=="dist"){ // for dist use the maximum for sum of frequencies and divide it into 5 pieces.
				return Math.round(maxT*i/5);
			}else{ // for quantile graph, use percentages in increments of 20%.
				return (i*20)+' %';
			}	
		}
		// add horizontal axis labels
		svg.append("g").attr("class","hlabels")
			.selectAll("text").data(d3.range(41).filter(function(d){ return d%10==0})).enter().append("text")
			.text(getHLabel).attr("x",function(d,i){ return tW(d)+5;}).attr("y",height+14);	
			
		// add vertical axes labels.
		svg.append("g").attr("class","vlabels")
			.selectAll("text").data(d3.range(41).filter(function(d){ return d%10==0 })).enter().append("text")
			.attr("transform",function(d,i){ return "translate(-10,"+(tH(d)-14)+")rotate(-90)";})
			.text(getVLabel).attr("x",-10).attr("y",function(d){ return 5;});	
		
		var area = d3.svg.area().x(function(d) { return x(d.x); })
			.y0(function(d) { return y(d.y0); })
			.y1(function(d) { return y(d.y0 + d.y); })
			.interpolate("basis");

		var layers = d3.layout.stack().offset("zero")(data.dP.map(function(d,i){ return getPoints(data[type], i);}));
		
		svg.selectAll("path").data(layers).enter().append("path").attr("d", area)
			.style("fill", function(d,i) { return colors[i]; })
			.style("stroke", function(d,i) { return colors[i]; });
			
		//draw a white rectangle to hide and to show some statistics.
		var stat = svg.append("g").attr("class","stat");
		
		stat.append("rect").attr("x",-margin).attr("y",-margin)
			.attr("width",width+2*margin).attr("height",margin).style("fill","white");
			
		// show sum and mean in statistics
		if(type=="dist"){
			stat.append("text").attr("class","count").attr("x",20).attr("y",-6)
				.text(function(d){ 
					var sum = d3.sum(data.dP.map(function(s){ return s[2];})); 
					return "Count: " +toComma(sum)+" / "+toComma(sum)+" ( 100 % )";
				});
				
			stat.append("text").attr("class","mean").attr("x",250).attr("y",-6)
				.text(function(d){ return "Mean: " +data.mean;});
		}
	}
	
	function transitionIn(type, p){
		var maxT = d3.max(data[type].map(function(d){ return d3.sum(d); }));
		var max  = d3.max(data[type].map(function(d){ return d[p]; }));
		
		var x = d3.scale.linear().domain([0, data[type].length - 1]).range([0, width]);
		var y = d3.scale.linear().domain([0, max]).range([height, 0]);
		
		function tW(d){ return x(d*(data[type].length - 1)/50); }
		function tH(d){ return y(d*maxT/50); }

		var area = d3.svg.area().x(function(d) { return x(d.x); })
			.y0(function(d) { return y(d.y0); })
			.y1(function(d) { return y(d.y0 + d.y); })
			.interpolate("basis");

		var layers = d3.layout.stack().offset("zero")(data.dP.map(function(d,i){ return getPointsZero(data[type], i, p);}));
		var svg = d3.select("#"+id).select("."+type);
		//transition all the lines, labels, and areas.
		svg.selectAll("path").data(layers).transition().duration(500).attr("d", area);
			
		svg.selectAll(".vlines").transition().duration(500).attr("x1",tW).attr("x2", tW);			
		svg.selectAll(".hlines").transition().duration(500).attr("y1",tH).attr("y2",tH);						
		svg.selectAll(".vlabels").selectAll("text").transition().duration(500)
			.attr("transform",function(d,i){ return "translate(-10,"+(tH(d)-14)+")rotate(-90)";});	
		
		//update the statistics rect for distribution graph.
		if(type=="dist"){
			svg.select(".stat").select(".count")
				.text(function(d){ 
					var sumseg = data.dP[p][2]; 
					var sum = d3.sum(data.dP.map(function(s){ return s[2];})); 
					return "Count: " +toComma(sumseg)+" / "+toComma(sum)+" ( "+Math.round(100*sumseg/sum)+" % )";
				});
			svg.select(".stat").select(".mean").text(function(d){ return "Mean: " +data.dP[p][1];});
		}
	}
	
	function transitionOut(type){
		var maxT = d3.max(data[type].map(function(d){ return d3.sum(d); }));
		
		function tW(d){ return x(d*(data[type].length - 1)/50); }
		function tH(d){ return y(d*maxT/50); }

		var x = d3.scale.linear().domain([0, data[type].length - 1]).range([0, width]);
		var y = d3.scale.linear().domain([0, maxT]).range([height, 0]);

		var area = d3.svg.area().x(function(d) { return x(d.x); })
			.y0(function(d) { return y(d.y0); })
			.y1(function(d) { return y(d.y0 + d.y); })
			.interpolate("basis");
		var layers = d3.layout.stack().offset("zero")(data.dP.map(function(d,i){ return getPoints(data[type], i);}));
		
		// transition the lines, areas, and labels.
		var svg = d3.select("#"+id).select("."+type);		
		svg.selectAll("path").data(layers).transition().duration(500).attr("d", area);			
		svg.selectAll(".vlines").transition().duration(500).attr("x1",tW).attr("x2", tW);			
		svg.selectAll(".hlines").transition().duration(500).attr("y1",tH).attr("y2",tH);			
		svg.selectAll(".vlabels").selectAll("text").transition().duration(500)
			.attr("transform",function(d,i){ return "translate(-10,"+(tH(d)-14)+")rotate(-90)";});	
			
		// for distribution graph, update the statistics rect.
		if(type=="dist"){
			svg.select(".stat").select(".count")
				.text(function(d){ 
					var sum = d3.sum(data.dP.map(function(s){ return s[2];})); 
					return "Count: " +toComma(sum)+" / "+toComma(sum)+" ( 100 % )";
				});
			svg.select(".stat").select(".mean").text(function(d){ return "Mean: " +data.mean;});
		}
	}
	
	function mouseoverLegend(_,p){	
		transitionIn("dist", p);
		transitionIn("quant", p);
	}
		
	function mouseoutLegend(){	
		transitionOut("dist");
		transitionOut("quant");
	}
	// add title.
	d3.select("#"+id).append("h3").text(data.title);
	
	// add svg and set attributes for distribution.
	d3.select("#"+id).append("svg").attr("width",width+2*margin).attr("height",height+2*margin)
		.append("g").attr("transform","translate("+margin+","+margin+")").attr("class","dist");
		
	//add svg and set attributes for quantil.
	d3.select("#"+id).append("svg").attr("width",width+2*margin).attr("height",height+2*margin)
		.append("g").attr("transform","translate("+margin+","+margin+")").attr("class","quant");
	
	// Draw the two graphs.
	draw("dist");
	draw("quant");			
		
	// draw legends.
	var legRow = d3.select("#"+id).append("div").attr("class","legend")
		.append("table").selectAll("tr").data(data.dP).enter().append("tr").append("td");
	legRow.append("div").style("background",function(d,i){ return colors[i];})
		.on("mouseover",mouseoverLegend).on("mouseout",mouseoutLegend).style("cursor","pointer");
		
	legRow.append("span").text(function(d){ return d[0];})
		.on("mouseover",mouseoverLegend).on("mouseout",mouseoutLegend).style("cursor","pointer");	
}

function drawAll(data, id){

	var seg = d3.select("#"+id).selectAll("div").data(d3.range(data.length)).enter()
		.append("div").attr("id",function(d,i){ return "segment"+i;}).attr("class","distquantdiv");
		
	d3.range(data.length).forEach(function(d,i){ distQuant(dqData[i], "segment"+i );});
}
drawAll(dqData, "contentDiv");
