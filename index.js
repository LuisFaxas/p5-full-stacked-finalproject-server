import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import { users, posts } from "./data/index.js";
import commentRoutes from "./routes/comments.js";

import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github";
import session from "express-session";

import MongoStore from "connect-mongo";
import jwt from "jsonwebtoken";

/* CONFIGURATIONS */
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

app.use(cors());

app.use("/assets", express.static(path.join(__dirname, "public/assets")));

/* FILE STORAGE */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

/* PASSPORT SETUP */
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID, // replace with your GitHub application's client ID
      clientSecret: process.env.GITHUB_CLIENT_SECRET, // replace with your GitHub application's client secret
      callbackURL: "http://localhost:3001/auth/github/callback",
      scope: ['user:email'],
    },
    (accessToken, refreshToken, profile, done) => {
      // Here, you will handle the user information received from GitHub
      // You might want to find or create a user in your database
      // For now, let's just pass the profile on to the next step
      done(null, profile);
    }
  )
);
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  // Here you would find the user in your database by their GitHub id
  // For now, we will just pass the user id to the callback
  done(null, { id: id });
});
// Redirect to GitHub for authentication
app.get("/auth/github", passport.authenticate("github"));


// GitHub will call this URL
app.get(
  '/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  async (req, res) => {
    console.log("This is req.query====>", req.query)
    console.log(req.user); 
    let user = await User.findOne({ githubId: req.user.id });

    if (!user) {
      // Create a new user if they don't exist in the database
      user = new User({
        githubId: req.user.id,
        // Initialize potential first and last names from GitHub profile
        firstName: req.user.displayName ? req.user.displayName.split(' ')[0] : '',
        lastName: req.user.displayName && req.user.displayName.split(' ').length > 1 ? req.user.displayName.split(' ')[req.user.displayName.split(' ').length - 1] : '',
        
        // Other fields can be initialized here if needed
      });
      await user.save();
    }

    // If the user does not have a first name or last name, redirect to 'complete-profile'
    if (!user.firstName || !user.lastName) {
      res.redirect(`/complete-profile?userId=${user._id}`);
    } else {
      // If the user already has a first name and last name, redirect to 'home'
      res.redirect(`http://localhost:5173/profile/${user._id}`);

    }
  }
);

app.get('/auth/wowzers', (req, res, next) => {
  res.redirect('/auth/github')
})

app.post('/users/:userId/complete-profile', async (req, res) => {
  const { userId } = req.params;
  const { firstName, lastName } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  // Update the user with the provided first name and last name
  user.firstName = firstName || user.firstName; // Don't overwrite if already exists
  user.lastName = lastName || user.lastName; // Don't overwrite if already exists
  await user.save();
  res.redirect('http://localhost:5173/home');
});


/* ROUTES WITH FILES */
app.post("/auth/register", upload.single("picture"), register);
app.post("/posts", verifyToken, upload.single("picture"), createPost);

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/posts/:postId/comments", commentRoutes);

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));

    /* ADD DATA ONE TIME */
    // User.insertMany(users);
    // Post.insertMany(posts);
  })
  .catch((error) => console.log(`${error} did not connect`));
