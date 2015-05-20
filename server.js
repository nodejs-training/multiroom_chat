var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var chatServer = require('./lib/chat_server');

var cache = {};

// Handle when a file requested does noot exist
function send404(res) {
	res.writeHead(404, {
		'content-type' : 'text/plain'
	});
	res.end('Error 404: resource not found.');
}

// Send the contents of a file requested
function sendFile(res, filePath, fileContent) {
	res.writeHead(200, {
		'content-type' : mime.lookup(path.basename(filePath))
	});
	res.end(fileContent);
}

// Sens the contents of a static file requested
function serveStatic(res, cache, absPath) {
	// Check if the file is cached in memory
	if (cache[absPath]) {
		// Serve the file from memory
		sendFile(res, absPath, cache[absPath]);
	} else {
		// Check if file exists
		fs.exists(absPath, function(exists) {
			if (exists) {
				// Read file from disk
				fs.readFile(absPath, function(err, data) {
					if (err) {
						send404(res);
					} else {
						// Cache the file in meory and serve
						cache[absPath] = data;
						sendFile(res, absPath, data);
					}
				});
			} else {
				send404(res);
			}
		});
	}
}

// Create http server and listen to a port
var server = http.createServer(function(req, res) {
	var filePath = false;
	if (req.url == '/') {
		// Determne html file to be served by default
		filePath = 'public/index.html';
	} else {
		// Translate URL path to relative file path
		filePath = 'public' + req.url;
	}
	var absPath = './' + filePath;
	// Serve static file
	serveStatic(res, cache, absPath);
}).listen(3000, function() {
	console.log('server listening on port 3000.');
});

chatServer.listen(server);
