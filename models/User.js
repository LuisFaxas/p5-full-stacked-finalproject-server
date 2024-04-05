import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    lastName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    email: {
      type: String,
      max: 50,
      unique: true,
      required: function() {
        // Require an email only if the user is not signing in through GitHub
        return !this.githubId;
      },
    },
    password: {
      type: String,
      min: 5,
      required: function() {
        // Require a password only if the user is not signing in through GitHub
        return !this.githubId
    },
  },
    picturePath: {
      type: String,
      default: "",
    },
    friends: {
      type: Array,
      default: [],
    },
    githubId: {
      type: String,
      required: false,
      unique: true, // Ensure that the GitHub ID is unique in the database
    },
    location: String,
    occupation: String,
    viewedProfile: Number,
    impressions: Number,
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
export default User;