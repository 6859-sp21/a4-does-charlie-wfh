import * as d3 from 'd3';

function _visualization(d3,width,height,margin,padding_between_charts,
	allDates,maxStationDate,
	bostonData,xScale,yScale,colors,xAxis,yAxis,scaleBandInvert,
	bostonDataEmployment,bisectDate,employment_medata,employmentLine,yScaleEmp,xAxisEmp,yAxisEmp,
	ridershipData,ridershipLine,yScalesMBTA,xAxesMBTA,yAxesMBTA,
	sparklinesXAxis,incomeDataStatic,yAxisSparkLine,xScale_sparkline,sparkline_metadata,sparklineAreaMaker,sparklineMaker,sparkline_yscales,
	validationAndIncomeData,ridership_yscales,rectsHeightScale,trackLines) {

  // Canvas Setup
  const svg = d3
  .select('#a4')
  .append('svg')
  .attr('width', width)
  .attr('height', height)
  .attr('viewBox', [0,0,width,height]);

  // White Background (For fullscreen view)
  const background = svg.append("rect")
  .attr("width",width)
  .attr("height",height)
  .attr("fill","white")
 
  let currentDate = allDates[65];
  let currentDateMBTA  = currentDate > maxStationDate ? maxStationDate : currentDate;
  
  /*
  COVID-19 New Cases Rate Panel
  */
  
  // Join covid data to bars 
  svg.append("g")
  .selectAll("rect")
  .data(bostonData)
  .join("rect")
  .attr("class","covid-bars")
  .attr("x",d=>xScale(d.date))
  .attr("y",d=>yScale(d.new_case_rate))
  .attr("fill",colors.covid_off)
  .attr("height",d=>yScale(0)-yScale(d.new_case_rate))
  .attr("width",xScale.bandwidth())
  .attr("date",d=>d.date);

  // Color elapsed time bars with different color
  svg.selectAll("rect.covid-bars")
    .filter(d => xScale(d.date) <= xScale(currentDate))
    .attr("fill",colors.covid_on);
    
  // Add covid axes
  svg.append("g").call(xAxis).style("font-size","14px");
  svg.append("g").call(yAxis).style("font-size","14px");
  
  /*
  Employment Change Panel
  */
  
  // Fix employment level label positions
  let employmentLength = bostonDataEmployment.length;
  let labelsXPosition  = xScale(bostonDataEmployment[employmentLength-1].date)+margin.left/2;
  
  // Time-bisect to find nearest available employment date
  let currentXIndex    = Math.min(bisectDate(bostonDataEmployment,currentDate),employmentLength-1);
  let currentXPosition = xScale(bostonDataEmployment[currentXIndex].date)
    
  // Add vertical dashed date tracker
  svg.append("line")
    .attr('class','epilog-emp')
    .attr("style", "stroke:#999; stroke-width:0.5; stroke-dasharray: 5 3;")
    .attr("y1",1/3*(-padding_between_charts + 2*height - 2*margin.bottom + margin.top))
    .attr("y2", 1/3*(padding_between_charts + height - margin.bottom + 2*margin.top))
    .attr("x1", currentXPosition)
    .attr("x2", currentXPosition); 
  
  // loop over employment levels
  for (const employmentLevel in employment_medata){
    
    // Employment paths
    svg.append("path")
      .attr("fill", "none")
      .attr("stroke",colors[employmentLevel])
      .attr("stroke-miterlimit", 1)
      .attr("stroke-width", 2)
      .attr("d", employmentLine(employmentLevel)(bostonDataEmployment));
    
    // Employment labels
    svg.append('text')
      .attr('x',labelsXPosition)
      .attr('y',yScaleEmp(bostonDataEmployment[employmentLength-1][employmentLevel]))
      .attr('font-size', '18px')
      .text(employment_medata[employmentLevel].label);
    
    // Tooltips
    svg.append('circle')
      .attr('class',employmentLevel)
      .attr('cx',currentXPosition)
      .attr('cy',yScaleEmp(bostonDataEmployment[currentXIndex][employmentLevel]))
      .attr('r',5)
      .attr('fill',colors[employmentLevel]);
  }
  // Add employment axes
  svg.append("g").call(xAxisEmp).style("font-size","14px");
  svg.append("g").call(yAxisEmp).style("font-size","14px");

  /*
  Ridership Change Panel
  */
  
  // Time-bisect to find nearest available ridership date
  let ridershipLength       = ridershipData.blue.length;
  let currentXIndexLines    = Math.min(bisectDate(ridershipData.blue,currentDate),ridershipLength-1);
  let currentXPositionLines = xScale(ridershipData.blue[currentXIndexLines].date)
 
  // Add vertical dashed date tracker
  svg.append("line")
    .attr('class','epilog-lines')
    .attr("style", "stroke:#999; stroke-width:0.5; stroke-dasharray: 5 3;")
    .attr("y1",1/3*(2*height - 2*margin.bottom + margin.top + 2*padding_between_charts))
    .attr("y2", height-margin.bottom)
    .attr("x1", currentXPositionLines)
    .attr("x2", currentXPositionLines);
  
  // Loop over MBTA lines
  for (const line in xAxesMBTA) {
    
    //Draw path
    svg.append("path")
      .attr("fill", "none")
      .attr("stroke",colors[line])
      .attr("stroke-miterlimit", 1)
      .attr("stroke-width", 2)
      .attr("d", ridershipLine(yScalesMBTA[line])(ridershipData[line]));

    //Add tooltip
    svg.append('circle')
      .attr('class',line)
      .attr('cx',currentXPositionLines)
      .attr('cy',yScalesMBTA[line](ridershipData[line][currentXIndexLines].ridership))
      .attr('r',5)
      .attr('fill',colors[line]);
    
    // Add axes
    svg.append("g").call(xAxesMBTA[line]).style("font-size","14px");
    svg.append("g").call(yAxesMBTA[line]).style("font-size","14px");
  }
  
  /*
 SparkLines
  */
 
  // Add axes
  svg
    .append("text")
    .attr("x", margin.left)
    .attr("y", margin.top/2)
    .attr('font-size', '18px')
    .attr('font-weight', 'bold')
    .attr("fill", "currentColor")
    .attr("text-anchor", "start")
    .attr("alignment-baseline","text-before-edge")
    .text("Median income and seasonally adjusted ridership along MBTA tracks");

  svg.append("g").call(sparklinesXAxis).style("font-size","14px");
 
  for (const line in incomeDataStatic) {

    svg.append("g")
      .call(yAxisSparkLine(line))
      .attr("transform", `translate(${xScale_sparkline(sparkline_metadata[line].offset)},0)`)
      .style("font-size","14px");

    svg
      .append("path")
      .attr("fill", colors[line])
      .attr("opacity", 0.2)
      .attr("stroke","none")
      .attr("d", sparklineAreaMaker(line)(incomeDataStatic[line]))
      .attr("transform", `translate(${xScale_sparkline(sparkline_metadata[line].offset)-margin.left},0)`);

    svg  
      .append("path")
      .attr("fill", "none")
      .attr("stroke",colors[line])
      .attr("stroke-miterlimit", 1)
      .attr("stroke-width", 2)
      .attr("d", sparklineMaker(line)(incomeDataStatic[line]))
      .attr("transform", `translate(${xScale_sparkline(sparkline_metadata[line].offset)-margin.left},0)`);

    svg.selectAll("dot")
      .data(incomeDataStatic[line])
      .join("circle")
      .attr("r", 3)
      .attr("fill","white")
      .attr("stroke","black")
      .attr("stroke-width", 1)
      .attr("cx", d=>xScale_sparkline(d.projected_x))
      .attr("cy", d=>sparkline_yscales[line](d.median_income))
      .attr("transform", `translate(${xScale_sparkline(sparkline_metadata[line].offset)-margin.left},0)`);
      
    svg
      .selectAll("rects")
      .data(validationAndIncomeData[line]
            .filter(
      d=> 
      d.projected_x > sparkline_metadata[line].inflection &&
      d.date.getTime()==currentDateMBTA.getTime()))
      .join("rect")
      .attr("class",`tracks-${line}`)
      .attr("fill",d=> (d.validation_change != "0.") ? colors[line]: colors.covid_off)
      .attr("x", d=>xScale_sparkline(d.projected_x)-width/300)
      .attr("y", d=>ridership_yscales[line](-50)-rectsHeightScale(Math.min(+d.validation_change,0))/2)
      .attr("height", d=>rectsHeightScale(Math.min(+d.validation_change,0)))
      .attr("width",width/150)
      .attr("opacity",0.5)
      .attr("transform", `translate(${xScale_sparkline(sparkline_metadata[line].offset)-margin.left},0)`);

    svg
      .append("path")
      .attr("stroke", colors[line])
      .attr("opacity", 0.5)
      .attr("fill", "none")
      .attr("stroke-miterlimit", 1)
      .attr("stroke-width", 5)
      .attr("d", trackLines[line](incomeDataStatic[line]))
      .attr("transform", `translate(${xScale_sparkline(sparkline_metadata[line].offset)-margin.left},0)`);


  }
  
  /*
  Mousemove interactivity
  Need to restrict to right panel or otherwise 'pin'
  */
  
  let sticky = 0;
  
  d3.select("body")
    .on("keydown", (event) => {
    if(event.isComposing || event.keyCode === 32 || event.keyCode === 13){
      sticky = (sticky == 0) ? 1 : 0;
    }
  });
  
  svg.on('click', (event) => { 
    if (sticky == 1) {

    // Time-bisect to find nearest available dates
    currentDate      = scaleBandInvert(xScale)(d3.pointer(event)[0]);
    currentDateMBTA  = currentDate > maxStationDate ? maxStationDate : currentDate;
    currentXIndex    = Math.min(bisectDate(bostonDataEmployment,currentDate),employmentLength-1);
    currentXPosition = xScale(bostonDataEmployment[currentXIndex].date);
    currentXIndexLines    = Math.min(bisectDate(ridershipData.blue,currentDate),ridershipLength-1);                 
    currentXPositionLines = xScale(ridershipData.blue[currentXIndexLines].date);

    // Covid-bar charts
    svg.selectAll("rect.covid-bars")
      .filter(d => d.date <= currentDate)
      .attr("fill",colors.covid_on);

    svg.selectAll("rect.covid-bars")
      .filter(d => d.date > currentDate)
      .attr("fill",colors.covid_off);

    // Dashed epilogs
    svg.select('line.epilog-emp')
      .attr("x1",currentXPosition)
      .attr('x2',currentXPosition);

    svg.select('line.epilog-lines')
      .attr("x1",currentXPositionLines)
      .attr('x2',currentXPositionLines);

    // employment tooltips
    for (const employmentLevel in employment_medata){
      svg.select(`circle.${employmentLevel}`)
        .attr("cx",currentXPosition)
        .attr('cy',yScaleEmp(bostonDataEmployment[currentXIndex][employmentLevel]));
    }

    // MBTA tooltips
    for (const line in xAxesMBTA) {

      svg.select(`circle.${line}`)
        .attr("cx",currentXPositionLines)
        .attr('cy',yScalesMBTA[line](ridershipData[line][currentXIndexLines].ridership));    
    }

    // Rects
    for (const line in validationAndIncomeData) {

      svg.selectAll(`rect.tracks-${line}`)
        .data(validationAndIncomeData[line]
              .filter(
        d=> 
        d.projected_x > sparkline_metadata[line].inflection &&
        d.date.getTime()==currentDateMBTA.getTime()),d=>d.station)

        .join(
        enter  => enter,
        update => update
        .attr("y", d=>ridership_yscales[line](-50)-rectsHeightScale(Math.min(+d.validation_change,0))/2)
        .attr("height", d=>rectsHeightScale(Math.min(+d.validation_change,0))),
        exit => exit
      )

    }
  }
  });

  
  svg.on('mousemove', (event) => { 
    if (sticky == 0) {

    // Time-bisect to find nearest available dates
    currentDate      = scaleBandInvert(xScale)(d3.pointer(event)[0]);
    currentDateMBTA  = currentDate > maxStationDate ? maxStationDate : currentDate;
    currentXIndex    = Math.min(bisectDate(bostonDataEmployment,currentDate),employmentLength-1);
    currentXPosition = xScale(bostonDataEmployment[currentXIndex].date);
    currentXIndexLines    = Math.min(bisectDate(ridershipData.blue,currentDate),ridershipLength-1);                 currentXPositionLines = xScale(ridershipData.blue[currentXIndexLines].date);

    // Covid-bar charts
    svg.selectAll("rect.covid-bars")
      .filter(d => d.date <= currentDate)
      .attr("fill",colors.covid_on);

    svg.selectAll("rect.covid-bars")
      .filter(d => d.date > currentDate)
      .attr("fill",colors.covid_off);

    // Dashed epilogs
    svg.select('line.epilog-emp')
      .attr("x1",currentXPosition)
      .attr('x2',currentXPosition);

    svg.select('line.epilog-lines')
      .attr("x1",currentXPositionLines)
      .attr('x2',currentXPositionLines);

    // employment tooltips
    for (const employmentLevel in employment_medata){
      svg.select(`circle.${employmentLevel}`)
        .attr("cx",currentXPosition)
        .attr('cy',yScaleEmp(bostonDataEmployment[currentXIndex][employmentLevel]));
    }

    // MBTA tooltips
    for (const line in xAxesMBTA) {

      svg.select(`circle.${line}`)
        .attr("cx",currentXPositionLines)
        .attr('cy',yScalesMBTA[line](ridershipData[line][currentXIndexLines].ridership));    
    }

    // Rects
    for (const line in validationAndIncomeData) {

      svg.selectAll(`rect.tracks-${line}`)
        .data(validationAndIncomeData[line]
              .filter(
        d=> 
        d.projected_x > sparkline_metadata[line].inflection &&
        d.date.getTime()==currentDateMBTA.getTime()),d=>d.station)

        .join(
        enter  => enter,
        update => update
        .attr("y", d=>ridership_yscales[line](-50)-rectsHeightScale(Math.min(+d.validation_change,0))/2)
        .attr("height", d=>rectsHeightScale(Math.min(+d.validation_change,0))),
        exit => exit
      )

    }
  }

  });
  
  
  // Simple Lightbox (For static explanation)
  let currentOpacity=0;
  const lightbox = svg.append("image")
  .attr("xlink:href","https://i.pinimg.com/originals/68/03/73/68037333171e5ca48cc5287cec92a2a5.jpg")
  .attr("width",width)
  .attr("height",height)
  .attr("fill","red")
  .attr("opacity",currentOpacity)
  .attr("class","lightbox")
  
  // Add axes
  svg
    .append("text")
    .attr("x", margin.left)
    .attr("y", height-margin.bottom/2)
    .attr('font-size', '18px')
    .attr('font-weight', 'bold')
    .attr("fill", "currentColor")
    .attr("text-anchor", "start")
    .attr("alignment-baseline","text-before-edge")
    .text("How do I read this? (draft)")
    .attr("class","lightbox")
    .on("click", function(d) {
    currentOpacity = svg.select("image.lightbox").style("opacity")
    svg.select("image.lightbox").transition().style("opacity", currentOpacity == 0.75 ? 0 : 0.75);
    svg.select("text.lightbox").transition().text(currentOpacity == 0.75 ? "How do I read this? (draft)" : "Click to return")
       }
     )

  return svg.node();
}

