import mongoose from 'mongoose';

const commentSchema = mongoose.Schema({
  text: { type: String, required: true },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;