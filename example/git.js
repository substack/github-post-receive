var pushover = require('pushover');
var repos = pushover('/tmp/repos');

repos.on('push', function (push) {
    console.log(
        'pushed to '
        + push.repo + '/' + push.commit
        + ' (' + push.branch + ')'
    );
    push.accept();
});

var http = require('http');
var server = http.createServer(function (req, res) {
    repos.handle(req, res);
});
server.listen(8051);
