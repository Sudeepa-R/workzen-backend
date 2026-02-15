import { Request, Response } from 'express';
import User from '../models/user.model';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ message: 'An error occurred while fetching users. Please try again later.' });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'The requested user was not found.' });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'An error occurred while fetching the user. Please try again later.' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'A user with this email already exists. Please use a different email.' });
        }
        const user = await User.create({ name, email, password });
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            message: 'User successfully created.'
        });
    } catch (error: any) {
        res.status(500).json({ message: 'An error occurred while creating the user. Please try again later.' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                message: 'User successfully updated.'
            });
        } else {
            res.status(404).json({ message: 'The user you are trying to update does not exist.' });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'An error occurred while updating the user. Please try again later.' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'User successfully removed.' });
        } else {
            res.status(404).json({ message: 'The user you are trying to delete does not exist.' });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'An error occurred while deleting the user. Please try again later.' });
    }
};
