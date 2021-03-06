# Does Charlie WFH?

##### An interactive visualization comparing the drop in ridership with median income along MBTA tracks, during the COVID-19 pandemic.

###### Georgios Varnavides and Max L'Etoile.
### Intro:
In mid-march 2020, as COVID-19 cases surged across the United States, millions of people lost their jobs and many of those who didn’t were suddenly ordered to begin working from home.
Commutes abruptly contracted from miles in length to a few footsteps from the bedroom to the kitchen table, and as a result, public transportation traffic dropped precipitously.
Ridership on buses, trains, and trolleys did not, however, fall to zero.
As most of us hunkered down for the long haul, countless essential workers continued their jobs in person and kept society functioning.

In Boston, when lockdown began, employment levels dropped by over 25%, and traffic on the 4 main subway lines, collectively known as ‘the T’ fell by around 90%.
But, these headline numbers don’t tell the full story.
Not all income brackets suffered the same levels of job loss, and not all neighborhoods saw the same drop in public transit usage.
For this visualization, we sought to explore how the median income around a T-stop was related to the COVID-era drop in ridership.

### Design Decisions:
The visualization begins in a "scrolly-telling" format, walking the reader through the methodology we used to associate each T-stop with the median income of a single census tract.
In particular, since we try and peel some of the layers of abstractions we made starting from the MBTA map, to geographically-accurate locations, and finally to real-distance projected sigmoids tracks.
We also use the "scrolly-telling" format to familiarize the reader with two of the main methods of interactions, the time-like scrolling on mouse-over of covid-cases and employment changes time-series, and the ridership encodings by providing a single track view.

After this gradual introduction, the reader is presented with a full-screen data console that allows them to explore the relative drop in ridership for dozens of T-stops, across time, with median income data presented for each station. 
By design, the visual encodings for each type of data are consistent across the scroller and data panel, and the majority of these encodings were decided on early in the design process. 
Some decisions were straightforward; ridership and employment data are most naturally encoded as lines, and everyone is used to seeing time-series of COVID cases encoded as a shaded area. 
Likewise, median income as a function of distance along a given subway track is most naturally encoded as line, and we chose to add area shading to more easily distinguish between similar colors.

The design questions with less obvious answers were how to allow the user to scroll through time and how to encode relative ridership across the lines. 
In regard to the former concern, we realized that Gregorian dates had lost salience, and perhaps meaning, during the pandemic and ruled out a traditional time slider. 
We opted, instead, to have the user scroll their mouse across any of the three temporal graphs and have the rest of the data panel adjust accordingly. 
In the final version of this visualization, the ridership level, relative to the same time of year in 2019, is encoded as the width of colored bars positioned along a stylized track. 
Several grayed out bars, which represent stations for which the MBTA doesn't have ridership data, serve as size reference of a pre-pandemic baseline. 
As demonstrated in our MVP video, earlier versions of this used tracks which more closely mimicked the style of the official MBTA map and encoded the ridership data by distorting the width of the track.

### Development Process:
Outside the initial data exploration and cleaning, which we didn't formally divide, our work fell neatly into a few bins. 
George developed the final data panel and the fragments of it that are used in the scroller, Max developed the first version of the adaptive track maps shown in our video, George generated the SVGs used in the scroller, and Max developed the scroller itself. 
Additionally, we both edited, checked, and helped debug the other's work. 
Seventy people-hours is probably a conservative estimate for the time taken to develop this project, and the majority of this was broadly spent on getting the interactivity working well.

### Acknowledgments 
All our data regarding the T came directly from the [MBTA.](https://mbta-massdot.opendata.arcgis.com/) Income data came from [The Opportunity Atlas](https://www.opportunityatlas.org/) and COVID data was taken from [the CDC](https://covid.cdc.gov/covid-data-tracker/#datatracker-home). We took inspiration from Mike Barry and Brian Card's [Visualizing MBTA Data](http://mbtaviz.github.io/) and changed our ridership encoding scheme after finding a thematically similar visualization by Aucher Serr, called [MTA Ridership Changes due to COVID-19](https://projects.two-n.com/mta/).

We also utilized the Javascript Libraries [D3.js](https://d3js.org/), [Scrollama](https://github.com/russellgoldenberg/scrollama), and [Lodash](https://lodash.com/).
