import mongoose from 'mongoose';
import config from './config';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.MONGO_URI, {
            connectTimeoutMS: 30000, // 30 seconds
            socketTimeoutMS: 45000, // 45 seconds
        });
        console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
        console.log(`📂 Database Name: ${conn.connection.name}`);
    } catch (error: any) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);

        if (error.message.includes('ECONNREFUSED')) {
            console.error('💡 TIP: This often indicates a DNS issue or firewall blocking port 27017.');
            console.error('   Check if your IP is whitelisted in MongoDB Atlas and if you have a stable internet connection.');
        }

        process.exit(1);
    }
};

export default connectDB;
