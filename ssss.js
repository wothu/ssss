/* 
 * ssss.js
 * SSSS SIMPLE STATIC SERVER
 */

var http     = require('http'),
    fs       = require('fs'),
    url      = require('url'),
    mime     = require('mime'),
    isBinary = require('isbinaryfile');


var parseArgs = function(args){
    var result = {};
    var parse = function(arg){
        var match,
            port,
            host,
            domainReg = /^((\d+)|([^:]+)|(([^:]+):(\d+)))$/;
        if (!arg) {
            return;
        }
        if (arg.substring(arg.length - 5) === '.json') {
            result.routeFile = arg;
            return;
        }
        if (match = domainReg.exec(arg)) {
            port = match[2] || match[6];
            host = match[3] || match[5];
            if (port) {
                result.port = port;
            }
            if (host) {
                result.host = host;
            }
        }
    };
    for (var i = 0; i < args.length; i++) {
        parse(args[i]);
    }
    return result;
};


var readFile = function(path, callback){
    fs.readFile(path, function(err, data){
        var type;
        if (err) {
            callback(err);
        }
        else {
            fs.lstat(path, function(err, stat){
                if (err) {
                    callback(err);
                }
                else {
                    if (isBinary(data, stat.size)) {
                        type = 'binary';
                    }
                    else {
                        type = 'text';
                    }
                    callback(err, data, type);
                }
            })
        }
    });
};

var resolvePath = function(path){
    if (config.route[path]) {
        return config.route[path];
    }
    if (path === '/') {
        return config.index;
    }
    if (path.charAt(0) === '/') {
        return '.' + path;
    }
    return path;
};

var getRoute = function(routeFile, callback){
    if (!routeFile) {
        callback({});
    }
    else {
        fs.readFile(routeFile, function(err, data){
            if (err) {
                callback({});
            }
            else {
                try {
                    data = JSON.parse(data);
                    callback(data);
                }
                catch(e){
                    callback({});
                }
            }
        });
    }

};

var config = {
    port  : 8888,
    host  : 'localhost',
    index : './index.html'
};

var customConfig = parseArgs(process.argv);
if (customConfig.port) {
    config.port = customConfig.port;
}
if (customConfig.host) {
    config.host = customConfig.host;
}

getRoute(customConfig.routeFile, function(route){
    config.route = route;
    http.createServer(function(req, res){
        var path = resolvePath(decodeURIComponent(url.parse(req.url, true).pathname));
        console.log('Request for path: ' + path);
        readFile(path, function(err, data, type){
            if (!err) {
                res.writeHead(200, {
                    'Content-Type' : mime.lookup(path)
                });
                if (type === 'binary') {
                    res.end(data, 'binary');
                }
                else {
                    res.end(data);
                }

            }
            else {
                res.writeHead(404);
                res.end();
            }
        })
    }).listen(config.port, config.host);
});

