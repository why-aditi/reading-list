import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

async function fetchAndStoreBook(title) {
  try {
    const formattedTitle = title.toLowerCase().replace(/\s+/g, "+");

    const response = await axios.get(
      `https://openlibrary.org/search.json?q=${formattedTitle}`
    );
    const book = response.data.docs[0];
    if (book) {
      const id = book.cover_edition_key;
      const title = book.title;
      const author = book.author_name ? book.author_name[0] : "Unknown";
      const author_id = book.author_key ? book.author_key[0] : null;
      const edition = book.edition_key ? book.edition_key[0] : null;
      const cover_id = book.cover_edition_key
        ? book.cover_edition_key.toString()
        : null;

      await db.query(
        "INSERT INTO books (id, title, author, author_id, edition, cover_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING",
        [id, title, author, author_id, edition, cover_id]
      );
    }
  } catch (error) {
    console.error("Error fetching or inserting data:", error);
  }
}

app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM books ORDER BY id ASC");
    res.render("index", { books: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching data");
  }
});

app.get("/add-book", (req, res) => {
  res.render("add-book");
});

app.post("/add-book", (req, res) => {
  const newBook = {
    title: req.body.title,
    author: req.body.author,
    edition: req.body.edition,
    cover_id: req.body.cover_id,
  };
  books.push(newBook);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
