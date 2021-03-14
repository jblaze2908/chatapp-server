const callHandler = require("../controllers/callHandler");
module.exports = (socket) => {
  socket.on("startCall", callHandler.startCall.bind(this, socket));
  socket.on("callPickedUp", callHandler.callPickedUp.bind(this, socket));
  socket.on("endCall", callHandler.endCall.bind(this, socket));
};
