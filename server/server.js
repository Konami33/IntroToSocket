const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));

const server = app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});


const io = require('socket.io')(server);

// global variables
let onlineUsers = new Map(); // map of online users
let rooms = new Map(); // map of rooms

io.on('connection', (socket) => {
    console.log('A new user connected: ', socket.id);
    let currentRoom = null;

    // Send the list of rooms to the new connected client
    socket.emit('update-rooms', Array.from(rooms.keys()));

    // set the userName
    socket.on('set-name', (name) => {
        onlineUsers.set(socket.id, name);
        io.emit('onlineUsers', onlineUsers.size);
    });

    // create a new room
    socket.on('create-room', (roomName) => {
        rooms.set(roomName, new Set()); // create a new room roomName with an empty set of users
        io.emit('update-rooms', Array.from(rooms.keys())); // send the updated list of rooms to all clients
    });

    // join a room
    socket.on('join-room', (roomName) => {
        console.log('join-room', roomName);
        // leave the current room if the user is already in a room
        if (currentRoom) {
            socket.leave(currentRoom);
            rooms.get(currentRoom).delete(socket.id);
        }
        
        socket.join(roomName); // join the new room
        currentRoom = roomName; // set the current room to the new room
        if (!rooms.has(roomName)) { // if the new room does not exist, create it
            rooms.set(roomName, new Set()); // create a new room roomName with an empty set of users
        }
        rooms.get(roomName).add(socket.id); // add the user to the new room
        
        // Emit room members count
        io.to(roomName).emit('room-users', { // send the updated list of users in the new room to all clients in the new room
            room: roomName,
            count: rooms.get(roomName).size
        });
    });

    socket.on('message', (message) => {
        if (currentRoom) {
            socket.to(currentRoom).emit('chat-message', message); // send the message to all clients in the current room
        }
    });

    socket.on('disconnect', () => {
        if (currentRoom && rooms.get(currentRoom)) { // if the user is in a room
            rooms.get(currentRoom).delete(socket.id); // remove the user from the current room
            if (rooms.get(currentRoom).size === 0) { // if the current room has no users
                rooms.delete(currentRoom); // delete the current room
                io.emit('update-rooms', Array.from(rooms.keys())); // send the updated list of rooms to all clients
            } else {
                io.to(currentRoom).emit('room-users', { // send the updated list of users in the current room to all clients in the current room
                    room: currentRoom,
                    count: rooms.get(currentRoom).size
                });
            }
        }
        onlineUsers.delete(socket.id); // remove the user from the list of online users
        io.emit('onlineUsers', onlineUsers.size); // send the updated list of online users to all clients
    });
});

