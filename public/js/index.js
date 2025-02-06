const userName = localStorage.getItem('username');
const socket = io({
    auth: {
        username: userName
    }
});

// DOM elements
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const roomInput = document.getElementById('room-input');
const createRoomBtn = document.getElementById('create-room');
const roomSelect = document.getElementById('room-select');
const currentRoomDisplay = document.getElementById('current-room');
const userNameDisplay = document.getElementById('user-name');

let currentRoom = null;

// Check if user is authenticated
function checkAuth() {
    if (!userName) {
        window.location.href = '/auth.html';
        return;
    }
    userNameDisplay.textContent = userName;
    enableChat();
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

// Start the app by checking authentication
checkAuth();

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
    const selectedRoom = roomSelect.value;
    if (selectedRoom) {
        joinRoom(selectedRoom);
    }
});

// Handle room joining
function joinRoom(roomName) {
    console.log('Joining room:', roomName);
    currentRoom = roomName;
    socket.emit('join-room', roomName);
    currentRoomDisplay.textContent = `Current Room: ${roomName}`;
    chatBox.innerHTML = '';
}

// Add handler for previous messages
socket.on('previous-messages', (messages) => {
    messages.reverse().forEach(message => {
        addMessageToChat(message, message.sender === userName);
    });
});

// Handle room updates
socket.on('update-rooms', (rooms) => {
    roomSelect.innerHTML = '<option value="">Select a room...</option>';
    rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.name;
        option.textContent = `${room.name} (Created by ${room.createdBy})`;
        roomSelect.appendChild(option);
    });
});

// Handle room users
socket.on('room-users', (data) => {
    if (data.room === currentRoom) {
        document.getElementById('online-users').textContent = 
            `Online Users in ${data.room}: ${data.count}`;
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
    
    // Add message to chat immediately for sender
    addMessageToChat(message, true);
    
    // Send to server
    socket.emit('message', message);
    
    messageInput.value = '';
}

// add message to chat
function addMessageToChat(message, isSender) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container', isSender ? 'sent' : 'received');

    messageContainer.innerHTML = `
        <div class="message-info">
            <span class="sender-name">${message.sender}</span>
            <span class="message-time">${message.timestamp}</span>
        </div>
        <div class="message-bubble">${message.text}</div>
    `;

    chatBox.appendChild(messageContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Update the chat-message event handler
socket.on('chat-message', (message) => {
    // Only add messages from others
    if (message.sender !== userName) {
        addMessageToChat(message, false);
    }
});

// Add logout functionality
const logoutButton = document.createElement('button');
logoutButton.textContent = 'Logout';
logoutButton.classList.add('logout-button');
logoutButton.onclick = () => {
    localStorage.removeItem('username');
    window.location.href = '/auth.html';
};
document.querySelector('.user-info').appendChild(logoutButton);

// Add some CSS for the logout button
const style = document.createElement('style');
style.textContent = `
    .logout-button {
        background-color: #ff4444;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 5px;
        cursor: pointer;
        margin-left: 10px;
    }
    .logout-button:hover {
        background-color: #cc0000;
    }
`;
document.head.appendChild(style);
