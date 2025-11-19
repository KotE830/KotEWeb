const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

const PORT = 8080;

const discordRoutes = require("./discord/discord.routes");

app.listen(PORT, function () {
  console.log(`server is running on ${PORT}`);
});

app.use(cors());

app.use(express.static(path.join(__dirname, "build")));

app.use(discordRoutes);

app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "build/index.html"));
});
