const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const Post = require('../models/Post.model');

router.post('/', protect, async (req, res, next) => {
  try {
    const { content, image } = req.body;
    const post = await Post.create({
      user: req.user.id,
      content,
      image
    });
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username profilePicture')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this post' });
    }

    const { content, image } = req.body;
    post.content = content || post.content;
    post.image = image || post.image;

    await post.save();
    res.json(post);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/like', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.likes.includes(req.user.id)) {
      post.likes = post.likes.filter(like => like.toString() !== req.user.id);
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/comment', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.unshift({
      user: req.user.id,
      text: req.body.text
    });

    await post.save();
    res.json(post);
  } catch (err) {
    next(err);
  }
});

module.exports = router;