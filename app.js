const mongoose = require("mongoose");
const consola = require("consola");
const PORT = process.env.PORT || 4001;
const config = require("./config");
const server = require("./servers/express");
const socketManager = require("./servers/socket-io");
socketManager.initialise(server);
server.listen(PORT, () => {
  consola.success("Server is listening at " + PORT);
});
mongoose
  .connect(config.database, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(
    () => {
      consola.success("Connected to database");
    },
    (err) => {
      consola.error(new Error(err));
    }
  );
