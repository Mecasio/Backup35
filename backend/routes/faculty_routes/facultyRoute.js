const express = require("express");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { db, db3 } = require("../database/database");

require("dotenv").config();

const router = express.Router();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const upload = multer({ storage: multer.memoryStorage() });

router.post("/update_faculty", upload.single("profile_picture"), async (req, res) => {
  const { person_id } = req.body;

  if (!person_id || !req.file) {
    return res.status(400).send("Missing person_id or file.");
  }

  try {
    // ✅ Get student_number from person_id
    const [rows] = await db3.query(
      "SELECT employee_id FROM prof_table WHERE person_id = ?",
      [person_id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "employee id not found for person_id " + person_id });
    }

    const employee_id = rows[0].employee_id;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const year = new Date().getFullYear();
    const filename = `${employee_id}_1by1_${year}${ext}`;
    const uploadDir = path.join(__dirname, "../../uploads/Faculty1by1");
    const finalPath = path.join(uploadDir, filename);

    const files = await fs.promises.readdir(uploadDir);
    for (const file of files) {
      if (file.startsWith(`${employee_id}_1by1_`)) {
        await fs.promises.unlink(path.join(uploadDir, file));
      }
    }

    await fs.promises.writeFile(finalPath, req.file.buffer);

    await db3.query("UPDATE prof_table SET profile_image = ? WHERE person_id = ?", [filename, person_id]);

    res.status(200).json({ message: "Uploaded successfully", filename });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).send("Failed to upload image.");
  }
});

// Fetch all professors
router.get("/professors", async (req, res) => {
  try {
    const [rows] = await db3.query(`
      SELECT
        pft.prof_id,
        pft.person_id,
        pft.employee_id,
        pft.fname,
        pft.mname,
        pft.lname,
        pft.email,
        pft.role,
        pft.status,
        pft.profile_image,
        MIN(dpt.dprtmnt_name) AS dprtmnt_name,
        MIN(dpt.dprtmnt_code) AS dprtmnt_code
      FROM dprtmnt_profs_table AS dpft
      INNER JOIN prof_table AS pft ON dpft.prof_id = pft.prof_id
      INNER JOIN dprtmnt_table AS dpt ON dpft.dprtmnt_id = dpt.dprtmnt_id
      GROUP BY pft.prof_id
    `);
    res.json(rows);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to retrieve professors", details: err.message });
  }
});

