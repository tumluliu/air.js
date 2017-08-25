"use strict";

var tableControl = require("./table_control.js"),
    pagingControl = require("./paging_control.js"),
    getRequest = require("./get_request.js");

module.exports = function(container, directions) {
    var control = {},
        map;
    var origChange = false,
        destChange = false;
    var TRACKINFO_API_URL = "https://luliu.me/tracks/api/v1/trackinfo";
    var TRACK_API_URL = "https://luliu.me/tracks/api/v1/tracks";

    control.addTo = function(_) {
        map = _;
        return control;
    };

    // get page 1 of trackinfo as init data for the table
    // Web browser compatibility:
    // for IE7+, Firefox, Chrome, Opera, Safari
    container = document.getElementById(container);
    container.insertAdjacentHTML(
        "afterbegin",
        '<table id="tracks-table" class="prose air-tracks"></table>'
    );
    container.insertAdjacentHTML(
        "beforeend",
        '<div id="paging" data-control="paging"></div>'
    );

    var trackinfoKeys = [
            "ID",
            "Segments",
            "2D length",
            "3D length",
            "Moving time",
            "Stopped time",
            "Max speed",
            "Uphill",
            "Downhill",
            "Started at",
            "Ended at",
            "Points",
            "Start lon",
            "Start lat",
            "End lon",
            "End lat"
        ],
        values = [];
    var page = 1,
        totalPages = 1,
        numResults = 1;
    var tc = new tableControl(
        document.getElementById("tracks-table"),
        trackinfoKeys,
        values
    );
    var pg = new pagingControl(document.getElementById("paging"), {
        displayed: 0,
        total: 0
    });

    var trackinfoXhr = new XMLHttpRequest();
    trackinfoXhr.onreadystatechange = function() {
        if (trackinfoXhr.readyState === 4 && trackinfoXhr.status === 200) {
            var trackinfoData = JSON.parse(trackinfoXhr.responseText);
            totalPages = trackinfoData.total_pages;
            page = trackinfoData.page;
            numResults = trackinfoData.num_results;
            values = [];
            trackinfoData.objects.forEach(function(data) {
                var row = trackinfoKeys.map(function(key) {
                    return data[key];
                });
                values.push(row);
            });
            tc.bind(values);
            pg.update({ displayed: 10, total: totalPages });
        }
    };
    trackinfoXhr.open("GET", TRACKINFO_API_URL, true);
    trackinfoXhr.send();

    tc.onSelected(function(data) {
        var startPos = L.GeoJSON.coordsToLatLng([data[12], data[13]]);
        var endPos = L.GeoJSON.coordsToLatLng([data[14], data[15]]);
        directions.setOrigin(startPos);
        directions.setDestination(endPos);
        var southWest = L.latLng(
                Math.min(startPos.lat, endPos.lat),
                Math.min(startPos.lng, endPos.lng)
            ),
            northEast = L.latLng(
                Math.max(startPos.lat, endPos.lat),
                Math.max(startPos.lng, endPos.lng)
            ),
            bounds = L.latLngBounds(southWest, northEast);
        map.fitBounds(bounds);
        // Web browser compatibility:
        // IE7+, Firefox, Chrome, Opera, Safari
        var trackXhr = new XMLHttpRequest();
        trackXhr.onreadystatechange = function() {
            if (trackXhr.readyState === 4 && trackXhr.status === 200) {
                var trackData = JSON.parse(trackXhr.responseText);
                directions.selectTrack(trackData);
            }
        };
        trackXhr.open("GET", TRACK_API_URL + "/" + data[0], true);
        trackXhr.send();
    });

    pg.onSelected(function(pageNo) {
        var pagedTrackinfoXhr = new XMLHttpRequest();
        pagedTrackinfoXhr.onreadystatechange = function() {
            if (
                pagedTrackinfoXhr.readyState === 4 &&
                pagedTrackinfoXhr.status === 200
            ) {
                var trackinfoData = JSON.parse(pagedTrackinfoXhr.responseText);
                // The following 3 variables can be aquired from the response,
                // but useless for the moment
                //totalPages = trackinfoData.total_pages;
                //page = trackinfoData.page;
                //numResults = trackinfoData.num_results;
                values = [];
                trackinfoData.objects.forEach(function(data) {
                    var row = trackinfoKeys.map(function(key) {
                        return data[key];
                    });
                    values.push(row);
                });
                tc.bind(values);
            }
        };
        pagedTrackinfoXhr.open(
            "GET",
            TRACKINFO_API_URL + "?page=" + pageNo,
            true
        );
        pagedTrackinfoXhr.send();
    });

    return control;
};
