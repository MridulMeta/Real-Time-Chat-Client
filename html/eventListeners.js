document.addEventListener('DOMContentLoaded', function() {
	//This is called after the browser has loaded the web page

	// Disable chat functionality initially
	document.getElementById('msgBox').disabled = true
	document.getElementById('send_button').disabled = true

	//add listener to buttons
	document.getElementById('send_button').addEventListener('click', sendMessage)
	document.getElementById('connectButton').addEventListener('click', connectAs)
	document.getElementById('clearButton').addEventListener('click', clearChat);

	//add keyboard handler for the document as a whole
	document.addEventListener('keydown', handleKeyDown)
})