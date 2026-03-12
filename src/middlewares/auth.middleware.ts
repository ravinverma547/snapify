// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey') as any;
            
            // Yahan ensure kar rahe hain ki 'id' hi jaye
            req.user = { id: decoded.id, role: decoded.role };
            return next();
        } catch (error) {
            return res.status(401).json({ success: false, message: "Token invalid" });
        }
    }
    if (!token) return res.status(401).json({ success: false, message: "No token found" });
};