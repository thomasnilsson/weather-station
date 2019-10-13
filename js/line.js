(function () {
    let h = 300
    let w = 600
    let padding = 40
    let body = d3.select("body")
    let div = body.select("#weather_station_plot")
    let title = div.append("h4")
    let svg = div
        .append("svg")
        .attr("width", w)
        .attr("height", h)

    let x, y, xAxis, yAxis, dataset = []

    let parseElement = d => {
        return {
            "date": new Date(d.date),
            "min_temp": d.min_temp,
            "max_temp": d.max_temp,
            "humidity": d.humidity
        }
    }

    d3.json("data/dummy-weather.json", weatherData => {
        for (k in weatherData) {
            let e = parseElement(weatherData[k])
            dataset.push(e)
        }
        console.log(dataset)

        let dateMin = d3.min(dataset, d => d.date)
        let dateMax = d3.max(dataset, d => d.date)
        let tempMax = d3.max(dataset, d => d.max_temp)
        let tempMin = d3.min(dataset, d => d.min_temp)

        console.log(dateMin, dateMax)

        x = d3.scaleTime()
            .domain([dateMin, dateMax])
            .range([padding, w])

        y = d3.scaleLinear()
            .domain([tempMin - 10, tempMax]) // Adjusted domain with tempMin instead of 0!
            .range([h - padding, 0])

        xAxis = d3.axisBottom(x)
        yAxis = d3.axisLeft(y)

        //Define line generator
        var lineMaxTemp = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.max_temp))

        var lineMinTemp = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.min_temp))

        //Create line
        svg.append("path")
            .datum(dataset)
            .attr("class", "line")
            .style("stroke", "orange")
            .attr("d", lineMaxTemp)

        //Create line
        svg.append("path")
            .datum(dataset)
            .attr("class", "line")
            .style("stroke", "steelblue")
            .attr("d", lineMinTemp)

        // Make x axis with a g-element
        svg.append("g")
            .attr("transform", "translate(0, " + (h - padding) + ")")
            .call(xAxis)

        // Make y axis with another g-element
        svg.append("g")
            .attr("id", "yAxis")
            .attr("transform", "translate(" + padding + ", 0)")
            .attr("title", "Temperature")
            .call(yAxis)

        // Label for the y axis
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .attr("y", padding - 25)
            .attr("x", -h / 2)
            .text("Temperature")

        // Label for the x axis
        svg.append("text")
            .style("text-anchor", "middle")
            .attr("y", h)
            .attr("x", w / 2)
            .text("Date")
    })

})()
