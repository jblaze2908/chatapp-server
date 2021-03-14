const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const config = require("../config");
const User = require("../models/user");
const uploadImage = require("../utilities/fileUploader");
const userHandler = {
  register: async (req, res) => {
    try {
      const existingUser = await User.findOne({
        email: req.body.email,
      });
      if (existingUser) {
        return res.status(220).json({
          message: "Account with this email already exists.",
        });
      }
      let hash = await bcrypt.hash(req.body.password, saltRounds);
      const newUser = new User({
        name: "",
        email: req.body.email,
        passwordHash: hash,
        registrationDate: new Date(),
        lastLoginTime: new Date(),
        lastSeen: new Date(),
        online: false,
        pfpLink: "",
      });
      await newUser.save();
      const token = genJwtToken(newUser);
      return res.status(200).json({
        token: token,
        data: newUser,
      });
    } catch (e) {
      return res.status(500).json({ message: "Something went wrong." });
    }
  },
  updateProfile: async (req, res) => {
    try {
      let body = { ...req.body } || {};
      const user = req.userData.user;
      if (
        body.hasOwnProperty("email") ||
        body.hasOwnProperty("password") ||
        body.hasOwnProperty("registrationDate") ||
        body.hasOwnProperty("lastLoginTime") ||
        body.hasOwnProperty("online") ||
        body.hasOwnProperty("lastSeen")
      )
        return res.status(403).json({
          message: "You are unauthorized to change this data.",
        });
      let image = await uploadImage(req);
      if (image.status === 200) {
        user.pfpLink = image.link;
      }
      if (req.body.name) user.name = req.body.name;
      await user.save();

      return res.status(200).json({
        message: "Changes saved.",
        name: user.name,
        pfpLink: image.status === 200 ? image.link : "",
      });
    } catch (e) {
      return res.status(500).json({ message: "Something went wrong." });
    }
  },
  login: async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(404).json({
          message: "No user is registered with this email id.",
        });
      }
      const match = await bcrypt.compare(req.body.password, user.passwordHash);
      if (user.socketId) {
        const io = require("../servers/socket-io").getConnection();
        io.to(user.socketId).emit("sessionExpired");
      }
      if (match) {
        user.lastLoginTime = new Date();
        await user.save();
        const token = genJwtToken(user);
        return res.status(200).json({
          token: token,
          data: user,
        });
      } else {
        return res.status(201).json({
          message: "Entered password is incorrect.",
        });
      }
    } catch (e) {
      return res.status(500).json({ message: "Something went wrong." });
    }
  },
  logout: async (req, res) => {
    try {
      const user = req.userData.user;
      user.lastSeen = new Date();
      user.online = false;
      user.socketId = "";
      await user.save();
      return res.status(200).json({ message: "Logged Out." });
    } catch (e) {
      return res.status(500).json({ message: "Something went wrong." });
    }
  },
  setUserAsOnline: async (_id, socketId) => {
    const user = await User.findById(_id);
    user.online = true;
    user.socketId = socketId;
    await user.save();
  },
  setUserAsOffline: async (_id, socketId) => {
    const user = await User.findById(_id);
    user.lastSeen = new Date();
    user.online = false;
    user.socketId = "";
    await user.save();
  },
};

const genJwtToken = (user) => {
  return jwt.sign(
    {
      email: user.email,
      _id: user._id,
      lastLoginTime: user.lastLoginTime,
    },
    config.JWT_KEY,
    { expiresIn: "24h" }
  );
};

module.exports = userHandler;
