const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    // Use the exact connection string format from MongoDB Atlas
    const uri = process.env.MONGODB_URI;
    
    // Add connection options
    const options = {
    };

    cachedConnection = await mongoose.connect(uri, options);
    console.log('MongoDB connected successfully');
    return cachedConnection;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    // Don't exit process, let the application handle the error
    throw error;
  }
};

module.exports = connectDB;