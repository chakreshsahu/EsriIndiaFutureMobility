define(['dojo/_base/declare',
    'dojo/_base/html',
    "dojo/_base/lang",
    "dojo/on",
    'dojo/_base/config',
    'dojo/_base/array',
    "dojo/dom-construct",
    //esri
    "esri/Color",
    "esri/geometry/Point",
    "esri/tasks/locator",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/graphic",
    "esri/geometry/webMercatorUtils",
    "esri/layers/GraphicsLayer",
    "esri/tasks/RouteTask",
    "esri/symbols/PictureMarkerSymbol",
    "esri/geometry/Polyline",
    "esri/geometry/geometryEngine",
    //esri dijits
    "esri/dijit/Search",
    "esri/dijit/LocateButton",
    "esri/tasks/RouteParameters",
    "esri/tasks/FeatureSet",
    "esri/units",
    'jimu/BaseWidget',
    'jimu/dijit/ViewStack'
  ],
  function (declare,
    html,
    lang,
    on,
    dojoConfig,
    array,
    domConstruct,
    Color,
    Point,
    Locator,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    Graphic,
    webMercatorUtils,
    GraphicsLayer,
    RouteTask,
    PictureMarkerSymbol,
    Polyline,
    geometryEngine,
    Search,
    LocateButton,
    RouteParameters,
    FeatureSet,
    Units,
    BaseWidget,
    ViewStack) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {

      //please note that this property is be set by the framework when widget is loaded.
      //templateString: template,

      baseClass: 'jimu-widget-locateroute',
      search: null,
      locate: null,
      currentLoc: null,
      locator: null,
      routeParams: null,

      postCreate: function () {
        this.inherited(arguments);
        console.log('postCreate');
        //create view stack for flip the page
        this.viewStack = new ViewStack({
          viewType: 'dom',
          views: [this.tabHeader, this.allrouteresult]
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

      },

      startup: function () {
        this.inherited(arguments);
        //  this.mapIdNode.innerHTML = 'map id:' + this.map.id;
        console.log('startup');
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
        this.stopsLayer = new GraphicsLayer({
          id: "stopsLayer"
        });
        this.map.addLayer(this.stopsLayer);
        on(this.locate, "locate", lang.hitch(this, this.onLocate));
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
          this.locator.on("location-to-address-complete", lang.hitch(this, this.locationAdressComplete));
        }

      },

      onLocateError: function (error) {
        console.log("Error:" + error);
      },

      locationAdressComplete: function (evt) {
        if (evt.address.address) {
          var address = evt.address.address;
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
          if (address.Address == "")
            this.search.set('value', evt.address.address.City);
          else {
            this.search.set('value', evt.address.address.Address);
          }
          var graphic = new Graphic(evt.address.location, symbol);
          this.map.graphics.add(graphic);
        }

        if (this.routeParams.stops.features.length === 0) {
          var point = new Point(evt.address.location.x, evt.address.location.y);
          var sPoint = webMercatorUtils.project(point, this.map.spatialReference);
          this.startPoint = new Graphic(sPoint, this.startSymbol);
          this.startPoint.attributes = {
            'name': 'Start Point'
          };
          this.stopsLayer.add(this.startPoint);
          this.routeParams.stops.features.push(this.startPoint);
        } else if (this.routeParams.stops.features.length === 1) {
          if (this.routeParams.stops.features[0].attributes.name === "Start Point") {
            var pt = new Point(77.3178, 28.4089);
            var ePoint = webMercatorUtils.project(pt, this.map.spatialReference);
            this.endPoint = new Graphic(ePoint, this.endSymbol);
            this.endPoint.attributes = {
              'name': 'End Point'
            };
            this.stopsLayer.add(this.endPoint);
            this.routeParams.stops.features.push(this.endPoint);
          }
        }
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

        this.firstRouteLyr = new GraphicsLayer({
          id: "routeLayer"
        });
        this.firstRoutereduceDown = new GraphicsLayer({
          id: "routeLayerDown"
        });
        this.secondRouteLyr = new GraphicsLayer({
          id: "secondRouteLayer"
        });
        this.secondRoutereduceDown = new GraphicsLayer({
          id: "secondRouteLayerDown"
        });
        this.thirdRouteLyr = new GraphicsLayer({
          id: "thirdRouteLayer"
        });
        this.thirdRouteLyrDown = new GraphicsLayer({
          id: "thirdRouteLayerDown"
        });
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
        this.secondRouteErrorHandler = this.routeTask.on("error", lang.hitch(this, this.secondRouteErrorHandler));

      },
      secondRouteErrorHandler: function () {
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
        this.routeParams.stops.features.push(this.startPoint);
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
        this.thirdRouteErrorHandler = this.routeTask.on("error", lang.hitch(this, this.thirdRouteErrorHandler));
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
        this._switchView(1);
      },
      thirdRouteErrorHandler: function (err) {
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
      /**
       * flip the page
       * @param {object} idx viewid
       */
      _switchView: function (idx) {
        this.currentStack = idx;
        this.viewStack.switchView(idx);
      },
      onClose: function () {
        console.log('onClose');
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