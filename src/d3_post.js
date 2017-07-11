'use strict';

var d3xhr = require('d3-xhr'),
    Spinner = require('spin.js');


function d3post(url, reqData, callback, cors) {
    var sent = false;

    if (typeof cors === 'undefined') {
        var m = url.match(/^\s*https?:\/\/[^\/]*/);
        cors = m && (m[0] !== location.protocol + '//' + location.hostname +
                (location.port ? ':' + location.port : ''));
    }

    var respData;
    var findPathButton = document.getElementById('find-mmpaths');
    //var spinner = new Spinner({color:'#fff', lines: 12});

    d3xhr.xhr(url)
        .header("Content-Type", "application/json")
        .on("beforesend", function(request) { 
            findPathButton.value = "Searching paths...";
            findPathButton.disabled = true;
            //findPathButton.appendChild(spinner.spin().el);
            //spinner.spin(findPathButton);
        })
        .post(
                JSON.stringify(reqData),
                function(err, rawData){
                    findPathButton.value = "Find multimodal paths";
                    findPathButton.disabled = false;
                    //spinner.stop();
                    respData = rawData;
                    callback.call(err, respData, null);
                }
             );

    function isSuccessful(status) {
        return status >= 200 && status < 300 || status === 304;
    }

    return respData;
}

if (typeof module !== 'undefined') module.exports = d3post;