/*
 * COVID DATA
 */

async function _covid19(d3) {
  return d3
  //.text('/data/COVID-City-Daily.csv')
  .text('https://gist.githubusercontent.com/gvarnavi/6b5b8fcde53e876a462c250d11c24c3e/raw/adfe76780c40954ebc57bdc7cb0596924aa833e5/COVID-City-Daily.csv')
  .then(data => d3.csvParse(data));
}

function _bostonData(d3,covid19) {
  return covid19
.filter(d => d.cityid === "25")
.map(d => (
  {
  "date":d3.timeParse("%Y/%m/%d")(`${d.year}/${d.month}/${d.day}`),
  "new_case_rate":d.new_case_rate
  }
))
}

/*
 * EMPLOYMENT DATA
 */

async function _employment(d3) {
  return d3
  //.text('/data/Employment-City-Daily.csv')
  .text('https://gist.githubusercontent.com/gvarnavi/28140b23ca089ee9bda47f22a71a0969/raw/e37c4fba3bb9d7e589639cf0238309bebd920962/Employment-City-Daily.csv')
  .then(data => d3.csvParse(data));
}

function _bostonDataEmployment(d3,employment) {
  return employment
.filter(d => d.countyfips === "25025"&& d != undefined)
.map(d => (
  {
  "date":d3.timeParse("%Y/%m/%d")(`${d.year}/${d.month}/${d.day}`),
  "emp_combined":d.emp_combined*100,
  "emp_low":d.emp_combined_inclow*100,
  "emp_middle":d.emp_combined_incmiddle*100,
  "emp_high":d.emp_combined_inchigh*100
  }
))
}


