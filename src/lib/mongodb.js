import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI 

// Global variable to cache the MongoDB connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  try {
    // If we have a connection already, return it
    if (cached.conn) {
      return cached.conn;
    }

    // If we have a promise in progress, wait for it
    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
        socketTimeoutMS: 30000, // Close sockets after 30 seconds of inactivity
        family: 4 // Use IPv4, skip trying IPv6
      };

      console.log('Connecting to MongoDB...');
      
      // Create promise with timeout
      cached.promise = Promise.race([
        mongoose.connect(MONGODB_URI, opts),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('MongoDB connection timeout')), 10000)
        )
      ])
      .then((mongoose) => {
        console.log('Connected to MongoDB');
        return mongoose;
      })
      .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
        // Reset the promise so next request tries again
        cached.promise = null;
        throw error;
      });
    }

    try {
      cached.conn = await cached.promise;
    } catch (error) {
      cached.promise = null; // Reset promise on error
      throw error; // Re-throw for the caller to handle
    }
    
    return cached.conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    // Reset the connection state
    cached.conn = null;
    cached.promise = null;
    throw error;
  }
}

export { connectToDatabase }; 