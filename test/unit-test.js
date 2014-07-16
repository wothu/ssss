var rewire = require('rewire');
var should = require('should');

var ssss = rewire('../bin/ssss.js');

describe('Private Function Test', function(){
    describe('parseArgs', function(){
        var parseArgs = ssss.__get__('parseArgs');
        it('should handle no args', function(){
            parseArgs(['node', 'current_dir']).should.eql({});
        });
        it('should handle only port', function(){
            parseArgs(['node', 'current_dir', '8888']).should.eql({port: 8888});
        });
        it('should handle only hostname', function(){
            parseArgs(['node', 'current_dir', 'localhost']).should.eql({host: 'localhost'});
        });
        it('should handle both hostname and port', function(){
            parseArgs(['node', 'current_dir', 'www.test.com.cn:8888']).should.eql({port: 8888, host: 'www.test.com.cn'});
        });
        it('should handle only route file', function(){
            parseArgs(['node', 'current_dir', '~/conf/test.json']).should.eql({routeFile: '~/conf/test.json'});
        });
        it('should handle both route file and host / port', function(){
            parseArgs(['node', 'current_dir', 'localhost:1234', '~/conf/test.json']).should.eql({port: 1234, host:'localhost', routeFile: '~/conf/test.json'});
        });
        it('should handle a reversed order of route file and host / port', function(){
            parseArgs(['node', 'current_dir', '~/conf/test.json', 'localhost:1234']).should.eql({port: 1234, host:'localhost', routeFile: '~/conf/test.json'});
        });
    });
});
