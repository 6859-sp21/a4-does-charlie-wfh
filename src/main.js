import * as d3 from 'd3';
import { sliderBottom } from 'd3-simple-slider';

function _intro_visualization(d3, intro_width, intro_height,allDates,bostonData,xScaleIntro,yScaleIntro,colors,xAxisIntro,yAxisIntro,
				intro_padding_between_charts,bostonDataEmployment,intro_margin,bisectDate,employment_medata,employmentLineIntro,yScaleEmpIntro,
				xAxisEmpIntro,yAxisEmpIntro,ridershipData,xAxesMBTAIntro,ridershipLineIntro,yScalesMBTAIntro,yAxesMBTAIntro,scaleBandInvert,maxStationDate) {

  // Canvas Setup
  const svg = d3
  .select('#intro-viz')
  .append('svg')
  .attr('width', intro_width)
  .attr('height', intro_height)
  .attr('viewBox', [0,0,intro_width,intro_height]);

  // White Background (For fullscreen view)
  const background = svg.append("rect")
  .attr("width",intro_width)
  .attr("height",intro_height)
  .attr("fill","white")
 
  let currentDate = allDates[65];
  let currentDateMBTA  = currentDate > maxStationDate ? maxStationDate : currentDate;
  
  /*
  COVID-19 New Cases Rate Panel
  */
  
  const covid_group = svg.append("g");
  
  // Join covid data to bars 
  covid_group
  .selectAll("rect")
  .data(bostonData)
  .join("rect")
  .attr("class","covid-bars")
  .attr("x",d=>xScaleIntro(d.date))
  .attr("y",d=>yScaleIntro(d.new_case_rate))
  .attr("fill",colors.covid_off)
  .attr("height",d=>yScaleIntro(0)-yScaleIntro(d.new_case_rate))
  .attr("width",xScaleIntro.bandwidth())
  .attr("date",d=>d.date);

  // Color elapsed time bars with different color
  covid_group.selectAll("rect.covid-bars")
    .filter(d => xScaleIntro(d.date) <= xScaleIntro(currentDate))
    .attr("fill",colors.covid_on);
    
  // Add covid axes
  covid_group.append("g").call(xAxisIntro).style("font-size","12px");
  covid_group.append("g").call(yAxisIntro).style("font-size","12px");
  
  /*
  Employment Change Panel
  */
 
  const employment_group = svg.append("g");
  
  // Fix employment level label positions
  let employmentLength = bostonDataEmployment.length;
  let labelsXPosition  = xScaleIntro(bostonDataEmployment[employmentLength-1].date)+intro_margin.left/2;
  
  // Time-bisect to find nearest available employment date
  let currentXIndex    = Math.min(bisectDate(bostonDataEmployment,currentDate),employmentLength-1);
  let currentXPosition = xScaleIntro(bostonDataEmployment[currentXIndex].date)
    
  // Add vertical dashed date tracker
  employment_group.append("line")
    .attr('class','epilog-emp')
    .attr("style", "stroke:#999; stroke-width:0.5; stroke-dasharray: 5 3;")
    .attr("y1",1/3*(-intro_padding_between_charts + 2*intro_height - 2*intro_margin.bottom + intro_margin.top))
    .attr("y2", 1/3*(intro_padding_between_charts + intro_height - intro_margin.bottom + 2*intro_margin.top))
    .attr("x1", currentXPosition)
    .attr("x2", currentXPosition); 
  
  // loop over employment levels
  for (const employmentLevel in employment_medata){
    
    // Employment paths
    employment_group.append("path")
      .attr("fill", "none")
      .attr("stroke",colors[employmentLevel])
      .attr("stroke-miterlimit", 1)
      .attr("stroke-width", 2)
      .attr("d", employmentLineIntro(employmentLevel)(bostonDataEmployment));
    
    // Employment labels
    employment_group.append('text')
      .attr('x',labelsXPosition)
      .attr('y',yScaleEmpIntro(bostonDataEmployment[employmentLength-1][employmentLevel]))
      .attr('font-size', '14px')
      .text(employment_medata[employmentLevel].label);
    
    // Tooltips
    employment_group.append('circle')
      .attr('class',employmentLevel)
      .attr('cx',currentXPosition)
      .attr('cy',yScaleEmpIntro(bostonDataEmployment[currentXIndex][employmentLevel]))
      .attr('r',5)
      .attr('fill',colors[employmentLevel]);
  }
  // Add employment axes
  employment_group.append("g").call(xAxisEmpIntro).style("font-size","12px");
  employment_group.append("g").call(yAxisEmpIntro).style("font-size","12px");

  /*
  Ridership Change Panel
  */
  
  const ridership_group = svg.append("g");
  
  // Time-bisect to find nearest available ridership date
  let ridershipLength       = ridershipData.blue.length;
  let currentXIndexLines    = Math.min(bisectDate(ridershipData.blue,currentDate),ridershipLength-1);
  let currentXPositionLines = xScaleIntro(ridershipData.blue[currentXIndexLines].date)
 
  // Add vertical dashed date tracker
  ridership_group.append("line")
    .attr('class','epilog-lines')
    .attr("style", "stroke:#999; stroke-width:0.5; stroke-dasharray: 5 3;")
    .attr("y1",1/3*(2*intro_height - 2*intro_margin.bottom + intro_margin.top + 2*intro_padding_between_charts))
    .attr("y2", intro_height-intro_margin.bottom)
    .attr("x1", currentXPositionLines)
    .attr("x2", currentXPositionLines);
  
  // Loop over MBTA lines
  for (const line in xAxesMBTAIntro) {
    
    //Draw path
    ridership_group.append("path")
      .attr("fill", "none")
      .attr("stroke",colors[line])
      .attr("stroke-miterlimit", 1)
      .attr("stroke-width", 2)
      .attr("d", ridershipLineIntro(yScalesMBTAIntro[line])(ridershipData[line]));

    //Add tooltip
    ridership_group.append('circle')
      .attr('class',line)
      .attr('cx',currentXPositionLines)
      .attr('cy',yScalesMBTAIntro[line](ridershipData[line][currentXIndexLines].ridership))
      .attr('r',5)
      .attr('fill',colors[line]);
    
    // Add axes
    ridership_group.append("g").call(xAxesMBTAIntro[line]).style("font-size","12px");
    ridership_group.append("g").call(yAxesMBTAIntro[line]).style("font-size","12px");
  }
   
  /*
  Mousemove interactivity
  Need to restrict to right panel or otherwise 'pin'
  */
  
  svg.on('mousemove', (event) => { 
    // Time-bisect to find nearest available dates
    currentDate      = scaleBandInvert(xScaleIntro)(d3.pointer(event)[0]);
    currentDateMBTA  = currentDate > maxStationDate ? maxStationDate : currentDate;
    currentXIndex    = Math.min(bisectDate(bostonDataEmployment,currentDate),employmentLength-1);
    currentXPosition = xScaleIntro(bostonDataEmployment[currentXIndex].date);
    currentXIndexLines    = Math.min(bisectDate(ridershipData.blue,currentDate),ridershipLength-1);                 
    currentXPositionLines = xScaleIntro(ridershipData.blue[currentXIndexLines].date);

    // Covid-bar charts
    covid_group.selectAll("rect.covid-bars")
      .filter(d => d.date <= currentDate)
      .attr("fill",colors.covid_on);

    covid_group.selectAll("rect.covid-bars")
      .filter(d => d.date > currentDate)
      .attr("fill",colors.covid_off);

    // Dashed epilogs
    employment_group.select('line.epilog-emp')
      .attr("x1",currentXPosition)
      .attr('x2',currentXPosition);

    ridership_group.select('line.epilog-lines')
      .attr("x1",currentXPositionLines)
      .attr('x2',currentXPositionLines);

    // employment tooltips
    for (const employmentLevel in employment_medata){
      employment_group.select(`circle.${employmentLevel}`)
        .attr("cx",currentXPosition)
        .attr('cy',yScaleEmpIntro(bostonDataEmployment[currentXIndex][employmentLevel]));
    }

    // MBTA tooltips
    for (const line in xAxesMBTAIntro) {

      ridership_group.select(`circle.${line}`)
        .attr("cx",currentXPositionLines)
        .attr('cy',yScalesMBTAIntro[line](ridershipData[line][currentXIndexLines].ridership));    
    }

  });
  
  //covid_group.attr('visibility','hidden');
  //employment_group.attr('visibility','hidden');
  //ridership_group.attr('visibility','hidden');


  return svg.node();

}

