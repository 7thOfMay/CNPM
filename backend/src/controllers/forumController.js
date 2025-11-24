const { forumPosts, forumComments, users } = require('../models/dataStore');

let forumPostIdCounter = 1;
let forumCommentIdCounter = 1;

exports.getPosts = (req, res) => {
    const { category, limit } = req.query;
    
    let posts = forumPosts.map(post => ({
        ...post,
        author: users.find(u => u.id === post.userId),
        commentsCount: forumComments.filter(c => c.postId === post.id).length
    }));
    
    if (category) {
        posts = posts.filter(p => p.category === category);
    }
    
    if (limit) {
        posts = posts.slice(0, parseInt(limit));
    }
    
    // Sort by newest first
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(posts);
};

exports.createPost = (req, res) => {
    const { title, content, category } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content required' });
    }
    
    const post = {
        id: forumPostIdCounter++,
        userId: req.user.id,
        title,
        content,
        category: category || 'General',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    forumPosts.push(post);
    
    res.status(201).json({
        message: 'Post created successfully',
        post: {
            ...post,
            author: users.find(u => u.id === req.user.id)
        }
    });
};

exports.getComments = (req, res) => {
    const postId = parseInt(req.params.id);
    
    const comments = forumComments
        .filter(c => c.postId === postId)
        .map(comment => ({
            ...comment,
            author: users.find(u => u.id === comment.userId)
        }));
    
    res.json(comments);
};

exports.createComment = (req, res) => {
    const postId = parseInt(req.params.id);
    const { content } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Content required' });
    }
    
    const post = forumPosts.find(p => p.id === postId);
    if (!post) {
        return res.status(404).json({ error: 'Post not found' });
    }
    
    const comment = {
        id: forumCommentIdCounter++,
        postId,
        userId: req.user.id,
        content,
        createdAt: new Date().toISOString()
    };
    
    forumComments.push(comment);
    
    res.status(201).json({
        message: 'Comment added successfully',
        comment: {
            ...comment,
            author: users.find(u => u.id === req.user.id)
        }
    });
};

exports.deletePost = (req, res) => {
    const postId = parseInt(req.params.id);
    const postIndex = forumPosts.findIndex(p => p.id === postId);
    
    if (postIndex === -1) {
        return res.status(404).json({ error: 'Post not found' });
    }
    
    const post = forumPosts[postIndex];
    
    // Only author or admin can delete
    if (post.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to delete this post' });
    }
    
    forumPosts.splice(postIndex, 1);
    
    // Also delete associated comments
    const commentIndices = forumComments
        .map((c, i) => c.postId === postId ? i : -1)
        .filter(i => i !== -1)
        .reverse();
    
    commentIndices.forEach(i => forumComments.splice(i, 1));
    
    res.json({ message: 'Post deleted successfully' });
};
