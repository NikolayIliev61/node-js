const config = require("config");

const sql = require("mssql");
const con = config.get("dbConfig_UCN");

const Joi = require("joi");

const _ = require("lodash");

const Author = require("./author");

class Book {
  constructor(bookObj) {
    this.bookId = bookObj.bookId;
    this.userId = bookObj.userId;
    this.bookTitle = bookObj.bookTitle;
    this.pictureRef = bookObj.pictureRef;
    this.bookYear = bookObj.bookYear;
    this.bookGenre = bookObj.bookGenre;
    this.bookLanguage = bookObj.bookLanguage;
    this.bookDescription = bookObj.bookDescription;
    this.bookNote = bookObj.bookNote;
    this.bookEdition = bookObj.bookEdition;
    this.authorFullName = bookObj.authorFullName;
    if (bookObj.authors) this.authors = _.cloneDeep(bookObj.authors);
  }

  copy(bookObj) {
    if (bookObj.bookTitle) this.bookTitle = bookObj.bookTitle;
    if (bookObj.pictureRef) this.pictureRef = bookObj.pictureRef;
    if (bookObj.bookYear) this.bookYear = bookObj.bookYear;
    if (bookObj.bookGenre) this.bookGenre = bookObj.bookGenre;
    if (bookObj.bookLanguage) this.bookLanguage = bookObj.bookLanguage;
    if (bookObj.bookDescription) this.bookDescription = bookObj.bookDescription;
    if (bookObj.bookNote) this.bookNote = bookObj.bookNote;
    if (bookObj.bookEdition) this.bookEdition = bookObj.bookEdition;
    if (bookObj.authorFullName) this.authorFullName = bookObj.authorFullName;
  }

  static validate(bookWannabeeObj) {
    const schema = Joi.object({
      bookId: Joi.number().integer().min(1),
      userId: Joi.number().integer().min(1),
      // userName: Joi.string().min(1).max(255),
      bookTitle: Joi.string().min(1).max(255),
      pictureRef: Joi.string().min(1).max(255),
      bookYear: Joi.number().integer(),
      bookGenre: Joi.string().max(255),
      bookLanguage: Joi.string().max(255),
      bookDescription: Joi.string(),
      bookNote: Joi.string(),
      bookEdition: Joi.string(),
      authorFullName: Joi.string(),

      authors: Joi.array().items(
        Joi.object({
          authorId: Joi.number().integer().min(1),
          authorFullName: Joi.string().max(255),
        })
      ),
    });

    return schema.validate(bookWannabeeObj);
  }

