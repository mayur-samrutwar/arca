import mongoose from 'mongoose';

let cachedConnection = null;

export const connectResearchDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const uri = process.env.MONGODB_URI;
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    cachedConnection = await mongoose.connect(uri, options);
    console.log('Research DB connected successfully');
    return cachedConnection;
  } catch (error) {
    console.error('Research DB connection failed:', error);
    throw error;
  }
};

export default connectResearchDB;