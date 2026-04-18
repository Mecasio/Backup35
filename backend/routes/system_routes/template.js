// Not done
app.get("/ecat_scores_template", (req, res) => {
  const filePath = path.join(
    __dirname,
    "excelfiles",
    "ECATScoresTemplate.xlsx",
  );
  res.download(filePath, "ECATScoresTemplate.xlsx", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});

app.get("/qualifying_interview_template", (req, res) => {
  const filePath = path.join(
    __dirname,
    "excelfiles",
    "QualifyingInterviewScore.xlsx",
  );
  res.download(filePath, "QualifyingInterviewScore.xlsx", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});

app.get("/grade_report_template", (req, res) => {
  const filePath = path.join(__dirname, "excelfiles", "GradeReport.xls");
  res.download(filePath, "GradeReport.xls", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});

app.get("/student_data", (req, res) => {
  const filePath = path.join(__dirname, "excelfiles", "StudentData.xlsx");
  res.download(filePath, "StudentData.xlsx", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});

app.get("/curriculum_panel_template", (req, res) => {
  const filePath = path.join(
    __dirname,
    "excelfiles",
    "CurriculumPanelTemplate.xlsx",
  );
  res.download(filePath, "CurriculumPanelTemplate.xlsx", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});

app.get("/course_panel_template", (req, res) => {
  const filePath = path.join(
    __dirname,
    "excelfiles",
    "CoursePanelTemplate.xlsx",
  );
  res.download(filePath, "CoursePanelTemplate.xlsx", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});

app.get("/program_tagging_template", (req, res) => {
  const filePath = path.join(
    __dirname,
    "excelfiles",
    "ProgramTaggingTemplate.xlsx",
  );
  res.download(filePath, "ProgramTaggingTemplate.xlsx", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});

app.get("/program_panel_template", (req, res) => {
  const filePath = path.join(
    __dirname,
    "excelfiles",
    "ProgramPanelTemplate.xlsx",
  );
  res.download(filePath, "ProgramPanelTemplate.xlsx", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});