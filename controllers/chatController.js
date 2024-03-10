const Chat = require("../models/chatModel");

const handleConnection = (socket, io) => {
  console.log('user connected');
    
    socket.on('joinRoom', async (data) => {
        const { room, to, hint } = data;
        console.log(hint);
    
        try {
          const messages = await Chat.find({ $or: [{ room:room }, { room:to }] }).sort({ timestamp: 1 });
    
          socket.emit('loadMessages', { messages });
          
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
    
        socket.join(room);
      });
    
      socket.on('sendMessage', async (data) => {
        const { room, to, customerId, message, role } = data;
    
        try {
          const newMessage = new Chat({ room, customerId, message, role });
          const response = await newMessage.save()
          
          console.log(response, 'sendMessage insert');
          io.to(to).emit('recieveMessage', response)
    
        } catch (error) {
          console.error('Error saving message:', error);
        }
      });
    
      socket.on('disconnect', () => {
        console.log('A user disconnected');
      });

};

module.exports = handleConnection;