/*
 * RIDERSHIP DATA
 */

async function _ridership(d3) {
  return d3
  //.text('/data/mbda-gated-station-validations-by-line-seasonally-adjusted.csv')
  .text('https://gist.githubusercontent.com/gvarnavi/83ca748b46fc98a5abf34bb472e3b85a/raw/a580a887abf87f0a3f3b8fcdbd0e51f91cc61d84/mbda-gated-station-validations-by-line-seasonally-adjusted.csv')
  .then(data => d3.csvParse(data));
}

function _ridershipFormatted(d3,ridership) {
  return ridership
  .map(d => (
    {
    "date":d3.timeParse("%Y/%m/%d")(`${d.year}/${d.month}/${d.day}`),
    "line":d.line,
    "ridership":d.ridership
    }
    )
  )
}

function _ridershipData(allDates,ridershipFormatted){
  return ({
  blue:ridershipFormatted.filter(d=>d.line==='Blue' && !(d.date < allDates[0])),
  red:ridershipFormatted.filter(d=>d.line==='Red' && !(d.date < allDates[0])),
  orange:ridershipFormatted.filter(d=>d.line==='Orange' && !(d.date < allDates[0])),
  green:ridershipFormatted.filter(d=>d.line==='Green' && !(d.date < allDates[0]))})
}

