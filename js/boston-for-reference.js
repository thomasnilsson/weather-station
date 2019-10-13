(function() { 
	var h = 500, w = 800,
		margins = {bottom: h - 60, top: 20, left: 60, right: w - 180},
		div = d3.select("body").select("#boston"),
		title = div.append("h4").text("Boston Marathon Times"),
		menCSV = "data/boston_men_open.csv", womenCSV = "data/boston_women_open.csv",
		menColor = "green", womenColor = "red",
		animationTime = 1000,
		manClass = "manElement", womanClass = "womanElement",
		tooltip = d3.select("#tooltipBoston").classed("hidden", true),
		svg = div.append("svg").attr("width", w).attr("height", h),
		x, y, xMin, xMax, yMin, yMax, xAxis, yAxis, xAxisTop, yAxisRight, line,
		womenDataset, menDataset

	// Interactable button
	var buttons = d3.select("body").select("#bostonButtons")

	buttons.append("a").attr("class", "btn btn-danger")
		.style("width", "20%").style("margin", "5px").style("border", "none")
		.text("Women Only").on("click", () => onlyWomen())

	buttons.append("a").attr("class", "btn btn-success")
		.style("width", "20%").style("margin", "5px").style("border", "none")
		.text("Men Only").on("click", () => onlyMen())

	buttons.append("a").attr("class", "btn btn-info")
		.style("width", "20%").style("margin", "5px").style("border", "none")
		.text("Both").on("click", () => showBoth())


	// Functions for finding x and y variables of datasets
	var getX = d => d.Year, mapX = d => x(d.Year)
		getY = d => d.Time, mapY = d => y(d.Time)
		var parseRow = d => {
			return {
				"Year" : new Date(+d.Year, 0), // January 1st of that year
				"Athvare" : d.Athvare, // January 1st of that year
				"Time" : timeToMinutes(d.Time)
			}
		}

		var timeToMinutes = time => {
			var arr = time.split(":")
			return (+arr[0] * 60) + (+arr[1]) + (+arr[2] / 60)
		}

		// returns slope, intercept and r-square of the line
		var leastSquares = (xSeries, ySeries) => {
			var reduceSumFunc = (prev, cur) => prev + cur

			var xBar = xSeries.reduce(reduceSumFunc) / xSeries.length
			var yBar = ySeries.reduce(reduceSumFunc) / ySeries.length

			var ssXX = xSeries.map(d => Math.pow(d - xBar, 2))
				.reduce(reduceSumFunc)

			var ssYY = ySeries.map(d => Math.pow(d - yBar, 2))
				.reduce(reduceSumFunc)

			var ssXY = xSeries.map((d, i) => (d - xBar) * (ySeries[i] - yBar))
				.reduce(reduceSumFunc)

			var slope = ssXY / ssXX
			var intercept = yBar - (xBar * slope)
			var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY)

			return [slope, intercept, rSquare]
		}


	var handleMouseOver = (dot, d) => {
		// Use mouse coordinates for tooltip position
		var xPos = d3.event.pageX
		var yPos = d3.event.pageY

		//Update the tooltip position
	  	tooltip.style("left", xPos + "px").style("top", yPos + "px")

		// Update the tooltip information
		var year = d.Year.getFullYear()
		d3.select("#year").text(year)
	  	d3.select("#winner").text(d.Athlete)
		d3.select("#time").text(parseInt(d.Time) + " minutes")

		// Show the tooltip
		tooltip.classed("hidden", false)

		// Highlight the current bar
		d3.select(dot).attr("fill", "steelblue")
	}

	var handleMouseOut = dot => {
		//Hide the tooltip again
		tooltip.classed("hidden", true)

		// Remove highlight from the current bar
		d3.select(dot)
			.transition()
			.duration(250)
			.attr("fill", "none")
	}


	var plotTrendLine = (dataset, color, selector) => {
		var reducedData = dataset.filter(d => d.Year.getFullYear() < 1990)
		var xLabels = reducedData.map(getX)
		var xSeries = d3.range(1, xLabels.length + 1)
		var ySeries = reducedData.map(getY)

		var leastSquaresCoeff = leastSquares(xSeries, ySeries)
		var x1 = xLabels[0],
			x2 = xLabels[xLabels.length - 1]

		var y1 = leastSquaresCoeff[0] + leastSquaresCoeff[1],
			y2 = leastSquaresCoeff[0] * xSeries.length + leastSquaresCoeff[1]

		var lineData = [{"x1" : x1, "y1" : y1, "x2" : x2, "y2" : y2}]

		var trendline = svg.selectAll(selector)
			.append(".trendline")
			.data(lineData)
			.enter()
			.append("line")
			.attr("class", selector + " trendLine")
			.attr("x1", d => x(d.x1))
			.attr("y1", d => y(d.y1))
			.attr("x2", d => x(d.x2))
			.attr("y2", d => y(d.y2))
			.attr("stroke", color)
			.attr("stroke-dasharray", "2, 3")
			.attr("stroke-width", 1)
	}

	var plotLegend = () => {
		svg.append("rect")
			.attr("stroke", menColor)
			.attr("x", margins.right + 50)
			.attr("y", margins.bottom / 2 - 10)
			.attr("width", 10)
			.attr("height", 10)
			.attr("fill", "none")

		svg.append("text")
			.text("Men's Open")
			.attr("fill", menColor)
			.attr("x", margins.right + 65)
			.attr("y", margins.bottom / 2)

		svg.append("text")
			.text("Women's Open")
			.attr("fill", womenColor)
			.attr("x", margins.right + 65)
			.attr("y", margins.bottom / 2 + 25)

		svg.append("circle")
			.attr("stroke", womenColor)
			.attr("cx", margins.right + 55)
			.attr("cy", margins.bottom / 2 + 20)
			.attr("r", 6)
			.attr("fill", "none")
	}

	var plotPath = (dataset, color, selector) => {
		// Plot path using line generator
		svg.append("path")
		   .datum(dataset)
		   .attr("class", selector + " path")
		   .attr("stroke-width", "1px")
		   .attr("fill", "none")
		   .attr("stroke", color)
		   .attr("d", d3.line().x(mapX).y(mapY))
	}

	var scatterPlotRect = (dataset, color, selector) => {
		svg.selectAll(selector)
	 	  .data(dataset)
	 	  .enter()
	 	  .append("rect")
	 	  .attr("class", selector + " square")
		  .attr("x", mapX)
		  .attr("y", mapY)
		  .attr("width", 4)
		  .attr("height", 4)
		  .attr("transform", "translate(-2,-2)")
	 	  .attr("fill", "none")
	 	  .attr("stroke", color)
		  .on("mouseover", function(d) {
			  handleMouseOver(this, d)
		  })
		  .on("mouseout", function(d) {
			  handleMouseOut(this)
		  })

	}

	var scatterPlotCircle = (dataset, color, selector) => {
		svg.selectAll(selector)
	 	  .data(dataset)
	 	  .enter()
		  .append("circle")
	 	  .attr("class", selector + " dot")
	 	  .attr("cx", mapX)
	 	  .attr("cy", mapY)
	 	  .attr("r", 2.5)
	 	  .attr("fill", "none")
	 	  .attr("stroke", color)
		  .on("mouseover", function(d) {
			  handleMouseOver(this, d)
		  })
		  .on("mouseout", function(d) {
			  handleMouseOut(this)
		  })

	}

	var plotAxes = () => {
		// Make x axis with a g-element
		svg.append("g")
			.attr("id", "xAxis")
			.attr("transform", "translate(0, " + margins.bottom + ")")
			.call(xAxis)

		// Mirror x axis and reverse tick directions
		svg.append("g")
			.attr("id", "xAxisTop")
			.attr("transform", "translate(0, " + margins.top + ")")
			.call(xAxisTop)
			.selectAll(".tick line")
			.attr("transform", "translate(0,6)")

		// Make y axis with another g-element
		svg.append("g")
			.attr("id", "yAxis")
			.attr("transform", "translate(" + margins.left + ", 0)")
			.call(yAxis)

		// Mirror y axis and reverse tick directions
		svg.append("g")
			.attr("id", "yAxisRight")
			.attr("transform", "translate(" + margins.right+ ", 0)")
			.call(yAxisRight)
			.selectAll(".tick line")
			.attr("transform", "translate(-6,0)")

		// Label for the y axis
		svg.append("text")
			.attr("transform", "rotate(-90)")
			.style("text-anchor", "middle")
			.attr("y", margins.left/2 - 15)
			.attr("x", -h / 2)
			.text("Winning Time (Minutes)")

		// Label for the x axis
		svg.append("text")
			.style("text-anchor", "middle")
			.attr("y", margins.bottom + 40)
			.attr("x", (margins.right  + 60)/ 2)
			.text("Year")
	}

	var setScales = () => {
		// Define Scales
		x = d3.scaleTime()
			.domain([
				new Date(xMin.getFullYear() - 10,0),
				new Date(xMax.getFullYear() + 10,0)])
			.range([margins.left, margins.right])

		y = d3.scaleLinear()
			.domain([yMin - 10, yMax + 10])
			.range([margins.bottom, margins.top])
	}

	var setAxes = () => {
		// Define Axes
		xAxis = d3.axisBottom(x).ticks(6)
		xAxisTop = d3.axisTop(x).ticks(6)

		yAxis = d3.axisLeft(y).ticks(6)
		yAxisRight = d3.axisRight(y).ticks(6)
	}

	var setRanges = (data) => {
		if (data.length > 1){
			xMin = d3.min([d3.min(data[0], getX), d3.min(data[1], getX)])
			xMax = d3.max([d3.max(data[0], getX), d3.max(data[1], getX)])
			yMin = d3.min([d3.min(data[0], getY), d3.min(data[1], getY)])
			yMax = d3.max([d3.max(data[0], getY), d3.max(data[1], getY)])
		}
		else {
			xMin = d3.min(data[0], getX)
			xMax = d3.max(data[0], getX)
			yMin = d3.min(data[0], getY)
			yMax = d3.max(data[0], getY)
		}
	}

	// Plot
	var drawInitialChart = () => {
		setRanges([womenDataset, menDataset])
		setScales()
		setAxes()
		plotAxes()
		plotLegend()

		// Plot Mens data
		plotPath(menDataset, menColor, manClass)
		plotTrendLine(menDataset, menColor, manClass)
		scatterPlotRect(menDataset, menColor, manClass)

		// Plot Womens data
		plotPath(womenDataset, womenColor, womanClass)
		plotTrendLine(womenDataset, womenColor, womanClass)
		scatterPlotCircle(womenDataset, womenColor, womanClass)
	}

	// Read CSV data
	d3.csv(menCSV, parseRow, mensData => {
		d3.csv(womenCSV, parseRow, womensData => {
			menDataset = mensData
			womenDataset = womensData
			drawInitialChart()
		})
	})

	var hideElements = selector => {
		svg.selectAll("." + selector)
			.transition()
			.duration(animationTime)
			.style("opacity", 0.0) // Fade out
			.on("end", function() { // Make uninteractable when transition ends
				d3.select(this).classed("hidden", true)
			})
	}

	var transitionAxes = () => {
		svg.select("#yAxis").transition().duration(animationTime).call(yAxis)
		svg.select("#yAxisRight").transition().duration(animationTime).call(yAxisRight)
		svg.select("#xAxis").transition().duration(animationTime).call(xAxis)
		svg.select("#xAxisTop").transition().duration(animationTime).call(xAxisTop)
	}

	var transitionGraph = (selector, dataset) => {
		setScales()
		setAxes()
		transitionAxes()


		svg.selectAll("." + selector + ".square")
			.classed("hidden", false)
			.transition()
			.duration(animationTime)
			.attr("x", mapX)
			.attr("y", mapY)
			.style("opacity", 1.0)

		svg.selectAll("." + selector + ".dot")
			.classed("hidden", false)
			.transition()
			.duration(animationTime)
			.attr("cx", mapX)
			.attr("cy", mapY)
			.style("opacity", 1.0)

		svg.selectAll("." + selector + ".path")
			.classed("hidden", false)
			.transition()
			.duration(animationTime)
			.attr("fill", "none")
			.attr("d", d3.line().x(mapX).y(mapY))
			.style("opacity", 1.0)

		svg.selectAll("." + selector + ".trendLine")
			.classed("hidden", false)
			.transition()
			.duration(animationTime)
			.attr("x1", d => x(d.x1))
			.attr("y1", d => y(d.y1))
			.attr("x2", d => x(d.x2))
			.attr("y2", d => y(d.y2))
			.style("opacity", 1.0)
	}

	var onlyMen = () => {
		hideElements(womanClass, 0.0)
		setRanges([menDataset])
		transitionGraph(manClass, menDataset)
	}

	var onlyWomen = () => {
		hideElements(manClass, 0.0)
		setRanges([womenDataset])
		transitionGraph(womanClass, womenDataset)
	}

	var showBoth = () => {
		setRanges([womenDataset, menDataset])
		transitionGraph(womanClass, womenDataset)
		transitionGraph(manClass, menDataset)
	}
})()
