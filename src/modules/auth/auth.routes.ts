import { Router } from 'express';
// Functions ko brackets {} mein import karo
import { register, login } from './auth.controller'; 

const router = Router();

// Yahan seedha functions pass karo, 'new AuthController()' ki zaroorat nahi hai
router.post('/register', register);
router.post('/login', login);

export default router;