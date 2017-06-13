var mongoose = require('mongoose');

var commentSchema = new mongoose.Schema({
    title: {
        type: String
    },
    body: {
        type: String
    }
});

var Comment =  mongoose.model('Comment', commentSchema);

module.exports = Comment;