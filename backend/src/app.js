import express from "express";
import cors from "cors";
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many attempts, please try again later.' }
});

app.use('/users/login', authLimiter);
app.use('/users/signup', authLimiter);
 
import userRouter from './routes/user.route.js';
import cardRouter from './routes/card.route.js';
 
const app = express();
 
app.use(cors({
    origin: 'https://greetings-friend.netlify.app',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
 
app.use(express.json({ limit: '10mb' }));

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
 
app.use("/users", userRouter);
app.use("/", cardRouter);
 
export default app;