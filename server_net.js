var net = require('net');
var events = require('events');

var channel = new events.EventEmitter();
channel.clients = {};
channel.subscriptions = {};

/**
 * Add a listener for join event that stores a user's client object, allowing
 * the application to send data back to the user
 */
channel.on('join', function(id, client) {
	this.clients[id] = client;
	this.subscriptions[id] = function(senderId, msg) {

		// Ignore data directly broadcasted by the user
		if (senderId != id) {
			this.clients[id].write(msg);
		}
	}
	// Add a listener, specific to the current user, for the broadcast event
	this.on('broadcast', this.subscriptions[id]);

	// Add a listener for leave event
	this.on('leave', function(id) {

		// Remove broadcast listener for specific client
		channel.removeListener('broadcast', this.subscriptions[id]);
		channel.emit('broadcast', id, 'id' + id + ' has left the chat.\n');
	});
});

net.createServer(function(client) {
	var id = client.remoteAddress + ':' + client.remotePort;
	client.on('connect', function() {

		/**
		 * Emiit a join event when a user connects to the server, specifying the
		 * user ID and client object
		 */
		channel.emit('join', id, client);
	});
	client.on('data', function(data) {

		/**
		 * Emit a channel broadcast event, specifying the user ID and message,
		 * when any user sends data
		 */
		channel.emit('broadcast', id, data.toString());
	});
	client.on('close', function() {
		// Emit leave event when user disconnects
		channel.emit('leave', id);
	});
}).listen(8888);