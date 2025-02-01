const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));

const server = app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});

const io = require('socket.io')(server);

io.on('connection', onConnection);

let onlineUsers = new Map();

function onConnection(socket) {
    // console.log('A new user connected: ', socket.id);
    onlineUsers.set(socket.id, {id: socket.id}); // Add the user to the set to keep track of online users
    //console.log('Online users: ', onlineUsers);
    io.emit('onlineUsers', onlineUsers.size);
    // console.log('Online users: ', onlineUsers.size);


    socket.on('disconnect', () => {
        onlineUsers.delete(socket.id); // Remove the user from the set when they disconnect
        io.emit('onlineUsers', onlineUsers.size);
    });


    socket.on('message', (message) => {
        socket.broadcast.emit('chat-message', message);
    });
}


