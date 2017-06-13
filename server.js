var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');

var Article = require('./models/articles.js');
var Comment = require('./models/comments.js');

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));


// mongoose.connect('mongodb://localhost/facescraper')

//Connection deploy to Heroku
mongoose.connect('mongodb://heroku_02vdtm5w:93eipjh028heqe7irl32brkjbt@ds119772.mlab.com:19772/heroku_02vdtm5w');

var db = mongoose.connection;


db.on('error', function (err) {
  console.log('Mongoose Error: ', err);
});

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//------------------------------- Routes--------------------//
app.get('/', function (req, res) {
  res.redirect('/scraping');
});
console.log('----------------------------------scraping---------------------------------------------');

//Route to scrape askubuntu.com
app.get('/scraping', (req, res) => {
  request('https://askubuntu.com/', (err, respond, html) => {
    let $ = cheerio.load(html);
console.log('------------------------------$$$$-------------------------------------------------');
    // console.log(html);
    $('.summary').each(function(i, element) {
 //$('.question-hyperlink .summary').each(function(i, element) {
 //$('.question-hyperlink .summary').each(function(i, element) {
      let result = {};
      result.title = $(this).children("h3").children('a').text();
      result.link = $(this).children("h3").children('a').attr("href");
      result.content = $(this).children('.tags').text();
      // console.log(result);

      let oneArticle = new Article(result);
      console.log('-------------------------------------------------------------------------------');
      console.log('look here for link',result.link);
      console.log('-------------------------------------------------------------------------------');
      console.log('TITLE Here', result.title);
      console.log('-------------------------------------------------------------------------------');
   //creating new instance of Article
      var article = new Article(result);
      //saving article to MongoDB
      article.save((err, doc) => {
        if (err) {
          console.log('Already scraped');
          } else {
            console.log('New article scraped');
            }
        });
      });
    });
  //--------Redirecting-------------- 
  res.redirect('/articles');
});

 
//Default route that gets all the articles in the database
app.get('/articles', (req, res) => {
  Article.find({}, (err, doc) => {
    //Displays error if any
    if (err) {
      console.log(err);
      }
    //Otherwise, renders articles.handlebar template
    else {
      res.render('articles', {
      //res.redirect('/articles',{
        //"loop over articles" is the variable 
        articles: doc
        });
      }
    });
});

//Update articles with id parameter 
app.get('/articles/:id', (req, res) => {
  //Find article with the id as set from the route
  Article.findOne({'_id': req.params.id})
  //Comments
  .populate('comments')
  //Execute query
  .exec((err, doc) => {
    //consoles error 
    if (err) {
      console.log(err);
      }
    //Else renders comments.handlebars
    else {
//       res.redirect('/comments',{
      res.render('comments', {
        //Loop over each instance of comments for a particular article to display all comments
        article: doc
        });
      }
    });
});

//Posting comments
app.post('/articles/:id', (req, res) => {
  //Creates new instance of Comment
  var newComment = new Comment(req.body);

  //Saves new comment 
  newComment.save((err, doc) => {
    //If error
    if (err) {
      console.log(err);
      //Else update article with id include a new comment with same id
      } else {
        var articleId = req.params.id;
        Article.findOneAndUpdate({'_id': articleId}, {$push: {'comments': doc._id}})
        .exec((err, doc) => {
          if (err) {
            console.log(err);
            } else {
              //Redirects to the specific article's comment page
              res.redirect('/articles/' + articleId);
              }
          });
        }
    });
});

//Post route to delete a comment
app.post('/articles/:aId/delete/:cId', (req, res) => {
  var articleId = req.params.aId;
  var commentId = req.params.cId;
  Article.update({'_id': articleId}, {$pull: {'comments': commentId}}, {'multi': false}, (err, res) => {
    //consoles error
    if (err) {
      console.log(err);
      //else remove comment with that id
      } else {
        Comment.remove({'_id': commentId}, (err, res) => {
          if(err) {
            console.log(err);
            } else {
              console.log('Comment deleted');
              }
          });
        }
    });

  res.redirect('/articles/' + articleId);
});

//Display saved articles
app.get('/saved', (req, res) => {
  Article.find({ 'saved' : true }, (err, doc) => {
    if (err) {
      console.log(err);
      }  else {
        //Renders saved articles.handlebars
        res.render('savedArticles', {
          articles: doc
          });
        }
    })
});


app.post('/saved/:id', (req, res) => {
  Article.update({ '_id' : req.params.id}, { $set :{ 'saved' : true}}, (err, res) => (err) ? console.log(err) : console.log(res));
  res.redirect('/articles');
})

//Unsaves article
app.post('/unsaved/:id', (req, res) => {
  Article.update( { '_id' : req.params.id }, { $set : { 'saved' : false }}, (err, res) => (err) ? console.log(err) : console.log(res));
  //Redirects to saved articles
  res.redirect('/saved');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Your App is running on port 3000, go check it out');
});