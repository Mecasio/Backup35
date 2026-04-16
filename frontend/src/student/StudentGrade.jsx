import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  AlertTitle
} from "@mui/material";
import axios from "axios";
import API_BASE_URL from "../apiConfig"
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";


// ─── Remark Badge ─────────────────────────────────────────────────
const REMARK_MAP = {
  0: { label: "Ongoing", bg: "#E8F5E9", color: "#9e9c1e", border: "#807700" },
  1: { label: "Passed", bg: "#E8F5E9", color: "#2E7D32", border: "#A5D6A7" },
  2: { label: "Failed", bg: "#FFEBEE", color: "#C62828", border: "#EF9A9A" },
  3: { label: "Incomplete", bg: "#FFF8E1", color: "#E65100", border: "#FFE082" },
  4: { label: "Dropped", bg: "#F3F4F6", color: "#4B5563", border: "#D1D5DB" },
};

const RemarkBadge = ({ value }) => {
  const style = REMARK_MAP[value];
  if (!style) return <span style={{ color: "#9CA3AF", fontSize: 12 }}>—</span>;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      borderRadius: 6,
      padding: "2px 10px",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
    }}>
      {style.label}
    </span>


  );
};

// ─── Helpers ──────────────────────────────────────────────────────
const convertNumericToGrade = (numeric) => {
  const grade = parseFloat(numeric);
  if (Number.isNaN(grade)) return null;
  if (grade === 0) return "";
  if (grade >= 97) return "1.00";
  if (grade >= 94) return "1.25";
  if (grade >= 91) return "1.50";
  if (grade >= 88) return "1.75";
  if (grade >= 85) return "2.00";
  if (grade >= 82) return "2.25";
  if (grade >= 79) return "2.50";
  if (grade >= 76) return "2.75";
  if (grade >= 75) return "3.00";
  return "5.00";
};

const getUnitDisplay = (row) => {
  const course = parseInt(row.course_unit) || 0;
  const lab = parseInt(row.lab_unit) || 0;
  if (course === 0 && lab === 0) return "—";
  if (course === 0) return lab;
  if (lab === 0) return course;
  return course + lab;
};

const computeGWA = (subjects) => {
  const items = subjects
    .map((row) => {
      const grade = parseFloat(row.final_grade);
      if (isNaN(grade)) return null;

      const units =
        (parseFloat(row.lec_unit) || 0) +
        (parseFloat(row.lab_unit) || 0);

      return { CG: grade * units, units };
    })
    .filter((item) => item && item.units > 0);

  const totalUnits = items.reduce((s, i) => s + i.units, 0);
  const totalCG = items.reduce((s, i) => s + i.CG, 0);

  return totalUnits > 0
    ? parseFloat((totalCG / totalUnits).toFixed(2))
    : null;
};
// ─── Term Sorting ─────────────────────────────────────────────────
// Order within a year: First Semester → Second Semester → Summer / Midyear
const getSemesterOrder = (semDesc = "") => {
  const key = semDesc.toLowerCase().trim();
  if (key.includes("first") || key.includes("1st")) return 1;
  if (key.includes("second") || key.includes("2nd")) return 2;
  if (key.includes("summer") || key.includes("mid")) return 3;
  return 99;
};

const yearOrder = {
  "First Year": 1,
  "Second Year": 2,
  "Third Year": 3,
  "Fourth Year": 4,
  "Fifth Year": 5,
};

const semesterOrder = {
  "First Semester": 1,
  "Second Semester": 2,
  "Summer": 3,
};

const sortTerms = (terms) =>
  [...terms].sort((a, b) => {
    const [yearA, ...semA] = a.split(" ");
    const [yearB, ...semB] = b.split(" ");

    const yA = yearOrder[yearA + " " + semA[0]] || yearOrder[yearA] || 0;
    const yB = yearOrder[yearB + " " + semB[0]] || yearOrder[yearB] || 0;

    // ✅ DESCENDING YEAR (4th → 1st)
    if (yA !== yB) return yB - yA;

    // ✅ DESCENDING SEM (2nd → 1st → summer)
    return (
      semesterOrder[semB.join(" ")] -
      semesterOrder[semA.join(" ")]
    );
  });
