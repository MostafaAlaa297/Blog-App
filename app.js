const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const Post = require("./model")
const path = require("path")
const fs = require("fs")

const homeStartingContent = "Welcome to ComPost; the place where you can share your ideas with others";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();
require("dotenv").config();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URL, {useNewUrlParser: true}).then(console.log("Database connected"))

const multer = require('multer');
 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
 
const upload = multer({ storage: storage });
let requestedPostId;
 
app.get("/", function(req, res){
  Post.find({}, function(err, posts){
    res.render("home", {
      startingContent: homeStartingContent,
      posts: posts,
      });
    });
  });
  
  app.get("/compose", function(req, res){
    res.render("compose");
  });
 
app.post("/like/:postId", async function(req, res){
  const likedPostId = req.params.postId;
  console.log("Maa Niggaa: " + likedPostId)
  await Post.findOneAndUpdate({_id: likedPostId}, {$inc: { like: 1 } })
  res.send({ like: (await Post.findById(likedPostId)).like });
})

app.get("/like/:postId", async function(req, res){
  const postId = req.params.postId;
  console.log(postId);
    try {
      await Post.findOne({_id: postId}, (err, post) => {
        console.log(post.like)
        console.log("postID: "+post._id)
        res.json(post);
      })
    }
    catch(err){
      console.log("we have: " + err);
    }
  // });
});

// Compose Post Route
app.post("/compose", upload.single('image'), async (req, res, next) => {
  let post;
try {
  //check if the request has an image or not
  if (req.file === undefined) {
    post = {
      title: req.body.postTitle,
      content: req.body.postBody,
    }
  } else {
    post = {
      title: req.body.postTitle,
      content: req.body.postBody,
      img: {
        data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
        contentType: 'image/png'
      },
    };
  }
  const postObject = new Post(post);
  // saving the object into the database
  await postObject.save();
  res.redirect("/");
} catch (error) {
  console.error(error);
  res.status(500).send("Server Error");
}
});

// Edit Post Page Route
app.get("/update/:postId", function(req, res) {
  requestedPostId = req.params.postId;
  
  Post.findOne({_id: requestedPostId}, function(err, post) {
    // console.log("this is the post " + post.img.data.toString('base64'))
    res.render("update", {
      postTitle: post.title,
      postBody: post.content,
      img: post.img,
      likes: post.like,
      id: post._id
    })
  })
})

// Edit Post Route
app.post("/update", upload.single('image'), async function(req, res, next) {
  const postTitle = req.body.postTitle;
  const postBody = req.body.postBody;
  const postImage = req.body.image;

  try {
      // Check if a file was uploaded
      if (req.file) {
          // Access the filename property of the uploaded file
        console.log(req.file.filename);

        await Post.findOneAndUpdate({_id: requestedPostId}, {  
            title: req.body.postTitle,
            content: req.body.postBody,
            img: {
                data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
                contentType: 'image/png'
            }
        });
              console.log("called else");
      } else {
          // Handle the case where no file was uploaded
          await Post.findOneAndUpdate({_id: requestedPostId}, {  
              title: postTitle,
              content: postBody,
          });
      }
  } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
  }
  res.redirect("/")
});

// Full Post display Page Route
app.get("/posts/:postId", function(req, res){
const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      title: post.title,
      content: post.content,
      img: post.img,
      like: post.like,
      id: requestedPostId
    });
  });

});

// About Page Route
app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

// Contact Page Route
app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});

// The Route for deleting a post
app.get("/delete/:postId", function (req, res) {
  const requestedPostId = req.params.postId;
  Post.findByIdAndRemove(requestedPostId, function(err){
    if(!err){
      console.log(`${requestedPostId} is successfully deleted`);
      res.redirect("/");
    }
  });
});

// The Route for Deleting image of a post 
app.post("/edit/:postId", function (req, res) {
  const postId = req.params.postId;
  
  Post.updateOne({_id: postId}, {$unset: {img: ""}})
  .then(res.redirect("/update/" + postId))
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

