const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbPassword = process.env.MONGODB_PASSWORD
    const uri = `mongodb+srv://pineapple:${dbPassword}@cluster0.dttqzen.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
    
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;