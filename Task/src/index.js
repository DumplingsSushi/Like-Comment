const express = require("express");
const dotenv = require('dotenv');
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const mongoDbSession = require("connect-mongodb-session")(session);
const bcrypt = require("bcrypt");
const mongodb = require('mongodb');
const models = require('./config');
const multer = require('multer');
const app = express();

dotenv.config({ path: '.env' });
const PORT = 5000; 

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

//session
const store = new mongoDbSession({
    uri:"mongodb://localhost:27017/admin",
    collection: "Activity",
});
app.use(
    session({
        secret: "thisiscompletelyrandom",
        saveUninitialized: false,
        resave: false,
        store: store,
    })
);
app.use((req, res, next)=>{
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});

const isAuth = (req, res, next) => {
    if (req.session.isAuth) {
        next();
    } else {
        res.redirect("/login");
    }
};

app.get("/", (req, res) => {
    res.render("../view/register.ejs");
});

//Registration 

function validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

function validatePhoneNumber(phone) {
    const re = /^\d{10,15}$/;
    return re.test(phone);
}

app.post('/register', async (req, res) => {
    const { fname, lname, mail, number, password1, cpassword, } = req.body;
    const photo = req.body.filename; 
    // Perform validation checks
    const errors = [];

    if (!fname || fname.length < 3) {
        errors.push("Please enter a valid first name (minimum 3 characters).");
    }

    if (!lname || lname.length < 3) {
        errors.push("Please enter a valid last name (minimum 3 characters).");
    }

    if (!validateEmail(mail)) {
        errors.push("Please enter a valid email address.");
    }

    if (!validatePhoneNumber(number)) {
        errors.push("Please enter a valid phone number (between 10 to 15 digits).");
    }
    if (!password1 || password1.length < 3) {
        errors.push("Please enter a valid password (minimum 6 characters).");
    }

    if (password1!== cpassword) {
        errors.push("Passwords do not match.");
    }

    if (errors.length > 0) {
        // If there are validation errors, render the registration form again with error messages
        res.render("../view/register.ejs", { errors });
    } else {
        // If validation passes, proceed with database insertion
        try {
            const hashedPassword = await bcrypt.hash(password1, 10);
            const user = {
                firstName: fname,
                lastName: lname,
                emailId: mail,
                phoneNumber: number,
                password: hashedPassword,
                confirmPassword: hashedPassword
            };
            const existingUser = await models.collection.findOne({ firstName: user.firstName, lastName: user.lastName, emailId: user.emailId });
            if (existingUser) {
                res.send("user already exists please try again with different details");
            } else {
                const userdata = await models.collection.insertMany(user);
                res.redirect("/login");
                req.session.message={
                    type:'success',
                    message: 'User Added Successfully Kindly login with the user credentials to proceed further'
                }
            } 
        } catch (error) {
            console.log(error);
            res.redirect("/register");
        }
    }
});

app.get("/login", async (req, res) => {
    res.render("../view/login.ejs");
});

//login validation
app.post('/login', async (req, res) => {
    try {
        const check = await models.collection.findOne({ emailId: req.body.gmail });
        if (!check) {
            res.send("User not found check credentials!");
        }
        const isPassMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPassMatch) {
            res.send("Invalid Password");
        } else {
            req.session.isAuth = true;
            req.session.customerId = check._id;
            req.session.userName = check.firstName + ' ' + check.lastName;
            req.session.loginDate = new Date();
            res.redirect("./posts");
        }
    } catch {
        res.send("Wrong Credentials!!!");
    }
});
//Posts page
app.use('/uploads', express.static('uploads'));
app.get("/posts",isAuth, async (req, res) => {
    const username = req.session.userName;
    const id = req.session.customerId;
    const posts = await models.post.find({})
    res.render("../view/posts.ejs",{username,posts,id});
});
//add post 
app.get("/uploadpost",isAuth, (req, res) => {
    const id = req.session.userId;
    const username = req.session.userName;
    res.render("../view/uploadpost.ejs",{username});
});
// upload 

const upload = multer({ dest: './uploads/' });

app.post('/posts', upload.single('photo'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const photo = req.file.filename;

    const post = new models.post({
      title,
      content,
      photo,
      artist: req.session.userName,
      userId: req.session.customerId
    });
    const savedPost = await post.save();
    // console.log(savedPost);
    res.redirect('/posts');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error uploading post.');
  }
});

//like and comment 
app.post('/like', async (req, res) => {
    const postId = req.body.postId;
    const userId = req.session.customerId;
  
    try {
      const post = await models.post.findById(postId);
      const like = await models.like.findOne({ userId, postId });
  
      if (!like) {
        const newLike = new models.like({ userId, postId });
        await newLike.save();
        post.likes.push(newLike._id);
        await post.save();
      }
      res.redirect('/posts');
      
    } catch (err) {
      console.error(err);
      res.status(500).send('Error liking post.');
    }
});

app.post('/comment', async (req, res) => {
    const postId = req.body.postId;
    const userId = req.session.customerId;
    const commentContent = req.body.comment;
  
    try {
      const post = await models.post.findById(postId);
      const comment = new models.comment({ content: commentContent, userId, postId });
      await comment.save();
      post.comments.push(comment._id);
      await post.save();
  
      res.redirect('/posts');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error commenting on post.');
    }
});


//logout 
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/login');
        }
    });
});

app.listen(PORT, () => {
    console.log(`running on http://localhost:${PORT}`);
});
