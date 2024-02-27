const path = require("path");

const express = require("express");
const expressSession = require("express-session");

const db = require("./data/database");

const createSessionConfig = require("./config/session");
// const addCsrfTokenMiddleware = require("./milddlewares/csrf-token");
const checkAuthStatusMiddleware = require("./milddlewares/check-auth");
const errorHandlerMiddleware = require("./milddlewares/error-handler");
const baseRoutes = require("./routes/base.routes");
const authRoutes = require("./routes/auth.routes");
const contentsRoutes = require("./routes/contents.routes");
const objectsRoutes = require("./routes/objects.routes");
const mypageRoutes = require("./routes/mypage.routes");

let PORT = 8000;

if (process.env.PORT) {
  PORT = process.env.PORT;
}

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

const sessionConfig = createSessionConfig();

app.use(expressSession(sessionConfig));

app.use(checkAuthStatusMiddleware);

app.use(baseRoutes);
app.use(authRoutes);
app.use("/contents", contentsRoutes);
app.use(objectsRoutes);
app.use(mypageRoutes);

app.use(errorHandlerMiddleware);

db.initDb()
  .then(function () {
    app.listen(PORT);
  })
  .catch(function (error) {
    console.log("Connecting to the database failed!");
    console.log(error);
  });
