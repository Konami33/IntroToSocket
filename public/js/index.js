const socket = io();

let userName = prompt("Enter your name:") || "Anonymous"; // Ask user for name
socket.emit('set-name', userName); // Send to server

const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

const roomInput = document.getElementById('room-input');
const createRoomBtn = document.getElementById('create-room');
const roomSelect = document.getElementById('room-select');
const currentRoomDisplay = document.getElementById('current-room');

let currentRoom = null;

// to display online users
socket.on('onlineUsers', (count) => {
    document.getElementById('online-users').textContent = `Online Users: ${count}`;
});

sendButton.addEventListener('click', (e) => {
    e.preventDefault();
    sendMessage();
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

createRoomBtn.addEventListener('click', () => {
    const roomName = roomInput.value.trim();
    if (roomName) {
        socket.emit('create-room', roomName);
        roomInput.value = '';
    }
});

roomSelect.addEventListener('change', () => {
    const selectedRoom = roomSelect.value;
    if (selectedRoom) {
        joinRoom(selectedRoom);
    }
});

function joinRoom(roomName) {
    currentRoom = roomName;
    socket.emit('join-room', roomName);
    currentRoomDisplay.textContent = `Current Room: ${roomName}`;
    chatBox.innerHTML = ''; // Clear chat when joining new room
}

socket.on('update-rooms', (rooms) => {
    roomSelect.innerHTML = '<option value="">Select a room...</option>';
    rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room;
        option.textContent = room;
        roomSelect.appendChild(option);
    });
});

socket.on('room-users', (data) => {
    if (data.room === currentRoom) {
        document.getElementById('online-users').textContent = 
            `Online Users in ${data.room}: ${data.count}`;
    }
});

// send message to server
function sendMessage() {
    if (messageInput.value.trim() === '' || !currentRoom) {
        return;
    }

    // create message object
    const message = {
        text: messageInput.value,
        sender: userName, // Send username
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    socket.emit('message', message);
    addMessageToChat(message, true);
    messageInput.value = '';
}

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
