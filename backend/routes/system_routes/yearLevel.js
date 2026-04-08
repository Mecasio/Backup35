const express = require('express');
const { db, db3 } = require('../database/database');

const router = express.Router();

router.get("/api/year-levels", async (req, res) => {
  try {
    const [rows] = await db3.query(
      `SELECT year_level_id, year_level_description 
       FROM year_level_table 
       WHERE level_type = 'year'
       ORDER BY year_level_id`
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching year levels:", err);
    res.status(500).json({ message: "Failed to fetch year levels" });
  }
});

router.put("/years_level/:id", async (req, res) => {
  const { id } = req.params;
  const { year_level_description, level_type } = req.body;

  if (!year_level_description) {
    return res.status(400).json({ error: "Description is required" });
  }

  try {
    await db3.query(
      `UPDATE year_level_table 
       SET year_level_description = ?, level_type = ? 
       WHERE year_level_id = ?`,
      [year_level_description, level_type, id]
    );

    res.json({ message: "Updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

router.delete("/years_level/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db3.query(
      "DELETE FROM year_level_table WHERE year_level_id = ?",
      [id]
    );

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;