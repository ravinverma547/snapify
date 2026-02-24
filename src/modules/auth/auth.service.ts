import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from "../../config/prisma";

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export class AuthService {
  async register(data: any) {
    const { email, username, password, displayName } = data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        displayName: displayName || username,
      }
    });

    const token = this.generateToken(user.id, (user as any).role);

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(data: { identifier: string; password: any }) {
    const { identifier, password } = data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user) throw new Error('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error('password is incorrect');

    const token = this.generateToken(user.id, (user as any).role);

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  private generateToken(userId: string, role: string = 'USER'): string {
    return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '7d' });
  }
}