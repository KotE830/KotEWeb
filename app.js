const path = require("path");

const express = require("express");
const expressSession = require("express-session");

const baseRoutes = require("./routes/base.routes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

app.use(baseRoutes);

app.listen(8000);