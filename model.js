var mongoose = require('mongoose');
const postSchema = {
  title: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    trim: true
  },
  img:
  {
    data: Buffer,
    contentType: String
  },
  like: 
  {
    type: Number,
    default: 0
  }
};

module.exports = mongoose.model('Post', postSchema);
