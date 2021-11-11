const express = require("express");
const { route } = require("./accounts");
const router = express.Router();

const auth = require("../middleware/authenticate");
const authenticate = require("../middleware/authenticate");
router.get("/public", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify({ message: "This is a public endpoint" }));
});

// router.get("/private", [auth], (req, res) => {
//   res.setHeader("Content-Type", "application/json");
//   res.send(
//     JSON.stringify({
//       message: "This is a private endpoint. Only members allowed.",
//       account: req.account,
//     })
//   );
// });
router.get("/private", [auth], (req, res) => {
  res.setHeader("Content-Type", "application/json");

  res.send(
    JSON.stringify({
      message: "this is private",
    })
  );
});
module.exports = router;
