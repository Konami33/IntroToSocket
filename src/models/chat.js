const { redisClient } = require('../config/redis');
const bcrypt = require('bcrypt');

class ChatModel {
    static async saveMessage(roomId, message) {
        const messageId = await redisClient.incr('message_id');
        const messageData = {
            id: messageId,
            ...message,
            roomId,
            timestamp: new Date().toISOString()
        };
        
        // Store message in room's message list with room-specific key
        await redisClient.lPush(`messages:${roomId}`, JSON.stringify(messageData));
        // Trim to last 100 messages
        await redisClient.lTrim(`messages:${roomId}`, 0, 99);
        
        return messageData;
    }

    static async getRoomMessages(roomId, limit = 50) {
        const messages = await redisClient.lRange(`messages:${roomId}`, 0, limit - 1);
        return messages.map(msg => JSON.parse(msg));
    }

    static async saveRoom(roomName, createdBy) {
        // Check if room already exists
        const exists = await redisClient.hExists('rooms', roomName);
        if (exists) {
            throw new Error('Room already exists');
        }

        const roomData = {
            name: roomName,
            createdBy,
            createdAt: new Date().toISOString()
        };
        
        await redisClient.hSet('rooms', roomName, JSON.stringify(roomData));
        return roomData;
    }

    static async getAllRooms() {
        const rooms = await redisClient.hGetAll('rooms');
        return Object.values(rooms).map(room => JSON.parse(room));
    }

    static async registerUser(username, password) {
        // Check if username exists
        const exists = await this.isUsernameTaken(username);
        if (exists) {
            throw new Error('Username already taken');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userData = {
            username,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        // Save user data
        await redisClient.hSet('users', username, JSON.stringify(userData));
        return { username: userData.username, createdAt: userData.createdAt };
    }

    static async loginUser(username, password) {
        const userData = await redisClient.hGet('users', username);
        if (!userData) {
            throw new Error('User not found');
        }

        const user = JSON.parse(userData);
        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) {
            throw new Error('Invalid password');
        }

        return { username: user.username, createdAt: user.createdAt };
    }

    static async isUsernameTaken(username) {
        return await redisClient.hExists('users', username);
    }

    static async saveUser(userId, userData) {
        // Check if username is taken
        const exists = await this.isUsernameTaken(userData.name);
        if (exists) {
            throw new Error('Username already taken');
        }

        // Save username to set of taken usernames
        await redisClient.sAdd('usernames', userData.name);
        // Save user data
        await redisClient.hSet('users', userId, JSON.stringify(userData));
        return userData;
    }

    static async getUser(userId) {
        const userData = await redisClient.hGet('users', userId);
        return userData ? JSON.parse(userData) : null;
    }

    static async removeUser(userId) {
        const userData = await this.getUser(userId);
        if (userData) {
            await redisClient.sRem('usernames', userData.name);
            await redisClient.hDel('users', userId);
        }
    }

    static async updateUserStatus(username, status) {
        const userData = await redisClient.hGet('users', username);
        if (userData) {
            const user = JSON.parse(userData);
            user.status = status;
            user.lastSeen = new Date().toISOString();
            await redisClient.hSet('users', username, JSON.stringify(user));
        }
    }
}

module.exports = ChatModel;
