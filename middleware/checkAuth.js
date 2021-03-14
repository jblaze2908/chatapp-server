const jwt = require("jsonwebtoken");
const User = require("../models/user");
const config = require("../config");
const checkAuth = {
  express: async (req, res, next) => {
    try {
      const token = req.headers["authorization"];
      if (!token) {
        return res.status(401).json({ message: "Auth failed" });
      }
      const decodedToken = jwt.verify(token, config.JWT_KEY);
      let user = await User.findById(decodedToken._id);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      if (
        new Date(user.lastLoginTime).getTime() ===
        new Date(decodedToken.lastLoginTime).getTime()
      ) {
        req.userData = {
          _id: decodedToken._id,
          user: user,
        };
        next();
      } else {
        return res.status(440).json({ message: "Session Expired." });
      }
    } catch (error) {
      return res.status(401).json({ message: "Auth failed" });
    }
  },
  socket: async (socket, next) => {
    try {
      if (socket.handshake.query && socket.handshake.query.authorization) {
        const token = socket.handshake.query.authorization;
        const decodedToken = jwt.verify(token, config.JWT_KEY);
        let user = await User.findById(decodedToken._id);
        if (!user) {
          return res.status(404).json({ message: "User not found." });
        }
        if (
          new Date(user.lastLoginTime).getTime() ===
          new Date(decodedToken.lastLoginTime).getTime()
        ) {
          socket.userData = {
            _id: decodedToken._id,
            user: user,
          };
          next();
        } else {
          return next(new Error("Authentication error"));
        }
      } else {
        return next(new Error("Authentication error"));
      }
    } catch (error) {
      return next(new Error("Authentication error"));
    }
  },
};
module.exports = checkAuth;
