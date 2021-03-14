const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const callSchema = mongoose.Schema({
  callType: { type: Number, required: true }, //0 - Audio, 1 - Video, 2 - Screenshare
  caller: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  startedAt: { type: Date, required: true },
  pickedAt: { type: Date, required: false },
  endedAt: { type: Date, required: false },
});
module.exports = mongoose.model("calls", callSchema);
