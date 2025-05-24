import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const SkillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  proficiency: {
    type: Number,
    min: 1,
    max: 100,
    default: 70
  },
  yearsOfExperience: {
    type: Number,
    default: 1
  }
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password should be at least 8 characters long'],
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    enum: ['development', 'design', 'marketing', 'hr', 'finance', 'management', 'executive'],
    default: 'development'
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'developer', 'designer', 'marketer', 'support'],
    default: 'developer'
  },
  bio: {
    type: String
  },
  avatar: {
    type: String
  },
  skills: [SkillSchema],
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpiry: Date
}, {
  timestamps: true
});

// Hash the password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Create the model if it doesn't exist
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User; 