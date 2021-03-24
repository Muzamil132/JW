  
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId
  },
  created_at    : { type: Date, required: true, default: Date.now },
  text: {
    type: String,
    required: true
  },
  job_rule: {
    type: String,
 
  },

  name: {
    type: String
  },
 
  avatar: {
    type: String
  },
  likes: [
    {
      user: {
        type: Schema.Types.ObjectId
      }
      ,name:{
        type:String
      }
    }
  ],
  comments: [
    {  replies:[{

             user:{
               type:Schema.Types.ObjectId
             },
             text:String,
             name:String
             

    }],
    created_at    : { type: Date, required: true, default: Date.now },
      user: {
        type: Schema.Types.ObjectId
      },
      text: {
        type: String,
        required: true
      },
      name: {
        type: String
      },
    
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('post', PostSchema)