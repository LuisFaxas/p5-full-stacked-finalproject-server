// controllers/comments.js
import mongoose from 'mongoose';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';


// Get comments for a post
export const getComments = async (req, res) => {
  console.log('getComments hit', req.params);
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId }).populate('creator', 'firstName lastName picturePath');
    res.status(200).json(comments);
  } catch (error) {
    console.error('Error in getComments:', error);
    res.status(500).json({ message: "server error" });
  }
};


// Create a new comment on a post
export const createComment = async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(404).send('No post with that id');
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    const newComment = new Comment({ text, creator: req.user.id, post: postId });
    await newComment.save();
    
    // Populate the creator field before sending the response
    const populatedComment = await Comment.findById(newComment._id).populate('creator', 'firstName lastName picturePath');
    
    post.comments.push(newComment._id);
    await post.save();

    res.status(201).json(populatedComment); // Send the populated comment as the response
  } catch (error) {
    console.error('Error in createComment:', error);
    res.status(409).json({ message: error.message });
  }
};
// Update a comment
export const updateComment = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('No comment with that id');

  const updatedComment = { text, _id: id };

  await Comment.findByIdAndUpdate(id, updatedComment, { new: true });

  res.json(updatedComment);
};

export const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user && req.user.id; // Ensure req.user.id is defined
    
    // Log the user ID obtained from the token
    console.log("User ID from token:", userId);
    
    // If userId is not defined, return an error
    if (!userId) {
      return res.status(401).send('Authentication error: User ID is missing.');
    }
    
    // Fetch the comment from the database
    const comment = await Comment.findById(commentId).exec();
    
    // If comment not found, return an error
    if (!comment) {
      return res.status(404).send('Comment not found');
    }
    
    // Ensure comment.creator is defined
    if (!comment.creator) {
      return res.status(404).send('Comment creator information is missing');
    }
    
    // Compare the comment's creator ID with the logged-in user's ID
    if (comment.creator.toString() !== userId.toString()) {
      return res.status(403).send('User is not authorized to delete this comment');
    }
    
    // Delete the comment if the user is authorized
    await Comment.findByIdAndDelete(commentId).exec();
    
    res.status(200).send('Comment deleted successfully');
  } catch (error) {
    // Handle any other errors
    res.status(500).send(error.message);
  }
};