define(['dojo/_base/declare', 
'dojo/_base/html',
"dojo/_base/lang",
"dojo/on",
//esri
"esri/Color",
"esri/geometry/Point",
"esri/tasks/locator",
"esri/symbols/SimpleMarkerSymbol",
 "esri/symbols/SimpleLineSymbol",
 "esri/graphic",
//esri dijits
"esri/dijit/Search",
"esri/dijit/LocateButton",
'jimu/BaseWidget'],
function(declare, 
  html, 
  lang, 
  on, 
  Color,
  Point, 
  Locator,
  SimpleMarkerSymbol, 
  SimpleLineSymbol,
  Graphic,
  Search, 
  LocateButton, 
  BaseWidget) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-locateroute',
    search: null,
    locate:null,
    currentLoc: null,
    locator: null,

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
      
    },

    startup: function() {
      this.inherited(arguments);
    //  this.mapIdNode.innerHTML = 'map id:' + this.map.id;
      console.log('startup');
      this.search = new Search({
        map: this.map
      },"search");

      this.locate = new LocateButton({
        map: this.map
      }, "locatebtn");
      this.locate.startup();
      this.locator = new Locator("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
    },

    onOpen: function(){
      console.log('onOpen');
      this.locate.locate();
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
        this.locator.on("location-to-address-complete",lang.hitch(this, this.locationAdressComplete));
      }

    },

    onLocateError:function(error){
      console.log("Error:" + error);
    },

    locationAdressComplete: function(evt){
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
        this.search.set('value',evt.address.address.City);
        else {
          this.search.set('value',evt.address.address.Address);
        }
        var graphic = new Graphic(evt.address.location, symbol);
            this.map.graphics.add(graphic);
      }
    },

    onClose: function(){
      console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    },

    showVertexCount: function(count){
      this.vertexCount.innerHTML = 'The vertex count is: ' + count;
    }
  });
});