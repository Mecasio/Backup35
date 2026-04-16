const express = require('express');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { db, db3 } = require('../database/database');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/student-info", async (req, res) => {
  const { searchQuery } = req.query;

  try {
    const keyword = `%${searchQuery}%`;

    const [searchStudentNumber] = await db3.query(
      `
      SELECT snt.student_number
      FROM student_numbering_table snt
      INNER JOIN person_table pt ON snt.person_id = pt.person_id
      WHERE 
        pt.emailAddress = ?
        OR pt.first_name LIKE ?
        OR pt.last_name LIKE ?
        OR pt.middle_name LIKE ?
        OR snt.student_number = ?
      `,
      [searchQuery, keyword, keyword, keyword, searchQuery]
    );

    console.log("LOG #1: ",searchStudentNumber);

    if (searchStudentNumber.length === 0) {
      return res.status(400).json({ error: "student is not found" });
    }

    const student_number = searchStudentNumber[0].student_number;

    const [rows] = await db3.query(
      `
        SELECT
  pst.first_name,
  pst.middle_name,
  pst.last_name, 
  pst.presentStreet,
  pst.emailAddress,
  pst.cellphoneNumber,
  pst.campus,
  pst.presentBarangay,
  pst.presentZipCode,
  pst.presentMunicipality,
  pgt.program_description, 
  yrt_cur.year_description, 
  yrt_sy.year_description AS current_year, 
  smt.semester_description,
  snt.student_number,
  sst.year_level_id,
  ylt.year_level_description
FROM student_numbering_table snt
INNER JOIN enrolled_subject es 
    ON es.student_number = snt.student_number
INNER JOIN person_table pst 
    ON pst.person_id = snt.person_id
INNER JOIN student_status_table sst 
    ON sst.student_number = snt.student_number 
    AND sst.active_school_year_id = es.active_school_year_id
INNER JOIN curriculum_table cct 
    ON cct.curriculum_id = es.curriculum_id
INNER JOIN program_table pgt 
    ON pgt.program_id = cct.program_id
INNER JOIN active_school_year_table sy 
    ON sy.id = es.active_school_year_id
INNER JOIN year_table yrt_cur 
    ON yrt_cur.year_id = cct.year_id
INNER JOIN year_table yrt_sy 
    ON yrt_sy.year_id = sy.year_id
INNER JOIN year_level_table ylt 
    ON ylt.year_level_id = sst.year_level_id
INNER JOIN semester_table smt 
    ON smt.semester_id = sy.semester_id
WHERE snt.student_number = ?
ORDER BY 
  sy.year_id DESC,
  sst.year_level_id DESC
LIMIT 1;
      `, [student_number]
    ) 

    if (rows.length === 0) {
      return res.status(400).json({ error: "student record is not found" });
    }

    res.json(rows)
  } catch (err) {
    console.error("Failed to get student record:", err);
    res.status(500).send("Failed to get student record.");
  }
})

router.get("/student-info/:student_number", async (req, res) => {
  const { student_number } = req.params;

  try {
    const [rows] = await db3.query(
      `
        SELECT DISTINCT
          es.id,
          cct.curriculum_id,
          sy.id as active_school_year_id, 
          pgt.program_description, 
          yrt_cur.year_description, 
          yrt_sy.year_description AS current_year, 
          smt.semester_description,
          snt.student_number,
          IFNULL(es.final_grade, "-") as final_grade,
          IFNULL(es.en_remarks, 0) as en_remarks,
          ylt.year_level_description, 
          cst.course_id,
		      cst.course_code,
          cst.course_description,
          cst.course_unit,
          es.remarks,
          sst.id AS student_status_id
        FROM enrolled_subject es
          INNER JOIN student_numbering_table snt ON es.student_number = snt.student_number
          INNER JOIN student_status_table sst ON snt.student_number = sst.student_number
            AND es.active_school_year_id = sst.active_school_year_id
          INNER JOIN curriculum_table cct ON es.curriculum_id = cct.curriculum_id
          INNER JOIN program_table pgt ON cct.program_id = pgt.program_id
          INNER JOIN active_school_year_table sy ON es.active_school_year_id = sy.id
          INNER JOIN year_table yrt_cur ON cct.year_id = yrt_cur.year_id
          INNER JOIN year_table yrt_sy ON sy.year_id = yrt_sy.year_id
          INNER JOIN year_level_table ylt ON sst.year_level_id = ylt.year_level_id 
          INNER JOIN semester_table smt ON sy.semester_id = smt.semester_id
          INNER JOIN course_table cst ON es.course_id = cst.course_id
          WHERE es.student_number = ? ORDER BY ylt.year_level_id, es.id;
      `, [student_number]
    )

    console.log("Inserted Data: ", rows);

    if (rows.length === 0) {
      return res.status(400).json({ error: "student record is not found" });
    }

    res.json(rows)
  } catch (err) {
    console.error("Failed to get student record:", err);
    res.status(500).send("Failed to get student record.");
  }
})

