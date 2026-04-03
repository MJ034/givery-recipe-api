require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true
});

// GET /recipes
app.get('/recipes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, title, making_time, serves, ingredients, cost FROM recipes');
    res.status(200).json({ recipes: rows });
  } catch (err) {
    res.status(200).json({ recipes: [] }); 
  }
});

// GET /recipes/:id
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
    res.status(200).json({ message: "Recipe details by id", recipe: [] });
  }
});

// POST /recipes
app.post("/recipes", async (req, res) => {
  const { title, making_time, serves, ingredients, cost } = req.body;

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
      recipe: [{ id: result.insertId, title, making_time, serves, ingredients, cost }]
    });
  } catch (err) {
    res.status(200).json({ message: "Recipe creation failed!" });
  }
});

// PATCH /recipes/:id
app.patch('/recipes/:id', async (req, res) => {
  try {
    const [exists] = await pool.query('SELECT * FROM recipes WHERE id = ?', [req.params.id]);
    if (exists.length === 0) return res.status(200).json({ message: "Recipe not found" });

    const { title, making_time, serves, ingredients, cost } = req.body;
    const updated = {
      title: title || exists[0].title,
      making_time: making_time || exists[0].making_time,
      serves: serves || exists[0].serves,
      ingredients: ingredients || exists[0].ingredients,
      cost: cost !== undefined ? cost : exists[0].cost
    };

    await pool.query(
      'UPDATE recipes SET title = ?, making_time = ?, serves = ?, ingredients = ?, cost = ? WHERE id = ?',
      [updated.title, updated.making_time, updated.serves, updated.ingredients, updated.cost, req.params.id]
    );

    res.status(200).json({
      message: "Recipe successfully updated!",
      recipe: [{ id: parseInt(req.params.id), ...updated }]
    });
  } catch (err) {
    res.status(200).json({ message: "Recipe update failed" });
  }
});

// DELETE /recipes/:id
app.delete('/recipes/:id', async (req, res) => {
  try {
    const [exists] = await pool.query('SELECT * FROM recipes WHERE id = ?', [req.params.id]);
    if (exists.length === 0) return res.status(200).json({ message: "No recipe found" });

    await pool.query('DELETE FROM recipes WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: "Recipe successfully removed!" });
  } catch (err) {
    res.status(200).json({ message: "Recipe deletion failed" });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server ready at ${PORT}`));