const express = require("express");
const sharp = require("sharp");
const User = require("../models/user");
const auth = require("../middleware/auth");
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');
const router = new express.Router();
const multer = require('multer'); 

const upload = multer({
  // dest: 'images', // destination save file
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb){
    if(!file.originalname.match(/\.(jpeg|png|jpg)$/)){
      return cb(new Error('Please update a JPG, JPEG, PNG file'))
    }
    cb(undefined, true);
  }
})

router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({user, token});
  } catch (error) {
    res.status(400).send(error);
  }
})

router.post("users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token
    });
    await req.user.save();

    res.send();
  } catch (error) {
    res.status(500).send()
  }
})

router.post("users/logoutAll", auth, async (req, res) => {
  try {
    req.user.token = [];
    await req.user.save();
    res.send()
  } catch (error) {
    res.status(500).send();
  }
})

router.get("/users/me", auth, async (req, res) => {
  // a route allow a user to get their profile when they are authenticated
  res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
  const allowedUpdate = ["name", "email", "password"];
  const updates = Object.keys(req.body);
  const isValidOperation = updates.every(update =>
    allowedUpdate.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send("error: Invalid updates");
  }

  try {
    updates.forEach((update) => {
      user[update] = req.body[update]
    });
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    res.status(400).send();
  }
});

router.delete("/users/:id", auth, async (req, res) => {
  // const _id = req.user._id;
  try {
    // const user = await User.findByIdAndDelete(_id);
    // if (!user) {
    //   return res.status(404).send();
    // }
    // res.send(user);
    await req.user.remove();
    sendCancelationEmail(req.user.email, req.user.name);
    res.send(req.user)
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/users/me/avatar", auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250}).png().toBuffer()

  req.user.avatar = buffer;
  await req.user.save();
  res.send();
}, (error, req, res, next) => {
  res.status(400).send({error: error.message});
})

router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

router.get("/users/:id/avatar", async (req, res) => {
 try {
  const user = await User.findById(req.params.id);
  
  if(!user || !user.avatar){
    throw new Error('')
  }

  res.set('Content-Type', 'image/png');
  res.send(user.avatar);
 } catch (error) {
   res.status(404).send();
 }
})

module.exports = router;
