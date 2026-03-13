const express = require("express");
const { db, db3 } = require("../database/database");

const router = express.Router();

router.get("/programs/availability", async (req, res) => {
  const { year_id, semester_id } = req.query;
  try {
    if (!year_id || !semester_id) {
      return res.status(400).json({ message: "Missing year_id or semester_id" });
    }

    const [activeRows] = await db3.query(
      "SELECT id FROM active_school_year_table WHERE year_id = ? AND semester_id = ? LIMIT 1",
      [year_id, semester_id],
    );
    const activeSchoolYearId = activeRows[0]?.id;

    if (!activeSchoolYearId) {
      return res.json([]);
    }

    // Step 1: Get all programs from db3
    const [curriculum] = await db3.query(`
      SELECT 
        dc.dprtmnt_curriculum_id,
        dc.dprtmnt_id,
        dc.curriculum_id,
        dt.dprtmnt_name,
        dt.dprtmnt_code,
        ct.curriculum_id AS ct_curriculum_id,
        ct.year_id,
        y.year_description,
        ct.program_id,
        ct.lock_status,
        p.program_description,
        p.program_code,
        p.major
      FROM dprtmnt_curriculum_table AS dc
      INNER JOIN dprtmnt_table AS dt 
        ON dc.dprtmnt_id = dt.dprtmnt_id
      INNER JOIN curriculum_table AS ct 
        ON dc.curriculum_id = ct.curriculum_id
      INNER JOIN program_table AS p 
        ON ct.program_id = p.program_id
      INNER JOIN year_table AS y
        ON ct.year_id = y.year_id
      ORDER BY dt.dprtmnt_name, p.program_description;
    `);

    const curriculumIds = curriculum.map((p) => p.curriculum_id);

    // Step 2: Get slots and applicants from db
    const [slots] = await db.query(
      `
      SELECT
        ps.curriculum_id,
        ps.max_slots,
        ps.active_school_year_id,
        COUNT(ap.applied_id) AS total_applicants
      FROM program_slots ps
      LEFT JOIN applied_programs ap ON ap.curriculum_id = ps.curriculum_id
      WHERE ps.curriculum_id IN (?)
        AND ps.active_school_year_id = ?
      GROUP BY ps.curriculum_id, ps.max_slots, ps.active_school_year_id
    `,
      [curriculum.length ? curriculumIds : [0], activeSchoolYearId],
    );

    const [totalEnrolled] = await db3.query(
      `
        SELECT es.student_number, es.curriculum_id
        FROM enrollment.enrolled_subject AS es
        INNER JOIN enrollment.student_status_table AS sts ON es.student_number = sts.student_number
        INNER JOIN admission.program_slots AS ps
          ON es.curriculum_id = ps.curriculum_id
          AND ps.active_school_year_id = ?
        WHERE es.active_school_year_id = ?
          AND sts.year_level_id = 1
        GROUP BY es.student_number, es.curriculum_id, es.active_school_year_id;
      `,
      [activeSchoolYearId, activeSchoolYearId],
    );

    const enrolledCountMap = totalEnrolled.reduce((acc, e) => {
      acc[e.curriculum_id] = (acc[e.curriculum_id] || 0) + 1;
      return acc;
    }, {});

    // Step 3: Merge data
    const merged = curriculum.map((p) => {
      const slot = slots.find((s) => s.curriculum_id === p.curriculum_id);
      const enrolled = totalEnrolled.find(
        (e) => e.curriculum_id === p.curriculum_id,
      );

      const max_slots = slot?.max_slots || 0;
      const total_enrolled = enrolledCountMap[p.curriculum_id] || 0;

      return {
        ...p,
        active_school_year_id: slot?.active_school_year_id || activeSchoolYearId,
        max_slots,
        total_enrolled,
        remaining: Math.max(max_slots - total_enrolled, 0),
      };
    });

    res.json(merged);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch program availability" });
  }
});

