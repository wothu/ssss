var path    = require('path'),
    cp      = require('child_process'),
    phantom = require('phantomjs'),
    http    = require('http'),
    fs      = require('fs'),
    should  = require('should');

var host = 'localhost',
    port = 8888;

var appPath      = path.resolve('../bin/ssss.js'),
    testPath     = path.resolve('./test-suites/'),
    suitePaths   = fs.readdirSync(testPath),
    phantomPath  = phantom.path,
    phantomAgent = path.resolve('./netsniff.js');

var startServer = function(folder, address, callback){
    var serverProcess = cp.fork(appPath, [address], {cwd: folder});
    serverProcess.on('message', function(msg){
        if (msg === 'Server started') {
            callback();
        }
    });
    return serverProcess;
};

var getNetworkStats = function(folder, address, callback){
    var getEntriesByUrl = function(har){
        var entries = har.log.entries,
            entriesByUrl = {},
            i,
            url;
        for (i = 0; i < entries.length; i++) {
            url = entries[i].request.url;
            if (entriesByUrl[url]) {
                entriesByUrl[url].push(entries[i]);
            }
            else {
                entriesByUrl[url] = [entries[i]];
            }
        }
        return entriesByUrl;
    };
    var server = startServer(folder, address, function(){
        cp.execFile(phantomPath, [phantomAgent, 'http://' + address], function(err, stdout, stderr){
            var har,
                entriesByUrl;
            server.kill();
            if (err) {
                throw 'Error in getting network statistic.';
            }
            try {
                har = JSON.parse(stdout);
                entriesByUrl = getEntriesByUrl(har);
            }
            catch (e) {
                throw 'Error in parse data';
            }
            callback(har, entriesByUrl);
        });
    });
};

var load = function(options, data, callback){
    if (typeof data === 'function') {
        callback = data;
        data = '';
    }
    var response = {data: ''};
    var req = http.request(options, function(res){
        response.status = res.statusCode;
        response.headers = res.headers;
        res.on('data', function(chunk){
            response.data += chunk;
        });
        res.on('end', function(){
            callback(response);
        });
    });
    req.on('error', function(e){
        throw 'request resource error: ' + e;
    });

    req.write(data);
    req.end();
};


describe('run server @ localhost:8888', function(){
    this.timeout(60000);
    var server;
    var address = function(path){
        return {
            hostname: 'localhost',
            port: 8888,
            path: path
        }
    };
    before(function(done){
        server = startServer(path.join(testPath, '1'), 'localhost:8888', function(){
            done();
        });
    });
    describe('use http request to access resources', function(){
        it('should return default index.html when the file name is omitted', function(done){
            load(address(''), function(res){
                res.status.should.be.exactly(200);
                res.data.length.should.be.above(0);
                res.['content-type'].should.be.exactly('text/html');
                done();
            });
        });
        it('should return correct file when the filename is given', function(done){
            load(address('a.css'), function(res){})
        });
    });
    after(function(){
        server.kill();
    });
});








describe.skip('run server @ localhost:8888', function(){
    this.timeout(60000);

    var har, traffic;
    before(function(done){
        getNetworkStats(path.join(testPath, '1'), 'localhost:8888', function(data, entriesByUrl){
            har = data;
            traffic = entriesByUrl;
            done();
        });
    });

    describe('load localhost:8888 in Phantom', function(){
        it('should return default index.html when the file name is omitted', function(){
            traffic['http://localhost:8888/'][0].response.status.should.be.exactly(200);
            traffic['http://localhost:8888/'][0].response.bodySize.should.be.above(0);
        });
        it('should return correct file when the filename is given', function(){
            traffic['http://localhost:8888/a.css'][0].response.status.should.be.exactly(200);
            traffic['http://localhost:8888/a.css'][0].response.bodySize.should.be.above(0);
        });
        it('should return correct file using relative path', function(){
            traffic['http://localhost:8888/css/b.css'][0].response.status.should.be.exactly(200);
            traffic['http://localhost:8888/css/b.css'][0].response.bodySize.should.be.above(0);
        });
        it('should return correct file using relative path with ./', function(){
            traffic['http://localhost:8888/css/c.css'][0].response.status.should.be.exactly(200);
            traffic['http://localhost:8888/css/c.css'][0].response.bodySize.should.be.above(0);
        });
        it('should return correct file using absolute path', function(){
            traffic['http://localhost:8888/css/d.css'][0].response.status.should.be.exactly(200);
            traffic['http://localhost:8888/css/d.css'][0].response.bodySize.should.be.above(0);
        });
        it('should return correct file using absolute path with domain', function(){
            traffic['http://localhost:8888/css/e.css'][0].response.status.should.be.exactly(200);
            traffic['http://localhost:8888/css/e.css'][0].response.bodySize.should.be.above(0);
        });
        it('should return correct file using relative path with ../', function(){
            traffic['http://localhost:8888/f.css'][0].response.status.should.be.exactly(200);
            traffic['http://localhost:8888/f.css'][0].response.bodySize.should.be.above(0);
        });

        // ?????
        // don't know how to test...
        // it('should return 403 using relative path with ../ and above the root dir', function(){
        //     traffic['http://localhost:8888/f.css'][0].response.status.should.be.exactly(200);
        //     traffic['http"//localhost:8888/f.css'][0].response.bodySize.should.be.above(0);
        // });
    });
});

