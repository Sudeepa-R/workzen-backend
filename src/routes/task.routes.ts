import express from 'express';
import {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
} from '../controllers/task.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/')
    .get(protect, getTasks)
    .post(protect, createTask);

router.route('/:id')
    .put(protect, updateTask)
    .delete(protect, deleteTask);

export default router;
