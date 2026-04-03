require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());

const dbConfig = {
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true
};
const pool = mysql.createPool(dbConfig);

// GET /recipes - Fetch all
app.get('/recipes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, title, making_time, serves, ingredients, cost FROM recipes');
    res.status(200).json({ recipes: rows });
  } catch (err) {
    res.status(200).json({ message: "Failed to fetch recipes" });
  }
});

// GET /recipes/:id - Return selected recipe by id
app.get('/recipes/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, making_time, serves, ingredients, cost FROM recipes WHERE id = ?', 
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(200).json({ message: "Recipe not found" });
    }

    res.status(200).json({
      message: "Recipe details by id",
      recipe: rows
    });
  } catch (err) {
    res.status(200).json({ message: "Recipe details by id" });
  }
});

// POST /recipes - Create a new recipe
app.post("/recipes", async (req, res) => {
  const { title, making_time, serves, ingredients, cost } = req.body;

  // validation for required fields
  if (!title || !making_time || !serves || !ingredients || !cost) {
    return res.status(200).json({
      message: "Recipe creation failed!",
      required: "title, making_time, serves, ingredients, cost"
    });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO recipes (title, making_time, serves, ingredients, cost) VALUES (?, ?, ?, ?, ?)',
      [title, making_time, serves, ingredients, cost]
    );
    res.status(200).json({
      message: "Recipe successfully created!",
      recipe: [
        {
          id: result.insertId,
          title,
          making_time,
          serves,
          ingredients,
          cost
        }
      ]
    });
  } catch (err) {
    res.status(200).json({ message: "Recipe creation failed!" });
  }
});

app.patch('/recipes/:id', async (req, res) => {
  try {
    // Check if recipe exists
    const [exists] = await pool.query('SELECT * FROM recipes WHERE id = ?', [req.params.id]);
    if (exists.length === 0) return res.status(200).json({ message: "Recipe not found" });

    // Update with provided fields or keep old ones
    const { title, making_time, serves, ingredients, cost } = req.body;
    await pool.query(
      'UPDATE recipes SET title = ?, making_time = ?, serves = ?, ingredients = ?, cost = ? WHERE id = ?',
      [
        title || exists[0].title,
        making_time || exists[0].making_time,
        serves || exists[0].serves,
        ingredients || exists[0].ingredients,
        cost || exists[0].cost,
        req.params.id
      ]
    );

    res.status(200).json({
      message: "Recipe successfully updated!",
      recipe: [{
        id: parseInt(req.params.id),
        title: title || exists[0].title,
        making_time: making_time || exists[0].making_time,
        serves: serves || exists[0].serves,
        ingredients: ingredients || exists[0].ingredients,
        cost: cost || exists[0].cost
      }]
    });
  } catch (err) {
    res.status(200).json({ message: "Update failed", error: err.message });
  }
});

app.delete('/recipes/:id', async (req, res) => {
  try {
    const [exists] = await pool.query('SELECT * FROM recipes WHERE id = ?', [req.params.id]);
    if (exists.length === 0) return res.status(200).json({ message: "No recipe found" });

    await pool.query('DELETE FROM recipes WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: "Recipe successfully removed!" });
  } catch (err) {
    res.status(200).json({ message: "Delete failed", error: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server ready at http://localhost:${PORT}`),
);
