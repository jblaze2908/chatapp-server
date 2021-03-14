const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const message = mongoose.Schema({
  from: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  to: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  text: { type: String, required: false },
  imgLink: { type: String, required: false },
  sentAt: { type: Date, required: true },
  deliveredAt: { type: Date, required: false },
  readAt: { type: Date, required: false },
});
const chatThread = mongoose.Schema({
  participant1: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  participant2: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  messageHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: "messages",
      required: false,
    },
  ],
});
module.exports = {
  message: mongoose.model("messages", message),
  chatThread: mongoose.model("chatThreads", chatThread),
};
