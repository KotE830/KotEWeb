import express from "express";

import discordController from "./controller/discord.controller";
import webhookController from "./controller/webhook.controller";
import * as authController from "./controller/auth.controller";
import * as discordApiController from "./controller/discord-api.controller";
import trackController from "./controller/track.controller";
import tagController from "./controller/tag.controller";

const router = express.Router();

// 기존 Discord 봇 제어 엔드포인트
router.get("/isboton", discordController.isBotOn);
router.get("/boton", discordController.botOn);
router.get("/botoff", discordController.botOff);
router.get("/ping", discordController.ping);
router.get("/bot-config", discordController.getBotConfig);

// 기존 웹훅 엔드포인트
router.post("/songs/addqueue", webhookController.Play);
router.post("/songs/removequeue", webhookController.RemoveFromQueue);
router.get("/tracks/resolve", webhookController.ResolveTrack);
router.get("/queue", webhookController.Queue);
router.post("/join", webhookController.Join);
router.post("/leave", webhookController.Leave);
router.get("/isinchannel", webhookController.isInChannel);
router.get("/active-channels", webhookController.getAllActiveChannels);
router.post("/set-current-control", webhookController.setCurrentControl);
router.get("/get-current-control", webhookController.getCurrentControl);
router.post("/repeat", webhookController.setRepeat);
router.post("/clear-queue", webhookController.clearQueue);

// OAuth2 인증 엔드포인트
router.get("/auth/login", authController.login);
router.get("/auth/callback", authController.callback);
router.get("/auth/logout", authController.logout);
router.get("/auth/check", authController.checkAuth);

// Discord API 엔드포인트
router.get("/discord/guilds", discordApiController.getUserGuilds);
router.get("/discord/guilds/:guildId/bot-status", discordApiController.getBotStatus);
router.get("/discord/guilds/:guildId/channels", discordApiController.getVoiceChannels);
router.get("/discord/invite/:guildId", discordApiController.generateInviteLink);

// Tracks API 엔드포인트 (legacy: /songs 경로 유지)
router.get("/songs", trackController.getTracks);
router.get("/songs/:id", trackController.getTrackById);
router.post("/songs", trackController.createTrack);
router.post("/songs/check", trackController.checkTrack);
router.put("/songs/:id", trackController.updateTrack);
router.delete("/songs/:id", trackController.deleteTrack);

// Tags API 엔드포인트
router.get("/tags", tagController.getTags);
router.get("/tags/:id", tagController.getTagById);
router.post("/tags", tagController.createTag);
router.put("/tags/:id", tagController.updateTag);
router.delete("/tags/:id", tagController.deleteTag);

export default router; 