  static readAll(authorId) {
    return new Promise((resolve, reject) => {
      (async () => {
        // › › connect to DB
        // › › create SQL query string (SELECT Book JOIN BookAuthor JOIN Author)
        // › › if authorid, add WHERE authorid to query string
        // › › query DB with query string
        // › › restructure DB result into the object structure needed (JOIN --> watch out for duplicates)
        // › › validate objects
        // › › close DB connection

        // DISCLAIMER: need to look up how to SELECT with the results of another SELECT
        //      right now only the author with the authorid is listed on the book in the response

        try {
          const pool = await sql.connect(con);
          let result;

          if (authorId) {
            result = await pool.request().input("authorId", sql.Int(), authorId)
              .query(`
              SELECT b.bookId, u.userId, a.authorId, b.bookTitle, b.bookYear, b.bookGenre, b.bookDescription, b.bookEdition, b.bookLanguage, b.pictureRef, b.bookNote, a.authorFullName
              FROM Book b
              JOIN BookAuthor ba
                  ON b.bookId = ba.bookId
              JOIN Author a
                  ON ba.authorId = a.authorId
                  Join Users u
                    on u.userId = b.userId
              WHERE b.bookId IN (
                  SELECT b.bookId
                  FROM Book b
                  JOIN BookAuthor ba
                      ON b.bookId = ba.bookId
             
                  JOIN Author a
                      ON ba.authorId = a.authorId
                  WHERE a.authorId = @authorId
              )
              ORDER BY b.bookId, a.authorId, u.userId
                        `);
          } else {
            result = await pool.request().query(`
                            SELECT b.bookId, u.userId, a.authorId, b.bookTitle, b.bookYear, b.bookGenre, b.bookDescription, b.bookEdition, b.bookLanguage, b.pictureRef, b.bookNote, a.authorFullName
                            FROM Book b
                            JOIN BookAuthor ba
                                ON b.bookId = ba.bookId
                            JOIN Author a
                                ON ba.authorid = a.authorId
                            Join Users u
                              on u.userId = b.userId
                            ORDER BY b.bookId, a.authorId
                        `);
          }

          const books = []; // this is NOT validated yet
          let lastBookIndex = -1;
          result.recordset.forEach((record) => {
            if (
              books[lastBookIndex] &&
              record.bookId == books[lastBookIndex].bookId
            ) {
              console.log(`Book with id ${record.bookId} already exists.`);
              const newAuthor = {
                authorId: record.authorId,
                authorFullName: record.authorFullName,
              };
              books[lastBookIndex].authors.push(newAuthor);
            } else {
              console.log(`Book with id ${record.bookId} is a new book.`);
              const newBook = {
                bookId: record.bookId,
                userId: record.userId,
                bookTitle: record.bookTitle,
                pictureRef: record.pictureRef,
                bookYear: record.bookYear,
                bookGenre: record.bookGenre,
                bookLanguage: record.bookLanguage,
                bookDescription: record.bookDescription,
                bookNote: record.bookNote,
                bookEdition: record.bookEdition,
                authorFullName: record.authorFullName,
              };
              books.push(newBook);
              lastBookIndex++;
            }
          });
          console.log(books);
          const validBooks = [];
          books.forEach((book) => {
            const { error } = Book.validate(book);
            if (error) throw { errorMessage: `Book.validate failed.` };

            validBooks.push(new Book(book));
          });

          resolve(validBooks);
        } catch (error) {
          reject(error);
        }

        sql.close();
      })();
    });
  }
  static readById(bookId) {
    return new Promise((resolve, reject) => {
      (async () => {
        // › › connect to DB
        // › › query DB (SELECT Book JOIN BookAuthor JOIN Author WHERE bookid)
        // › › restructure DB result into the object structure needed (JOIN --> watch out for duplicates)
        // › › validate objects
        // › › close DB connection

        try {
          const pool = await sql.connect(con);
          const result = await pool.request().input("bookId", sql.Int(), bookId)
            .query(`
            SELECT b.bookId,u.userId, a.authorId, a.authorFullName, b.bookTitle, b.bookYear, b.bookGenre, b.bookDescription,
             b.bookEdition, b.bookLanguage, b.pictureRef, b.bookNote
            FROM Book b
            JOIN BookAuthor ba
                ON b.bookId = ba.bookId
            Join Users u
              on b.userId = u.userId
            JOIN Author a
                ON ba.authorId = a.authorId
            WHERE b.bookId = @bookId
                    `);
          const books = []; // this is NOT validated yet
          let lastBookIndex = -1;

          result.recordset.forEach((record) => {
            if (
              books[lastBookIndex] &&
              record.bookId == books[lastBookIndex].bookId
            ) {
              console.log(`Book with id ${record.bookId} already exists.`);
              const newAuthor = {
                authorId: record.authorId,
                authorFullName: record.authorFullName,
              };
              books[lastBookIndex].authors.push(newAuthor);
            } else {
              // console.log(`Book with id ${record.bookId} is a new book.`);
              console.log(record);
              const newBook = {
                bookId: record.bookId,
                userId: record.userId,
                bookTitle: record.bookTitle,
                pictureRef: record.pictureRef,
                bookYear: record.bookYear,
                bookGenre: record.bookGenre,
                bookLanguage: record.bookLanguage,
                bookDescription: record.bookDescription,
                bookNote: record.bookNote,
                bookEdition: record.bookEdition,
                authors: [
                  {
                    authorFullName: record.authorFullName,
                    authorId: record.authorId,
                  },
                ],
              };
              books.push(newBook);
              lastBookIndex++;
            }
          });

          console.log("loop over");
          if (books.length == 0)
            throw {
              statusCode: 404,
              errorMessage: `Book not found with provided bookId: ${bookId}`,
            };
          if (books.length > 1)
            throw {
              statusCode: 500,
              errorMessage: `Multiple hits of unique data. Corrupt database, bookid: ${bookId}`,
            };

          let validationResult = Book.validate(books[0]);
          if (validationResult.error)
            throw {
              statusCode: 500,
              errorMessage: `Corrupt Book informaion in database, bookId: ${bookId}`,
            };

          resolve(books);
        } catch (error) {
          reject(error);
        }

        sql.close();
      })();
    });
  }

