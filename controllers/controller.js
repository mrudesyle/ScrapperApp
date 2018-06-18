//Requiring our Dependencies
var express = require("express");
var router = express.Router();
var request = require("request");
var cheerio = require("cheerio");
var mongoose = require("mongoose");

mongoose.Promise = Promise;
// Requiring our Note and Article models
var Note = require("../models/Note.js");
var Article = require("../models/Article.js");
// this route to render index.html
router.get("/", function (req, res) {
  res.render("index");
});

// This will get the articles saved in db and show them.
router.get("/savedarticles", function (req, res) {

  // Grab every doc in the Articles array
  Article.find({}, function (error, doc) {

    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json 
    else {
      var hbsArticleObject = {
        articles: doc
      };

      res.render("savedArticles", hbsArticleObject);
    }
  });
});

//this route will scrape the website
router.post("/scrape", function (req, res) {
  // grab the body of the html with request
  request("https://www.nytimes.com/", function (error, response, html) {
    //load that into cheerio and save it to $ 
    var $ = cheerio.load(html);
    // Make emptry array for temporarily saving and showing scraped Articles.
    var scrapedArticles = [];
    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function (i, element) {

      // Save an empty result object
      var result = {};
      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children("a").text();
      // console.log(result.title);
      result.link = $(this).children("a").attr("href");
      scrapedArticles[i] = result;
    });
    // console.log(scrapedArticles);
    var hbsArticleObject = {
      articles: scrapedArticles
    };
    res.render("index", hbsArticleObject);


  });
});



router.post("/save", function (req, res) {
  // console.log("This is the title: " + req.body.title);
  // console.log("This is the link: " + req.body.link);
  var savedArticles = [];
  var newArticleObject = {};
  newArticleObject.title = req.body.title;
  newArticleObject.link = req.body.link;
  newArticleObject.summary = req.body.link;
  var entry = new Article(newArticleObject);
  // Now, save that entry to the db
  entry.save(function (err, doc) {
    // Log any errors
    if (err) {
      console.log(err);
    }
    // Or log the doc
    else {
      savedArticles.push(entry);
      // console.log(savedArticles);
    }
    res.redirect("savedArticles");
  });

});

router.get("/delete/:id", function (req, res) {

  Article.findOneAndRemove({ "_id": req.params.id }, function (err, offer) {

    if (err) {
      console.log(err);
    } else {
      console.log("MADE IT HERE");
    }
    res.redirect("/savedarticles");
  });
});

router.get("/notes/:id", function (req, res) {

  Note.findOneAndRemove({ "_id": req.params.id }, function (err, doc) {

    if (err) {
      console.log(err);
    } else {

    }
    res.send(doc);
  });
});
// This will grab an article by it's ObjectId
router.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id }).populate('notes').exec(function (err, doc) {

    if (err) {
      console.log(err);
    }
    else {
      console.log(doc);
      res.json(doc);
    }
  });
});

// Create a new note or replace an existing note
router.post("/articles/:id", function (req, res) {

  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);
  // And save the new note the db
  newNote.save(function (error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    else {
      // Use the article id to find it and then push note
      Article.findOneAndUpdate({ "_id": req.params.id }, { $push: { notes: doc._id } }, { new: true, upsert: true })

        .populate('notes')

        .exec(function (err, doc) {

          if (err) {
            console.log(err);
          } else {
            console.log(doc.notes);
            res.send(doc);
          }
        });
    }
  });
});
// Export routes for server.js to use.
module.exports = router;