router.post("/apply", async (req, res) => {
  console.log("apply route body:", req.body);
  const { curriculum_id, year_id, person_id } = req.body;

  // Use db pool instead of undefined pool
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Prevent double application
    const [[alreadyapplied]] = await connection.query(
      `
  SELECT program
  FROM admission.person_table
  WHERE person_id = ?
    AND program IS NOT NULL
`,
      [person_id],
    );

    if (alreadyapplied) {
      await connection.rollback();
      return res.json({
        message: "You have already applied to a program",
        alreadyapplied: true,
        curriculum_id: alreadyapplied.program, // optional
      });
    }

    // Lock slot row
    const [[slot]] = await connection.query(
      `
      SELECT 
        ps.max_slots,
        COUNT(DISTINCT pt.person_id) AS used_slots
      FROM enrollment.curriculum_table c
      JOIN admission.program_slots ps
        ON ps.curriculum_id = c.curriculum_id
      LEFT JOIN admission.person_table pt
        ON pt.program = c.curriculum_id
      WHERE c.curriculum_id = ?
      FOR UPDATE
    `,
      [curriculum_id],
    );

    if (!slot) {
      await connection.rollback();
      return res.status(400).json({
        message: "Program slot not configured",
      });
    }

    if (slot.used_slots >= slot.max_slots) {
      await connection.rollback();
      return res.status(403).json({
        message: "This program is already full",
      });
    }

    // Assign program
    await connection.query(
      `
      UPDATE admission.person_table
      SET program = ?
      WHERE person_id = ?
    `,
      [curriculum_id, person_id],
    );

    await connection.commit();
    res.json({ message: "application submitted successfully" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "application failed" });
  } finally {
    connection.release();
  }
});

router.post("/program-slots", async (req, res) => {
  const { curriculum_id, max_slots, year_id, semester_id } = req.body;

  if (!curriculum_id || !max_slots || !year_id || !semester_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const [activeRows] = await db3.query(
      "SELECT id FROM active_school_year_table WHERE year_id = ? AND semester_id = ? LIMIT 1",
      [year_id, semester_id],
    );
    const activeSchoolYearId = activeRows[0]?.id;

    if (!activeSchoolYearId) {
      return res
        .status(400)
        .json({ message: "Active school year not found for selection" });
    }

    // check if already exists
    const [[existing]] = await db.query(
      `
      SELECT slot_id
      FROM admission.program_slots
      WHERE curriculum_id = ? AND active_school_year_id = ?
    `,
      [curriculum_id, activeSchoolYearId],
    );

    if (existing) {
      // UPDATE
      await db.query(
        `
        UPDATE admission.program_slots
        SET max_slots = ?
        WHERE curriculum_id = ? AND active_school_year_id = ?
      `,
        [max_slots, curriculum_id, activeSchoolYearId],
      );

      return res.json({ message: "Program slots updated" });
    }

    // INSERT
    await db.query(
      `
      INSERT INTO admission.program_slots
      (curriculum_id, max_slots, active_school_year_id, created_at)
      VALUES (?, ?, ?, NOW())
    `,
      [curriculum_id, max_slots, activeSchoolYearId],
    );

    res.json({ message: "Program slots created" });
  } catch (err) {
    console.error("Error saving program slots:", err);
    res.status(500).json({ message: "Failed to save program slots" });
  }
});

router.post("/program-slots/department", async (req, res) => {
  const { dprtmnt_id, max_slots, year_id, semester_id } = req.body;

  if (!dprtmnt_id || !max_slots || !year_id || !semester_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const connection = await db.getConnection();

  try {
    const [activeRows] = await db3.query(
      "SELECT id FROM active_school_year_table WHERE year_id = ? AND semester_id = ? LIMIT 1",
      [year_id, semester_id],
    );
    const activeSchoolYearId = activeRows[0]?.id;

    if (!activeSchoolYearId) {
      return res
        .status(400)
        .json({ message: "Active school year not found for selection" });
    }

    const [curriculumRows] = await db3.query(
      `
      SELECT dc.curriculum_id
      FROM dprtmnt_curriculum_table dc
      WHERE dc.dprtmnt_id = ?
    `,
      [dprtmnt_id],
    );

    const curriculumIds = curriculumRows.map((row) => row.curriculum_id);
    if (!curriculumIds.length) {
      return res.status(404).json({ message: "No programs found for department" });
    }

    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      `
      SELECT curriculum_id
      FROM admission.program_slots
      WHERE active_school_year_id = ?
        AND curriculum_id IN (?)
    `,
      [activeSchoolYearId, curriculumIds],
    );
    const existingSet = new Set(existingRows.map((row) => row.curriculum_id));

    for (const curriculumId of curriculumIds) {
      if (existingSet.has(curriculumId)) {
        await connection.query(
          `
          UPDATE admission.program_slots
          SET max_slots = ?
          WHERE curriculum_id = ? AND active_school_year_id = ?
        `,
          [max_slots, curriculumId, activeSchoolYearId],
        );
      } else {
        await connection.query(
          `
          INSERT INTO admission.program_slots
          (curriculum_id, max_slots, active_school_year_id, created_at)
          VALUES (?, ?, ?, NOW())
        `,
          [curriculumId, max_slots, activeSchoolYearId],
        );
      }
    }

    await connection.commit();
    res.json({ message: "Program slots updated for department" });
  } catch (err) {
    await connection.rollback();
    console.error("Error saving department program slots:", err);
    res.status(500).json({ message: "Failed to save department program slots" });
  } finally {
    connection.release();
  }
});

module.exports = router