router.put("/update_student_year_level", async (req, res) => {
  const { new_year_level_id, id } = req.body;

  try {
    if (!new_year_level_id || !id) {
      return res.status(400).json({ message: "Missing required variables." });
    }

    await db3.query(
      `UPDATE student_status_table SET year_level_id = ? WHERE id = ?`,
      [new_year_level_id, id]
    );

    res
      .status(200)
      .json({ message: "Student Year Level was successfully changed." });
  } catch (err) {
    console.log("Internal Server Error: " + err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/update_student", upload.single("profile_picture"), async (req, res) => {
  const { person_id } = req.body;
  if (!person_id || !req.file) {
    return res.status(400).send("Missing person_id or file.");
  }

  try {
    // ✅ Get student_number from person_id
    const [rows] = await db3.query(
      "SELECT student_number FROM student_numbering_table WHERE person_id = ?",
      [person_id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "student number not found for person_id " + person_id });
    }

    const student_number = rows[0].student_number;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const year = new Date().getFullYear();
    const filename = `${student_number}_1by1_${year}${ext}`;
    const uploadDir = path.join(__dirname, "../../uploads/Student1by1");
    const finalPath = path.join(uploadDir, filename);

    const files = await fs.promises.readdir(uploadDir);
    for (const file of files) {
      if (file.startsWith(`${student_number}_1by1_`)) {
        await fs.promises.unlink(path.join(uploadDir, file));
      }
    }

    await fs.promises.writeFile(finalPath, req.file.buffer);

    await db3.query("UPDATE person_table SET profile_img = ? WHERE person_id = ?", [filename, person_id]);

    res.status(200).json({ message: "Uploaded successfully", filename });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).send("Failed to upload image.");
  }
});

router.get("/api/student_schedule/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db3.execute(
      `
    SELECT DISTINCT
      ct.course_description,
      ct.course_code,
      ct.course_unit,
      ct.lab_unit,
      pgt.program_code,
      st.description AS section_description,
      IFNULL(pft.lname, 'TBA') AS prof_lastname,
      IFNULL(rdt.description, 'TBA') AS day_description,
      IFNULL(tt.school_time_start, 'TBA') AS school_time_start,
      IFNULL(tt.school_time_end, 'TBA') AS school_time_end,
      IFNULL(rt.room_description, 'TBA') AS room_description,
      IFNULL(pft.fname, 'TBA') AS fname,
      IFNULL(pft.lname, 'TBA') AS lname
     FROM enrolled_subject AS es
    JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
    JOIN person_table AS pt ON snt.person_id = pt.person_id
    JOIN course_table AS ct ON es.course_id = ct.course_id
    JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
    JOIN curriculum_table AS cct ON es.curriculum_id = cct.curriculum_id
    JOIN program_table AS pgt ON cct.program_id = pgt.program_id
    JOIN section_table AS st ON dst.section_id = st.id
    LEFT JOIN time_table AS tt
      ON tt.course_id = es.course_id
     AND tt.department_section_id = es.department_section_id
     AND tt.school_year_id = es.active_school_year_id
    LEFT JOIN room_day_table AS rdt ON tt.room_day = rdt.id
    LEFT JOIN room_table AS rt ON tt.department_room_id = rt.room_id
    LEFT JOIN prof_table AS pft ON tt.professor_id = pft.prof_id
    JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
    WHERE pt.person_id = ? AND sy.astatus = 1;`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }
    console.log(rows);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching person:", error);
    res.status(500).json({ error: "Database error" });
  }
});

