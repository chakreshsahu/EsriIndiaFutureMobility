#-------------------------------------------------------------------------------
# Name:        SiteSuitability
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
import sys

# Check out any necessary licenses
arcpy.CheckOutExtension("spatial")

# intermediate results save at this path
_intermediateResults = "F:/SiteSuitabilityModel/scrachGDB.gdb"

_garbage =[]

# inputs
#_inputPoint =_intermediateResults+"inputPoint"
_inputX = arcpy.GetParameterAsText(0)
_inputY = arcpy.GetParameterAsText(1)
_inputConditionValue = arcpy.GetParameter(2)
_sdefileName =  arcpy.GetParameterAsText(3)
#_finalAvgScore = arcpy.GetParameter(3)
#outputAvgScore = sys.argv[4]

# create point form input x nd y
point = arcpy.Point(_inputX, _inputY)
spatial_reference = arcpy.SpatialReference(4326)#3857
ptGeometry = arcpy.PointGeometry(point,spatial_reference)

# project point from gcs to auxillary mercator
outCS = arcpy.SpatialReference(3857)
if arcpy.Exists(_intermediateResults+"/point"+_inputConditionValue):
    arcpy.Delete_management(_intermediateResults+"/point"+_inputConditionValue)
arcpy.Project_management(ptGeometry, _intermediateResults+"/point"+_inputConditionValue, outCS)
_garbage.append("point")

# sde path
#"F:/SiteSuitabilityModel/gisdb@localhost.sde" #arcpy.GetParameterAsText(1)

arcpy.AddMessage("sdefile = "+_sdefileName)
#_descWorkspace = arcpy.Describe(_sdefileName)
#_dbinfo=str(_descWorkspace.connectionProperties.database)+'.'+str(_descWorkspace.connectionProperties.user)+'.'
_dbinfo = "gisdb.sde."
arcpy.AddMessage("==== _dbinfo ==="+_dbinfo)

#variables
_ssParticipants = _sdefileName+"/" + _dbinfo + "SSParticipantLayers" # detail of flat table



# call of this function to delete intermediate results
def deleteIntermediateResults(_garbage, _intermediateResults,_inputConditionValue):
    for _garbg in _garbage:
        arcpy.Delete_management(_intermediateResults+"/"+_garbg+_inputConditionValue)

#_inputPoint = _intermediateResults+"inputPoint"

# select the required point from _inputPoint FC
#arcpy.Select_analysis(_inputPoint, _intermediateResults+"inputPoint_Select"+_inputConditionValue, where_clause="OBJECTID = "+_inputConditionValue)
#arcpy.AddMessage("Selection Done")



# get buffer of inputPoint with distance of 3KM
if arcpy.Exists(_intermediateResults+"/bufOut"+_inputConditionValue):
    arcpy.Delete_management(_intermediateResults+"/bufOut"+_inputConditionValue)
arcpy.Buffer_analysis(_intermediateResults+"/point"+_inputConditionValue, _intermediateResults+"/bufOut"+_inputConditionValue,"0.5 Kilometers", line_side="FULL", line_end_type="ROUND", dissolve_option="NONE", dissolve_field="", method="PLANAR")
_garbage.append("bufOut")
arcpy.AddMessage("Buffer Done")
#Process each layer in layerDetails table
__ssParticipantsLayerFlds = ['LayerName', 'LayerType','LayerCategory','aliasname']


_lyrCsr = arcpy.da.SearchCursor(_ssParticipants, __ssParticipantsLayerFlds)

_avgScoreList = []

