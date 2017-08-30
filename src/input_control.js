"use strict";

var d3 = require("d3");

module.exports = function(container, directions) {
    var control = {},
        map;

    control.addTo = function(_) {
        map = _;
        return control;
    };

    container = d3
        .select(L.DomUtil.get(container))
        .classed("mapbox-directions-inputs", true);

    var form = container.append("form");

    var origin = form.append("div").attr("class", "mapbox-directions-origin");

    origin
        .append("label")
        .attr("class", "mapbox-form-label")
        .append("span")
        .attr("class", "mapbox-directions-icon mapbox-depart-icon");

    var originInput = origin
        .append("input")
        .attr("type", "text")
        .attr("required", "required")
        .attr("id", "air-origin-input")
        .attr("placeholder", "Start")
        .property("readOnly", true);

    var destination = form
        .append("div")
        .attr("class", "mapbox-directions-destination");

    destination
        .append("label")
        .attr("class", "mapbox-form-label")
        .append("span")
        .attr("class", "mapbox-directions-icon mapbox-arrive-icon");

    var destinationInput = destination
        .append("input")
        .attr("type", "text")
        .attr("required", "required")
        .attr("id", "air-destination-input")
        .attr("placeholder", "End")
        .property("readOnly", true);

    var directionProviders = {
        mapbox: false,
        openrouteservice: false,
        google: false
    };

    //Options block for Mapbox cycling path finding
    var mapboxDirections = form
        .append("div")
        .attr("id", "mapbox-directions")
        .attr("class", "mapbox-directions-profile");

    var checkboxMapbox = mapboxDirections
        .append("input")
        .attr("type", "checkbox")
        .attr("name", "enabled")
        .attr("id", "show-mapbox-cycling")
        .property("checked", false)
        .on("change", function() {
            toggleMapbox(this.checked);
        });

    function toggleMapbox(checked) {
        if (checked) {
            directionProviders.mapbox = true;
            directions.query({
                provider: "mapbox"
            });
        } else {
            directionProviders.mapbox = false;
            directions.enableProvider("mapbox", false);
        }
    }

    mapboxDirections
        .append("label")
        .attr("class", "air-heading-label")
        .attr("for", "show-mapbox-cycling")
        .text("MAPBOX");

    var googleDirections = form
        .append("div")
        .attr("id", "google-directions-profile")
        .attr("class", "mapbox-directions-profile");

    var checkboxGoogle = googleDirections
        .append("input")
        .attr("type", "checkbox")
        .attr("name", "enabled")
        .attr("id", "show-google-cycling")
        .property("checked", false)
        .on("change", function() {
            toggleGoogle(this.checked);
        });

    function toggleGoogle(checked) {
        if (checked) {
            directionProviders.google = true;
            directions.query({
                provider: "google"
            });
        } else {
            directionProviders.google = false;
            directions.enableProvider("google", false);
        }
    }

    googleDirections
        .append("label")
        .attr("class", "air-heading-label")
        .attr("for", "show-google-cycling")
        .text("GOOGLE");

    //Options block for OpenRouteService cycling path finding
    var orsDirections = form
        .append("div")
        .attr("id", "ors-directions")
        .attr("class", "mapbox-directions-profile");

    var checkboxORS = orsDirections
        .append("input")
        .attr("type", "checkbox")
        .attr("name", "enabled")
        .attr("id", "show-ors-cycling")
        .property("checked", false)
        .on("change", function() {
            toggleORS(this.checked);
        });

    function toggleORS(checked) {
        if (checked) {
            directionProviders.openrouteservice = true;
            changeORSCyclingOption();
        } else {
            directionProviders.openrouteservice = false;
            directions.enableProvider("openrouteservice", false);
        }
        orsRadioButtons.forEach(function(r) {
            r.property("disabled", !checked);
        });
    }

    orsDirections
        .append("label")
        .attr("class", "air-heading-label")
        .attr("for", "show-ors-cycling")
        .text("OPENROUTESERVICE");

    var orsCyclingOptions = orsDirections.append("div");
    var orsRadioButtons = [];
    orsRadioButtons.push(
        orsCyclingOptions
            .append("input")
            .attr("type", "radio")
            .attr("name", "orsProfileBicycle")
            .attr("id", "ors-bicycle-regular")
            .attr("value", "cycling-regular")
            .property("checked", true)
            .property("disabled", true)
            .on("change", changeORSCyclingOption)
    );

    orsCyclingOptions
        .append("label")
        .attr("for", "ors-bicycle-regular")
        .html("Normal");

    orsRadioButtons.push(
        orsCyclingOptions
            .append("input")
            .attr("type", "radio")
            .attr("name", "orsProfileBicycle")
            .attr("id", "ors-bicycle-safe")
            .attr("value", "cycling-safe")
            .property("disabled", true)
            .on("change", changeORSCyclingOption)
    );

    orsCyclingOptions
        .append("label")
        .attr("for", "ors-bicycle-safe")
        .html("Safest");

    orsRadioButtons.push(
        orsCyclingOptions
            .append("input")
            .attr("type", "radio")
            .attr("name", "orsProfileBicycle")
            .attr("id", "ors-bicycle-tour")
            .attr("value", "cycling-tour")
            .property("disabled", true)
            .on("change", changeORSCyclingOption)
    );

    orsCyclingOptions
        .append("label")
        .attr("for", "ors-bicycle-tour")
        .html("Touring bike");

    orsRadioButtons.push(
        orsCyclingOptions
            .append("input")
            .attr("type", "radio")
            .attr("name", "orsProfileBicycle")
            .attr("id", "ors-bicycle-mountain")
            .attr("value", "cycling-mountain")
            .property("disabled", true)
            .on("change", changeORSCyclingOption)
    );

    orsCyclingOptions
        .append("label")
        .attr("for", "ors-bicycle-mountain")
        .html("Mountain bike");

    orsRadioButtons.push(
        orsCyclingOptions
            .append("input")
            .attr("type", "radio")
            .attr("name", "orsProfileBicycle")
            .attr("id", "ors-bicycle-road")
            .attr("value", "cycling-road")
            .property("disabled", true)
            .on("change", changeORSCyclingOption)
    );

    orsCyclingOptions
        .append("label")
        .attr("for", "ors-bicycle-road")
        .html("Road bike");

    orsRadioButtons.push(
        orsCyclingOptions
            .append("input")
            .attr("type", "radio")
            .attr("name", "orsProfileBicycle")
            .attr("id", "ors-bicycle-electric")
            .attr("value", "cycling-electric")
            .property("disabled", true)
            .on("change", changeORSCyclingOption)
    );

    orsCyclingOptions
        .append("label")
        .attr("for", "ors-bicycle-electric")
        .html("e-bike");

    function changeORSCyclingOption() {
        var selectedOption = d3
            .select("input[name=orsProfileBicycle]:checked")
            .attr("value");
        directions.query({
            provider: "openrouteservice",
            profile: selectedOption
        });
    }

    function format(waypoint) {
        if (!waypoint) {
            return "";
        } else if (waypoint.properties.name) {
            return waypoint.properties.name;
        } else if (waypoint.geometry.coordinates) {
            var precision = Math.max(
                0,
                Math.ceil(Math.log(map.getZoom()) / Math.LN2)
            );
            return (
                waypoint.geometry.coordinates[0].toFixed(precision) +
                ", " +
                waypoint.geometry.coordinates[1].toFixed(precision)
            );
        } else {
            return waypoint.properties.query || "";
        }
    }

    directions
        .on("origin", function(e) {
            originInput.property("value", format(e.origin));
        })
        .on("destination", function(e) {
            destinationInput.property("value", format(e.destination));
        })
        .on("checkmapbox", function() {
            toggleMapbox(checkboxMapbox.property("checked"));
        })
        .on("checkgoogle", function() {
            toggleGoogle(checkboxGoogle.property("checked"));
        })
        .on("checkors", function() {
            toggleORS(checkboxORS.property("checked"));
        })
        .on("load", function(e) {
            originInput.property("value", format(e.origin));
            destinationInput.property("value", format(e.destination));
        });

    return control;
};
