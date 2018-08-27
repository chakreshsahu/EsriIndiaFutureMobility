# Geo intelligent site suitability for EV Charging Station

Electric vehicle technology is evolving, more in terms of fuel efficiency, cost effectiveness and quick charging options. For mass adaptation of this technology, facilitating charging infrastructure to public places would be one of the key component for success. The vehicle users should able to easily locate and reach nearby charging stations based on the type of vehicles and congestion.

As a solution, we propose a model to identify a suitable location for establishing a charging station using GIS analysis techniques in which various parameters like demographic information, traffic details, street network, vehicle population, already available charging station and point of interest can be utilized intelligently. 

Application will provide options to users for delineate or marks their location on GIS map, provide different parameters and run analysis to check their site suitability for setting up charging station. The geo analysis will also give a clear picture for profitability.  

An electric vehicle user to locate a nearby suitable charging station and identifying a shortest alternative paths to avoid range anxiety would also be part of the solution. The Application will show GIS maps of all charging stations, Street data, Traffic congestion and congestion pattern of charging stations.

[View it live](https://esriindia1.centralindia.cloudapp.azure.com/smartcharge)



![landing page](https://github.com/chakreshsahu/EsriIndiaFutureMobility/blob/master/SmartCharge/screenshot/StartScreen.png)

![starting page](https://github.com/chakreshsahu/EsriIndiaFutureMobility/blob/master/SmartCharge/screenshot/MainScreen.png)



## Features
Features of the application are following
* Site Suitability Assessment
* Locate and Route

## Site Suitability Assessment

Site Suitability Assessment module check site suitablity for establishing EV Charging Station. 

## Locate and Route

Locate and Route module search EV Charging Station based user's charger type and connector type within 3 km buffer. It provide a list of EV charging station with distance. When user select a particular charging station three alternative routes generated for mobility. 

## Methodology


## Weightage and Criteria of Calculation

### Potential EV Station
| Category | Average Time of Stay | Proximity of Road | Parking Space | Score |
| --- | --- | --- | --- | --- |
| Apartments | 5 | 4 | 5 | 4.66666666667 |
| Automobile Service Centres | 3 | 5 | 4 | 4 |
| IT Park | 5 | 5 | 5 | 5 |
| Educational Institutions | 5 | 5 | 5 | 5 |
| Fuel Station | 2 | 5 | 1 | 2.66666666667 |
| Government Office | 5 | 5 | 5 | 5 |
| Hospital | 3 | 5 | 3 | 3.66666666667 |
| Malls | 3 | 5 | 5 | 4.33333333333 |
| Metro Stations | 5 | 5 | 5 | 5 |
| Parking | 4 | 5 | 5 | 4.66666666667 |
| Parks Recreation | 3 | 4 | 3 | 3.33333333333 |
| Restaurants | 2 | 4 | 4 | 3.33333333333 |
| Transport Hubs | 3 | 5 | 5 | 4.33333333333 |
| Travel Destrinations | 3 | 4 | 3 | 3.33333333333 |


## Data Source

Gurugram and South Delhi taken as study area for Site Suitability Assessment. The following data used for computation purpose.

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