for _lyrRow in _lyrCsr:
    try:
        _layerType = _lyrRow[1]
        _lyerCategory = _lyrRow[2]
        if _layerType == "Vector" :

            if _lyerCategory == "0":  # 0 for those that have multiple features in a single FC
                _layerName = _lyrRow[0]
                _aliasname = _lyrRow[3]
                print "_layerName =  "+str(_layerName)
                arcpy.AddMessage("_layerName = " +str(_layerName))
                if arcpy.Exists(_intermediateResults+"/"+_aliasname+_inputConditionValue):
                    arcpy.Delete_management(_intermediateResults+"/"+_aliasname+_inputConditionValue)
                arcpy.Intersect_analysis([_intermediateResults+"/bufOut"+_inputConditionValue, _sdefileName+"/"+ _dbinfo +_layerName], _intermediateResults+"/"+_aliasname+_inputConditionValue, join_attributes="ALL", cluster_tolerance="-1 Unknown", output_type="INPUT")
                arcpy.AddMessage("Intersection of "+_layerName+ "Done")
                _garbage.append(_aliasname)
                _intersectedLayerFlds = ['score']
                _totalScore = 0
                _count = 0
                _intersectedCrs = arcpy.da.SearchCursor(_intermediateResults+"/"+_aliasname+_inputConditionValue,_intersectedLayerFlds)

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
                #_percentagescore = (_avgScore/5)*100
                #arcpy.AddMessage("_percentagescore "+str(_percentagescore)+"%")
                #print "AverageTotal "+str(_avgScore)
                #print "_percentagescore "+str(_percentagescore)+" %"

            elif _lyerCategory == "1": # 1 is for Existing EV Station
                _layerName = _lyrRow[0]
                _aliasname = _lyrRow[3]
                print "_layerName =  "+str(_layerName)
                arcpy.AddMessage("_layerName = " +str(_layerName))
                if arcpy.Exists(_intermediateResults+"/"+_aliasname+_inputConditionValue):
                    arcpy.Delete_management(_intermediateResults+"/"+_aliasname+_inputConditionValue)
                arcpy.Intersect_analysis([ _sdefileName+"/" + _dbinfo +_layerName, _intermediateResults+"/bufOut"+_inputConditionValue], _intermediateResults+"/"+_aliasname+_inputConditionValue, join_attributes="ALL", cluster_tolerance="-1 Unknown", output_type="INPUT")
                _garbage.append(_aliasname)
                _intersectedLayerFlds = ['score']
                _totalScore = 0
                _count = 0
                _intersectedCrs = arcpy.da.SearchCursor(_intermediateResults+"/"+_aliasname+_inputConditionValue,_intersectedLayerFlds)

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


        '''
        elif _layerType == "Raster":
            if _lyerCategory == "2": # it is for those layer that are play as raster
                _layerName = _lyrRow[0]
                _aliasname = _lyrRow[3]
                print "_layerName =  "+str(_layerName)
                arcpy.AddMessage("_layerName " +str(_layerName) +" "+str(_sdefileName+"/" + _dbinfo +_layerName))

                # clip the input rasetr(_layerName) by buffer Output result
                #Process extentof AOI
                arcpy.env.extent = _intermediateResults+"/bufOut"+_inputConditionValue
                _Extent = "{0} {1} {2} {3}".format(arcpy.env.extent.XMin, arcpy.env.extent.YMin, arcpy.env.extent.XMax, arcpy.env.extent.YMax)
                if arcpy.Exists(_intermediateResults+"/clip"+_inputConditionValue):
                    arcpy.Delete_management(_intermediateResults+"/clip"+_inputConditionValue)
                arcpy.Clip_management(_sdefileName+"/" + _dbinfo +_layerName, _Extent, _intermediateResults+"/clip"+_inputConditionValue, _intermediateResults+"/bufOut"+_inputConditionValue, "32767", "NONE", "MAINTAIN_EXTENT")
                _garbage.append("clip")
                # reclassify the cliped raster
                if arcpy.Exists(_intermediateResults+"/recls"+_inputConditionValue):
                    arcpy.Delete_management(_intermediateResults+"/recls"+_inputConditionValue)
                arcpy.gp.Reclassify_sa(_intermediateResults+"/clip"+_inputConditionValue, "Value", "140 160 5;160 180 4;180 200 3;200 220 2;220 240 1;240 260 0", _intermediateResults+"/recls"+_inputConditionValue, "NODATA")
                _garbage.append("recls")
                _rasterLayerFld = ['Value','Count']
                _pixelCount = 0
                _pixelValueCount = 0
                _rasterCrs = arcpy.da.SearchCursor(_intermediateResults+"/recls"+_inputConditionValue,_rasterLayerFld)
                for row in _rasterCrs:
                    print "Count =  "+str(row[1])
                    _value = row[0]
                    _count = row[1]

                    _pixelCount = _pixelCount + _count

                    if _value == 3 or _value == 4 or _value == 5 :
                        _pixelValueCount = _pixelValueCount + _count
                del _rasterCrs

                _avgScore = _pixelValueCount/_pixelCount
                arcpy.AddMessage("_avgScore of "+_layerName + "= "+str(_avgScore))
                _avgScoreList.append(_avgScore)


                '''


    except Exception as e:
        arcpy.AddMessage(e)
        print 'Inside except block'
        continue

del _lyrCsr

_avgScoreTotal = 0.0

arcpy.AddMessage("_avgScoreList"+str(len(_avgScoreList)))
print "_avgScoreList"+str(len(_avgScoreList))

for i in range(len(_avgScoreList)):
    _avgScoreTotal = _avgScoreTotal + _avgScoreList[i]

arcpy.AddMessage("_avgScoreTotal= "+str(_avgScoreTotal))
_finalAvgScore = _avgScoreTotal / len(_avgScoreList)

arcpy.AddMessage("_finalAvgScore "+str(_finalAvgScore))
print "_finalAvgScore = "+str(_finalAvgScore)

outputAvgScore = str(_finalAvgScore)

arcpy.AddMessage("outputAvgScore = "+outputAvgScore)

arcpy.SetParameterAsText(4,outputAvgScore)

# Delete intermediateResults
deleteIntermediateResults(_garbage,_intermediateResults,_inputConditionValue)
