#-------------------------------------------------------------------------------
# Name:        SiteSuitabilityGrid
# Purpose:     Check Site Suitability for EV Stations
#
# Author:      Pravesh Rai @ esri staff
#
# Created:     21/08/2018
# Copyright:   (c) esriIndia reserves the right
# Licence:     server needs to be having spatial license available.
#-------------------------------------------------------------------------------

import arcpy
from arcpy import env
arcpy.env.overwriteOutput = True

# Check out any necessary licenses
arcpy.CheckOutExtension("spatial")

#_sdefileName =  "D:/PythonWorkspace/MoveHack/EVData.gdb/"
#_intermediateResults = "F:/SiteSuitabilityModel/grid.gdb/"
#_sdefileName = "F:/SiteSuitabilityModel/gisdb@localhost.sde/"\
#_dbinfo = "gisdb.sde."

_intermediateResults = "F:/SiteSuitabilityModel/grid.gdb/"
_sdefileName = "F:/SiteSuitabilityModel/"
_dbinfo = "EVData.gdb/"

arcpy.AddMessage("==== _dbinfo ==="+_dbinfo)

#variables
_ssParticipants = _sdefileName + _dbinfo + "SSParticipantLayers" # detail of flat table
_garbage = []


_gridLyr = ['SHAPE@','Score']


_gridLyrCsr = arcpy.da.UpdateCursor(_intermediateResults+"grid250m", _gridLyr)
#_gridLyrCsr = arcpy.UpdateCursor(_intermediateResults+"Grid50m_1")

_countGrid = 0

