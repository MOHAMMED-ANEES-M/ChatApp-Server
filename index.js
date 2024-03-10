const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv').config();
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/dbConnection');
const userRoutes = require("./routes/userRoutes");
const handleConnection = require('./controllers/chatController');

connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
        transports: ['websocket'],
        pingInterval: 10000,
        pingTimeout: 5000,
    },
});

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);

io.on('connection', (socket) => {
    handleConnection(socket, io);
});


app.use(errorHandler);

const port = process.env.PORT || 5001;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
