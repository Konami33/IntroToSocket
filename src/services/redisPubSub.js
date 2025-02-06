// const Redis = require('redis');

// // Create separate clients for pub/sub
// const publisher = Redis.createClient({
//     url: process.env.REDIS_URL || 'redis://localhost:6379'
// });

// const subscriber = Redis.createClient({
//     url: process.env.REDIS_URL || 'redis://localhost:6379'
// });

// // Connect both clients
// (async () => {
//     await publisher.connect();
//     await subscriber.connect();
// })();

// const CHANNELS = {
//     CHAT_MESSAGES: 'CHAT_MESSAGES',
//     ROOM_UPDATES: 'ROOM_UPDATES',
//     USER_STATUS: 'USER_STATUS'
// };

// class RedisPubSubService {
//     static async publish(channel, message) {
//         await publisher.publish(channel, JSON.stringify(message));
//     }

//     static async subscribe(channel, callback) {
//         await subscriber.subscribe(channel, (message) => {
//             callback(JSON.parse(message));
//         });
//     }
// }

// module.exports = { RedisPubSubService, CHANNELS }; 