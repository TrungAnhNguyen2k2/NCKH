import express from "express";

const router = express.Router();
import { getTopics, addTopic, updateTopic, deleteTopic } from "../controllers/Topic.controller.js";
import { authenticate } from "../controllers/User.controller.js";

router.get("/", authenticate(), getTopics);

router.post("/", authenticate(), addTopic);

router.put("/:id", authenticate(), updateTopic);

router.delete("/:id", authenticate(), deleteTopic);

export default router;
