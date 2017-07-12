'use strict';

var d3 = require('../lib/d3');

module.exports = function(container, directions) {
    var control = {},
        map;
    var origChange = false,
        destChange = false;

    control.addTo = function(_) {
        map = _;
        return control;
    };

    container = d3.select(L.DomUtil.get(container))
        .classed('mapbox-directions-inputs', true);

    var form = container.append('form')
        .on('keypress', function() {
            if (d3.event.keyCode === 13) {
                d3.event.preventDefault();

                if (origChange)
                    directions.setOrigin(originInput.property('value'));
                if (destChange)
                    directions.setDestination(destinationInput.property('value'));

                if (directions.queryable())
                    directions.query({
                        proximity: map.getCenter()
                    });

                origChange = false;
                destChange = false;
            }
        });

    var origin = form.append('div')
        .attr('class', 'mapbox-directions-origin');

    origin.append('label')
        .attr('class', 'mapbox-form-label')
        .on('click', function() {
            if (directions.getOrigin() instanceof L.LatLng) {
                map.panTo(directions.getOrigin());
            }
        })
        .append('span')
        .attr('class', 'mapbox-directions-icon mapbox-depart-icon');

    var originInput = origin.append('input')
        .attr('type', 'text')
        .attr('required', 'required')
        .attr('id', 'air-origin-input')
        .attr('placeholder', 'Start')
        .on('input', function() {
            if (!origChange) origChange = true;
        });

    origin.append('div')
        .attr('class', 'mapbox-directions-icon mapbox-close-icon')
        .attr('title', 'Clear value')
        .on('click', function() {
            directions.setOrigin(undefined);
        });

    form.append('span')
        .attr('class', 'mapbox-directions-icon mapbox-reverse-icon mapbox-directions-reverse-input')
        .attr('title', 'Reverse origin & destination')
        .on('click', function() {
            directions.reverse().query();
        });

    var destination = form.append('div')
        .attr('class', 'mapbox-directions-destination');

    destination.append('label')
        .attr('class', 'mapbox-form-label')
        .on('click', function() {
            if (directions.getDestination() instanceof L.LatLng) {
                map.panTo(directions.getDestination());
            }
        })
        .append('span')
        .attr('class', 'mapbox-directions-icon mapbox-arrive-icon');

    var destinationInput = destination.append('input')
        .attr('type', 'text')
        .attr('required', 'required')
        .attr('id', 'air-destination-input')
        .attr('placeholder', 'End')
        .on('input', function() {
            if (!destChange) destChange = true;
        });

    destination.append('div')
        .attr('class', 'mapbox-directions-icon mapbox-close-icon')
        .attr('title', 'Clear value')
        .on('click', function() {
            directions.setDestination(undefined);
        });

    var mapboxDirections = form.append('div')
        .attr('id', 'mapbox-directions')
        .attr('class', 'mapbox-directions-profile');

    mapboxDirections.append('h3')
        .attr('value', 'MAPBOX')
        .attr('style', 'margin: 5px 0px 0px 5px')
        .text('MAPBOX DIRECTIONS');

    mapboxDirections.append('input')
        .attr('type', 'checkbox')
        .attr('name', 'enabled')
        .attr('id', 'show-mapbox-cycling')
        .property('checked', false)
        .on('change', function(d) {
           if (this.checked) {
               directions.query({'provider': 'mapbox'});
           }
        });

    mapboxDirections.append('label')
        .attr('for', 'show-mapbox-cycling')
        .text('Show cycling path');

    var car_profile = form.append('div')
        .attr('id', 'air-car-profiles')
        .attr('class', 'mapbox-directions-profile');

    car_profile.append('h3')
        .attr('value', 'DRIVING')
        .attr('style', 'margin: 5px 0px 0px 5px')
        .text('DRIVING OPTIONS');

    car_profile.append('input')
        .attr('type', 'checkbox')
        .attr('name', 'profile')
        .attr('id', 'air-profile-cycling')
        .property('checked', true)
        .on('change', function(d) {
            if (this.checked) {
                carParking.property('disabled', false);
                carParking.property('checked', true);
                isDrivingDistLimited.property('disabled', false);
                isDrivingDistLimited.property('checked', true);
                distanceLimit.property('disabled', false);
            } else {
                carParking.property('disabled', true);
                carParking.property('checked', false);
                isDrivingDistLimited.property('disabled', true);
                isDrivingDistLimited.property('checked', false);
                distanceLimit.property('disabled', true);
            }
            directions.setProfile('has_private_car', this.checked);
        });

    car_profile.append('label')
        .attr('for', 'air-profile-private-car')
        .text('Private car available on departure');

    var carParking = car_profile.append('input')
        .attr('type', 'checkbox')
        .attr('name', 'profile')
        .attr('id', 'air-profile-car-parking')
        .property('checked', true)
        .property('disabled', false)
        .on('change', function(d) {
            directions.setProfile('need_parking', this.checked);
        });

    car_profile.append('label')
        .attr('for', 'air-profile-car-parking')
        .text('Need parking for the car');

    var isDrivingDistLimited = car_profile.append('input')
        .attr('type', 'checkbox')
        .attr('name', 'driving-profile')
        .attr('id', 'driving-distance-limit')
        .property('checked', true)
        .on('change', function(d) {
            if (this.checked) {
                distanceLimit.property('disabled', false);
            } else
                distanceLimit.property('disabled', true);
        });

    car_profile.append('label')
        .attr('for', 'driving-distance-limit')
        .attr('style', 'width: 150px')
        .text('Distance limit (km): ');

    var distanceLimit = car_profile.append('input')
        .attr('type', 'number')
        .attr('min', '10')
        .attr('max', '2617')
        .property('value', '500')
        .attr('id', 'air-driving-distance-limit')
        .attr('style', 'width: 80px;padding-left: 10px;padding-top: 2px;padding-bottom: 2px;background-color: white;border: 1px solid rgba(0,0,0,0.1);height: 30px;vertical-align: middle;');

    var public_profile = form.append('div')
        .attr('id', 'air-public-profiles')
        .attr('class', 'mapbox-directions-profile');

    public_profile.append('h3')
        .attr('value', 'PUBLIC TRANSIT')
        .attr('style', 'margin: 5px 0px 0px 5px')
        .text('PUBLIC TRANSIT PREFERENCES');

    var public_profiles = public_profile.selectAll('span')
        .data([
            ['air.suburban', 'suburban', 'Suburban'],
            ['air.underground', 'underground', 'Underground'],
            ['air.tram', 'tram', 'Tram']
        ])
        .enter()
        .append('span');

    public_profiles.append('input')
        .attr('type', 'checkbox')
        .attr('name', 'profile')
        .attr('id', function(d) {
            return 'air-profile-' + d[1];
        })
        .property('checked', function(d, i) {
            return i === 1;
        })
        .on('change', function(d) {
            if (this.checked) {
                publicTransitSelection.push(d[1]);
            } else {
                var index = publicTransitSelection.indexOf(d[1]);
                if (index > -1) {
                    publicTransitSelection.splice(index, 1);
                }
            }
        });

    public_profiles.append('label')
        .attr('for', function(d) {
            return 'air-profile-' + d[1];
        })
        .text(function(d) {
            return d[2];
        });

    public_profile.append('input')
        .attr('type', 'button')
        .attr('value', 'Find multimodal paths')
        .attr('name', 'find paths')
        .attr('id', 'find-mmpaths')
        .attr('class', 'button')
        .on('click', function(d) {
            if (isDrivingDistLimited.property('checked') === true) {
                directions.setProfile('driving_distance_limit', distanceLimit.property('value'));
            }
            directions.setProfile('available_public_modes', publicTransitSelection);
            directions.query();
        });

    function format(waypoint) {
        if (!waypoint) {
            return '';
        } else if (waypoint.properties.name) {
            return waypoint.properties.name;
        } else if (waypoint.geometry.coordinates) {
            var precision = Math.max(0, Math.ceil(Math.log(map.getZoom()) / Math.LN2));
            return waypoint.geometry.coordinates[0].toFixed(precision) + ', ' +
                waypoint.geometry.coordinates[1].toFixed(precision);
        } else {
            return waypoint.properties.query || '';
        }
    }

    directions
        .on('origin', function(e) {
            originInput.property('value', format(e.origin));
        })
        .on('destination', function(e) {
            destinationInput.property('value', format(e.destination));
        })
        .on('profile', function(e) {
            profiles.selectAll('input')
                .property('checked', function(d) {
                    return d[0] === e.profile;
                });
        })
        .on('load', function(e) {
            originInput.property('value', format(e.origin));
            destinationInput.property('value', format(e.destination));
        });

    return control;
};
