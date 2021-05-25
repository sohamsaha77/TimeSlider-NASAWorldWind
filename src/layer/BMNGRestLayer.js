/*
 * Copyright 2003-2006, 2009, 2017, 2020 United States Government, as represented
 * by the Administrator of the National Aeronautics and Space Administration.
 * All rights reserved.
 *
 * The NASAWorldWind/WebWorldWind platform is licensed under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License
 * at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed
 * under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 * NASAWorldWind/WebWorldWind also contains the following 3rd party Open Source
 * software:
 *
 *    ES6-Promise – under MIT License
 *    libtess.js – SGI Free Software License B
 *    Proj4 – under MIT License
 *    JSZip – under MIT License
 *
 * A complete listing of 3rd Party software notices and licenses included in
 * WebWorldWind can be found in the WebWorldWind 3rd-party notices and licenses
 * PDF found in code  directory.
 */
/**
 * @exports BMNGRestLayer
 */
define([
        '../error/ArgumentError',
        '../layer/Layer',
        '../util/Logger',
        '../util/PeriodicTimeSequence',
        '../layer/RestTiledImageLayer'
    ],
    function (ArgumentError,
              Layer,
              Logger,
              PeriodicTimeSequence,
              RestTiledImageLayer) {
        "use strict";

        /**
         * Constructs a Blue Marble layer.
         * @alias BMNGRestLayer
         * @constructor
         * @augments Layer
         * @classdesc Represents the 12 month collection of Blue Marble Next Generation imagery for the year 2021.
         * By default the month of January is displayed, but this can be changed by setting this class' time
         * property to indicate the month to display.
         * @param {String} serverAddress The server address of the tile service. May be null, in which case the
         * current origin is used (see window.location).
         * @param {String} pathToData The path to the data directory relative to the specified server address.
         * May be null, in which case the server address is assumed to be the full path to the data directory.
         * @param {String} displayName The display name to assign this layer. Defaults to "Blue Marble" if null or
         * undefined.
         * @param {Date} initialTime A date value indicating the month to display. The nearest month to the specified
         * time is displayed. January is displayed if this argument is null or undefined, i.e., new Date("2021-01");
         * See {@link RestTiledImageLayer} for a description of its contents. May be null, in which case default
         * values are used.
         */
        var BMNGRestLayer = function (serverAddress, pathToData, displayName, initialTime) {
            Layer.call(this, displayName || "Blue Marble time series");

            /**
             * A value indicating the month to display. The nearest month to the specified time is displayed.
             * @type {Date}
             * @default January 2021 (new Date("2021-01"));
             */
            this.time = initialTime || new Date("2021-01");

            // Intentionally not documented.
            this.timeSequence = new PeriodicTimeSequence("2021-01-01/2021-12-01/P1M");

            // Intentionally not documented.
            this.serverAddress = serverAddress;

            // Intentionally not documented.
            this.pathToData = pathToData;

            // Intentionally not documented.
            this.layers = {}; // holds the layers as they're created.

            // Intentionally not documented.
            this.layerNames = [
                {month: "BlueMarble-202101", time: BMNGRestLayer.availableTimes[0]},
                {month: "BlueMarble-202102", time: BMNGRestLayer.availableTimes[1]},
                {month: "BlueMarble-202103", time: BMNGRestLayer.availableTimes[2]},
                {month: "BlueMarble-202104", time: BMNGRestLayer.availableTimes[3]},
                {month: "BlueMarble-202105", time: BMNGRestLayer.availableTimes[4]},
                {month: "BlueMarble-202106", time: BMNGRestLayer.availableTimes[5]},
                {month: "BlueMarble-202107", time: BMNGRestLayer.availableTimes[6]},
                {month: "BlueMarble-202108", time: BMNGRestLayer.availableTimes[7]},
                {month: "BlueMarble-202109", time: BMNGRestLayer.availableTimes[8]},
                {month: "BlueMarble-202110", time: BMNGRestLayer.availableTimes[9]},
                {month: "BlueMarble-202111", time: BMNGRestLayer.availableTimes[10]},
                {month: "BlueMarble-202112", time: BMNGRestLayer.availableTimes[11]}
            ];

            this.pickEnabled = false;
        };

        BMNGRestLayer.prototype = Object.create(Layer.prototype);

        /**
         * Indicates the available times for this layer.
         * @type {Date[]}
         * @readonly
         */
        BMNGRestLayer.availableTimes = [
            new Date("2021-01"),
            new Date("2021-02"),
            new Date("2021-03"),
            new Date("2021-04"),
            new Date("2021-05"),
            new Date("2021-06"),
            new Date("2021-07"),
            new Date("2021-08"),
            new Date("2021-09"),
            new Date("2021-10"),
            new Date("2021-11"),
            new Date("2021-12")
        ];

        /**
         * Initiates retrieval of this layer's level 0 images for all sub-layers. Use
         * [isPrePopulated]{@link TiledImageLayer#isPrePopulated} to determine when the images have been retrieved
         * and associated with the level 0 tiles.
         * Pre-populating is not required. It is used to eliminate the visual effect of loading tiles incrementally,
         * but only for level 0 tiles. An application might pre-populate a layer in order to delay displaying it
         * within a time series until all the level 0 images have been retrieved and added to memory.
         * @param {WorldWindow} wwd The WorldWindow for which to pre-populate this layer.
         * @throws {ArgumentError} If the specified WorldWindow is null or undefined.
         */
        BMNGRestLayer.prototype.prePopulate = function (wwd) {
            if (!wwd) {
                throw new ArgumentError(
                    Logger.logMessage(Logger.LEVEL_SEVERE, "BMNGRestLayer", "prePopulate", "missingWorldWindow"));
            }

            for (var i = 0; i < this.layerNames.length; i++) {
                var layerName = this.layerNames[i].month;

                if (!this.layers[layerName]) {
                    this.createSubLayer(layerName);
                }

                this.layers[layerName].prePopulate(wwd);
            }
        };

        /**
         * Indicates whether this layer's level 0 tile images for all sub-layers have been retrieved and associated
         * with the tiles.
         * Use [prePopulate]{@link TiledImageLayer#prePopulate} to initiate retrieval of level 0 images.
         * @param {WorldWindow} wwd The WorldWindow associated with this layer.
         * @returns {Boolean} true if all level 0 images have been retrieved, otherwise false.
         * @throws {ArgumentError} If the specified WorldWindow is null or undefined.
         */
        BMNGRestLayer.prototype.isPrePopulated = function (wwd) {
            for (var i = 0; i < this.layerNames.length; i++) {
                var layer = this.layers[this.layerNames[i].month];
                if (!layer || !layer.isPrePopulated(wwd)) {
                    return false;
                }
            }

            return true;
        };

        BMNGRestLayer.prototype.doRender = function (dc) {
            var layer = this.nearestLayer(this.time);
            layer.opacity = this.opacity;
            if (this.detailControl) {
                layer.detailControl = this.detailControl;
            }

            layer.doRender(dc);

            this.inCurrentFrame = layer.inCurrentFrame;
        };

        // Intentionally not documented.
        BMNGRestLayer.prototype.nearestLayer = function (time) {
            var nearestName = this.nearestLayerName(time);

            if (!this.layers[nearestName]) {
                this.createSubLayer(nearestName);
            }

            return this.layers[nearestName];
        };

        BMNGRestLayer.prototype.createSubLayer = function (layerName) {
            var subLayerPath = "";
            if (this.pathToData) {
                subLayerPath = this.pathToData + "/" + layerName;
            } else {
                subLayerPath = layerName;
            }

            this.layers[layerName] = new RestTiledImageLayer(this.serverAddress, subLayerPath, this.displayName);
        };

        // Intentionally not documented.
        BMNGRestLayer.prototype.nearestLayerName = function (time) {
            var milliseconds = time.getTime();

            if (milliseconds <= this.layerNames[0].time.getTime()) {
                return this.layerNames[0].month;
            }

            if (milliseconds >= this.layerNames[11].time.getTime()) {
                return this.layerNames[11].month;
            }

            for (var i = 0; i < this.layerNames.length - 1; i++) {
                var leftTime = this.layerNames[i].time.getTime(),
                    rightTime = this.layerNames[i + 1].time.getTime();

                if (milliseconds >= leftTime && milliseconds <= rightTime) {
                    var dLeft = milliseconds - leftTime,
                        dRight = rightTime - milliseconds;

                    return dLeft < dRight ? this.layerNames[i].month : this.layerNames[i + 1].month;
                }
            }
        };

        return BMNGRestLayer;
    });