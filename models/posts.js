var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
    body: String,
    author: String,
    upvotes: {type: Number, default: 0}
});

var PostSchema = new mongoose.Schema({
    title: String,
    author: String,
    link: String,
    upvotes: {type: Number, default: 0},
    comments: [CommentSchema]
});

PostSchema.methods.upvote = function(cb) {
    this.upvotes += 1;
    this.save(cb);
};

mongoose.model('Post', PostSchema);
mongoose.model('Comment', CommentSchema);