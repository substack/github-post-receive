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
            rs.emit('failure', err);
        });
        
        tr.on('payload', function (payload) {
            rs.emit('payload', payload);
            
            clonePush(dir, target, payload, function (err) {
                if (err) tr.emit('failure', err);
                else res.end('ok\n')
            });
        });
    });
    
    return rs;
};

function clonePush (basedir, target, payload, cb) {
    var dir = path.join(basedir, Math.random().toString().slice(2));
    mkdirp(dir, function (err) {
        if (err) return cb(err);
        var opts = { cwd : dir };
        
        var source = payload.repository.url.replace(/(?:\.git|)$/, '.git');
        var remote = target + '/'
            + source.replace(/^https?:\/\/github\.com\//, '')
        ;
        
        var c = run('git', [ 'clone', source ], opts);
        c.on('error', cb);
        
        c.on('exit', function (code) {
            if (code !== 0) return;
            opts.cwd += '/'+ path.basename(
                payload.repository.url
                    .replace(/^https?:\/\/github\.com\//, '')
            );
            
            var args = [ 'push', remote, payload.ref.split('/')[2] ];
            var p = run('git', args, opts);
            
            p.on('error', cb);
            p.on('exit', function (code) {
                if (code === 0) cb();
            });
        });
    });
}