//GET Grading Status Period
router.get("/api/grading_status", async (req, res) => {
  try {
    const [rows] = await db3.execute(
      "SELECT status FROM period_status WHERE description = 'Final Grading Period'",
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Grading period not found" });
    }

    res.json({ status: rows[0].status });
    console.log({ status: rows[0].status });
  } catch (err) {
    console.error("Error checking grading status:", err);
    res.status(500).json({ message: "Database error" });
  }
});


router.get("/api/student_grade/:id", async (req, res) => {
  const { id } = req.params;

  try {

    const [pending] = await db3.execute(
      `
      SELECT COUNT(*) AS total_professors
      FROM enrolled_subject AS es
      JOIN student_numbering_table AS snt
        ON es.student_number = snt.student_number
      WHERE es.fe_status = 0
      AND snt.person_id = ?
      `,
      [id],
    );

    const [rows] = await db3.execute(
      `
    SELECT DISTINCT

  ct.course_description,
  ct.course_code,
  es.en_remarks,
  es.remarks,
  ct.course_unit,
  ct.lab_unit,

  pgt.program_code,
  pgt.program_description,

  st.description AS section_description,

  pft.lname AS prof_lastname,
  rdt.description AS day_description,
  tt.school_time_start,
  tt.school_time_end,
  rt.room_description,

  -- ✅ YEAR LEVEL (FROM student_status_table)
  ylt.year_level_description,
  sst.year_level_id,

  -- ✅ SEMESTER / SCHOOL YEAR
  smt.semester_description,
  smt.semester_id,
  yt.year_description,

  IFNULL(pft.fname, 'TBA') AS fname,
  IFNULL(pft.lname, 'TBA') AS lname,

  es.final_grade,
  es.fe_status,
  es.active_school_year_id,

  pt.last_name,
  pt.first_name,
  pt.middle_name,

  snt.student_number,

  CASE
    WHEN LOWER(IFNULL(es.remarks, '')) = 'migrated from old system'
    THEN 1
    ELSE 0
  END AS is_migrated

FROM enrolled_subject AS es

JOIN student_numbering_table AS snt
  ON es.student_number = snt.student_number

JOIN person_table AS pt
  ON snt.person_id = pt.person_id

-- ✅ IMPORTANT JOIN
JOIN student_status_table AS sst
  ON sst.student_number = es.student_number
  AND sst.active_school_year_id = es.active_school_year_id

LEFT JOIN dprtmnt_section_table AS dst
  ON es.department_section_id = dst.id

JOIN curriculum_table AS cct
  ON es.curriculum_id = cct.curriculum_id

JOIN program_table AS pgt
  ON cct.program_id = pgt.program_id

LEFT JOIN section_table AS st
  ON dst.section_id = st.id

LEFT JOIN time_table AS tt
  ON tt.course_id = es.course_id
  AND tt.department_section_id = es.department_section_id
  AND tt.school_year_id = es.active_school_year_id

LEFT JOIN room_day_table AS rdt
  ON tt.room_day = rdt.id

LEFT JOIN room_table AS rt
  ON tt.department_room_id = rt.room_id

LEFT JOIN prof_table AS pft
  ON tt.professor_id = pft.prof_id

JOIN active_school_year_table AS sy
  ON es.active_school_year_id = sy.id

JOIN year_table AS yt
  ON sy.year_id = yt.year_id

JOIN semester_table AS smt
  ON sy.semester_id = smt.semester_id

JOIN course_table AS ct
  ON es.course_id = ct.course_id

-- OPTIONAL (if still needed)
LEFT JOIN program_tagging_table AS ptg
  ON ptg.curriculum_id = es.curriculum_id
  AND ptg.course_id = es.course_id

LEFT JOIN year_level_table AS ylt
  ON sst.year_level_id = ylt.year_level_id

WHERE pt.person_id = ?

-- ✅ LATEST FIRST (IMPORTANT)
ORDER BY
  yt.year_description DESC,
  smt.semester_id DESC,
  sst.year_level_id DESC;
      `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Schedule not found",
      });
    }

    res.json(rows);

  } catch (error) {
    console.error("Error fetching person:", error);
    res.status(500).json({
      error: "Database error",
    });
  }
});



