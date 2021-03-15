const mongoose = require("mongoose");
const config = require("../config");
const User = require("../models/user");
const uploadImage = require("../utilities/fileUploader");
const Message = require("../models/message").message;
const ChatThread = require("../models/message").chatThread;
const userHandler = {
  //messageDetails={ from: "",  to: "", text: "", }
  // sendMessageTest: async (req, res) => {
  //   try {
  //     // const io = require("../servers/socket-io").getConnection();
  //     let { to, text } = { ...req.body };
  //     let from = req.userData._id;
  //     let sendToUser = await User.findById(to)
  //       .select("email online socketId")
  //       .lean();
  //     let newMessage = {
  //       from,
  //       to,
  //       text,
  //       sentAt: new Date(),
  //     };
  //     let savedMessage = await new Message(newMessage).save();

  //     let thread = await ChatThread.findOne({
  //       $or: [
  //         {
  //           $and: [
  //             { participant1: mongoose.Types.ObjectId(from) },
  //             { participant2: mongoose.Types.ObjectId(to) },
  //           ],
  //         },
  //         {
  //           $and: [
  //             { participant1: mongoose.Types.ObjectId(to) },
  //             { participant2: mongoose.Types.ObjectId(from) },
  //           ],
  //         },
  //       ],
  //     });

  //     if (!thread) {
  //       thread = await createNewChatThread(from, to, savedMessage._id);
  //     } else {
  //       let messages = [...thread.messageHistory];
  //       messages.push(savedMessage._id);
  //       thread.messageHistory = messages;
  //       await thread.save();
  //     }
  //     // if (sendToUser.online) {
  //     //   savedMessage.deliveredAt = new Date();
  //     //   await savedMessage.save();
  //     //   io.to(sendToUser.socketId).emit("newMessage", savedMessage,thread);
  //     // }
  //     // callback({
  //     //   status: 200,
  //     // });
  //     return res.status(200).json({
  //       message: "done",
  //     });
  //   } catch (e) {
  //     // return callback({
  //     //   status: 500,
  //     // });
  //   }
  // },
  getLastSeen: async (socket, _id, callback) => {
    try {
      let user = await User.findById(_id).select("online lastSeen").lean();
      callback({
        status: 200,
        data: user,
      });
    } catch (e) {
      return callback({
        status: 500,
      });
    }
  },
  sendMessage: async (socket, messageDetails, callback) => {
    try {
      const io = require("../servers/socket-io").getConnection();
      let { to, text, imgLink } = messageDetails;
      let from = socket.userData._id;
      let sendToUser = await User.findById(to)
        .select("name pfpLink online socketId")
        .lean();
      let thread = await ChatThread.findOne({
        $or: [
          {
            $and: [
              { participant1: mongoose.Types.ObjectId(from) },
              { participant2: mongoose.Types.ObjectId(to) },
            ],
          },
          {
            $and: [
              { participant1: mongoose.Types.ObjectId(to) },
              { participant2: mongoose.Types.ObjectId(from) },
            ],
          },
        ],
      });
      let newMessage = {
        from,
        to,
        sentAt: new Date(),
      };
      if (imgLink) {
        newMessage.imgLink = imgLink;
      } else newMessage.text = text;
      let savedMessage = await new Message(newMessage).save();
      if (!thread) {
        thread = await createNewChatThread(from, to, savedMessage._id);
      } else {
        let messages = [...thread.messageHistory];
        messages.push(savedMessage._id);
        thread.messageHistory = messages;
        await thread.save();
      }
      if (sendToUser.online) {
        savedMessage.deliveredAt = new Date();
        await savedMessage.save();
        let name = socket.userData.user.name;
        let senderName, senderPfp;
        if (!name) {
          let userFrom = await User.findById(socket.userData._id)
            .select("name pfpLink")
            .lean();
          senderName = userFrom.name;
          senderPfp = userFrom.pfpLink;
        } else {
          senderName = socket.userData.user.name;
          senderPfp = socket.userData.user.pfpLink;
        }
        io.to(sendToUser.socketId).emit("newMessage", savedMessage, {
          _id: from,
          senderName,
          senderPfp,
        });
      }
      callback({
        status: 200,
        savedMessage,
        receiverDetails: {
          _id: to,
          name: sendToUser.name,
          pfpLink: sendToUser.pfpLink,
        },
      });
    } catch (e) {
      return callback({
        status: 500,
      });
    }
  },
  uploadAttachment: async (req, res) => {
    try {
      const io = require("../servers/socket-io").getConnection();
      const user = req.userData.user;
      let image = await uploadImage(req);
      if (image.status === 200) {
        let sendToUser = await User.findById(req.body.to)
          .select("online socketId")
          .lean();
        let newMessage = {
          from: req.userData._id,
          to: sendToUser._id,
          imgLink: image.link,
          sentAt: new Date(),
        };
        let savedMessage = await new Message(newMessage).save();
        let from = req.userData._id,
          to = sendToUser._id;
        let thread = await ChatThread.findOne({
          $or: [
            {
              $and: [
                { participant1: mongoose.Types.ObjectId(from) },
                { participant2: mongoose.Types.ObjectId(to) },
              ],
            },
            {
              $and: [
                { participant1: mongoose.Types.ObjectId(to) },
                { participant2: mongoose.Types.ObjectId(from) },
              ],
            },
          ],
        });
        if (!thread) {
          thread = await createNewChatThread(from, to, savedMessage._id);
        } else {
          let messages = [...thread.messageHistory];
          messages.push(savedMessage._id);
          thread.messageHistory = messages;
          await thread.save();
        }
        if (sendToUser.online) {
          savedMessage.deliveredAt = new Date();
          await savedMessage.save();
          io.to(sendToUser.socketId).emit("newMessage", savedMessage, {
            _id: from,
            senderName: req.userData.user.name,
            senderPfp: req.userData.user.pfpLink,
          });
        }
        return res.status(200).json({
          savedMessage,
          receiverDetails: {
            _id: to,
            name: sendToUser.name,
            pfpLink: sendToUser.pfpLink,
          },
        });
      }
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Something went wrong." });
    }
  },
  setMessagesAsRead: async (socket, sender_id, callback) => {
    try {
      let sender = await User.findById(sender_id)
        .select("email socketId online")
        .lean();
      if (!sender)
        return res.status(404).json({
          message: "Sender not found.",
        });
      let time = new Date();
      let messages = await Message.updateMany(
        {
          $and: [
            {
              from: sender._id,
            },
            {
              to: socket.userData._id,
            },
            {
              readAt: { $exists: false },
            },
          ],
        },
        {
          readAt: time,
        }
      );
      if (sender.online) {
        const io = require("../servers/socket-io").getConnection();
        io.to(sender.socketId).emit("messagesRead", socket.userData._id, time);
      }
      callback({ status: 200, message: "Messages set as read." });
    } catch (e) {
      console.log(e);
    }
  },
  fetchDetailsByEmail: async (req, res) => {
    try {
      let { email } = req.params;
      if (email === req.userData.user.email)
        return res.status(201).json({ message: "Little daring are we." });
      let user = await User.findOne({ email: email }).select(
        "name email pfpLink"
      );
      if (!user) return res.status(404).json({ message: "Not found." });
      else return res.status(200).json(user);
    } catch (e) {
      return res.status(500).json({ message: "Something went wrong." });
    }
  },

  fetchChats: async (req, res) => {
    try {
      let chats = await ChatThread.aggregate(
        fetchChatPipeline(req.userData._id)
      );
      let _id = req.userData._id;
      res.status(200).json({ chats });
      await Message.updateMany(
        {
          $and: [
            {
              to: _id,
            },
            {
              deliveredAt: { $exists: false },
            },
          ],
        },
        {
          deliveredAt: new Date(),
        }
      );
    } catch (e) {
      return res.status(500).json({ message: "Something went wrong." });
    }
  },
};
module.exports = userHandler;
const createNewChatThread = async (p1, p2, msgId) => {
  let chatThread = new ChatThread({
    participant1: p1,
    participant2: p2,
    messageHistory: [msgId],
  });
  return await chatThread.save();
};
const fetchChatPipeline = (_id) => {
  return [
    {
      $match: {
        $or: [
          {
            participant1: mongoose.Types.ObjectId(_id),
          },
          {
            participant2: mongoose.Types.ObjectId(_id),
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "participant1",
        foreignField: "_id",
        as: "participant1",
      },
    },
    {
      $unwind: {
        path: "$participant1",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "participant2",
        foreignField: "_id",
        as: "participant2",
      },
    },
    {
      $unwind: {
        path: "$participant2",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $lookup: {
        from: "messages",
        localField: "messageHistory",
        foreignField: "_id",
        as: "messages",
      },
    },
    {
      $project: {
        participant1: {
          _id: 1,
          name: 1,
          pfpLink: 1,
        },
        participant2: {
          _id: 1,
          name: 1,
          pfpLink: 1,
        },
        messages: 1,
      },
    },
  ];
};
