import jwt from "jsonwebtoken";

export const generateToken = (id: string, role: string) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || "default_secret", {
        expiresIn: "30d", // 30 din tak login rahega
    });
};