const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));

const server = app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});

const io = require('socket.io')(server);

let onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('A new user connected: ', socket.id);

    socket.on('set-name', (name) => {
        onlineUsers.set(socket.id, name);
        io.emit('onlineUsers', onlineUsers.size);
    });

    socket.on('disconnect', () => {
        onlineUsers.delete(socket.id);
        io.emit('onlineUsers', onlineUsers.size);
    });

    socket.on('message', (message) => {
        socket.broadcast.emit('chat-message', message);
    });
});

