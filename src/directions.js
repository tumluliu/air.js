"use strict";

var getRequest = require("./get_request"),
    polyline = require("@mapbox/polyline"),
    d3 = require("d3");

var Directions = L.Class.extend({
    includes: [L.Mixin.Events],

    options: {
        available_providers: ["mapbox", "google", "openrouteservice"],
        enabled_providers: [],
        unit: "meters",
        mapbox: {
            api_template:
                "https://api.mapbox.com/directions/v5/mapbox/cycling/{waypoints}?geometries=polyline&access_token={token}",
            geocoder_template:
                "https://api.tiles.mapbox.com/v4/geocode/mapbox.places/{query}.json?proximity={proximity}&access_token={token}",
            key:
                "pk.eyJ1IjoibGxpdSIsImEiOiI4dW5uVkVJIn0.jhfpLn2Esk_6ZSG62yXYOg",
            profile: "cycling",
            path_style: {
                stroke: "#4264fb",
                "stroke-opacity": 0.78,
                "stroke-width": 5
            }
        },
        openrouteservice: {
            api_template:
                "https://api.openrouteservice.org/corsdirections?&coordinates={coordinates}&instructions=false&preference={preference}&profile={profile}&api_key={token}",
            key: "58d904a497c67e00015b45fcf243eacf4b25434c6e28d7fd61c9d309",
            preference: "",
            profile: "cycling-regular",
            path_style: {
                stroke: "#cf5f5f",
                "stroke-opacity": 0.78,
                "stroke-width": 5
            }
        },
        google: {
            api_template:
                "https://luliu.me/gmapswrapper?origin={origin}&destination={destination}&mode=bicycling&key={token}",
            key: "AIzaSyDc2gadWI4nunYb0i5Mx_P3AH_yDTiMzAY",
            profile: "bicycling",
            path_style: {
                stroke: "#0f9d58",
                "stroke-opacity": 0.78,
                "stroke-width": 5
            }
        }
    },

    directions: {
        routes: {
            type: "FeatureCollection",
            features: []
        }
    },

    initialize: function(options) {
        L.setOptions(this, options);
        this._waypoints = [];
    },

    getOrigin: function() {
        return this.origin;
    },

    getDestination: function() {
        return this.destination;
    },

    setOrigin: function(origin) {
        origin = this._normalizeWaypoint(origin);

        this.origin = origin;
        this.fire("origin", {
            origin: origin
        });

        if (!origin) {
            this._unload();
        }

        return this;
    },

    setDestination: function(destination) {
        destination = this._normalizeWaypoint(destination);

        this.destination = destination;
        this.fire("destination", {
            destination: destination
        });

        if (!destination) {
            this._unload();
        }

        return this;
    },

    getWaypoints: function() {
        return this._waypoints;
    },

    setWaypoints: function(waypoints) {
        this._waypoints = waypoints.map(this._normalizeWaypoint);
        return this;
    },

    addWaypoint: function(index, waypoint) {
        this._waypoints.splice(index, 0, this._normalizeWaypoint(waypoint));
        return this;
    },

    removeWaypoint: function(index) {
        this._waypoints.splice(index, 1);
        return this;
    },

    setWaypoint: function(index, waypoint) {
        this._waypoints[index] = this._normalizeWaypoint(waypoint);
        return this;
    },

    selectRoute: function(route) {
        this.fire("selectRoute", {
            route: route
        });
    },

    selectTrack: function(track) {
        this.fire("selectTrack", {
            track: track.GeoJSON
        });
        this._showToggledRoutes();
    },

    highlightRoute: function(route) {
        this.fire("highlightRoute", {
            route: route
        });
    },

    enableProvider: function(provider, is_enabled) {
        if (
            this.options.available_providers.indexOf(provider) > -1 &&
            this.options.enabled_providers.indexOf(provider) === -1 &&
            is_enabled
        ) {
            this.options.enabled_providers.push(provider);
        }
        if (
            this.options.available_providers.indexOf(provider) > -1 &&
            this.options.enabled_providers.indexOf(provider) > -1 &&
            !is_enabled
        ) {
            var i = this.options.enabled_providers.indexOf(provider);
            if (i > -1) {
                this.options.enabled_providers.splice(i, 1);
            }
        }
        this.directions.routes.features = [];
        this.options.enabled_providers.forEach(function(p) {
            this.directions.routes.features.push(
                this.directions[p].routes[0].geometry
            );
        }, this);
        this.fire("load", this.directions);
    },

    queryURL: function(opts) {
        var provider = opts.provider.toLowerCase();
        var template = this.options[provider].api_template;
        var points = "";
        if (provider === "mapbox") {
            points = [this.getOrigin(), this.getDestination()]
                .map(function(p) {
                    return p.geometry.coordinates;
                })
                .join(";");
            return L.Util.template(template, {
                token: this.options.mapbox.key,
                waypoints: points
            });
        }
        if (provider === "openrouteservice") {
            points = [this.getOrigin(), this.getDestination()]
                .map(function(p) {
                    return p.geometry.coordinates;
                })
                .join("%7C");
            if (opts.hasOwnProperty("preference")) {
                this.options.openrouteservice.preference = opts.preference;
            }
            if (opts.hasOwnProperty("profile")) {
                this.options.openrouteservice.profile = opts.profile;
            }
            return L.Util.template(template, {
                token: this.options.openrouteservice.key,
                coordinates: points,
                preference: this.options.openrouteservice.preference,
                profile: this.options.openrouteservice.profile
            });
        }
        if (provider === "google") {
            var origin_coords = this.getOrigin().geometry.coordinates.slice();
            var dest_coords = this.getDestination().geometry.coordinates.slice();
            return L.Util.template(template, {
                token: this.options.google.key,
                origin: origin_coords.reverse().join(","),
                destination: dest_coords.reverse().join(",")
            });
        }

        return null;
    },

    _showToggledRoutes: function() {
        this.options.available_providers.forEach(function(p) {
            if (this.directions.hasOwnProperty(p)) {
                this.directions[p] = undefined;
            }
        }, this);
        this.options.enabled_providers = [];
        this.directions.routes = {
            type: "FeatureCollection",
            features: []
        };
        this.fire("checkors");
        this.fire("checkgoogle");
        this.fire("checkmapbox");
    },

    _constructRoutingResult: function(resp, provider) {
        this.directions[provider] = resp;
        this.directions[provider].enabled = true;
        if (provider === "mapbox") {
            this.directions[provider].origin = resp.waypoints[0];
            this.directions[provider].destination = resp.waypoints.slice(-1)[0];
            this.directions[provider].waypoints.forEach(function(wp) {
                wp.geometry = {
                    type: "Point",
                    coordinates: wp.location
                };
                wp.properties = {
                    name: wp.name
                };
            });
            this.directions[provider].waypoints = resp.waypoints.slice(1, -1);
        }
        if (provider === "openrouteservice") {
            this.directions[provider].origin = resp.info.query.coordinates[0];
            this.directions[provider].destination =
                resp.info.query.coordinates[1];
            this.directions[provider].waypoints = [];
        }
        if (provider === "mapbox" || provider === "openrouteservice") {
            this.directions[provider].routes.forEach(function(route) {
                route.geometry = {
                    type: "Feature",
                    properties: this.options[provider].path_style,
                    geometry: {
                        type: "LineString",
                        coordinates: polyline
                            .decode(route.geometry)
                            .map(function(c) {
                                return c.reverse();
                            })
                    }
                };
            }, this);
        }
        if (provider === "google") {
            this.directions[provider].origin = this.origin;
            this.directions[provider].destination = this.destination;
            this.directions[provider].waypoints = [];
            this.directions[provider].routes.forEach(function(route) {
                route.geometry = {
                    type: "Feature",
                    properties: this.options[provider].path_style,
                    geometry: {
                        type: "LineString",
                        coordinates: polyline
                            .decode(route.overview_polyline.points)
                            .map(function(c) {
                                return c.reverse();
                            })
                    }
                };
            }, this);
        }
    },

    queryable: function() {
        return this.getOrigin() && this.getDestination();
    },

    query: function(opts) {
        if (!opts) return this;
        if (!this.queryable()) return this;

        var q = d3.queue(3);

        var pts = [this.origin, this.destination];
        pts.forEach(function(p) {
            if (
                !p.geometry.coordinates ||
                !p.properties.hasOwnProperty("name")
            ) {
                q.defer(L.bind(this._geocode, this), p, opts.proximity);
            }
        }, this);

        q.defer(L.bind(this._getRoute, this), opts).await(
            L.bind(function(err) {
                if (err) {
                    return this.fire("error", {
                        error: err.message
                    });
                }
            }, this)
        );

        return this;
    },

    _getRoute: function(opts) {
        this._routeReq = getRequest(
            this.queryURL(opts),
            L.bind(function(err, resp) {
                this._routeReq = null;

                if (err) {
                    return this.fire("error", {
                        error: err.message
                    });
                }

                this._constructRoutingResult(resp, opts.provider);
                if (!this.origin.properties.name) {
                    this.origin = this.directions.origin;
                } else {
                    this.directions.origin = this.origin;
                }

                if (!this.destination.properties.name) {
                    this.destination = this.directions.destination;
                } else {
                    this.directions.destination = this.destination;
                }
                this.enableProvider(opts.provider, true);
            }, this),
            this
        );
    },

    _geocode: function(point, proximity, cb) {
        this._geocodeReq = getRequest(
            L.Util.template(this.options.mapbox.geocoder_template, {
                query: point.properties.query,
                token: this.options.mapbox.key || L.mapbox.accessToken,
                proximity: proximity
                    ? [proximity.lng, proximity.lat].join(",")
                    : ""
            }),
            L.bind(function(err, resp) {
                this._geocodeReq = null;
                if (err) {
                    return cb(err);
                }

                if (!resp.features || !resp.features.length) {
                    return cb(
                        new Error(
                            "No results found for query " +
                                point.properties.query
                        )
                    );
                }

                point.geometry.coordinates = resp.features[0].center;
                point.properties.name = resp.features[0].place_name;

                return cb();
            }, this)
        );
    },

    _unload: function() {
        this._waypoints = [];
        delete this.directions;
        this.fire("unload");
    },

    _normalizeWaypoint: function(waypoint) {
        if (!waypoint || waypoint.type === "Feature") {
            return waypoint;
        }

        var coordinates,
            properties = {};

        if (waypoint instanceof L.LatLng) {
            waypoint = waypoint.wrap();
            coordinates = properties.query = [waypoint.lng, waypoint.lat];
        } else if (typeof waypoint === "string") {
            properties.query = waypoint;
        }

        return {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: coordinates
            },
            properties: properties
        };
    }
});

module.exports = function(options) {
    return new Directions(options);
};
