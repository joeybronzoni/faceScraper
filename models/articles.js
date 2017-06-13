var mongoose = require('mongoose');

var articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    link: {
        type: String,
        required: true
    },
    saved: {
        type: Boolean,
        default: false
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
});

var Article =  mongoose.model('Article', articleSchema);

module.exports = Article;


