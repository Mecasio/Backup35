const express = require("express");
const { db } = require("../database/database");

const router = express.Router();

// ================= GET =================
router.get("/api/signature/:fullName", async (req, res) => {
  try {
    const { fullName } = req.params;

    const [rows] = await db.query(
      `SELECT full_name, signature_image
       FROM signature_table
       WHERE full_name = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [fullName],
    );

    if (!rows.length) {
      return res.json({ success: false });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// GET LATEST SIGNATURE
router.get("/api/signature-latest", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT full_name, signature_image
      FROM signature_table
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (!rows.length) {
      return res.json({ success: false });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;