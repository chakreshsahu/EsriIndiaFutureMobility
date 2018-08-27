// Module Name: Themes
// Project: Karnataka Smart City
// Copyright (c) Esri India Technologies Ltd.
// Description : Setting for Themes Widget
// Purpose : This file will be used for setting config for Themes Widget
// Author : Manjari Dhoundiyal
// Date of Creation  : 31.05.2017
define(["dojo/_base/declare", "dojo/_base/html", "dojo/_base/lang", "dojo/query", "dojo/on", "dojo/_base/array", "dojox/gfx", "dojo/dom", "dijit/_WidgetsInTemplateMixin", "esri/request", "esri/layers/FeatureLayer", "esri/symbols/SimpleLineSymbol", "esri/Color", "esri/symbols/jsonUtils", "jimu/BaseWidgetSetting", "jimu/dijit/Popup", "jimu/dijit/Message", "jimu/dijit/_QueryableLayerSourcePopup", "jimu/dijit/SimpleTable", "jimu/dijit/TabContainer"], function (declare, html, lang, query, on, array, gfx, dom, _WidgetsInTemplateMixin, esriRequest, FeatureLayer, SimpleLineSymbol, Color, jsonUtils, BaseWidgetSetting, Popup, Message, _QueryableLayerSourcePopup, Table, TabContainer) {

  return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-themes-setting',
    newJson: {},
    newFieldInfos: [],
    flag: 0,
    currentLayer: null,
    layerInfotemplate: null,
    layerCategory: null,
    outline: null,
    symbolType: null,

    postCreate: function postCreate() {
      this.inherited(arguments);
      this._createUI();
      this.setConfig(this.config);
    },

    startup: function startup() {
      this.inherited(arguments);
    },

    setConfig: function setConfig(config) {
      this.config = config;
      //create new json
      this.newJson = {};
      this._getThemes();
    },

    getConfig: function getConfig() {
      this.configuration = [];
      array.forEach(this.config.queries, lang.hitch(this, function (item) {
        if (item.status === true && item.Layer.length) {
          var obj = {};
          obj.category = item.category;
          obj.Layer = item.Layer;
          this.configuration.push(obj);
        }
      }));
      this.config.queries = this.configuration;
      return this.config;
    },

    /**
     * create layer and category dom
     **/
    _createUI: function _createUI() {
      var fieldinfo = [{
        name: "label",
        title: "Category",
        "class": "label",
        type: "text"
      }, {
        name: "actions",
        title: "actions",
        "class": "actions",
        type: "actions",
        actions: ["up", "down", "delete"]
      }];
      var layerinfo = [{
        name: "label",
        title: "Layer",
        "class": "label",
        type: "text"
      }, {
        name: 'actions',
        title: 'Fields',
        type: 'actions',
        'class': 'edit-fields',
        actions: ['edit', "delete"]
        // , {
        //             name: "actions",
        //             title: "actions",
        //             "class": "actions",
        //             type: "actions",
        //             actions: ["up", "down", "delete"]
        //      }
      }];

      //create add category table
      this.categoryTable = new Table({
        fields: fieldinfo
      });
      this.categoryTable.placeAt(this.categoryTableNode);

      //category table delete and click events
      on(this.categoryTable, 'row-delete', lang.hitch(this, function (tr) {
        if (tr.select) {
          tr.select.destroy();
          delete tr.select;
        }
      }));
      on(this.categoryTable, 'BeforeRowDelete', lang.hitch(this, function (tr) {
        var row = this.categoryTable.getRowData(tr);
        this.layerTable.clear();
        this._deleteJson(row.label);
      }));
      on(this.categoryTable, 'row-click', lang.hitch(this, function (tr) {
        //this.layerTable.clear();
        var row = this.categoryTable.getRowData(tr);
        this.layerCategory = row.label;
        this._recreate(row.label);
      }));

      //create add layer table
      this.layerTable = new Table({
        fields: layerinfo
      });

      this.layerTable.placeAt(this.layerTableNode);
      //layer table action event
      this.own(on(this.layerTable, 'actions-edit', lang.hitch(this, this._onEditFieldInfoClick, this.layerTable)));
      //layer table delete events
      on(this.layerTable, 'row-delete', lang.hitch(this, function (tr) {
        if (tr.select) {
          tr.select.destroy();
          delete tr.select;
        }
      }));

      on(this.layerTable, 'BeforeRowDelete', lang.hitch(this, function (tr) {
        var row = this.layerTable.getRowData(tr);

        array.forEach(this.config.queries, lang.hitch(this, function (field) {
          if (field.category === this.layerCategory) {
            array.forEach(field.Layer, lang.hitch(this, function (item, i) {
              if (item && (item.name === row.label.trim() || item.name === tr.childNodes[0].childNodes[0].title)) {
                field.Layer.splice(i, 1);
              }
            }));
          }
        }));
      }));

      //add tables to tab container
      this.tabContainer = new TabContainer({
        style: "height: 100%; width: 100%; ",
        tabs: [{
          title: "Settings",
          content: this.themeNode
        }],
        isNested: true
      }, this.content);
      this.tabContainer.startup();
    },

    /**
     * Edit icon clicked of a layer
     * 
     * @param {any} table 
     * @param {any} tr 
     */
    _onEditFieldInfoClick: function _onEditFieldInfoClick(table, tr) {
      var rowData = table.getRowData(tr);
      // if(rowData && rowData.edit) {
      //   var editFields = new EditFields({
      //     nls: this.nls,
      //     _layerInfo: tr._layerInfo
      //   });
      //   editFields.
      this.popupEditPage(rowData, tr);
    },
    /**
     * Show fields for selection of popup
     * 
     * @param {any} rowData 
     * @param {any} tr 
     */
    popupEditPage: function popupEditPage(rowData, tr) {
      this.currentLayer = rowData.label;

      var fields2 = [{
        name: 'visible',
        title: 'Display',
        type: 'checkbox',
        'class': 'display'
      }, {
        name: 'fieldName',
        title: 'Name',
        type: 'text'
      }, {
        name: 'label',
        title: 'Alias',
        type: 'text',
        editable: true
      }, {
        name: 'actions',
        title: 'Actions',
        type: 'actions',
        actions: ['up', 'down'],
        'class': 'actions'
      }];
      var args2 = {
        fields: fields2,
        selectable: false,
        style: {
          'height': '300px',
          'maxHeight': '300px'
        }
      };
      this._fieldsTable = new Table(args2);
      this._fieldsTable.placeAt(this.fieldsTable);
      this._fieldsTable.startup();
      var fieldsPopup = new Popup({
        titleLabel: 'Configure Layer Fields',
        width: 640,
        content: this._fieldsTable,
        maxHeight: 600,
        autoHeight: true,

        buttons: [{
          label: 'ok',
          onClick: lang.hitch(this, function () {
            this._resetFieldInfos(tr);
            fieldsPopup.close();
          })
        }, {
          label: 'cancel',
          classNames: ['jimu-btn-vacation'],
          onClick: lang.hitch(this, function () {
            fieldsPopup.close();
          })
        }],
        onClose: lang.hitch(this, function () {})
      });
      for (var i = 0; i < this.config.queries.length; i++) {
        for (var j = 0; j < this.config.queries[i].Layer.length; j++) {
          if (this.config.queries[i].Layer[j].name === rowData.label.trim() || this.config.queries[i].Layer[j].name === tr.childNodes[0].childNodes[0].title) {
            var temporaryFeatureLayer = new FeatureLayer(this.config.queries[i].Layer[j].url);
            this.layerInfotemplate = this.config.queries[i].Layer[j].infotemplate;
            temporaryFeatureLayer.on("load", lang.hitch(this, function () {
              for (var k = 0; k < temporaryFeatureLayer.fields.length; k++) {
                var rowData = {
                  fieldName: temporaryFeatureLayer.fields[k].name,
                  label: temporaryFeatureLayer.fields[k].alias
                };
                var result = this._fieldsTable.addRow(rowData);
                var tr = result.tr;
                if (this.layerInfotemplate) {
                  for (var m = 0; m < this.layerInfotemplate.length; m++) {
                    if (rowData.fieldName === this.layerInfotemplate[m].fieldName) {
                      rowData.visible = true;
                      rowData.label = this.layerInfotemplate[m].label;
                      this._fieldsTable.deleteRow(tr);
                      this._fieldsTable.addRow(rowData);
                    }
                  }
                }
              }
            }));
          }
        }
      }
    },
    /** set info template content in config */
    _resetFieldInfos: function _resetFieldInfos(tr) {

      var fieldsTableData = this._fieldsTable.getData();
      this.newFieldInfos = [];
      array.forEach(fieldsTableData, lang.hitch(this, function (fieldData) {

        if (fieldData.visible === true) {
          this.newFieldInfos.push({
            "fieldName": fieldData.fieldName,
            "label": fieldData.label,
            "visible": fieldData.visible
          });
        }
      }));
      if (this.config.queries.length) {
        array.forEach(this.config.queries, lang.hitch(this, function (item) {
          for (var i = 0; i < item.Layer.length; i++) {

            if ((item.Layer[i].name === this.currentLayer.trim() || item.Layer[i].name === tr.childNodes[0].childNodes[0].title) && item.Layer[i].infotemplate) {
              delete item.Layer[i].infotemplate;
              item.Layer[i].infotemplate = this.newFieldInfos;
              break;
            } else {
              if (item.Layer[i].name === this.currentLayer.trim() || item.Layer[i].name === tr.childNodes[0].childNodes[0].title) {
                item.Layer[i].infotemplate = this.newFieldInfos;
              }
            }
          }
        }));
      }
    },
    /**
             open data source popup
             **/
    _showChooser: function _showChooser() {
      var duplicateLayer = 0;
      var args = {
        titleLabel: "Set Data Source",

        dijitArgs: {
          multiple: false,
          createMapResponse: this.map.webMapResponse,
          portalUrl: this.appConfig.portalUrl,
          style: {
            height: '100%'
          }
        }
      };

      var sourcePopup = new _QueryableLayerSourcePopup(args);
      this.own(on(sourcePopup, 'ok', lang.hitch(this, function (item) {

        sourcePopup.close();
        sourcePopup = null;
        //check if duplicate Layer
        var data = this.layerTable.getData();
        array.forEach(data, lang.hitch(this, function (j) {
          if (j.label === item.name) {
            duplicateLayer = 1;
            new Message({
              message: this.nls.duplicateLayer
            });
            return;
          }
        }));
        //add selected layer to layer table
        if (duplicateLayer === 0) {
          this.flag = 1;
          lang.hitch(this, this._addlayer(item));
        }
      })));

      this.own(on(sourcePopup, 'cancel', lang.hitch(this, function () {
        sourcePopup.close();
        sourcePopup = null;
      })));

      sourcePopup.startup();
    },

    /**
     *add category to table
     * @param   {object} item  it contains category name
     **/
    _addCategory: function _addCategory(name) {

      html.setStyle(this.layerTableNode, 'display', 'block');
      //var categoryValue = this.category.categoryName.value;

      if (name.trim() === '' || name === undefined) {

        new Message({
          message: this.nls.emptyCategory
        });
        return;
      }
      var rowData = {
        label: name
      };
      var result = this.categoryTable.addRow(rowData);
      if (result.success && result.tr) {
        var tr = result.tr;
        var td = query('.simple-table-cell', tr)[0];
        html.setStyle(td, "verticalAlign", "middle");
      }
      var data = [];
      this.newJson = {};
      this.newJson.category = name;
      this.newJson.status = true;
      this.newJson.Layer = [];
      data = this.categoryTable.getData();
      if (data.length) {
        this.layerCategory = this.newJson.category;
        this._createjson(this.newJson);
        this.layerTable.clear();
      }
    },

    /**
     *add layer to table
     * @param   {object} item  it contains layer name
     **/

    _addlayer: function _addlayer(item) {
      var symbFlag = 0;
      html.setStyle(this.layerTableNode, 'display', 'block');
      html.setStyle(this.verticalRule, 'display', 'block');
      var urlFeatureLayer = item.url;
      var data = this.layerTable.getData();
      esriRequest({
        "url": item.url,
        "content": {
          "f": "json"
        },
        "callbackParamName": "callback"
      }).then(lang.hitch(this, function (evt) {
        var rowData = {
          label: item.name
        };

        var result = this.layerTable.addRow(rowData);
        var table = document.createElement('table');
        table.style = 'border-collapse: collapse;font-size: 90%;line-height: 15px;';
        result.tr.childNodes[0].childNodes[0].appendChild(table);
        if (evt.drawingInfo.renderer.symbol) {
          if (evt.drawingInfo.renderer.symbol.url) {
            this.symbolType = 'url';
            symbFlag = 1;
            var urlImage = urlFeatureLayer + '/images/' + evt.drawingInfo.renderer.symbol.url;
          } else {
            result.tr.childNodes[0].childNodes[0].style.height = "initial";
            var urlImage = evt.drawingInfo.renderer;
            this.symbolType = 'single';
            var b = evt.drawingInfo.renderer.symbol;
            var descriptors = jsonUtils.getShapeDescriptors(jsonUtils.fromJson(b));
            var mySurface = gfx.createSurface(result.tr.childNodes[0].childNodes[0].children[0], 30, 30);
            var shape = mySurface.createShape(descriptors.defaultShape).setFill(descriptors.fill).setStroke(descriptors.stroke);
            shape.applyTransform({
              dx: 10,
              dy: 10
            });
          }
        } else {
          symbFlag = 0;
          result.tr.childNodes[0].childNodes[0].style.height = "initial";
          if (evt.drawingInfo.renderer.uniqueValueInfos) {
            this.symbolType = 'unique';
            var urlImage = evt.drawingInfo.renderer.uniqueValueInfos;
            for (var i = 0; i < evt.drawingInfo.renderer.uniqueValueInfos.length; i++) {
              var tabletr = document.createElement('tr');
              var tabletd = document.createElement('td');
              tabletr.appendChild(tabletd);
              table.appendChild(tabletr);
              var b = evt.drawingInfo.renderer.uniqueValueInfos[i];
              var descriptors = jsonUtils.getShapeDescriptors(jsonUtils.fromJson(b.symbol));
              var mySurface = gfx.createSurface(result.tr.childNodes[0].childNodes[0].children[0].children[i].children[0], 30, 30);
              var shape = mySurface.createShape(descriptors.defaultShape).setFill(descriptors.fill).setStroke(descriptors.stroke);
              shape.applyTransform({
                dx: 10,
                dy: 10
              });
              result.tr.childNodes[0].childNodes[0].children[0].children[i].innerHTML += b.label;
            }
          }
        }
        if (this.flag === 1) {

          array.forEach(this.config.queries, lang.hitch(this, function (i) {
            if (i.category === this.layerCategory) {
              i.Layer.push({
                name: item.name,
                url: item.url,
                image: urlImage,
                symboltype: this.symbolType,
                geometrytype: item.definition.geometryType
              });
            }
          }));
        }
        if (result.success && result.tr) {

          //var innerHTML = result.tr.innerHTML;
          if (symbFlag === 1) {
            var label = result.tr.children[0].children[0].innerHTML;
            result.tr.children[0].children[0].innerHTML = '<img style="height: 20px;" src=' + '"' + urlImage + '"' + '></img>' + label;
            // result.tr.innerHTML = '<img style="height: 20px;" src=' + '"' + urlImage + '"' + '></img>' + innerHTML;
          }
          var tr = result.tr;
          var td = query('.simple-table-cell', tr)[0];
          html.setStyle(td, "verticalAlign", "middle");
        }
      }));
    },

    /**
     *add layers for each category to config
     **/

    _createjson: function _createjson(layer) {
      if (this.config.queries.length) {
        array.forEach(this.config.queries, lang.hitch(this, function (item) {
          if (item.category === layer.category) {
            layer.status = false;
          }
        }));
      }
      this.config.queries.push(layer);
    },

    /**
     *remove layers of partiuclar category from config
     **/
    _deleteJson: function _deleteJson(layer) {

      array.forEach(this.config.queries, lang.hitch(this, function (item) {
        if (item.category === layer) {
          item.status = false;
        }
      }));
    },

    /**
     *update layers of partiuclar category in config
     * @param   {object} item  it contains category name
     **/

    _recreate: function _recreate(name) {
      this.layerTable.clear();
      this.newJson = {};
      this.newJson.category = name;
      this.newJson.status = true;
      array.forEach(this.config.queries, lang.hitch(this, function (item) {
        if (item.category === name) {
          this.newJson.Layer = item.Layer;
          array.forEach(item.Layer, lang.hitch(this, function (detail) {
            this.flag = 0;
            this._addlayer(detail);
          }));
        }
      }));
    },

    /**
     * Get themes
     */
    _getThemes: function _getThemes() {
      var i = 0;
      array.forEach(this.config.queries, lang.hitch(this, function (item) {

        item.status = true;
        this.layerTable.clear();
        //this.newJson = {};
        this.newJson.category = item.category;
        this.newJson.status = true;
        this.newJson.Layer = item.Layer;
        html.setStyle(this.layerTableNode, 'display', 'block');
        var rowData = {
          label: item.category
        };

        var result = this.categoryTable.addRow(rowData);
        if (result.success && result.tr) {
          var tr = result.tr;
          var td = query('.simple-table-cell', tr)[0];
          html.setStyle(td, "verticalAlign", "middle");
        }
        if (i === 0) {

          array.forEach(item.Layer, lang.hitch(this, function (detail) {
            this.layerCategory = item.category;
            this.flag = 0;
            this._addlayer(detail);
          }));
        }
        i++;
      }));
    },

    /**
     *open add category popup
     **/
    _showPopup: function _showPopup() {
      this.categoryPopup.show();
    },

    /**
     *hide add category popup
     **/
    _hidePopup: function _hidePopup() {
      this.categoryPopup.hide();
    },

    /**
     *add category name to table
     **/
    EnterCategory: function EnterCategory() {
      this._addCategory(this.categoryName.value);
      this.categoryName.set('value', "");
      this.categoryPopup.hide();
    }

  });
});
