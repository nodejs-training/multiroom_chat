/**
 * New node file
 */
function divEscapedContentElement(message) {
	return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
	return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp) {
	var message = $('#send-message').val();
	if (message.charAt(0) == '/') {
		// Since user input begins with slash, treat this as command
		var systemMessage = chatApp.processCommand(message);
		if (systemMessage) {
			$('#messages').append(divSystemContentElement(systemMessage));
		}
	} else {
		// Broadcast non-command input to other users of current room
		chatApp.sendMessage($('#room').text(), message);
		$('#messages').append(divEscapedContentElement(message));
	}
	$('#send-message').val('');
}

// Client side application initiation logic
var socket = io.connect();

$(document).ready(
		function() {
			var chatApp = new Chat(socket);

			// Display result of a name-change attempt
			socket.on('nameResult', function(result) {
				var message;
				if (result.success) {
					message = 'You are now known as ' + result.name + '.';
				} else {
					message = result.message;
				}
				$('#messages').append(divSystemContentElement(message));
			});

			// Display result of a room change
			socket.on('joinResult', function(result) {
				var changedRoom = result.room;
				$('#room').text(changedRoom);
				$('#messages').append(
						divSystemContentElement('Room changed to '
								+ changedRoom));
			});

			// Display received messages
			socket.on('message', function(message) {
				$('#messages').append(divEscapedContentElement(message.text));
			});

			// Display list of rooms available
			socket.on('rooms', function(rooms) {
				$('#room-list').empty();
				for ( var room in rooms) {
					console.log('room: ' + room);
					room = room.substring(1, room.length);
					if (room != '') {
						$('#room-list').append(divEscapedContentElement(room));
					}
				}

				/**
				 * Change the room on click of a room from the list and focus
				 * back to message input box
				 */
				$('#room-list div').click(function() {
					chatApp.changeRoom($(this).text());
					$('#send-message').focus();
				});
			});

			// Request list of rooms available intermittently
			setInterval(function() {
				socket.emit('rooms');
			}, 1000);

			$('#send-message').focus();

			// Allow submitting the form to send a chat message
			$('#send-form').submit(function() {
				console.log('hi')
				processUserInput(chatApp);
				return false;
			});
		});