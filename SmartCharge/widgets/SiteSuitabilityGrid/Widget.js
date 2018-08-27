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
    "esri/dijit/Gauge",
    "esri/graphic",
    "esri/layers/GraphicsLayer",
    "esri/tasks/query",
    "esri/layers/FeatureLayer",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/geometry/geometryEngine",
    "esri/geometry/webMercatorUtils",
    "esri/tasks/Geoprocessor",
    "esri/SpatialReference",
    "esri/tasks/IdentifyTask",
    "esri/tasks/IdentifyParameters",
    'jimu/LayerInfos/LayerInfos',
    "dojo/dom-construct",
    "esri/symbols/jsonUtils",
    'jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-git1.min.js',
    'dojo/on',
    'jimu/BaseWidget'
  ],
  function (declare,
    lang,
    html,
    dom,
    gfx,
    Search,
    LocateButton,
    Color,
    Point,
    Locator,
    SimpleFillSymbol,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    TabContainer3,
    LoadingShelter,
    Gauge,
    Graphic,
    GraphicsLayer,
    Query,
    FeatureLayer,
    ArcGISDynamicMapServiceLayer,
    geometryEngine,
    webMercatorUtils,
    Geoprocessor,
    SpatialReference,
    IdentifyTask,
    IdentifyParameters,
    LayerInfos,
    domConstruct,
    jsonUtils,
    $,
    on,
    BaseWidget) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {

      // Custom widget code goes here

      baseClass: 'site-suitability-grid',
      // this property is set by the framework when widget is loaded.
      // name: 'SiteSuitabilityGrid',
      // add additional properties here

      //methods to communication with app container:
      postCreate: function () {
        this.inherited(arguments);
        console.log('SiteSuitabilityGrid::postCreate');

      },
      showGaugeLayer: function () {
        var div = domConstruct.create("div", {
          style: {
            cursor: "pointer"
          }
        }, this.exploreMapTabNode);
        for (var i = 0; i < this.config.queries.length; i++) {
          var newdiv = domConstruct.create("div", {
            style: {
              cursor: "pointer"
            }
          }, this.exploreMapTabNode);

          var cell = domConstruct.create('tr', null, newdiv);
          cell = domConstruct.create('td', null, newdiv);
          cell.innerHTML = "<input type='checkbox' name= '" + this.config.queries[i].Layer[0].name + "' value= '" + this.config.queries[i].Layer[0].url + "' class= 'checkBoxes' title='Show layer'/>";
          cell = domConstruct.create('td', null, newdiv);
          cell.innerHTML = this.config.queries[i].Layer[0].name;
          cell = domConstruct.create('td', null, newdiv);
          cell.innerHTML = "<label class='expand'><i class='fa fa-minus-circle' aria-hidden='true'></i></label>";
          var newdiv1 = domConstruct.create("div", {
            'class': 'divContent'
          }, this.exploreMapTabNode);
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
        $('.checkBoxes').change(lang.hitch(this, function (evt) {
          var checkedChkBox = document.getElementsByClassName('checkBoxes');
          lang.hitch(this, this.checkBoxClick(checkedChkBox, evt, null));

        }));
        $('.expand').click(lang.hitch(this, function (evt) {
          if (evt.currentTarget.firstElementChild.className === "fa fa-plus-circle") {
            evt.currentTarget.firstElementChild.className = "fa fa-minus-circle";
          } else {
            evt.currentTarget.firstElementChild.className = "fa fa-plus-circle";
          }
          if (evt.currentTarget.parentElement.parentElement.nextElementSibling.style.display === 'none') {
            evt.currentTarget.parentElement.parentElement.nextElementSibling.style.display = 'block';
          } else {
            evt.currentTarget.parentElement.parentElement.nextElementSibling.style.display = 'none';
          }
        }));
      },
      checkBoxClick: function (checkedChkBox, evt, paginationFlag) {
        if (evt.target.checked) {
          this.layerNew = new ArcGISDynamicMapServiceLayer("http://esriindia1.centralindia.cloudapp.azure.com/server/rest/services/SuitabilityGrid50m/MapServer", {
            id: evt.target.name
          });
          this.identify = new IdentifyTask("http://esriindia1.centralindia.cloudapp.azure.com/server/rest/services/SuitabilityGrid50m/MapServer");
          this.identifyParams = new IdentifyParameters();
          this.identifyParams.tolerance = 0;
          this.identifyParams.returnGeometry = true;
          this.identifyParams.layerIds = [0];
          this.identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_TOP;
          this.identifyParams.width = this.map.width;
          this.identifyParams.height = this.map.height;
          this.map.on("mouse-move", lang.hitch(this, this.executeIdentify));
          //  this.layer.on("load",function(evt){
          //    debugger;
          //  });
          this.map.addLayer(this.layerNew);
          if (this.layer) {
            this.layer.setVisibility(true);
          } else {
            var featuresUrl = "http://esriindia1.centralindia.cloudapp.azure.com/server/rest/services/SuitabilityGrid50m/MapServer/0";


            this.fl = new FeatureLayer(featuresUrl, {
              "id": evt.target.name,
              "mode": FeatureLayer.MODE_SNAPSHOT,
              "outFields": ["objectid", "score"]
            });
            this.map.addLayer(this.fl);
            this.fl.on("load", lang.hitch(this, this.createGauge));
          }
          document.getElementById("dashboard").style.display = "block";
        } else {
          this.layer = this.map.getLayer(evt.target.name);
          //this.map.removeLayer(this.layer);
          this.layer.setVisibility(false);
          document.getElementById("dashboard").style.display = "none";
        }
      },
      executeIdentify: function (event) {
        this.identifyParams.geometry = event.mapPoint;
        this.identifyParams.mapExtent = this.map.extent;
        var deferred = this.identify
          .execute(this.identifyParams)
          .addCallback(function (response) {
            if (response.length > 0) {
              console.log(response[0].feature.attributes.objectid);
              if (this.gaugeDijit) {
             //   this.gaugeDijit.value= parseInt(response[0].feature.attributes.objectid);
                this.gaugeDijit.refresh(response[0].feature.attributes.objectid,500000);
              } else {
                this.gaugeDijit = new JustGage({
                  id: "gauge",
                  value: parseInt(response[0].feature.attributes.objectid),
                  min: 0,
                  max: 500000,
                  title: "Visitors"
                });
              }
            }
          });
      },
      createGauge: function (evt) {
        // create JSON and pass it to the Gauge ctor

        // this.gaugeParams = {
        //   "caption": "Site Suitability",
        //   "color": "#c0c",
        //   "dataField": "objectid", // name of the attribute used for the gauge value
        //   "dataLabelField": "objectid",
        //   "layer": this.fl,
        //   "maxDataValue": 30000, // gauge max value, not used when dataFormat is "percentage" 
        //   "noFeatureLabel": "No name",
        //   "title": "Site Suitability",
        //   "unitLabel": " MPH"
        // };
        // if (!this.gauge) {
        //   this.gauge = new Gauge(this.gaugeParams, "gaugeDiv");
        //   this.gauge.startup();
        // }

        //Set up mouse over highlighting
        // var hGraphics = new GraphicsLayer({id:"highlights"});
        // this.map.addLayer(hGraphics);

        // var highlight = new SimpleMarkerSymbol().setColor(gaugeParams.color).setSize(12);

        // this.map.on("mouse-move", function(e){
        //   hGraphics.clear();
        //   hGraphics.add(new Graphic(e.graphic.geometry, highlight));
        // });
      },
      startup: function () {
        this.inherited(arguments);
        this.showGaugeLayer();
      }

      // onOpen: function(){
      //   console.log('SiteSuitabilityGrid::onOpen');
      // },

      // onClose: function(){
      //   console.log('SiteSuitabilityGrid::onClose');
      // },

      // onMinimize: function(){
      //   console.log('SiteSuitabilityGrid::onMinimize');
      // },

      // onMaximize: function(){
      //   console.log('SiteSuitabilityGrid::onMaximize');
      // },

      // onSignIn: function(credential){
      //   console.log('SiteSuitabilityGrid::onSignIn', credential);
      // },

      // onSignOut: function(){
      //   console.log('SiteSuitabilityGrid::onSignOut');
      // }

      // onPositionChange: function(){
      //   console.log('SiteSuitabilityGrid::onPositionChange');
      // },

      // resize: function(){
      //   console.log('SiteSuitabilityGrid::resize');
      // }

      //methods to communication between widgets:

    });

  });