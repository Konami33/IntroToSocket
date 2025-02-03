const socket = io();

let userName = prompt("Enter your name:") || "Anonymous"; // Ask user for name
socket.emit('set-name', userName); // Send to server

const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

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

// send message to server
function sendMessage() {

    // check if message is empty
    if (messageInput.value.trim() === '') {
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
