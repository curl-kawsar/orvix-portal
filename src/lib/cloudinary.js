import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dxdpgplvp',
  api_key: '239329331342886',
  api_secret: 'KyO2Qy9x9E2SASnmgQ4Yh9_DdWA',
  secure: true,
});

/**
 * Upload a file to Cloudinary
 * @param {File} file - The file to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Cloudinary upload response
 */
export async function uploadToCloudinary(file, options = {}) {
  try {
    // Convert file to base64 string for upload
    const fileBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(fileBuffer).toString('base64');
    const fileStr = `data:${file.type};base64,${base64File}`;
    
    // Set default folder if not provided
    const uploadOptions = {
      folder: options.folder || 'orvix-portal',
      ...options,
    };
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(fileStr, uploadOptions, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
    
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('File upload failed');
  }
}

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @returns {Promise<Object>} - Cloudinary delete response
 */
export async function deleteFromCloudinary(publicId) {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
    
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('File deletion failed');
  }
}

export default cloudinary; 