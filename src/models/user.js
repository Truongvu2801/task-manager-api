const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const Task = require("./task");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Email is invalid");
      }
    }
  },
  age: {
    type: Number,
    validate(value) {
      if (value < 0) {
        throw new Error("Age must be a postive number");
      }
    }
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 7,
    validate(value) {
      if (value.toLowerCase().includes("password")) {
        throw new Error("password cannot contain 'password'");
      }
    }
  },
  avatar: {
    type: Buffer
  }
}, {
  // toJSON: {
  //     transform: function(doc, ret) {
  //         var { __v, password, tokens, ...rest } = ret;
  //         return { ...rest }
  //     },
  // },
  timestamps: true
});

userSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();
  
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

   return userObject;
}

userSchema.virtual('tasks', { // name
  ref: 'Task', // connect with model Task
  localField: '_id', // id User
  foreignField: 'owner' // field of task
})

userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign( { _id: user._id.toString() }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token: token});
  await user.save();

  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = User.findOne({ email });
  
  if(!user){
    throw new Error('Unable to login');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if(!isMatch) {
    throw new Error('Unable to login');
  }

  return user;
} 

// Hash the plain text password before saving
userSchema.pre('save', async function(next){
  const user = this;
  // console.log('just before saving');
  if(user.isModified('password')){
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
})

// Delete users tasks when user is removed
userSchema.pre('remove', async function(next){
  const user = this;
  await Task.deleteMany({ owner: user._id })

  next();
})


const User = mongoose.model("User", userSchema);

module.exports = User;
