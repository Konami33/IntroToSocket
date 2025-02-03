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
let rooms = new Map();

io.on('connection', (socket) => {
    console.log('A new user connected: ', socket.id);
    let currentRoom = null;

    // Send the list of rooms to the client
    socket.emit('update-rooms', Array.from(rooms.keys()));

    // set the userName
    socket.on('set-name', (name) => {
        onlineUsers.set(socket.id, name);
        io.emit('onlineUsers', onlineUsers.size);
    });

    // create a new room
    socket.on('create-room', (roomName) => {
        rooms.set(roomName, new Set());
        io.emit('update-rooms', Array.from(rooms.keys()));
    });

    // join a room
    socket.on('join-room', (roomName) => {
        if (currentRoom) {
            socket.leave(currentRoom);
            rooms.get(currentRoom).delete(socket.id);
        }
        
        socket.join(roomName);
        currentRoom = roomName;
        if (!rooms.has(roomName)) {
            rooms.set(roomName, new Set());
        }
        rooms.get(roomName).add(socket.id);
        
        // Emit room members count
        io.to(roomName).emit('room-users', {
            room: roomName,
            count: rooms.get(roomName).size
        });
    });

    socket.on('message', (message) => {
        if (currentRoom) {
            socket.to(currentRoom).emit('chat-message', message);
        }
    });

    socket.on('disconnect', () => {
        if (currentRoom && rooms.get(currentRoom)) {
            rooms.get(currentRoom).delete(socket.id);
            if (rooms.get(currentRoom).size === 0) {
                rooms.delete(currentRoom);
                io.emit('update-rooms', Array.from(rooms.keys()));
            } else {
                io.to(currentRoom).emit('room-users', {
                    room: currentRoom,
                    count: rooms.get(currentRoom).size
                });
            }
        }
        onlineUsers.delete(socket.id);
        io.emit('onlineUsers', onlineUsers.size);
    });
});

