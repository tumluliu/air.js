"use strict";

var postRequest = require("./post_request"),
    getRequest = require("./get_request"),
    polyline = require("@mapbox/polyline"),
    d3 = require("../lib/d3"),
    queue = require("queue-async");

var Directions = L.Class.extend({
    includes: [L.Mixin.Events],

    options: {
        provider: "",
        units: "metric",
        mapbox_token:
            "pk.eyJ1IjoibGxpdSIsImEiOiI4dW5uVkVJIn0.jhfpLn2Esk_6ZSG62yXYOg",
        ors_api_key: "58d904a497c67e00015b45fcf243eacf4b25434c6e28d7fd61c9d309",
        google_api_key: "AIzaSyDc2gadWI4nunYb0i5Mx_P3AH_yDTiMzAY"
    },

    statics: {
        MAPBOX_API_TEMPLATE:
            "https://api.mapbox.com/directions/v5/mapbox/cycling/{waypoints}?geometries=polyline&access_token={token}",
        ORS_API_TEMPLATE:
            "https://api.openrouteservice.org/directions?&coordinates={coordinates}&geometry_format=geojson&instructions=false&preference={preference}&profile={profile}&api_key={token}",
        GOOGLE_API_TEMPLATE:
            "https://maps.googleapis.com/maps/api/directions/json?origin={origin}&destination={destination}&mode=bicycling&key={token}",
        GEOCODER_TEMPLATE:
            "https://api.tiles.mapbox.com/v4/geocode/mapbox.places/{query}.json?proximity={proximity}&access_token={token}"
    },

    initialize: function(options) {
        L.setOptions(this, options);
        this._waypoints = [];
        this.profile = {
            available_public_modes: ["underground"],
            can_use_taxi: false,
            has_bicycle: false,
            has_motorcycle: false,
            has_private_car: true,
            need_parking: true,
            objective: "fastest",
            driving_distance_limit: 500,
            source: {
                type: "coordinate",
                value: {
                    x: 0.0,
                    y: 0.0,
                    srid: 4326
                }
            },
            target: {
                type: "coordinate",
                value: {
                    x: 0.0,
                    y: 0.0,
                    srid: 4326
                }
            }
        };
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

        if (origin) {
            this.profile.source.value.x = this.origin.geometry.coordinates[0];
            this.profile.source.value.y = this.origin.geometry.coordinates[1];
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

        if (destination) {
            this.profile.target.value.x = this.destination.geometry.coordinates[0];
            this.profile.target.value.y = this.destination.geometry.coordinates[1];
        }

        return this;
    },

    getProfile: function() {
        //return this.profile || this.options.profile || 'mapbox.driving';
        return this.profile;
    },

    setProfile: function(key, value) {
        this.profile[key] = value;
        //this.fire('profile', {profile: profile});
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

    reverse: function() {
        var o = this.origin,
            d = this.destination;

        this.origin = d;
        this.destination = o;
        this._waypoints.reverse();

        this.fire("origin", {
            origin: this.origin
        }).fire("destination", {
            destination: this.destination
        });

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
    },

    highlightRoute: function(route) {
        this.fire("highlightRoute", {
            route: route
        });
    },

    highlightStep: function(step) {
        this.fire("highlightStep", {
            step: step
        });
    },

    queryURL: function(opts) {
        this.options.provider = opts.provider;
        if (opts.provider.toLowerCase() === "mapbox")
            return this._queryMapboxURL(opts);
        if (opts.provider.toLowerCase() === "openrouteservice")
            return this._queryOpenRouteServiceURL(opts);
        if (opts.provider.toLowerCase() === "google")
            return this._queryGoogleURL(opts);

        return null;
    },

    _queryMapboxURL: function(opts) {
        var template = Directions.MAPBOX_API_TEMPLATE,
            points = [this.origin]
                .concat([this.destination])
                .map(function(point) {
                    return point.geometry.coordinates;
                })
                .join(";");
        return L.Util.template(template, {
            token: this.options.mapbox_token,
            waypoints: points
        });
    },

    _constructMapboxResult: function(resp) {
        this.directions = resp;
        this.directions.origin = resp.waypoints[0];
        this.directions.destination = resp.waypoints.slice(-1)[0];
        this.directions.waypoints.forEach(function(wp) {
            wp.geometry = {
                type: "Point",
                coordinates: wp.location
            };
            wp.properties = {
                name: wp.name
            };
        });
        this.directions.waypoints = resp.waypoints.slice(1, -1);
        this.directions.routes.forEach(function(route) {
            route.geometry = {
                type: "LineString",
                coordinates: polyline.decode(route.geometry).map(function(c) {
                    return c.reverse();
                })
            };
        });

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
    },

    _queryOpenRouteServiceURL: function(opts) {
        var template = Directions.ORS_API_TEMPLATE,
            points = [this.origin]
                .concat([this.destination])
                .map(function(point) {
                    return point.geometry.coordinates;
                })
                .join("|");
        return L.Util.template(template, {
            token: this.options.ors_api_key,
            coordinates: points,
            preference: opts.preference,
            profile: opts.profile
        });
    },

    _queryGoogleURL: function(opts) {
        var template = Directions.GOOGLE_API_TEMPLATE;
        var origin_coords = this.getOrigin().geometry.coordinates.slice();
        var dest_coords = this.getDestination().geometry.coordinates.slice();
        return L.Util.template(template, {
            token: this.options.google_api_key,
            origin: origin_coords.reverse().join(","),
            destination: dest_coords.reverse().join(",")
        });
    },

    queryable: function() {
        return this.getOrigin() && this.getDestination();
    },

    query: function(opts) {
        if (!opts)
            opts = {
                provider: this.options.provider
            };
        opts.preference = "";
        opts.profile = "cycling-regular";
        if (!this.queryable()) return this;

        if (this._query) {
            this._query.abort();
        }

        if (this._requests && this._requests.length)
            this._requests.forEach(function(getRequest) {
                getRequest.abort();
            });
        this._requests = [];

        var q = queue();

        var pts = [this.origin, this.destination].concat(this._waypoints);
        for (var i in pts) {
            if (!pts[i].geometry.coordinates) {
                q.defer(L.bind(this._geocode, this), pts[i], opts.proximity);
            }
        }

        q.await(
            L.bind(function(err) {
                if (err) {
                    return this.fire("error", {
                        error: err.message
                    });
                }

                this._query = getRequest(
                    this.queryURL(opts),
                    L.bind(function(err, resp) {
                        this._query = null;

                        if (err) {
                            return this.fire("error", {
                                error: err.message
                            });
                        }

                        if (this.options.provider === "mapbox")
                            this._constructMapboxResult(resp);
                        if (this.options.provider === "openrouteservice")
                            this._constructOpenRouteServiceResult(resp);
                        if (this.options.provider === "google")
                            this._constructGoogleResult(resp);

                        this.fire("load", this.directions);
                    }, this),
                    this
                );
            }, this)
        );

        return this;
    },

    _geocode: function(waypoint, proximity, cb) {
        if (!this._requests) this._requests = [];
        this._requests.push(
            getRequest(
                L.Util.template(Directions.GEOCODER_TEMPLATE, {
                    query: waypoint.properties.query,
                    token: this.options.accessToken || L.mapbox.accessToken,
                    proximity: proximity
                        ? [proximity.lng, proximity.lat].join(",")
                        : ""
                }),
                L.bind(function(err, resp) {
                    if (err) {
                        return cb(err);
                    }

                    if (!resp.features || !resp.features.length) {
                        return cb(
                            new Error(
                                "No results found for query " +
                                    waypoint.properties.query
                            )
                        );
                    }

                    waypoint.geometry.coordinates = resp.features[0].center;
                    waypoint.properties.name = resp.features[0].place_name;

                    return cb();
                }, this)
            )
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
