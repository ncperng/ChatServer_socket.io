
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  // Neil_20130116
  , socket = require('socket.io')
  , redis = require('redis')
  ;

GLOBAL.USE_REDIS = false;

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

// Neil_20130116: Add a new variable server for socket.io due to Express 3.x. 
//                socket.io only listens to http server.
var server = http.createServer(app);
var io = socket.listen(server);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

// Neil_20130116: using redis for message buffering
if (GLOBAL.USE_REDIS)
	var redisClient = redis.createClient();
else
	var buffers = [];

// Neil_20130116: socket.io callbacks.
io.sockets.on('connection', function(client) {
	console.log('Client connected...');

	client.on('join', function(nickname) {
		client.set('nickname', nickname);
		client.emit('chat', nickname + ', welcome to ChatServer!!');
		client.broadcast.emit('chat', nickname + ' has joined!!');

		if (GLOBAL.USE_REDIS) {
			redisClient.lrange('buffers', 0, -1, function(err, buffers) {
				buffers = buffers.reverse();
				buffers.forEach(function(message) {
					client.emit('chat', message);
				});
			});
		}
		else {
			buffers.forEach(function(message) {
				client.emit('chat', message);
			});
		}
	});

	client.on('chat', function(message) {
		client.emit('chat', 'You sent "' + message + '"');
		client.get('nickname', function(err, nickname) {
			var chat = nickname + ': ' + message;

			if (GLOBAL.USE_REDIS) {
				redisClient.lpush('buffers', chat, function(err, response) {
					redisClient.ltrim('buffers', 0, 10);	// Keep newest 10 chats.
				});
			}
			else {
				buffers.push(chat);
				if (buffers.length > 10) buffers.shift();
			}
			
			if (!err) client.broadcast.emit('chat', chat);
		});
	});
});
