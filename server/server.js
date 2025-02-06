const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT || 3000;
const { connectRedis } = require('../src/config/redis');
const ChatModel = require('../src/models/chat');
const dotenv = require('dotenv');
dotenv.config();

// Add middleware to parse JSON bodies
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const server = app.listen(port, async () => {
    await connectRedis();
    console.log(`Server is up on port ${port}`);
});


const io = require('socket.io')(server);

// global variables
let onlineUsers = new Map(); // map of online users
let rooms = new Map(); // map of rooms

io.on('connection', async (socket) => {
    console.log('A new user connected: ', socket.id);
    let currentRoom = null;

    // Get username from the socket handshake query
    const userName = socket.handshake.auth.username;
    if (userName) {
        onlineUsers.set(socket.id, userName);
        io.emit('onlineUsers', onlineUsers.size);
    }

    // Send the list of rooms to the new connected client
    const existingRooms = await ChatModel.getAllRooms();
    socket.emit('update-rooms', existingRooms);

    socket.on('create-room', async (roomName, callback) => {
        try {
            const userName = onlineUsers.get(socket.id);
            if (!userName) {
                throw new Error('Must set username first');
            }
            await ChatModel.saveRoom(roomName, userName);
            rooms.set(roomName, new Set());
            const existingRooms = await ChatModel.getAllRooms();
            io.emit('update-rooms', existingRooms);
            callback({ success: true });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    // join a room
    socket.on('join-room', async (roomName) => {
        console.log('join-room', roomName);
        // leave the current room if the user is already in a room
        if (currentRoom) {
            socket.leave(currentRoom);
            rooms.get(currentRoom).delete(socket.id);
        }
        
        socket.join(roomName); // join the new room
        currentRoom = roomName; // set the current room to the new room
        if (!rooms.has(roomName)) { // if the room does not exist, create it
            rooms.set(roomName, new Set()); // create a new room roomName with an empty set of users
        }
        rooms.get(roomName).add(socket.id); // add the user to the new room

        // send the previous messages in the room
        const previousMessages = await ChatModel.getRoomMessages(roomName);
        socket.emit('previous-messages',  previousMessages);
        
        
        // Emit room members count
        io.to(roomName).emit('room-users', { // send the updated list of users in the new room to all clients in the new room
            room: roomName,
            count: rooms.get(roomName).size
        });
    });

    socket.on('message', async (message) => {
        if (!currentRoom || !onlineUsers.has(socket.id)) {
            return; // Don't allow messages if not in a room or not registered
        }
        const savedMessage = await ChatModel.saveMessage(currentRoom, message);
        socket.to(currentRoom).emit('chat-message', savedMessage);
    });

    socket.on('disconnect', async () => {
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
        await ChatModel.removeUser(socket.id);
        onlineUsers.delete(socket.id);
        io.emit('onlineUsers', onlineUsers.size);
    });
});

// Authentication routes
app.post('/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await ChatModel.registerUser(username, password);
        res.json({ success: true, user });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await ChatModel.loginUser(username, password);
        res.json({ success: true, user });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Rename index.html to chat.html and update the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/auth.html'));
});

