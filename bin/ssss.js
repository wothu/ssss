/* 
 * ssss.js
 * SSSS SIMPLE STATIC SERVER
 */

var http     = require('http'),
    fs       = require('fs'),
    path     = require('path'),
    url      = require('url'),
    mime     = require('mime'),
    isBinary = require('isbinaryfile');

var DEFAULT_PORT = 8080,
    DEFAULT_HOST = '127.0.0.1';

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
    for (var i = 2; i < args.length; i++) {
        parse(args[i]);
    }
    return result;
};

var detectIndexSync = function(){
    var indexNames = ['index.html', 'index.htm'],
        i;
    for (i = 0; i< indexNames.length; i++) {
        if (fs.existsSync(indexNames[i])) {
            return indexNames[i]
        }
    }
    return '';
};

var getRouteSync = function(routeFile){
    var route = {};
    if (routeFile) {
        try {
            route = JSON.parse(fs.readFileSync(routeFile));
        }
        catch (e) {
            console.log('Route file does not exist, or format is incorrect.');
        }
    }
    return route;
};

var readFile = function(path, callback){
    fs.readFile(path, function(err, data){
        var type;
        if (err) {
            callback(1);
        }
        else {
            fs.lstat(path, function(err, stat){
                if (err) {
                    callback(1);
                }
                else {
                    if (isBinary(data, stat.size)) {
                        type = 'binary';
                    }
                    else {
                        type = 'text';
                    }
                    callback(null, data, type);
                }
            })
        }
    });
};

var runServer = function(config){
    var resolvePath = function(path){
        if (config.route[path]) {
            return config.route[path];
        }
        if (path === '/') {
            return config.index ? './' + config.index : '';
        }
        if (path.charAt(0) === '/') {
            return '.' + path;
        }
        return path;
    };

    var server = http.createServer(function(req, res){
        var pathname = url.parse(req.url, true).pathname;
        console.log('Path: ' + pathname);
        pathname = resolvePath(decodeURIComponent(pathname));
        pathname = path.normalize(pathname);
        if (pathname.indexOf('..') >= 0) {
            res.writeHead(403);
            res.end('The resource you required is not accessible.');
        }
        readFile(pathname, function(err, data, type){
            if (!err) {
                res.writeHead(200, {
                    'Content-Type' : mime.lookup(pathname)
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
                res.end('The resource you required doesn\'t exist.');
            }
        });
    });

    server.listen(config.port, config.host);
    console.log('Server started at ' + config.host + ':' + config.port);

    if (process.send) { // for test. child process will have send method for process.
        process.send('Server started'); 
    }

    server.on('error', function(e){
        switch (e.code) {
            case 'EADDRINUSE':
                console.log('Exception: EADDRINUSE. Try another port?');
                break;
            case 'EADDRNOTAVAIL':
                console.log('Exception: EADDRNOTAVAIL. Try another hostname?');
                break;
            default:
                console.log('Exception: ' + e.code);
        }
        process.exit();
    });

};


if (require.main === module) { // for unit test
    var config = {
        port : DEFAULT_PORT,
        host : DEFAULT_HOST
    };

    var customConfig = parseArgs(process.argv);
    if (customConfig.port) {
        customConfig.port = parseInt(customConfig.port, 10);
        if (customConfig.port > 1023 && customConfig.port < 65536) {
            config.port = customConfig.port;
        }
        else {
            console.log('Port value is illegal. Trying using default.');
        }
    }
    if (customConfig.host) {
        config.host = customConfig.host;
    }
    config.route = getRouteSync(customConfig.routeFile);
    config.index = detectIndexSync();
    runServer(config);
}


