var pushReceive = require('../')('http://localhost:8051');
var http = require('http');

var server = http.createServer(function (req, res) {
    if (req.url.split('/')[1] === 'hook') {
        pushReceive(req, res);
    }
    else res.end('beep boop\n');
});
server.listen(8050);
