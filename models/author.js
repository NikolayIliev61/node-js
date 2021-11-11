const config = require("config");

const sql = require("mssql");
const con = config.get("dbConfig_UCN");

const Joi = require("joi");

const _ = require("lodash");

class Author {
  constructor(authorObj) {
    this.authorId = authorObj.authorId;
    this.authorFullName = authorObj.authorFullName;
  }

  static validate(authorObj) {
    const schema = Joi.object({
      authorid: Joi.number().integer().min(1),
      authorFullName: Joi.string().min(1),
    });

    return schema.validate(authorObj);
  }

  static readById(authorId) {
    return new Promise((resolve, reject) => {
      (async () => {
        // connect to DB
        // query DB
        // transform the result into the object structure of Author
        // validate
        // resolve (author)
        // reject (error)
        // CLOSE DB connection

        try {
          const pool = await sql.connect(con);
          const result = await pool
            .request()
            .input("authorId", sql.Int(), authorId).query(`
                            SELECT *
                            FROM Author a
                            WHERE a.authorId = @authorId
                        `);

          const authors = [];
          result.recordset.forEach((record) => {
            const author = {
              authorId: record.authorId,
              authorFullName: record.authorFullName,
            };

            authors.push(author);
          });

          if (authors.length == 0)
            throw {
              statusCode: 404,
              errorMessage: `Author not found with provided authorid: ${authorId}`,
            };
          if (authors.length > 1)
            throw {
              statusCode: 500,
              errorMessage: `Multiple hits of unique data. Corrupt database, authorid: ${authorId}`,
            };

          const { error } = Author.validate(authors[0]);
          if (error)
            throw {
              statusCode: 500,
              errorMessage: `Corrupt Author informaion in database, authorid: ${authorId}`,
            };

          resolve(new Author(authors[0]));
        } catch (error) {
          reject(error);
        }

        sql.close();
      })();
    });
  }
}

module.exports = Author;
