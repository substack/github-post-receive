var test = require('tap').test;
var pushReceive = require('../');
var http = require('http');
var pushover = require('pushover');
var hyperquest = require('hyperquest');

var payload = require('./example.json');
var tmpdir = '/tmp/github-push-receive-repos/' + Math.random();

test('', function (t) {
    var repos = pushover(tmpdir);
    repos.on('push', function (push) {
        console.log(
            'pushed to '
            + push.repo + '/' + push.commit
            + ' (' + push.branch + ')'
        );
        push.accept();
    });

    var server = http.createServer(function (req, res) {
        repos.handle(req, res);
    });
    server.listen(0, ready);

    var web = http.createServer(function (req, res) {
        if (req.url.split('/')[1] === 'hook') {
            req.pipe(pushReceive('http://localhost:' + port.git)).pipe(res);
        }
        else res.end('beep boop\n');
    });
    web.listen(0, ready);
    
    var pending = 2;
    var port = {};
    function ready () {
        if (--pending !== 0) return;
        port.web = web.address().port;
        port.git = server.address().port;
        
        var hq = hyperquest.post('http://localhost:' + port.web + '/hook');
        hq.end('payload=' + encodeURIComponent(JSON.stringify(payload)));
    }
});
