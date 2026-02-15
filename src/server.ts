import app from './app';
import connectDB from './config/db';
import { connectRedis } from './config/redis';
import config from './config/config';

const PORT = config.PORT;

const startServer = async () => {
    await connectDB();
    await connectRedis();

    app.listen(PORT, () => {
        console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
    });
};

startServer();
