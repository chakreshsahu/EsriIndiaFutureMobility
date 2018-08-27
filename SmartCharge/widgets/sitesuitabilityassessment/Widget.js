/*
 FileName: Widget.js
 Description: Checks site suitability
 Author: Ankit Rautela
 Organisation: ESRI India
 */

define(['dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/_base/html',
        'dojo/dom',
        "dojox/gfx",
        "esri/dijit/Search",
        "esri/dijit/LocateButton",
        "esri/Color",
        "esri/geometry/Point",
        "esri/tasks/locator",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol",
        'jimu/dijit/TabContainer3',
        "jimu/dijit/LoadingShelter",
        "esri/graphic",
        "esri/tasks/query",
        "esri/layers/FeatureLayer",
        "esri/layers/ArcGISDynamicMapServiceLayer",
        "esri/geometry/geometryEngine",
        "esri/geometry/webMercatorUtils",
        "esri/tasks/Geoprocessor",
        "esri/SpatialReference",
        'jimu/LayerInfos/LayerInfos',
        "dojo/dom-construct",
        "esri/symbols/jsonUtils",
        'jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-git1.min.js',
        'dojo/on',
        'jimu/BaseWidget'
    ],
    function(declare, lang, html, dom, gfx, Search, LocateButton, Color, Point, Locator, SimpleFillSymbol, SimpleMarkerSymbol, SimpleLineSymbol, TabContainer3, LoadingShelter, Graphic, Query, FeatureLayer, ArcGISDynamicMapServiceLayer, geometryEngine, webMercatorUtils, Geoprocessor, SpatialReference, LayerInfos, domConstruct, jsonUtils, $, on, BaseWidget) {
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
            existingEVStationsCount: 0,
            potentialEVStations: null,
            potentialEVStationsCount: 0,
            existingEVlayerURL: null,
            potentialEVlayerURL: null,
            selectSiteTabNode: null,
            resultTabNode: null,
            evSitePanel: null,
            layer: null,
            mapClickHandler: null,
            // this property is set by the framework when widget is loaded.
            // name: 'sitesuitabilityassessment',
            // add additional properties here

            //methods to communication with app container:
            postCreate: function() {
                this.inherited(arguments);
                console.log('sitesuitabilityassessment::postCreate');
                this.shelter = new LoadingShelter({
                    hidden: true
                });
                this.shelter.placeAt(this.evSitePanel);
                this.shelter.startup();
                this._initializeTab();
            },

            startup: function() {
                this.inherited(arguments);
                console.log('sitesuitabilityassessment::startup');
                this.search = new Search({
                    map: this.map
                }, "searchbar");

                this.locate = new LocateButton({
                    map: this.map
                }, "locatebuton");
                this.locate.startup();
                this.locator = new Locator("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
                this.mapClickHandler = this.own(on(this.map, 'click', lang.hitch(this, this._onMapClick)));

                if (this.map.itemId) {
                    LayerInfos.getInstance(this.map, this.map.itemInfo)
                        .then(lang.hitch(this, function(operLayerInfos) {
                            this.operLayerInfos = operLayerInfos;
                            this.showLayers(this.operLayerInfos);
                        }));
                } else {
                    var itemInfo = this._obtainMapLayers();
                    LayerInfos.getInstance(this.map, itemInfo)
                        .then(lang.hitch(this, function(operLayerInfos) {
                            this.operLayerInfos = operLayerInfos;
                            this.showLayers(this.operLayerInfos);
                            //   this.bindEvents();
                            dom.setSelectable(this.layersSection, false);
                        }));
                }
            },

            onOpen: function() {
                this.own(on(this.locate, 'locate', lang.hitch(this, this.onLocate)));
                on(this.search, 'search-results', lang.hitch(this, this.onSearchComplete));
                this.existingEVlayerURL = "https://esriindia1.centralindia.cloudapp.azure.com/server/rest/services/ExistingEVStations/FeatureServer/0";
                this.potentialEVlayerURL = "https://esriindia1.centralindia.cloudapp.azure.com/server/rest/services/PotentialEVSites/MapServer/0";

                console.log('sitesuitabilityassessment::onOpen');
            },

            onClose: function() {
                this.map.graphics.clear();
                for (var j = 0; j < this.map.graphicsLayerIds.length; j++) {
                    if (this.map.graphicsLayerIds[j] !== "ExistingEVStations_560") {
                        var layer = this.map.getLayer(this.map.graphicsLayerIds[j]);
                        this.map.removeLayer(layer);
                    }
                }
                var elementChkBox = document.getElementsByClassName('checkBoxes');
                for (var c = 0; c < elementChkBox.length; c++) {
                    elementChkBox[c].checked = false;
                }
                this.mapClickHandler[0].remove();
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

            showLayers: function(operLayerInfos) {
                // summary:
                //    create a LayerListView module used to draw layers list in browser.
                this.operLayerInfos = operLayerInfos;
                var div = domConstruct.create("div", { style: { cursor: "pointer" } }, this.exploreMapTabNode);
                for (var i = 0; i < this.config.queries.length; i++) {
                    var newdiv = domConstruct.create("div", { style: { cursor: "pointer" } }, this.exploreMapTabNode);

                    var cell = domConstruct.create('tr', null, newdiv);
                    cell = domConstruct.create('td', null, newdiv);
                    cell.innerHTML = "<input type='checkbox' name= '" + this.config.queries[i].Layer[0].name + "' value= '" + this.config.queries[i].Layer[0].url + "' class= 'checkBoxes' title='Show layer'/>";
                    cell = domConstruct.create('td', null, newdiv);
                    cell.innerHTML = this.config.queries[i].Layer[0].name;
                    cell = domConstruct.create('td', null, newdiv);
                    cell.innerHTML = "<label class='expand'><i class='fa fa-plus-circle' aria-hidden='true'></i></label>";
                    var newdiv1 = domConstruct.create("div", { 'class': 'divContent' }, this.exploreMapTabNode);
                    if (this.config.queries[i].Layer[0].symboltype === "unique") {
                        for (var j = 0; j < this.config.queries[i].Layer[0].image.length; j++) {
                            var b = this.config.queries[i].Layer[0].image[j];
                            var descriptors = jsonUtils.getShapeDescriptors(jsonUtils.fromJson(b.symbol));
                            cell = domConstruct.create('tr', null, newdiv1);
                            cell = domConstruct.create('td', null, newdiv1);
                            cell = domConstruct.create('td', null, newdiv1);
                            var mySurface = gfx.createSurface(cell, 30, 30);
                            var shape = mySurface.createShape(descriptors.defaultShape).setFill(descriptors.fill).setStroke(descriptors.stroke);
                            shape.applyTransform({
                                dx: 10,
                                dy: 10
                            });
                            cell = domConstruct.create('td', null, newdiv1);
                            cell.innerHTML = this.config.queries[i].Layer[0].image[j].label;
                        }
                    } else {
                        cell = domConstruct.create('tr', null, newdiv1);
                        cell = domConstruct.create('td', null, newdiv1);
                        cell.innerHTML = "<img src=" + this.config.queries[i].Layer[0].image + ">";
                    }


                }

                $('.checkBoxes').change(lang.hitch(this, function(evt) {
                    lang.hitch(this, this.checkBoxClick(evt));
                }));

                $('.expand').click(lang.hitch(this, function(evt) {
                    if (evt.currentTarget.firstElementChild.className === "fa fa-plus-circle") {
                        evt.currentTarget.firstElementChild.className = "fa fa-minus-circle";
                    } else {
                        evt.currentTarget.firstElementChild.className = "fa fa-plus-circle";
                    }
                    if (evt.currentTarget.parentElement.parentElement.nextElementSibling.style.display === 'none' || evt.currentTarget.parentElement.parentElement.nextElementSibling.style.display === "") {
                        evt.currentTarget.parentElement.parentElement.nextElementSibling.style.display = 'block';
                    } else {
                        evt.currentTarget.parentElement.parentElement.nextElementSibling.style.display = 'none';
                    }
                }));
            },

            checkBoxClick: function(evt) {
                var layerURL = evt.target.value;

                if (evt.target.checked) {
                    if (evt.target.name === "Landuse Landcover") {
                        this.layer = new ArcGISDynamicMapServiceLayer("https://esriindia1.centralindia.cloudapp.azure.com/server/rest/services/LanduseLandcover/MapServer", {
                            id: evt.target.name
                        });
                    } else if (evt.target.name === "Street Network") {
                        this.layer = new ArcGISDynamicMapServiceLayer("https://esriindia1.centralindia.cloudapp.azure.com/server/rest/services/StreetNetwork/MapServer", {
                            id: evt.target.name
                        });
                    } else {
                        this.layer = new FeatureLayer(layerURL, {
                            id: evt.target.name
                        });
                    }
                    this.map.addLayer(this.layer);

                } else {
                    this.layer = this.map.getLayer(evt.target.name);
                    this.map.removeLayer(this.layer);
                }
            },


            displayLayer: function() {
                console.log("Test");
            },


            _initializeTab: function() {

                try {

                    var exploreMapTab = {
                        title: "Explore Map",
                        content: this.exploreMapTabNode
                    };

                    var selectSiteTab = {
                        title: "Select Site",
                        content: this.selectSiteTabNode
                    };

                    var resultsTab = {
                        title: "Analysis",
                        content: this.resultTabNode
                    };

                    var tabs = [exploreMapTab, selectSiteTab, resultsTab];

                    this.tab = new TabContainer3({
                        tabs: tabs,
                        selected: this.nls.NewSetting
                    });

                    this.own(on(this.tab, 'tabChanged', lang.hitch(this, function(evt) {
                        var event = evt;
                        if (evt === 'Select Site') {
                            document.getElementById('results').style.display = 'none';
                        }
                        // if (this.tab.tabTr.children[1].innerText === this.nls.NewSetting) {
                        //     //this._resetData();
                        //     this.Submit.innerText = this.nls.Submit;
                        //     this.Submit.style.display = "inline-block";
                        //     this.reset.style.display = "inline-block";

                        //     this.editPOIbtn.style.display = "none";
                        // }
                    })));

                    this.tab.placeAt(this.evSitePanel);
                } catch (ex) {
                    console.log(ex.message);
                }
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
                this.shelter.show();
                var ID = this.generateID();
                if (this.inputX === null || this.inputY === null) {
                    alert('Please select location !');
                    this.shelter.hide();
                } else {
                    this.createBuffer();
                    //this.gp = new Geoprocessor("https://esriindia1.centralindia.cloudapp.azure.com/server/rest/services/SiteSuitabilityEV/GPServer/SiteSuitability");
                    this.gp = new Geoprocessor("https://esriindia1.centralindia.cloudapp.azure.com/server/rest/services/SiteSuitability/GPServer/SiteSuitability");
                    this.gp.setOutputSpatialReference({ wkid: 102100 });
                    var params = {
                        "_inputX": this.inputX,
                        "_inputY": this.inputY,
                        "_inputConditionValue": ID,
                        "_sdefileName": "F:/SiteSuitabilityModel/gisdb@localhost.sde"
                    };
                    //this.gp.submitJob(params, lang.hitch(this, this.getModelOutput));
                    this.gp.submitJob(params, lang.hitch(this, this.getModelOutput), lang.hitch(this, this.gpJobStatus), lang.hitch(this, this.ModelError));

                }
            },


            getModelOutput: function(resultFeatures) {
                this.gp.getResultData(resultFeatures.jobId, "outputAvgScore", lang.hitch(this, this.displayData));
            },

            ModelError: function(error) {
                console.log(error.message);
                this.shelter.hide();
            },

            displayData: function(result) {
                var finalScore = result.value;
                var score = Number(finalScore);
                document.getElementById('score').innerHTML = score.toFixed(2);
                var percent = ((score / 5) * 100).toFixed(2);
                document.getElementById('scorePercent').innerHTML = percent + " %";
                this.showResults();
            },

            gpJobStatus: function(jobinfo) {
                var jobstatus;
                switch (jobinfo.jobStatus) {
                    case 'esriJobSubmitted':
                        jobstatus = 'Model Initiate.....';
                        break;
                    case 'esriJobExecuting':
                        jobstatus = 'Executing model.....';
                        break;
                    case 'esriJobSucceeded':

                        jobstatus = 'Model executed successfully';
                        break;
                }
                // document.getElementById('loaderMsg').innerHTML = jobstatus;
            },

            onSearchComplete: function(evt) {
                var feature = evt.results[0][0].feature;
                var mp = webMercatorUtils.webMercatorToGeographic(feature.geometry);
                this.inputX = mp.x;
                this.inputY = mp.y;
                this.map.graphics.clear();
            },

            generateID: function() {
                return Math.random().toString(36).substr(2, 5);
            },

            createBuffer: function() {

                var mapPoint = new Point(this.inputX, this.inputY, new SpatialReference({ wkid: 4326 }));
                var bufferPolygon = geometryEngine.geodesicBuffer(mapPoint, 1.5, 9036);
                var fill = new SimpleFillSymbol();
                fill.setColor(new Color([255, 167, 127, 0.25]));
                var gra = new Graphic(bufferPolygon, fill);
                this.map.graphics.add(gra);
                var extent = bufferPolygon.getExtent();
                this.map.centerAndZoom(mapPoint, 13);
                this.existingEVStations = new FeatureLayer(this.existingEVlayerURL, {
                    mode: FeatureLayer.MODE_ONDEMAND,
                    outFields: ["*"],
                    id: "existingEVStations"
                });
                var query = new Query();
                query.where = "1=1";
                query.geometry = extent;
                document.getElementById('potentialevCount').innerHTML = 0;
                document.getElementById('evCount').innerHTML = 0;
                document.getElementById('results').style.display = 'block';
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



            },

            showResults: function() {
                this.tab.tabs[0].content.style.display = "none";
                this.tab.tabs[1].content.style.display = "none";
                this.tab.tabs[2].content.style.display = "inline-block";
                this.tab.tabTr.children[0].setAttribute('class', "tab-item-td jimu-state-deactive");
                this.tab.tabTr.children[1].setAttribute('class', "tab-item-td jimu-state-deactive");
                this.tab.tabTr.children[2].setAttribute('class', "tab-item-td jimu-state-active");
                this.shelter.hide();
            }

        });

    });