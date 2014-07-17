var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var redis = require("redis"),
    client = redis.createClient();
var routes = require('./routes');

// use server 1
client.select(1);

var app = express();
var server = http.Server(app);
server.listen(3000);
var io = require('socket.io')(server);

var users = {};
var sockets = {};
var queueSetName = 'queue_users';
client.flushdb();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

app.get('/', routes.index);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.render('error', {
        message: err.message,
        error: {}
    });
});

io.on('connection', function(socket) {
    var partnerSocket = null;
    function getPartner() {
        var partnerId = users[socket.id];
        if (partnerId !== undefined) {
            var partnerSocket = sockets[partnerId];
            if (partnerSocket !== undefined) return partnerSocket;
        }

        return null;
    }

    function noPartner() {
        socket.emit('no_partner');
        partnerSocket = null;
    }

    sockets[socket.id] = socket;
    socket.on('ready_to_find', function() {
        if (partnerSocket = getPartner()) {
            partnerSocket.emit('partner_left');
        }
        console.log('Client ready: ' + socket.id);
        client.sadd(queueSetName, socket.id);
    });

    socket.on('send_msg', function(data) {
        if (partnerSocket = getPartner()) {
        } else {
            noPartner();
        }
    });

    socket.on('typing', function(data) {
        if (partnerSocket = getPartner()) {
            partnerSocket.emit('partner_typing', data);
        } else {
            noPartner();
        }
    });

    socket.on('not_typing', function(data) {
        if (partnerSocket = getPartner()) {
            partnerSocket.emit('partner_not_typing', data);
        } else {
            noPartner();
        }
    });

    socket.on('disconnect', function() {
        console.log('Client disconnected: ' + socket.id);
        if (partnerSocket = getPartner()) {
            partnerSocket.emit('partner_left');
            delete users[partnerSocket.id];
        }
        client.srem(queueSetName, socket.id);
        if (sockets[socket.id] !== undefined) delete sockets[socket.id];
        delete users[socket.id];
    });
});

// Ghép đôi mỗi 1s
setInterval(function() {
    client.scard(queueSetName, function(err, count) {
        if (err) throw err;

        if (count > 1) {
            client.spop(queueSetName, function(err1, client1){
                if (err1) throw err1;

                client.spop(queueSetName, function(err2, client2){
                    if(sockets[client1] !== undefined && sockets[client2] !== undefined) {
                        console.log('Matched: ' + client1 + ' vs ' + client2);
                        users[client1] = client2;
                        users[client2] = client1;
                        sockets[client1].emit('ready');
                        sockets[client2].emit('ready');
                    }
                });
            });
        }
    });
}, 1000);