/*
 * VALIDATION DATA
 */

async function _validationsAndIncomes(d3) {
  return d3
  //.text('/data/tabular-station-validations-plus-income.csv')
  .text('https://gist.githubusercontent.com/gvarnavi/7b7c69f7d1b861422f3396d11f35029e/raw/1ef428845ac5a895d9826a87e6b8f2e818e4cb0b/tabular-station-validations-plus-income.csv')
  .then(data => d3.csvParse(data));
}

function _validationAndIncomeFormatted(d3,validationsAndIncomes) {
  return validationsAndIncomes
.map(d => (
  {
    "date":d3.timeParse("%Y/%m/%d")(`${d.year}/${d.month}/${d.day}`),
    "line":d.line,
    "station":d.station,
    "validation_change":d.validation_change,
    "projected_x":d.projected_x,
    "median_income":d.median_income
  }
)
    )
}

function _validationAndIncomeData(allDates,validationAndIncomeFormatted) {
  return ({
  blue:validationAndIncomeFormatted.filter(d=>d.line==='blue' && !(d.date < allDates[0])),
  red_a:validationAndIncomeFormatted.filter(d=>d.line==='red-a' && !(d.date < allDates[0])),
  red_b:validationAndIncomeFormatted.filter(d=>d.line==='red-b' && !(d.date < allDates[0])),
  green_b:validationAndIncomeFormatted.filter(d=>d.line==='green-b' && !(d.date < allDates[0])),
  green_c:validationAndIncomeFormatted.filter(d=>d.line==='green-c' && !(d.date < allDates[0])),
  green_d:validationAndIncomeFormatted.filter(d=>d.line==='green-d' && !(d.date < allDates[0])),
  green_e:validationAndIncomeFormatted.filter(d=>d.line==='green-e' && !(d.date < allDates[0])),
  orange:validationAndIncomeFormatted.filter(d=>d.line==='orange' && !(d.date < allDates[0]))
})
}

function _tokenStationTimeseries(validationAndIncomeData) {
  return validationAndIncomeData.red_a
  .filter(d =>d.station === "alewife")
}

function _maxStationDate(tokenStationTimeseries) {
  return tokenStationTimeseries[tokenStationTimeseries.length-1].date
}

function _incomeDataStatic(allDates,validationAndIncomeData) {
  return ({
  blue:validationAndIncomeData.blue.filter(d=>d.date < allDates[1]),
  red_a:validationAndIncomeData.red_a.filter(d=>d.date < allDates[1]),
  red_b:validationAndIncomeData.red_b.filter(d=>d.date < allDates[1]),
  green_b:validationAndIncomeData.green_b.filter(d=>d.date < allDates[1]),
  green_c:validationAndIncomeData.green_c.filter(d=>d.date < allDates[1]),
  green_d:validationAndIncomeData.green_d.filter(d=>d.date < allDates[1]),
  green_e:validationAndIncomeData.green_e.filter(d=>d.date < allDates[1]),
  orange:validationAndIncomeData.orange.filter(d=>d.date < allDates[1])
})
}

/*
 * UTILITY FUNCTIONS
 */

const _margin = () => ({top: 20, right: 20, bottom: 60, left: 40})

const _colors = () => (
  {
   covid_off: "gainsboro",
   covid_on:"dimgray",
   emp_middle:"#8dd3c7",
   emp_low: "#bebada",
   emp_high:"#fccde5",
   emp_combined:"#d9d9d9",
   blue:"#244995",
   green:"#118342",
   green_e:"#bae4b3",
   green_d:"#74c476",
   green_c:"#31a354",
   green_b:"#006d2c",
   orange:"#ef7d15",
   red:"#e22224",
   red_b:"#fc9272",
   red_a:"#de2d26"
  }
  )

