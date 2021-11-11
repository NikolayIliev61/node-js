const env = require("dotenv").config();
const config = require("config");

const express = require("express");
const app = express();

const cors = require("cors");

// custom middleware
const setContentTypeJSON = require("./middleware/setResponseHeader");

const books = require("./routes/books");
const users = require("./routes/users");
const accounts = require("./routes/accounts");
const dummies = require("./routes/dummies");
// Saved books first try

//
app.use(express.json());
app.use(cors());
app.use(setContentTypeJSON);
app.use("/api/books", books);
app.use("/api/savedbook", users);
app.use("/api/accounts", accounts);
app.use("/api/dummies", dummies);
app.listen(config.get("port"), () =>
  console.log(`Listening on port ${config.get("port")}...`)
);
