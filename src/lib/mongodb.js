import mongoose from 'mongoose';
import { addCacheInvalidationHooks } from './model-hooks';
import User from '@/models/User';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Client from '@/models/Client';
import TimeEntry from '@/models/TimeEntry';
import Invoice from '@/models/Invoice';
import Expense from '@/models/Expense';

const MONGODB_URI = process.env.MONGODB_URI 

// Global variable to cache the MongoDB connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, hooksApplied: false };
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
      
      // Apply cache invalidation hooks to models if not already applied
      if (!cached.hooksApplied) {
        applyModelHooks();
        cached.hooksApplied = true;
      }
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
    cached.hooksApplied = false;
    throw error;
  }
}

/**
 * Apply cache invalidation hooks to all models
 */
function applyModelHooks() {
  try {
    console.log('Applying cache invalidation hooks to models...');
    
    // Apply hooks to each model
    addCacheInvalidationHooks(User, 'user');
    addCacheInvalidationHooks(Project, 'project');
    addCacheInvalidationHooks(Task, 'task');
    addCacheInvalidationHooks(Client, 'client');
    addCacheInvalidationHooks(TimeEntry, 'timeentry');
    addCacheInvalidationHooks(Invoice, 'invoice');
    addCacheInvalidationHooks(Expense, 'expense');
    
    console.log('Cache invalidation hooks applied successfully');
  } catch (error) {
    console.error('Error applying cache invalidation hooks:', error);
  }
}

export { connectToDatabase }; 