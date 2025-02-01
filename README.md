<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat App</title>
    <link rel="stylesheet" href="index.css">
    <script src="/socket.io/socket.io.js"></script> <!-- Socket.io client library -->
</head>
<body>
    <script src="js/index.js"></script>
    <div class="chat-container">
        <div class="chat-box">
            <div class="message received">Hello!</div>
            <div class="message sent">Hi there!</div>
        </div>
        <div class="input-box">
            <input type="text" placeholder="Type a message...">
            <button>Send</button>
        </div>
    </div>
</body>
</html>
