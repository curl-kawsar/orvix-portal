import mongoose from 'mongoose';

// Cache collection for storing query results
const cacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // TTL index: cache expires after 5 minutes (300 seconds)
  },
});

// Create TTL index on createdAt field
cacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

// Create index on key for faster lookups
cacheSchema.index({ key: 1 });

const Cache = mongoose.models.Cache || mongoose.model('Cache', cacheSchema);

/**
 * Get cached data or execute the query and cache the result
 * @param {string} key - Unique key for the cache entry
 * @param {Function} queryFn - Function that returns a Promise with the data to cache
 * @param {number} ttl - Time to live in seconds (optional, defaults to 300s/5min)
 * @returns {Promise<any>} - The cached or freshly queried data
 */
export const getCachedData = async (key, queryFn, ttl = 300) => {
  try {
    // Check if data exists in cache
    const cachedData = await Cache.findOne({ key });
    
    // If cached data exists and is not expired, return it
    if (cachedData) {
      return cachedData.value;
    }
    
    // Otherwise, execute the query
    const freshData = await queryFn();
    
    // Store the result in cache with the specified TTL
    await Cache.findOneAndUpdate(
      { key },
      { 
        key, 
        value: freshData,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );
    
    return freshData;
  } catch (error) {
    console.error('Cache error:', error);
    // If caching fails, still return the data from the original query
    return queryFn();
  }
};

/**
 * Invalidate a specific cache entry
 * @param {string} key - The key of the cache entry to invalidate
 */
export const invalidateCache = async (key) => {
  try {
    await Cache.deleteOne({ key });
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
};

/**
 * Clear all cached data
 */
export const clearCache = async () => {
  try {
    await Cache.deleteMany({});
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}; 