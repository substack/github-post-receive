var run = require('comandante');
var qs = require('querystring');
var path = require('path');
var mkdirp = require('mkdirp');

module.exports = function (target, opts) {
    if (!opts) opts = {};
    var dir = opts.dir || (
        (process.env.TEMPDIR || '/tmp/')
        + Math.random().toString(16).slice(2)
    );
    
    var handle = function (req, res) {
        if (req.method !== 'POST') return;
        
        var data = '';
        req.on('data', function (buf) { data += buf });
        req.on('end', function () {
            try {
                var params = qs.parse(data);
                var payload = JSON.parse(params).payload;
            }
            catch (err) {
                res.statusCode = 500;
                res.end(err);
                return;
            }
            
            clonePush(dir, target, payload, function (err) {
                if (err) handle.emit('error', err)
                else handle.emit('payload', payload)
            });
        });
    };
    
    handle.on('error', function () {});
    
    return handle;
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
