import request from 'supertest';
import app from '../src/app';
import * as dbHandler from './setup/mongo.setup';
import { redisMockClient } from './setup/redis.setup';
import User from '../src/models/user.model';
import Task from '../src/models/task.model';
import { beforeAll, afterEach, afterAll, beforeEach, describe, it, expect, jest } from '@jest/globals';

beforeAll(async () => await dbHandler.connect());
afterEach(async () => {
    await dbHandler.clear();
    jest.clearAllMocks();
});
afterAll(async () => await dbHandler.close());

describe('Task Controller', () => {
    let token: string;
    let userId: string;
    const testUser = {
        name: 'Task Tester',
        email: 'tester@example.com',
        password: 'password123'
    };

    beforeEach(async () => {
        const signupRes = await request(app)
            .post('/api/auth/register')
            .send(testUser);
        token = signupRes.body.token;

        const user = await User.findOne({ email: testUser.email });
        userId = user!._id.toString();
    });

    describe('POST /api/tasks', () => {
        it('should create a new task', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Test Task',
                    description: 'Test Description',
                    owner: testUser.email
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.task).toHaveProperty('title', 'Test Task');
            expect(res.body.message).toMatch(/successfully created/i);

            // Should invalidate cache
            expect(redisMockClient.del).toHaveBeenCalled();
        });

        it('should return 401 if not authorized', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .send({ title: 'Unauthorized task' });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/tasks', () => {
        it('should get all tasks for logged in user', async () => {
            // Create a task first
            await Task.create({
                title: 'User Task',
                owner: testUser.email
            });

            const res = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0].title).toBe('User Task');
        });

        it('should return cached tasks if available', async () => {
            const cachedTasks = JSON.stringify([{ title: 'Cached Task', owner: testUser.email }]);
            redisMockClient.get.mockResolvedValueOnce(cachedTasks);

            const res = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body[0].title).toBe('Cached Task');
            expect(redisMockClient.get).toHaveBeenCalled();
        });
    });

    describe('PUT /api/tasks/:id', () => {
        it('should update a task', async () => {
            const task = await Task.create({
                title: 'Old Title',
                owner: testUser.email
            });

            const res = await request(app)
                .put(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'New Title' });

            expect(res.statusCode).toBe(200);
            expect(res.body.updatedTask.title).toBe('New Title');
            expect(redisMockClient.del).toHaveBeenCalledWith(`tasks:${userId}`);
        });
    });

    describe('DELETE /api/tasks/:id', () => {
        it('should delete a task', async () => {
            const task = await Task.create({
                title: 'To be deleted',
                owner: testUser.email
            });

            const res = await request(app)
                .delete(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toMatch(/removed/i);

            const foundTask = await Task.findById(task._id);
            expect(foundTask).toBeNull();
        });
    });
});
