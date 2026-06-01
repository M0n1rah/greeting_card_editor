import { Card } from "../models/card.model.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2, BUCKET_NAME, PUBLIC_URL } from "../config/r2.js";
import { v4 as uuidv4 } from "uuid";

const createCard = async (req, res) => {
    try {
        const {name, description, age} = req.body;

        if(!name || !description || !age) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

            const post = await Post.create({ name, description, age });

            res.status(201).json({
                message: "Post successful."
            });

    } catch (error) {
        res.status(500).json({
            message: "Internal server error", error
        });
    }
}

const getCard = async(req, res) => {
    try {
        const posts = await Post.find();
        res.status(200).json(posts);

    } catch (error) {
        res.status(500).json({
            message: "Internal server error", error: error.message
        });
    }
}

const getCardById = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: "Card not found." });
    res.json({ r2Url: card.r2Url });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch card." });
  }
};

const saveCard = async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) return res.status(400).json({ message: "No image data provided." });

    const buffer   = Buffer.from(imageBase64, "base64");
    const fileName = `cards/${uuidv4()}.jpeg`;

    await r2.send(new PutObjectCommand({
      Bucket:      BUCKET_NAME,
      Key:         fileName,
      Body:        buffer,
      ContentType: mimeType,
    }));

    const r2Url = `${PUBLIC_URL}/${fileName}`;

    const card = await Card.create({ r2Url });
    res.json({ success: true, cardId: card._id });

  } catch (err) {
    console.error("Save card error:", err);
    res.status(500).json({ message: "Failed to save card." });
  }
};

export {
    createCard,
    getCard,
    getCardById,
    saveCard
}