for rowGrid in _gridLyrCsr:
    _grid = rowGrid[0]
    _countGrid+=1
    _countGridPolygon = str(_countGrid)

    arcpy.AddMessage("grid index" +str(_countGridPolygon))

    if arcpy.Exists(_intermediateResults+"poly"+_countGridPolygon):
                    arcpy.Delete_management(_intermediateResults+"poly"+_countGridPolygon)
    arcpy.FeatureToPolygon_management(_grid, _intermediateResults+"poly"+_countGridPolygon, "","NO_ATTRIBUTES", "")

    #Process each layer in layerDetails table
    _ssParticipantsLayerFlds = ['LayerName', 'LayerType','LayerCategory','aliasname']


    _ssPartLyrCsr = arcpy.da.SearchCursor(_ssParticipants, _ssParticipantsLayerFlds)

    _avgScoreList = []

    for _lyrRow in _ssPartLyrCsr:
        try:
            _layerType = _lyrRow[1]
            _lyerCategory = _lyrRow[2]
            if _layerType == "Vector" :

                if _lyerCategory == "0":  # 0 for those that have multiple features in a single FC
                    _layerName = _lyrRow[0]
                    _aliasname = _lyrRow[3]
                    print "_layerName =  "+str(_layerName)
                    arcpy.AddMessage("_layerName" +str(_layerName))
                    if arcpy.Exists(_intermediateResults +_aliasname+_countGridPolygon):
                        arcpy.Delete_management(_intermediateResults +_aliasname+_countGridPolygon)
                    arcpy.Intersect_analysis([_intermediateResults+"poly"+_countGridPolygon, _sdefileName + _dbinfo +_layerName], _intermediateResults +_aliasname+_countGridPolygon, join_attributes="ALL", cluster_tolerance="-1 Unknown", output_type="INPUT")
                    arcpy.AddMessage("Intersection of "+_layerName+ "Done")
                    #_garbage.append(_aliasname)
                    _intersectedLayerFlds = ['score']
                    _totalScore = 0
                    _count = 0
                    _intersectedCrs = arcpy.da.SearchCursor(_intermediateResults +_aliasname+_countGridPolygon,_intersectedLayerFlds)

                    for _intersectedRow in _intersectedCrs:
                        try:
                            #_category = _intersectedRow[0]
                            _count+=1
                            _score = _intersectedRow[0]

                            _totalScore = _totalScore+_score
                        except Exception as ex:
                            arcpy.AddMessage(ex)
                            arcpy.AddMessage("exception in "+_layerName)
                    del _intersectedCrs

                    _avgScore = _totalScore / _count
                    arcpy.AddMessage("_avgScore of "+_layerName + "= "+str(_avgScore))
                    _avgScoreList.append(_avgScore)
                    arcpy.AddMessage(" ")

                elif _lyerCategory == "1": # 1 is for Existing EV Station
                    _layerName = _lyrRow[0]
                    _aliasname = _lyrRow[3]

                    arcpy.AddMessage("_layerName" +str(_layerName))
                    if arcpy.Exists(_intermediateResults +_aliasname+_countGridPolygon):
                        arcpy.Delete_management(_intermediateResults +_aliasname+_countGridPolygon)
                    arcpy.Intersect_analysis([_intermediateResults+"poly"+_countGridPolygon, _sdefileName + _dbinfo +_layerName], _intermediateResults +_aliasname +_countGridPolygon, join_attributes="ALL", cluster_tolerance="-1 Unknown", output_type="INPUT")
                    arcpy.AddMessage("Intersection of "+_layerName+ "Done")
                    #_garbage.append(_aliasname)
                    _intersectedLayerFlds = ['score']
                    _totalScore = 0
                    _count = 0
                    _intersectedCrs = arcpy.da.SearchCursor(_intermediateResults +_aliasname +_countGridPolygon, _intersectedLayerFlds)

                    for _intersectedRow in _intersectedCrs:
                        try:
                            #_category = _intersectedRow[0]
                            _count+=1
                            _score = _intersectedRow[0]

                            _totalScore = _score
                        except Exception as ex:
                            arcpy.AddMessage(ex)
                            arcpy.AddMessage("exception in "+_layerName)
                    del _intersectedCrs

                    _avgScore = _totalScore * _count
                    arcpy.AddMessage("_avgScore of "+_layerName + "= "+str(_avgScore))
                    _avgScoreList.append(_avgScore)
                    arcpy.AddMessage(" ")

            '''
            elif _layerType == "Raster":
                if _lyerCategory == "2": # it is for those layer that are play as raster
                    _layerName = _lyrRow[0]
                    _aliasname = _lyrRow[3]
                    print "_layerName =  "+str(_layerName)
                    arcpy.AddMessage("_layerName " +str(_layerName) +" "+str(_sdefileName + _dbinfo +_layerName))

                    # clip the input rasetr(_layerName) by buffer Output result
                    #Process extentof AOI
                    arcpy.env.extent = _intermediateResults+"poly"+_countGridPolygon
                    _Extent = "{0} {1} {2} {3}".format(arcpy.env.extent.XMin, arcpy.env.extent.YMin, arcpy.env.extent.XMax, arcpy.env.extent.YMax)

                    if arcpy.Exists(_intermediateResults+"clip"+_countGridPolygon):
                        arcpy.Delete_management(_intermediateResults+"clip"+_countGridPolygon)
                    arcpy.Clip_management(_sdefileName+ _dbinfo +_layerName, _Extent, _intermediateResults+"clip"+_countGridPolygon, _intermediateResults+"poly"+_countGridPolygon, "32767", "NONE", "MAINTAIN_EXTENT")
                    _garbage.append("clip")
                    # reclassify the cliped raster

                    if arcpy.Exists(_intermediateResults+"recls"+_countGridPolygon):
                        arcpy.Delete_management(_intermediateResults+"recls"+_countGridPolygon)
                    arcpy.gp.Reclassify_sa(_intermediateResults+"clip"+_countGridPolygon, "Value", "140 160 5;160 180 4;180 200 3;200 220 2;220 240 1;240 260 0", _intermediateResults+"recls"+_countGridPolygon, "NODATA")
                    _garbage.append("recls")

                    _rasterLayerFld = ['Value','Count']
                    _pixelCount = 0
                    _pixelValueCount = 0
                    _rasterCrs = arcpy.da.SearchCursor(_intermediateResults+"recls"+_countGridPolygon,_rasterLayerFld)
                    for row in _rasterCrs:
                        print "Count =  "+str(row[1])
                        _value = row[0]
                        _count = row[1]

                        _pixelCount = _pixelCount + _count

                        if _value == 3 or _value == 4 or _value == 5 :
                            _pixelValueCount = _pixelValueCount + _count

                    _avgScore = _pixelValueCount/_pixelCount
                    arcpy.AddMessage("_avgScore of "+_layerName + "= "+str(_avgScore))
                    _avgScoreList.append(_avgScore)
                    arcpy.AddMessage(" ")


                    del _rasterCrs

                    '''


        except Exception as e:
            arcpy.AddMessage(e)
            print 'Inside except block'
            continue

    del _ssPartLyrCsr

    _avgScoreTotal = 0.0

    arcpy.AddMessage("_avgScoreList"+str(len(_avgScoreList)))
    print "_avgScoreList"+str(len(_avgScoreList))

    for i in range(len(_avgScoreList)):
        _avgScoreTotal = _avgScoreTotal + _avgScoreList[i]

    arcpy.AddMessage("_avgScoreTotal= "+str(_avgScoreTotal))
    _finalAvgScore = _avgScoreTotal / len(_avgScoreList)



    arcpy.AddMessage("_finalAvgScore "+str(_finalAvgScore))
    print "_finalAvgScore = "+str(_finalAvgScore)



    #_score = _finalAvgScore

    rowGrid[1] = _finalAvgScore
    #row.setValue('Scr', outputAvgScore)

    _gridLyrCsr.updateRow(rowGrid)
    arcpy.AddMessage("Success ")

    print "Success"
del _gridLyrCsr


