/*
 FileName: Widget.js
 Description: Checks site suitability
 Author: Ankit Rautela
 Organisation: ESRI India
 */

define(['dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/_base/html',
        "esri/dijit/Search",
        "esri/dijit/LocateButton",
        "esri/Color",
        "esri/geometry/Point",
        "esri/tasks/locator",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/graphic",
        "esri/tasks/query",
        "esri/layers/FeatureLayer",
        "esri/geometry/geometryEngine",
        "esri/geometry/webMercatorUtils",
        "esri/tasks/Geoprocessor",
        "esri/SpatialReference",
        'dojo/on',
        'jimu/BaseWidget'
    ],
    function(declare, lang, html, Search, LocateButton, Color, Point, Locator, SimpleFillSymbol, SimpleMarkerSymbol, SimpleLineSymbol, Graphic, Query, FeatureLayer, geometryEngine, webMercatorUtils, Geoprocessor, SpatialReference, on, BaseWidget) {
        //To create a widget, you need to derive from BaseWidget.
        return declare([BaseWidget], {

            // Custom widget code goes here

            baseClass: 'sitesuitabilityassessment',
            inputX: null,
            inputY: null,
            gp: null,
            search: null,
            locate: null,
            existingEVStations: null,
            existingEVStationsCount: null,
            potentialEVStations: null,
            potentialEVStationsCount: null,
            existingEVlayerURL: null,
            potentialEVlayerURL: null,
            // this property is set by the framework when widget is loaded.
            // name: 'sitesuitabilityassessment',
            // add additional properties here

            //methods to communication with app container:
            postCreate: function() {
                this.inherited(arguments);
                console.log('sitesuitabilityassessment::postCreate');
            },

            startup: function() {
                this.inherited(arguments);
                console.log('sitesuitabilityassessment::startup');
                this.search = new Search({
                    map: this.map
                }, "search");

                this.locate = new LocateButton({
                    map: this.map
                }, "locatebtn");
                this.locate.startup();
                this.locator = new Locator("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
                this.own(on(this.map, 'click', lang.hitch(this, this._onMapClick)));
            },

            onOpen: function() {
                // on(this.locate, "locate", lang.hitch(this, this.onLocate));
                this.own(on(this.locate, 'locate', lang.hitch(this, this.onLocate)));
                on(this.search, 'search-results', lang.hitch(this, this.onSearchComplete));
                this.existingEVlayerURL = "https://esriindia1.centralindia.cloudapp.azure.com/server/rest/services/ExistingEVStations/FeatureServer/0";
                this.potentialEVlayerURL = "https://esriindia1.centralindia.cloudapp.azure.com/server/rest/services/PotentialEVSites/MapServer/0";

                console.log('sitesuitabilityassessment::onOpen');
            },

            onClose: function() {
                console.log('sitesuitabilityassessment::onClose');
            },

            onMinimize: function() {
                console.log('sitesuitabilityassessment::onMinimize');
            },

            onMaximize: function() {
                console.log('sitesuitabilityassessment::onMaximize');
            },

            onSignIn: function(credential) {
                console.log('sitesuitabilityassessment::onSignIn', credential);
            },

            onSignOut: function() {
                console.log('sitesuitabilityassessment::onSignOut');
            },

            onPositionChange: function() {
                console.log('sitesuitabilityassessment::onPositionChange');
            },

            resize: function() {
                console.log('sitesuitabilityassessment::resize');
            },


            onLocate: function(evt) {
                if (evt.error) {
                    this.onLocateError(evt.error);
                } else {
                    this.inputX = evt.position.coords.longitude;
                    this.inputY = evt.position.coords.latitude;
                    this.currentLoc = new Point({
                        latitude: evt.position.coords.latitude,
                        longitude: evt.position.coords.longitude
                    });
                    this.locator.locationToAddress(this.currentLoc, 100);
                    this.locator.on("location-to-address-complete", lang.hitch(this, this.locationAdressComplete));
                }

            },

            onLocateError: function(error) {
                console.log("Error:" + error);
            },

            locationAdressComplete: function(evt) {
                this.map.graphics.clear();
                if (evt.address.address) {
                    var address = evt.address.address;
                    this.inputX = evt.address.location.x;
                    this.inputY = evt.address.location.y;
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
                    if (address.Address === "") {
                        this.search.set('value', evt.address.address.City);
                    } else {
                        this.search.set('value', evt.address.address.Address);
                    }
                    var graphic = new Graphic(evt.address.location, symbol);
                    this.map.graphics.add(graphic);
                }
            },

            _onMapClick: function(evt) {
                this.map.graphics.clear();
                var mp = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);
                this.inputX = mp.x;
                this.inputY = mp.y;
                var mapClickPoint = new Point(this.inputX, this.inputY);
                var simpleMarkerSymbol = new SimpleMarkerSymbol();
                simpleMarkerSymbol.setSize(12);
                simpleMarkerSymbol.setColor(new Color([255, 0, 0, 1]));
                var graphic = new Graphic(mapClickPoint, simpleMarkerSymbol);
                this.map.graphics.add(graphic);
                this.map.centerAndZoom(mapClickPoint, 12);
            },


            executeModel: function() {
                this.createBuffer();
                var ID = this.generateID();
                // if (this.inputX === null || this.inputY === null) {
                //     alert('Please select location !');
                // } else {
                //     this.gp = new Geoprocessor("https://spgv.southindia.cloudapp.azure.com/server/rest/services/TransAnalyst/TowerScheduleModel/GPServer/TSModel_7Feb");
                //     this.gp.setOutputSpatialReference({ wkid: 102100 });
                //     var params = {
                //         "X": this.inputX,
                //         "Y": this.inputY
                //     };

                //     this.gp.submitJob(params, lang.hitch(this, this.getModelOutput), lang.hitch(this, this.gpJobStatus), lang.hitch(this, this.cancelJobTS));
                // }
            },

            onSearchComplete: function() {
                this.map.graphics.clear();
            },

            generateID: function() {
                return '_' + Math.random().toString(36).substr(2, 9);
            },

            createBuffer: function() {
                var mapPoint = new Point(this.inputX, this.inputY, new SpatialReference({ wkid: 4326 }));
                var bufferPolygon = geometryEngine.geodesicBuffer(mapPoint, 1.5, 9036);
                var fill = new SimpleFillSymbol();
                fill.setColor(new Color([255, 167, 127, 0.25]));
                var gra = new Graphic(bufferPolygon, fill);
                this.map.graphics.add(gra);
                var extent = bufferPolygon.getExtent();
                this.map.setExtent(extent);
                this.existingEVStations = new FeatureLayer(this.existingEVlayerURL, {
                    mode: FeatureLayer.MODE_ONDEMAND,
                    outFields: ["*"],
                    id: "existingEVStations"
                });
                var query = new Query();
                query.where = "1=1";
                query.geometry = extent;
                this.existingEVStations.queryFeatures(query, lang.hitch(this, function(response) {
                    this.existingEVStationsCount = response.features.length;
                    document.getElementById('evCount').innerHTML = this.existingEVStationsCount;
                }));

                this.potentialEVStations = new FeatureLayer(this.potentialEVlayerURL, {
                    mode: FeatureLayer.MODE_ONDEMAND,
                    outFields: ["*"],
                    id: "potentialEVStations"
                });

                this.potentialEVStations.queryFeatures(query, lang.hitch(this, function(response) {
                    this.potentialEVStationsCount = response.features.length;
                    document.getElementById('potentialevCount').innerHTML = this.potentialEVStationsCount;
                }));



            }



        });

    });