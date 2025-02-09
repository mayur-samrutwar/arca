const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    // Use the exact connection string format from MongoDB Atlas
    const uri = 'mongodb+srv://pineapple:N7RltA7LiYRlAptE@cluster0.dttqzen.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    // Add connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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