router.get("/api/student/view_latest_grades/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [courses] = await db3.execute(
      `
      SELECT DISTINCT
        ct.course_description,
        ct.course_code,
        es.en_remarks,
        es.remarks,
        ct.course_unit,
        ct.lab_unit,
        pgt.program_code,
        pgt.program_description,
        st.description AS section_description,
        pft.lname AS prof_lastname,
        IFNULL(pft.fname, 'TBA') AS fname,
        IFNULL(pft.lname, 'TBA') AS lname,
        rdt.description AS day_description,
        tt.school_time_start,
        tt.school_time_end,
        rt.room_description,
        yt.year_description AS first_year,
        yt.year_description + 1 AS last_year,
        smt.semester_description,
        es.final_grade,
        es.fe_status,
        es.en_remarks,
        CASE
          WHEN LOWER(IFNULL(es.remarks, '')) = 'migrated from old system' THEN 1
          ELSE 0
        END AS is_migrated
      FROM enrolled_subject AS es
        JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
        JOIN person_table AS pt ON snt.person_id = pt.person_id
        JOIN course_table AS ct ON es.course_id = ct.course_id
        LEFT JOIN dprtmnt_section_table AS dst ON es.department_section_id = dst.id
        JOIN curriculum_table AS cct ON es.curriculum_id = cct.curriculum_id
        JOIN program_table AS pgt ON cct.program_id = pgt.program_id
        LEFT JOIN section_table AS st ON dst.section_id = st.id
        LEFT JOIN time_table AS tt
          ON tt.course_id = es.course_id
        AND tt.department_section_id = es.department_section_id
        LEFT JOIN room_day_table AS rdt ON tt.room_day = rdt.id
        LEFT JOIN room_table AS rt ON tt.department_room_id = rt.room_id
        LEFT JOIN prof_table AS pft ON tt.professor_id = pft.prof_id
        JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
        JOIN year_table AS yt ON sy.year_id = yt.year_id
        JOIN semester_table AS smt ON sy.semester_id = smt.semester_id
      WHERE pt.person_id = ?
    `,
      [id],
    );

    res.json({ status: "ok", grades: courses });
  } catch (error) {
    console.error("Error fetching grades:", error);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/api/student_course/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db3.execute(
      `
      SELECT DISTINCT snt.student_number, pt.prof_id, cyt.year_description AS curriculum_year,cct.curriculum_id, sy.id AS active_school_year_id, ct.course_id, pt.fname, pt.mname, pt.lname, ct.course_description, ct.course_code, pt.fname, pt.mname, pt.lname, dt.dprtmnt_code AS department, ct.course_code,pgt.program_code, smt.semester_description, yrt.year_description AS current_year, yrt.year_description + 1 AS next_year FROM enrolled_subject AS es
        INNER JOIN student_numbering_table AS snt ON es.student_number = snt.student_number
        INNER JOIN person_table AS pst ON snt.person_id = pst.person_id
        INNER JOIN course_table AS ct ON es.course_id = ct.course_id
        INNER JOIN curriculum_table AS cct ON es.curriculum_id = cct.curriculum_id
        LEFT JOIN time_table AS tt
          ON tt.course_id = es.course_id
          AND tt.department_section_id = es.department_section_id
        LEFT JOIN prof_table AS pt ON tt.professor_id = pt.prof_id
        INNER JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
        LEFT JOIN dprtmnt_curriculum_table AS dct ON es.curriculum_id = dct.curriculum_id
        LEFT JOIN dprtmnt_table AS dt ON dct.dprtmnt_id = dt.dprtmnt_id
        LEFT JOIN program_table AS pgt ON cct.program_id = pgt.program_id
        LEFT JOIN year_table AS yrt ON sy.year_id = yrt.year_id
        LEFT JOIN year_table AS cyt ON cct.year_id = cyt.year_id
        LEFT JOIN semester_table AS smt ON sy.semester_id = smt.semester_id
      WHERE pst.person_id = ?
        AND sy.astatus = 1
        AND es.fe_status = 0
        AND LOWER(IFNULL(es.remarks, '')) <> 'migrated from old system';
    `,
      [id],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Professor Data are not found" });
    }

    res.json(rows);
  } catch (err) {
    console.error("Error checking grading status:", err);
    res.status(500).json({ message: "Database error" });
  }
});

