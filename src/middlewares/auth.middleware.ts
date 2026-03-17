// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let token: string | undefined;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            console.warn("[AuthMiddleware] No token provided for route:", req.originalUrl);
            return res.status(401).json({ 
                success: false, 
                message: "Authentication required. Please provide a valid Bearer token." 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey') as any;
        
        if (!decoded || !decoded.id) {
            console.error("[AuthMiddleware] Token payload missing id field");
            return res.status(401).json({ 
                success: false, 
                message: "Invalid token payload." 
            });
        }

        // Populating user context
        req.user = { id: decoded.id.toString(), role: decoded.role };
        
        console.log(`[AuthMiddleware] User authenticated: ${req.user.id}`);
        next();
    } catch (error: any) {
        console.error("[AuthMiddleware] Token verification failed:", error.message);
        return res.status(401).json({ 
            success: false, 
            message: error.name === 'TokenExpiredError' ? "Token expired" : "Token invalid" 
        });
    }
};