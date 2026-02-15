import e, { Request, Response } from 'express';
import Task from '../models/task.model';
import { redisClient } from '../config/redis';
import config from '../config/config';
import { jwtDecode } from 'jwt-decode';

interface AuthRequest extends Request {
    user?: any;
}

const getLoggedInUserId = (req: AuthRequest): string => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        throw new Error('No token provided');
    }
    const decoded: any = jwtDecode(token);
    return decoded.id;
}

const getLoggedInUserEmail = (req: AuthRequest): string => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        throw new Error('No token provided');
    }
    const decoded: any = jwtDecode(token);
    return decoded.email;
}

export const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const userId = getLoggedInUserId(req);
        const cacheKey = `tasks:${userId}`;

        if (redisClient.isOpen) {
            const cachedTasks = await redisClient.get(cacheKey);
            if (cachedTasks && cachedTasks.length > 0) {
                console.log('Serving from cache');
                return res.json(JSON.parse(cachedTasks));
            }
        }

        const userEmail = getLoggedInUserEmail(req);
        const tasks = await Task.find({ owner: userEmail }).sort({ createdAt: -1 });

        if (redisClient.isOpen) {
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(tasks));
        }

        res.json(tasks);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'An error occurred while fetching tasks. Please try again later.' });
    }
};

export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, status, owner, dueDate } = req.body;

        const task = await Task.create({
            title,
            description,
            status,
            dueDate,
            owner,
        });

        if (redisClient.isOpen) {
            await redisClient.del(`tasks:${getLoggedInUserId(req)}`);
        }

        res.status(201).json({
            task,
            message: 'Task successfully created.',
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'An error occurred while creating the task. Please check your input and try again.' });
    }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'The task you are trying to update does not exist.' });
        }

        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (redisClient.isOpen) {
            await redisClient.del(`tasks:${getLoggedInUserId(req)}`);
        }

        res.json({
            updatedTask,
            message: 'Task successfully updated.',
        });
    } catch (error: any) {
        res.status(400).json({ message: 'An error occurred while updating the task. Please try again later.' });
    }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'The task you are trying to delete does not exist.' });
        }

        await task.deleteOne();

        if (redisClient.isOpen) {
            await redisClient.del(`tasks:${getLoggedInUserId(req)}`);
        }

        res.json({ message: 'Task successfully removed.' });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'An error occurred while deleting the task. Please try again later.' });
    }
};