router.post("/api/student_evaluation", async (req, res) => {
  const {
    student_number,
    school_year_id,
    prof_id,
    course_id,
    question_id,
    answer,
  } = req.body;

  try {
    await db3.execute(
      `
      INSERT INTO student_evaluation_table
      (student_number, school_year_id, prof_id, course_id, question_id, question_answer)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [student_number, school_year_id, prof_id, course_id, question_id, answer],
    );

    await db3.execute(
      `
      UPDATE enrolled_subject
      SET fe_status = 1
      WHERE student_number = ? AND course_id = ? AND active_school_year_id = ?
      `,
      [student_number, course_id, school_year_id],
    );

    res.status(200).send({ message: "Evaluation successfully recorded!" });
  } catch (err) {
    console.error("Database / Server Error:", err);
    res
      .status(500)
      .send({ message: "Database / Server Error", error: err.message });
  }
});

router.get("/api/student-dashboard/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const query = `SELECT snt.student_number, pt.* FROM student_numbering_table as snt
      INNER JOIN person_table as pt ON snt.person_id = pt.person_id
      WHERE snt.person_id = ?
    `;
    const [result] = await db3.query(query, [id]);
    console.log(result);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("DB ERROR");
  }
});

router.get("/student-data/:studentNumber", async (req, res) => {
  const studentNumber = req.params.studentNumber;

  const query = `
  SELECT
      sn.student_number,
      p.person_id,
      p.profile_img,
      p.lrnNumber,
      p.cellphoneNumber,
      p.last_name,
      p.middle_name,
      p.campus,
      p.first_name,
      p.extension,
      p.gender,
      p.age,
      p.emailAddress AS email,
      ss.active_curriculum AS curriculum,
      ss.year_level_id AS yearlevel,
      prog.program_description AS program,
      prog.program_code,
      d.dprtmnt_name AS college,
      es.active_school_year_id
  FROM student_numbering_table sn
  INNER JOIN person_table p ON sn.person_id = p.person_id
  INNER JOIN student_status_table ss ON ss.student_number = sn.student_number
  INNER JOIN curriculum_table c ON ss.active_curriculum = c.curriculum_id
  INNER JOIN program_table prog ON c.program_id = prog.program_id
  INNER JOIN dprtmnt_curriculum_table dc ON c.curriculum_id = dc.curriculum_id
  INNER JOIN year_table yt ON c.year_id = yt.year_id
  INNER JOIN dprtmnt_table d ON dc.dprtmnt_id = d.dprtmnt_id
  LEFT JOIN enrolled_subject es ON sn.student_number = es.student_number
  WHERE sn.student_number = ?;
`;

  try {
    const [results] = await db3.query(query, [studentNumber]);
    res.json(results[0] || {});
  } catch (err) {
    console.error("Failed to fetch student data:", err);
    res.status(500).json({ message: "Database error" });
  }
});

router.put("/api/student/update_person/:person_id", async (req, res) => {
  const { person_id } = req.params;
  const updatedData = req.body;

  try {
    // â— OPTIONAL: Prevent updating fields students should NOT touch
    const allowed = [
      "profile_img",
      "campus",
      "academicProgram",
      "classifiedAs",
      "applyingAs",
      "program",
      "program2",
      "program3",
      "yearLevel",
      "last_name",
      "first_name",
      "middle_name",
      "extension",
      "nickname",
      "height",
      "weight",
      "lrnNumber",
      "nolrnNumber",
      "gender",
      "pwdMember",
      "pwdType",
      "pwdId",
      "birthOfDate",
      "age",
      "birthPlace",
      "languageDialectSpoken",
      "citizenship",
      "religion",
      "civilStatus",
      "tribeEthnicGroup",
      "cellphoneNumber",
      "emailAddress",
      "presentStreet",
      "presentBarangay",
      "presentZipCode",
      "presentRegion",
      "presentProvince",
      "presentMunicipality",
      "presentDswdHouseholdNumber",
      "sameAsPresentAddress",
      "permanentStreet",
      "permanentBarangay",
      "permanentZipCode",
      "permanentRegion",
      "permanentProvince",
      "permanentMunicipality",
      "permanentDswdHouseholdNumber",
      "solo_parent",
      "father_deceased",
      "father_family_name",
      "father_given_name",
      "father_middle_name",
      "father_ext",
      "father_nickname",
      "father_education",
      "father_education_level",
      "father_last_school",
      "father_course",
      "father_year_graduated",
      "father_school_address",
      "father_contact",
      "father_occupation",
      "father_employer",
      "father_income",
      "father_email",
      "mother_deceased",
      "mother_family_name",
      "mother_given_name",
      "mother_middle_name",
      "mother_ext",
      "mother_nickname",
      "mother_education",
      "mother_education_level",
      "mother_last_school",
      "mother_course",
      "mother_year_graduated",
      "mother_school_address",
      "mother_contact",
      "mother_occupation",
      "mother_employer",
      "mother_income",
      "mother_email",
      "guardian",
      "guardian_family_name",
      "guardian_given_name",
      "guardian_middle_name",
      "guardian_ext",
      "guardian_nickname",
      "guardian_address",
      "guardian_contact",
      "guardian_email",
      "annual_income",
      "schoolLevel",
      "schoolLastAttended",
      "schoolAddress",
      "courseProgram",
      "honor",
      "generalAverage",
      "yearGraduated",
      "schoolLevel1",
      "schoolLastAttended1",
      "schoolAddress1",
      "courseProgram1",
      "honor1",
      "generalAverage1",
      "yearGraduated1",
      "strand",
      "cough",
      "colds",
      "fever",
      "asthma",
      "faintingSpells",
      "heartDisease",
      "tuberculosis",
      "frequentHeadaches",
      "hernia",
      "chronicCough",
      "headNeckInjury",
      "hiv",
      "highBloodPressure",
      "diabetesMellitus",
      "allergies",
      "cancer",
      "smokingCigarette",
      "alcoholDrinking",
      "hospitalized",
      "hospitalizationDetails",
      "medications",
      "hadCovid",
      "covidDate",
      "vaccine1Brand",
      "vaccine1Date",
      "vaccine2Brand",
      "vaccine2Date",
      "booster1Brand",
      "booster1Date",
      "booster2Brand",
      "booster2Date",
      "chestXray",
      "cbc",
      "urinalysis",
      "otherworkups",
      "symptomsToday",
      "remarks",
      "termsOfAgreement",
      "created_at",
      "current_step",
    ];

    // Remove all fields NOT allowed
    const cleanPayload = {};
    for (const key of Object.keys(updatedData)) {
      if (allowed.includes(key)) {
        cleanPayload[key] = updatedData[key];
      }
    }

    const [result] = await db3.query(
      "UPDATE person_table SET ? WHERE person_id = ?",
      [cleanPayload, person_id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Person not found in ENROLLMENT DB" });
    }

    res.json({
      success: true,
      message: "Student information updated successfully (DB3)",
    });
  } catch (err) {
    console.error("âŒ Error updating student (DB3):", err);
    res.status(500).json({ error: "Failed to update student record" });
  }
});

router.get("/api/student/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db3.execute(
      `
      SELECT DISTINCT
        snt.person_id,
        pt.profile_img AS profile_image,
        ua.role,
        pt.extension,
        pt.last_name,
        pt.first_name,
        pt.middle_name,
        snt.student_number,
        sst.year_level_id,
        es.curriculum_id,
        sy.semester_id
      FROM student_numbering_table AS snt
      INNER JOIN person_table AS pt ON snt.person_id = pt.person_id
      INNER JOIN user_accounts AS ua ON pt.person_id = ua.person_id
      INNER JOIN enrolled_subject AS es ON snt.student_number = es.student_number
      INNER JOIN student_status_table AS sst ON snt.student_number = sst.student_number
      INNER JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
      WHERE pt.person_id = ?
    `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Person not found" });
    }

    const { student_number, year_level_id, curriculum_id, semester_id } =
      rows[0];

    const checkTotalRequiredUnits = `
      SELECT COALESCE(SUM(ct.course_unit) + SUM(ct.lab_unit), 0) AS required_total_units
      FROM program_tagging_table AS ptt
      INNER JOIN course_table AS ct ON ptt.course_id = ct.course_id
      WHERE ptt.year_level_id = ? AND ptt.semester_id = ? AND ptt.curriculum_id = ?
    `;
    const [requiredUnits] = await db3.query(checkTotalRequiredUnits, [
      year_level_id,
      semester_id,
      curriculum_id,
    ]);

    const checkTotalEnrolledUnits = `
      SELECT COALESCE(SUM(ct.course_unit) + SUM(ct.lab_unit), 0) AS enrolled_total_units
      FROM enrolled_subject AS es
      INNER JOIN course_table AS ct ON es.course_id = ct.course_id
      INNER JOIN student_status_table AS sst ON es.student_number = sst.student_number
      INNER JOIN active_school_year_table AS sy ON es.active_school_year_id = sy.id
      WHERE sy.astatus = 1 AND es.student_number = ? AND sst.year_level_id = ?;
    `;
    const [enrolledUnits] = await db3.query(checkTotalEnrolledUnits, [
      student_number,
      year_level_id,
    ]);

    const requiredTotal = requiredUnits[0]?.required_total_units || 0;
    const enrolledTotal = enrolledUnits[0]?.enrolled_total_units || 0;

    const student_status =
      enrolledTotal === requiredTotal ? "Regular" : "Irregular";

    return res.json({
      ...rows[0],
      student_status,
    });
  } catch (error) {
    console.error("Error fetching person:", error);
    return res.status(500).json({ error: "Database error" });
  }
});

router.put("/uploads/student/remarks/:upload_id", async (req, res) => {
  const { upload_id } = req.params;
  const { status, remarks, document_status, user_id } = req.body;

  try {
    await db3.query(
      `UPDATE requirement_uploads
       SET status = ?, remarks = ?, document_status = ?, last_updated_by = ?
       WHERE upload_id = ?`,
      [status, remarks || null, document_status || null, user_id, upload_id],
    );

    res.json({ message: "Document status updated successfully." });
  } catch (err) {
    console.error("Error updating document status:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/api/student/upload", upload.single("file"), async (req, res) => {
  const { requirements_id, person_id, remarks } = req.body;

  if (!requirements_id || !person_id || !req.file) {
    return res.status(400).json({ error: "Missing required fields or file" });
  }

  try {
    // ðŸ”¹ Applicant info
    const [[appInfo]] = await db3.query(
      `
      SELECT snt.student_number, pt.last_name, pt.first_name, pt.middle_name
      FROM student_numbering_table snt
      LEFT JOIN person_table pt ON snt.person_id = pt.person_id
      WHERE snt.person_id = ?
    `,
      [person_id],
    );

    const student_number = appInfo?.student_number || "Unknown";
    const fullName = `${appInfo?.last_name || ""}, ${appInfo?.first_name || ""} ${appInfo?.middle_name?.charAt(0) || ""}.`;

    // ðŸ”¹ Requirement description + short label
    const [descRows] = await db3.query(
      "SELECT description, short_label FROM requirements_table WHERE id = ?",
      [requirements_id],
    );

    if (!descRows.length)
      return res.status(404).json({ message: "Requirement not found" });

    const { description, short_label } = descRows[0];

    // âœ… Use the short_label directly from DB
    const shortLabel = short_label || "Unknown";

    const year = new Date().getFullYear();
    const ext = path.extname(req.file.originalname).toLowerCase();

    // âœ… Construct filename
    const filename = `${applicant_number}_${shortLabel}_${year}${ext}`;
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    const finalPath = path.join(uploadDir, filename);

    // ðŸ”¹ Delete any existing file for the same applicant + requirement
    const [existingFiles] = await db3.query(
      `SELECT upload_id, file_path FROM requirement_uploads
       WHERE person_id = ? AND requirements_id = ?`,
      [person_id, requirements_id],
    );

    for (const file of existingFiles) {
      const oldPath = path.join(__dirname, "uploads", file.file_path);

      try {
        await fs.promises.unlink(oldPath);
      } catch (err) {
        if (err.code !== "ENOENT")
          console.warn("File delete warning:", err.message);
      }

      await db3.query("DELETE FROM requirement_uploads WHERE upload_id = ?", [
        file.upload_id,
      ]);
    }

    // ðŸ”¹ Save new file
    await fs.promises.writeFile(finalPath, req.file.buffer);

    await db3.query(
      `INSERT INTO requirement_uploads
        (requirements_id, person_id, file_path, original_name, status, remarks)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [
        requirements_id,
        person_id,
        filename,
        req.file.originalname,
        remarks || null,
      ],
    );

    res.status(201).json({ message: "âœ… Upload successful" });
  } catch (err) {
    console.error("Upload error:", err);
    res
      .status(500)
      .json({ error: "Failed to save upload", details: err.message });
  }
});

