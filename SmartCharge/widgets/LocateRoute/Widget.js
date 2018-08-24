define(['dojo/_base/declare',
    'dojo/_base/html',
    "dojo/_base/lang",
    'dojo/_base/config',
    'dojo/_base/array',
    "dojo/dom",
    "dojo/store/Memory",
    "dijit/form/FilteringSelect",
    "dijit/form/HorizontalSlider",
    "dojo/on",
    //esri
    "esri/tasks/RouteTask",
    "esri/tasks/RouteParameters",
    "esri/tasks/FeatureSet",
    "esri/Color",
    "esri/geometry/Point",
    "esri/tasks/locator",
    "esri/SpatialReference",
    "esri/tasks/query",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/geometry/geometryEngine",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/renderers/SimpleRenderer",
    "esri/geometry/webMercatorUtils",
    "esri/graphic",
    "esri/geometry/Polyline",
    "esri/units",
    "dojo/dom-construct",
    //esri dijits
    "esri/dijit/Search",
    "esri/dijit/LocateButton",
    'dijit/_WidgetsInTemplateMixin',
    "jimu/dijit/Message",
    'jimu/BaseWidget',
    'jimu/dijit/ViewStack'
  ],
  function (declare,
    html,
    lang,
    dojoConfig,
    array,
    dom,
    Memory,
    FilteringSelect,
    HorizontalSlider,
    on,
    RouteTask,
    RouteParameters,
    FeatureSet,
    Color,
    Point,
    Locator,
    SpatialReference,
    Query,
    FeatureLayer,
    GraphicsLayer,
    geometryEngine,
    SimpleFillSymbol,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    PictureMarkerSymbol,
    SimpleRenderer,
    webMercatorUtils,
    Graphic,
    Polyline,
    Units,
    domConstruct,
    Search,
    LocateButton,
    _WidgetsInTemplateMixin,
    Message,
    BaseWidget,
    ViewStack) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget, _WidgetsInTemplateMixin], {

      //please note that this property is be set by the framework when widget is loaded.
      //templateString: template,

      baseClass: 'jimu-widget-locateroute',
      search: null,
      locate: null,
      currentLoc: null,
      locator: null,
      evGraphicsLayer: null,
      routeParams: null,
      firstRouteSymbol: null,
      secondRouteSymbol: null,
      thirdRouteSymbol: null,
      existingEVlayerURL: "https://esriindia1.centralindia.cloudapp.azure.com/server/rest/services/ExistingEVStations/FeatureServer/0",

      postCreate: function () {
        this.inherited(arguments);
        console.log('postCreate');

        //Viewstack to switch views

        this.viewStack = new ViewStack({
          viewType: 'dom',
          views: [this.tabHeader, this.bufferResult, this.allrouteresult]
        });
        html.place(this.viewStack.domNode, this.widgetContent);
        this._switchView(0);

        this.startSymbol = new PictureMarkerSymbol('widgets/LocateRoute/images/Start.png', 15, 21);
        this.routeParams = new RouteParameters();
        this.routeParams.stops = new FeatureSet();
        this.routeParams.returnDirections = true;
        this.routeParams.directionsLengthUnits = Units.KILOMETERS;
        this.routeParams.directionsLanguage = dojoConfig.locale || "en_us";
        this.routeParams.directionsOutputType = 'esriDOTComplete';
        this.routeParams.directionsStyleName = 'NA Navigation';
        this.routeParams.outSpatialReference = {
          "wkid": 102100
        };
        this.routeParams.impedanceAttribute = 'TruckTravelTime';
        this.firstRouteSymbol = new SimpleLineSymbol().setColor(new Color([4, 68, 118, 1])).setWidth(5);
        this.secondRouteSymbol = new SimpleLineSymbol().setColor(new Color([102, 195, 0, 1])).setWidth(5);
        this.thirdRouteSymbol = new SimpleLineSymbol().setColor(new Color([192, 183, 0, 1])).setWidth(5);


        this.existingEVStations = new FeatureLayer(this.existingEVlayerURL, {
          mode: FeatureLayer.MODE_ONDEMAND,
          outFields: ["*"],
          id: "existingEVStations"
        });
        //Symbol for Graphics layer
        var symbol = new SimpleMarkerSymbol(
          SimpleMarkerSymbol.STYLE_CIRCLE,
          12,
          new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_NULL,
            new Color([247, 34, 101, 0.9]),
            1
          ),
          new Color([207, 34, 171, 0.5])
        );
        var evRenderer = new SimpleRenderer(symbol);
        this.evGraphicsLayer = new GraphicsLayer();
        this.evGraphicsLayer.setRenderer(evRenderer);
        this.map.addLayer(this.evGraphicsLayer);
      },
      _switchView: function (idx) {
        this.currentStack = idx;
        this.viewStack.switchView(idx);
      },


      startup: function () {
        this.inherited(arguments);



        this.map.on("click", lang.hitch(this, this.onMapClick));

        var dojoStore = new Memory({
          data: [{
              id: 1,
              name: "Select",
              label: "<b>Select</b>"
            },
            {
              id: 2,
              name: "IEC 60309",
              label: "<b>IEC 60309</b> <img src ='./widgets/LocateRoute/images/IEC_60309.png' style='width:50px;height:50px;' />"
            },
            {
              id: 3,
              name: "IEC 62196",
              label: "<b>IEC 62196</b> <img src='./widgets/LocateRoute/images/IEC_62196.png' style='width:50px;height:50px;'/>"
            },
            {
              id: 4,
              name: "CHAdeMO",
              label: "<b>CHAdeMO</b> <img src='./widgets/LocateRoute/images/CHAdeMO.png' style='width:50px;height:50px;'/>"
            },
            {
              id: 5,
              name: "CCS",
              label: "<b>CCS</b> <img src='./widgets/LocateRoute/images/CCS.png' style='width:50px;height:50px;'/>"
            },
            {
              id: 6,
              name: "GB/T",
              label: "<b>GB/T</b> <img src='./widgets/LocateRoute/images/GBT.png' style='width:50px;height:50px;'/>"
            }
          ]
        });

        var fs = new FilteringSelect({
          required: true,
          value: 1,
          store: dojoStore,
          searchAttr: "name",
          labelAttr: "label",
          labelType: "html"
        }, dom.byId("connectorType")).startup();

        var slider = new HorizontalSlider({
          name: "slider",
          value: 3,
          minimum: 0,
          maximum: 10,
          pageIncrement: 1,
          intermediateChanges: false,
          style: "width:300px;",
          onChange: function (value) {
            dom.byId("sliderValue").innerText = value.toFixed(2);
          }
        }, "slider").startup()

        this.search = new Search({
          map: this.map
        }, "search");

        this.locate = new LocateButton({
          map: this.map
        }, "locatebtn");
        this.locate.startup();

        this.locator = new Locator("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
      },

      onOpen: function () {
        console.log('onOpen');
        this.locate.locate();
        on(this.locate, "locate", lang.hitch(this, this.onLocate));
        on(this.search, 'search-results', lang.hitch(this, this.onSearchResult));
        on(this.locator, "location-to-address-complete", lang.hitch(this, this.locationAdressComplete));
      },

      onMapClick: function (evt) {
        this.locator.locationToAddress(webMercatorUtils.webMercatorToGeographic(evt.mapPoint), 100);
        this.map.infoWindow.hide();
      },

      onLocate: function (evt) {
        if (evt.error) {
          this.onLocateError(evt.error);
        } else {
          this.currentLoc = new Point({
            latitude: evt.position.coords.latitude,
            longitude: evt.position.coords.longitude
          });
          this.locator.locationToAddress(this.currentLoc, 100);
        }

      },

      onLocateError: function (error) {
        console.log("Error:" + error);
      },

      locationAdressComplete: function (evt) {
        if (evt.address.address) {
          var address = evt.address.address;
          this.map.graphics.clear();
          var pictureMarkerSymbol = new PictureMarkerSymbol('./widgets/LocateRoute/images/search_pointer.png', 36, 36);
          if (address.Address === "")
            this.search.set('value', evt.address.address.City);
          else {
            this.search.set('value', evt.address.address.Address);
          }
          var graphic = new Graphic(webMercatorUtils.geographicToWebMercator(evt.address.location), pictureMarkerSymbol);
          this.map.graphics.add(graphic);
        }
        var point = new Point(evt.address.location.x, evt.address.location.y);
        var sPoint = webMercatorUtils.project(point, this.map.spatialReference);
        this.startPoint = new Graphic(sPoint, this.startSymbol);
        this.startPoint.attributes = {
          'name': 'Start Point'
        };
      },

      _backPress: function () {
        this._switchView(0);
      },

      onSearchResult: function (evt) {
        this.map.graphics.clear();
        this.startPoint = new Graphic(evt.results[0][0].feature.geometry, this.startSymbol);
        this.startPoint.attributes = {
          'name': 'Start Point'
        };
      },

      _locateStation: function () {
        if (this.firstRouteLyr) {
          this.map.removeLayer(this.firstRouteLyr);
          this.firstRouteLyr.clear();
        } else {
          this.firstRouteLyr = new GraphicsLayer({
            id: "routeLayer"
          });
        }
        if (this.secondRouteLyr) {
          this.map.removeLayer(this.secondRouteLyr);
          this.secondRouteLyr.clear();
        } else {
          this.secondRouteLyr = new GraphicsLayer({
            id: "secondRouteLayer"
          });
        }
        if (this.thirdRouteLyr) {
          this.map.removeLayer(this.thirdRouteLyr);
          this.thirdRouteLyr.clear();
        } else {
          this.thirdRouteLyr = new GraphicsLayer({
            id: "thirdRouteLayer"
          });
        }
        var connector_type = dijit.byId("connectorType");
        var type_of_station = dijit.byId("chargerType");
        if (this.search.get('value') == ""){ 
                new Message({
                  titleLabel: "Locate and Route Module",
                  message: "Please Select Location either by clicking on map or by searching or enable your current location to search EV station"
          });
         
        } 
        if (connector_type.item.name.trim() == "Select") {
          connector_type.set("state", "Error");          
        }
        if (type_of_station.value.trim() == "Select") {
          type_of_station.set("state", "Error");
          return;
        }
             
        this.mapPoint = this.map.graphics.graphics[0].geometry;
        var bufferDistance = dom.byId("sliderValue").innerText;
        var bufferPolygon = geometryEngine.geodesicBuffer(this.mapPoint, bufferDistance, 9036);
        
        var extent = bufferPolygon.getExtent();
        this.map.setExtent(extent);
        var query = new Query();

        query.where = "connector_type = '" + connector_type.item.name.trim() + "' and type_of_station = '" + type_of_station.value.trim() + "'";
        query.outFields = ["*"];
        query.geometry = extent;
        this.existingEVStations.queryFeatures(query, lang.hitch(this, function (response) {

          var features = [];
          this.evGraphicsLayer.clear();
          this.bufferResultTable.innerHTML = "";
          array.forEach(response.features, lang.hitch(this, function (feature) {

            features.push(feature.attributes);
			
			var graphic = new Graphic(feature.geometry);
            this.evGraphicsLayer.add(graphic);
			
            var geom2 = feature.geometry;

            var aerialDistance = geometryEngine.distance(this.mapPoint, geom2, 9036);

            feature.attributes.aerialDistance = aerialDistance.toFixed(2);
           
          }));
          
          lang.hitch(this,this.sortStationsAerialDist(features, 'aerialDistance'));

          array.forEach(features, lang.hitch(this, function (feature) {

            var div = domConstruct.create("div", { style: { cursor: "pointer" } }, this.bufferResultTable);
            div.onclick = lang.hitch(this, this.getCurrentStation);
            var cell = domConstruct.create('tr', null, div);

            cell.innerHTML = "<b>Station Name :</b><span>" + feature.name + "</span>";

            cell = domConstruct.create('tr', null, div);
            cell.innerHTML += "<b>Charging Type:</b>" + feature.type_of_station;

            cell = domConstruct.create('tr', null, div);
            cell.innerHTML += "<b>Connector Type:</b>" + feature.connector_type;

            cell = domConstruct.create('tr', null, div);
            cell.innerHTML += "<b>Network/Operator:</b>" + feature.network_operator;

            cell = domConstruct.create('tr', null, div);
            cell.innerHTML += "<b>Usage:</b>" + feature.usage;

            cell = domConstruct.create('tr', null, div);
            cell.innerHTML += "<b>Max voltage:</b>" + feature.max__voltage;

            cell = domConstruct.create('tr', null, div);
            cell.innerHTML += "<b>Max Current:</b>" + feature.max__current;

            cell = domConstruct.create('tr', null, div);
            cell.innerHTML += "<b>Max Power (kw):</b>" + feature.max__power_kw_;

            cell = domConstruct.create('tr', null, div);
            cell.innerHTML += "<b>Aerial Distance (KM):</b>" + feature.aerialDistance;

            domConstruct.create("br", null, this.bufferResultTable);
            this._switchView(1);
          }));
        }));

      },
      sortStationsAerialDist: function (json_object, key_to_sort_by) {
        function sortByKey(a, b) {
            var x = a[key_to_sort_by];
            var y = b[key_to_sort_by];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        }
    
        json_object.sort(sortByKey);
    },

      getCurrentStation: function (evt) {
        console.log(evt);
        var query = new Query();
        query.where = "name='" + evt.currentTarget.children[0].children[1].innerText + "'";
        query.returnGeometry = true;
        query.outFields = ["*"];
        this.existingEVStations.queryFeatures(query, lang.hitch(this, function (response) {
          this.endPoint = new Graphic(response.features[0].geometry, this.endSymbol);
          this.endPoint.attributes = {
            'name': 'End Point'
          };
          this.routeParams.stops.features = [];
          this.routeParams.stops.features.push(this.startPoint);
          this.routeParams.stops.features.push(this.endPoint);
          lang.hitch(this, this.fetchRoute());
          this.shelter.show();
        }));

      },

      _locateRoute: function () {
        alert("Bingo");
      },
      addRouteAsBarrier: function (routeResult, val, pathArray) {
        var addFeatures = [];
        var flipFeatures = [];
        var newGeometry;
        var newGraphic;

        if (pathArray.length > 1) {
          for (var i = 1; i < pathArray.length - 1; i++) {
            if (i % val === 0) {
              newGeometry = new Polyline(routeResult.geometry.spatialReference);
              var startPoint = pathArray[i];
              var endPoint = pathArray[i + 1];
              newGeometry.addPath([startPoint, endPoint]);

              newGraphic = new Graphic(newGeometry, routeResult.symbol, lang.clone(routeResult.attributes));
              addFeatures.push(newGraphic);
            }
          }
        }
        var flipGraphics;
        this.splitLine1 = new GraphicsLayer({
          id: 'splitLine1'
        });

        for (var j = 0; j < addFeatures.length; j++) {
          flipGraphics = new Graphic(geometryEngine.rotate(addFeatures[j].geometry, 90), routeResult.symbol, lang.clone(routeResult.attributes));
          flipFeatures.push(flipGraphics);
          this.splitLine1.add(flipGraphics);
        }

        for (var z = 0; z < this.splitLine1.graphics.length; z++) {
          var line = new Graphic(this.splitLine1.graphics[z].geometry, this.firstRouteSymbol);
          this.routeParams.polylineBarriers.features.push(line);
        }
      },
      fetchRoute: function () {
        //this.endSymbol = new PictureMarkerSymbol('widgets/LocateRoute/images/Start.png', 15, 21);
        //var graphic = new Graphic(evt.address.location, pictureMarkerSymbol);
        if (this.firstRouteLyr) {
          this.map.removeLayer(this.firstRouteLyr);
          this.firstRouteLyr.clear();
        } else {
          this.firstRouteLyr = new GraphicsLayer({
            id: "routeLayer"
          });
        }
        if (this.secondRouteLyr) {
          this.map.removeLayer(this.secondRouteLyr);
          this.secondRouteLyr.clear();
        } else {
          this.secondRouteLyr = new GraphicsLayer({
            id: "secondRouteLayer"
          });
        }
        if (this.thirdRouteLyr) {
          this.map.removeLayer(this.thirdRouteLyr);
          this.thirdRouteLyr.clear();
        } else {
          this.thirdRouteLyr = new GraphicsLayer({
            id: "thirdRouteLayer"
          });
        }
        this.secondtimeRouteError = false;
        this.secondRouteError = false;
        this.thirdRouteThirdError = false;
        this.thirdRouteSecondError = false;
        this.thirdRouteError = false;
        this.firstRouteSymbol = new SimpleLineSymbol().setColor(new Color([4, 68, 118, 1])).setWidth(5);
        this.highlightedSegmentSymbol = new SimpleLineSymbol().setColor(new Color([0, 255, 255, 1])).setWidth(5);
        this.secondRouteSymbol = new SimpleLineSymbol().setColor(new Color([102, 195, 0, 1])).setWidth(5);
        this.thirdRouteSymbol = new SimpleLineSymbol().setColor(new Color([192, 183, 0, 1])).setWidth(5);

        this.firstRoutereduceDown = new GraphicsLayer({
          id: "routeLayerDown"
        });

        this.secondRoutereduceDown = new GraphicsLayer({
          id: "secondRouteLayerDown"
        });
        this.routeParams.polylineBarriers = new FeatureSet();
        this.routeTask = new RouteTask("https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World");
        this.routeTask.solve(this.routeParams);
        this.firstRouteSolveEvent = this.routeTask.on("solve-complete", lang.hitch(this, function (evt) {
          this.routeDisplay(evt);
          this.firstRouteSolveEvent.remove();
        }));
      },
      routeDisplay: function (data) {
        var routeResult = data.result.routeResults[0].route;
        this.directions = data.result.routeResults[0].directions;
        this.splitRouteAt = null;
        var routePath = new Polyline(routeResult.geometry.spatialReference);
        var routeFeatures = new FeatureSet();
        routeFeatures.fields = [{
          'name': 'OID',
          'type': 'esriFieldTypeObjectID',
          'alias': 'OID'
        }];
        this.totalTime = 0;
        this.totalLength = 0;
        this.totalRevTime = 0;
        this.totalRevLength = 0;
        this.firstRouteLyr.graphics = [];
        this.directionTextFirst = [];
        var graphic;
        var length, eachtime;
        for (var b = 1; b < this.directions.features.length; b++) {
          graphic = new Graphic(this.directions.features[b].geometry, this.firstRouteSymbol);
          routeFeatures.features.push(graphic);
          this.firstRouteLyr.add(graphic);
          this.totalTime += this.directions.features[b].attributes.time;
          this.totalLength += this.directions.features[b].attributes.length;
          if (this.directions.features[b].attributes.length && this.directions.features[b].attributes.length > 0.01) {
            length = this.directions.features[b].attributes.length.toFixed(2);
            eachtime = this.directions.features[b].attributes.time.toFixed(2);
          } else {
            length = '';
            eachtime = '';
          }
          this.directionTextFirst.push([this.directions.features[b].attributes.text, this.directions.features[b].geometry, length, eachtime]);
        }
        this.firstUpLength.innerHTML = "Distance: " + this.totalLength.toFixed(2) + "km";
        var decreaseBarrier;
        if (this.directions.features.length % 2 === 0) {
          decreaseBarrier = this.directions.features.length / 2;
        } else {
          decreaseBarrier = this.directions.features.length - 1 / 2;
        }
        for (var i = 0; i < decreaseBarrier; i++) {
          graphic = new Graphic(this.directions.features[i].geometry, this.firstRouteSymbol);
          this.firstRoutereduceDown.add(graphic);
        }
        this.firstRoute = this.firstRoutereduceDown;
        var time = this.totalTime;
        time = parseInt(time, 10);
        lang.hitch(this, this.calculateTime(time));
        this.firstUpTime.innerHTML = "Time: " + this.totalTime;

        this.firstBarrier = routeResult;
        lang.hitch(this, this.generateSecondRoute());
        this.map.addLayer(this.firstRouteLyr);
      },
      generateSecondRoute: function () {
        this.routeTask = new RouteTask("https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World");
        this.routeParams = new RouteParameters();
        this.routeParams.stops = new FeatureSet();
        this.routeParams.stops.features.push(this.startPoint);
        this.routeParams.stops.features.push(this.endPoint);
        this.routeParams.returnDirections = true;
        this.routeParams.directionsOutputType = 'esriDOTComplete';
        this.routeParams.directionsStyleName = 'NA Navigation';
        this.routeParams.directionsLengthUnits = Units.KILOMETERS;
        this.routeParams.outSpatialReference = {
          "wkid": 102100
        };
        this.routeParams.impedanceAttribute = 'TruckTravelTime';
        this.routeParams.polylineBarriers = new FeatureSet();
        if (this.secondRouteError === true) {
          var routeResult = this.firstRoutereduceDown;
          var paths, remainder, val;
          var pathsArray = [];
          for (var i = 0; i < routeResult.graphics.length; i++) {
            var graphic = routeResult.graphics[i];
            for (var j = 0; j < graphic.geometry.paths[0].length; j++) {
              pathsArray.push(routeResult.graphics[i].geometry.paths[0][j]);
            }
          }
          paths = pathsArray.length;

          if (this.secondtimeRouteError === true) {
            if (paths % 2 === 0) {
              val = paths / 2;
            } else {
              val = (paths + 1) / 2;
            }
          } else {

            remainder = (paths - 1) % 2;
            val = (paths - 1 - remainder) / 2;
          }
          this.routeParams.polylineBarriers = new FeatureSet();
          lang.hitch(this, this.addRouteAsBarrier(routeResult.graphics[0], val, pathsArray));
        } else {
          var polyline = new Graphic(this.firstBarrier.geometry);
          polyline.attributes = {
            'BarrierType': 1,
            'Attr_TruckTravelTime': 100
          };

          this.routeParams.polylineBarriers.features.push(polyline);
        }
        this.routeTask.solve(this.routeParams);
        this.secondRouteSolveEvent = this.routeTask.on("solve-complete", lang.hitch(this, this.showSecondRoute));
        this.secondRouteErrorHandler = this.routeTask.on("error", lang.hitch(this, this.secondRouteErrorRoute));

      },
      secondRouteErrorRoute: function () {
        this.secondRouteSolveEvent.remove();
        this.secondRouteErrorHandler.remove();
        if (this.secondtimeRouteError === true) {

        } else if (this.secondRouteError === true) {
          this.secondtimeRouteError = true;
          lang.hitch(this, this.generateSecondRoute());
        } else {
          this.secondRouteError = true;
          if (this.secondRouteEdited !== true) {
            lang.hitch(this, this.generateSecondRoute());
          }
        }
      },
      showSecondRoute: function (data) {
        this.secondRouteSolveEvent.remove();
        this.secondRouteErrorHandler.remove();
        var routeResult = data.result.routeResults[0].route;
        this.directions = data.result.routeResults[0].directions;
        var routePath = new Polyline(routeResult.geometry.spatialReference);
        var routeFeatures = new FeatureSet();
        routeFeatures.fields = [{
          'name': 'OID',
          'type': 'esriFieldTypeObjectID',
          'alias': 'OID'
        }];

        this.totalTime = 0;
        this.totalLength = 0;
        this.totalRevTime = 0;
        this.totalRevLength = 0;

        this.secondRouteLyr.graphics = [];
        this.secondRouteUpDirections = [];
        this.directionTextSecond = [];
        var graphic, length, eachtime;
        for (var k = 1; k < this.directions.features.length; k++) {
          graphic = new Graphic(this.directions.features[k].geometry, this.secondRouteSymbol);
          routeFeatures.features.push(graphic);
          this.secondRouteLyr.add(graphic);
          this.totalTime += this.directions.features[k].attributes.time;
          this.totalLength += this.directions.features[k].attributes.length;
          this.secondRouteUpDirections.push(this.directions.features[k]);
          if (this.directions.features[k].attributes.length && this.directions.features[k].attributes.length > 0.01) {
            length = this.directions.features[k].attributes.length.toFixed(2);
            eachtime = this.directions.features[k].attributes.time.toFixed(2);
          } else {
            length = '';
            eachtime = '';
          }
          this.directionTextSecond.push([this.directions.features[k].attributes.text, this.directions.features[k].geometry, length, eachtime]);
        }
        this.secondUpLength.innerHTML = "Distance: " + this.totalLength.toFixed(2) + "km";
        var decreaseBarrier;
        if (this.directions.features.length % 2 === 0) {
          decreaseBarrier = this.directions.features.length / 2;
        } else {
          decreaseBarrier = this.directions.features.length - 1 / 2;
        }
        for (var i = 0; i < decreaseBarrier; i++) {
          graphic = new Graphic(this.directions.features[i].geometry, this.secondRouteSymbol);
          this.secondRoutereduceDown.add(graphic);
        }
        var time = this.totalTime;
        time = parseInt(time, 10);
        lang.hitch(this, this.calculateTime(time));
        this.secondUpTime.innerHTML = "Time: " + this.totalTime;
        this.secondBarrier = routeResult;
        this.map.addLayer(this.secondRouteLyr);
        lang.hitch(this, this.generateThirdRoute());
      },
      generateThirdRoute: function () {
        this.routeParams = new RouteParameters();
        this.routeParams.stops = new FeatureSet();
        this.routeParams.stops.features.push(this.startPoint);
        this.routeParams.stops.features.push(this.endPoint);
        this.routeParams.returnDirections = true;
        this.routeParams.directionsOutputType = 'esriDOTComplete';
        this.routeParams.directionsStyleName = 'NA Navigation';
        this.routeParams.directionsLengthUnits = Units.KILOMETERS;
        this.routeParams.outSpatialReference = {
          "wkid": 102100
        };
        this.routeParams.impedanceAttribute = 'TruckTravelTime';
        this.routeParams.polylineBarriers = new FeatureSet();
        if (this.thirdRouteError === true || this.secondRouteError === true) {
          var routeResult = this.firstRoutereduceDown;

          var newGraphic, remainder, val, paths;

          var pathsArray = [];
          for (var i = 0; i < routeResult.graphics.length; i++) {
            var graphic = routeResult.graphics[i];
            for (var j = 0; j < graphic.geometry.paths[0].length; j++) {
              pathsArray.push(routeResult.graphics[i].geometry.paths[0][j]);
            }
          }
          paths = pathsArray.length;

          if (this.thirdRouteSecondError === true) {
            if (paths % 2 === 0) {
              val = paths / 2;
            } else {
              val = (paths + 1) / 2;
            }
          } else {
            remainder = (paths - 1) % 2;
            val = (paths - 1 - remainder) / 2;
          }

          lang.hitch(this, this.addRouteAsBarrier(routeResult.graphics[0], val, pathsArray));
          //generating second route as barrier
          var routeResult2 = this.secondRoutereduceDown;

          var newGraphic2, remainder2, val2, paths2;

          var pathsArray2 = [];
          for (var k = 0; k < routeResult2.graphics.length; k++) {
            var graphic2 = routeResult2.graphics[k];
            for (var l = 0; l < graphic2.geometry.paths[0].length; l++) {
              pathsArray2.push(routeResult2.graphics[k].geometry.paths[0][l]);
            }
          }
          paths2 = pathsArray2.length;

          if (this.thirdRouteSecondError === true) {
            if (paths2 % 2 === 0) {
              val2 = paths2 / 2;
            } else {
              val2 = (paths2 + 1) / 2;
            }
          } else {
            remainder2 = (paths2 - 1) % 2;
            val2 = (paths2 - 1 - remainder2) / 2;
          }

          lang.hitch(this, this.addRouteAsBarrier(routeResult2.graphics[0], val2, pathsArray2));
        } else {
          var polyline = new Graphic(this.firstBarrier.geometry);
          var polyline2 = new Graphic(this.secondBarrier.geometry);

          polyline.attributes = {
            'BarrierType': 1,
            'Attr_TruckTravelTime': 100
          };
          polyline2.attributes = {
            'BarrierType': 1,
            'Attr_TruckTravelTime': 100
          };

          this.routeParams.polylineBarriers.features.push(polyline);
          this.routeParams.polylineBarriers.features.push(polyline2);
        }
        this.routeTask.solve(this.routeParams);
        this.thirdRouteSolveEvent = this.routeTask.on("solve-complete", lang.hitch(this, this.showThirdRoute));
        this.thirdRouteErrorHandler = this.routeTask.on("error", lang.hitch(this, this.thirdRouteErrorRoute));
      },
      showThirdRoute: function (data) {
        this.thirdRouteSolveEvent.remove();
        this.thirdRouteErrorHandler.remove();
        var routeResult = data.result.routeResults[0].route;
        this.directions = data.result.routeResults[0].directions;
        var routePath = new Polyline(routeResult.geometry.spatialReference);
        var routeFeatures = new FeatureSet();
        routeFeatures.fields = [{
          'name': 'OID',
          'type': 'esriFieldTypeObjectID',
          'alias': 'OID'
        }];

        this.totalTime = 0;
        this.totalLength = 0;
        this.totalRevTime = 0;
        this.totalRevLength = 0;

        this.thirdRouteLyr.graphics = [];
        this.thirdRouteUpDirections = [];
        this.directionTextThird = [];
        var length, eachtime;
        for (var k = 1; k < this.directions.features.length; k++) {
          var graphic = new Graphic(this.directions.features[k].geometry, this.thirdRouteSymbol);
          routeFeatures.features.push(graphic);
          this.thirdRouteLyr.add(graphic);
          this.totalTime += this.directions.features[k].attributes.time;
          this.totalLength += this.directions.features[k].attributes.length;
          this.thirdRouteUpDirections.push(this.directions.features[k]);
          if (this.directions.features[k].attributes.length && this.directions.features[k].attributes.length > 0.01) {
            length = this.directions.features[k].attributes.length.toFixed(2);
            eachtime = this.directions.features[k].attributes.time.toFixed(2);
          } else {
            length = '';
            eachtime = '';
          }
          this.directionTextThird.push([this.directions.features[k].attributes.text, this.directions.features[k].geometry, length, eachtime]);

        }
        this.thirdUpLength.innerHTML = "Distance: " + this.totalLength.toFixed(2) + "km";
        var time = this.totalTime;
        time = parseInt(time, 10);
        lang.hitch(this, this.calculateTime(time));
        this.thirdUpTime.innerHTML = "Time: " + this.totalTime;
        this.thirdRoute = this.thirdRouteLyr;
        this.thirdBarrier = routeResult;
        this.map.addLayer(this.thirdRouteLyr);
        this._switchView(2);
        this.shelter.hide();
      },
      thirdRouteErrorRoute: function (err) {
        this.thirdRouteSolveEvent.remove();
        this.thirdRouteErrorHandler.remove();
        if (this.thirdRouteThirdError === true) {} else if (this.thirdRouteSecondError === true) {
          this.thirdRouteThirdError = true;
          lang.hitch(this, this.generateThirdRoute());
        } else if (this.thirdRouteError === true) {
          this.thirdRouteSecondError = true;
          lang.hitch(this, this.generateThirdRoute());
        } else {
          this.thirdRouteError = true;
          if (this.thirdEditedRoute !== true) {
            lang.hitch(this, this.generateThirdRoute());
          }
        }
      },
      calculateTime: function (time) {
        var remainder, hrs;
        if (time > 60) {
          remainder = time % 60;
          hrs = (time - remainder) / 60;
          this.totalTime = hrs + ' hrs ' + remainder.toFixed(0) + ' mins';
        } else {
          this.totalTime = time.toFixed(2) + ' mins';
        }
      },
      viewFirstRouteDirections: function () {
        if (this.directionsFirstRouteContent.style.display === 'block') {
          this.directionsFirstRouteContent.style.display = 'none';
          this.map.graphics.clear();
        } else {
          this.directionsSecondRouteContent.style.display = 'none';
          this.directionsThirdRouteContent.style.display = 'none';
          var rows = this.routeDirectionsTable.rows.length;
          if (rows !== 0) {
            for (var i = 0; i < rows; i++) {
              if (this.routeDirectionsTable.rows.length !== 0) {
                this.routeDirectionsTable.deleteRow(0);
              }
            }
          }
          this.directionsFirstRouteContent.style.display = 'block';
          var row = domConstruct.create("tr", null, this.routeDirectionsTable);
          var cell = domConstruct.create('td', null, row, "first");
          cell.innerHTML = "Directions";
          row.className = 'driving-row-heading';
          cell.className = 'driving-row-heading-cell';
          var countDown = 0;
          array.forEach(this.directionTextFirst, lang.hitch(this, function (direction) {
            var row = domConstruct.create("tr", null, this.routeDirectionsTable);
            var cell = domConstruct.create('td', null, row, "first");
            var slno = countDown + 1;
            if (direction[2] !== "") {
              cell.innerHTML = slno + '. ' + direction[0] + ' (' + direction[2] + ' km, ' + direction[3] + ' mins)';
            } else {
              cell.innerHTML = slno + '. ' + direction[0];
            }
            if (countDown % 2 !== 0) {
              cell.style.backgroundColor = '#ececec';
            }
            row.name = direction[1];
            row.onclick = lang.hitch(this, this.zoomToRouteSegment);
            row.className = 'driving-row';
            countDown++;
          }));
        }
      },
      viewSecondRouteDirections: function () {
        if (this.directionsSecondRouteContent.style.display === 'block') {
          this.directionsSecondRouteContent.style.display = 'none';
          this.map.graphics.clear();
        } else {
          this.directionsFirstRouteContent.style.display = 'none';
          this.directionsThirdRouteContent.style.display = 'none';
          var rows = this.directionsRouteSecondTable.rows.length;
          if (rows !== 0) {
            for (var i = 0; i < rows; i++) {
              if (this.directionsRouteSecondTable.rows.length !== 0) {
                this.directionsRouteSecondTable.deleteRow(0);
              }
            }
          }
          this.directionsSecondRouteContent.style.display = 'block';
          var row = domConstruct.create("tr", null, this.directionsRouteSecondTable);
          var cell = domConstruct.create('td', null, row, "first");
          cell.innerHTML = "Directions";
          row.className = 'driving-row-heading';
          cell.className = 'driving-row-heading-cell';
          var countDown = 0;
          array.forEach(this.directionTextSecond, lang.hitch(this, function (direction) {
            var row = domConstruct.create("tr", null, this.directionsRouteSecondTable);
            var cell = domConstruct.create('td', null, row, "first");
            var slno = countDown + 1;
            if (direction[2] !== "") {
              cell.innerHTML = slno + '. ' + direction[0] + ' (' + direction[2] + ' km, ' + direction[3] + ' mins)';
            } else {
              cell.innerHTML = slno + '. ' + direction[0];
            }
            if (countDown % 2 !== 0) {
              cell.style.backgroundColor = '#ececec';
            }
            row.name = direction[1];
            row.onclick = lang.hitch(this, this.zoomToRouteSegment);
            row.className = 'driving-row';
            countDown++;
          }));
        }
      },
      viewThirdRouteDirections: function () {
        if (this.directionsThirdRouteContent.style.display === 'block') {
          this.directionsThirdRouteContent.style.display = 'none';
          this.map.graphics.clear();
        } else {
          this.directionsFirstRouteContent.style.display = 'none';
          this.directionsSecondRouteContent.style.display = 'none';
          var rows = this.directionsRouteThirdTable.rows.length;
          if (rows !== 0) {
            for (var i = 0; i < rows; i++) {
              if (this.directionsRouteThirdTable.rows.length !== 0) {
                this.directionsRouteThirdTable.deleteRow(0);
              }
            }
          }
          this.directionsThirdRouteContent.style.display = 'block';
          var row = domConstruct.create("tr", null, this.directionsRouteThirdTable);
          var cell = domConstruct.create('td', null, row, "first");
          cell.innerHTML = "Directions";
          row.className = 'driving-row-heading';
          cell.className = 'driving-row-heading-cell';
          var countDown = 0;
          array.forEach(this.directionTextThird, lang.hitch(this, function (direction) {
            var row = domConstruct.create("tr", null, this.directionsRouteThirdTable);
            var cell = domConstruct.create('td', null, row, "first");
            var slno = countDown + 1;
            if (direction[2] !== "") {
              cell.innerHTML = slno + '. ' + direction[0] + ' (' + direction[2] + ' km, ' + direction[3] + ' mins)';
            } else {
              cell.innerHTML = slno + '. ' + direction[0];
            }
            if (countDown % 2 !== 0) {
              cell.style.backgroundColor = '#ececec';
            }
            row.name = direction[1];
            row.onclick = lang.hitch(this, this.zoomToRouteSegment);
            row.className = 'driving-row';
            countDown++;
          }));
        }
      },
      zoomToRouteSegment: function (evt) {

        this.map.graphics.clear();
        var graphic = new Graphic(evt.currentTarget.name);
        if (graphic.geometry === null) {
          graphic.setGeometry(evt.currentTarget.name);
        }
        graphic.setSymbol(this.highlightedSegmentSymbol);
        var features = [];
        features.push(graphic);
        var featureSet = new FeatureSet();
        featureSet.features = features;
        var geom = evt.currentTarget.name;
        if (geom.getExtent !== undefined) {
          this.map.setExtent(geom.getExtent());
          this.map.graphics.add(graphic);
        } else {
          var point = new Point(graphic.geometry.paths[0][0][0], graphic.geometry.paths[0][0][1], this.map.spatialReference);
          this.map.centerAndZoom(point, 15);
          this.map.graphics.add(graphic);
        }
      },
      _backPressData: function () {
        this._switchView(1);

      },

      onClose: function () {
        this.map.graphics.clear();
        this.evGraphicsLayer.clear();
        if (this.mapClickEvent !== null) {
          this.mapClickEvent.remove();
        }
        if (this.locateEvent !== null) {
          this.locateEvent.remove();
        }
        if (this.searchEvent !== null) {
          this.searchEvent.remove();
        }
        if (this.reverseGeoCodeEvent !== null) {
          this.reverseGeoCodeEvent.remove();
        }
      },

      onMinimize: function () {
        console.log('onMinimize');
      },

      onMaximize: function () {
        console.log('onMaximize');
      },

      onSignIn: function (credential) {
        /* jshint unused:false*/
        console.log('onSignIn');
      },

      onSignOut: function () {
        console.log('onSignOut');
      },

      showVertexCount: function (count) {
        this.vertexCount.innerHTML = 'The vertex count is: ' + count;
      }
    });
  });