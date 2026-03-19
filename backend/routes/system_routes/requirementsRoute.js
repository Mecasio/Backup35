const express = require('express');
const multer = require("multer");
const { db, db3 } = require('../database/database');

const router = express.Router();

// REQUIREMENTS PANEL (UPDATED!) ADMIN
router.post("/requirements", async (req, res) => {
    const {
        requirements_description,
        category,
        short_label,
        xerox_copies,
        requires_original,
        is_optional,
        applicant_type // ✅ NEW
    } = req.body;

    const query = `
    INSERT INTO requirements_table
    (description, short_label, category, xerox_copies, requires_original, is_optional, applicant_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

    try {
        const [result] = await db.execute(query, [
            requirements_description,
            short_label || null,
            category || "Main",
            xerox_copies || 0,
            requires_original ? 1 : 0,
            is_optional ? 1 : 0,
            applicant_type || "All" // ✅ DEFAULT
        ]);

        res.status(201).json({ requirements_id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save requirement" });
    }
});

router.get("/requirements", async (req, res) => {
    const query = "SELECT * FROM requirements_table";

    try {
        const [results] = await db.execute(query);
        res.json(results);
    } catch (err) {
        console.error("Fetch error:", err);
        return res.status(500).json({ error: "Failed to fetch requirements" });
    }
});

// ✅ UPDATE REQUIREMENT (FIXED)
router.put("/requirements/:id", async (req, res) => {
    const { id } = req.params;

    const {
        requirements_description,
        category,
        short_label,
        xerox_copies,
        requires_original,
        is_optional,
        applicant_type
    } = req.body;

    const query = `
    UPDATE requirements_table
    SET description=?, short_label=?, category=?, xerox_copies=?, requires_original=?, is_optional=?, applicant_type=?
    WHERE id=?
  `;

    try {
        await db.execute(query, [
            requirements_description,
            short_label || null,
            category || "Main",
            xerox_copies || 0,
            requires_original ? 1 : 0,
            is_optional ? 1 : 0,
            applicant_type || "All",
            id
        ]);

        res.json({ message: "Requirement updated successfully" });
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ error: "Failed to update requirement" });
    }
});

// DELETE (REQUIREMENT PANEL)
router.delete("/requirements/:id", async (req, res) => {
    const { id } = req.params;
    const query = "DELETE FROM requirements_table WHERE id = ?";

    try {
        const [result] = await db.execute(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Requirement not found" });
        }

        res.status(200).json({ message: "Requirement deleted successfully" });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ error: "Failed to delete requirement" });
    }

});

router.get("/requirements/:person_id", async (req, res) => {
    const { person_id } = req.params;

    try { 
        const [applicantType] = await db.query(
            `SELECT applyingAs FROM person_table WHERE person_id = ?`, 
            [person_id]
        );

        if (applicantType.length === 0) {
            return res.status(404).json({ message: "Applicant Type of this is not found." });
        }

        const applying_as = applicantType[0].applyingAs;

        let query = `
            SELECT * 
            FROM requirements_table 
            WHERE (applicant_type = ? OR applicant_type = 0)
        `;
        let params = [applying_as];

        // ✅ Add condition when applicant_type = 2
        if (applying_as === 2) {
            query += " OR category = 'others'";
        }

        const [results] = await db.execute(query, params);

        res.json(results);

    } catch (err) {
        console.error("Fetch error:", err);
        return res.status(500).json({ error: "Failed to fetch requirements" });
    }
});

module.exports = router;