function _height(width) {
  return Math.ceil(width * screen.height / screen.width)
}

function _padding_between_charts(height) {
  return Math.floor(height/100)*10
}

function _allDates(bostonDataEmployment,bostonData) {
  return bostonDataEmployment.map(d => d.date)
  .filter(d=>d<bostonData[0].date)
  .concat(bostonData.map(d=>d.date))
}


/*
 * Covid-viz
 */

function _bisectDate(d3) {
  return d3.bisector(function(d) { return d.date; }).left
}

function _xScale(d3,allDates,margin,width) {
  return d3.scaleBand()
  .domain(allDates)
  .range([1/3*(margin.left - 2*margin.right + 2*width), width - margin.right])
  .paddingInner(0.5)
  .paddingOuter(0)
}

function _yScale(d3,bostonData,padding_between_charts,height,margin) {
  return d3.scaleLinear()
  .domain([0, d3.max(bostonData.map(d => d.new_case_rate))])
  .range([1/3*(-2*padding_between_charts + height - margin.bottom + 2*margin.top), 
          margin.top])
}

function _scaleBandInvert(scale) {
  var domain = scale.domain();
  var paddingOuter = scale(domain[0]);
  var eachBand = scale.step();
  return function (value) {
    var index = Math.floor(((value - paddingOuter) / eachBand));
    return domain[Math.max(0,Math.min(index, domain.length-1))];
  }
}

function _xAxis(d3,height,margin,padding_between_charts,xScale) {
return g => g
    .attr("transform", `translate(0,${
          1/3*(height - margin.bottom + 2*margin.top - 2*padding_between_charts)
          })`)
    .call(
      d3.axisBottom(xScale)
       .tickFormat(d3.timeFormat("%b %y"))
       .tickValues(xScale.domain().filter(d => d.getDate() == 1 && (d.getMonth() % 2)==0))
       .tickSizeOuter(0))
}

function _yAxis(d3,margin,yScale,bostonData,width) {
return g => g
    .attr("transform", `translate(${1/3*(margin.left - 2*margin.right + 2*width)},0)`)
    .call(d3.axisLeft(yScale).ticks(null, bostonData.format))
    .call(g => g.append("text")
        .attr("x", margin.left/2)
        .attr("y", margin.top/2)
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .attr("alignment-baseline","text-before-edge")
        .text("New covid cases in Boston per 100,000 people")
        )
}

const _employment_medata = () => (
  {
    emp_high: ({label:'High income'}),
    emp_combined: ({label:'Combined'}),
    emp_middle: ({label:'Middle income'}),
    emp_low: ({label:'Low income'})
  }
  )

function _xAxisEmp(d3,padding_between_charts,height,margin,xScale) {
  return g => g
    .attr("transform", `translate(0,${
          1/3*(-padding_between_charts + 2*height - 2*margin.bottom +margin.top)})`)
    .call(
      d3.axisBottom(xScale)
       .tickFormat(d3.timeFormat("%b %y"))
       .tickValues(xScale.domain().filter(d => d.getDate() == 1 && (d.getMonth() % 2)==0))
       .tickSizeOuter(0))
}

function _yScaleEmp(d3,bostonDataEmployment,padding_between_charts,height,margin) {
  return d3.scaleLinear()
  .domain([1.1*d3.min(bostonDataEmployment.map(d=>+d.emp_low)), 
           1.1*d3.max(bostonDataEmployment.map(d=>+d.emp_high))])
  .range([
    1/3*(-padding_between_charts + 2*height - 2*margin.bottom + margin.top), 
    1/3*(padding_between_charts + height - margin.bottom + 2*margin.top)])
}

function _yAxisEmp(d3,margin,bostonDataEmployment,width,yScaleEmp,padding_between_charts,height) {
  return g => g
    .attr("transform", `translate(${1/3*(margin.left - 2*margin.right + 2*width)},0)`)
    .call(d3.axisLeft(yScaleEmp).ticks(null, bostonDataEmployment.format))
    .call(g => g.append("text")
          .attr("x", margin.left/2)
          .attr("y", 1/3*(padding_between_charts + height - margin.bottom + 2*margin.top)-margin.top/2)
          .attr('font-size', '18px')
          .attr('font-weight', 'bold')
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("Seasonally adjusted change in employment (%)")
        )
}

function _employmentLine(d3,xScale,yScaleEmp,field){
  return d3.line()
    .x(d => xScale(d.date) + xScale.bandwidth() / 2)
    .y(d => yScaleEmp(d[field]))
}

function _ridershipLine(d3,xScale,mbta_line_scale){
  return d3.line()
    .x(d => xScale(d.date) + xScale.bandwidth() / 2)
    .y(d => mbta_line_scale(d.ridership))
}

function _yScaleLine(d3,ridership,offsets){
  return d3.scaleLinear()
  .domain([1.05*d3.min(ridership.map(d=>+d.ridership)),
           1.05*d3.max(ridership.map(d=>+d.ridership))])
  .range(offsets)
}

function _yScalesMBTA(yScaleLine,height,margin,padding_between_charts) {
  return (
  {
    blue:yScaleLine([
      1/4*(3*height - 3*margin.bottom + margin.top + 2*padding_between_charts),
      1/3*(2*height - 2*margin.bottom + margin.top + 2*padding_between_charts)
    ]),
    green:yScaleLine([
      1/6*(5*height - 5*margin.bottom + margin.top + 2*padding_between_charts), 
      1/4*(3*height - 3*margin.bottom + margin.top + 2*padding_between_charts)
    ]),
    orange:yScaleLine([
      1/12*(11*height - 11*margin.bottom + margin.top +2*padding_between_charts), 
      1/6*(5*height - 5*margin.bottom + margin.top + 2*padding_between_charts)
    ]),
    red:yScaleLine([
      height-margin.bottom, 
      1/12*(11*height - 11*margin.bottom + margin.top +2*padding_between_charts)
    ]),
  }
)
}

