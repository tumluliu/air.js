"use strict";

var d3 = require("../lib/d3");

module.exports = function(container, directions) {
    var control = {},
        map;
    var origChange = false,
        destChange = false;

    control.addTo = function(_) {
        map = _;
        return control;
    };

    container = d3
        .select(L.DomUtil.get(container))
        .classed("mapbox-directions-inputs", true);

    var form = container.append("form").on("keypress", function() {
        if (d3.event.keyCode === 13) {
            d3.event.preventDefault();
            if (origChange) directions.setOrigin(originInput.property("value"));
            if (destChange)
                directions.setDestination(destinationInput.property("value"));
            if (directions.queryable())
                for (var key in directionProviders) {
                    if (
                        directionProviders.hasOwnProperty(key) &&
                        directionProviders[key] === true
                    ) {
                        directions.query({
                            proximity: map.getCenter(),
                            provider: key
                        });
                    }
                }
            origChange = false;
            destChange = false;
        }
    });

    var origin = form.append("div").attr("class", "mapbox-directions-origin");

    origin
        .append("label")
        .attr("class", "mapbox-form-label")
        .on("click", function() {
            if (directions.getOrigin() instanceof L.LatLng) {
                map.panTo(directions.getOrigin());
            }
        })
        .append("span")
        .attr("class", "mapbox-directions-icon mapbox-depart-icon");

    var originInput = origin
        .append("input")
        .attr("type", "text")
        .attr("required", "required")
        .attr("id", "air-origin-input")
        .attr("placeholder", "Start")
        .on("input", function() {
            if (!origChange) origChange = true;
        });

    origin
        .append("div")
        .attr("class", "mapbox-directions-icon mapbox-close-icon")
        .attr("title", "Clear value")
        .on("click", function() {
            directions.setOrigin(undefined);
        });

    form
        .append("span")
        .attr(
            "class",
            "mapbox-directions-icon mapbox-reverse-icon mapbox-directions-reverse-input"
        )
        .attr("title", "Reverse origin & destination")
        .on("click", function() {
            for (var key in directionProviders) {
                if (
                    directionProviders.hasOwnProperty(key) &&
                    directionProviders[key] === true
                ) {
                    directions.reverse().query({
                        provider: key
                    });
                }
            }
        });

    var destination = form
        .append("div")
        .attr("class", "mapbox-directions-destination");

    destination
        .append("label")
        .attr("class", "mapbox-form-label")
        .on("click", function() {
            if (directions.getDestination() instanceof L.LatLng) {
                map.panTo(directions.getDestination());
            }
        })
        .append("span")
        .attr("class", "mapbox-directions-icon mapbox-arrive-icon");

    var destinationInput = destination
        .append("input")
        .attr("type", "text")
        .attr("required", "required")
        .attr("id", "air-destination-input")
        .attr("placeholder", "End")
        .on("input", function() {
            if (!destChange) destChange = true;
        });

    destination
        .append("div")
        .attr("class", "mapbox-directions-icon mapbox-close-icon")
        .attr("title", "Clear value")
        .on("click", function() {
            directions.setDestination(undefined);
        });

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
        .on("change", function(d) {
            if (this.checked) {
                directionProviders.mapbox = true;
                directions.query({
                    provider: "mapbox"
                });
            } else {
                directionProviders.mapbox = false;
                directions.enableProvider("mapbox", false);
            }
        });

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
        .on("change", function(d) {
            if (this.checked) {
                directionProviders.google = true;
                directions.query({
                    provider: "google"
                });
            } else {
                directionProviders.google = false;
                directions.enableProvider("google", false);
            }
        });

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
        .on("change", function(d) {
            if (this.checked) {
                directionProviders.openrouteservice = true;
                changeORSCyclingOption();
                disableORSRadioBtns(false);
            } else {
                directionProviders.openrouteservice = false;
                directions.enableProvider("openrouteservice", false);
                disableORSRadioBtns(true);
            }
        });

    orsDirections
        .append("label")
        .attr("class", "air-heading-label")
        .attr("for", "show-ors-cycling")
        .text("OPENROUTESERVICE");

    var orsCyclingOptions = orsDirections.append("div");
    var orsCyclingRegular = orsCyclingOptions
        .append("input")
        .attr("type", "radio")
        .attr("name", "orsProfileBicycle")
        .attr("id", "ors-bicycle-regular")
        .attr("value", "cycling-regular")
        .property("checked", true)
        .property("disabled", true)
        .on("change", changeORSCyclingOption);

    orsCyclingOptions
        .append("label")
        .attr("for", "ors-bicycle-regular")
        .html("Normal");

    var orsCyclingSafe = orsCyclingOptions
        .append("input")
        .attr("type", "radio")
        .attr("name", "orsProfileBicycle")
        .attr("id", "ors-bicycle-safe")
        .attr("value", "cycling-safe")
        .property("disabled", true)
        .on("change", changeORSCyclingOption);

    orsCyclingOptions
        .append("label")
        .attr("for", "ors-bicycle-safe")
        .html("Safest");

    var orsCyclingTour = orsCyclingOptions
        .append("input")
        .attr("type", "radio")
        .attr("name", "orsProfileBicycle")
        .attr("id", "ors-bicycle-tour")
        .attr("value", "cycling-tour")
        .property("disabled", true)
        .on("change", changeORSCyclingOption);

    orsCyclingOptions
        .append("label")
        .attr("for", "ors-bicycle-tour")
        .html("Touring bike");

    var orsCyclingMountain = orsCyclingOptions
        .append("input")
        .attr("type", "radio")
        .attr("name", "orsProfileBicycle")
        .attr("id", "ors-bicycle-mountain")
        .attr("value", "cycling-mountain")
        .property("disabled", true)
        .on("change", changeORSCyclingOption);

    orsCyclingOptions
        .append("label")
        .attr("for", "ors-bicycle-mountain")
        .html("Mountain bike");

    var orsCyclingRoad = orsCyclingOptions
        .append("input")
        .attr("type", "radio")
        .attr("name", "orsProfileBicycle")
        .attr("id", "ors-bicycle-road")
        .attr("value", "cycling-road")
        .property("disabled", true)
        .on("change", changeORSCyclingOption);

    orsCyclingOptions
        .append("label")
        .attr("for", "ors-bicycle-road")
        .html("Road bike");

    var orsCyclingElectric = orsCyclingOptions
        .append("input")
        .attr("type", "radio")
        .attr("name", "orsProfileBicycle")
        .attr("id", "ors-bicycle-electric")
        .attr("value", "cycling-electric")
        .property("disabled", true)
        .on("change", changeORSCyclingOption);

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

    function disableORSRadioBtns(is_disabled) {
        d3.selectAll("input[name='orsProfileBicycle']")[0].forEach(function(r) {
            r.disabled = is_disabled;
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
        .on("checkmapbox", function(e) {
            checkboxMapbox.property("checked", false);
        })
        .on("checkgoogle", function(e) {
            checkboxGoogle.property("checked", false);
        })
        .on("checkors", function(e) {
            checkboxORS.property("checked", false);
        })
        .on("load", function(e) {
            originInput.property("value", format(e.origin));
            destinationInput.property("value", format(e.destination));
        });

    return control;
};
