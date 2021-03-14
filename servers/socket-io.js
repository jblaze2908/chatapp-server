const consola = require("consola");
const userHandler = require("../controllers/userHandler");
const chatEvents = require("../websocketRoutes/chatEvents");
const callEvents = require("../websocketRoutes/callEvents");
const checkAuthSocket = require("../middleware/checkAuth").socket;
const options = {
  cors: {
    origin: "*",
  },
};
let io;
const socketManager = {
  initialise: (server) => {
    consola.success("Socket.io is listening");
    io = require("socket.io")(server, options);
    io.use(checkAuthSocket).on("connection", (socket) => {
      userHandler.setUserAsOnline(socket.userData._id, socket.id);
      chatEvents(socket);
      callEvents(socket);
      socket.on("disconnecting", () => {
        userHandler.setUserAsOffline(socket.userData._id, socket.id);
      });
    });
  },
  getConnection: () => {
    return io;
  },
};
module.exports = socketManager;
