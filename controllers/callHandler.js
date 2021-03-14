const User = require("../models/user");
const Call = require("../models/call");
const callsHandler = {
  startCall: async (socket, callWithId, callType, callback) => {
    try {
      let callWith = await User.findById(callWithId)
        .select("name email pfpLink socketId")
        .lean();
      if (!callWith) {
        callback({ status: 404 });
        return;
      }
      let call = new Call({
        callType,
        caller: socket.userData._id,
        receiver: callWithId,
        startedAt: new Date(),
      });
      let savedCall = await call.save();
      if (callWith.socketId) {
        const io = require("../servers/socket-io").getConnection();
        io.to(callWith.socketId).emit(
          "newCall",
          savedCall,
          socket.userData.user
        );
      }
      callback({ status: 200, _id: savedCall._id });
    } catch (err) {
      console.log(err);
    }
  },
  callPickedUp: async (socket, callId, callback) => {
    try {
      let call = await Call.findById(callId);
      if (!call) {
        callback({ status: 404 });
        return;
      }
      if (call.receiver !== socket.userData._id) {
        callback({ status: 401 });
        return;
      }
      if (call.endedAt) {
        callback({ status: 220, message: "Call already ended." });
        return;
      }
      call.pickedAt = new Date();
      await call.save();
      callback({ status: 200 });
    } catch (err) {
      console.log(err);
    }
  },
  endCall: async (socket, callId, callback) => {
    try {
      let call = await Call.findById(callId);
      if (!call) {
        callback({ status: 404 });
        return;
      }
      if (
        "" + call.receiver !== socket.userData._id &&
        "" + call.caller !== socket.userData._id
      ) {
        callback({ status: 401 });
        return;
      }
      if (call.endedAt) {
        callback({ status: 220, message: "Call already ended." });
        return;
      }
      let callWith =
        "" + call.caller === socket.userData._id ? call.receiver : call.caller;
      let user = await User.findById(callWith);
      const io = require("../servers/socket-io").getConnection();
      io.to(user.socketId).emit("callEnded");
    } catch (err) {
      console.log(err);
    }
  },
};
module.exports = callsHandler;