router.get("/api/person/student/:storedID", async (req, res) => {
  const id = req.params.storedID;

  try {
    const [personRows] = await db3.query(
      `SELECT emailAddress FROM person_table WHERE person_id = ? `,
      [id],
    );

    const personEmail = personRows[0].emailAddress;

    const sql = `
      SELECT p.*, a.applicant_number
      FROM person_table p
      LEFT JOIN applicant_numbering_table a
      ON p.person_id = a.person_id
      WHERE p.emailAddress = ?
    `;

    const [rows] = await db.query(sql, [personEmail]);
    console.log("Person Data: ", rows);

    res.status(200).json({
      message: "Successfully  etch student record from admission",
      rows,
    });
  } catch (err) {
    console.error("Error fetching registrar count:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching registrar count" });
  }
});

router.get("/get_students_grouped", async (req, res) => {
  try {
    const [rows] = await db3.query(`
 SELECT DISTINCT
snt.student_number,
pt.first_name,
pt.middle_name,
pt.last_name,
dt.dprtmnt_code,
dt.dprtmnt_name,
pgt.program_code,
pgt.program_description,
pgt.major,
ylt.year_level_description
FROM enrolled_subject es
JOIN student_status_table sst ON es.student_number = sst.student_number
JOIN student_numbering_table snt ON sst.student_number = snt.student_number
JOIN person_table pt ON snt.person_id = pt.person_id
JOIN dprtmnt_curriculum_table dct ON es.curriculum_id = dct.curriculum_id
JOIN curriculum_table cct ON dct.curriculum_id = cct.curriculum_id
JOIN dprtmnt_table dt ON dct.dprtmnt_id = dt.dprtmnt_id
JOIN program_table pgt ON cct.program_id = pgt.program_id
JOIN year_level_table ylt ON sst.year_level_id = ylt.year_level_id
ORDER BY dt.dprtmnt_code, pgt.program_code, pt.last_name;

    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed fetching students" });
  }
});



router.get("/student_enrollment", async (req, res) => {
  try {
    const [rows] = await db3.query(
      `
        SELECT DISTINCT
          snt.student_number,
          pt.first_name,
          pt.middle_name,
          pt.last_name
        FROM student_numbering_table snt
        LEFT JOIN person_table pt ON snt.person_id = pt.person_id
        ORDER BY snt.student_number ASC
      `,
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed fetching students" });
  }
});

router.get("/student_enrollment/:student_number", async (req, res) => {
  const { student_number } = req.params;

  try {
    const [rows] = await db3.query(
      `
        SELECT DISTINCT
          snt.student_number,
          pt.first_name,
          pt.middle_name,
          pt.last_name,
          pt.presentStreet,
          pt.presentBarangay,
          pt.presentZipCode,
          pt.presentRegion,
          pt.presentProvince,
          pt.presentMunicipality,
          pt.presentDswdHouseholdNumber,
          pt.emailAddress,
          pt.cellphoneNumber,
          pt.campus,
          dt.dprtmnt_code,
          dt.dprtmnt_name,
          pgt.program_code,
          pgt.program_description,
          ylt.year_level_description,
          smt.semester_description,
          st.description AS section_description,
          CONCAT(yt.year_description, '-', yt.year_description + 1) AS current_academic_year
        FROM student_numbering_table snt  
        LEFT JOIN enrolled_subject es ON snt.student_number = es.student_number
        LEFT JOIN person_table pt ON snt.person_id = pt.person_id
        LEFT JOIN student_status_table sst ON snt.student_number = sst.student_number
        LEFT JOIN dprtmnt_curriculum_table dct ON pt.program = dct.curriculum_id
        LEFT JOIN curriculum_table cct ON dct.curriculum_id = cct.curriculum_id
        LEFT JOIN dprtmnt_table dt ON dct.dprtmnt_id = dt.dprtmnt_id
        LEFT JOIN program_table pgt ON cct.program_id = pgt.program_id
        LEFT JOIN dprtmnt_section_table dst ON es.department_section_id = dst.id
        LEFT JOIN section_table st ON dst.section_id = st.id
        LEFT JOIN year_level_table ylt ON sst.year_level_id = ylt.year_level_id
        LEFT JOIN active_school_year_table sy ON es.active_school_year_id = sy.id
        LEFT JOIN semester_table smt ON sy.semester_id = smt.semester_id
        LEFT JOIN year_table yt ON sy.year_id = yt.year_id
        WHERE snt.student_number = ? GROUP BY ylt.year_level_description, smt.semester_description, current_academic_year
      `,
      [student_number]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed fetching students" });
  }
});




module.exports = router;
