const express =require('express');
// const auth = require('../../middleware/auth');
const User = require('../../models/User');
const router = express.Router()
const auth = require('../../middleware/auth');
const checkObjectId = require('../../middleware/idmiddleware');
const { check, validationResult } = require('express-validator');
// bring in normalize to give us a proper url, regardless of what user entered
const normalize = require('normalize-url');

const Profile = require('../../models/Profile');



router.get('/me', auth, async (req, res) => {
    try {
      const profile = await Profile.findOne({
        user: req.user.id
      }).populate('user', ['name', 'avatar']);
      
      if (!profile) {
        return res.status(400).json({ msg: 'There is no profile for this user' });
      }
  
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });


  router.post(
    '/',
    auth,
    check('status', 'Status is required').notEmpty(),
    check('skills', 'Skills is required').notEmpty(),
    async (req, res) => {
      const errors = validationResult(req);
      console.log(errors)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      // destructure the request
      const {
        website,
        skills,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook,
     
        ...rest
      } = req.body;
  
      // build a profile
      const profileFields = {
     
        user: req.user?.id,
        website:
          website && website !== ''
            ? normalize(website, { forceHttps: true })
            : '',
        skills: Array.isArray(skills)
          ? skills
          : skills.split(',').map((skill) => ' ' + skill.trim()),
        ...rest
      };
  
      // Build socialFields object
      const socialFields = { youtube, twitter, instagram, linkedin, facebook };
  
      // normalize social fields to ensure valid url
      for (const [key, value] of Object.entries(socialFields)) {
        if (value && value.length > 0)
          socialFields[key] = normalize(value, { forceHttps: true });
      }
      // add to profileFields
      profileFields.social = socialFields;
  
      try {
        // Using upsert option (creates new doc if no match is found):
        let profile = await Profile.findOneAndUpdate(

          { user: req.user?.id },
          { $set: profileFields },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        return res.json(profile);
      } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
      }
    }
  );

  router.get('/', async (req, res) => {
    try {
      const profiles = await Profile.find().populate('user', ['name', 'avatar']);
      res.json(profiles);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  

  router.get(
    '/user/:user_id',
   
    async ({ params: { user_id } }, res) => {

      try {
        // console.log(user_id)
        const profile = await Profile.findOne({
          user: user_id
        }).populate('user', ['name', 'avatar']);
  
        if (!profile) return res.status(400).json({ msg: 'Profile not found' });
  
        return res.json(profile);
      } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: 'Server error' });
      }
    }
  );

  router.delete('/', auth, async (req, res) => {
    try {
      // Remove user posts
      // Remove profile
      // Remove user
      await Promise.all([
        // Post.deleteMany({ user: req.user.id }),
        Profile.findOneAndRemove({ user: req.user.id }),
        User.findOneAndRemove({ _id: req.user.id })
      ]);
  
      res.json({ msg: 'User deleted' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });


  router.put(
    '/experience',
    auth,
    check('title', 'Title is required').notEmpty(),
    check('company', 'Company is required').notEmpty(),
    check('from', 'From date is required and needs to be from the past')
      .notEmpty()
      .custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
    async (req, res) => {

        
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      try {
        const profile = await Profile.findOne({ user: req.user.id });
  
        profile.experience.unshift(req.body);
  
        await profile.save();
  
        res.json(profile);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
    }
  );

  router.put(
    '/bio_data',
    auth,
    check('country', 'country is required').notEmpty(),
    check('job_role', 'JOB role is required').notEmpty(),
    check('about', 'about is required'),
    check('number', 'number  should be 11 digits ').isLength(11)
      .notEmpty()
    ,
    async (req, res) => {

       
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      try {
        
        const profile = await Profile.findOne({ user: req.user.id });
        if(profile){
          profile.bio=req.body
  
          await profile.save();
    
          res.json(profile);
           

        }
        else{
          res.status(400).send({msg:"First create Profile"})
        }
       
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
    }
  );
 
  router.put('/review/:id', auth, checkObjectId('id'), async (req, res) => {
    try {
      
      const {text,name} =req.body
      const profile = await Profile.findOne({user:req.params.id.toString()});
      const user = await User.findById(req.user.id);
      profile.reviews.unshift({text,name})
      
      await profile.save()
  
      // Check if the post has already been liked
         res.send(profile)
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  router.put('/follow/:id', auth, checkObjectId('id'), async (req, res) => {
    try {
      
      // const {text,name} =req.body
      const profile1 = await Profile.findOne({ user: req.user.id });
      const user = await User.findById(req.params.id);
   
      // const user = await User.findById(req.user.id);
      profile1.Follower.unshift({  

        name:user?.name,
        user:req.params.id
      })
      console.log(profile1?.Follower)
      await profile1.save()
  
      // Check if the post has already been liked
         res.send(profile1)
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  

  router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
      const foundProfile = await Profile.findOne({ user: req.user.id });
  
      foundProfile.experience = foundProfile.experience.filter(
        (exp) => exp._id.toString() !== req.params.exp_id
      );
  
      await foundProfile.save();
      return res.status(200).json(foundProfile);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: 'Server error' });
    }
  });


  router.put(
    '/education',
    auth,
    check('school', 'School is required').notEmpty(),
    check('degree', 'Degree is required').notEmpty(),
    check('fieldofstudy', 'Field of study is required').notEmpty(),
    check('from', 'From date is required and needs to be from the past')
      .notEmpty()
      .custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      try {
        const profile = await Profile.findOne({ user: req.user.id });
  
        profile.education.unshift(req.body);
  
        await profile.save();
  
        res.json(profile);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
    }
  );
  
  // @route    DELETE api/profile/education/:edu_id
  // @desc     Delete education from profile
  // @access   Private
  
  router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
      const foundProfile = await Profile.findOne({ user: req.user.id });
      foundProfile.education = foundProfile.education.filter(
        (edu) => edu._id.toString() !== req.params.edu_id
      );
      await foundProfile.save();
      return res.status(200).json(foundProfile);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: 'Server error' });
    }
  });
  
  
  
  
  

module.exports=router

// const express = require('express');

// const config = require('config');
// const router = express.Router();
// const auth = require('../../middleware/auth');
// const { check, validationResult } = require('express-validator');
// // bring in normalize to give us a proper url, regardless of what user entered
// const normalize = require('normalize-url');
// // const checkObjectId = require('../../middleware/checkObjectId');

// const Profile = require('../../models/Profile');
// const User = require('../../models/User');
// // const Post = require('../../models/Post');

// // @route    GET api/profile/me
// // @desc     Get current users profile
// // @access   Private
// router.get('/me', auth, async (req, res) => {
//   try {
//     const profile = await Profile.findOne({
//       user: req.user.id
//     }).populate('user', ['name', 'avatar']);

//     if (!profile) {
//       return res.status(400).json({ msg: 'There is no profile for this user' });
//     }

//     res.json(profile);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });