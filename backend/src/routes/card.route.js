import { Router } from "express";
import { saveCard, getCardById } from "../controllers/card.controller.js";

const router = new Router();

router.post("/cards/save", saveCard);
router.get("/cards/:id", getCardById);

export default router;  