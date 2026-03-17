import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// --- REGISTER ---
export const register = async (req: Request, res: Response) => {
    try {
        const { username, email, password, displayName } = req.body;

        // 1. Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] }
        });

        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create User
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                displayName: displayName || username
            }
        });

        res.status(201).json({ success: true, message: "User registered successfully" });
    } catch (error: any) {
        console.error("[AuthController.register] Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- LOGIN ---
export const login = async (req: Request, res: Response) => {
    try {
        const { identifier, password } = req.body; // identifier = email or username

        // 1. Find user by email OR username
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials (User not found)" });
        }

        // 2. Check Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials (Password mismatch)" });
        }

        // 3. Generate Token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET || 'supersecretkey',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: `Welcome back, ${user.username}!`,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error: any) {
        console.error("[AuthController.login] Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};