  create() {
    return new Promise((resolve, reject) => {
      (async () => {
        // › › check if authors exist in DB (i.e. Author.readById(authorid))
        // › › connect to DB
        // › › check if book already exists in DB (e.g. matching title and year)
        // › › query DB (INSERT Book, SELECT Book WHERE SCOPE_IDENTITY(), INSERT BookAuthor)
        // › › check if exactly one result
        // › › keep bookid safe
        // › › queryDB* (INSERT BookAuthor) as many more times needed (with bookid)
        // › › ((query DB query DB (SELECT Book JOIN BookAuthor JOIN Author WHERE bookid))) ==>
        // › ›      close the DB because we are calling
        // › ›             Book.readById(bookid)
        // › › // restructure DB result into the object structure needed (JOIN --> watch out for duplicates)
        // › › // validate objects
        // › › close DB connection
        try {
          const pool = await sql.connect(con);
          const resultCheckBook = await pool
            .request()
            .input("bookTitle", sql.NVarChar(50), this.bookTitle)
            .input("bookYear", sql.Int(), this.bookYear).query(`
                            SELECT *
                            FROM Book b
                            WHERE b.bookTitle = @bookTitle AND b.bookYear = @bookYear
                        `);
          if (resultCheckBook.recordset.length == 1)
            throw {
              statusCode: 409,
              errorMessage: `Conflict. Book already exists, bookid: ${resultCheckBook.recordset[0].bookId}`,
            };
          if (resultCheckBook.recordset.length > 1)
            throw {
              statusCode: 500,
              errorMessage: `Multiple hits of unique data. Corrupt database, bookid: ${resultCheckBook.recordset[0].bookId}`,
            };

          const authorQueryResult = await pool
            .request()
            .input("authorFullName", sql.NVarChar(255), this.authorFullName)
            .query(`
              Select *
              From Author a
              Where a.authorFullName = @authorFullName
            `);

          let authorId = authorQueryResult.recordset[0]?.authorId;
          console.log(authorId);
          if (!authorId) {
            const authorInsertResult = await pool
              .request()
              .input("authorFullName", sql.NVarChar(255), this.authorFullName)
              .query(`
            Insert into Author (authorFullName)
            Values (@authorFullName)
            select SCOPE_IDENTITY();
            `);
            console.log(authorInsertResult);
            //insert into Author table and get author id back

            authorId = authorInsertResult.recordset[0];
          }

          const result00 = await pool
            .request()
            .input("bookTitle", sql.NVarChar(255), this.bookTitle)
            .input("pictureRef", sql.NVarChar(255), this.pictureRef)
            .input("bookYear", sql.Int(), this.bookYear)
            .input("bookGenre", sql.NVarChar(255), this.bookGenre)
            .input("bookLanguage", sql.NVarChar(255), this.bookLanguage)
            .input("bookDescription", sql.NVarChar(255), this.bookDescription)
            .input("bookEdition", sql.NVarChar(), this.bookEdition)
            .input("bookNote", sql.NVarChar(255), this.bookNote)
            .input("userId", sql.Int(), 1)
            .input("authorId", sql.Int(), authorId).query(`
                    Insert into Book (bookTitle,pictureRef,bookYear, bookGenre,bookLanguage,bookDescription,bookNote, bookEdition,userId)
                    Values (@bookTitle,@pictureRef,@bookYear, @bookGenre,@bookLanguage,@bookDescription,@bookNote,@bookEdition,@userId)

                    select * from Book 
                    where bookId = SCOPE_IDENTITY();
                    
                    Insert into BookAuthor(bookId, authorId)
                    Values (Scope_Identity(), @authorId);
                        `);

          if (!result00.recordset[0])
            throw {
              statusCode: 500,
              errorMessage: `DB server error, INSERT failed.`,
            };

          const bookId = result00.recordset[0].bookId;
          console.log(bookId);

          sql.close();

          const book = await Book.readById(bookId);

          resolve(book);
        } catch (error) {
          console.log(error);
          reject(error);
        }

        sql.close();
      })();
    });
  }
  static delete(bookId) {
    return new Promise((resolve, reject) => {
      (async () => {
        // › › connect to DB
        // › › query DB (SELECT Book JOIN BookAuthor JOIN Author WHERE bookid) <-- moving this before the DB connection, calling readById instead
        // › › query DB (DELETE BookAuthor WHERE bookid, DELETE Book WHERE bookid)
        // › › restructure DB result into the object structure needed (JOIN --> watch out for duplicates)
        // › › validate objects
        // › › close DB connection
        // DELETE liloLoan
        // WHERE FK_bookid = @bookid;
        try {
          const book = await Book.readById(bookId);

          const pool = await sql.connect(con);
          const result = await pool.request().input("bookId", sql.Int(), bookId)
            .query(`
                        DELETE BookAuthor
                        WHERE bookId = @bookId;

                        DELETE Book
                        WHERE bookId = @bookId
                    `);

          resolve(book);
        } catch (error) {
          reject(error);
        }

        sql.close();
      })();
    });
  }
  update() {
    return new Promise((resolve, reject) => {
      (async () => {
        // › › check if book already exists in DB (i.e. Book.readById(bookid))
        // › › check if authors exist in DB (i.e. Author.readById(authorid))
        // › › connect to DB
        // › › query DB (UPDATE Book WHERE bookid)
        // › › queryDB (DELETE BookAuthor WHERE bookid, INSERT BookAuthor)
        // › › queryDB* (INSERT BookAuthor) as many more times needed (with bookid)
        // › › query DB query DB (SELECT Book JOIN BookAuthor JOIN Author WHERE bookid)
        // › › restructure DB result into the object structure needed (JOIN --> watch out for duplicates)
        // › › validate objects
        // › › close DB connection

        try {
          const oldBook = await Book.readById(this.bookId); // <-- this was (should have been) checked already in the route handler

          this.authors.forEach(async (author) => {
            const authorCheck = await Author.readById(author.authorId);
          });

          const pool = await sql.connect(con);
          const result = await pool
            .request()
            .input("bookTitle", sql.NVarChar(50), this.bookTitle)
            .input("pictureRef", sql.NVarChar(255), this.pictureRef)
            .input("bookYear", sql.Int(), this.bookYear)
            .input("bookGenre", sql.NVarChar(255), this.bookGenre)
            .input("bookLanguage", sql.NVarChar(255), this.bookLanguage)
            .input("bookDescription", sql.NVarChar(255), this.bookDescription)
            .input("bookEdition", sql.NVarChar(255), this.bookEdition)
            .input("bookNote", sql.NVarChar(255), this.bookNote)
            .input("bookId", sql.Int(), this.bookId)
            .input("authorId", sql.Int(), this.authors[0].authorId).query(`
                            UPDATE Book
                            SET
                                bookTitle = @bookTitle,
                                pictureRef = @pictureRef,
                                bookYear = @bookYear,
                                bookGenre = @bookGenre,
                                bookLanguage = @bookLanguage,
                                bookDescription = @bookDescription,
                                bookEdition = @bookEdition,
                                bookNote = @bookNote
                            WHERE bookId = @bookId;

                            DELETE BookAuthor
                            WHERE bookId = @bookId;

                            INSERT INTO BookAuthor (bookId, authorId)
                            VALUES (@bookId, @authorId)
                        `);

          this.authors.forEach(async (author, index) => {
            if (index > 0) {
              await pool.connect();
              const resultAuthors = await pool
                .request()
                .input("bookId", sql.Int(), this.bookId)
                .input("authorId", sql.Int(), author.authorId).query(`
                                        INSERT INTO BookAuthor (bookId, authorId)
                                        VALUES (@bookId, @authorId)
                                    `);
            }
          });

          sql.close();

          const book = await Book.readById(this.bookId);

          resolve(book);
        } catch (error) {
          reject(error);
        }

        sql.close();
      })();
    });
  }
}
// require Author so it can work.
module.exports = Book;
