import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

// Error 1 Fix: 'z.AnyZodObject' ki jagah 'z.ZodSchema' ya direct object type use karna
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      return next(); 
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          // Error 2 & 3 Fix: 'issues' use karna aur proper mapping
          errors: error.issues.map((err) => ({
            field: err.path.join("."), 
            message: err.message,
          })),
        });
      }
      
      return res.status(500).json({
        success: false,
        message: "Internal Server Error during validation",
      });
    }
  };
};