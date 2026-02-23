// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database connection
mongoose.connect('mongodb://localhost:27017/streaming-service', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscription: { 
    type: String, 
    enum: ['free', 'basic', 'premium'], 
    default: 'free' 
  },
  watchHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Video Schema
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  duration: { type: Number }, // in seconds
  genre: [{ type: String }],
  rating: { type: String, enum: ['G', 'PG', 'PG-13', 'R', 'NC-17'] },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
  isPublished: { type: Boolean, default: true },
  subscriptionTier: { 
    type: String, 
    enum: ['free', 'basic', 'premium'], 
    default: 'free' 
  }
});

const Video = mongoose.model('Video', videoSchema);

// Comment Schema
const commentSchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Comment = mongoose.model('Comment', commentSchema);

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.fieldname === 'video' ? 'uploads/videos' : 'uploads/thumbnails';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// JWT Secret
const JWT_SECRET = 'your-secret-key-change-in-production';

// Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) throw new Error();
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// ========== AUTH ROUTES ==========

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    
    res.status(201).json({ 
      user: { id: user._id, username: user.username, email: user.email, subscription: user.subscription },
      token 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    
    res.json({ 
      user: { id: user._id, username: user.username, email: user.email, subscription: user.subscription },
      token 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authenticate, async (req, res) => {
  res.json({ 
    user: { 
      id: req.user._id, 
      username: req.user.username, 
      email: req.user.email, 
      subscription: req.user.subscription 
    } 
  });
});

// ========== VIDEO ROUTES ==========

// Upload video
app.post('/api/videos/upload', authenticate, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, genre, rating, subscriptionTier } = req.body;
    
    if (!req.files.video) {
      return res.status(400).json({ error: 'Video file is required' });
    }
    
    const video = new Video({
      title,
      description,
      videoUrl: `/uploads/videos/${req.files.video[0].filename}`,
      thumbnailUrl: req.files.thumbnail ? `/uploads/thumbnails/${req.files.thumbnail[0].filename}` : null,
      genre: genre ? JSON.parse(genre) : [],
      rating,
      subscriptionTier: subscriptionTier || 'free',
      uploadedBy: req.user._id
    });
    
    await video.save();
    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all videos
app.get('/api/videos', async (req, res) => {
  try {
    const { genre, search, page = 1, limit = 20 } = req.query;
    
    let query = { isPublished: true };
    
    if (genre) {
      query.genre = genre;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const videos = await Video.find(query)
      .populate('uploadedBy', 'username')
      .sort({ uploadedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Video.countDocuments(query);
    
    res.json({
      videos,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single video
app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate('uploadedBy', 'username');
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update video views
app.post('/api/videos/:id/view', authenticate, async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    
    // Add to watch history
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { watchHistory: video._id }
    });
    
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like video
app.post('/api/videos/:id/like', authenticate, async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to favorites
app.post('/api/videos/:id/favorite', authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { favorites: req.params.id }
    });
    
    res.json({ message: 'Added to favorites' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove from favorites
app.delete('/api/videos/:id/favorite', authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { favorites: req.params.id }
    });
    
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user favorites
app.get('/api/users/favorites', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    res.json(user.favorites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get watch history
app.get('/api/users/history', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('watchHistory');
    res.json(user.watchHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== COMMENT ROUTES ==========

// Add comment
app.post('/api/videos/:id/comments', authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    
    const comment = new Comment({
      videoId: req.params.id,
      userId: req.user._id,
      text
    });
    
    await comment.save();
    await comment.populate('userId', 'username');
    
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get comments for video
app.get('/api/videos/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ videoId: req.params.id })
      .populate('userId', 'username')
      .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== SUBSCRIPTION ROUTES ==========

// Update subscription
app.post('/api/users/subscription', authenticate, async (req, res) => {
  try {
    const { tier } = req.body;
    
    if (!['free', 'basic', 'premium'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { subscription: tier },
      { new: true }
    );
    
    res.json({ subscription: user.subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RECOMMENDATION ROUTES ==========

// Get recommended videos
app.get('/api/videos/recommended', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('watchHistory');
    
    // Get genres from watch history
    const watchedGenres = user.watchHistory.flatMap(v => v.genre);
    const genreCounts = {};
    watchedGenres.forEach(g => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
    
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);
    
    const recommendations = await Video.find({
      genre: { $in: topGenres },
      _id: { $nin: user.watchHistory }
    })
      .limit(10)
      .sort({ views: -1, likes: -1 });
    
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});