function _yAxisLine(d3,lineScale,margin,width){
  return g => g
    .attr("transform", `translate(${1/3*(margin.left - 2*margin.right + 2*width)},0)`)
    .call(d3.axisLeft(lineScale).tickValues([-75,-50,-25,0]))
}

function _yAxesMBTA(d3,yAxisLine,yScalesMBTA,margin,width,padding_between_charts,height) {
  return (
  {
    blue:yAxisLine(yScalesMBTA.blue),
    green:yAxisLine(yScalesMBTA.green),
    orange:yAxisLine(yScalesMBTA.orange),
    red: g => g
    .attr("transform", `translate(${1/3*(margin.left - 2*margin.right + 2*width)},0)`)
    .call(d3.axisLeft(yScalesMBTA.red).tickValues([-75,-50,-25,0]))
    .call(g => g.append("text")
        .attr("x", margin.left/2)
        .attr("y", 1/3*(2*height - 2*margin.bottom + margin.top + 2*padding_between_charts)-margin.top/2)
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("Seasonally adjusted change in MBTA ridership (%)")
        )
  }
)
}

function _xAxisLine(d3,xScale,offset){
  return g => g
    .attr("transform", `translate(0,${offset})`)
    .call(
      d3.axisBottom(xScale)
       .tickFormat("")
       .tickValues(xScale.domain().filter(d => d.getDate() == 1 && (d.getMonth() % 2)==0))
       .tickSizeOuter(0))
}

function _xAxesMBTA(d3,xAxisLine,height,margin,padding_between_charts,xScale) {
  return (
  {
    blue:xAxisLine(1/4*(3*height - 3*margin.bottom + margin.top + 2*padding_between_charts)),
    
    green:xAxisLine(1/6*(5*height - 5*margin.bottom + margin.top + 2*padding_between_charts)),
    
    orange:xAxisLine(1/12*(11*height - 11*margin.bottom + margin.top +2*padding_between_charts)),
    
    red: g => g
    .attr("transform", `translate(0,${height-margin.bottom})`)
    .call(
      d3.axisBottom(xScale)
       .tickFormat(d3.timeFormat("%b %y"))
       .tickValues(xScale.domain().filter(d => d.getDate() == 1 && (d.getMonth() % 2)==0))
       .tickSizeOuter(0))
  }
)
}

function _yScaleSparkline(d3,offsets){
  return d3.scaleLinear()
  .domain([0,200000])
  .range(offsets)
}

function _yAxisSparkLine(d3,sparkline_yscales,line){
  return g => g
    .call(d3.axisLeft(sparkline_yscales[line])
          .tickValues([0,50000,100000,150000])
          .tickFormat(d3.format("~s")))
}

function _sparklineMaker(d3,line,xScale_sparkline,sparkline_yscales) {
  return d3.line()
  .x(d => xScale_sparkline(d.projected_x))
  .y(d => sparkline_yscales[line](d.median_income))
  .curve(d3.curveStep)
}

function _sparklineAreaMaker(d3,line,xScale_sparkline,sparkline_yscales) {
  return d3.area()
  .x(d => xScale_sparkline(d.projected_x))
  .y1(d => sparkline_yscales[line](d.median_income))
  .y0(sparkline_yscales[line](0.))
  .curve(d3.curveStep)
}

function _sparkline_yscales(height,margin,yScaleSparkline) {
  return (
  {
    blue:yScaleSparkline([height-margin.bottom,
                          1/7*(6*height - 6*margin.bottom + margin.top)]),
    orange:yScaleSparkline([1/4*(3*height - 3*margin.bottom + margin.top),
                            1/28*(17*height - 17*margin.bottom + 11*margin.top)]),
    red_a:yScaleSparkline([1/2*(height - margin.bottom + margin.top),
                           1/14*(5*height - 5*margin.bottom + 9*margin.top)]),
    red_b:yScaleSparkline([1/14*(5*height - 5*margin.bottom + 9*margin.top),
                           1/14*(3*height - 3*margin.bottom + 11*margin.top)]),
    green_b:yScaleSparkline([height - margin.bottom,
                           1/7*(6*height - 6*margin.bottom + margin.top)]),
    green_c:yScaleSparkline([1/7*(6*height - 6*margin.bottom + margin.top),
                           1/7*(5*height - 5*margin.bottom + 2*margin.top)]),
    green_d:yScaleSparkline([1/7*(5*height - 5*margin.bottom + 2*margin.top),
                           1/7*(4*height - 4*margin.bottom + 3*margin.top)]),
    green_e:yScaleSparkline([1/7*(4*height - 4*margin.bottom + 3*margin.top),
                           1/7*(3*height - 3*margin.bottom + 4*margin.top)]),
 }
)
}

function _xScale_sparkline(d3,incomeDataStatic,margin,width) {
  return d3.scaleLinear()
  .domain([0, 
          (Math.ceil(1.1*(
  ( d3.max(incomeDataStatic.red_b.map(d=>+d.projected_x)))+d3.max(incomeDataStatic.green_d.map(d=>+d.projected_x))
)*10)/10)])
  .range([margin.left, 1/3*(margin.left - 2*margin.right + 2*width)-margin.left*2])
}

