import { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}
import { Express } from "express-serve-static-core";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}