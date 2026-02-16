export const redisMockClient = {
    isOpen: true,
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
};

jest.mock('../../src/config/redis', () => ({
    redisClient: redisMockClient,
    connectRedis: jest.fn().mockResolvedValue(undefined),
}));