function _single_highlight_visualization(d3,svg_text,allDates,maxStationDate,highlight_margin,pathTween,validationAndIncomeFormatted,incomeDataStatic,
					sparklineAreaMakerHighlight,sparklineMakerHighlight,xScale_highlight,yScale_highlight,validationAndIncomeData,colors,rectsHeightScale,
					highlight_xAxis,highlight_yAxis,slider,callout,width,highlight_height,bisectDate,ridershipData) {
  
  // Canvas Setup
  const document = (new DOMParser).parseFromString(svg_text, "image/svg+xml");
  d3.select("#single-highlight-viz").node().append(document.documentElement);
  
  const svg = d3.select('#single-highlight-viz svg');

    // Make an svg tooltip to keep things contained in one div
  const tooltip = svg.append("g");

  // Define inside function to minimize global variables in translating to vanilla JS
  let active_line = 'red_b';
  let active_map = 'path_map_d';

  let currentDate = allDates[65];
  let currentDateMBTA  = currentDate > maxStationDate ? maxStationDate : currentDate;
  
  const paths_metadata = (
  {
   blue:({col:"#244995"}),
   green_e:({col:"#bae4b3"}),
   green_d:({col:"#74c476"}),
   green_c:({col:"#31a354"}),
   green_b:({col:"#006d2c"}),
   orange:({col:"#ef7d15"}),
   red_b:({col:"#fc9272"}),
   red_a:({col:"#de2d26"})
  }
  );
  
  for (const line of Object.keys(paths_metadata)) {

    // Append geographically-accurate paths to metadata object
    // and set visibility to hidden
    paths_metadata[line]['path_accurate'] = svg.selectAll("#"+line+"_accurate")
      .attr('visibility','hidden');
    
    // Append map paths to metadata object
    // and style each line according to color
    paths_metadata[line]['path_map'] = svg.selectAll("#"+line+"_map")
      .attr('stroke',"gainsboro")
      .on("click",function(event) {

      paths_metadata[active_line]['path_map']
        .attr('stroke',"gainsboro");
      
      svg.selectAll(`path.sparkarea-${active_line}`)
        .attr("visibility",'hidden');

      svg.selectAll(`path.sparkline-${active_line}`)
        .attr("visibility",'hidden');

      svg.selectAll(`circle.dots-${active_line}`)
        .attr("visibility",'hidden');

      svg.selectAll(`line.trackline-${active_line}`)
        .attr("visibility",'hidden');

      svg.selectAll(`rect.tracks-${active_line}`)
        .attr("visibility",'hidden');

      d3.select(this)
        .attr('stroke',paths_metadata[line]['col']);

      active_line = line;
      
      svg.selectAll(`path.sparkarea-${active_line}`)
        .attr("visibility",'visible');

      svg.selectAll(`path.sparkline-${active_line}`)
        .attr("visibility",'visible');

      svg.selectAll(`circle.dots-${active_line}`)
        .attr("visibility",'visible');

      svg.selectAll(`line.trackline-${active_line}`)
        .attr("visibility",'visible');

      svg.selectAll(`rect.tracks-${active_line}`)
        .attr("visibility",'visible');

    });
    
    paths_metadata[line]['path_accurate_d'] = paths_metadata[line]['path_accurate'].attr('d');
    paths_metadata[line]['path_map_d'] = paths_metadata[line]['path_map'].attr('d');
   
  };
 
  // Add toggle div
  svg
    .append("text")
    .attr("x", highlight_margin.left)
    .attr("y", highlight_margin.top/3)
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .attr("fill", "currentColor")
    .attr("text-anchor", "start")
    .attr("alignment-baseline","text-before-edge")
    .text("Toggle map")
    .attr("class","toggle")
    .on("click", function(d) {

    if (active_map=='path_accurate_d') {

      svg.selectAll("path[id$='_station']")
        .transition()
        .duration(3000)
        .attr('pointer-events','all')
        .attr("opacity", 1)
        .attr("stroke-opacity", 1);

      svg.selectAll("path[id$='_station_accurate']")
        .transition()
        .duration(3000)
        .attr('pointer-events','none')
        .attr("opacity", 0)
        .attr("stroke-opacity", 0);

      active_map = 'path_map_d';

    } else {

      svg.selectAll("path[id$='_station_accurate']")
        .transition()
        .duration(3000)
        .attr('pointer-events','all')
        .attr("opacity", 1)
        .attr("stroke-opacity", 1);

      svg.selectAll("path[id$='_station']")
        .transition()
        .duration(3000)
        .attr('pointer-events','none')
        .attr("opacity", 0)
        .attr("stroke-opacity", 0);

      active_map = 'path_accurate_d';
    };

    for (const line of Object.keys(paths_metadata)) {

      paths_metadata[line]['path_map']
        .transition()
        .duration(3000)
        .attrTween("d", pathTween(paths_metadata[line][active_map], 1));
    };
  });

  
  // Select stations
  svg.selectAll("path[id*='_station']")
    .attr('style','null')
    .attr('fill','white')
    .attr('stroke','black')
    .attr('stroke-width',0.13229167)
    .on("mouseover",function(event) {

    const el = d3.select(this);
    const {x, y, width: w, height: h} = el.node().getBBox();
    const station_name = el.attr("id").split("_")[0]
    const station_record = validationAndIncomeFormatted
  .filter(d => d.station === station_name && d.date.getTime() == currentDateMBTA.getTime())[0]
    
    el
    .attr("transform", 
          `translate(${x+w/2},${y+h/2}) 
           scale(3.5) 
           translate(${-x-w/2},${-y-h/2})`);
    
    tooltip
      .attr("transform",`translate(${d3.pointer(event,this)[0]} ${d3.pointer(event,this)[1]})`)
      .call(callout,`${station_name}\nmedian income:${d3.format(".2s")(station_record.median_income)}\nvalidations change:${d3.format(".0%")(station_record.validation_change/100)}`);
    
  })
    .on("mouseout",function(event) {
    d3.select(this).attr('transform',null);
    tooltip.call(callout,null);
  });
  
  svg.selectAll("path[id$='_station_accurate']")
    .attr("opacity", 0)
    .attr("stroke-opacity", 0);
  
 
  

  for (const line in incomeDataStatic) {

    svg
      .append("path")
      .attr("class","sparkarea-"+line)
      .attr("visibility",'hidden')
      .attr("fill", colors[line])
      .attr("opacity", 0.2)
      .attr("stroke","none")
      .attr("d", sparklineAreaMakerHighlight(incomeDataStatic[line]));
    
    svg  
      .append("path")
      .attr("class","sparkline-"+line)
      .attr("visibility",'hidden')
      .attr("fill", "none")
      .attr("stroke",colors[line])
      .attr("stroke-miterlimit", 1)
      .attr("stroke-width", 2)
      .attr("d", sparklineMakerHighlight(incomeDataStatic[line]));


    svg.selectAll("dot")
      .data(incomeDataStatic[line])
      .join("circle")
      .attr("class","dots-"+line)
      .attr("visibility",'hidden')
      .attr("r", 3)
      .attr("fill","white")
      .attr("stroke","black")
      .attr("stroke-width", 1)
      .attr("cx", d=>xScale_highlight(d.projected_x))
      .attr("cy", d=>yScale_highlight(d.median_income));
    

    svg
      .append("line")
      .attr("class","trackline-"+line)
      .attr("visibility",'hidden')
      .attr("stroke", colors[line])
      .attr("opacity", 0.5)
      .attr("fill", "none")
      .attr('stroke-linecap','round')
      .attr("stroke-miterlimit", 1)
      .attr("stroke-width", 5)
      .attr('x1',xScale_highlight(0))
      .attr('x2',xScale_highlight(d3.max(incomeDataStatic[line].map(d=>+d.projected_x))))
      .attr('y1',yScale_highlight(315000))
      .attr('y2',yScale_highlight(315000));
    
    svg
      .selectAll("rects")
      .data(validationAndIncomeData[line]
            .filter(
      d=> 
      d.date.getTime()==currentDateMBTA.getTime()))
      .join("rect")
      .attr("class",`tracks-${line}`)
      .attr("visibility",'hidden')
      .attr("fill",d=> (d.validation_change != "0.") ? colors[line]: colors.covid_off)
      .attr("x", d => xScale_highlight(d.projected_x)-width/300)
      .attr("y", d=>yScale_highlight(315000)-rectsHeightScale(Math.min(+d.validation_change,0)))
      .attr("height", d=>2*rectsHeightScale(Math.min(+d.validation_change,0)))
      .attr("width",width/150)
      .attr("opacity",0.5);

  }
  
  paths_metadata[active_line]['path_map']
    .attr('stroke',paths_metadata[active_line]['col']);

  svg.selectAll(`path.sparkarea-${active_line}`)
    .attr("visibility",'visible');

  svg.selectAll(`path.sparkline-${active_line}`)
    .attr("visibility",'visible');
  
  svg.selectAll(`circle.dots-${active_line}`)
    .attr("visibility",'visible');

  svg.selectAll(`line.trackline-${active_line}`)
    .attr("visibility",'visible');

  svg.selectAll(`rect.tracks-${active_line}`)
    .attr("visibility",'visible');
  
 
  const slider_g = svg
    .append('g')
    .attr('transform', `translate(${xScale_highlight(0)+highlight_margin.left/2},${highlight_height-2*highlight_margin.bottom})`);

  slider_g
    .call(
    slider.on('drag',function(datum) {
      
      
      currentDate = allDates[bisectDate(ridershipData.blue,datum)];
      currentDateMBTA = currentDate > maxStationDate ? maxStationDate : currentDate;

      for (const line in validationAndIncomeData) {

        svg.selectAll(`rect.tracks-${line}`)
          .data(validationAndIncomeData[line]
                .filter(
          d=> 
          d.date.getTime()==currentDateMBTA.getTime()),d=>d.station)
          .join(
          enter  => enter,
          update => update
          .attr("y", d=>yScale_highlight(315000)-rectsHeightScale(Math.min(+d.validation_change,0)))
          .attr("height", d=>2*rectsHeightScale(Math.min(+d.validation_change,0))),
          exit => exit
        )

      };
    }));


  svg.append("g").call(highlight_xAxis).style("font-size","12px");
  svg.append("g").call(highlight_yAxis).style("font-size","12px");
  
  svg.append("g")
    .append("text")
    .attr("x", xScale_highlight(0)+highlight_margin.left/3)
    .attr("y", yScale_highlight(200000)-highlight_margin.top/3)
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .attr("fill", "currentColor")
    .attr("text-anchor", "start")
    .text("Median household income ($)");

  svg.append("g")
    .append("text")
    .attr("x", xScale_highlight(0)+highlight_margin.left/3)
    .attr("y", highlight_margin.top/3)
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .attr("fill", "currentColor")
    .attr("text-anchor", "start")
    .attr("alignment-baseline","text-before-edge")
    .text("Seasonally adjusted ridership");

  return svg.node();

}

