const socket = io() //by default connects to same server that served the page

// Event listener for messages from the server
socket.on('serverSays', function(message, private) {
    let msgDiv = document.createElement('div');
    msgDiv.textContent = message;

	// Apply styling based on message type
    if (private) {
        msgDiv.classList.add('private');
    }
    else if (message.startsWith(window.username + ':')) {
        msgDiv.classList.add('sent');
    }
    else {
        msgDiv.classList.add('received');
    }

    document.getElementById('messages').appendChild(msgDiv);
});

function sendMessage() {
    const username = window.username; 
    let message = document.getElementById('msgBox').value.trim();

    if (message === '') return; 

    socket.emit('clientSays', username, message); 
    document.getElementById('msgBox').value = '';
}

function handleKeyDown(event) {
	const ENTER_KEY = 13; // Keycode for Enter key
	const activeElementId = document.activeElement.id;

	if (event.keyCode === ENTER_KEY) {
		// Check if the active element is the message input field
		if (activeElementId === 'msgBox') {
			sendMessage();
		}
		else if (activeElementId === 'usernameField' || activeElementId === 'connectButton') {
			connectAs();
		}
	}
}

// Function to validate username
function isValidUsername(username) {
	const regex = /^[a-zA-Z][a-zA-Z0-9]*$/
	return regex.test(username)
}

function connectAs() {
	let username = document.getElementById('usernameField').value.trim();

	if (!isValidUsername(username)) {
		alert('Invalid username! Usernames should start with a letter and contain only letters and numbers.');
		document.getElementById('usernameField').value = '';
		return;
	}

	document.getElementById('usernameField').value = '';

	// Store the username or pass it to another function
	handleUsername(username);
}

function handleUsername(username) {
	window.username = username;

	// Enable chat functionality
	document.getElementById('msgBox').disabled = false;
	document.getElementById('send_button').disabled = false;

	socket.emit('connectAs', username);
}

function clearChat() {
	let messagesContainer = document.getElementById('messages');

	// Remove all child elements 
	while (messagesContainer.firstChild) {
		messagesContainer.removeChild(messagesContainer.firstChild);
	}
}

// Event listener for 'connectAs' acknowledgment from the server
socket.on('connectAck', function(ackMessage) {
	let ackDiv = document.createElement('div');
	ackDiv.textContent = ackMessage;
	document.getElementById('messages').appendChild(ackDiv);
});
