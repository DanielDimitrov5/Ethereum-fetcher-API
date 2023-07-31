import { NextFunction } from "express";
import jwt from "jsonwebtoken";

import dotenv from 'dotenv';
dotenv.config();

export const authenticateToken = (req: any, res: any, next: NextFunction) => {
    const secretKey = process.env.SECRET_KEY || 'secret' as string;

    const headers = req.headers;

    const token = headers.authorization?.split(' ')[1] || headers.auth_token;
    if (!token) return res.status(401).json({ message: 'Authentication token missing' });

    jwt.verify(token, secretKey, (err: any, decoded: any) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token', error: err.message });

        req.username = (decoded as { username: string }).username;
        next();
    });
}
