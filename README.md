# Geo intelligent site suitability for EV Charging Station

Electric vehicle technology is evolving, more in terms of fuel efficiency, cost effectiveness and quick charging options. For mass adaptation of this technology, facilitating charging infrastructure to public places would be one of the key component for success. The vehicle users should able to easily locate and reach nearby charging stations based on the type of vehicles and congestion.

As a solution, we propose a model to identify a suitable location for establishing a charging station using GIS analysis techniques in which various parameters like demographic information, traffic details, street network, vehicle population, already available charging station and point of interest can be utilized intelligently. 

Application will provide options for the users to delineate or mark their location on GIS map, provide different parameters and run analysis to check their site suitability for setting up charging station. The geo analysis will also give a clear picture for profitability.  

An electric vehicle user to locate a nearby suitable charging station and identifying the shortest alternative path to avoid range anxiety would also be part of the solution. The Application will show GIS maps of all charging stations, Street data, Traffic congestion and congestion pattern of charging stations.

[View it live](https://esriindia1.centralindia.cloudapp.azure.com/esmartcharge/)


<img src="https://github.com/chakreshsahu/EsriIndiaFutureMobility/blob/master/SmartCharge/screenshot/StartScreen.png" alt="score range" style="max-width: 70%;">

<img src="https://github.com/chakreshsahu/EsriIndiaFutureMobility/blob/master/SmartCharge/screenshot/MainScreen.png" alt="score range" style="max-width: 70%;">


## How it works

![Alt Text](https://github.com/chakreshsahu/EsriIndiaFutureMobility/blob/master/SmartCharge/screenshot/videomobility.gif)

## Features
Features of the application are as follows
* Site Suitability Assessment
* Locate and Route

## Site Suitability Assessment

Site Suitability assessment widget enables the user to search or mark a site on map and analyse its suitability for planning a future EV station prospects.

#### Explore Map

Use Explore Map to view the layers on map used for analysing the site suitability.

<img src="https://github.com/chakreshsahu/EsriIndiaFutureMobility/blob/master/SmartCharge/screenshot/ExploreTab.png" alt="score range" style="max-width: 70%;">

#### Select Site

Select Site enables user to assess his/her site for EV Station prospects.

1.	Search or Click on map to locate the site for which you want to check suitability.

2.	Click on Get Suitability button.

<img src="https://github.com/chakreshsahu/EsriIndiaFutureMobility/blob/master/SmartCharge/screenshot/SelectSitetab%202.png" alt="score range" style="max-width: 70%;">

3.	After successful completion of analysis user is redirected to analysis tab which shows the result of site analysis.

4.	Based on average score of site suitability, site is rated as follows:

<img src="https://github.com/chakreshsahu/EsriIndiaFutureMobility/raw/master/SmartCharge/screenshot/Score_range.PNG" alt="score range" style="max-width: 50%;">

#### Analysis

Result of site analysis are displayed under analysis tab

<img src="https://github.com/chakreshsahu/EsriIndiaFutureMobility/blob/master/SmartCharge/screenshot/AnalysisResultGood.PNG" alt="score range" style="max-width: 50%;">


## Locate and Route

Locate and Route module search EV Charging Station based on user's charger type and connector type within buffer area. It provide a list of EV charging station with distance. When user select a particular charging station three alternative routes generated for mobility. 

1.	Search or Click on map to locate the site around which you want to locate EV Stations.

<img src="https://github.com/chakreshsahu/EsriIndiaFutureMobility/blob/master/SmartCharge/screenshot/Locate.png" alt="score range" style="max-width: 70%;">

2.	Select the distance up to which you want to search EV Station.

3.	Select Charger Type and Connector Type of your vehicle.

4.	Click on Locate EV Station to locate stations around.

5.	All the EV Stations fulfilling the requirements will be highlighted and there details will be shown as below:

<img src="https://github.com/chakreshsahu/EsriIndiaFutureMobility/blob/master/SmartCharge/screenshot/buffer.png" alt="score range" style="max-width: 70%;">

6.	Click on the EV Station of your choice to get alternative routes between station and your location.

<img src="https://github.com/chakreshsahu/EsriIndiaFutureMobility/blob/master/SmartCharge/screenshot/routes.png" alt="score range" style="max-width: 70%;">

7.	Click on the Route Directions to get directions of the particular route.

<img src="https://github.com/chakreshsahu/EsriIndiaFutureMobility/blob/master/SmartCharge/screenshot/direction.png" alt="score range" style="max-width: 70%;">

8.	Click on each directions to highlight it on the map.

<img src="https://github.com/chakreshsahu/EsriIndiaFutureMobility/blob/master/SmartCharge/screenshot/highlightedDirection.png" alt="score range" style="max-width: 70%;">

9.	Turn switch on/off of routes to hide or display them on the map.

<img src="https://github.com/chakreshsahu/EsriIndiaFutureMobility/blob/master/SmartCharge/screenshot/routevisibility.png" alt="score range" style="max-width: 70%;">

## Methodology

Python Script is used to create GP service to find out the site suitability of Electric Vehicle Charging Station.

In GP Service we are checking of site suitability based on input location. A location point as input is taken and make buffer of 500 meter on it.

Buffered output is then intersect with feature layers named as 

* EconomicCondition
* ExistingEVStations
* LanduseLandcover
* PopulationDensity
* StreetNetwork
* VehiclePopulationDensity

whereas each layer have their weight score out of 5 i.e if feature of a layer have score 5 then it is most preferable for site suitability.

When buffer layer is intersected to each above stated layers then we will count final average score.

And this final average score is the output of this GP service.

### Site Suitability Model 
![Site Suitability Model](https://github.com/chakreshsahu/EsriIndiaFutureMobility/blob/master/SmartCharge/screenshot/SiteSuitabilityModel.PNG)

## Weightage and Criteria of Calculation

### Potential EV Station
| Category | Average Time of Stay | Proximity of Road | Parking Space | Score |
| --- | --- | --- | --- | --- |
| Apartments | 5 | 4 | 5 | 4.67 |
| Automobile Service Centres | 3 | 5 | 4 | 4 |
| IT Park | 5 | 5 | 5 | 5 |
| Educational Institutions | 5 | 5 | 5 | 5 |
| Fuel Station | 2 | 5 | 1 | 2.67 |
| Government Office | 5 | 5 | 5 | 5 |
| Hospital | 3 | 5 | 3 | 3.67 |
| Malls | 3 | 5 | 5 | 4.33 |
| Metro Stations | 5 | 5 | 5 | 5 |
| Parking | 4 | 5 | 5 | 4.67 |
| Parks Recreation | 3 | 4 | 3 | 3.33 |
| Restaurants | 2 | 4 | 4 | 3.33 |
| Transport Hubs | 3 | 5 | 5 | 4.33 |
| Travel Destrinations | 3 | 4 | 3 | 3.33 |

#### Average Time of Stay (Number of Hours)
| Range | Weightage |
| --- | --- | 
| less then 1 | 1 |
| 1 to 3 | 2 |
| 3 to 5 | 3 |
| 5 to 8 | 4 |
| 8 to 12 | 5 |

#### Proimity to Road(In Meters)
| Value | Weightage |
| --- | --- | 
| 100 | 5 |
| 200 | 4 |
| 300 | 3 |
| 500 | 2 |
| 1000 | 1 |

#### Parking Space (No of Car's Space)
| Value | Weightage |
| --- | --- | 
| 50 | 1 |
| 100 | 2 |
| 200 | 3 |
| 500 | 4 |
| 1000 | 5 |

### Economic Condition (GDP measure in lakh)
| Range | Weightage |
| --- | --- | 
| 10 to 30 | 1 |
| 30 to 50 | 2 |
| 50 to 100 | 3 |
| 100 to 150 | 4 |
| 150 to 200 | 5 |

### Population Density 
| Range | Weightage |
| --- | --- | 
| 10000-100000 | 1 |
| 100000-200000 | 2 |
| 200000-1000000 | 3 |
| 1000000- 4000000 | 4 |
| 4000000- 6000000 | 5 |

### Vehicle Population Density 
* Sample Table 

 | Area Name | Vehicle Population | Density of Bike | Density of Car | Density of Auto | Density of eRiksha | Weightage |
 | --- | --- | --- | --- | --- | --- | --- | 
 |DEFENCE COLONY| 3500 to 5000 | 4 | 4 | 5 | 4 | 4.25 | 


## Existing EV Station 

Dummy data created for showing existing EV Station. 

* Sample Table 

| Name | Address | Network Operator | Usage | No. of Point | Usage Cost | Type of Station | Connector Type | Max. Voltage | Max. Current | Max. Power (KW) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Saraswati Apartments EV Charging Station | 	Sector D, Vasant Kunj, New Delhi, Delhi 110070 | Mahindra Reva | Private | 3 | 29 | Level 1 DC | CHAdeMO | 220-250V | 	65AMP | 60 |

## Site Suitability Grid 

Site suitability grid indicates the prospects of planning a EV station at any particular site.

<img src="https://github.com/chakreshsahu/EsriIndiaFutureMobility/blob/master/SmartCharge/screenshot/GridTemplate.jpg" alt="score range" style="max-width: 70%;">

## Data Source

Gurugram and South Delhi taken as study area for Site Suitability Assessment. The following data used for computation purpose.
* Existing EV Station (Dummy Data)
* Potential EV Station 
   * Apartments
   * Automobile Service Centres
   * IT Park
   * Educational Institutions
   * Fuel Station
   * Government Office
   * Hospital
   * Malls
   * Metro Stations
   * Parking
   * Parks Recreation
   * Restaurants
   * Transport Hubs
   * Travel Destrinations
* Economic Condition
* Population Density
* VehiclePopulationDensity
* Landuse Landcover
* Street Network
## Technology Stack
1. [ArcGIS Javascript API Version 3.25](https://developers.arcgis.com/javascript/3/)
2. [ArcGIS Routing Service](https://route.arcgis.com/arcgis/)
4. [ArcGIS Geocoding Service](https://geocode.arcgis.com/arcgis/)
5. [ArcGIS Server](https://enterprise.arcgis.com/en/)
6. [Portal for ArcGIS](https://enterprise.arcgis.com/en/portal/)
7. [Web AppBuilder for ArcGIS](https://developers.arcgis.com/web-appbuilder/)
8. [ArcPy](http://pro.arcgis.com/en/pro-app/arcpy/get-started/what-is-arcpy-.htm)