// ADD PROFESSOR ROUTE (Consistent with /api)
router.post(
  "/register_prof",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const {
        person_id,
        fname,
        mname,
        lname,
        email,
        password,
        dprtmnt_id,
        role,
      } = req.body;

      const [existingUser] = await db3.query(
        "SELECT * FROM prof_table WHERE email = ?",
        [email],
      );

      if (existingUser.length > 0) {
        return res.json({
          success: false,
          error: "Email already exists. Please use a different email.",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      let profileImage = null;
      if (req.file) {
        const year = new Date().getFullYear();
        const ext = path.extname(req.file.originalname).toLowerCase();
        const filename = `${person_id}_ProfessorProfile_${year}${ext}`;
        const filePath = path.join(__dirname, "uploads", filename);
        await fs.promises.writeFile(filePath, req.file.buffer);
        profileImage = filename;
      }

      const sql = `INSERT INTO prof_table (person_id, fname, mname, lname, email, password, role, profile_image)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const values = [
        person_id,
        fname,
        mname,
        lname,
        email,
        hashedPassword,
        role,
        profileImage,
      ];

      const [result] = await db3.query(sql, values);
      const prof_id = result.insertId;

      const sql2 = `INSERT INTO dprtmnt_profs_table (dprtmnt_id, prof_id) VALUES (?, ?)`;
      await db3.query(sql2, [dprtmnt_id, prof_id]);

      res
        .status(201)
        .json({ success: true, message: "Professor added successfully" });
    } catch (err) {
      console.error("Insert error:", err);
      res.json({ success: false, error: "Failed to add professor" });
    }
  },
);

// Update professor info
router.put(
  "/update_prof/:id",
  upload.single("profileImage"),
  async (req, res) => {
    const id = req.params.id;
    const {
      person_id,
      fname,
      mname,
      lname,
      email,
      password,
      dprtmnt_id,
      role,
    } = req.body;

    try {
      const checkSQL = `SELECT * FROM prof_table WHERE email = ? AND prof_id != ?`;
      const [existingRows] = await db3.query(checkSQL, [email, id]);

      if (existingRows.length > 0) {
        return res.json({
          success: false,
          error: "Email already exists for another professor.",
        });
      }

      let profileImage = null;

      if (req.file) {
        const year = new Date().getFullYear();
        const ext = path.extname(req.file.originalname).toLowerCase();
        const filename = `${person_id}_ProfessorProfile_${year}${ext}`;
        const filePath = path.join(__dirname, "uploads", filename);
        await fs.promises.writeFile(filePath, req.file.buffer);
        profileImage = filename;
      }

      let updateSQL;
      let values;

      if (password && profileImage) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateSQL = `
        UPDATE prof_table
        SET person_id = ?, fname = ?, mname = ?, lname = ?, email = ?, password = ?, role = ?, profile_image = ?
        WHERE prof_id = ?
      `;
        values = [
          person_id,
          fname,
          mname,
          lname,
          email,
          hashedPassword,
          role,
          profileImage,
          id,
        ];
      } else if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateSQL = `
        UPDATE prof_table
        SET person_id = ?, fname = ?, mname = ?, lname = ?, email = ?, password = ?, role = ?
        WHERE prof_id = ?
      `;
        values = [
          person_id,
          fname,
          mname,
          lname,
          email,
          hashedPassword,
          role,
          id,
        ];
      } else if (profileImage) {
        updateSQL = `
        UPDATE prof_table
        SET person_id = ?, fname = ?, mname = ?, lname = ?, email = ?, role = ?, profile_image = ?
        WHERE prof_id = ?
      `;
        values = [
          person_id,
          fname,
          mname,
          lname,
          email,
          role,
          profileImage,
          id,
        ];
      } else {
        updateSQL = `
        UPDATE prof_table
        SET person_id = ?, fname = ?, mname = ?, lname = ?, email = ?, role = ?
        WHERE prof_id = ?
      `;
        values = [person_id, fname, mname, lname, email, role, id];
      }

      await db3.query(updateSQL, values);

      if (dprtmnt_id) {
        const [existing] = await db3.query(
          `SELECT * FROM dprtmnt_profs_table WHERE prof_id = ?`,
          [id],
        );

        if (existing.length > 0) {
          await db3.query(
            `UPDATE dprtmnt_profs_table SET dprtmnt_id = ? WHERE prof_id = ?`,
            [dprtmnt_id, id],
          );
        } else {
          await db3.query(
            `INSERT INTO dprtmnt_profs_table (dprtmnt_id, prof_id) VALUES (?, ?)`,
            [dprtmnt_id, id],
          );
        }
      }

      res.json({ success: true, message: "Professor updated successfully." });
    } catch (err) {
      res.json({ success: false, error: "Internal server error." });
    }
  },
);

// Toggle professor status (Active/Inactive)
router.put("/update_prof_status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const [result] = await db3.query(
      "UPDATE prof_table SET status = ? WHERE prof_id = ?",
      [status, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Professor not found" });
    }

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Status update error:", err);
    res
      .status(500)
      .json({ error: "Failed to update status", details: err.message });
  }
});


router.post("/import_professors", async (req, res) => {
  const { professors } = req.body;

  let conn;

  try {
    if (!Array.isArray(professors) || professors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No professors to import",
      });
    }

    conn = await db3.getConnection();
    await conn.beginTransaction();

    // ✅ STEP 1: get all existing emails + employee_ids (ONE QUERY ONLY)
    const [existingRows] = await conn.query(
      `SELECT email, employee_id FROM prof_table`
    );

    const existingEmails = new Set(existingRows.map(e => e.email));
    const existingEmpIds = new Set(existingRows.map(e => e.employee_id));

    const values = [];
    const imported = [];
    const skipped = [];

    for (const prof of professors) {
      const employee_id = prof.employeeNumber?.toString().trim();
      const fname = prof.firstName?.trim();
      const mname = prof.middleName?.trim() || "";
      const lname = prof.lastName?.trim();
      const email = prof.email?.trim();

      if (!employee_id || !fname || !lname || !email) {
        skipped.push({ employee_id, email, reason: "Missing fields" });
        continue;
      }

      if (existingEmails.has(email) || existingEmpIds.has(employee_id)) {
        skipped.push({ employee_id, email, reason: "Duplicate" });
        continue;
      }

      // ⚡ NO BCRYPT (FAST) — plain password muna
      const defaultPassword = lname.toUpperCase();

      values.push([
        employee_id,
        fname,
        mname,
        lname,
        email,
        defaultPassword, // ⚡ NO HASH muna
        1,
        "faculty",
        0
      ]);

      imported.push({ employee_id, email });
    }

    // ✅ STEP 2: BULK INSERT (VERY FAST)
    if (values.length > 0) {
      await conn.query(
        `INSERT INTO prof_table 
        (employee_id, fname, mname, lname, email, password, status, role, require_otp)
        VALUES ?`,
        [values]
      );
    }

    await conn.commit();

    res.json({
      success: true,
      importedCount: imported.length,
      skippedCount: skipped.length,
      imported,
      skipped,
    });

  } catch (error) {
    if (conn) await conn.rollback();

    console.error("IMPORT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Import failed",
      error: error.message,
    });
  } finally {
    if (conn) conn.release();
  }


});

router.post("/notify_faculty", async (req, res) => {
  const { employee_id, email, password } = req.body;

  let conn;

  try {
    if (!employee_id || !email) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and Email are required"
      });
    }

    conn = await db3.getConnection();

    // ✅ USE employee_id instead of person_id
    const [prof] = await conn.query(
      `SELECT fname, mname, lname, employee_id 
       FROM prof_table 
       WHERE employee_id = ?`,
      [employee_id]
    );

    if (prof.length === 0) {
      return res.json({
        success: false,
        message: "Professor not found"
      });
    }

    const finalPassword = password || generateRandomPassword();
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    await conn.beginTransaction();

    // ✅ UPDATE using employee_id
    await conn.query(
      `UPDATE prof_table 
       SET email = ?, password = ? 
       WHERE employee_id = ?`,
      [email, hashedPassword, employee_id]
    );

    const frontendUrl = process.env.FRONTEND_URL;

    const [companyRows] = await db.query(`
      SELECT company_name, short_term
      FROM company_settings
      LIMIT 1
    `);

    const company_name = companyRows[0]?.company_name || "Company";
    const short_term = companyRows[0]?.short_term || "System";

    console.log("Sending email to:", email);
    console.log("Password:", finalPassword);

    await transporter.sendMail({
      from: `"${short_term} - Faculty Account" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${short_term} - Faculty Account Created`,
      html: `
        <h3>${company_name} Faculty Portal Account</h3>

        <p>Hello <b>${prof[0].lname}, ${prof[0].fname} ${prof[0].mname}</b>,</p>

        <p>Your faculty account has been created.</p>

        <h4>Login Credentials</h4>

        <p>
          <b>Username:</b> ${email} / ${prof[0].employee_id}<br/>
          <b>Password:</b> ${finalPassword}
        </p>

        <p style="color:red;">
          Please change your password after your first login.
        </p>

        <p>
          <a href="${frontendUrl}/login">${frontendUrl}/login</a>
        </p>
      `
    });

    await conn.commit();

    res.json({
      success: true,
      message: "Faculty notified successfully",
      password: finalPassword
    });

  } catch (error) {
    if (conn) await conn.rollback();

    console.error("EMAIL ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  } finally {
    if (conn) conn.release();
  }
});


module.exports = router;
