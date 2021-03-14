const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const userSchema = mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  registrationDate: { type: Date, required: true },
  lastLoginTime: { type: Date, required: true },
  lastSeen: { type: Date, required: true },
  online: { type: Boolean, required: true },
  socketId: { type: String, required: false },
  pfpLink: { type: String, required: false },
});
userSchema.plugin(uniqueValidator);
module.exports = mongoose.model("users", userSchema);
