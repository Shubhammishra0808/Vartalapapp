const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/securechat';
    
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB] Warning: Could not connect to MongoDB at ${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/securechat'}.`);
    console.warn(`[MongoDB] ${error.message}. Ensure MongoDB is started or provide a cloud MONGODB_URI.`);
  }
};

module.exports = connectDB;
