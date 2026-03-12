import { Request, Response, NextFunction } from "express";

/**
 * Ye middleware check karega ki logged-in user ke paas 
 * required role hai ya nahi.
 * Example use: authorizeRoles("ADMIN", "MODERATOR")
 */

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    
    // 1. Check karo ki user auth middleware se pass hoke aaya hai ya nahi
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User information not found",
      });
    }

    // 2. Check karo ki user ka role allowed list mein hai
    // Note: req.user.role humne Auth middleware mein JWT se extract kiya tha
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not allowed to access this resource`,
      });
    }

    // 3. Sab sahi hai toh aage badho
    next();
  };
};