function _sparkline_scale_annotation(d3,xScale_sparkline) {
  return  d3.scaleLinear()
  .domain([0, 3])
  .range([xScale_sparkline(0), xScale_sparkline(3*0.185)])
}

function _sparklinesXAxis(d3,sparkline_scale_annotation,margin,height,axis_flush){
  return g => g
    .attr("transform", `translate(${axis_flush},${height-margin.bottom})`)
    .call(
      d3.axisBottom(sparkline_scale_annotation)
       .tickValues([0,1,2,3])
       .tickSizeOuter(0))
  .call(g => g.append("text")
        .attr("x", sparkline_scale_annotation(1.5))
        .attr("y", -margin.top/2)
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .attr("fill", "currentColor")
        .attr("text-anchor", "middle")
        .text("Distance (mi)")
        )
}

function _axis_flush(d3,xScale_sparkline,incomeDataStatic, sparkline_scale_annotation) {
  return xScale_sparkline(d3.max(incomeDataStatic.red_b.map(d=>+d.projected_x)))-sparkline_scale_annotation(3)
}

function _green_line_flush(d3,incomeDataStatic) {
  return (
  Math.ceil(
    1.1*(d3.max(incomeDataStatic.red_b.map(d=>+d.projected_x)) +d3.max(incomeDataStatic.green_d.map(d=>+d.projected_x)))*10)/10)-d3.max(incomeDataStatic.green_d.map(d=>+d.projected_x))
}

function _sparkline_metadata(green_line_flush) {
  return (
  {
    green_b: ({offset:green_line_flush, inflection:-1}),
    green_c: ({offset:green_line_flush, inflection:0.625}),
    green_d: ({offset:green_line_flush, inflection:0.625}),
    green_e: ({offset:green_line_flush, inflection:0.52}),
    blue:    ({offset:0, inflection:-1}),
    orange:  ({offset:0, inflection:-1}),
    red_b:   ({offset:0, inflection:1.65}),
    red_a:   ({offset:0, inflection:-1}),
  }
  )
}

function _centroids(sparkline_metadata,ridership_yscales,line_low,line_high) {
  return function(d) {
   if (d.projected_x < sparkline_metadata[line_high].inflection)
    {
      return ridership_yscales[line_low](-50)
    }
    else {
      return ridership_yscales[line_high](-50)
    }
  }
}

function _trackLines(d3,xScale_sparkline,centroids) {
  return (
  {
    red_a:d3.line()
    .x(d => xScale_sparkline(d.projected_x))
    .y(d => centroids('red_a','red_a')(d))
    .curve(d3.curveMonotoneX),

    red_b:d3.line()
    .x(d => xScale_sparkline(d.projected_x))
    .y(d => centroids('red_a','red_b')(d))
    .curve(d3.curveMonotoneX),

    green_b:d3.line()
    .x(d => xScale_sparkline(d.projected_x))
    .y(d => centroids('green_b','green_b')(d))
    .curve(d3.curveMonotoneX),

    green_c:d3.line()
    .x(d => xScale_sparkline(d.projected_x))
    .y(d => centroids('green_b','green_c')(d))
    .curve(d3.curveMonotoneX),

    green_d:d3.line()
    .x(d => xScale_sparkline(d.projected_x))
    .y(d => centroids('green_b','green_d')(d))
    .curve(d3.curveMonotoneX),

    green_e:d3.line()
    .x(d => xScale_sparkline(d.projected_x))
    .y(d => centroids('green_b','green_e')(d))
    .curve(d3.curveMonotoneX),

    orange:d3.line()
    .x(d => xScale_sparkline(d.projected_x))
    .y(d => centroids('orange','orange')(d))
    .curve(d3.curveMonotoneX),

    blue:d3.line()
    .x(d => xScale_sparkline(d.projected_x))
    .y(d => centroids('blue','blue')(d))
    .curve(d3.curveMonotoneX)
  }
  )
}

function _rectsHeightScale(d3,height,margin) {
  return d3.scaleLinear()
  .domain([-100,0])
  .range([0,3/40*(height - margin.bottom - margin.top)])
}

function _yScaleRidership(d3,offsets) {
  return d3.scaleLinear()
  .domain([-100,0])
  .range(offsets)
}

function _ridership_yscales(yScaleRidership,height,margin) {
  return (
  {
    blue:yScaleRidership([1/7*(6*height - 6*margin.bottom + margin.top),
                          1/4*(3*height - 3*margin.bottom + margin.top)]),
    orange:yScaleRidership([1/28*(17*height - 17*margin.bottom + 11*margin.top),
                            1/2*(height - margin.bottom + margin.top)]),
    red_a:yScaleRidership([1/14*(3*height - 3*margin.bottom + 11*margin.top),
                           1/28*(3*height - 3*margin.bottom + 25*margin.top)]),
    red_b:yScaleRidership([1/28*(3*height - 3*margin.bottom + 25*margin.top),
                           margin.top]),
    green_b:yScaleRidership([1/7*(3*height - 3*margin.bottom + 4*margin.top),
                           1/28*(9*height - 9*margin.bottom + 19*margin.top)]),
    green_c:yScaleRidership([1/28*(9*height - 9*margin.bottom + 19*margin.top),
                           1/14*(3*height - 3*margin.bottom + 11*margin.top)]),
    green_d:yScaleRidership([1/14*(3*height - 3*margin.bottom + 11*margin.top),
                           1/28*(3*height - 3*margin.bottom + 25*margin.top)]),
    green_e:yScaleRidership([1/28*(3*height - 3*margin.bottom + 25*margin.top),
                           margin.top]),
 }
)
}


