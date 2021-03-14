const express = require("express");
const router = express.Router();
const chatHandler = require("../controllers/chatHandler");
const checkAuth = require("../middleware/checkAuth").express;
const upload = require("../middleware/multer");
router.post(
  "/upload_attachment",
  checkAuth,
  upload.single("img"),
  chatHandler.uploadAttachment
);
module.exports = router;
