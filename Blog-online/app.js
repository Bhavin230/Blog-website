require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");


const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  secret: "Ourlirrrrrrrrrcvgfdfb.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
// // mongoose.connect("mongodb+srv://bhavin:Qwer45ty%40@cluster0.t0zdt.mongodb.net/blogOnDB", {
//   useNewUrlParser: true
// });
mongoose.connect("mongodb://localhost:27017/blopgggDB",{useNewUrlParser:true});

const postSchema = {
  title: String,
  imageURL: String,
  content: String,

};
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});
userSchema.plugin(passportLocalMongoose);

userSchema.plugin(findOrCreate);

const Post = new mongoose.model("Post", postSchema);
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://hidden-crag-47037.herokuapp.com/home/auth/google/blog"
    // passReqToCallback: true  ---- do not tack these argument if you take it will genrate error
  },

  // function (accessToken, refreshToken, profile, done) {
  //   done(null, profile);
  // }
  function(accessToken, refreshToken, profile, cb) {
     console.log(profile);

    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {


      return cb(err, user);
    });
  }
));

app.get("/home", function(req, res) {
  Post.find({}, function(err, posts) {
    res.render("home", {
      posts: posts
    });
  });
});
app.get("/auth/google",
  passport.authenticate('google', {
    scope: ['email', 'profile']
  })
)
app.get("/home/auth/google/blog",
  passport.authenticate('google', {
    failureRedirect: "/login"
  }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    console.log("res");
    res.redirect("/home");
  });
app.get("/login", function(req, res) {
  res.render("login");
})
app.get("/register", function(req, res) {
  res.render("register");
})

app.get("/form", function(req, res) {
  res.render("form");
});
app.get("/about", function(req, res) {
  res.render("about");
});
app.get("/read", function(req, res) {
  Post.find({}, function(err, posts) {
    res.render("post", {
      posts: posts
    });
  });
});
app.post("/form", function(req, res) {
  const ptitle = req.body.postTitle;
  const imageUrl = req.body.postImageurl;
  const content = req.body.postContent;
  const post = new Post({
    title: ptitle,
    imageURL: imageUrl,
    content: content
  });

  post.save(function(err) {
    if (!err) {
      res.redirect("/home");
    }
  })
});
app.get("/",function(req,res){
  res.render("Blog");
})
app.get("/read/:postId", function(req, res) {

  const requestedPostTitle = req.params.postId;

  Post.findOne({
    _id: requestedPostTitle
  }, function(err, read) {
    res.render("read", {
      title: read.title,
      imageURL: read.imageURL,
      content: read.content
    });
  });
});
app.get("/delete/:deleteId", function(req, res) {
  const reqdeleteId = req.params.deleteId;

  Post.findOneAndDelete({
    _id: reqdeleteId
  }, function(err) {

    res.redirect("/home");
  })
})
app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate('local')(req,res,function(){
        res.redirect("/home");
      }
      )
    }
  })
})
app.post("/login",function(req,res){
    const user =new User({
      username:  req.body.username,
      password : req.body.password
    })
    req.login(user,function(err){
      if(err){
        console.log(err);
      } else{
        passport.authenticate("local")(req,res,function(){
          res.redirect("/home");
      })
    }
    })
})
app.listen(process.env.PORT || 5000, function(req, res) {
  console.log("Server running at port 4000");
});