// ─── Main Component ───────────────────────────────────────────────
const StudentGradingPage = () => {
  const settings = useContext(SettingsContext);

  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#e0e0e0");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");
  const [subButtonColor, setSubButtonColor] = useState("#ffffff");
  const [stepperColor, setStepperColor] = useState("#000000");

  const [fetchedLogo, setFetchedLogo] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [shortTerm, setShortTerm] = useState("");
  const [campusAddress, setCampusAddress] = useState("");

  useEffect(() => {
    if (!settings) return;
    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
    if (settings.border_color) setBorderColor(settings.border_color);
    if (settings.main_button_color) setMainButtonColor(settings.main_button_color);
    if (settings.sub_button_color) setSubButtonColor(settings.sub_button_color);
    if (settings.stepper_color) setStepperColor(settings.stepper_color);
    if (settings.logo_url) setFetchedLogo(`${API_BASE_URL}${settings.logo_url}`);
    else setFetchedLogo(EaristLogo);
    if (settings.company_name) setCompanyName(settings.company_name);
    if (settings.short_term) setShortTerm(settings.short_term);
    if (settings.campus_address) setCampusAddress(settings.campus_address);
  }, [settings]);

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [studentGrade, setStudentGrade] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [gradingActive, setGradingActive] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");

    if (storedUser && storedRole && storedID) {
      setUser(storedUser);
      setUserRole(storedRole);
      setUserID(storedID);
      if (storedRole !== "student") {
        window.location.href = "/faculty_dashboard";
      } else {
        fetchStudentGrade(storedID);
        console.log("you are an", storedRole);
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  const fetchStudentGrade = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/student_grade/${id}`);
      const data = res.data;

      const groupedByTerm = {};
      data.forEach((subj) => {
        const termKey = `${subj.year_level_description || "N/A"} ${subj.semester_description || "N/A"}`;
        if (!groupedByTerm[termKey]) groupedByTerm[termKey] = [];
        groupedByTerm[termKey].push(subj);
        console.log(data);
      });

      const processedGrades = Object.values(groupedByTerm).flatMap((termSubjects) => {
        const allReleased = termSubjects.every((s) => s.fe_status === 1 || s.is_migrated);
        if (!allReleased) {
          return termSubjects.map((s) => ({
            ...s,
            final_grade: s.fe_status === 1 || s.is_migrated ? s.final_grade : null,
            en_remarks: s.fe_status === 1 || s.is_migrated ? s.en_remarks : null,
          }));
        }
        return termSubjects;
      });

      setStudentGrade(processedGrades);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!gradingActive || studentGrade.length === 0) return;
    const pending = studentGrade.filter((subj) => subj.fe_status === 0 && !subj.is_migrated).length;
    if (pending > 0) {
      setMessage(`Grades are available. Please evaluate all your professors. Remaining: ${pending}`);
    } else {
      viewGrade();
    }
  }, [gradingActive, studentGrade]);

  const fetchGradingStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/grading_status`);
      if (res.data.status === 1) {
        setGradingActive(true);
        setMessage("");
      } else {
        setGradingActive(false);
        setMessage("Grades are not available yet.");
      }
    } catch (error) {
      console.error("Failed to fetch grading status:", error);
      setMessage("Error fetching grading status.");
    }
  };

  useEffect(() => { fetchGradingStatus(); }, []);

  const viewGrade = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/student/view_latest_grades/${userID}`);

      if (res.data.status === "ok") {
        setMessage("");

        setStudentGrade((prev) => {
          return prev.map((oldRow) => {
            // find matching subject
            const match = res.data.grades.find(
              (g) => g.course_code === oldRow.course_code
            );

            return match
              ? {
                ...oldRow,                 // ✅ KEEP student info
                final_grade: match.final_grade,
                en_remarks: match.en_remarks,
                fe_status: match.fe_status,
              }
              : oldRow;
          });
        });

      } else {
        setMessage(res.data.message || "No grades available");
      }
    } catch (err) {
      console.error("Failed to fetch grades:", err);
      setMessage("Error fetching grades.");
    }
  };



  const yearLabelMap = {
    "First Year": "1st Year",
    "Second Year": "2nd Year",
    "Third Year": "3rd Year",
    "Fourth Year": "4th Year",
    "Fifth Year": "5th Year",
  };

  const formatYearLabel = (year) => {
    return yearLabelMap[year] || year;
  };


  const rawTerms = [...new Set(studentGrade.map(
    (row) => `${row.year_level_description} ${row.semester_description}`
  ))];
  const sortedTerms = sortTerms(rawTerms);
  const headerBg = settings?.header_color || "#1976d2";
  const programInfo = studentGrade[0] || null;

  // ── Shared cell styles ─────────────────────────────────────────
  const headCell = {
    backgroundColor: headerBg,
    color: "#fff",
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    padding: "10px 14px",
    borderBottom: "none",
    whiteSpace: "nowrap",
  };

  const bodyCell = {
    fontSize: 13,
    padding: "10px 14px",
    color: "#1a1a1a",
    borderBottom: `1px solid ${borderColor}`,
    verticalAlign: "middle",
  };

  // ──────────────────────────────────────────────────────────────
  return (
    <Box sx={{
      height: "calc(100vh - 150px)",
      overflowY: "auto",
      paddingRight: 1,
      backgroundColor: "transparent",
      mt: 1,
      padding: 2,
    }}>

      {/* ── Snackbar ── */}
      <Snackbar
        open={!!message}
        autoHideDuration={4000}
        onClose={() => setMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setMessage("")} severity="warning" sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>

      {/* ── Page Header ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2.5 }}>


        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2.5 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold", color: titleColor, fontSize: "36px", lineHeight: 1.2 }}>
              STUDENT GRADES
            </Typography>
            {programInfo && (
              <Typography variant="body2" sx={{ color: subtitleColor, mt: "6px", fontSize: 18 }}>
                {programInfo.program_description} ({programInfo.program_code})
              </Typography>
            )}
          </Box>
        </Box>


        {/* Grading Status Pill */}
        <Box sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          px: "14px",
          py: "6px",
          borderRadius: "20px",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.03em",
          backgroundColor: gradingActive ? "#E8F5E9" : "#FFF3E0",
          color: gradingActive ? "#2E7D32" : "#E65100",
          border: `1px solid ${gradingActive ? "#A5D6A7" : "#FFCC80"}`,
        }}>
          <Box sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: gradingActive ? "#43A047" : "#FB8C00",
          }} />
          {gradingActive ? "Grades Available" : "Not Yet Available"}
        </Box>
      </Box>

      {/* ── Divider ── */}
      <Box sx={{ height: "1px", backgroundColor: borderColor, mb: 3 }} />

      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        sx={{
          borderRadius: "12px",
          mt: 2,

          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          "& .MuiAlert-message": {
            width: "100%",
            textAlign: "center",

          },
          "& .MuiAlert-icon": {
            alignItems: "center",
          }
        }}
      >
        <AlertTitle
          sx={{
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Attention to All Students
        </AlertTitle>

        Viewing grades online through the <b>Student Information System</b> is
        strictly for personal use only. Students who need an official copy from
        the Registrar for interoffice transactions must submit a request for the
        official document at the Registrar’s Office.
        <br />
        <br />
        Please note that the grades posted in the
        <b> Student Information System</b> from previous school years were
        migrated from the old enrollment system and are still subject to checking
        and validation by the Registrar.
      </Alert>

      <br />


      {/* ── Grade Tables per Term ── */}
      {studentGrade.length > 0 ? (
        sortedTerms.map((term, idx) => {
          const [schoolYear, ...semParts] = term.split(" ");
          const semester = semParts.join(" ");

          const termSubjects = studentGrade
            .filter((row) =>
              `${row.year_level_description} ${row.semester_description}` === term
            )
            .sort((a, b) => (a.course_code || "").localeCompare(b.course_code || ""));

          const yearLevel = termSubjects[0]?.year_level_description;
          const semesterLabel = termSubjects[0]?.semester_description;

          const gwa = computeGWA(termSubjects);

          return (
            <Box key={idx} sx={{ mb: 5 }}>


              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                  p: 2,
                  borderRadius: "10px",
                  backgroundColor: "#fff",
                  border: `1px solid ${borderColor}`,
                  boxShadow: 2,
                }}
              >
                {/* LEFT SECTION */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>

                  {/* PERSON ICON */}
                  <Box
                    sx={{
                      width: 45,
                      height: 45,
                      borderRadius: "50%",
                      backgroundColor: headerBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                    }}
                  >
                    <PersonIcon />
                  </Box>

                  {/* ACCENT BAR */}
                  <Box
                    sx={{
                      width: 4,
                      height: 50,
                      borderRadius: 2,
                      backgroundColor: headerBg,
                      flexShrink: 0,
                    }}
                  />

                  {/* CONTENT */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    {/* LEFT SIDE */}
                    <Box>
                      {programInfo && (
                        <Box>
                          {/* STUDENT NUMBER */}
                          <Typography
                            sx={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: titleColor,
                            }}
                          >
                            STUDENT NUMBER:{" "}
                            <Box component="span" style={{ fontWeight: "normal", marginLeft: "15px" }}>
                              {programInfo.student_number}
                            </Box>
                          </Typography>


                          {/* NAME */}
                          <Typography
                            sx={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: titleColor,
                            }}
                          >
                            NAME:
                            <Box component="span" style={{ fontWeight: "normal", marginLeft: "15px" }}>
                              {programInfo.last_name}, {programInfo.first_name} {programInfo.middle_name}
                            </Box>
                          </Typography>
                          {/* GWA BELOW NAME */}
                          {gwa && (
                            <Typography
                              sx={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: titleColor,
                              
                              }}
                            >
                              GWA:
                              <Box
                                component="span"
                                sx={{
                                  fontWeight: "normal",
                                  marginLeft: "15px",
                                  color: headerBg,
                                }}
                              >
                                {convertNumericToGrade(gwa)}
                              </Box>
                            </Typography>
                          )}


                        </Box>
                      )}
                    </Box>

                    {/* RIGHT SIDE */}
                    {programInfo && (
                      <Box sx={{ textAlign: "right" }}>
                        {/* PROGRAM */}
                        <Typography
                          sx={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: titleColor,
                          }}
                        >
                          PROGRAM:
                          <Box component="span" style={{ fontWeight: "normal", marginLeft: "15px" }}>
                            ({programInfo.program_code}) {programInfo.program_description} {programInfo.major}</Box>
                        </Typography>




                        {/* YEAR / SEM */}
                        <Typography
                          sx={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: titleColor,
                          }}
                        >
                          YEAR / SEMESTER:
                          <Box component="span" style={{ fontWeight: "normal", marginLeft: "15px" }}>
                            {formatYearLabel(yearLevel)} - {semesterLabel}</Box>
                        </Typography>


                      </Box>
                    )}
                  </Box>
                </Box>

                {/* GWA BADGE */}

              </Box>

              {/* ── Table ── */}
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  border: `1px solid ${borderColor}`,
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <Table size="small" sx={{ tableLayout: "fixed" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ ...headCell, width: "48px", textAlign: "center", border: `1px solid ${borderColor}` }}>#</TableCell>
                      <TableCell sx={{ ...headCell, width: "120px", border: `1px solid ${borderColor}` }}>Code</TableCell>
                      <TableCell sx={{ ...headCell, border: `1px solid ${borderColor}` }}>Subject</TableCell>
                      <TableCell sx={{ ...headCell, width: "200px", border: `1px solid ${borderColor}` }}>Faculty</TableCell>
                      <TableCell sx={{ ...headCell, width: "70px", textAlign: "center", border: `1px solid ${borderColor}` }}>Units</TableCell>
                      <TableCell sx={{ ...headCell, width: "120px", textAlign: "center", border: `1px solid ${borderColor}` }}>Section</TableCell>
                      <TableCell sx={{ ...headCell, width: "110px", textAlign: "center", border: `1px solid ${borderColor}` }}>Final Grade</TableCell>
                      <TableCell sx={{ ...headCell, width: "120px", textAlign: "center", border: `1px solid ${borderColor}` }}>Status</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {termSubjects.map((row, i) => {
                      const convertedGrade = convertNumericToGrade(row.final_grade ?? "");
                      return (
                        <TableRow
                          key={i}
                          sx={{
                            "&:hover": { backgroundColor: "#f9f9f9" },
                            "&:last-child td": { borderBottom: "none" },
                          }}
                        >
                          <TableCell sx={{ ...bodyCell, border: `1px solid ${borderColor}`, width: "48px", textAlign: "center", color: subtitleColor, fontSize: 12 }}>
                            {i + 1}
                          </TableCell>
                          <TableCell sx={{ ...bodyCell, border: `1px solid ${borderColor}`, fontWeight: 600, fontSize: 12, color: subtitleColor }}>
                            {row.course_code}
                          </TableCell>
                          <TableCell sx={{ ...bodyCell, border: `1px solid ${borderColor}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.course_description}
                          </TableCell>
                          <TableCell sx={{ ...bodyCell, border: `1px solid ${borderColor}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.fname === "TBA" && row.lname === "TBA"
                              ? <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>TBA</span>
                              : `Prof. ${row.fname} ${row.lname}`}
                          </TableCell>
                          <TableCell sx={{ ...bodyCell, border: `1px solid ${borderColor}`, textAlign: "center", fontWeight: 500 }}>
                            {getUnitDisplay(row)}
                          </TableCell>
                          <TableCell sx={{ ...bodyCell, textAlign: "center", border: `1px solid ${borderColor}`, }}>
                            {row.program_code}-{row.section_description}
                          </TableCell>
                          <TableCell sx={{ ...bodyCell, textAlign: "center", border: `1px solid ${borderColor}`, }}>
                            {convertedGrade
                              ? <span style={{ fontWeight: 700, fontSize: 14, color: titleColor }}>{convertedGrade}</span>
                              : <span style={{ color: "#9CA3AF" }}>—</span>
                            }
                          </TableCell>
                          <TableCell sx={{ ...bodyCell, textAlign: "center", border: `1px solid ${borderColor}` }}>
                            <RemarkBadge value={row.en_remarks} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        })
      ) : (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography sx={{ color: subtitleColor, fontSize: 14 }}>No grades available.</Typography>
        </Box>
      )}
    </Box>
  );
};

export default StudentGradingPage;