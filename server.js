const server = require('http').createServer(handler)
const io = require('socket.io')(server) //wrap server app in socket io capability
const fs = require('fs') //file system to server static files
const url = require('url'); //to parse url strings
const PORT = process.argv[2] || process.env.PORT || 3000 
const ROOT_DIR = 'html' 

const MIME_TYPES = {
	'css': 'text/css',
	'gif': 'image/gif',
	'htm': 'text/html',
	'html': 'text/html',
	'ico': 'image/x-icon',
	'jpeg': 'image/jpeg',
	'jpg': 'image/jpeg',
	'js': 'application/javascript',
	'json': 'application/json',
	'png': 'image/png',
	'svg': 'image/svg+xml',
	'txt': 'text/plain'
}

// Function to get MIME type based on file extension
function get_mime(filename) {
	for (let ext in MIME_TYPES) {
		if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
			return MIME_TYPES[ext]
		}
	}
	return MIME_TYPES['txt']
}

server.listen(PORT) 

//handler for http server requests including static files
function handler(request, response) {
	let urlObj = url.parse(request.url, true, false)
	console.log('\n============================')
	console.log("PATHNAME: " + urlObj.pathname)
	console.log("REQUEST: " + ROOT_DIR + urlObj.pathname)
	console.log("METHOD: " + request.method)

	let filePath = ROOT_DIR + urlObj.pathname
	if (urlObj.pathname === '/') filePath = ROOT_DIR + '/index.html'

	fs.readFile(filePath, function(err, data) {
		if (err) {
			console.log('ERROR: ' + JSON.stringify(err))
			response.writeHead(404);
			response.end(JSON.stringify(err))
			return
		}
		response.writeHead(200, {
			'Content-Type': get_mime(filePath)
		})
		response.end(data)
	})
}

const registeredUsers = {}; // Store registered users

// Socket Server
io.on('connection', function(socket) {
	console.log('client connected');

	socket.emit('serverSays', 'You are connected to CHAT SERVER');

	// Event handler for when a client registers with a username
	socket.on('connectAs', function(username) {
		console.log('User connected as: ' + username);
		registeredUsers[socket.id] = username;
		socket.join('registered');
		socket.emit('connectAck', 'You are registered as ' + username);
	});

	socket.on('clientSays', function(senderUsername, data) {
		console.log('RECEIVED: ' + data);
	
		const isGroupMessage = data.includes(':') && data.split(':')[0].includes(',');

		if (isGroupMessage) {
			// Extract recipients and message from the data
			const parts = data.split(':');
			const recipients = parts[0].split(',').map(recipient => recipient.trim());
			const message = parts.slice(1).join(':').trim();
	
			recipients.forEach(recipient => {
				const userId = Object.keys(registeredUsers).find(key => registeredUsers[key] === recipient);
				if (userId) {
					io.to(userId).emit('serverSays', senderUsername + ': ' + message, true);
				} else {
					socket.emit('serverSays', 'User ' + recipient + ' not found.');
				}
			});
	
			// Emit the message to the sender as well
			io.to(socket.id).emit('serverSays', senderUsername + ': ' + message, true);
		} else {
			// It's a private message
			const match = data.match(/^(\w+):\s*(.*)$/);
	
			if (match) {
				const recipient = match[1];
				const message = match[2];
	
				let userExists = false;
				let userId = '';
	
				for (let [key, value] of Object.entries(registeredUsers)) {
					if (value === recipient) {
						userExists = true;
						userId = key;
						break;
					}
				}
	
				if (userExists) {
					// Emit the message only to the recipient and the sender
					socket.emit('serverSays', senderUsername + ': ' + message, true); // true sets the message to private
					io.to(userId).emit('serverSays', registeredUsers[socket.id] + ': ' + message, true);
				} else {
					socket.emit('serverSays', 'User ' + recipient + ' not found.');
				}
			} else {
				// Broadcast the message to all users if it's not a private message
				io.to('registered').emit('serverSays', registeredUsers[socket.id] + ': ' + data);
			}
		}
	});

	socket.on('disconnect', function() {
		// Remove the user from registered users and leave the registered room when they disconnect
		delete registeredUsers[socket.id];
		socket.leave('registered');
		console.log('client disconnected');
	});
});

console.log(`Server Running at port ${PORT}  CNTL-C to quit`)
console.log(`To Test:`)
console.log(`Open several browsers to: http://localhost:${PORT}/chatClient.html`)