function _martini_visualization(d3,width,height,margin,padding_between_charts,
	allDates,maxStationDate,
	bostonData,xScale,yScale,colors,xAxis,yAxis,scaleBandInvert,
	bostonDataEmployment,bisectDate,employment_medata,employmentLine,yScaleEmp,xAxisEmp,yAxisEmp,
	ridershipData,ridershipLine,yScalesMBTA,xAxesMBTA,yAxesMBTA,
	sparklinesXAxis,incomeDataStatic,yAxisSparkLine,xScale_sparkline,sparkline_metadata,sparklineAreaMaker,sparklineMaker,sparkline_yscales,
	validationAndIncomeData,ridership_yscales,rectsHeightScale,trackLines) {

  //d3.select('#martini-glass-viz svg').remove();

  // Canvas Setup
  const svg = d3
  .select('#martini-glass-viz')
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
      .attr('font-size', '16px')
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
    .attr("x", margin.left*3/2)
    .attr("y", margin.top)
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .attr("fill", "currentColor")
    .attr("text-anchor", "start")
    .text("Seasonally adjusted change in ridership");
  
  svg
    .append("text")
    .attr("x", margin.left*3/2)
    .attr("y", sparkline_yscales['red_b'](200000))
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .attr("fill", "currentColor")
    .attr("text-anchor", "start")
    .text("Median household income ($)");

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
 * EXTERNAL SVG
 */

async function _svg_text(d3) {
  return d3
  .text('./individual_line_maps.svg');
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
  return Math.floor(0.98*width * window.innerHeight / document.body.clientWidth)
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
        .attr('font-size', '16px')
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
          .attr('font-size', '16px')
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
        .attr('font-size', '16px')
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
        .attr('font-size', '16px')
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
 * INTRO VIZ
 */

const _intro_width = ()  => 750
const _intro_height = () => 500
const _intro_margin = () => ({top: 25, right: 25, bottom: 25, left: 25})

function _intro_padding_between_charts(intro_height) {
  return Math.floor(intro_height/100)*10
}

function _xScaleIntro(d3,allDates,intro_margin,intro_width) {
  return d3.scaleBand()
    .domain(allDates)
    .range([intro_margin.left, intro_width - intro_margin.right])
    .paddingInner(0.5)
    .paddingOuter(0)
}

function _yScaleIntro(d3,bostonData,intro_padding_between_charts,intro_height,intro_margin) {
  return d3.scaleLinear()
    .domain([0, d3.max(bostonData.map(d => d.new_case_rate))])
    .range([1/3*(-2*intro_padding_between_charts + intro_height - intro_margin.bottom + 2*intro_margin.top), 
          intro_margin.top])
}

function _xAxisIntro(d3,intro_height,intro_margin,intro_padding_between_charts,xScaleIntro) {
  return g => g
    .attr("transform", `translate(0,${
          1/3*(intro_height - intro_margin.bottom + 2*intro_margin.top - 2*intro_padding_between_charts)
          })`)
    .call(
      d3.axisBottom(xScaleIntro)
       .tickFormat(d3.timeFormat("%b %y"))
       .tickValues(xScaleIntro.domain().filter(d => d.getDate() == 1 && (d.getMonth() % 2)==0))
       .tickSizeOuter(0))
}

function _yAxisIntro(d3,yScaleIntro,intro_margin,bostonData) {
  return g => g
    .attr("transform", `translate(${intro_margin.left},0)`)
    .call(d3.axisLeft(yScaleIntro).ticks(null, bostonData.format))
    .call(g => g.append("text")
        .attr("x", intro_margin.left/2)
        .attr("y", intro_margin.top/2)
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .attr("alignment-baseline","text-before-edge")
        .text("New covid cases in Boston per 100,000 people")
        )
}

function _xAxisEmpIntro(d3,intro_padding_between_charts,intro_height,intro_margin,xScaleIntro) {
  return g => g
    .attr("transform", `translate(0,${
          1/3*(-intro_padding_between_charts + 2*intro_height - 2*intro_margin.bottom +intro_margin.top)})`)
    .call(
      d3.axisBottom(xScaleIntro)
       .tickFormat(d3.timeFormat("%b %y"))
       .tickValues(xScaleIntro.domain().filter(d => d.getDate() == 1 && (d.getMonth() % 2)==0))
       .tickSizeOuter(0))
}

function _yScaleEmpIntro(d3,bostonDataEmployment,intro_padding_between_charts,intro_height,intro_margin) {
  return d3.scaleLinear()
  .domain([1.1*d3.min(bostonDataEmployment.map(d=>+d.emp_low)), 
           1.1*d3.max(bostonDataEmployment.map(d=>+d.emp_high))])
  .range([
    1/3*(-intro_padding_between_charts + 2*intro_height - 2*intro_margin.bottom + intro_margin.top), 
    1/3*(intro_padding_between_charts + intro_height - intro_margin.bottom + 2*intro_margin.top)])
}

function _yAxisEmpIntro(d3,intro_margin,yScaleEmpIntro,bostonDataEmployment,intro_padding_between_charts,intro_height) {
  return g => g
    .attr("transform", `translate(${intro_margin.left},0)`)
    .call(d3.axisLeft(yScaleEmpIntro).ticks(null, bostonDataEmployment.format))
    .call(g => g.append("text")
          .attr("x", intro_margin.left/2)
          .attr("y", 1/3*(intro_padding_between_charts + intro_height - intro_margin.bottom + 2*intro_margin.top)-intro_margin.top/2)
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("Seasonally adjusted change in employment (%)")
        )
}

function _employmentLineIntro(d3,xScaleIntro,yScaleEmpIntro,field) {
  return d3.line()
    .x(d => xScaleIntro(d.date) + xScaleIntro.bandwidth() / 2)
    .y(d => yScaleEmpIntro(d[field]))
}

function _ridershipLineIntro(d3,xScaleIntro,mbta_line_scale) {
    return d3.line()
    .x(d => xScaleIntro(d.date) + xScaleIntro.bandwidth() / 2)
    .y(d => mbta_line_scale(d.ridership))
}

function _yScalesMBTAIntro(yScaleLine,intro_height,intro_margin,intro_padding_between_charts) {
  return (
  {
    blue:yScaleLine([
      1/4*(3*intro_height - 3*intro_margin.bottom + intro_margin.top + 2*intro_padding_between_charts),
      1/3*(2*intro_height - 2*intro_margin.bottom + intro_margin.top + 2*intro_padding_between_charts)
    ]),
    green:yScaleLine([
      1/6*(5*intro_height - 5*intro_margin.bottom + intro_margin.top + 2*intro_padding_between_charts), 
      1/4*(3*intro_height - 3*intro_margin.bottom + intro_margin.top + 2*intro_padding_between_charts)
    ]),
    orange:yScaleLine([
      1/12*(11*intro_height - 11*intro_margin.bottom + intro_margin.top +2*intro_padding_between_charts), 
      1/6*(5*intro_height - 5*intro_margin.bottom + intro_margin.top + 2*intro_padding_between_charts)
    ]),
    red:yScaleLine([
      intro_height-intro_margin.bottom, 
      1/12*(11*intro_height - 11*intro_margin.bottom + intro_margin.top +2*intro_padding_between_charts)
    ]),
  }
)
}

function _yAxisLineIntro(d3,intro_margin,lineScale) {
    return g => g
    .attr("transform", `translate(${intro_margin.left},0)`)
    .call(d3.axisLeft(lineScale).tickValues([-50,0]))
}

function _yAxesMBTAIntro(d3, yAxisLineIntro, yScalesMBTAIntro, intro_margin, intro_height, intro_padding_between_charts) {
  return (
  {
    blue:yAxisLineIntro(yScalesMBTAIntro.blue),
    green:yAxisLineIntro(yScalesMBTAIntro.green),
    orange:yAxisLineIntro(yScalesMBTAIntro.orange),
    red: g => g
    .attr("transform", `translate(${intro_margin.left},0)`)
    .call(d3.axisLeft(yScalesMBTAIntro.red).tickValues([-50,0]))
    .call(g => g.append("text")
        .attr("x", intro_margin.left/2)
        .attr("y", 1/3*(2*intro_height - 2*intro_margin.bottom + intro_margin.top + 2*intro_padding_between_charts)-intro_margin.top/2)
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("Seasonally adjusted change in MBTA ridership (%)")
        )
  }
)
}

function _xAxisLineIntro(d3,xScaleIntro,offset) {
    return g => g
    .attr("transform", `translate(0,${offset})`)
    .call(
      d3.axisBottom(xScaleIntro)
       .tickFormat("")
       .tickValues(xScaleIntro.domain().filter(d => d.getDate() == 1 && (d.getMonth() % 2)==0))
       .tickSizeOuter(0))
}

function _xAxesMBTAIntro(d3,xAxisLineIntro,intro_height,intro_margin,intro_padding_between_charts,xScaleIntro) {
  return (
  {
    blue:xAxisLineIntro(1/4*(3*intro_height - 3*intro_margin.bottom + intro_margin.top + 2*intro_padding_between_charts)),
    
    green:xAxisLineIntro(1/6*(5*intro_height - 5*intro_margin.bottom + intro_margin.top + 2*intro_padding_between_charts)),
    
    orange:xAxisLineIntro(1/12*(11*intro_height - 11*intro_margin.bottom + intro_margin.top +2*intro_padding_between_charts)),
    
    red: g => g
    .attr("transform", `translate(0,${intro_height-intro_margin.bottom})`)
    .call(
      d3.axisBottom(xScaleIntro)
       .tickFormat(d3.timeFormat("%b %y"))
       .tickValues(xScaleIntro.domain().filter(d => d.getDate() == 1 && (d.getMonth() % 2)==0))
       .tickSizeOuter(0))
  }
)
}

/* 
 * HIGHLIGHT VIZ
 */

function _pathTween(d3,d1,precision) {
  return function() {
    var path0 = this,
        path1 = path0.cloneNode(),
        n0 = path0.getTotalLength(),
        n1 = (path1.setAttribute("d", d1), path1).getTotalLength();

    // Uniform sampling of distance based on specified precision.
    var distances = [0], i = 0, dt = precision / Math.max(n0, n1);
    while ((i += dt) < 1) distances.push(i);
    distances.push(1);

    // Compute point-interpolators at each distance.
    var points = distances.map(function(t) {
      var p0 = path0.getPointAtLength(t * n0),
          p1 = path1.getPointAtLength(t * n1);
      return d3.interpolate([p0.x, p0.y], [p1.x, p1.y]);
    });

    return function(t) {
      return t < 1 ? "M" + points.map(function(p) { return p(t); }).join("L") : d1;
    };
  };
}

function _callout() {
  return (g, value) => {
  
  if (!value) return g.style("display", "none");

  g
      .style("display", null)
      .style("pointer-events", "none")
      .style("font", "14px sans-serif");

  const path = g.selectAll("path")
    .data([null])
    .join("path")
      .attr("fill", "white")
      .attr("stroke", "black");

  const text = g.selectAll("text")
    .data([null])
    .join("text")
    .call(text => text
      .selectAll("tspan")
      .data((value + "").split(/\n/))
      .join("tspan")
        .attr("x", 0)
        .attr("y", (d, i) => `${i * 1.1}em`)
        .style("font-weight", (_, i) => i ? null : "bold")
        .text(d => d));

  const {x, y, width: w, height: h} = text.node().getBBox();

  text.attr("transform", `translate(${-w / 2},${15 - y})`);
  path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
  
}
}

function _slider(d3,allDates,xScale) {
return sliderBottom()
.min(d3.min(allDates))
.max(d3.max(allDates))
.step(1000 * 60 * 60 * 24)
.width(250)
.tickFormat(d3.timeFormat("%b %y"))
.tickValues(xScale.domain().filter(d => d.getDate() == 1 && (d.getMonth() % 2)==0))
.default(allDates[65])
}

const _highlight_width = () => 750
const _highlight_height = () => 500
const _svg_width = () => 400
const _highlight_margin = () => ({left:25,right:25,top:25,bottom:25})

function _xScale_highlight(d3,incomeDataStatic,svg_width,highlight_margin,highlight_width) {
  return d3.scaleLinear()
  .domain([0,d3.max(incomeDataStatic.red_b.map(d=>+d.projected_x))])
  .range([svg_width+highlight_margin.left*2, highlight_width-highlight_margin.right])
}

function _highlight_xAxis(d3,highlight_height,highlight_margin,xScale_highlight,svg_width,highlight_width) {
  return g => g
.attr("transform", `translate(0,${1/5*(4*highlight_height - 4*highlight_margin.bottom + 
                                       highlight_margin.top)})`)
.call(
  d3.axisBottom(xScale_highlight)
  .tickValues(d3.range(0,16.05,3).map(d=>d*0.185))
  .tickFormat(d=>d3.format(".2")(d/0.185))
  .tickSizeOuter(0))
.call(g => g.append("text")
      .attr("x", 1/2*(2*highlight_margin.left-highlight_margin.right + highlight_width + svg_width))
      .attr("y", highlight_margin.bottom*3/2)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr("fill", "currentColor")
      .attr("text-anchor", "middle")
      .text("Distance (mi)")
     )
}

function _yScale_highlight(d3,highlight_height,highlight_margin) {
  return d3.scaleLinear()
  .domain([0,200000])
  .range([1/5*(4*highlight_height - 4*highlight_margin.bottom + 
   highlight_margin.top),1/5*(2*highlight_height - 2*highlight_margin.bottom + 
   3*highlight_margin.top)])
}

function _highlight_yAxis(d3,svg_width,highlight_margin,yScale_highlight) {
  return g => g
.attr("transform", `translate(${svg_width+highlight_margin.left*2},0)`)
.call(d3.axisLeft(yScale_highlight)
      .tickValues([0,50000,100000,150000])
      .tickFormat(d3.format("~s")))
}

function _sparklineMakerHighlight(d3,xScale_highlight,yScale_highlight) {
  return d3.line()
  .x(d => xScale_highlight(d.projected_x))
  .y(d => yScale_highlight(d.median_income))
  .curve(d3.curveStep)
}

function _sparklineAreaMakerHighlight(d3,xScale_highlight,yScale_highlight) {
  return d3.area()
  .x(d => xScale_highlight(d.projected_x))
  .y1(d => yScale_highlight(d.median_income))
  .y0(d => yScale_highlight(0.))
  .curve(d3.curveStep)
}

/*
 * DATA FLOW
 */

async function main(d3) {

  const covid19    = await _covid19(d3)
  const employment = await _employment(d3)
  const ridership  = await _ridership(d3)
  const validationsAndIncomes = await _validationsAndIncomes(d3)
  const svg_text = await _svg_text(d3);

  function draw_martini(d3,covid19,employment,ridership,validationsAndIncomes,width) {

    // Martini glass

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

    const martini_visualization = _martini_visualization(d3,width,height,margin,padding_between_charts,
        allDates,maxStationDate,
        bostonData,xScale,yScale,colors,xAxis,yAxis,scaleBandInvert,
        bostonDataEmployment,bisectDate,employment_medata,employmentLine,yScaleEmp,xAxisEmp,yAxisEmp,
        ridershipData,ridershipLine,yScalesMBTA,xAxesMBTA,yAxesMBTA,
        sparklinesXAxis,incomeDataStatic,yAxisSparkLine,xScale_sparkline,sparkline_metadata,sparklineAreaMaker,sparklineMaker,sparkline_yscales,
        validationAndIncomeData,ridership_yscales,rectsHeightScale,trackLines);

  }
  
  function draw_intro(d3,covid19,employment,ridership) {

    const colors = _colors();
    const employment_medata = _employment_medata();

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
    function scaleBandInvert(scale) { return _scaleBandInvert(scale) };
    const intro_width = _intro_width();
    const intro_height = _intro_height();
    const intro_margin = _intro_margin();
    const intro_padding_between_charts = _intro_padding_between_charts(intro_height);
    const xScaleIntro = _xScaleIntro(d3,allDates,intro_margin,intro_width);
    const yScaleIntro = _yScaleIntro(d3,bostonData,intro_padding_between_charts,intro_height,intro_margin);
    const xAxisIntro = _xAxisIntro(d3,intro_height,intro_margin,intro_padding_between_charts,xScaleIntro);
    const yAxisIntro = _yAxisIntro(d3,yScaleIntro,intro_margin,bostonData);
    const xAxisEmpIntro = _xAxisEmpIntro(d3,intro_padding_between_charts,intro_height,intro_margin,xScaleIntro);
    const yScaleEmpIntro = _yScaleEmpIntro(d3,bostonDataEmployment,intro_padding_between_charts,intro_height,intro_margin);
    const yAxisEmpIntro = _yAxisEmpIntro(d3,intro_margin,yScaleEmpIntro,bostonDataEmployment,intro_padding_between_charts,intro_height);
    function employmentLineIntro(field) { return _employmentLineIntro(d3,xScaleIntro,yScaleEmpIntro,field) };
    function ridershipLineIntro(mbta_line_scale) { return _ridershipLineIntro(d3,xScaleIntro,mbta_line_scale)};
    function yScaleLine(offsets) { return _yScaleLine(d3,ridership,offsets)};
    const yScalesMBTAIntro = _yScalesMBTAIntro(yScaleLine,intro_height,intro_margin,intro_padding_between_charts);
    function yAxisLineIntro(lineScale) { return _yAxisLineIntro(d3,intro_margin,lineScale)};
    const yAxesMBTAIntro = _yAxesMBTAIntro(d3, yAxisLineIntro, yScalesMBTAIntro, intro_margin, intro_height, intro_padding_between_charts);
    function xAxisLineIntro(offset) { return _xAxisLineIntro(d3,xScaleIntro,offset)};
    const xAxesMBTAIntro =  _xAxesMBTAIntro(d3,xAxisLineIntro,intro_height,intro_margin,intro_padding_between_charts,xScaleIntro);
    

    const intro_visualization = _intro_visualization(d3, intro_width, intro_height,allDates,bostonData,xScaleIntro,yScaleIntro,colors,xAxisIntro,yAxisIntro,
                                intro_padding_between_charts,bostonDataEmployment,intro_margin,bisectDate,employment_medata,employmentLineIntro,yScaleEmpIntro,
                                xAxisEmpIntro,yAxisEmpIntro,ridershipData,xAxesMBTAIntro,ridershipLineIntro,yScalesMBTAIntro,yAxesMBTAIntro,scaleBandInvert,maxStationDate);

  }


  function draw_single_highlight(d3,svg_text,width){
    
    const height = _height(width);
    const margin = _margin();
    const colors = _colors();
    const employment_medata = _employment_medata();

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


    const highlight_width = _highlight_width();
    const highlight_height = _highlight_height();
    const svg_width = _svg_width();
    const highlight_margin = _highlight_margin();

    function pathTween(d1,precision) { return _pathTween(d3,d1,precision)};
    const callout = _callout();
    const slider = _slider(d3,allDates,xScale);
    const xScale_highlight = _xScale_highlight(d3,incomeDataStatic,svg_width,highlight_margin,highlight_width);
    const highlight_xAxis = _highlight_xAxis(d3,highlight_height,highlight_margin,xScale_highlight,svg_width,highlight_width);
    const yScale_highlight = _yScale_highlight(d3,highlight_height,highlight_margin);
    const highlight_yAxis = _highlight_yAxis(d3,svg_width,highlight_margin,yScale_highlight);
    const sparklineMakerHighlight = _sparklineMakerHighlight(d3,xScale_highlight,yScale_highlight);
    const sparklineAreaMakerHighlight = _sparklineAreaMakerHighlight(d3,xScale_highlight,yScale_highlight);

    const rectsHeightScale = _rectsHeightScale(d3,height,margin);
    const single_highlight_visualization = _single_highlight_visualization(d3,svg_text,allDates,maxStationDate,highlight_margin,pathTween,validationAndIncomeFormatted,incomeDataStatic,
                                        sparklineAreaMakerHighlight,sparklineMakerHighlight,xScale_highlight,yScale_highlight,validationAndIncomeData,colors,rectsHeightScale,
                                        highlight_xAxis,highlight_yAxis,slider,callout,width,highlight_height,bisectDate,ridershipData);

  }

  let width = document.body.clientWidth;
  let window_height = window.innerheight;

  draw_martini(d3,covid19,employment,ridership,validationsAndIncomes,width);
  draw_intro(d3,covid19,employment,ridership);
  draw_single_highlight(d3,svg_text,width);
  
}

main(d3);

