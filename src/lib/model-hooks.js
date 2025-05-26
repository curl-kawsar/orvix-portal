import { clearCache, invalidateCache } from './cache';

/**
 * Adds cache invalidation hooks to a Mongoose model
 * @param {Model} model - The Mongoose model to add hooks to
 * @param {string} modelName - The name of the model for cache key generation
 */
export const addCacheInvalidationHooks = (model, modelName) => {
  // Function to create cache key pattern for the model
  const getCacheKeyPattern = (id = null) => {
    if (id) {
      return `${modelName}-${id}`;
    }
    return `${modelName}`;
  };

  // Post-save hook
  model.schema.post('save', async function() {
    try {
      // Invalidate specific cache for this document
      await invalidateCache(getCacheKeyPattern(this._id));
      
      // Invalidate list caches that might include this model
      await invalidateCache(getCacheKeyPattern());
      
      // For dashboard data which combines multiple models
      await invalidateCache('dashboard');
    } catch (error) {
      console.error(`Error invalidating cache on save for ${modelName}:`, error);
    }
  });

  // Post-remove hook
  model.schema.post('remove', async function() {
    try {
      // Invalidate specific cache for this document
      await invalidateCache(getCacheKeyPattern(this._id));
      
      // Invalidate list caches that might include this model
      await invalidateCache(getCacheKeyPattern());
      
      // For dashboard data which combines multiple models
      await invalidateCache('dashboard');
    } catch (error) {
      console.error(`Error invalidating cache on remove for ${modelName}:`, error);
    }
  });

  // Post-update hook
  model.schema.post(['updateOne', 'updateMany', 'findOneAndUpdate'], async function() {
    try {
      // Since we don't know which documents were updated, invalidate all caches for this model
      await invalidateCache(getCacheKeyPattern());
      
      // For dashboard data which combines multiple models
      await invalidateCache('dashboard');
    } catch (error) {
      console.error(`Error invalidating cache on update for ${modelName}:`, error);
    }
  });

  // Post-delete hook
  model.schema.post(['deleteOne', 'deleteMany', 'findOneAndDelete'], async function() {
    try {
      // Since we don't know which documents were deleted, invalidate all caches for this model
      await invalidateCache(getCacheKeyPattern());
      
      // For dashboard data which combines multiple models
      await invalidateCache('dashboard');
    } catch (error) {
      console.error(`Error invalidating cache on delete for ${modelName}:`, error);
    }
  });

  return model;
};

/**
 * Clears all cache data - useful for admin operations or when major data changes occur
 */
export const clearAllCache = async () => {
  try {
    await clearCache();
    console.log('All cache cleared successfully');
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}; 