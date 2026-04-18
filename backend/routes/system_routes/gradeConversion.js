const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const { db3 } = require("../database/database");

const router = express.Router();

async function getSemesterHonor(gwa) {
    const [rows] = await db3.query(
        `SELECT title 
     FROM honors_rules
     WHERE type='semester' AND ? <= max_allowed_grade
     ORDER BY max_allowed_grade ASC
     LIMIT 1`,
        [gwa]
    );

    return rows.length ? rows[0].title : null;
}

async function getGraduationHonor(gwa, year_level_id, semester_id) {
    // ❗ ONLY apply for 4th year 2nd sem
    if (!(year_level_id == 4 && semester_id == 2)) {
        return null;
    }

    const [rows] = await db3.query(
        `SELECT title 
     FROM honors_rules
     WHERE type='graduation'
     AND ? BETWEEN min_grade AND max_allowed_grade
     LIMIT 1`,
        [gwa]
    );

    return rows.length ? rows[0].title : null;
}

router.get("/admin/grade-conversion", async (req, res) => {
    try {
        const [rows] = await db3.query(
            "SELECT * FROM grade_conversion ORDER BY min_score DESC"
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch grade conversion" });
    }
});

router.post("/admin/grade-conversion", async (req, res) => {
    try {
        const { id, min_score, max_score, equivalent_grade, descriptive_rating } = req.body;

        // ✅ CASE 1: Special Grades (INC, DRP, etc.)
        const isSpecial =
            (!min_score || min_score === "") &&
            (!max_score || max_score === "") &&
            (!equivalent_grade || equivalent_grade === "");

        if (isSpecial && descriptive_rating) {
            if (id) {
                await db3.query(
                    `UPDATE grade_conversion 
           SET min_score=NULL, max_score=NULL, equivalent_grade=NULL, descriptive_rating=? 
           WHERE id=?`,
                    [descriptive_rating, id]
                );
            } else {
                await db3.query(
                    `INSERT INTO grade_conversion 
           (min_score, max_score, equivalent_grade, descriptive_rating)
           VALUES (NULL, NULL, NULL, ?)`,
                    [descriptive_rating]
                );
            }

            return res.json({ success: true });
        }

        // ✅ CASE 2: Numeric Grades
        if (
            min_score === "" ||
            max_score === "" ||
            equivalent_grade === ""
        ) {
            return res.status(400).json({ error: "All numeric fields are required" });
        }

        if (parseFloat(min_score) > parseFloat(max_score)) {
            return res.status(400).json({ error: "Min cannot be greater than Max" });
        }

        if (id) {
            await db3.query(
                `UPDATE grade_conversion 
         SET min_score=?, max_score=?, equivalent_grade=?, descriptive_rating=? 
         WHERE id=?`,
                [min_score, max_score, equivalent_grade, descriptive_rating || null, id]
            );
        } else {
            await db3.query(
                `INSERT INTO grade_conversion 
   (min_score, max_score, equivalent_grade, descriptive_rating)
   VALUES (?, ?, ?, ?)`,
                [
                    min_score || null,
                    max_score || null,
                    equivalent_grade,
                    descriptive_rating || null
                ]
            );
        }

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Save failed" });
    }
});

router.delete("/admin/grade-conversion/:id", async (req, res) => {
    try {
        await db3.query("DELETE FROM grade_conversion WHERE id=?", [
            req.params.id,
        ]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

router.get("/admin/honors-rules", async (req, res) => {
    try {
        const [rows] = await db3.query(
            "SELECT * FROM honors_rules ORDER BY max_allowed_grade ASC"
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch rules" });
    }
});

router.post("/admin/honors-rules", async (req, res) => {
    try {
        const { id, title, min_grade, max_allowed_grade, type } = req.body;


        if (type === "graduation") {
            if (!min_grade || !max_allowed_grade) {
                return res.status(400).json({ error: "Min and Max required for graduation honors" });
            }
        }
        if (id) {
            await db3.query(
                `UPDATE honors_rules 
     SET title=?, min_grade=?, max_allowed_grade=?, type=? 
     WHERE id=?`,
                [title, min_grade || null, max_allowed_grade, type, id]
            );
        } else {
            await db3.query(
                `INSERT INTO honors_rules (title, min_grade, max_allowed_grade, type)
     VALUES (?, ?, ?, ?)`,
                [title, min_grade || null, max_allowed_grade, type]
            );
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Save failed" });
    }
});

router.delete("/admin/honors-rules/:id", async (req, res) => {
    try {
        await db3.query("DELETE FROM honors_rules WHERE id=?", [
            req.params.id,
        ]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

module.exports = router;
