import { Request, Response } from 'express';
import Task from '../models/task.model';
import { redisClient } from '../config/redis';

interface AuthRequest extends Request {
    user?: any;
}

// @desc    Get all tasks for logged in user
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user._id.toString();
        const cacheKey = `tasks:${userId}`;

        // Check Redis cache if connected
        if (redisClient.isOpen) {
            const cachedTasks = await redisClient.get(cacheKey);
            if (cachedTasks) {
                console.log('Serving from cache');
                return res.json(JSON.parse(cachedTasks));
            }
        }

        const tasks = await Task.find({ owner: req.user._id });

        // Set cache if connected
        if (redisClient.isOpen) {
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(tasks));
        }

        res.json(tasks);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, status, dueDate } = req.body;

        const task = await Task.create({
            title,
            description,
            status,
            dueDate,
            owner: req.user._id,
        });

        // Invalidate cache if connected
        if (redisClient.isOpen) {
            await redisClient.del(`tasks:${req.user._id}`);
        }

        res.status(201).json(task);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req: AuthRequest, res: Response) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // Invalidate cache if connected
        if (redisClient.isOpen) {
            await redisClient.del(`tasks:${req.user._id}`);
        }

        res.json(updatedTask);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req: AuthRequest, res: Response) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await task.deleteOne();

        // Invalidate cache if connected
        if (redisClient.isOpen) {
            await redisClient.del(`tasks:${req.user._id}`);
        }

        res.json({ message: 'Task removed' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
