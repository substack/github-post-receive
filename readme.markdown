# github-push-receive

Issue a `git push` in response to a
[github post-receive hook payload](https://help.github.com/articles/post-receive-hooks).

# example

First whip up an http server to listen for the github payloads:

``` js
var pushReceive = require('github-push-receive');
var http = require('http');

var server = http.createServer(function (req, res) {
    if (req.url.split('/')[1] === 'hook') {
        req.pipe(pushReceive('http://localhost:8051')).pipe(res);
    }
    else res.end('beep boop\n');
});
server.listen(8050);
```

The github payloads received by this server will be forwarded to the git server
running on `http://localhost:8051`. You can use whichever protocol you like here
since `github-push-receive` just shells out to `git`.

Just configure your github repo in the admin -> hooks part of the UI to set your
server uri as a webhook endpoint.

Here's an http-based git server based on
[pushover](https://github.com/substack/pushover) you could use as a git target:

``` js
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
```

When you push code to the github repo, the git target will get pushed to.

# methods

# install

# license
