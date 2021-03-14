const express = require("express");
const app = express();
const config = require("../config");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const UserRoutes = require("../httpRoutes/userRoutes");
const ChatRoutes = require("../httpRoutes/chatRoutes");
const path = require("path");
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: false,
    parameterLimit: 50000,
  })
);
let accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
  flags: "a", //append
});
app.use(morgan("short", { stream: accessLogStream }));
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
// app.set("port", PORT);
app.use("/user", UserRoutes);
app.use("/chat", ChatRoutes);
app.get("/", async (req, res) => {
  return res.status(200).json({ message: "working" });
});
let server;
if (config.devMode) {
  server = require("http").createServer(app);
} else {
  const serverOptions = {
    key: fs.readFileSync(
      "/etc/letsencrypt/live/" + config.domain + "/privkey.pem"
    ),
    cert: fs.readFileSync(
      "/etc/letsencrypt/live/" + config.domain + "/cert.pem"
    ),
  };
  server = require("https").createServer(serverOptions, app);
}

module.exports = server;
