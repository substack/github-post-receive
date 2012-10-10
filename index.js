var run = require('comandante');
var qs = require('querystring');
var path = require('path');
var mkdirp = require('mkdirp');
var responseStream = require('response-stream');
var through = require('through');

module.exports = function (target, opts) {
    if (!opts) opts = {};
    var dir = opts.dir || (
        (process.env.TEMPDIR || '/tmp/')
        + Math.random().toString(16).slice(2)
    );
    
    var data = '';
    function write (buf) { data += buf }
    
    function end () {
        try {
            var params = qs.parse(data);
            if (!params.payload) throw new Error('empty payload');
            var payload = JSON.parse(params.payload);
        }
        catch (err) {
            return this.emit('failure', err);
        }
        this.emit('payload', payload);
    }
    
    var tr = through(write, end);
    var rs = responseStream(tr);
    rs.on('response', function (res) {
        tr.on('failure', function (err) {
            res.statusCode = 500;
            res.end(String(err) + '\n');
        });
        
        tr.on('payload', function (payload) {
            clonePush(dir, target, payload, function (err) {
                if (err) {
                    res.statusCode = 500;
                    res.end(String(err) + '\n');
                }
                else res.end('ok\n')
            });
        });
    });
    
    return rs;
};

function clonePush (basedir, target, payload, cb) {
    var dir = path.join(basedir, Math.random().slice(2));
    var opts = { cwd : dir };
    var c = run('git', [ 'clone', payload.repository.url ], opts);
    var remote = target + '/'
        + payload.url.replace(/^https?:\/\/github\.com\//, '')
    ;
    
    c.on('error', cb);
    
    c.on('exit', function (code) {
        if (code !== 0) return;
        var p = run('git', [ 'push', remote ], opts);
        p.on('error', cb);
        p.on('exit', function (code) {
            if (code === 0) cb();
        });
    });
}
