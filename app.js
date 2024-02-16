const path = require("path");

const express = require("express");
const expressSession = require("express-session");

const createSessionConfig = require("./config/session");
const baseRoutes = require("./routes/base.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

const sessionConfig = createSessionConfig();

app.use(expressSession(sessionConfig));

app.use(baseRoutes);
app.use(authRoutes);

app.listen(8000);