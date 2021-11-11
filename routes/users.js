const express = require("express");
const router = express.Router();

const Book = require("../models/book");
const Author = require("../models/author");
const { route } = require("./books");
const User = require("../models/user");

router.get("/:userId", async (req, res) => {
  try {
    const savedBook = await User.savedBook(req.params.userId);
    return res.send(JSON.stringify(savedBook));
  } catch (err) {
    return err;
  }
});
router.post("/userId", async (req, res) => {
  try {
    const createSaveBook = await User.createSaveBook(req.body.userId);
    return res.send(JSON.stringify(createSaveBook));
  } catch (err) {
    return err;
  }
});
module.exports = router;
