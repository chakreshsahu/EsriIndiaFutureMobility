define(['dojo/_base/declare', 'jimu/BaseWidget'],
function(declare, BaseWidget) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {

    // Custom widget code goes here

    baseClass: 'site-suitability-grid',
    // this property is set by the framework when widget is loaded.
    // name: 'SiteSuitabilityGrid',
    // add additional properties here

    //methods to communication with app container:
    postCreate: function() {
      this.inherited(arguments);
      console.log('SiteSuitabilityGrid::postCreate');
    }

    // startup: function() {
    //   this.inherited(arguments);
    //   console.log('SiteSuitabilityGrid::startup');
    // },

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
