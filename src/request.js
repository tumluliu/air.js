'use strict';

var d3post = require('./d3_post');

module.exports = function(url, reqData, callback) {
    return d3post(url, reqData, function (err, resp) {
        if (err && err.type === 'abort') {
            return;
        }

        if (err && !err.responseText) {
            return callback(err);
        }

        resp = resp || err;

        try {
            resp = JSON.parse(resp.response);
        } catch (e) {
            return callback(new Error(resp));
        }

        if (resp.error) {
            return callback(new Error(resp.error));
        }

        return callback(null, resp.result);
    });
};
