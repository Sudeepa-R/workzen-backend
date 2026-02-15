import app from './app';
import connectDB from './config/db';
import { connectRedis } from './config/redis';
import config from './config/config';

const PORT = config.PORT;

const startServer = async () => {
    try {
        await connectDB();
        await connectRedis();

        app.listen(PORT, () => {
            console.log(`🌐 Server is running!`);
            console.log(`📡 Port: ${PORT}`);
            console.log(`⚙️  Mode: ${config.NODE_ENV}`);
        });
    } catch (error: any) {
        console.error(`❌ Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

startServer().catch(err => {
    console.error('❌ Critical failure during startup:', err);
    process.exit(1);
});
