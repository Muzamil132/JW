const express = require('express');
const router = express.Router();
const mongoose =require("mongoose")
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const checkObjectId = require('../../middleware/idmiddleware');


router.post(
    '/',
    auth,
    [check('text', 'Text is required').notEmpty()],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      try {
        const user = await User.findById(req.user.id).select('-password');
        console.log(user)
        const profile = await Profile.findOne({user:req.user.id})
         
  
        const newPost = new Post({
        
          job_role:profile?.bio.job_role,
          text: req.body.text,
         
          name: user.name,
          avatar: user.avatar,
          user: req.user.id
        });
  
        const post = await newPost.save();
  
        res.json(post);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
      
      console.log(req.body)
    }
  );

  router.get('/', auth, async (req, res) => {
    try {
      const posts = await Post.find({})
      console.log(req.user)
      res.json(posts);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  router.get('/:id', auth, checkObjectId('id'), async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
  
      if (!post) {
        return res.status(404).json({ msg: 'Post not found' });
      }
  
      res.json(post);
    } catch (err) {
      console.error(err.message);
  
      res.status(500).send('Server Error');
    }
  });

  router.delete('/:id', [auth, checkObjectId('id')], async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
  
      if (!post) {
        return res.status(404).json({ msg: 'Post not found' });
      }
  
      // Check user
      if (post.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User not authorized' });
      }
  
      await post.remove();
  
      res.json({ msg: 'Post removed' });
    } catch (err) {
      console.error(err.message);
  
      res.status(500).send('Server Error');
    }
  });


  router.put('/like/:id', auth, checkObjectId('id'), async (req, res) => {
    console.log(req.params.id)
    try {
      const post = await Post.findById(req.params.id);
      const user = await User.findById(req.user.id);
   
       console.log(user)
      // Check if the post has already been liked
      if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
        // return res.status(400).json({ msg: 'Post already liked' });
          post.likes.unshift({ user: req.user.id ,
                               name:user.name
          
          });
      }
      else{
             post.likes =post.likes.filter((like)=>like.user.toString()!==req.user.id)
             console.log(post.likes)
         
      }

  
    
  
      await post.save();
  
      return res.json(post.likes);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  // @route    PUT api/posts/unlike/:id
  // @desc     Unlike a post
  // @access   Private
  // router.put('/deslike/:id', auth, checkObjectId('id'), async (req, res) => {
  //   try {
  //     const post = await Post.findById(req.params.id);
  
  //     // Check if the post has not yet been liked
  //     if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
  //       return res.status(400).json({ msg: 'Post has not yet been liked' });
  //     }
  
  //     // remove the like
  //     post.likes = post.likes.filter(
  //       ({ user }) => user.toString() !== req.user.id
  //     );
  
  //     await post.save();
  
  //     return res.json(post.likes);
  //   } catch (err) {
  //     console.error(err.message);
  //     res.status(500).send('Server Error');
  //   }
  // });

  router.post(
    '/comment/:id',
    auth,
    checkObjectId('id'),
    check('text', 'Text is required').notEmpty(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      try {
        const user = await User.findById(req.user.id).select('-password');
        const profile = await Profile.findOne({user:req.user.id})
        const post = await Post.findById(req.params.id);
  
        const newComment = {
        
          text: req.body.text,
          name: user.name,
          avatar: user.avatar,
          user: req.user.id
        };
  
        post.comments.unshift(newComment);
  
        await post.save();
  
        res.json(post.comments);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
    }
  );
  
  // @route    DELETE api/posts/comment/:id/:comment_id
  // @desc     Delete comment
  // @access   Private
  router.delete('/comment/:id/:comment_id', auth, async (req, res) => {

    console.log(req.params.id)
    try {
      const post = await Post.findById(req.params.id);
          console.log(post)
      // Pull out comment
      const comment = post.comments.find(
        (comment) => comment.id === req.params.comment_id
      );
    
      // Make sure comment exists
      if (!comment) {
        return res.status(404).json({ msg: 'Comment does not exist' });
      }
      // Check user
      if (comment.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User not authorized' });
      }
  
      post.comments = post.comments.filter(
        ({ id }) => id !== req.params.comment_id
      );
     
      await post.save();
      console.log(post.comments)
      return res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server Error');
    }
  });


  router.post(
    '/comment/:id/replies/:id',
    auth,
    checkObjectId('id'),
    check('text', 'Text is required').notEmpty(),
    async (req, res) => {

      console.log(req.params)
      console.log(req.body)
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.body.id);
        console.log(post)
        const comment = post.comments.find(
          (comment) => comment.id === req.params.id
        );

        console.log(comment)
         
        // const newComment = {
        //   text: req.body.text,
        //   name: user.name,
        //   avatar: user.avatar,
        //   user: req.user.id
        // };
  
        // post.comments.unshift(newComment);
  
        // await post.save();
  
        // res.json(post.comments);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
    }
  );
  
  module.exports = router;