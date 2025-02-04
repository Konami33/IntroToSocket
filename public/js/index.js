const socket = io();


// DOM elements
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const roomInput = document.getElementById('room-input');
const createRoomBtn = document.getElementById('create-room');
const roomSelect = document.getElementById('room-select');
const currentRoomDisplay = document.getElementById('current-room');
const userNameDisplay = document.getElementById('user-name');

let userName = null;

// Function to handle username input
async function setUsername() {
    
    const name = prompt("Enter your name:") || "";
    if (name.trim()) {
        // Emit set-name event and wait for response
        socket.emit('set-name', name.trim(), (response) => {
            if (response.success) {
                userName = name.trim();
                userNameDisplay.textContent = userName;
                // Enable chat functionality after successful username set
                enableChat();
            } else {
                alert(response.error || 'Username is already taken. Please choose another.');
            }
        });
    }
    
}

// Function to enable chat functionality
function enableChat() {
    messageInput.disabled = false;
    sendButton.disabled = false;
    roomInput.disabled = false;
    createRoomBtn.disabled = false;
    roomSelect.disabled = false;
}


// Initially disable chat functionality
messageInput.disabled = true;
sendButton.disabled = true;
roomInput.disabled = true;
createRoomBtn.disabled = true;
roomSelect.disabled = true;

// Start the app by setting username
setUsername();

let currentRoom = null;

// to display online users
socket.on('onlineUsers', (count) => {
    document.getElementById('online-users').textContent = `Online Users: ${count}`;
});

sendButton.addEventListener('click', (e) => {
    e.preventDefault();
    sendMessage();
});

// send message when the user presses enter
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// handle room creation
createRoomBtn.addEventListener('click', () => {
    const roomName = roomInput.value.trim();
    if (roomName) {
        socket.emit('create-room', roomName, (response) => {
            if (!response.success) {
                alert(response.error || 'Failed to create room');
            }
            roomInput.value = '';
        });
    }
});

roomSelect.addEventListener('change', () => {
    const selectedRoom = roomSelect.value; // get the selected room from the dropdown
    console.log(selectedRoom);
    if (selectedRoom) {
        joinRoom(selectedRoom); // join the selected room
    }
});

// Handle room joining
function joinRoom(roomName) {
    console.log('Joining room:', roomName);
    currentRoom = roomName;
    socket.emit('join-room', roomName); // send the room name to the server under the join-room event
    currentRoomDisplay.textContent = `Current Room: ${roomName}`; // update the current room display
    chatBox.innerHTML = ''; // Clear chat when joining new room
}

// Add handler for previous messages
socket.on('previous-messages', (messages) => {
    messages.reverse().forEach(message => {
        addMessageToChat(message, message.sender === userName);
    });
});

// Handle room updates
socket.on('update-rooms', (rooms) => {
    roomSelect.innerHTML = '<option value="">Select a room...</option>'; // clear the room select dropdown
    rooms.forEach(room => { // for each room, create an option and add it to the dropdown
        const option = document.createElement('option');
        option.value = room.name;
        option.textContent = `${room.name} (Created by ${room.createdBy})`;
        roomSelect.appendChild(option); // add the option to the dropdown
    });
});

// Handle room users
socket.on('room-users', (data) => { // handle the room users event
    if (data.room === currentRoom) { // if the room is the current room
        document.getElementById('online-users').textContent = 
            `Online Users in ${data.room}: ${data.count}`; // update the online users display
    }
});

// send message to server
function sendMessage() {
    if (messageInput.value.trim() === '' || !currentRoom || !userName) {
        return;
    }

    const message = {
        text: messageInput.value,
        sender: userName,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    socket.emit('message', message);
    addMessageToChat(message, true);
    messageInput.value = '';
}

// add message to chat
function addMessageToChat(message, isSender) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container', isSender ? 'sent' : 'received');

    // create message container
    messageContainer.innerHTML = `
        <div class="message-info">
            <span class="sender-name">${message.sender}</span>
            <span class="message-time">${message.timestamp}</span>
        </div>
        <div class="message-bubble">${message.text}</div>
    `;

    // add message to chat box
    chatBox.appendChild(messageContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Receive message from server
socket.on('chat-message', (message) => {
    addMessageToChat(message, false);
});
