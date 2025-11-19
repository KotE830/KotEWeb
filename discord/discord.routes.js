const express = require("express");

const discordController = require("./index");
const webhookController = require("./webhook/webhook.controller");

const router = express.Router();

router.get("/isboton", discordController.isBotOn);
router.get("/boton", discordController.botOn);
router.get("/botoff", discordController.botOff);

router.post("/songs/addqueue", webhookController.Play);
router.get("/queue", webhookController.Queue);

module.exports = router;