/*
 * DATA FLOW
 */

async function main(d3) {

  const covid19    = await _covid19(d3)
  const employment = await _employment(d3)
  const ridership  = await _ridership(d3)
  const validationsAndIncomes = await _validationsAndIncomes(d3)

  function draw(d3,covid19,employment,ridership,validationsAndIncomes,width) {

    const margin = _margin();
    const colors = _colors();
    const employment_medata = _employment_medata();
    const height = _height(width);
    const padding_between_charts = _padding_between_charts(height);


    const bostonData = _bostonData(d3,covid19);
    const bostonDataEmployment = _bostonDataEmployment(d3,employment);
    const allDates = _allDates(bostonDataEmployment,bostonData);
    const ridershipFormatted = _ridershipFormatted(d3,ridership);
    const ridershipData = _ridershipData(allDates,ridershipFormatted);
    const validationAndIncomeFormatted = _validationAndIncomeFormatted(d3,validationsAndIncomes);
    const validationAndIncomeData = _validationAndIncomeData(allDates,validationAndIncomeFormatted);
    const tokenStationTimeseries = _tokenStationTimeseries(validationAndIncomeData);
    const maxStationDate = _maxStationDate(tokenStationTimeseries);
    const incomeDataStatic = _incomeDataStatic(allDates,validationAndIncomeData);
   
    const bisectDate = _bisectDate(d3);
    const xScale = _xScale(d3,allDates,margin,width);
    const yScale = _yScale(d3,bostonData,padding_between_charts,height,margin);
    function scaleBandInvert(scale) { return _scaleBandInvert(scale) };
    const xAxis = _xAxis(d3,height,margin,padding_between_charts,xScale);
    const yAxis = _yAxis(d3,margin,yScale,bostonData,width);
    const xAxisEmp = _xAxisEmp(d3,padding_between_charts,height,margin,xScale);
    const yScaleEmp = _yScaleEmp(d3,bostonDataEmployment,padding_between_charts,height,margin);
    const yAxisEmp = _yAxisEmp(d3,margin,bostonDataEmployment,width,yScaleEmp,padding_between_charts,height);
    function employmentLine(field) { return _employmentLine(d3,xScale,yScaleEmp,field) };
    function ridershipLine(mbta_line_scale) { return _ridershipLine(d3,xScale,mbta_line_scale)};
    function yScaleLine(offsets) { return _yScaleLine(d3,ridership,offsets)};
    const yScalesMBTA = _yScalesMBTA(yScaleLine,height,margin,padding_between_charts);
    function yAxisLine(lineScale) { return _yAxisLine(d3,lineScale,margin,width)};
    const yAxesMBTA = _yAxesMBTA(d3,yAxisLine,yScalesMBTA,margin,width,padding_between_charts,height);
    function xAxisLine(offset) { return _xAxisLine(d3,xScale,offset)};
    const xAxesMBTA = _xAxesMBTA(d3,xAxisLine,height,margin,padding_between_charts,xScale);
    function yScaleSparkline(offsets) { return _yScaleSparkline(d3,offsets)};
    function yAxisSparkLine(line) { return _yAxisSparkLine(d3,sparkline_yscales,line)};
    function sparklineMaker(line) { return _sparklineMaker(d3,line,xScale_sparkline,sparkline_yscales)};
    function sparklineAreaMaker(line) { return _sparklineAreaMaker(d3,line,xScale_sparkline,sparkline_yscales)};
    const sparkline_yscales = _sparkline_yscales(height,margin,yScaleSparkline);
    const xScale_sparkline = _xScale_sparkline(d3,incomeDataStatic,margin,width);
    const sparkline_scale_annotation = _sparkline_scale_annotation(d3,xScale_sparkline);
    const axis_flush = _axis_flush(d3,xScale_sparkline,incomeDataStatic,sparkline_scale_annotation);
    const sparklinesXAxis = _sparklinesXAxis(d3,sparkline_scale_annotation,margin,height,axis_flush);
    const green_line_flush = _green_line_flush(d3,incomeDataStatic);
    const sparkline_metadata = _sparkline_metadata(green_line_flush);

    function centroids(line_low,line_high) { return _centroids(sparkline_metadata,ridership_yscales,line_low,line_high)};
    const trackLines = _trackLines(d3,xScale_sparkline,centroids);
    
    const rectsHeightScale = _rectsHeightScale(d3,height,margin);
    function yScaleRidership(offsets)  { return _yScaleRidership(d3,offsets)};
    const ridership_yscales = _ridership_yscales(yScaleRidership,height,margin);

    const visualization = _visualization(d3,width,height,margin,padding_between_charts,
        allDates,maxStationDate,
        bostonData,xScale,yScale,colors,xAxis,yAxis,scaleBandInvert,
        bostonDataEmployment,bisectDate,employment_medata,employmentLine,yScaleEmp,xAxisEmp,yAxisEmp,
        ridershipData,ridershipLine,yScalesMBTA,xAxesMBTA,yAxesMBTA,
        sparklinesXAxis,incomeDataStatic,yAxisSparkLine,xScale_sparkline,sparkline_metadata,sparklineAreaMaker,sparklineMaker,sparkline_yscales,
        validationAndIncomeData,ridership_yscales,rectsHeightScale,trackLines);

  }

  let width = document.body.clientWidth;
  draw(d3,covid19,employment,ridership,validationsAndIncomes,width);
}

main(d3);

