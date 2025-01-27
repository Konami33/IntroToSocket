const socket = io();

const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messages = document.getElementById('messages');

socket.on('connect', () => {
    console.log('Connected to the server');
});

// Send a message to the server
sendButton.addEventListener('click', () => {
    const message = messageInput.value; // Get the message from the input field
    socket.emit('message', message); // Send the message to the server
    messageInput.value = ''; // Clear the input field
});

// Receive messages from the server
socket.on('message', (msg) => { // Listen for the 'message' event
    const li = document.createElement('li');
    li.textContent = msg;
    messages.appendChild(li);
});


socket.on('disconnect', () => {
    console.log('Disconnected from the server');
});