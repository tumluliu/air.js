"use strict";

if (!L.mapbox) throw new Error("include mapbox.js before air.js");

L.air = require("./src/directions");
L.air.format = require("./src/format");
L.air.layer = require("./src/layer");
L.air.inputControl = require("./src/input_control");
L.air.routesControl = require("./src/routes_control");
L.air.tracksControl = require("./src/tracks_control");
