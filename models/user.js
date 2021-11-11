const config = require("config");

const sql = require("mssql");
const con = config.get("dbConfig_UCN");

const Joi = require("joi");

const _ = require("lodash");
const { reject } = require("lodash");

class UserSavedBook {
  constructor(UserSavedBook) {
    this.userId = UserSavedBook.userId;
    this.bookId = UserSavedBook.bookId;
    this.userName = UserSavedBook.userName;
  }

  static validate(userwannabeeObj) {
    const schema = Joi.object({
      userId: Joi.number().integer().min(1),
      bookId: Joi.number().min(1),
      userName: Joi.string().min(1).max(55),
    });
    return schema.validate(userwannabeeObj);
  }
  static savedBook(userId) {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const pool = await sql.connect(con);
          const result = await pool.request().input("userId", sql.Int(), userId)
            .query(`
                Select u.userId, u.userName, b.bookId
                From Users u
                Join savedBook b
                    On u.userId = b.userId
                 Where u.userId = @userId
                `);
          console.log(result);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      })();
    });
  }
  createSaveBook() {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const pool = await sql.connect(con);
          const result = await pool
            .request()
            .input("userId", sql.Int(), this.userId).query(`
            Insert into savedBook (bookId, userId)
            Values (@bookId,@userId)

            `);
          console.log(result);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      })();
    });
  }
}
module.exports = UserSavedBook;
