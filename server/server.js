const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Define paths and port
const publicPath = path.join(__dirname, '../public'); // Path to the public folder
const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the public directory
app.use(express.static(publicPath));

// Socket.io connection handler
io.on('connection', (socket) => { // socket represents the connection to the client
    console.log('A user connected');
    socket.on('message', (msg) => { // Listen for messages
        console.log(`Message received: ${msg}`);
        io.emit('message', msg); // Broadcast the message
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server
server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});
