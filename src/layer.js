"use strict";

var debounce = require("debounce");

var Layer = L.LayerGroup.extend({
    options: {
        readonly: false
    },

    initialize: function(directions, options) {
        L.setOptions(this, options);
        this._directions = directions || new L.Directions();
        L.LayerGroup.prototype.initialize.apply(this);

        this._drag = debounce(L.bind(this._drag, this), 100);

        this.originMarker = L.marker([0, 0], {
            draggable: !this.options.readonly,
            icon: L.mapbox.marker.icon({
                "marker-size": "medium",
                "marker-color": "#3BB2D0",
                "marker-symbol": "a"
            })
        }).on("drag", this._drag, this);

        this.destinationMarker = L.marker([0, 0], {
            draggable: !this.options.readonly,
            icon: L.mapbox.marker.icon({
                "marker-size": "medium",
                "marker-color": "#444",
                "marker-symbol": "b"
            })
        }).on("drag", this._drag, this);

        this.stepMarker = L.marker([0, 0], {
            icon: L.divIcon({
                className:
                    "mapbox-marker-drag-icon mapbox-marker-drag-icon-step",
                iconSize: new L.Point(12, 12)
            })
        });

        this.dragMarker = L.marker([0, 0], {
            draggable: !this.options.readonly,
            icon: this._waypointIcon()
        });

        this.dragMarker
            .on("dragstart", this._dragStart, this)
            .on("drag", this._drag, this)
            .on("dragend", this._dragEnd, this);

        this.routeLayer = L.mapbox.featureLayer();
        this.routeHighlightLayer = L.mapbox.featureLayer();
        this.trackLayer = L.mapbox.featureLayer();
    },

    onAdd: function() {
        L.LayerGroup.prototype.onAdd.apply(this, arguments);

        if (!this.options.readonly) {
            this._map
                .on("click", this._click, this)
                .on("mousemove", this._mousemove, this);
        }

        this._directions
            .on("origin", this._origin, this)
            .on("destination", this._destination, this)
            .on("load", this._load, this)
            .on("unload", this._unload, this)
            .on("selectRoute", this._selectRoute, this)
            .on("selectTrack", this._selectTrack, this)
            .on("highlightRoute", this._highlightRoute, this)
            .on("highlightStep", this._highlightStep, this);
    },

    onRemove: function() {
        this._directions
            .off("origin", this._origin, this)
            .off("destination", this._destination, this)
            .off("load", this._load, this)
            .off("unload", this._unload, this)
            .off("selectRoute", this._selectRoute, this)
            .off("selectTrack", this._selectTrack, this)
            .off("highlightRoute", this._highlightRoute, this)
            .off("highlightStep", this._highlightStep, this);

        this._map
            .off("click", this._click, this)
            .off("mousemove", this._mousemove, this);

        L.LayerGroup.prototype.onRemove.apply(this, arguments);
    },

    _click: function(e) {
        if (!this._directions.getOrigin()) {
            this._directions.setOrigin(e.latlng);
        } else if (!this._directions.getDestination()) {
            this._directions.setDestination(e.latlng);
        }

        //if (this._directions.queryable()) {
        //this._directions.query();
        //}
    },

    _mousemove: function(e) {
        if (
            !this.routeLayer ||
            !this.hasLayer(this.routeLayer) ||
            this._currentWaypoint !== undefined
        ) {
            return;
        }

        var p = this._routePolyline().closestLayerPoint(e.layerPoint);

        if (!p || p.distance > 15) {
            return this.removeLayer(this.dragMarker);
        }

        var m = this._map.project(e.latlng),
            o = this._map.project(this.originMarker.getLatLng()),
            d = this._map.project(this.destinationMarker.getLatLng());

        if (o.distanceTo(m) < 15 || d.distanceTo(m) < 15) {
            return this.removeLayer(this.dragMarker);
        }

        this.dragMarker.setLatLng(this._map.layerPointToLatLng(p));
        this.addLayer(this.dragMarker);
    },

    _origin: function(e) {
        if (e.origin && e.origin.geometry.coordinates) {
            this.originMarker.setLatLng(
                L.GeoJSON.coordsToLatLng(e.origin.geometry.coordinates)
            );
            this.addLayer(this.originMarker);
        } else {
            this.removeLayer(this.originMarker);
        }
    },

    _destination: function(e) {
        if (e.destination && e.destination.geometry.coordinates) {
            this.destinationMarker.setLatLng(
                L.GeoJSON.coordsToLatLng(e.destination.geometry.coordinates)
            );
            this.addLayer(this.destinationMarker);
        } else {
            this.removeLayer(this.destinationMarker);
        }
    },

    _load: function(e) {
        this._origin(e);
        this._destination(e);
    },

    _unload: function() {
        this.removeLayer(this.routeLayer);
        this.removeLayer(this.trackLayer);
    },

    _selectRoute: function(e) {
        this.routeLayer.clearLayers().setGeoJSON(e.route);
        this.addLayer(this.routeLayer);
    },

    _selectTrack: function(e) {
        this.trackLayer.clearLayers().setGeoJSON(e.track);
        this.addLayer(this.trackLayer);
        this.removeLayer(this.routeLayer);
    },

    _highlightRoute: function(e) {
        if (e.route) {
            this.routeHighlightLayer.clearLayers().setGeoJSON(e.route.geometry);
            this.addLayer(this.routeHighlightLayer);
        } else {
            this.removeLayer(this.routeHighlightLayer);
        }
    },

    _highlightStep: function(e) {
        if (e.step && e.step.loc) {
            this.stepMarker.setLatLng(L.GeoJSON.coordsToLatLng(e.step.loc));
            this.addLayer(this.stepMarker);
        } else {
            this.removeLayer(this.stepMarker);
        }
    },

    _routePolyline: function() {
        return this.routeLayer.getLayers()[0];
    },

    _findNearestRouteSegment: function(latLng) {
        var min = Infinity,
            index,
            p = this._map.latLngToLayerPoint(latLng),
            positions = this._routePolyline()._originalPoints;

        for (var i = 1; i < positions.length; i++) {
            var d = L.LineUtil._sqClosestPointOnSegment(
                p,
                positions[i - 1],
                positions[i],
                true
            );
            if (d < min) {
                min = d;
                index = i;
            }
        }

        return index;
    },

    _waypointIcon: function() {
        return L.divIcon({
            className: "mapbox-marker-drag-icon",
            iconSize: new L.Point(12, 12)
        });
    }
});

module.exports = function(directions, options) {
    return new Layer(directions, options);
};
