var pushReceive = require('../');
var http = require('http');

var server = http.createServer(function (req, res) {
    if (req.url.split('/')[1] === 'hook') {
        req.pipe(pushReceive('http://localhost:8051')).pipe(res);
    }
    else res.end('beep boop\n');
});
server.listen(8050);
