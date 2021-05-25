(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = Date.now || now

function now() {
    return new Date().getTime()
}

},{}],2:[function(require,module,exports){

/**
 * Module dependencies.
 */

var now = require('date-now');

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * @source underscore.js
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
 * @param {Function} function to wrap
 * @param {Number} timeout in ms (`100`)
 * @param {Boolean} whether to execute at the beginning (`false`)
 * @api public
 */

module.exports = function debounce(func, wait, immediate){
  var timeout, args, context, timestamp, result;
  if (null == wait) wait = 100;

  function later() {
    var last = now() - timestamp;

    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return function debounced() {
    context = this;
    args = arguments;
    timestamp = now();
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };
};

},{"date-now":1}],3:[function(require,module,exports){
/**
 * @module eowcs/kvp
 */

'use strict';

var utils = require("../utils");

/**
 * Returns a 'DescribeEOCoverageSet' request URL with parameters encoded as KVP.
 *
 * @param url the base URL of the service
 * @param eoid the ID of the coverage set
 * @param options an object containing any the following optional parameters
 * @param options.bbox an array of four values in the following order:
 *                     [minx, miny, maxx, maxy]
 * @param options.subsetX the subset of the X axis as an array in the following form:
 *                        [minx, maxx]
 * @param options.subsetY the subset of the Y axis as an array in the following form:
 *                        [minx, maxx]
 * @param options.subsetCRS the CRS definition in which the spatial subsets are
 *                          expressed in
 * @param options.subsetTime the subset on the time axis in the following form:
 *                           [beginTime, endTime]
 * @param options.containment a string describing the containment method for all
 *                            subsets. One of "overlaps" and "contains".
 * @param options.count an integer, limiting the maximum number of returned coverage
 *                       descriptions within the coverage set.
 * @param options.sections an array of strings for sections to be included, each one of
 *                          "CoverageDescriptions" and "DatasetSeriesDescriptions".
 *
 * @param extraParams an object containing any extra (vendor specific)
 *                    parameters which will be appended to the query string
 *
 * @returns the constructed request URL
 */

function describeEOCoverageSetURL(url, eoid, options, extraParams) {
    if (!url || !eoid) {
        throw new Error("Parameters 'url' and 'eoid' are mandatory.");
    }
    options = options || {};
    extraParams = extraParams || {};

    var params = ['service=wcs', 'version=2.0.0', 'request=describeeocoverageset', 'eoid=' + eoid];

    if (options.bbox && !options.subsetX && !options.subsetY) {
        options.subsetX = [options.bbox[0], options.bbox[2]];
        options.subsetY = [options.bbox[1], options.bbox[3]];
    }
    if (options.subsetX) {
        params.push('subset=x(' + options.subsetX[0] + ',' + options.subsetX[1] + ')');
    }
    if (options.subsetY) {
        params.push('subset=y(' + options.subsetY[0] + ',' + options.subsetY[1] + ')');
    }

    if (options.subsetTime) {
        params.push('subset=phenomenonTime("' + options.subsetTime[0] + '","' + options.subsetTime[1] + '")');
    }
    if (options.containment) {
        params.push('containment=' + options.containment);
    }
    if (options.count) {
        params.push('count=' + options.count);
    }
    if (options.sections) {
        params.push('sections=' + options.sections.join(","));
    }
    var extra = utils.objectToKVP(extraParams);
    return url + (url.charAt(url.length-1) !== "?" ? "?" : "")
            + params.join("&") + ((extra.length > 0) ? "&" + extra : "");
}

module.exports = {
    describeEOCoverageSetURL: describeEOCoverageSetURL
};

},{"../utils":6}],4:[function(require,module,exports){
/**
 * @module eowcs/parse
 */

'use strict';

var utils = require("../utils");
var coreParse = require("../parse");


var ns = {
    wcs: "http://www.opengis.net/wcs/2.0",
    gml: "http://www.opengis.net/gml/3.2",
    gmlcov: "http://www.opengis.net/gmlcov/1.0",
    eop: "http://www.opengis.net/eop/2.0",
    wcseo: "http://www.opengis.net/wcs/wcseo/1.0",
    wcseoold: "http://www.opengis.net/wcseo/1.0",  // support old definitions aswell
    om: "http://www.opengis.net/om/2.0"
}

var xPath = utils.createXPath(ns);

var xPathArray = utils.createXPathArray(ns);


function parseEOCoverageSetDescription(node) {
    var covDescriptions = xPath(node, "wcs:CoverageDescriptions");
    var cdescs = (covDescriptions != null) ? coreParse.callParseFunctions(
        "CoverageDescriptions", covDescriptions
    ) : [];

    var dssDescriptions = xPath(node, "wcseo:DatasetSeriesDescriptions");
    var dssdescs = (dssDescriptions != null) ? coreParse.callParseFunctions(
        "DatasetSeriesDescriptions", dssDescriptions
    ) : [];

    return {
        "numberMatched": node.getAttribute("numberMatched"),
        "numberReturned": node.getAttribute("numberReturned"),
        "coverageDescriptions": cdescs.coverageDescriptions,
        "datasetSeriesDescriptions": dssdescs.datasetSeriesDescriptions
    };
}

function parseDatasetSeriesDescriptions(node) {
    var descs = utils.map(xPathArray(node, "wcseo:DatasetSeriesDescription|wcseoold:DatasetSeriesDescription"), function(datasetSeriesDescription) {
        return coreParse.callParseFunctions("DatasetSeriesDescription", datasetSeriesDescription);
    });

    return {datasetSeriesDescriptions: descs};
}

function parseDatasetSeriesDescription(node) {
    return {
        "datasetSeriesId": xPath(node, "wcseo:DatasetSeriesId/text()|wcseoold:DatasetSeriesId/text()"),
        "timePeriod": [
            new Date(xPath(node, "gml:TimePeriod/gml:beginPosition/text()")),
            new Date(xPath(node, "gml:TimePeriod/gml:endPosition/text()"))
        ]
    };
}

function parseExtendedCapabilities(node) {
    return {
        "contents": {
            "datasetSeries": utils.map(xPathArray(node, "wcs:Contents/wcs:Extension/wcseo:DatasetSeriesSummary|wcs:Contents/wcs:Extension/wcseoold:DatasetSeriesSummary"), function(sum) {
              return coreParse.callParseFunctions("DatasetSeriesDescription", sum);
            })
        }
    };
}

function parseExtendedCoverageDescription(node) {
    var eoMetadata = xPath(node, "gmlcov:metadata/gmlcov:Extension/wcseo:EOMetadata|gmlcov:metadata/wcseo:EOMetadata|gmlcov:metadata/gmlcov:Extension/wcseoold:EOMetadata|gmlcov:metadata/wcseoold:EOMetadata");
    if (eoMetadata) {
        var phenomenonTime = xPath(eoMetadata, "eop:EarthObservation/om:phenomenonTime");
        return {
            "footprint": utils.stringToFloatArray(xPath(eoMetadata, "eop:EarthObservation/om:featureOfInterest/eop:Footprint/eop:multiExtentOf/gml:MultiSurface/gml:surfaceMember/gml:Polygon/gml:exterior/gml:LinearRing/gml:posList/text()")),
            "timePeriod": [
                new Date(xPath(phenomenonTime, "gml:TimePeriod/gml:beginPosition/text()")),
                new Date(xPath(phenomenonTime, "gml:TimePeriod/gml:endPosition/text()"))
            ]
        };
    }
    else return {};
}

var parseFunctions = {
    "EOCoverageSetDescription": parseEOCoverageSetDescription,
    "DatasetSeriesDescriptions": parseDatasetSeriesDescriptions,
    "DatasetSeriesDescription": parseDatasetSeriesDescription,
    "Capabilities": parseExtendedCapabilities,
    "CoverageDescription": parseExtendedCoverageDescription
};

module.exports = {
    parseFunctions: parseFunctions
}

},{"../parse":5,"../utils":6}],5:[function(require,module,exports){
/**
 * @module core/parse
 */

'use strict';

var utils = require("./utils");


var parseXml;

if (typeof window.DOMParser != "undefined") {
    parseXml = function(xmlStr) {
        return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
    };
} else if (typeof window.ActiveXObject != "undefined" &&
       new window.ActiveXObject("Microsoft.XMLDOM")) {
    parseXml = function(xmlStr) {
        var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = "false";
        xmlDoc.loadXML(xmlStr);
        return xmlDoc;
    };
}

/**
 * @private
 * @global
 */

/**
 * A hash-table associating the node name of common WCS objects with their
 * according parse function.
 */

var parseFunctions = {};

/**
 * @private
 */

var ns = {
    xlink: "http://www.w3.org/1999/xlink",
    ows: "http://www.opengis.net/ows/2.0",
    wcs: "http://www.opengis.net/wcs/2.0",
    gml: "http://www.opengis.net/gml/3.2",
    gmlcov: "http://www.opengis.net/gmlcov/1.0",
    swe: "http://www.opengis.net/swe/2.0",
    crs: "http://www.opengis.net/wcs/crs/1.0",
    int: "http://www.opengis.net/wcs/interpolation/1.0"
}

var xPath = utils.createXPath(ns);

var xPathArray = utils.createXPathArray(ns);

/**
 * Registers a new node parsing function for a specified tagName. A function
 * can be registered to multiple tagNames.
 *
 * @param tagName the tagName the function is registered to
 *
 * @param parseFunction the function to be executed. The function shall
 *                      receive the tag name and a wrapped DOM object
 *                      as parameters and shall return an object of all parsed
 *                      attributes. For extension parsing functions only
 *                      extensive properties shall be parsed.
 */

function pushParseFunction(tagName, parseFunction) {
    if (parseFunctions.hasOwnProperty(tagName)) {
        parseFunctions[tagName].push(parseFunction);
    }
    else {
        parseFunctions[tagName] = [parseFunction];
    }
}

/**
 * Convenience function to push multiple parsing functions at one. The same
 * rules as with `WCS.Core.pushParseFunction` apply here.
 *
 * @param obj a hash-table with key-value pairs, where the key is the tag name
 *            and the value the parsing function.
 */

function pushParseFunctions(obj) {
    for (var key in obj) {
        pushParseFunction(key, obj[key]);
    }
}

/**
 * Calls all registered functions for a specified node name. A merged object
 * with all results of each function is returned.
 *
 * @param tagName the tagName of the node to be parsed
 *
 * @param node the DOM object
 *
 * @returns the merged object of all parsing results
 */

function callParseFunctions(tagName, node, options) {
    if (parseFunctions.hasOwnProperty(tagName)) {
        var funcs = parseFunctions[tagName],
            endResult = {};
        for (var i = 0; i < funcs.length; ++i) {
            var result = funcs[i](node, options);
            utils.deepMerge(endResult, result);
        }
        return endResult;
    }
    else
        throw new Error("No parsing function for tag name '" + tagName + "' registered.");
}

/**
 * Parses a (EO-)WCS response to JavaScript objects. 
 *
 * @param xml the XML string to be parsed
 * @param options options for parsing
 * @param options.throwOnException if true, an exception is thrown when an
 *                                 exception report is parsed
 *
 * @returns depending on the response a JavaScript object with all parsed data
 *          or a collection thereof.
 */

function parse(xml, options) {
    var root;
    if (typeof xml === "string") {
        root = parseXml(xml).documentElement;
    }
    else {
        root = xml.documentElement;
    }
    return callParseFunctions(root.localName, root, options);
}


/**
 * Parsing function for ows:ExceptionReport elements.
 *
 * @param node the DOM object
 * @param options
 * @param options.throwOnException throw an exception when an exception report
 *                                 is parsed
 *
 * @returns the parsed object
 */

function parseExceptionReport(node, options) {
    var exception = xPath(node, "ows:Exception");
    var parsed = {
        "code": exception.getAttribute("exceptionCode"),
        "locator": exception.getAttribute("locator"),
        "text": xPath(exception, "ows:ExceptionText/text()")
    };
    if (options && options.throwOnException) {
        var e = new Exception(parsed.text);
        e.locator = parsed.locator;
        e.code = parsed.code;
        throw e;
    }
    else return parsed;
}

/**
 * Parsing function for wcs:Capabilities elements.
 *
 * @param node the DOM object
 *
 * @returns the parsed object
 */

function parseCapabilities(node) {
    return {
        "serviceIdentification": {
            "title": xPath(node, "ows:ServiceIdentification/ows:Title/text()"),
            "abstract": xPath(node, "ows:ServiceIdentification/ows:Abstract/text()"),
            "keywords": xPathArray(node, "ows:ServiceIdentification/ows:Keywords/ows:Keyword/text()"),
            "serviceType": xPath(node, "ows:ServiceIdentification/ows:ServiceType/text()"),
            "serviceTypeVersion": xPath(node, "ows:ServiceIdentification/ows:ServiceTypeVersion/text()"),
            "profiles": xPathArray(node, "ows:ServiceIdentification/ows:Profile/text()"),
            "fees": xPath(node, "ows:ServiceIdentification/ows:Fees/text()"),
            "accessConstraints": xPath(node, "ows:ServiceIdentification/ows:AccessConstraints/text()")
        },
        "serviceProvider": {
            "providerName": xPath(node, "ows:ServiceProvider/ows:ProviderName/text()"),
            "providerSite": xPath(node, "ows:ServiceProvider/ows:ProviderSite/@xlink:href"),
            "individualName": xPath(node, "ows:ServiceProvider/ows:ServiceContact/ows:IndividualName/text()"),
            "positionName": xPath(node, "ows:ServiceProvider/ows:ServiceContact/ows:PositionName/text()"),
            "contactInfo": {
                "phone": {
                    "voice": xPath(node, "ows:ServiceProvider/ows:ServiceContact/ows:ContactInfo/ows:Phone/ows:Voice/text()"),
                    "facsimile": xPath(node, "ows:ServiceProvider/ows:ServiceContact/ows:ContactInfo/ows:Phone/ows:Facsimile/text()")
                },
                "address": {
                    "deliveryPoint": xPath(node, "ows:ServiceProvider/ows:ServiceContact/ows:ContactInfo/ows:Address/ows:DeliveryPoint/text()"),
                    "city": xPath(node, "ows:ServiceProvider/ows:ServiceContact/ows:ContactInfo/ows:Address/ows:City/text()"),
                    "administrativeArea": xPath(node, "ows:ServiceProvider/ows:ServiceContact/ows:ContactInfo/ows:Address/ows:AdministrativeArea/text()"),
                    "postalCode": xPath(node, "ows:ServiceProvider/ows:ServiceContact/ows:ContactInfo/ows:Address/ows:PostalCode/text()"),
                    "country": xPath(node, "ows:ServiceProvider/ows:ServiceContact/ows:ContactInfo/ows:Address/ows:Country/text()"),
                    "electronicMailAddress": xPath(node, "ows:ServiceProvider/ows:ServiceContact/ows:ContactInfo/ows:Address/ows:ElectronicMailAddress/text()")
                },
                "onlineResource": xPath(node, "ows:ServiceProvider/ows:ServiceContact/ows:ContactInfo/ows:OnlineResource/@xlink:href"),
                "hoursOfService": xPath(node, "ows:ServiceProvider/ows:ServiceContact/ows:ContactInfo/ows:HoursOfService/text()"),
                "contactInstructions": xPath(node, "ows:ServiceProvider/ows:ServiceContact/ows:ContactInfo/ows:ContactInstructions/text()")
            },
            "role": xPath(node, "ows:ServiceProvider/ows:ServiceContact/ows:Role/text()")
        },
        "serviceMetadata": {
            "formatsSupported": xPathArray(node, "wcs:ServiceMetadata/wcs:formatSupported/text()"),
            "crssSupported": xPathArray(node, "wcs:ServiceMetadata/wcs:Extension/crs:CrsMetadata/crs:crsSupported/text()"),
            "interpolationsSupported": xPathArray(node, "wcs:ServiceMetadata/wcs:Extension/int:InterpolationMetadata/int:InterpolationSupported/text()")
        },
        "operations": utils.map(xPathArray(node, "ows:OperationsMetadata/ows:Operation"), function(op) {
            return {
                "name": op.getAttribute("name"),
                "getUrl": xPath(op, "ows:DCP/ows:HTTP/ows:Get/@xlink:href"),
                "postUrl": xPath(op, "ows:DCP/ows:HTTP/ows:Post/@xlink:href")
            };
        }),
        "contents": {
            "coverages": utils.map(xPathArray(node, "wcs:Contents/wcs:CoverageSummary"), function(sum) {
                return {
                    "coverageId": xPath(sum, "wcs:CoverageId/text()"),
                    "coverageSubtype": xPath(sum, "wcs:CoverageSubtype/text()")
                };
            })
        }
    };
}

/**
 * Parsing function for wcs:CoverageDescriptions elements.
 *
 * @param node the DOM object
 *
 * @returns the parsed object
 */

function parseCoverageDescriptions(node) {
    var descs = utils.map(xPathArray(node, "wcs:CoverageDescription"), function(desc) {
        return callParseFunctions(desc.localName, desc);
    });
    return {"coverageDescriptions": descs};
}

/**
 * Parsing function for wcs:CoverageDescription elements.
 *
 * @param node the DOM object
 *
 * @returns the parsed object
 */

function parseCoverageDescription(node) {
    var low = utils.stringToIntArray(xPath(node, "gml:domainSet/gml:RectifiedGrid/gml:limits/gml:GridEnvelope/gml:low/text()|gml:domainSet/gml:ReferenceableGrid/gml:limits/gml:GridEnvelope/gml:low/text()")),
        high = utils.stringToIntArray(xPath(node, "gml:domainSet/gml:RectifiedGrid/gml:limits/gml:GridEnvelope/gml:high/text()|gml:domainSet/gml:ReferenceableGrid/gml:limits/gml:GridEnvelope/gml:high/text()"));

    var size = [];
    for (var i = 0; i < Math.min(low.length, high.length); ++i) {
        size.push(high[i] + 1 - low[i]);
    }

    var pos = xPath(node, "gml:domainSet/gml:RectifiedGrid/gml:origin/gml:Point/gml:pos/text()");
    if (pos !== "") {
        var origin = utils.stringToFloatArray(pos);
    }
    var offsetVectors = utils.map(xPathArray(node, "gml:domainSet/gml:RectifiedGrid/gml:offsetVector/text()"), function(offsetVector) {
        return utils.stringToFloatArray(offsetVector);
    });

    // simplified resolution interface. does not make sense for not axis
    // aligned offset vectors.
    var resolution = [];
    for (var i = 0; i < offsetVectors.length; ++i) {
        for (var j = 0; j < offsetVectors.length; ++j) {
            if (offsetVectors[j][i] != 0.0) {
                resolution.push(offsetVectors[j][i]);
            }
            continue;
        }
    }

    // get the grid, either rectified or referenceable
    var grid = xPath(node, "gml:domainSet/gml:RectifiedGrid");
    if (!grid) grid = xPath(node, "gml:domainSet/gml:ReferenceableGrid");

    var obj = {
        "coverageId": xPath(node, "wcs:CoverageId/text()"),
        "dimensions": parseInt(xPath(node, "gml:domainSet/gml:RectifiedGrid/@dimension|gml:domainSet/gml:ReferenceableGrid/@dimension")),
        "bounds": {
            "projection": xPath(node, "gml:boundedBy/gml:Envelope/@srsName"),
            "lower": utils.stringToFloatArray(xPath(node, "gml:boundedBy/gml:Envelope/gml:lowerCorner/text()")),
            "upper": utils.stringToFloatArray(xPath(node, "gml:boundedBy/gml:Envelope/gml:upperCorner/text()"))
        },
        "envelope": {
            "low": low,
            "high": high
        },
        "size": size,
        "origin": origin,
        "offsetVectors": offsetVectors,
        "resolution": resolution,
        "rangeType": utils.map(xPathArray(node, "gmlcov:rangeType/swe:DataRecord/swe:field"), function(field) {
            return {
                "name": field.getAttribute("name"),
                "description": xPath(field, "swe:Quantity/swe:description/text()"),
                "uom": xPath(field, "swe:Quantity/swe:uom/@code"),
                "nilValues": utils.map(xPathArray(field, "swe:Quantity/swe:nilValues/swe:NilValues/swe:nilValue"), function(nilValue) {
                    return {
                        "value": parseInt(nilValue.textContent),
                        "reason": nilValue.getAttribute("reason")
                    }
                }),
                "allowedValues": utils.stringToFloatArray(xPath(field, "swe:Quantity/swe:constraint/swe:AllowedValues/swe:interval/text()")),
                "significantFigures": parseInt(xPath(field, "swe:Quantity/swe:constraint/swe:AllowedValues/swe:significantFigures/text()"))
            };
        }),
        "coverageSubtype": xPath(node, "wcs:ServiceParameters/wcs:CoverageSubtype/text()"),
        "nativeFormat": xPath(node, "wcs:ServiceParameters/wcs:nativeFormat/text()")
    };

    return obj;
}

/* Push core parsing functions */
pushParseFunctions({
    "Capabilities": parseCapabilities,
    "ExceptionReport": parseExceptionReport,
    "CoverageDescriptions": parseCoverageDescriptions,
    "CoverageDescription": parseCoverageDescription,
    "RectifiedGridCoverage": parseCoverageDescription
});


module.exports = {
    pushParseFunction: pushParseFunction,
    pushParseFunctions: pushParseFunctions,
    parse: parse,
    callParseFunctions: callParseFunctions
}

},{"./utils":6}],6:[function(require,module,exports){
/**
 * @module core/utils
 */

'use strict';

/**
 * Convenience function to serialize an object to a KVP encoded string.
 *
 * @param obj The object to serialize
 *
 * @returns the constructed KVP string
 */

function objectToKVP(obj) {
    var ret = [];
    for (var key in obj) {
        ret.push(key + "=" + obj[key]);
    }
    return ret.join("&");
}

/**
 * Utility function to split a string and parse an array of integers.
 *
 * @param string the string to split and parse
 * @param separator an (optional) separator, the string shall be split with.
 *                   Defaults to " ".
 *
 * @returns an array of the parsed values
 */

function stringToIntArray(string, separator) {
    separator = separator || " ";
    return map(string.split(separator), function(val) {
        return parseInt(val);
    });
}

/**
 * Utility function to split a string and parse an array of floats.
 *
 * @param string the string to split and parse
 * @param separator an (optional) separator, the string shall be split with.
 *                   Defaults to " ".
 *
 * @returns an array of the parsed values
 */

function stringToFloatArray(string, separator) {
    separator = separator || " ";
    return map(string.split(separator), function(val) {
        return parseFloat(val);
    });
}

function map(array, iterator) {
    var result = [];
    for (var i = 0; i < array.length; ++i) {
        result.push(iterator(array[i]));
    }
    return result;
}

/**
 * Recursivly merges two hash-tables.
 *
 * @param target the object the other one will be merged into
 * @param other the object that will be merged into the target
 */

function deepMerge(target, other) {
    if (typeof target != "object" || typeof other != "object") return;
    for (var key in other) {
        if (target.hasOwnProperty(key)
            && typeof target[key] == "object"
            && typeof other[key] == "object") {
            deepMerge(target[key], other[key]);
        }
        else target[key] = other[key];
    }
}

/**
 * Create an xPath lookup function bound to the given namespaceMap.
 *
 * @param namespaceMap the mapping from prefix to namespace URL.
 *
 * @returns the xPath function
 */

function createXPath(namespaceMap) {
    var nsResolver = function(prefix) {
      return namespaceMap[prefix] || null;
    }

    return function(node, xpath) {
        var doc = node.ownerDocument;
        var text = xpath.indexOf("text()") != -1 || xpath.indexOf("@") != -1;
        if (text) {
            return doc.evaluate(xpath, node, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        }
        else {
            var result = doc.evaluate(xpath, node, nsResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            if (result.snapshotLength == 0) {
               return null;
            }
            else {
                return result.snapshotItem(0);
            }
        }
    }
}

/**
 * Create an xPath lookup function (that itself returns arrays of elements)
 * bound to the given namespaceMap.
 *
 * @param namespaceMap the mapping from prefix to namespace URL.
 *
 * @returns the xPath function
 */
function createXPathArray(namespaceMap) {
    var nsResolver = function(prefix) {
      return namespaceMap[prefix] || null;
    }

    return function(node, xpath) {
        var doc = node.ownerDocument;
        var result = doc.evaluate(xpath, node, nsResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        var text = xpath.indexOf("text()") != -1 || xpath.indexOf("@") != -1;
        var array = new Array(result.snapshotLength);
        for (var i=0; i < result.snapshotLength; ++i) {
            if (text) {
                array[i] = result.snapshotItem(i).textContent;
            }
            else {
                array[i] = result.snapshotItem(i);
            }
        }
        return array;
    }
}


module.exports = {
    objectToKVP: objectToKVP,
    stringToIntArray: stringToIntArray,
    stringToFloatArray: stringToFloatArray,
    map: map,
    deepMerge: deepMerge,
    createXPath: createXPath,
    createXPathArray: createXPathArray
}
},{}],7:[function(require,module,exports){
var BucketCache, bisect, covers, insort, ref, toTime,
  slice = [].slice;

ref = require('../utils.coffee'), insort = ref.insort, bisect = ref.bisect;

toTime = function(date) {
  if ((date != null ? date.getTime : void 0) != null) {
    return date.getTime();
  } else {
    return date;
  }
};

covers = function(start, end, offsetItems, resolution) {
  var i, item, last, len, others, previous;
  if (offsetItems.length === 0) {
    return false;
  }
  last = offsetItems[offsetItems.length - 1];
  if (offsetItems[0].offset > start || last.offset + last.width < end) {
    return false;
  }
  previous = offsetItems[0], others = 2 <= offsetItems.length ? slice.call(offsetItems, 1) : [];
  for (i = 0, len = others.length; i < len; i++) {
    item = others[i];
    if (previous.offset + previous.width < item.offset) {
      return false;
    }
    previous = item;
  }
  return true;
};

BucketCache = (function() {
  function BucketCache() {
    this.clear();
  }

  BucketCache.prototype.clear = function() {
    this.resolutions = [];
    return this.cache = {};
  };

  BucketCache.prototype.getBucket = function(resolution, offset) {
    var ref1, time;
    time = toTime(offset);
    return (ref1 = this.cache[resolution]) != null ? ref1.buckets[time] : void 0;
  };

  BucketCache.prototype.getBucketApproximate = function(resolution, offset) {
    var bucket, denom, nextOffset, nextOffsetIndex, nextResolution, res, resolutionIndex, time, value;
    time = toTime(offset);
    bucket = this.getBucket(resolution, time);
    if (bucket != null) {
      return [bucket, true];
    }
    resolutionIndex = bisect(this.resolutions, resolution);
    while (resolutionIndex >= 0) {
      nextResolution = this.resolutions[resolutionIndex];
      resolutionIndex -= 1;
      if (nextResolution == null) {
        continue;
      }
      res = this.cache[nextResolution];
      nextOffsetIndex = bisect(res.offsets, time) - 1;
      nextOffset = res.offsets[nextOffsetIndex];
      if (nextOffset <= offset && (nextOffset + nextResolution) >= (time + resolution)) {
        value = res.buckets[nextOffset].count;
        denom = nextResolution / resolution;
        return [Math.round(value / denom), false];
      }
    }
    return [0, false];
  };

  BucketCache.prototype.hasBucket = function(resolution, offset) {
    var ref1, time;
    time = toTime(offset);
    return ((ref1 = this.cache[resolution]) != null ? ref1.buckets[time] : void 0) != null;
  };

  BucketCache.prototype.setBucket = function(resolution, offset, width, count) {
    var time;
    time = toTime(offset);
    this.prepareResolution(resolution);
    this.cache[resolution].buckets[time] = {
      offset: time,
      count: count,
      width: width
    };
    return insort(this.cache[resolution].offsets, time);
  };

  BucketCache.prototype.reserveBucket = function(resolution, offset) {
    var time;
    time = toTime(offset);
    this.prepareResolution(resolution);
    if (!this.hasBucket(resolution, time)) {
      return this.cache[resolution].buckets[time] = null;
    }
  };

  BucketCache.prototype.isBucketReserved = function(resolution, offset) {
    var time;
    time = toTime(offset);
    if (this.cache[resolution] != null) {
      return this.cache[resolution].buckets[time] === null;
    }
  };

  BucketCache.prototype.hasBucketOrReserved = function(resolution, offset) {
    var time;
    time = toTime(offset);
    return this.hasBucket(resolution, time) || this.isBucketReserved(resolution, time);
  };

  BucketCache.prototype.isCountLower = function(start, end, lowerThan) {
    var count, endTime, i, len, offsetsIntersecting, offsetsWithin, ref1, res, resolution, startTime, sum, sumReducer;
    startTime = toTime(start);
    endTime = toTime(end);
    count = 0;
    sumReducer = function(acc, offset) {
      return acc + res.buckets[offset].count;
    };
    ref1 = this.resolutions;
    for (i = 0, len = ref1.length; i < len; i++) {
      resolution = ref1[i];
      res = this.cache[resolution];
      offsetsWithin = res.offsets.filter(function(offset) {
        return offset >= startTime && (offset + resolution) <= endTime;
      });
      sum = offsetsWithin.reduce(sumReducer, 0);
      if (sum > lowerThan) {
        return [false, true];
      }
      offsetsIntersecting = res.offsets.filter(function(offset) {
        return (offset + resolution) > startTime && offset < endTime;
      });
      sum = offsetsIntersecting.reduce(sumReducer, 0);
      if (sum < lowerThan && covers(startTime, endTime, offsetsIntersecting, resolution)) {
        return [true, true];
      }
    }
    return [false, false];
  };

  BucketCache.prototype.hasResolution = function(resolution) {
    return this.cache[resolution] != null;
  };

  BucketCache.prototype.prepareResolution = function(resolution) {
    if (!this.hasResolution(resolution)) {
      this.cache[resolution] = {
        buckets: {},
        offsets: []
      };
      return insort(this.resolutions, resolution);
    }
  };

  return BucketCache;

})();

module.exports = BucketCache;


},{"../utils.coffee":19}],8:[function(require,module,exports){
var RecordCache, after, intersects, merged, ref, split, subtract,
  slice = [].slice;

ref = require('../utils.coffee'), after = ref.after, split = ref.split, intersects = ref.intersects, merged = ref.merged, subtract = ref.subtract;

RecordCache = (function() {
  function RecordCache(idProperty) {
    this.idProperty = idProperty;
    if (this.idProperty) {
      this.predicate = function(a, b) {
        return a[2][this.idProperty] === b[2][this.idProperty];
      };
    } else {
      this.predicate = function(a, b) {
        return a[0] === b[0] && a[1] === b[1];
      };
    }
    this.clear();
  }

  RecordCache.prototype.clear = function() {
    this.buckets = [];
    return this.reservedBuckets = [];
  };

  RecordCache.prototype.add = function(start, end, records) {
    var bucketEnd, bucketRecords, bucketStart, combined, high, i, intersecting, len, low, notIntersecting, ref1;
    this.unReserve(start, end);
    intersecting = this.getIntersecting(start, end);
    notIntersecting = this.buckets.filter(function(arg) {
      var endA, startA;
      startA = arg[0], endA = arg[1];
      return !intersects([start, end], [startA, endA]);
    });
    low = start;
    high = end;
    combined = records;
    for (i = 0, len = intersecting.length; i < len; i++) {
      ref1 = intersecting[i], bucketStart = ref1[0], bucketEnd = ref1[1], bucketRecords = ref1[2];
      if (bucketStart < low) {
        low = bucketStart;
      }
      if (bucketEnd > high) {
        high = bucketEnd;
      }
      combined = merged(combined, bucketRecords, this.predicate);
    }
    this.buckets = notIntersecting;
    return this.buckets.push([low, high, combined]);
  };

  RecordCache.prototype.get = function(start, end) {
    var first, i, intersecting, intersection, len, others, records;
    intersecting = this.getIntersecting(start, end);
    if (intersecting.length === 0) {
      return [];
    }
    first = intersecting[0], others = 2 <= intersecting.length ? slice.call(intersecting, 1) : [];
    records = first[2];
    for (i = 0, len = others.length; i < len; i++) {
      intersection = others[i];
      records = merged(records, intersection[2], this.predicate);
    }
    return records;
  };

  RecordCache.prototype.reserve = function(start, end) {
    var intersecting, max, min, nonIntersecting, ref1;
    ref1 = split(this.reservedBuckets, function(arg) {
      var endA, startA;
      startA = arg[0], endA = arg[1];
      return intersects([start, end], [startA, endA]);
    }), intersecting = ref1[0], nonIntersecting = ref1[1];
    if (intersecting.length) {
      min = new Date(d3.min(intersecting, function(b) {
        return b[0];
      }));
      max = new Date(d3.max(intersecting, function(b) {
        return b[1];
      }));
      if (start < min) {
        min = start;
      }
      if (start > max) {
        max = end;
      }
      nonIntersecting.push([min, max]);
    } else {
      nonIntersecting.push([start, end]);
    }
    return this.reservedBuckets = nonIntersecting;
  };

  RecordCache.prototype.unReserve = function(start, end) {
    var int, intersecting, intervals, nonIntersecting, ref1;
    ref1 = split(this.reservedBuckets, function(arg) {
      var endA, startA;
      startA = arg[0], endA = arg[1];
      return intersects([start, end], [startA, endA]);
    }), intersecting = ref1[0], nonIntersecting = ref1[1];
    int = [start, end];
    intervals = intersecting.map(function(interval) {
      return subtract(interval, int);
    }).reduce(function(acc, curr) {
      return acc.concat(curr);
    }, []);
    return this.reservedBuckets = nonIntersecting.concat(intervals);
  };

  RecordCache.prototype.getMissing = function(start, end) {
    var bucket, i, intersecting, interval, intervals, j, len, len1, newIntervals;
    intersecting = this.getIntersecting(start, end, true);
    intervals = [[start, end]];
    for (i = 0, len = intersecting.length; i < len; i++) {
      bucket = intersecting[i];
      newIntervals = [];
      for (j = 0, len1 = intervals.length; j < len1; j++) {
        interval = intervals[j];
        newIntervals = newIntervals.concat(subtract(interval, bucket));
      }
      intervals = newIntervals;
    }
    return intervals;
  };

  RecordCache.prototype.getIntersecting = function(start, end, includeReserved) {
    var records;
    if (includeReserved == null) {
      includeReserved = false;
    }
    records = this.buckets.filter(function(arg) {
      var endA, startA;
      startA = arg[0], endA = arg[1];
      return intersects([start, end], [startA, endA]);
    });
    if (includeReserved) {
      records = records.concat(this.reservedBuckets.filter(function(arg) {
        var endA, startA;
        startA = arg[0], endA = arg[1];
        return intersects([start, end], [startA, endA]);
      }));
    }
    return records;
  };

  return RecordCache;

})();

module.exports = RecordCache;


},{"../utils.coffee":19}],9:[function(require,module,exports){
(function (global){
var BucketDataset, EventEmitter, PathDataset, RecordDataset, Source, TimeSlider, after, centerTooltipOn, d3, intersects, merged, offsetDate, parseDuration, pixelWidth, ref, split, subtract,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

d3 = (typeof window !== "undefined" ? window['d3'] : typeof global !== "undefined" ? global['d3'] : null);

ref = require('./utils.coffee'), split = ref.split, intersects = ref.intersects, merged = ref.merged, after = ref.after, subtract = ref.subtract, parseDuration = ref.parseDuration, offsetDate = ref.offsetDate, centerTooltipOn = ref.centerTooltipOn, pixelWidth = ref.pixelWidth;

EventEmitter = require('./event-emitter.coffee');

RecordDataset = require('./datasets/record-dataset.coffee');

BucketDataset = require('./datasets/bucket-dataset.coffee');

PathDataset = require('./datasets/path-dataset.coffee');

TimeSlider = (function(superClass) {
  extend(TimeSlider, superClass);

  function TimeSlider(element1, options) {
    var base, base1, base2, base3, base4, base5, base6, base7, base8, base9, customFormats, definition, domain, fn, j, len, maxScale, minScale, ref1;
    this.element = element1;
    this.options = options != null ? options : {};
    TimeSlider.__super__.constructor.call(this, this.element);
    this.brushTooltip = this.options.brushTooltip;
    this.brushTooltipOffset = [30, 20];
    this.tooltip = d3.select(this.element).append("div").attr("class", "timeslider-tooltip").style("opacity", 0);
    this.tooltipBrushMin = d3.select(this.element).append("div").attr("class", "timeslider-tooltip").style("opacity", 0);
    this.tooltipBrushMax = d3.select(this.element).append("div").attr("class", "timeslider-tooltip").style("opacity", 0);
    this.tooltipFormatter = this.options.tooltipFormatter || function(record) {
      var ref1, ref2;
      return ((ref1 = record[2]) != null ? ref1.id : void 0) || ((ref2 = record[2]) != null ? ref2.name : void 0);
    };
    this.binTooltipFormatter = this.options.binTooltipFormatter || (function(_this) {
      return function(bin) {
        return bin.map(_this.tooltipFormatter).filter(function(tooltip) {
          return tooltip != null;
        }).join("<br>");
      };
    })(this);
    this.originalDisplay = this.element.style.display;
    this.svg = d3.select(this.element).append('svg').attr('class', 'timeslider');

    /* TODO: what does this do??? */
    this.useBBox = false;
    if (this.svg[0][0].clientWidth === 0) {
      d3.select(this.element).select('svg').append('rect').attr('width', '100%').attr('height', '100%').attr('opacity', '0');
      this.useBBox = true;
    }
    if (this.useBBox) {
      if (this.svg[0][0].getBoundingClientRect) {
        this.options.width = this.svg[0][0].getBoundingClientRect().width;
        this.options.height = this.svg[0][0].getBoundingClientRect().height;
      } else {
        this.options.width = this.svg[0][0].getBBox().width;
        this.options.height = this.svg[0][0].getBBox().height;
      }
    } else {
      this.options.width = this.svg[0][0].clientWidth;
      this.options.height = this.svg[0][0].clientHeight;
    }
    if (this.options.alternativeBrush) {
      this.options.height = this.options.height - 18;
    }

    /* END-TODO */
    this.options.selectionLimit = this.options.selectionLimit ? parseDuration(this.options.selectionLimit) : null;
    (base = this.options).brush || (base.brush = {});
    (base1 = this.options.brush).start || (base1.start = this.options.start);
    if (this.options.selectionLimit) {
      (base2 = this.options.brush).end || (base2.end = offsetDate(this.options.brush.start, this.options.selectionLimit));
    } else {
      (base3 = this.options.brush).end || (base3.end = new Date(new Date(this.options.brush.start).setDate(this.options.brush.start.getDate() + 3)));
    }
    this.selectionConstraint = [offsetDate(this.options.brush.start, -this.options.selectionLimit), offsetDate(this.options.brush.end, this.options.selectionLimit)];
    domain = this.options.domain;
    this.options.displayLimit = this.options.displayLimit ? parseDuration(this.options.displayLimit) : null;
    (base4 = this.options).display || (base4.display = {});
    if (!this.options.display.start && this.options.displayLimit) {
      this.options.display.start = offsetDate(domain.end, -this.options.displayLimit);
    } else {
      (base5 = this.options.display).start || (base5.start = domain.start);
    }
    (base6 = this.options.display).end || (base6.end = domain.end);
    if (this.options.displayLimit !== null && (this.options.display.end - this.options.display.start) > this.options.displayLimit * 1000) {
      this.options.display.start = offsetDate(this.options.display.end, -this.options.displayLimit);
    }
    (base7 = this.options).debounce || (base7.debounce = 50);
    (base8 = this.options).ticksize || (base8.ticksize = 3);
    (base9 = this.options).datasets || (base9.datasets = []);
    this.recordFilter = this.options.recordFilter;
    this.datasets = {};
    this.ordinal = 0;
    this.simplifyDate = d3.time.format.utc("%d.%m.%Y - %H:%M:%S");
    customFormats = d3.time.format.utc.multi([
      [
        ".%L", function(d) {
          return d.getUTCMilliseconds();
        }
      ], [
        ":%S", function(d) {
          return d.getUTCSeconds();
        }
      ], [
        "%H:%M", function(d) {
          return d.getUTCMinutes();
        }
      ], [
        "%H:%M", function(d) {
          return d.getUTCHours();
        }
      ], [
        "%b %d %Y ", function(d) {
          return d.getUTCDay() && d.getUTCDate() !== 1;
        }
      ], [
        "%b %d %Y", function(d) {
          return d.getUTCDate() !== 1;
        }
      ], [
        "%B %Y", function(d) {
          return d.getUTCMonth();
        }
      ], [
        "%Y", function() {
          return true;
        }
      ]
    ]);
    this.scales = {
      x: d3.time.scale.utc().domain([this.options.display.start, this.options.display.end]).range([0, this.options.width]),
      y: d3.scale.linear().range([this.options.height - 29, 0])
    };
    this.axis = {
      x: d3.svg.axis().scale(this.scales.x).innerTickSize(this.options.height - 15).tickFormat(customFormats),
      y: d3.svg.axis().scale(this.scales.y).orient("left")
    };
    this.svg.append('g').attr('class', 'mainaxis').call(this.axis.x);
    this.svg.select('.mainaxis').append('rect').attr('class', 'mainaxis-overlay').style('opacity', 0).style('fill', '#666').attr('height', this.options.height - 22).attr('width', this.options.width);
    d3.select(this.element).select('g.mainaxis .domain').attr('transform', "translate(0, " + (this.options.height - 18) + ")");
    this.setBrushTooltip = (function(_this) {
      return function(active) {
        return _this.brushTooltip = active;
      };
    })(this);
    this.setBrushTooltipOffset = (function(_this) {
      return function(offset) {
        return _this.brushTooltipOffset = offset;
      };
    })(this);
    this.brush = d3.svg.brush().x(this.scales.x).on('brushstart', (function(_this) {
      return function() {
        _this.brushing = true;
        _this.prevTranslate = _this.options.zoom.translate();
        _this.prevScale = _this.options.zoom.scale();
        _this.selectionConstraint = null;
        if (_this.brushTooltip) {
          _this.tooltipBrushMin.transition().duration(100).style("opacity", .9);
          return _this.tooltipBrushMax.transition().duration(100).style("opacity", .9);
        }
      };
    })(this)).on('brushend', (function(_this) {
      return function() {
        _this.brushing = false;
        _this.options.zoom.translate(_this.prevTranslate);
        _this.options.zoom.scale(_this.prevScale);
        _this.checkBrush();
        _this.redraw();
        _this.selectionConstraint = null;
        _this.dispatch('selectionChanged', {
          start: _this.brush.extent()[0],
          end: _this.brush.extent()[1]
        });
        if (_this.brushTooltip) {
          _this.tooltipBrushMin.transition().duration(100).style("opacity", 0);
          _this.tooltipBrushMax.transition().duration(100).style("opacity", 0);
        }
        return _this.wasBrushing = true;
      };
    })(this)).on('brush', (function(_this) {
      return function() {
        var high, low, ref1, ref2;
        if (_this.options.selectionLimit !== null) {
          if (_this.selectionConstraint === null) {
            ref1 = _this.brush.extent(), low = ref1[0], high = ref1[1];
            _this.selectionConstraint = [offsetDate(high, -_this.options.selectionLimit), offsetDate(low, _this.options.selectionLimit)];
          } else {
            if (d3.event.mode === "move") {
              ref2 = _this.brush.extent(), low = ref2[0], high = ref2[1];
              _this.selectionConstraint = [offsetDate(high, -_this.options.selectionLimit), offsetDate(low, _this.options.selectionLimit)];
            }
            _this.checkBrush();
          }
        }
        return _this.redraw();
      };
    })(this)).extent([this.options.brush.start, this.options.brush.end]);
    this.svg.append('g').attr('class', 'highlight').selectAll('rect').attr('height', "" + (this.options.height - 19)).attr('y', 0);
    this.gBrush = this.svg.append('g').attr('class', 'brush').call(this.brush);
    if (!this.options.alternativeBrush) {
      this.gBrush.selectAll('rect').attr('height', "" + (this.options.height - 19)).attr('y', 0);
    } else {
      this.gBrush.selectAll('rect').attr('height', 4).attr('y', "" + (this.options.height + 4));
      this.gBrush.selectAll('.resize').append('circle').attr('class', 'handle-circle').attr('fill', '#000000').attr('cursor', 'ew-resize').attr('r', 8).attr('cx', 0).attr('cy', this.options.height + 6);
    }
    if (this.brushTooltip) {
      this.gBrush.selectAll('.resize.w').on('mouseover', (function(_this) {
        return function() {
          return _this.tooltipBrushMin.transition().duration(100).style('opacity', 0.9);
        };
      })(this)).on('mouseout', (function(_this) {
        return function() {
          if (!_this.brushing) {
            return _this.tooltipBrushMin.transition().duration(100).style('opacity', 0);
          }
        };
      })(this));
      this.gBrush.selectAll('.resize.e').on('mouseover', (function(_this) {
        return function() {
          return _this.tooltipBrushMax.transition().duration(100).style('opacity', 0.9);
        };
      })(this)).on('mouseout', (function(_this) {
        return function() {
          if (!_this.brushing) {
            return _this.tooltipBrushMax.transition().duration(100).style('opacity', 0);
          }
        };
      })(this));
    }
    this.svg.append('g').attr('class', 'datasets').attr('width', this.options.width).attr('height', this.options.height).attr('transform', "translate(0, " + (this.options.height - 23) + ")");
    d3.select(window).on('resize', (function(_this) {
      return function() {
        var svg;
        svg = d3.select(_this.element).select('svg.timeslider')[0][0];
        if (_this.useBBox) {
          if (svg.getBoundingClientRect) {
            _this.options.width = svg.getBoundingClientRect().width;
          } else {
            _this.options.width = svg.getBBox().width;
          }
        } else {
          _this.options.width = svg.clientWidth;
        }
        _this.scales.x.range([0, _this.options.width]);
        return _this.redraw();
      };
    })(this));
    minScale = (this.options.display.start - this.options.display.end) / (this.options.domain.start - this.options.domain.end);
    if (!this.options.constrain) {
      minScale = 0;
    }
    maxScale = Math.abs(this.options.display.start - this.options.display.end) / 2000;
    this.options.zoom = d3.behavior.zoom().x(this.scales.x).size([this.options.width, this.options.height]).scaleExtent([minScale, maxScale]).on('zoomstart', (function(_this) {
      return function() {
        _this.prevScale2 = _this.options.zoom.scale();
        return _this.prevDomain = _this.scales.x.domain();
      };
    })(this)).on('zoom', (function(_this) {
      return function() {
        var end, high, low, ref1, ref2, ref3, ref4, start;
        if (_this.brushing) {
          _this.options.zoom.scale(_this.prevScale);
          return _this.options.zoom.translate(_this.prevTranslate);
        } else {
          if (_this.options.displayLimit !== null && d3.event.scale < _this.prevScale2) {
            ref1 = _this.scales.x.domain(), low = ref1[0], high = ref1[1];
            if ((high.getTime() - low.getTime()) > _this.options.displayLimit * 1000) {
              ref2 = _this.prevDomain, start = ref2[0], end = ref2[1];
            } else {
              ref3 = _this.scales.x.domain(), start = ref3[0], end = ref3[1];
            }
          } else {
            ref4 = _this.scales.x.domain(), start = ref4[0], end = ref4[1];
          }
          _this.center(start, end, false);
          _this.prevScale2 = _this.options.zoom.scale();
          return _this.prevDomain = _this.scales.x.domain();
        }
      };
    })(this)).on('zoomend', (function(_this) {
      return function() {
        var dataset, display;
        display = _this.scales.x.domain();
        _this.dispatch('displayChanged', {
          start: display[0],
          end: display[1]
        });
        if (!_this.wasBrushing) {
          for (dataset in _this.datasets) {
            _this.reloadDataset(dataset);
          }
        }
        return _this.wasBrushing = false;
      };
    })(this));
    this.svg.call(this.options.zoom);
    ref1 = this.options.datasets;
    fn = (function(_this) {
      return function(definition) {
        return _this.addDataset(definition);
      };
    })(this);
    for (j = 0, len = ref1.length; j < len; j++) {
      definition = ref1[j];
      fn(definition);
    }
    if (this.options.display) {
      this.center(this.options.display.start, this.options.display.end);
    }
    if (this.options.controls) {
      d3.select(this.element).append("div").attr("id", "pan-left").attr("class", "control").on("click", (function(_this) {
        return function() {
          var d, e, ref2, s;
          ref2 = _this.scales.x.domain(), s = ref2[0], e = ref2[1];
          d = Math.abs(e - s) / 10;
          s = new Date(s.getTime() - d);
          e = new Date(e.getTime() - d);
          return _this.center(s, e);
        };
      })(this)).append("div").attr("class", "arrow-left");
      d3.select(this.element).append("div").attr("id", "pan-right").attr("class", "control").on("click", (function(_this) {
        return function() {
          var d, e, ref2, s;
          ref2 = _this.scales.x.domain(), s = ref2[0], e = ref2[1];
          d = Math.abs(e - s) / 10;
          s = new Date(s.getTime() + d);
          e = new Date(e.getTime() + d);
          return _this.center(s, e);
        };
      })(this)).append("div").attr("class", "arrow-right");
      d3.select(this.element).append("div").attr("id", "zoom-in").attr("class", "control").text("+").on("click", (function(_this) {
        return function() {
          var d, e, ref2, ref3, s;
          ref2 = _this.scales.x.domain(), s = ref2[0], e = ref2[1];
          d = Math.abs(e - s) / 10;
          s = new Date(s.getTime() + (d / 2));
          e = new Date(e.getTime() - (d / 2));
          if ((e - s) < 2 * 1000) {
            ref3 = _this.scales.x.domain(), s = ref3[0], e = ref3[1];
          }
          return _this.center(s, e);
        };
      })(this));
      d3.select(this.element).append("div").attr("id", "zoom-out").attr("class", "control").html("&ndash;").on("click", (function(_this) {
        return function() {
          var d, e, high, low, ref2, ref3, ref4, s;
          ref2 = _this.scales.x.domain(), s = ref2[0], e = ref2[1];
          d = Math.abs(e - s) / 10;
          s = new Date(s.getTime() - (d / 2));
          e = new Date(e.getTime() + (d / 2));
          ref3 = _this.scales.x.domain(), low = ref3[0], high = ref3[1];
          if (_this.options.displayLimit !== null && (e - s) > _this.options.displayLimit * 1000) {
            ref4 = _this.scales.x.domain(), s = ref4[0], e = ref4[1];
          }
          return _this.center(s, e);
        };
      })(this));
      d3.select(this.element).append("div").attr("id", "reload").attr("class", "control").on("click", (function(_this) {
        return function() {
          var dataset, results;
          results = [];
          for (dataset in _this.datasets) {
            results.push(_this.reloadDataset(dataset, true));
          }
          return results;
        };
      })(this)).append("div").attr("class", "reload-arrow");
    }
  }


  /*
  ## Private API
   */

  TimeSlider.prototype.checkBrush = function() {
    var a, b, ref1, ref2, ref3, ref4, ref5, ref6, ref7, x, y;
    if (this.selectionConstraint || ((ref1 = this.highlightInterval) != null ? ref1.constrain : void 0)) {
      if (this.selectionConstraint) {
        ref2 = this.selectionConstraint, a = ref2[0], b = ref2[1];
      }
      if (!this.selectionConstraint) {
        ref3 = [this.highlightInterval.start, this.highlightInterval.end], a = ref3[0], b = ref3[1];
      }
      if ((ref4 = this.highlightInterval) != null ? ref4.constrain : void 0) {
        ref5 = [a > this.highlightInterval.start ? a : this.highlightInterval.start, b < this.highlightInterval.end ? b : this.highlightInterval.end], a = ref5[0], b = ref5[1];
      }
      ref6 = this.brush.extent(), x = ref6[0], y = ref6[1];
      if (x > y) {
        ref7 = [y, x], x = ref7[0], y = ref7[1];
      }
      if (x < a) {
        x = a;
      }
      if (x > b) {
        x = b;
      }
      if (y > b) {
        y = b;
      }
      if (y < a) {
        y = a;
      }
      return this.brush.extent([x, y]);
    }
  };

  TimeSlider.prototype.redraw = function() {
    var brushExtent, dataset, datasetId, drawOptions, end, offheight, ref1, start;
    this.brush.x(this.scales.x).extent(this.brush.extent());
    d3.select(this.element).select('g.mainaxis').call(this.axis.x);
    d3.select(this.element).select('g.brush').call(this.brush);
    if (this.brushTooltip) {
      offheight = 0;
      if (this.svg[0][0].parentElement != null) {
        offheight = this.svg[0][0].parentElement.offsetHeight;
      } else {
        offheight = this.svg[0][0].parentNode.offsetHeight;
      }
      this.tooltipBrushMin.html(this.simplifyDate(this.brush.extent()[0]));
      this.tooltipBrushMax.html(this.simplifyDate(this.brush.extent()[1]));
      centerTooltipOn(this.tooltipBrushMin, d3.select(this.element).select('g.brush .extent')[0][0], 'left', [0, -20]);
      centerTooltipOn(this.tooltipBrushMax, d3.select(this.element).select('g.brush .extent')[0][0], 'right');
    }
    brushExtent = d3.select(this.element).select('g.brush .extent');
    if (parseFloat(brushExtent.attr('width')) < 1) {
      brushExtent.attr('width', 1);
    }
    drawOptions = {
      height: this.options.height,
      ticksize: this.options.ticksize,
      scales: this.scales,
      axes: this.axis,
      recordFilter: this.recordFilter,
      tooltip: this.tooltip,
      tooltipFormatter: this.tooltipFormatter,
      binTooltipFormatter: this.binTooltipFormatter
    };
    this.drawHighlights();
    ref1 = this.scales.x.domain(), start = ref1[0], end = ref1[1];
    for (datasetId in this.datasets) {
      dataset = this.datasets[datasetId];
      if (!dataset.lineplot) {
        dataset.draw(start, end, drawOptions);
      }
    }
    for (datasetId in this.datasets) {
      dataset = this.datasets[datasetId];
      if (dataset.lineplot) {
        dataset.draw(start, end, drawOptions);
      }
    }
    return d3.select(this.element).selectAll('.mainaxis g.tick text').classed('tick-date', function(d) {
      return !(d.getUTCMilliseconds() | d.getUTCSeconds() | d.getUTCMinutes() | d.getUTCHours());
    });
  };

  TimeSlider.prototype.drawHighlights = function() {
    var end, height, left, right, start, width;
    d3.select(this.element).selectAll('.highlight .interval').remove();
    if (this.highlightInterval) {
      start = this.highlightInterval.start;
      end = this.highlightInterval.end;
      left = this.scales.x(start);
      width = pixelWidth([start, end], this.scales.x);
      right = left + width;
      height = this.options.height - 19;
      d3.select(this.element).selectAll('.highlight').append('rect').attr('class', 'interval').attr('x', left).attr('width', width).attr('y', 0).attr('height', height).attr('stroke', this.highlightInterval.strokeColor).attr('stroke-width', 1).attr('fill', this.highlightInterval.fillColor);
      if (this.highlightInterval.outsideColor) {
        if (left > 0) {
          d3.select(this.element).selectAll('.highlight').append('rect').attr('class', 'interval').attr('x', 0).attr('width', left).attr('y', 0).attr('height', height).attr('fill', this.highlightInterval.outsideColor);
        }
        return d3.select(this.element).selectAll('.highlight').append('rect').attr('class', 'interval').attr('x', right).attr('width', 2000).attr('y', 0).attr('height', height).attr('fill', this.highlightInterval.outsideColor);
      }
    }
  };

  TimeSlider.prototype.reloadDataset = function(datasetId, clearCaches) {
    var dataset, end, ref1, start, syncOptions;
    if (clearCaches == null) {
      clearCaches = false;
    }
    dataset = this.datasets[datasetId];
    ref1 = this.scales.x.domain(), start = ref1[0], end = ref1[1];
    if (clearCaches) {
      dataset.clearCaches();
    }
    syncOptions = {
      height: this.options.height,
      ticksize: this.options.ticksize,
      scales: this.scales,
      axes: this.axis,
      recordFilter: this.recordFilter,
      tooltip: this.tooltip,
      tooltipFormatter: this.tooltipFormatter,
      binTooltipFormatter: this.binTooltipFormatter
    };
    return dataset.sync(start, end, syncOptions);
  };

  TimeSlider.prototype.checkLoading = function() {
    var id, isLoading;
    isLoading = false;
    for (id in this.datasets) {
      if (this.datasets[id].isSyncing()) {
        isLoading = true;
      }
    }
    this.svg.classed('loading', isLoading);
    d3.select('.reload-arrow').classed('arrowloading', isLoading);
    if (this.isLoading !== isLoading) {
      if (isLoading) {
        this.dispatch('loadStart');
      } else {
        this.dispatch('loadEnd');
      }
      return this.isLoading = isLoading;
    }
  };


  /*
  ## Public API
   */

  TimeSlider.prototype.hide = function() {
    this.element.style.display = 'none';
    return true;
  };

  TimeSlider.prototype.show = function() {
    this.element.style.display = this.originalDisplay;
    return true;
  };

  TimeSlider.prototype.domain = function() {
    var end, params, ref1, start;
    params = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    if (params.length !== 2) {
      return false;
    }
    start = new Date(params[0]);
    end = new Date(params[1]);
    if (end < start) {
      ref1 = [end, start], start = ref1[0], end = ref1[1];
    }
    this.options.domain.start = start;
    this.options.domain.end = end;
    this.scales.x.domain([this.options.domain.start, this.options.domain.end]);
    this.redraw();
    return true;
  };

  TimeSlider.prototype.select = function() {
    var end, params, ref1, ref2, start;
    params = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    if (params.length !== 2) {
      return false;
    }
    start = new Date(params[0]);
    end = new Date(params[1]);
    if (end < start) {
      ref1 = [end, start], start = ref1[0], end = ref1[1];
    }
    if (start < this.options.start) {
      start = this.options.start;
    }
    if (end > this.options.end) {
      end = this.options.end;
    }
    if ((ref2 = this.highlightInterval) != null ? ref2.constrain : void 0) {
      if (start < this.highlightInterval.start) {
        start = this.highlightInterval.start;
      }
      if (end > this.highlightInterval.end) {
        end = this.highlightInterval.end;
      }
    }
    d3.select(this.element).select('g.brush').call(this.brush.extent([start, end]));
    this.dispatch('selectionChanged', {
      start: this.brush.extent()[0],
      end: this.brush.extent()[1]
    }, this.element);
    return true;
  };

  TimeSlider.prototype.addDataset = function(definition) {
    var dataset, datasetOptions, element, id, index, lineplot;
    if (this.options.datasetIndex == null) {
      this.options.datasetIndex = 0;
    }
    if (this.options.linegraphIndex == null) {
      this.options.linegraphIndex = 0;
    }
    index = this.options.datasetIndex;
    lineplot = false;
    id = definition.id;
    this.ordinal++;
    if (!definition.lineplot) {
      index = this.options.datasetIndex++;
      this.svg.select('g.datasets').insert('g', ':first-child').attr('class', 'dataset').attr('id', "dataset-" + this.ordinal);
    } else {
      index = this.options.linegraphIndex++;
      lineplot = true;
      this.svg.select('g.datasets').append('g').attr('class', 'dataset').attr('id', "dataset-" + this.ordinal);
    }
    element = this.svg.select("g.datasets #dataset-" + this.ordinal);
    datasetOptions = {
      id: id,
      index: index,
      color: definition.color,
      noBorder: definition.noBorder,
      highlightFillColor: definition.highlightFillColor,
      highlightStrokeColor: definition.highlightStrokeColor,
      source: definition.source,
      bucketSource: definition.bucketSource,
      records: definition.records,
      lineplot: lineplot,
      debounceTime: this.options.debounce,
      ordinal: this.ordinal,
      element: element,
      histogramThreshold: definition.histogramThreshold,
      histogramBinCount: definition.histogramBinCount,
      cacheRecords: definition.cacheRecords,
      cluster: definition.cluster
    };
    if (definition.lineplot) {
      dataset = new PathDataset(datasetOptions);
    } else if (definition.bucket) {
      dataset = new BucketDataset(datasetOptions);
    } else {
      dataset = new RecordDataset(datasetOptions);
    }
    element.data([dataset]);
    dataset.on('syncing', (function(_this) {
      return function() {
        return _this.checkLoading();
      };
    })(this));
    dataset.on('synced', (function(_this) {
      return function() {
        _this.redraw();
        return _this.checkLoading();
      };
    })(this));
    this.datasets[id] = dataset;
    return this.reloadDataset(id);
  };

  TimeSlider.prototype.removeDataset = function(id) {
    var dataset, i, lp, ordinal;
    if (this.datasets[id] == null) {
      return false;
    }
    dataset = this.datasets[id];
    i = dataset.index;
    lp = dataset.lineplot;
    ordinal = dataset.ordinal;
    delete this.datasets[id];
    if (lp) {
      this.options.linegraphIndex--;
    } else {
      this.options.datasetIndex--;
    }
    d3.select(this.element).select("g.dataset#dataset-" + ordinal).remove();
    for (dataset in this.datasets) {
      if (lp === this.datasets[dataset].lineplot) {
        if (this.datasets[dataset].index > i) {
          this.datasets[dataset].index -= 1;
        }
      }
    }
    this.redraw();
    return true;
  };

  TimeSlider.prototype.reorderDatasets = function(ids) {
    return d3.select(this.element).selectAll('g.dataset').sort(function(a, b) {
      var ia, ib;
      ia = ids.indexOf(a.id);
      ib = ids.indexOf(b.id);
      if (ia > ib) {
        return -1;
      } else if (ia < ib) {
        return 1;
      } else {
        return 0;
      }
    });
  };

  TimeSlider.prototype.hasDataset = function(id) {
    if (this.datasets[id] == null) {
      return false;
    }
  };

  TimeSlider.prototype.center = function(start, end, doReload) {
    var dataset, diff, newEnd, newStart, ref1;
    if (doReload == null) {
      doReload = true;
    }
    start = new Date(start);
    end = new Date(end);
    if (end < start) {
      ref1 = [end, start], start = ref1[0], end = ref1[1];
    }
    diff = end - start;
    if (this.options.constrain && start < this.options.domain.start) {
      start = this.options.domain.start;
      newEnd = new Date(start.getTime() + diff);
      end = newEnd < this.options.domain.end ? newEnd : this.options.domain.end;
    }
    if (this.options.constrain && end > this.options.domain.end) {
      end = this.options.domain.end;
      newStart = new Date(end.getTime() - diff);
      start = newStart > this.options.domain.start ? newStart : this.options.domain.start;
    }
    if (this.options.displayLimit !== null && (end - start) > this.options.displayLimit * 1000) {
      start = offsetDate(end, -this.options.displayLimit);
    }
    this.options.zoom.scale((this.options.display.end - this.options.display.start) / (end - start));
    this.options.zoom.translate([this.options.zoom.translate()[0] - this.scales.x(start), 0]);
    this.redraw();
    if (doReload) {
      for (dataset in this.datasets) {
        this.reloadDataset(dataset);
      }
    }
    return true;
  };

  TimeSlider.prototype.zoom = function() {
    var diff, end, newEnd, newStart, params, ref1, start;
    params = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    start = new Date(params[0]);
    end = new Date(params[1]);
    if (end < start) {
      ref1 = [end, start], start = ref1[0], end = ref1[1];
    }
    diff = end - start;
    if (this.options.constrain && start < this.options.domain.start) {
      start = this.options.domain.start;
      newEnd = new Date(start.getTime() + diff);
      end = newEnd < this.options.domain.end ? newEnd : this.options.domain.end;
    }
    if (this.options.constrain && end > this.options.domain.end) {
      end = this.options.domain.end;
      newStart = new Date(end.getTime() - diff);
      start = newStart > this.options.domain.start ? newStart : this.options.domain.start;
    }
    if (this.options.displayLimit !== null && (end - start) > this.options.displayLimit * 1000) {
      start = offsetDate(end, -this.options.displayLimit);
    }
    d3.transition().duration(750).tween('zoom', (function(_this) {
      return function() {
        var iScale;
        iScale = d3.interpolate(_this.options.zoom.scale(), (_this.options.domain.end - _this.options.domain.start) / (end - start));
        return function(t) {
          var iPan;
          iPan = d3.interpolate(_this.options.zoom.translate()[0], _this.options.zoom.translate()[0] - _this.scales.x(start));
          _this.options.zoom.scale(iScale(t));
          _this.options.zoom.translate([iPan(t), 0]);
          return _this.redraw();
        };
      };
    })(this)).each('end', (function(_this) {
      return function() {
        var dataset, results;
        results = [];
        for (dataset in _this.datasets) {
          results.push(_this.reloadDataset(dataset));
        }
        return results;
      };
    })(this));
    return true;
  };

  TimeSlider.prototype.reset = function() {
    this.zoom(this.options.domain.start, this.options.domain.end);
    return true;
  };

  TimeSlider.prototype.setBrushTooltip = function(brushTooltip) {
    this.brushTooltip = brushTooltip;
  };

  TimeSlider.prototype.setBrushTooltipOffset = function(brushTooltipOffset) {
    this.brushTooltipOffset = brushTooltipOffset;
  };

  TimeSlider.prototype.setRecordFilter = function(recordFilter) {
    this.recordFilter = recordFilter;
    this.redraw();
    return true;
  };

  TimeSlider.prototype.setTooltipFormatter = function(tooltipFormatter) {
    this.tooltipFormatter = tooltipFormatter;
  };

  TimeSlider.prototype.setBinTooltipFormatter = function(binTooltipFormatter) {
    this.binTooltipFormatter = binTooltipFormatter;
  };

  TimeSlider.prototype.setHighlightInterval = function(start, end, fillColor, strokeColor, outsideColor, constrain) {
    if (constrain == null) {
      constrain = false;
    }
    if (start && end) {
      this.highlightInterval = {
        start: start,
        end: end,
        fillColor: fillColor,
        strokeColor: strokeColor,
        outsideColor: outsideColor,
        constrain: constrain
      };
      if (constrain) {
        this.checkBrush();
      }
    } else {
      this.highlightInterval = null;
    }
    return this.redraw();
  };

  TimeSlider.prototype.setRecordHighlights = function(datasetId, intervals) {
    var dataset;
    if (intervals == null) {
      intervals = [];
    }
    dataset = this.datasets[datasetId];
    if (dataset != null) {
      dataset.setRecordHighlights(intervals);
      return this.redraw();
    }
  };

  return TimeSlider;

})(EventEmitter);

Source = (function() {
  function Source() {}

  Source.prototype.fetch = function(start, end, params, callback) {};

  return Source;

})();

module.exports = TimeSlider;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./datasets/bucket-dataset.coffee":10,"./datasets/path-dataset.coffee":12,"./datasets/record-dataset.coffee":13,"./event-emitter.coffee":14,"./utils.coffee":19}],10:[function(require,module,exports){
var BucketCache, BucketDataset, RecordDataset, after, centerTooltipOn, intersects, ref,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

RecordDataset = require('./record-dataset.coffee');

BucketCache = require('../caches/bucket-cache.coffee');

ref = require('../utils.coffee'), after = ref.after, centerTooltipOn = ref.centerTooltipOn, intersects = ref.intersects;

BucketDataset = (function(superClass) {
  extend(BucketDataset, superClass);

  function BucketDataset(options) {
    var currentBucketSyncState, lastBucketSyncState;
    BucketDataset.__super__.constructor.call(this, options);
    this.bucketCache = new BucketCache();
    this.bucketSource = options.bucketSource;
    currentBucketSyncState = 0;
    lastBucketSyncState = 0;
    this.toFetch = 0;
  }

  BucketDataset.prototype.useBuckets = function(start, end, preferRecords) {
    var count, definite, isLower, ref1;
    if (preferRecords == null) {
      preferRecords = false;
    }
    ref1 = this.bucketCache.isCountLower(start, end, this.histogramThreshold, preferRecords), isLower = ref1[0], definite = ref1[1];
    if (preferRecords && !definite) {
      count = this.cache.get(start, end).length;
      if (count > 0 && count < this.histogramThreshold) {
        return true;
      }
    }
    return !isLower || !definite;
  };

  BucketDataset.prototype.makeTicks = function(scale) {
    var i, resolution, ticks;
    ticks = scale.ticks(this.histogramBinCount || 20);
    resolution = d3.median((function() {
      var j, ref1, results;
      results = [];
      for (i = j = 1, ref1 = ticks.length - 1; 1 <= ref1 ? j <= ref1 : j >= ref1; i = 1 <= ref1 ? ++j : --j) {
        results.push(ticks[i] - ticks[i - 1]);
      }
      return results;
    })());
    ticks = [new Date(ticks[0].getTime() - resolution)].concat(ticks).concat([new Date(ticks[ticks.length - 1].getTime() + resolution)]);
    return [ticks, resolution];
  };

  BucketDataset.prototype.isSyncing = function() {
    return this.toFetch > 0;
  };

  BucketDataset.prototype.doFetch = function(start, end, params) {
    var definite, isLower, ref1, ref2, resolution, scales, ticks;
    scales = params.scales;
    ref1 = this.makeTicks(scales.x), ticks = ref1[0], resolution = ref1[1];
    ref2 = this.bucketCache.isCountLower(start, end, this.histogramThreshold), isLower = ref2[0], definite = ref2[1];
    if (this.useBuckets(start, end)) {
      return this.doFetchBuckets(start, end, resolution, ticks, params);
    } else {
      return BucketDataset.__super__.doFetch.call(this, start, end, params);
    }
  };

  BucketDataset.prototype.doFetchBuckets = function(start, end, resolution, ticks, params) {
    var bucketsToFetch, dt, i, j, len, next, source, summaryCallback, tick;
    source = this.getSourceFunction(this.bucketSource);
    bucketsToFetch = [];
    for (i = j = 0, len = ticks.length; j < len; i = ++j) {
      tick = ticks[i];
      if (!this.bucketCache.hasBucketOrReserved(resolution, tick)) {
        next = ticks[i + 1];
        if (next) {
          dt = next.getTime() - tick.getTime();
        }
        bucketsToFetch.push([tick, dt]);
      }
    }
    if (bucketsToFetch.length > 0) {
      this.toFetch += bucketsToFetch.length;
      this.listeners.syncing();
      summaryCallback = after(bucketsToFetch.length, (function(_this) {
        return function() {
          if (!_this.useBuckets(start, end)) {
            return RecordDataset.prototype.doFetch.call(_this, start, end, params);
          }
        };
      })(this));
      return bucketsToFetch.forEach((function(_this) {
        return function(arg) {
          var a, b, bucket, dt;
          bucket = arg[0], dt = arg[1];
          _this.bucketCache.reserveBucket(resolution, bucket);
          a = new Date(bucket);
          b = new Date(bucket.getTime() + (dt || resolution));
          return source(a, b, params, function(count) {
            _this.bucketCache.setBucket(resolution, a, dt, count);
            _this.toFetch -= 1;
            _this.listeners.synced();
            return summaryCallback();
          });
        };
      })(this));
    }
  };

  BucketDataset.prototype.draw = function(start, end, options) {
    var ref1, resolution, scales, ticks;
    if (this.useBuckets(start, end, true)) {
      scales = options.scales;
      ref1 = this.makeTicks(scales.x), ticks = ref1[0], resolution = ref1[1];
      this.element.selectAll('.record').remove();
      this.element.selectAll('.bin').remove();
      return this.drawBuckets(ticks, resolution, options);
    } else {
      this.element.selectAll('.bucket').remove();
      return BucketDataset.__super__.draw.call(this, start, end, options);
    }
  };

  BucketDataset.prototype.drawBuckets = function(ticks, resolution, options) {
    var bars, buckets, height, missingIntervals, scales, y;
    scales = options.scales, height = options.height;
    buckets = ticks.map((function(_this) {
      return function(tick) {
        var bucket, definite, end, ref1;
        ref1 = _this.bucketCache.getBucketApproximate(resolution, tick), bucket = ref1[0], definite = ref1[1];
        if (bucket.width != null) {
          end = new Date(tick.getTime() + bucket.width);
        }
        return [tick, end, bucket.count, definite];
      };
    })(this));
    y = d3.scale.linear().domain([
      0, d3.max(buckets, function(d) {
        return d[2];
      })
    ]).range([2, height - 29]).clamp(true);
    bars = this.element.selectAll('.bucket').data(buckets);
    bars.attr('class', 'bucket').call((function(_this) {
      return function(bucketElement) {
        return _this.setupBuckets(bucketElement, y, resolution, options);
      };
    })(this));
    bars.enter().append('rect').call((function(_this) {
      return function(bucketElement) {
        return _this.setupBuckets(bucketElement, y, resolution, options);
      };
    })(this));
    bars.exit().remove();
    missingIntervals = buckets.filter(function(bucket) {
      return !bucket[3];
    }).map(function(bucket) {
      if (bucket[1]) {
        return bucket;
      } else {
        return [bucket[0], new Date(bucket[0].getTime() + resolution)];
      }
    });
    return this.drawMissing(missingIntervals, true, scales, options);
  };

  BucketDataset.prototype.setupBuckets = function(bucketElement, y, resolution, arg) {
    var binTooltipFormatter, scales, tooltip;
    scales = arg.scales, tooltip = arg.tooltip, binTooltipFormatter = arg.binTooltipFormatter;
    bucketElement.attr('class', 'bucket').attr('fill', (function(_this) {
      return function(d) {
        var highlight, interval;
        interval = [d[0], d[1] || new Date(d[0].getTime() + resolution)];
        highlight = _this.recordHighlights.reduce(function(acc, int) {
          return acc || intersects(int, interval);
        }, false);
        if (highlight) {
          return _this.highlightFillColor;
        } else {
          return _this.color;
        }
      };
    })(this)).attr('stroke', (function(_this) {
      return function(d) {
        var highlight, interval;
        interval = [d[0], d[1] || new Date(d[0].getTime() + resolution)];
        highlight = _this.recordHighlights.reduce(function(acc, int) {
          return acc || intersects(int, interval);
        }, false);
        if (highlight) {
          return _this.highlightStrokeColor;
        } else if (_this.noBorder) {
          return d3.rgb(_this.color);
        } else {
          return d3.rgb(_this.color).darker();
        }
      };
    })(this)).attr('fill-opacity', function(d) {
      if (d[2]) {
        return 1;
      } else {
        return 0.5;
      }
    }).attr('x', 1).attr('width', (function(_this) {
      return function(d) {
        return scales.x(d[1] || new Date(d[0].getTime() + resolution)) - scales.x(d[0]) - 1;
      };
    })(this)).attr('transform', (function(_this) {
      return function(d) {
        return "translate(" + (scales.x(d[0])) + ", " + (-y(d[2]) || 0) + ")";
      };
    })(this)).attr('height', function(d) {
      if (d[2]) {
        return y(d[2]);
      } else {
        return 0;
      }
    }).attr('stroke-width', this.noBorder ? 2 : 1);
    return bucketElement.on('mouseover', (function(_this) {
      return function(bucket) {
        var message;
        _this.dispatch('bucketMouseover', {
          dataset: _this.id,
          start: bucket[0],
          end: bucket[1] || new Date(bucket[0].getTime() + resolution),
          count: bucket[2]
        });
        if (bucket) {
          message = "" + (bucket[2] != null ? bucket[2] : void 0);
          if (message.length) {
            tooltip.html(message).transition().duration(200).style('opacity', .9);
            return centerTooltipOn(tooltip, d3.event.target);
          }
        }
      };
    })(this)).on('mouseout', (function(_this) {
      return function(bucket) {
        _this.dispatch('bucketMouseout', {
          dataset: _this.id,
          start: bucket[0],
          end: bucket[1] || new Date(bucket[0].getTime() + resolution),
          count: bucket[2]
        });
        return tooltip.transition().duration(500).style('opacity', 0);
      };
    })(this)).on('click', (function(_this) {
      return function(bucket) {
        return _this.dispatch('bucketClicked', {
          dataset: _this.id,
          start: bucket[0],
          end: bucket[1] || new Date(bucket[0].getTime() + resolution),
          count: bucket[2]
        });
      };
    })(this));
  };

  BucketDataset.prototype.clearCaches = function() {
    if (this.cache) {
      this.cache.clear();
    }
    if (this.bucketCache) {
      return this.bucketCache.clear();
    }
  };

  return BucketDataset;

})(RecordDataset);

module.exports = BucketDataset;


},{"../caches/bucket-cache.coffee":7,"../utils.coffee":19,"./record-dataset.coffee":13}],11:[function(require,module,exports){
var Dataset, EventEmitter, after, debounce,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

debounce = require('debounce');

EventEmitter = require('../event-emitter.coffee');

after = require('../utils.coffee').after;

Dataset = (function(superClass) {
  extend(Dataset, superClass);

  function Dataset(arg) {
    var debounceTime;
    this.id = arg.id, this.color = arg.color, this.noBorder = arg.noBorder, this.highlightFillColor = arg.highlightFillColor, this.highlightStrokeColor = arg.highlightStrokeColor, this.source = arg.source, this.sourceParams = arg.sourceParams, this.index = arg.index, this.records = arg.records, this.paths = arg.paths, this.lineplot = arg.lineplot, this.ordinal = arg.ordinal, this.element = arg.element, debounceTime = arg.debounceTime;
    this.fetchDebounced = debounce(this.doFetch, debounceTime);
    this.currentSyncState = 0;
    this.lastSyncState = 0;
    this.recordHighlights = [];
    Dataset.__super__.constructor.call(this, this.element[0][0], 'syncing', 'synced');
  }

  Dataset.prototype.getSource = function() {
    return this.source;
  };

  Dataset.prototype.setSource = function(source1) {
    this.source = source1;
  };

  Dataset.prototype.setRecords = function(records1) {
    this.records = records1;
  };

  Dataset.prototype.getRecords = function() {
    return this.records;
  };

  Dataset.prototype.setPaths = function(paths) {
    this.paths = paths;
  };

  Dataset.prototype.getPaths = function() {
    return this.paths;
  };

  Dataset.prototype.sync = function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return this.fetchDebounced.apply(this, args);
  };

  Dataset.prototype.isSyncing = function() {
    return !(this.lastSyncState === this.currentSyncState);
  };

  Dataset.prototype.getSourceFunction = function(source) {
    if (source && typeof source.fetch === 'function') {
      return (function(_this) {
        return function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return source.fetch.apply(source, args);
        };
      })(this);
    } else if (typeof source === 'function') {
      return source;
    }
  };

  Dataset.prototype.doFetch = function(start, end, params) {
    var fetched, source, syncState;
    this.currentSyncState += 1;
    syncState = this.currentSyncState;
    this.listeners.syncing();
    fetched = (function(_this) {
      return function(records) {
        if (syncState > _this.lastSyncState) {
          _this.lastSyncState = syncState;
        }
        if (syncState === _this.currentSyncState) {
          if (!_this.cache) {
            _this.records = _this.postprocess(records);
          }
          return _this.listeners.synced();
        }
      };
    })(this);
    if (this.source) {
      source = this.getSourceFunction(this.source);
    } else {
      if (syncState > this.lastSyncState) {
        this.lastSyncState = syncState;
      }
      this.listeners.synced();
      return;
    }
    if (this.cache) {
      return this.doFetchWithCache(start, end, params, source, fetched);
    } else {
      return source(start, end, this.sourceParams, fetched);
    }
  };

  Dataset.prototype.doFetchWithCache = function(start, end, params, source, fetched) {
    var i, interval, len, missingIntervals, ref, results, summaryCallback;
    missingIntervals = this.cache.getMissing(start, end);
    if (missingIntervals.length === 0) {
      return fetched(this.cache.get(start, end));
    } else {
      summaryCallback = after(missingIntervals.length, (function(_this) {
        return function() {
          return fetched(_this.cache.get(start, end));
        };
      })(this));
      results = [];
      for (i = 0, len = missingIntervals.length; i < len; i++) {
        interval = missingIntervals[i];
        (ref = this.cache).reserve.apply(ref, interval);
        results.push(source(interval[0], interval[1], this.sourceParams, (function(_this) {
          return function(records) {
            _this.cache.add(interval[0], interval[1], _this.postprocess(records));
            _this.listeners.synced();
            return summaryCallback();
          };
        })(this)));
      }
      return results;
    }
  };

  Dataset.prototype.postprocess = function(records) {
    return records;
  };

  Dataset.prototype.draw = function() {};

  Dataset.prototype.clearCaches = function() {};

  Dataset.prototype.setRecordHighlights = function(recordHighlights) {
    this.recordHighlights = recordHighlights;
  };

  return Dataset;

})(EventEmitter);

module.exports = Dataset;


},{"../event-emitter.coffee":14,"../utils.coffee":19,"debounce":2}],12:[function(require,module,exports){
var Dataset, PathDataset,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Dataset = require('./dataset.coffee');

PathDataset = (function(superClass) {
  extend(PathDataset, superClass);

  function PathDataset(options) {
    PathDataset.__super__.constructor.call(this, options);
  }

  PathDataset.prototype.draw = function(start, end, options) {
    var axes, data, height, scales;
    scales = options.scales, axes = options.axes, height = options.height;
    data = this.records || this.paths;
    if (data && data.length) {
      return this.drawPaths(data, scales, axes, height);
    }
  };

  PathDataset.prototype.drawPaths = function(data, scales, axes, height) {
    var line, step;
    scales.y.domain(d3.extent(data, function(d) {
      return d[1];
    }));
    this.element.selectAll('path').remove();
    this.element.selectAll('.y.axis').remove();
    line = d3.svg.line().x((function(_this) {
      return function(a) {
        return scales.x(new Date(a[0]));
      };
    })(this)).y((function(_this) {
      return function(a) {
        return scales.y(a[1]);
      };
    })(this));
    this.element.append('path').datum(data).attr('class', 'line').attr('d', line).attr('stroke', this.color).attr('stroke-width', '1.5px').attr('fill', 'none').attr('transform', "translate(0, " + (-height + 29) + ")");
    step = (scales.y.domain()[1] - scales.y.domain()[0]) / 4;
    axes.y.tickValues(d3.range(scales.y.domain()[0], scales.y.domain()[1] + step, step));
    this.element.append('g').attr('class', 'y axis').attr('fill', this.color).call(axes.y).attr('transform', "translate(" + ((this.index + 1) * 30) + ", " + (-height + 29) + ")");
    this.element.selectAll('.axis .domain').attr('stroke-width', '1').attr('stroke', this.color).attr('shape-rendering', 'crispEdges').attr('fill', 'none');
    this.element.selectAll('.axis line').attr('stroke-width', '1').attr('shape-rendering', 'crispEdges').attr('stroke', this.color);
    return this.element.selectAll('.axis path').attr('stroke-width', '1').attr('shape-rendering', 'crispEdges').attr('stroke', this.color);
  };

  return PathDataset;

})(Dataset);

module.exports = PathDataset;


},{"./dataset.coffee":11}],13:[function(require,module,exports){
var Dataset, RecordCache, RecordDataset, centerTooltipOn, intersects, pixelDistance, pixelMaxDifference, pixelWidth, ref, split,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

Dataset = require('./dataset.coffee');

RecordCache = require('../caches/record-cache.coffee');

ref = require('../utils.coffee'), centerTooltipOn = ref.centerTooltipOn, split = ref.split, intersects = ref.intersects, pixelWidth = ref.pixelWidth, pixelDistance = ref.pixelDistance, pixelMaxDifference = ref.pixelMaxDifference;

RecordDataset = (function(superClass) {
  extend(RecordDataset, superClass);

  function RecordDataset(options) {
    this.clusterReducer = bind(this.clusterReducer, this);
    var cacheIdField, cacheRecords;
    this.histogramThreshold = options.histogramThreshold, this.histogramBinCount = options.histogramBinCount, this.cluster = options.cluster;
    cacheIdField = options.cacheIdField, cacheRecords = options.cacheRecords;
    if (cacheRecords) {
      this.cache = new RecordCache(cacheIdField);
    }
    RecordDataset.__super__.constructor.call(this, options);
  }

  RecordDataset.prototype.postprocess = function(records) {
    return records.map(function(record) {
      if (record instanceof Date) {
        record = [record, record];
      } else if (!(record[1] instanceof Date)) {
        record = [record[0], record[0]].concat(record.slice(1));
      }
      return record;
    });
  };

  RecordDataset.prototype.draw = function(start, end, options) {
    var data, highlightPoints, highlightRanges, interval, missingIntervals, points, ranges, recordHighlights, records, reducer, ref1, ref2, scales, x;
    scales = options.scales;
    if (this.cache) {
      records = this.cache.get(start, end);
      missingIntervals = this.cache.getMissing(start, end);
    } else {
      records = this.records || [];
      missingIntervals = [];
    }
    interval = [start, end];
    records = records.filter(function(record) {
      if (record[1] instanceof Date) {
        return intersects(record, interval);
      }
      return intersects([record[0], record[0]], interval);
    });
    if ((this.histogramThreshold != null) && records.length >= this.histogramThreshold) {
      this.element.selectAll('.record,.highlight-record').remove();
      data = records.map((function(_this) {
        return function(record) {
          return new Date(record[0] + (record[1] - record[0]) / 2);
        };
      })(this));
      this.drawHistogram(records, scales, options);
      return this.drawMissing(missingIntervals, true, scales, options);
    } else {
      this.element.selectAll('.bin').remove();
      x = scales.x;
      if (this.cluster) {
        reducer = (function(_this) {
          return function() {
            var args;
            args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
            return _this.clusterReducer.apply(_this, slice.call(args).concat([x]));
          };
        })(this);
        records = records.reduce(reducer, []).map(function(r) {
          if (r.cluster) {
            return r;
          } else {
            return [r[0], r[1], r[2][0][2]];
          }
        });
      }
      ref1 = split(records, (function(_this) {
        return function(r) {
          return _this.drawAsPoint(r, x);
        };
      })(this)), points = ref1[0], ranges = ref1[1];
      this.drawRanges(ranges, scales, options);
      this.drawPoints(points, scales, options);
      recordHighlights = this.recordHighlights;
      if (this.cluster) {
        reducer = (function(_this) {
          return function() {
            var args;
            args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
            return _this.clusterReducer.apply(_this, slice.call(args).concat([x]));
          };
        })(this);
        recordHighlights = recordHighlights.reduce(reducer, []).map(function(r) {
          if (r.cluster) {
            return r;
          } else {
            return [r[0], r[1], r[2][0][2]];
          }
        });
      }
      ref2 = split(recordHighlights, (function(_this) {
        return function(r) {
          return _this.drawAsPoint(r, x);
        };
      })(this)), highlightPoints = ref2[0], highlightRanges = ref2[1];
      this.drawRanges(highlightRanges, scales, options, true);
      this.drawPoints(highlightPoints, scales, options, true);
      return this.drawMissing(missingIntervals, false, scales, options);
    }
  };

  RecordDataset.prototype.drawAsPoint = function(record, scale) {
    return pixelWidth(record, scale) < 5;
  };

  RecordDataset.prototype.clusterReducer = function(acc, current, index, array, x) {
    var intersecting, newBin, nonIntersecting, ref1, ref2;
    if (this.drawAsPoint(current, x)) {
      ref1 = split(acc, function(b) {
        return pixelDistance(current, b, x) <= 5;
      }), intersecting = ref1[0], nonIntersecting = ref1[1];
    } else {
      ref2 = split(acc, function(b) {
        return intersects(current, b) && pixelMaxDifference(current, b, x) < 10;
      }), intersecting = ref2[0], nonIntersecting = ref2[1];
    }
    if (intersecting.length) {
      newBin = [
        new Date(d3.min(intersecting, function(b) {
          return b[0];
        })), new Date(d3.max(intersecting, function(b) {
          return b[1];
        })), intersecting.map(function(b) {
          return b[2];
        }).reduce((function(a, r) {
          return a.concat(r);
        }), [])
      ];
      if (current[0] < newBin[0]) {
        newBin[0] = current[0];
      }
      if (current[1] > newBin[1]) {
        newBin[1] = current[1];
      }
      newBin[2].push(current);
      newBin.cluster = true;
      nonIntersecting.push(newBin);
      return nonIntersecting;
    } else {
      acc.push([current[0], current[1], [current]]);
    }
    return acc;
  };

  RecordDataset.prototype.drawRanges = function(records, scales, options, highlight) {
    var className, color, r, recordFilter, rect, strokeColor, ticksize;
    if (highlight == null) {
      highlight = false;
    }
    color = highlight ? this.highlightFillColor : this.color;
    strokeColor = highlight ? this.highlightStrokeColor : this.noBorder ? d3.rgb(color) : d3.rgb(color).darker();
    className = highlight ? 'highlight-record' : 'record';
    ticksize = options.ticksize, recordFilter = options.recordFilter;
    rect = (function(_this) {
      return function(elem) {
        return elem.attr('class', className).attr('x', function(record) {
          return scales.x(new Date(record[0]));
        }).attr('y', -(ticksize + 3) * _this.index + -(ticksize - 2)).attr('width', function(record) {
          return scales.x(new Date(record[1])) - scales.x(new Date(record[0]));
        }).attr('height', ticksize - 2).attr('stroke', strokeColor).attr('stroke-width', 1).attr('fill', function(record) {
          if (highlight || (!recordFilter || recordFilter(record, _this))) {
            return color;
          } else {
            return 'transparent';
          }
        });
      };
    })(this);
    r = this.element.selectAll("rect." + className).data(records).call(rect);
    r.enter().append('rect').call(rect).call((function(_this) {
      return function(recordElement) {
        if (!highlight) {
          return _this.setupRecord(recordElement, options);
        }
      };
    })(this));
    return r.exit().remove();
  };

  RecordDataset.prototype.drawPoints = function(records, scales, options, highlight) {
    var circle, className, color, p, recordFilter, strokeColor, ticksize;
    if (highlight == null) {
      highlight = false;
    }
    color = highlight ? this.highlightFillColor : this.color;
    strokeColor = highlight ? this.highlightStrokeColor : this.noBorder ? d3.rgb(color) : d3.rgb(color).darker();
    className = highlight ? 'highlight-record' : 'record';
    ticksize = options.ticksize, recordFilter = options.recordFilter;
    circle = (function(_this) {
      return function(elem) {
        return elem.attr('class', className).attr('cx', function(a) {
          if (Array.isArray(a)) {
            if (a[1] instanceof Date && a[0] !== a[1]) {
              return scales.x(new Date(a[0].getTime() + Math.abs(a[1] - a[0]) / 2));
            }
            return scales.x(new Date(a[0]));
          } else {
            return scales.x(new Date(a));
          }
        }).attr('cy', -(ticksize + 3) * _this.index - (ticksize - 2) / 2).attr('stroke', strokeColor).attr('stroke-width', 1).attr('r', ticksize / 2).attr('fill', function(record) {
          if (highlight || (!recordFilter || recordFilter(record, _this))) {
            return color;
          } else {
            return 'transparent';
          }
        });
      };
    })(this);
    p = this.element.selectAll("circle." + className).data(records).call(circle);
    p.enter().append('circle').call(circle).call((function(_this) {
      return function(recordElement) {
        if (!highlight) {
          return _this.setupRecord(recordElement, options);
        }
      };
    })(this));
    return p.exit().remove();
  };

  RecordDataset.prototype.drawHistogram = function(records, scales, options) {
    var bars, bins, dx, ticks, y;
    ticks = scales.x.ticks(this.histogramBinCount || 20);
    dx = ticks[1] - ticks[0];
    ticks = [new Date(ticks[0].getTime() - dx)].concat(ticks).concat([new Date(ticks[ticks.length - 1].getTime() + dx)]);
    bins = d3.layout.histogram().bins(ticks).range(scales.x.domain()).value(function(record) {
      return new Date(record[0].getTime() + (record[1].getTime() - record[0].getTime()) / 2);
    })(records).filter(function(b) {
      return b.length;
    });
    y = d3.scale.linear().domain([
      0, d3.max(bins, function(d) {
        return d.length;
      })
    ]).range([2, options.height - 29]).clamp(true);
    bars = this.element.selectAll(".bin").data(bins);
    bars.attr('class', 'bin').call((function(_this) {
      return function(binElement) {
        return _this.setupBins(binElement, y, options);
      };
    })(this));
    bars.enter().append('rect').call((function(_this) {
      return function(binElement) {
        return _this.setupBins(binElement, y, options);
      };
    })(this));
    return bars.exit().remove();
  };

  RecordDataset.prototype.drawMissing = function(intervals, useHistogram, scales, options) {
    var base, bins, className, r, rect, ticksize;
    ticksize = options.ticksize;
    className = 'missing-interval';
    base = function(elem) {
      return elem.attr('class', className).attr('stroke', 'rgba(20, 20, 20, 0.2)').attr('stroke-width', 1).attr('fill', 'rgba(50, 50, 50, 0.2)');
    };
    bins = (function(_this) {
      return function(elem) {
        return elem.attr('x', 1).attr('width', function(interval) {
          if (isNaN(scales.x(new Date(interval[1])) - scales.x(new Date(interval[0])))) {
            console.log(interval, 'isNaN');
          }
          return scales.x(new Date(interval[1])) - scales.x(new Date(interval[0]));
        }).attr('transform', function(interval) {
          return "translate(" + (scales.x(new Date(interval[0]))) + ", " + (-20) + ")";
        }).attr('height', 20);
      };
    })(this);
    rect = (function(_this) {
      return function(elem) {
        return elem.attr('x', function(interval) {
          return scales.x(new Date(interval[0]));
        }).attr('y', -(ticksize + 3) * _this.index + -(ticksize - 2)).attr('width', function(interval) {
          return scales.x(new Date(interval[1])) - scales.x(new Date(interval[0]));
        }).attr('height', ticksize - 2).attr('stroke', 'rgba(20, 20, 20, 0.3)').attr('stroke-width', 1).attr('fill', 'rgba(50, 50, 50, 0.3)');
      };
    })(this);
    r = this.element.selectAll("rect." + className).data(intervals).call(base).call(useHistogram ? bins : rect);
    r.enter().append('rect').call(base).call(useHistogram ? bins : rect);
    return r.exit().remove();
  };

  RecordDataset.prototype.setupRecord = function(recordElement, arg) {
    var binTooltipFormatter, recordFilter, tooltip, tooltipFormatter;
    recordFilter = arg.recordFilter, tooltip = arg.tooltip, tooltipFormatter = arg.tooltipFormatter, binTooltipFormatter = arg.binTooltipFormatter;
    return recordElement.on('mouseover', (function(_this) {
      return function(record) {
        var message;
        if (record.cluster) {
          _this.dispatch('clusterMouseover', {
            dataset: _this.id,
            start: record[0],
            end: record[1],
            records: record[2]
          });
          message = binTooltipFormatter(record[2], _this);
        } else {
          _this.dispatch('recordMouseover', {
            dataset: _this.id,
            start: record[0],
            end: record[1] instanceof Date ? record[1] : record[0],
            params: record[1] instanceof Date ? record[2] : record[1]
          });
          if (record[1] instanceof Date) {
            message = tooltipFormatter(record, _this);
          } else {
            message = tooltipFormatter([record[0], record[0], record[1]], _this);
          }
        }
        if (message) {
          tooltip.html(message).transition().duration(200).style('opacity', .9);
          return centerTooltipOn(tooltip, d3.event.target);
        }
      };
    })(this)).on('mouseout', (function(_this) {
      return function(record) {
        if (record.cluster) {
          _this.dispatch('clusterMouseout', {
            dataset: _this.id,
            start: record[0],
            end: record[1],
            records: record[2]
          });
        } else {
          _this.dispatch('recordMouseout', {
            dataset: _this.id,
            start: record[0],
            end: record[1] instanceof Date ? record[1] : record[0],
            params: record[1] instanceof Date ? record[2] : record[1]
          });
        }
        return tooltip.transition().duration(500).style('opacity', 0);
      };
    })(this)).on('click', (function(_this) {
      return function(record) {
        if (record.cluster) {
          return _this.dispatch('clusterClicked', {
            dataset: _this.id,
            start: record[0],
            end: record[1],
            records: record[2]
          });
        } else {
          return _this.dispatch('recordClicked', {
            dataset: _this.id,
            start: record[0],
            end: record[1] instanceof Date ? record[1] : record[0],
            params: record[1] instanceof Date ? record[2] : record[1]
          });
        }
      };
    })(this));
  };

  RecordDataset.prototype.setupBins = function(binElement, y, arg) {
    var binTooltipFormatter, scales, tooltip;
    scales = arg.scales, tooltip = arg.tooltip, binTooltipFormatter = arg.binTooltipFormatter;
    binElement.attr('class', 'bin').attr('fill', (function(_this) {
      return function(d) {
        var highlight, interval;
        interval = [d.x, new Date(d.x.getTime() + d.dx)];
        highlight = _this.recordHighlights.reduce(function(acc, int) {
          return acc || intersects(int, interval);
        }, false);
        if (highlight) {
          return _this.highlightFillColor;
        } else {
          return _this.color;
        }
      };
    })(this)).attr('stroke', (function(_this) {
      return function(d) {
        var highlight, interval;
        interval = [d.x, new Date(d.x.getTime() + d.dx)];
        highlight = _this.recordHighlights.reduce(function(acc, int) {
          return acc || intersects(int, interval);
        }, false);
        if (highlight) {
          return _this.highlightStrokeColor;
        } else if (_this.noBorder) {
          return d3.rgb(_this.color);
        } else {
          return d3.rgb(_this.color).darker();
        }
      };
    })(this)).attr('x', 1).attr('width', (function(_this) {
      return function(d) {
        return scales.x(d.x.getTime() + d.dx) - scales.x(d.x) - 1;
      };
    })(this)).attr('transform', (function(_this) {
      return function(d) {
        return "translate(" + (scales.x(new Date(d.x))) + ", " + (-y(d.length)) + ")";
      };
    })(this)).attr('height', function(d) {
      return y(d.length);
    });
    return binElement.on('mouseover', (function(_this) {
      return function(bin) {
        var message;
        _this.dispatch('binMouseover', {
          dataset: _this.id,
          start: bin.x,
          end: new Date(bin.x.getTime() + bin.dx),
          bin: bin
        });
        if (bin.length) {
          message = binTooltipFormatter(bin);
          if (message.length) {
            tooltip.html(message).transition().duration(200).style('opacity', .9);
            return centerTooltipOn(tooltip, d3.event.target);
          }
        }
      };
    })(this)).on('mouseout', (function(_this) {
      return function(bin) {
        _this.dispatch('binMouseout', {
          dataset: _this.id,
          start: bin.x,
          end: new Date(bin.x.getTime() + bin.dx),
          bin: bin
        });
        return tooltip.transition().duration(500).style('opacity', 0);
      };
    })(this)).on('click', (function(_this) {
      return function(bin) {
        return _this.dispatch('binClicked', {
          dataset: _this.id,
          start: bin.x,
          end: new Date(bin.x.getTime() + bin.dx),
          bin: bin
        });
      };
    })(this));
  };

  RecordDataset.prototype.clearCaches = function() {
    if (this.cache) {
      return this.cache.clear();
    }
  };

  return RecordDataset;

})(Dataset);

module.exports = RecordDataset;


},{"../caches/record-cache.coffee":8,"../utils.coffee":19,"./dataset.coffee":11}],14:[function(require,module,exports){
var EventEmitter,
  slice = [].slice;

EventEmitter = (function() {
  function EventEmitter() {
    var dispatchElement1, events;
    dispatchElement1 = arguments[0], events = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    this.dispatchElement = dispatchElement1;
    if (events.length) {
      this.listeners = d3.dispatch.apply(void 0, events);
    }
  }

  EventEmitter.prototype.on = function() {
    var args, ref;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return (ref = this.listeners).on.apply(ref, args);
  };

  EventEmitter.prototype.dispatch = function(name, detail, dispatchElement) {
    var evt;
    evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(name, true, true, detail);
    return (dispatchElement || this.dispatchElement).dispatchEvent(evt);
  };

  return EventEmitter;

})();

module.exports = EventEmitter;


},{}],15:[function(require,module,exports){
window.TimeSlider = require("./d3.timeslider.coffee");

window.TimeSlider.Sources = {
  EOWCSSource: require("./sources/eowcs.coffee"),
  EOxServerWPSSource: require("./sources/eoxserver-wps.coffee"),
  WMSSource: require("./sources/wms.coffee")
};


},{"./d3.timeslider.coffee":9,"./sources/eowcs.coffee":16,"./sources/eoxserver-wps.coffee":17,"./sources/wms.coffee":18}],16:[function(require,module,exports){
var EOWCSSource, eoParse, kvp, parse;

parse = require("libcoverage/src/parse");

kvp = require("libcoverage/src/eowcs/kvp");

eoParse = require("libcoverage/src/eowcs/parse");

parse.pushParseFunctions(eoParse.parseFunctions);

EOWCSSource = (function() {
  function EOWCSSource(options) {
    this.options = options != null ? options : {};
  }

  EOWCSSource.prototype.formatDate = function(date) {
    return date.toISOString().substring(0, 19) + "Z";
  };

  EOWCSSource.prototype.fetch = function(start, end, params, callback) {
    var request, url;
    url = kvp.describeEOCoverageSetURL(this.options.url, (params != null ? params.eoid : void 0) || this.options.eoid, {
      subsetTime: [this.formatDate(start), this.formatDate(end)]
    });
    request = d3.xhr(url);
    return request.get((function(_this) {
      return function(error, response) {
        var bbox, coverage, footprint, i, j, k, lat, len, lon, records, ref, ref1, ref2;
        if (error) {
          return callback([]);
        }
        try {
          response = parse.parse(response.responseXML, {
            throwOnException: true
          });
        } catch (error1) {
          return callback([]);
        }
        records = [];
        if ((response.coverageDescriptions != null) && response.coverageDescriptions.length > 0) {
          ref = response.coverageDescriptions;
          for (j = 0, len = ref.length; j < len; j++) {
            coverage = ref[j];
            bbox = [0/0, 0/0, 0/0, 0/0];
            footprint = [];
            for (i = k = 0, ref1 = coverage.footprint.length; k < ref1; i = k += 2) {
              ref2 = [coverage.footprint[i + 1], coverage.footprint[i]], lon = ref2[0], lat = ref2[1];
              footprint.push([lon, lat]);
              bbox[0] = isNaN(bbox[0]) ? lon : Math.min(lon, bbox[0]);
              bbox[1] = isNaN(bbox[1]) ? lat : Math.min(lat, bbox[1]);
              bbox[2] = isNaN(bbox[2]) ? lon : Math.max(lon, bbox[2]);
              bbox[3] = isNaN(bbox[3]) ? lat : Math.max(lat, bbox[3]);
            }
            records.push([
              new Date(coverage.timePeriod[0]), new Date(coverage.timePeriod[1]), {
                id: coverage.coverageId,
                bbox: bbox,
                footprint: footprint
              }
            ]);
          }
        }
        return callback(records);
      };
    })(this));
  };

  return EOWCSSource;

})();

module.exports = EOWCSSource;


},{"libcoverage/src/eowcs/kvp":3,"libcoverage/src/eowcs/parse":4,"libcoverage/src/parse":5}],17:[function(require,module,exports){
var EOxServerWPSSource;

EOxServerWPSSource = (function() {
  function EOxServerWPSSource(options) {
    this.options = options != null ? options : {};
  }

  EOxServerWPSSource.prototype.formatDate = function(date) {
    return date.toISOString().substring(0, 19) + "Z";
  };

  EOxServerWPSSource.prototype.fetch = function(start, end, params, callback) {
    return d3.csv(this.options.url + "?service=wps&request=execute&version=1.0.0&identifier=getTimeData&DataInputs=collection=" + this.options.eoid + "%3Bbegin_time=" + (this.formatDate(start)) + "%3Bend_time=" + (this.formatDate(end)) + "&RawDataOutput=times").row((function(_this) {
      return function(row) {
        return [
          new Date(row.starttime), new Date(row.endtime), {
            id: row.identifier,
            bbox: row.bbox.replace(/[()]/g, '').split(',').map(parseFloat)
          }
        ];
      };
    })(this)).get((function(_this) {
      return function(error, rows) {
        if (!error) {
          return callback(rows);
        }
      };
    })(this));
  };

  return EOxServerWPSSource;

})();

module.exports = EOxServerWPSSource;


},{}],18:[function(require,module,exports){
var CapabilitiesCache, WMSSource, cache;

CapabilitiesCache = (function() {
  function CapabilitiesCache() {
    this.callbacks = {};
    this.responses = {};
  }

  CapabilitiesCache.prototype.startRequest = function(url) {
    return d3.xml(url + "?service=wms&request=getCapabilities", 'application/xml', (function(_this) {
      return function(error, response) {
        var i, internalCallback, len, ref, results;
        if (!error) {
          _this.responses[url] = {
            layers: {},
            document: response
          };
          ref = _this.callbacks[url];
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            internalCallback = ref[i];
            results.push(internalCallback(response));
          }
          return results;
        }
      };
    })(this));
  };

  CapabilitiesCache.prototype.parseLayer = function(url, layerName) {
    var doc, e, i, len, ref;
    doc = d3.select(this.responses[url].document);
    ref = doc.selectAll('Layer > Dimension[name="time"]')[0];
    for (i = 0, len = ref.length; i < len; i++) {
      e = ref[i];
      if (layerName === d3.select(e.parentNode).select('Name').text()) {
        return d3.select(e).text().split(',').map(function(item) {
          var record;
          record = item.split("/").slice(0, 2).map(function(time) {
            return new Date(time);
          });
          record.push({});
          return record;
        });
      }
    }
  };

  CapabilitiesCache.prototype.getLayer = function(url, layerName) {
    var response;
    response = this.responses[url];
    if (response.layers[layerName] == null) {
      response.layers[layerName] = this.parseLayer(url, layerName);
    }
    return response.layers[layerName];
  };

  CapabilitiesCache.prototype.addCallback = function(url, layerName, callback) {
    var internalCallback;
    internalCallback = (function(_this) {
      return function(response) {
        return callback(_this.getLayer(url, layerName));
      };
    })(this);
    if (this.callbacks[url] != null) {
      return this.callbacks[url].push(internalCallback);
    } else {
      this.callbacks[url] = [internalCallback];
      return this.startRequest(url);
    }
  };

  CapabilitiesCache.prototype.get = function(url, layerName, callback) {
    if (this.responses[url] != null) {
      return callback(this.getLayer(url, layerName));
    } else {
      return this.addCallback(url, layerName, callback);
    }
  };

  return CapabilitiesCache;

})();

cache = new CapabilitiesCache;

WMSSource = (function() {
  function WMSSource(options) {
    this.options = options;
  }

  WMSSource.prototype.fetch = function(start, end, params, callback) {
    return cache.get(this.options.url, this.options.layer, (function(_this) {
      return function(layer) {
        return callback(layer);
      };
    })(this));
  };

  return WMSSource;

})();

module.exports = WMSSource;


},{}],19:[function(require,module,exports){
var after, bisect, centerTooltipOn, insort, intersects, merged, offsetDate, parseDuration, pixelDistance, pixelMaxDifference, pixelWidth, split, subtract,
  slice = [].slice;

split = function(list, predicate) {
  var a, b, i, item, len;
  a = [];
  b = [];
  for (i = 0, len = list.length; i < len; i++) {
    item = list[i];
    if (predicate(item)) {
      a.push(item);
    } else {
      b.push(item);
    }
  }
  return [a, b];
};

bisect = function(array, x, lo, hi) {
  var mid;
  if (lo == null) {
    lo = 0;
  }
  if (hi == null) {
    hi = array.length;
  }
  while (lo < hi) {
    mid = Math.floor((lo + hi) / 2);
    if (x < array[mid]) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return lo;
};

insort = function(array, x) {
  return array.splice(bisect(array, x), 0, x);
};

intersects = function(a, b) {
  return a[0] <= b[1] && b[0] <= a[1];
};

pixelDistance = function(a, b, scale) {
  if (intersects(a, b)) {
    return 0;
  } else {
    return Math.min(Math.abs(scale(a[0]) - scale(b[0])), Math.abs(scale(a[1]) - scale(b[1])));
  }
};

pixelWidth = function(interval, scale) {
  if (interval[1] instanceof Date) {
    return scale(interval[1]) - scale(interval[0]);
  }
  return 0;
};

pixelMaxDifference = function(a, b, scale) {
  var diffs;
  diffs = subtract(a, b);
  if (diffs.length === 0) {
    return 0;
  } else {
    return Math.max.apply(Math, diffs.map(function(diff) {
      return pixelWidth(diff, scale);
    }));
  }
};

merged = function(a, b, predicate) {
  var i, len, out, r2;
  out = a.slice(0);
  for (i = 0, len = b.length; i < len; i++) {
    r2 = b[i];
    if (!a.find(function(r1) {
      return predicate(r1, r2);
    })) {
      out.push(r2);
    }
  }
  return out;
};

after = function(n, callback) {
  var count;
  count = 0;
  return function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    ++count;
    if (count === n) {
      return callback.apply(null, args);
    }
  };
};

subtract = function(a, b) {
  if (!intersects(a, b)) {
    return [a];
  } else if (a[0] < b[0] && a[1] > b[1]) {
    return [[a[0], b[0]], [b[1], a[1]]];
  } else if (a[0] < b[0]) {
    return [[a[0], b[0]]];
  } else if (a[1] > b[1]) {
    return [[b[1], a[1]]];
  } else {
    return [];
  }
};

parseDuration = function(duration) {
  var days, hours, matches, minutes, months, years;
  if (!isNaN(parseFloat(duration))) {
    return parseFloat(duration);
  }
  matches = duration.match(/^P(?:([0-9]+)Y|)?(?:([0-9]+)M|)?(?:([0-9]+)D|)?T?(?:([0-9]+)H|)?(?:([0-9]+)M|)?(?:([0-9]+)S|)?$/);
  if (matches) {
    years = parseInt(matches[1]) || 0;
    months = (parseInt(matches[2]) || 0) + years * 12;
    days = (parseInt(matches[3]) || 0) + months * 30;
    hours = (parseInt(matches[4]) || 0) + days * 24;
    minutes = (parseInt(matches[5]) || 0) + hours * 60;
    return (parseInt(matches[6]) || 0) + minutes * 60;
  }
};

offsetDate = function(date, seconds) {
  return new Date(date.getTime() + seconds * 1000);
};

centerTooltipOn = function(tooltip, target, dir, offset) {
  var rect, tooltipRect, xOff;
  if (dir == null) {
    dir = 'center';
  }
  if (offset == null) {
    offset = [0, 0];
  }
  rect = target.getBoundingClientRect();
  tooltipRect = tooltip[0][0].getBoundingClientRect();
  if (dir === 'left') {
    xOff = rect.left;
  } else if (dir === 'right') {
    xOff = rect.right;
  } else {
    xOff = rect.left + rect.width / 2;
  }
  return tooltip.style('left', xOff - tooltipRect.width / 2 + offset[0] + "px").style('top', (rect.top - tooltipRect.height) + offset[1] + "px");
};

module.exports = {
  split: split,
  bisect: bisect,
  insort: insort,
  intersects: intersects,
  pixelDistance: pixelDistance,
  pixelWidth: pixelWidth,
  pixelMaxDifference: pixelMaxDifference,
  merged: merged,
  after: after,
  subtract: subtract,
  parseDuration: parseDuration,
  offsetDate: offsetDate,
  centerTooltipOn: centerTooltipOn
};


},{}]},{},[15]);
