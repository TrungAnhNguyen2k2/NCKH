import express from "express";

const router = express.Router();
import { getSources, getSourceById, addSources, updateSource, deleteSource } from "../controllers/Source.controller.js";
import { authenticate } from "../controllers/User.controller.js";

router.get("/", authenticate(), getSources);

router.get("/:id", authenticate(), getSourceById);

router.post("/", authenticate(), addSources);

router.put("/:id", authenticate(), updateSource);

router.delete("/:id", authenticate(), deleteSource);

export default router;
