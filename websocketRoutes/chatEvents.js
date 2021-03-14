const chatHandler = require("../controllers/chatHandler");
module.exports = (socket) => {
  socket.on("sendMessage", chatHandler.sendMessage.bind(this, socket));
  socket.on("getLastSeen", chatHandler.getLastSeen.bind(this, socket));
  socket.on(
    "setMessagesAsRead",
    chatHandler.setMessagesAsRead.bind(this, socket)
  );
};
