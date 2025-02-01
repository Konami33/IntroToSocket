const socket = io();

const onlineUsers = document.getElementById('online-users');
const messageReceived = document.getElementById('message-received');
const messageSent = document.getElementById('message-sent');
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');



socket.on('onlineUsers', (data) => {
    console.log(data);
    onlineUsers.innerText = `Online Users: ${data}`;
});

// sendButton.addEventListener('click', (e) => {
//     e.preventDefault();
//     sendMessage();
// });

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const message = {
        text: messageInput.value,
        sender: socket.id,
        dataTime: new Date().toLocaleString()
    }
    console.log(message);
    socket.emit('message', message);
    addMessageToChat(message, true);
    messageInput.value = '';
}   

function addMessageToChat(message, isSender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add(isSender ? 'sent' : 'received');
    messageElement.innerHTML = `<strong>${isSender ? 'You' : message.sender}:</strong> ${message.text}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

socket.on('chat-message', (message) => {
    addMessageToChat(message, false);
});




