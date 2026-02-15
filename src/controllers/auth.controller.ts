import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import config from '../config/config';

const generateToken = (data: any) => {
    return jwt.sign(data, config.JWT_SECRET, {
        expiresIn: '30d',
    });
};

export const signup = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'A user with this email already exists. Please log in or use a different email.' });
        }

        const user = await User.create({ name, email, password });

        res.status(201).json({
            token: generateToken({ id: user._id.toString(), email: user.email, name: user.name }),
            message: 'Account successfully created. Welcome aboard!',
        });
    } catch (error: any) {
        res.status(500).json({ message: 'An unexpected error occurred while creating your account. Please try again later.' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            res.json({
                token: generateToken({ id: user._id.toString(), email: user.email, name: user.name }),
                message: 'Login successful. Welcome back!',
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password. Please check your credentials and try again.' });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'An unexpected error occurred during login. Please try again later.' });
    }
};
