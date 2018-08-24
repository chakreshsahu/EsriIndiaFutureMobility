define(['dojo/_base/declare',
  'dojo/_base/html',
  "dojo/_base/lang",
  'dojo/_base/array',
  "dojo/dom",
  "dojo/store/Memory",
  "dijit/form/FilteringSelect",
  "dijit/form/HorizontalSlider",
  "dojo/on",
  //esri
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
  "dojo/dom-construct",
  //esri dijits
  "esri/dijit/Search",
  "esri/dijit/LocateButton",
  'dijit/_WidgetsInTemplateMixin',
  "jimu/dijit/Message",
  'jimu/BaseWidget',
  'jimu/dijit/ViewStack'],
  function (declare,
    html,
    lang,
    array,
    dom,
    Memory,
    FilteringSelect,
    HorizontalSlider,
    on,
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
    domConstruct,
    Search,
    LocateButton,
    _WidgetsInTemplateMixin,
    Message,
    BaseWidget,
    ViewStack) {

    return declare([BaseWidget, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-locateroute',
      search: null,
      locate: null,
      currentLoc: null,
      locator: null,
      mapClickEvent: null,
      locateEvent: null,
      searchEvent: null,
      reverseGeoCodeEvent: null,
      evGraphicsLayer: null,
      mapPoint:null,
      existingEVlayerURL: "https://esriindia1.centralindia.cloudapp.azure.com/server/rest/services/ExistingEVStations/FeatureServer/0",

      postCreate: function () {
        this.inherited(arguments);
        console.log('postCreate');

        //Viewstack to switch views

        this.viewStack = new ViewStack({
          viewType: 'dom',
          views: [this.tabHeader, this.bufferResult]
        });
        html.place(this.viewStack.domNode, this.widgetContent);
        this._switchView(0);

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

        var dojoStore = new Memory({
          data: [
            { id: 1, name: "Select", label: "<b>Select</b>" },
            { id: 2, name: "IEC 60309", label: "<b>IEC 60309</b> <img src ='./widgets/LocateRoute/images/IEC_60309.png' style='width:50px;height:50px;' />" },
            { id: 3, name: "IEC 62196", label: "<b>IEC 62196</b> <img src='./widgets/LocateRoute/images/IEC_62196.png' style='width:50px;height:50px;'/>" },
            { id: 4, name: "CHAdeMO", label: "<b>CHAdeMO</b> <img src='./widgets/LocateRoute/images/CHAdeMO.png' style='width:50px;height:50px;'/>" },
            { id: 5, name: "CCS", label: "<b>CCS</b> <img src='./widgets/LocateRoute/images/CCS.png' style='width:50px;height:50px;'/>" },
            { id: 6, name: "GB/T", label: "<b>GB/T</b> <img src='./widgets/LocateRoute/images/GBT.png' style='width:50px;height:50px;'/>" }
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
        this.bindEvents();
      },

      bindEvents: function () {
        this.locate.locate();

        this.mapClickEvent = on(this.map, 'click', lang.hitch(this, this.onMapClick));
        this.locateEvent = on(this.locate, "locate", lang.hitch(this, this.onLocate));
        this.searchEvent = on(this.search, 'search-results', lang.hitch(this, this.onSearchResult));
        this.reverseGeoCodeEvent = on(this.locator, "location-to-address-complete", lang.hitch(this, this.locationAdressComplete));

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
      },

      _backPress: function () {
        this._switchView(0);
      },

      onSearchResult: function (evt) {
        this.map.graphics.clear();
      },

      _locateStation: function () {
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

          this.evGraphicsLayer.clear();
          this.bufferResultTable.innerHTML = "";
          array.forEach(response.features, lang.hitch(this, function (feature) {

            var graphic = new Graphic(feature.geometry);
            this.evGraphicsLayer.add(graphic);

            var div = domConstruct.create("div", { style: { cursor: "pointer" } }, this.bufferResultTable);
            var cell = domConstruct.create('tr', null, div);

            cell.innerHTML = "<b>Station Name :</b>" + feature.attributes.name;

            cell = domConstruct.create('tr', null, div);
            cell.innerHTML += "<b>Charging Type:</b>" + feature.attributes.type_of_station;

            cell = domConstruct.create('tr', null, div);
            cell.innerHTML += "<b>Connector Type:</b>" + feature.attributes.connector_type;

            cell = domConstruct.create('tr', null, div);
            cell.innerHTML += "<b>Network/Operator:</b>" + feature.attributes.network_operator;

            cell = domConstruct.create('tr', null, div);
            cell.innerHTML += "<b>Usage:</b>" + feature.attributes.usage;

            cell = domConstruct.create('tr', null, div);
            cell.innerHTML += "<b>Max voltage:</b>" + feature.attributes.max__voltage;

            cell = domConstruct.create('tr', null, div);
            cell.innerHTML += "<b>Max Current:</b>" + feature.attributes.max__current;

            cell = domConstruct.create('tr', null, div);
            cell.innerHTML += "<b>Max Power (kw):</b>" + feature.attributes.max__power_kw_;

            var geom2 = feature.geometry;

            var aerialdistance = geometryEngine.distance(this.mapPoint, geom2, 9036);

            cell = domConstruct.create('tr', null, div);
            cell.innerHTML += "<b>Aerial Distance (KM):</b>" + aerialdistance.toFixed(2);

            domConstruct.create("br", null, this.bufferResultTable);
            this._switchView(1);
          }));
        }));

      },

      _locateRoute: function () {
        alert("Bingo");
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
      }

    });
  });