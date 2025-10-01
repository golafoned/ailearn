import { Router } from "express";
import { getPublicUser } from "../controllers/userPublicController.js";

const router = Router();

router.get("/:id", getPublicUser);

export default router;
