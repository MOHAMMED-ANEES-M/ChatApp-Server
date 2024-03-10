const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    
    room : {
        type : String,
    },
    
    customerId: {
        type: String,
    },
    message: {
        type: String,
    },
    role: { 
        type: String, 
        required: true 
    },

  },
  {
      timestamps:true
  }
  );

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;