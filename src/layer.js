"use strict";

var Layer = L.LayerGroup.extend({
    options: {
        readonly: false
    },

    initialize: function(directions, options) {
        L.setOptions(this, options);
        this._directions = directions || new L.Directions();
        L.LayerGroup.prototype.initialize.apply(this);

        this.originMarker = L.marker([0, 0], {
            icon: L.mapbox.marker.icon({
                "marker-size": "medium",
                "marker-color": "#3BB2D0",
                "marker-symbol": "a"
            })
        });

        this.destinationMarker = L.marker([0, 0], {
            icon: L.mapbox.marker.icon({
                "marker-size": "medium",
                "marker-color": "#444",
                "marker-symbol": "b"
            })
        });

        this.routeLayer = L.mapbox.featureLayer();
        this.routeHighlightLayer = L.mapbox.featureLayer();
        this.trackLayer = L.mapbox.featureLayer();
    },

    onAdd: function() {
        L.LayerGroup.prototype.onAdd.apply(this, arguments);

        this._directions
            .on("origin", this._origin, this)
            .on("destination", this._destination, this)
            .on("load", this._load, this)
            .on("unload", this._unload, this)
            .on("selectRoute", this._selectRoute, this)
            .on("selectTrack", this._selectTrack, this);
    },

    onRemove: function() {
        this._directions
            .off("origin", this._origin, this)
            .off("destination", this._destination, this)
            .off("load", this._load, this)
            .off("unload", this._unload, this)
            .off("selectRoute", this._selectRoute, this)
            .off("selectTrack", this._selectTrack, this);

        L.LayerGroup.prototype.onRemove.apply(this, arguments);
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

    _routePolyline: function() {
        return this.routeLayer.getLayers()[0];
    }
});

module.exports = function(directions, options) {
    return new Layer(directions, options);
};
