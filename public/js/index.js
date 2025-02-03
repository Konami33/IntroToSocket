const socket = io();

let userName = prompt("Enter your name:") || "Anonymous"; // Ask user for name
socket.emit('set-name', userName); // Send to server

// DOM elements
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const roomInput = document.getElementById('room-input');
const createRoomBtn = document.getElementById('create-room');
const roomSelect = document.getElementById('room-select');
const currentRoomDisplay = document.getElementById('current-room');
const userNameDisplay = document.getElementById('user-name');

// set the user name
userNameDisplay.textContent = userName;

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
    const roomName = roomInput.value.trim(); // get the room name from the input
    if (roomName) {
        socket.emit('create-room', roomName); // send the room name to the server under the create-room event
        roomInput.value = ''; // clear the room input
    }
});

roomSelect.addEventListener('change', () => {
    const selectedRoom = roomSelect.value; // get the selected room from the dropdown
    if (selectedRoom) {
        joinRoom(selectedRoom); // join the selected room
    }
});

// Handle room joining
function joinRoom(roomName) {
    currentRoom = roomName;
    socket.emit('join-room', roomName); // send the room name to the server under the join-room event
    currentRoomDisplay.textContent = `Current Room: ${roomName}`; // update the current room display
    chatBox.innerHTML = ''; // Clear chat when joining new room
}

// Handle room updates
socket.on('update-rooms', (rooms) => {
    roomSelect.innerHTML = '<option value="">Select a room...</option>'; // clear the room select dropdown
    rooms.forEach(room => { // for each room, create an option and add it to the dropdown
        const option = document.createElement('option');
        option.value = room;
        option.textContent = room;
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
    if (messageInput.value.trim() === '' || !currentRoom) { // if the message is empty or the user is not in a room
        return;
    }

    // create message object
    const message = {
        text: messageInput.value,
        sender: userName, // Send username
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    socket.emit('message', message); // send the message to the server under the message event
    addMessageToChat(message, true); // add the message to the chat
    messageInput.value = ''; // clear the message input
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
