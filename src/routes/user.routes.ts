import express from 'express';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/')
    .get(protect,getUsers)
    .post(protect,createUser);

router.route('/:id')
    .get(getUserById)
    .put(protect,updateUser)
    .delete(protect,deleteUser);

export default router;
