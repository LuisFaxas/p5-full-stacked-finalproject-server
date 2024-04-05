// routes/comments.js
import express from 'express';
import { getComments, createComment, updateComment, deleteComment } from '../controllers/comments.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// Route for getting comments for a post
router.get('/', getComments);

// Route for creating a new comment on a post
router.post('/', verifyToken, createComment);

// Route for updating a comment
router.patch('/:id', verifyToken, updateComment);

// Route for deleting a comment
router.delete('/:id', verifyToken, deleteComment);


export default router;