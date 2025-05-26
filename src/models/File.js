import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a file name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    folder: {
      type: String,
      default: 'general',
    },
    tags: [String],
    isPublic: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  { timestamps: true }
);

// Add text search index
FileSchema.index({ 
  name: 'text', 
  description: 'text',
  tags: 'text' 
});


// Create the model if it doesn't exist already
const File = mongoose.models.File || mongoose.model('File', FileSchema);

export default File; 