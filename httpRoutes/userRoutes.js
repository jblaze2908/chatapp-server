const express = require("express");
const router = express.Router();
const userHandler = require("../controllers/userHandler");
const chatHandler = require("../controllers/chatHandler");
const checkAuth = require("../middleware/checkAuth").express;
const upload = require("../middleware/multer");
router.post("/login", userHandler.login);
router.get("/logout", checkAuth, userHandler.logout);
router.post("/register", userHandler.register);
router.get("/fetch_chats", checkAuth, chatHandler.fetchChats);
router.get(
  "/fetch_details_by_email/:email",
  checkAuth,
  chatHandler.fetchDetailsByEmail
);
router.post(
  "/update_profile",
  checkAuth,
  upload.single("pfp"),
  userHandler.updateProfile
);
module.exports = router;
