import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  Button,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useMediaQuery,
  useTheme,
  Stack,
} from "@mui/material";
import LinearWithValueLabel from "../components/LinearWithValueLabel";
import { Snackbar, Alert } from "@mui/material";
import { FaFileExcel } from "react-icons/fa";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";

const CourseTagging = () => {
  const settings = useContext(SettingsContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");
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
    if (settings.company_name) setCompanyName(settings.company_name);
    if (settings.short_term) setShortTerm(settings.short_term);
    if (settings.campus_address) setCampusAddress(settings.campus_address);
  }, [settings]);

  const [data, setdata] = useState([]);
  const [currentDate, setCurrentDate] = useState("");
  const [personID, setPersonID] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });
  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const pageId = 17;
  const [employeeID, setEmployeeID] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");
    const storedEmployeeID = localStorage.getItem("employee_id");
    if (storedUser && storedRole && storedID) {
      setUser(storedUser);
      setUserRole(storedRole);
      setUserID(storedID);
      setEmployeeID(storedEmployeeID);
      if (storedRole === "registrar") {
        checkAccess(storedEmployeeID);
      } else {
        window.location.href = "/login";
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  const checkAccess = async (employeeID) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`);
      if (response.data && response.data.page_privilege === 1) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error("Error checking access:", error);
      setHasAccess(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const hours = String(now.getHours() % 12 || 12).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const ampm = now.getHours() >= 12 ? "PM" : "AM";
      setCurrentDate(`${month} ${day}, ${year} ${hours}:${minutes}:${seconds} ${ampm}`);
    };
    updateDate();
    const interval = setInterval(updateDate, 1000);
    return () => clearInterval(interval);
  }, []);

  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [studentNumber, setStudentNumber] = useState("");
  const [userId, setUserId] = useState(null);
  const [first_name, setUserFirstName] = useState(null);
  const [middle_name, setUserMiddleName] = useState(null);
  const [last_name, setUserLastName] = useState(null);
  const [applyingAs, setApplyingAs] = useState("");
  const [currId, setCurr] = useState(null);
  const [courseCode, setCourseCode] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [yearLevel, setYearLevel] = useState([]);
  const [subjectCounts, setSubjectCounts] = useState({});
  const [isenrolled, setIsEnrolled] = useState(null);
  const [disableYearButtons, setDisableYearButtons] = useState(false);
  const [activeSemester, setActiveSemester] = useState("");
  const [activeSemesterId, setActiveSemesterId] = useState(null);
  const isBulkEnrollDisabled = String(applyingAs) === "7" || String(applyingAs) === "8";
  const [prereqMap, setPrereqMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [confirmDialogMessage, setConfirmDialogMessage] = useState("");

  const fetchSubjectCounts = async (sectionId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subject-enrollment-count`, { params: { sectionId } });
      const counts = {};
      response.data.forEach((item) => { counts[item.course_id] = item.enrolled_count; });
      setSubjectCounts(counts);
    } catch (err) { console.error("Failed to fetch subject counts", err); }
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/get_year_level`).then((res) => setYearLevel(res.data)).catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/get_active_semester`).then((res) => {
      if (res.data && res.data.length > 0) {
        setActiveSemester(res.data[0].semester_description);
        setActiveSemesterId(res.data[0].semester_id);
      } else {
        setActiveSemester("No Active Semester");
        setActiveSemesterId(null);
      }
    }).catch((err) => console.error(err));
  }, []);

  useEffect(() => { if (selectedSection) fetchSubjectCounts(selectedSection); }, [selectedSection]);

  useEffect(() => {
    if (currId) axios.get(`${API_BASE_URL}/courses/${currId}`).then((res) => setCourses(res.data)).catch((err) => console.error(err));
  }, [currId]);

  useEffect(() => {
    if (userId && currId) axios.get(`${API_BASE_URL}/enrolled_courses/${userId}/${currId}`).then((res) => setEnrolled(res.data)).catch((err) => console.error(err));
  }, [userId, currId]);

  useEffect(() => { fetchDepartmentSections(); }, []);
  useEffect(() => { if (selectedDepartment) fetchDepartmentSections(); }, [selectedDepartment]);

  const fetchDepartmentSections = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/department-sections`, { params: { departmentId: selectedDepartment } });
      setTimeout(() => { setSections(response.data); setLoading(false); }, 700);
    } catch (err) {
      console.error("Error fetching department sections:", err);
      setError("Failed to load department sections");
      setLoading(false);
    }
  };

  const handleSectionChange = async (e) => {
    const sectionId = e.target.value;
    setSelectedSection(sectionId);
    try {
      await axios.put(`${API_BASE_URL}/api/update-active-curriculum`, { studentId: studentNumber, departmentSectionId: sectionId });
      const courseRes = await axios.get(`${API_BASE_URL}/api/search-student/${sectionId}`);
      if (courseRes.data.length > 0) {
        setCurr(courseRes.data[0].curriculum_id);
        setCourseCode(courseRes.data[0].program_code);
        setCourseDescription(courseRes.data[0].program_description);
      }
    } catch (error) { console.error("Error updating curriculum:", error); }
  };

  const isEnrolledCourse = (course_id) => enrolled.some((item) => item.course_id === course_id);
  const hasCoursePrereq = (course) => { const status = prereqMap[course.course_id]; return status ? status.hasPrereq === true : false; };

  const checkPrerequisite = async (student_number, course) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/check-prerequisite`, { student_number, course_id: course.course_id, semester_id: course.semester_id, curriculum_id: currId });
      if (typeof data.allowed !== "boolean") return { allowed: false, reason: "ERROR", status: data.status, message: data.message || "Invalid response from prerequisite API." };
      if (data.allowed) return { allowed: true, reason: "OK", status: data.status, message: data.message };
      let reason = "ERROR";
      if (data.status === "FAILED_PREREQ") reason = "FAILED_PREREQUISITE";
      else if (data.status === "MISSING_PREREQ") reason = "MISSING_OR_NOT_PASSED_PREREQUISITE";
      return { allowed: false, reason, status: data.status, message: data.message, failedPrereq: data.failedPrereq || [], missingPrereq: data.missingPrereq || [] };
    } catch (err) { return { allowed: false, reason: "ERROR", status: "REQUEST_ERROR", message: "Error calling prerequisite API." }; }
  };

  useEffect(() => {
    const computePrereqStatus = async () => {
      if (!userId || courses.length === 0) { setPrereqMap({}); return; }
      const map = {};
      for (const course of courses) {
        const res = await checkPrerequisite(userId, course);
        let hasPrereq = true;
        if (res.status === "NO_PREREQ" || res.status === "PREREQ_NOT_FOUND") hasPrereq = false;
        map[course.course_id] = { allowed: !!res.allowed, hasPrereq };
      }
      setPrereqMap(map);
    };
    computePrereqStatus();
  }, [userId, courses]);

  const addToCart = async (course) => {
    if (!selectedSection) { setSnack({ open: true, message: "Please select a department section before enrolling.", severity: "warning" }); return; }
    if (!userId) { setSnack({ open: true, message: "Please search and select a student first.", severity: "warning" }); return; }
    if (isEnrolledCourse(course.course_id)) return;
    const payload = { subject_id: course.course_id, department_section_id: selectedSection };
    try {
      await axios.post(`${API_BASE_URL}/add-to-enrolled-courses/${userId}/${currId}/`, payload);
      const { data } = await axios.get(`${API_BASE_URL}/enrolled_courses/${userId}/${currId}`);
      setEnrolled(data);
      setSnack({ open: true, message: `Enrolled ${course.course_code} successfully.`, severity: "success" });
    } catch (err) { setSnack({ open: true, message: "Error enrolling in this course. Please try again.", severity: "error" }); }
  };

  const deleteFromCart = async (id) => {
    if (!id) return;
    try {
      await axios.delete(`${API_BASE_URL}/courses/delete/${id}`);
      const { data } = await axios.get(`${API_BASE_URL}/enrolled_courses/${userId}/${currId}`);
      setEnrolled(data);
      setSnack({ open: true, message: "Subject unenrolled successfully.", severity: "success" });
    } catch (err) { setSnack({ open: true, message: "Error unenrolling subject.", severity: "error" }); }
  };

  const addAllToCart = async (yearLevelId) => {
    const newCourses = courses.filter((c) => !isEnrolledCourse(c.course_id) && c.year_level_id === yearLevelId && (activeSemesterId ? c.semester_id === activeSemesterId : true));
    if (!selectedSection) { setSnack({ open: true, message: "Please select a department section before adding all the courses.", severity: "warning" }); return; }
    if (!userId) { setSnack({ open: true, message: "Please search and select a student first.", severity: "warning" }); return; }
    if (newCourses.length === 0) return;
    let enrolledCount = 0;
    try {
      await Promise.all(newCourses.map(async (course) => {
        try {
          await axios.post(`${API_BASE_URL}/add-all-to-enrolled-courses`, { subject_id: course.course_id, user_id: userId, curriculumID: currId, departmentSectionID: selectedSection, year_level: yearLevelId });
          enrolledCount++;
          setDisableYearButtons(true);
        } catch (err) { console.error("Error enrolling course in bulk:", err); }
      }));
      const { data } = await axios.get(`${API_BASE_URL}/enrolled_courses/${userId}/${currId}`);
      setEnrolled(data);
      if (data.length > 0) { setCourseCode(data[0].program_code); setCourseDescription(data[0].program_description); setSectionDescription(data[0].section); }
      setSnack({ open: true, message: enrolledCount > 0 ? "Bulk enroll finished. All available subjects were enrolled." : "No new subjects were enrolled.", severity: enrolledCount > 0 ? "success" : "info" });
    } catch (err) { setSnack({ open: true, message: "Unexpected error during bulk enrollment.", severity: "error" }); }
  };

  const deleteAllCart = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/courses/user/${userId}`);
      const { data } = await axios.get(`${API_BASE_URL}/enrolled_courses/${userId}/${currId}`);
      setEnrolled(data);
      setDisableYearButtons(false);
    } catch (err) { console.error("Error deleting cart:", err); }
  };

  const handleSearchStudent = async () => {
    if (!studentNumber.trim()) { setSnack({ open: true, message: "Please fill in the student number", severity: "warning" }); return; }
    try {
      const response = await axios.post(`${API_BASE_URL}/student-tagging`, { studentNumber }, { headers: { "Content-Type": "application/json" } });
      const { token2, isEnrolled, person_id2, studentNumber: studentNum, section, activeCurriculum: effectiveProgram, yearLevel, courseCode: courseCode, courseDescription: courseDescription, firstName: first_name, middleName: middle_name, lastName: last_name, applyingAs: applyingAsValue } = response.data;
      localStorage.setItem("token2", token2); localStorage.setItem("person_id2", person_id2); localStorage.setItem("studentNumber", studentNum); localStorage.setItem("activeCurriculum", effectiveProgram); localStorage.setItem("yearLevel", yearLevel); localStorage.setItem("courseCode", courseCode); localStorage.setItem("courseDescription", courseDescription); localStorage.setItem("firstName", first_name); localStorage.setItem("middleName", middle_name); localStorage.setItem("lastName", last_name); localStorage.setItem("section", section); localStorage.setItem("isEnrolled", isEnrolled);
      setUserId(studentNum); setUserFirstName(first_name); setUserMiddleName(middle_name); setUserLastName(last_name); setApplyingAs(applyingAsValue ?? ""); setCurr(effectiveProgram); setCourseCode(courseCode); setCourseDescription(courseDescription); setPersonID(person_id2); setSectionDescription(section); setIsEnrolled(isEnrolled);
      setSnack({ open: true, message: "Student found and authenticated!", severity: "success" });
    } catch (error) { setApplyingAs(""); setSnack({ open: true, message: "Student not found or error processing request.", severity: "error" }); }
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try { const res = await axios.get(`${API_BASE_URL}/departments`); setDepartments(res.data); }
      catch (err) { console.error("Error fetching departments:", err); }
    };
    fetchDepartments();
  }, []);

  const [selectedFile, setSelectedFile] = useState(null);
  const handleSelect = (departmentId) => setSelectedDepartment(departmentId);

  const handleImport = async () => {
    try {
      if (!selectedFile) { setSnack({ open: true, message: "Please choose a file first!", severity: "warning" }); return; }
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await axios.post(`${API_BASE_URL}/api/import-xlsx`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      if (res.data.success) { setSnack({ open: true, message: res.data.message || "Excel imported successfully!", severity: "success" }); setSelectedFile(null); }
      else { setSnack({ open: true, message: res.data.error || "Failed to import", severity: "error" }); }
    } catch (err) { setSnack({ open: true, message: "Import failed: " + (err.response?.data?.error || err.message), severity: "error" }); }
  };

  const handleFileChange = (e) => { if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]); };

  const getCourseRowSx = (course) => {
    const status = prereqMap[course.course_id];
    if (!status) return {};
    if (!status.hasPrereq || status.allowed) return { backgroundColor: "#e6ffe6" };
    return { backgroundColor: "#ffeacc" };
  };

  const handleEnrollClick = async (course) => {
    if (!selectedSection) { setSnack({ open: true, message: "Please select a department section before enrolling.", severity: "warning" }); return; }
    if (!userId) { setSnack({ open: true, message: "Please search and select a student first.", severity: "warning" }); return; }
    if (isEnrolledCourse(course.course_id)) return;
    const status = prereqMap[course.course_id];
    if (status && status.hasPrereq) {
      let msg = `The subject ${course.course_code} has prerequisite subject(s).\n\n`;
      msg += status.allowed ? "The student meets the prerequisite qualification.\n\nDo you want to continue enrolling this subject?" : "The student does NOT meet the prerequisite qualification (failed or not yet passed).\n\nDo you still want to attempt to enroll this subject?";
      setPendingAction({ type: "single", course }); setConfirmDialogMessage(msg); setConfirmDialogOpen(true);
    } else { await addToCart(course); }
  };

  const handleBulkEnrollClick = async (yearLevelId, semesterLabel) => {
    if (isBulkEnrollDisabled) return;
    if (!selectedSection) { setSnack({ open: true, message: "Please select a department section before adding all the courses.", severity: "warning" }); return; }
    if (!userId) { setSnack({ open: true, message: "Please search and select a student first.", severity: "warning" }); return; }
    const newCourses = courses.filter((c) => !isEnrolledCourse(c.course_id) && c.year_level_id === yearLevelId && (activeSemesterId ? c.semester_id === activeSemesterId : true));
    if (newCourses.length === 0) return;
    const coursesWithPrereq = newCourses.filter((c) => hasCoursePrereq(c));
    if (coursesWithPrereq.length === 0) { await addAllToCart(yearLevelId); return; }
    const listText = coursesWithPrereq.map((c) => { const status = prereqMap[c.course_id]; let tag = status ? (status.allowed ? " (qualified)" : " (NOT qualified)") : ""; return `• ${c.course_code}${tag}`; }).join("\n");
    const msg = `${yearLevelId} - ${semesterLabel || "Semester"}, You are trying to enroll multiple subjects that have prerequisites:\n\n${listText}\n\nGreen-highlighted rows mean the student meets the prerequisite qualification.\nOrange-highlighted rows mean the student does NOT meet the prerequisite qualification.\n\nDo you want to continue with bulk enrollment?`;
    setPendingAction({ type: "bulk", yearLevelId }); setConfirmDialogMessage(msg); setConfirmDialogOpen(true);
  };

  const handleConfirmDialogClose = () => { setConfirmDialogOpen(false); setPendingAction(null); setConfirmDialogMessage(""); };

  const handleConfirmDialogProceed = async () => {
    if (!pendingAction) { handleConfirmDialogClose(); return; }
    try {
      if (pendingAction.type === "single" && pendingAction.course) await addToCart(pendingAction.course);
      else if (pendingAction.type === "bulk" && pendingAction.yearLevelId) await addAllToCart(pendingAction.yearLevelId);
    } finally { handleConfirmDialogClose(); }
  };

  const formatYear = (year) => {
    const map = { "First Year": "1st Year", "Second Year": "2nd Year", "Third Year": "3rd Year", "Fourth Year": "4th Year", "Fifth Year": "5th Year" };
    return map[year] || year;
  };

  const formatSemester = (semester) => {
    const map = { "First Semester": "1st Sem", "Second Semester": "2nd Sem", "Summer": "Summer" };
    return map[semester] || semester;
  };

  useEffect(() => {
    if (!studentNumber) return;
    const delayDebounce = setTimeout(() => { handleSearchStudent(); }, 500);
    return () => clearTimeout(delayDebounce);
  }, [studentNumber]);

  if (loading || hasAccess === null) return <LoadingOverlay open={loading} message="Loading..." />;
  if (!hasAccess) return <Unauthorized />;

  return (
    <Box sx={{ overflowY: "auto", backgroundColor: "transparent", mt: 1, p: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", mb: 2, px: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: titleColor, fontSize: { xs: "22px", sm: "28px", md: "36px" } }}>
          COURSE TAGGING PANEL
        </Typography>
      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />

      {/* Top Action Bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 2, px: 1 }}>
        {/* Download Template */}
        <button
          onClick={() => { window.location.href = `${API_BASE_URL}/grade_report_template`; }}
          style={{ padding: "5px 16px", border: "2px solid black", backgroundColor: "#f0f0f0", color: "black", borderRadius: "5px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", height: "40px", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}
        >
          📥 Download Template
        </button>

        {/* Excel Upload Controls */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
          <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: "none" }} id="excel-upload" />
          <button
            onClick={() => document.getElementById("excel-upload").click()}
            style={{ border: "2px solid green", backgroundColor: "#f0fdf4", color: "green", borderRadius: "5px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", height: "44px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", userSelect: "none", padding: "0 16px", whiteSpace: "nowrap" }}
            type="button"
          >
            <FaFileExcel size={18} />
            {selectedFile ? selectedFile.name.substring(0, 20) + "..." : "Choose Excel"}
          </button>
          <Button variant="contained" sx={{ background: mainButtonColor, color: "white", height: "44px", fontWeight: "bold", border: "2px solid black", whiteSpace: "nowrap" }} onClick={handleImport}>
            Upload
          </Button>
        </Stack>
      </Box>

      {/* Select Department */}
      <Typography variant="h5" fontWeight="bold" sx={{ color: subtitleColor, fontSize: { xs: "24px", sm: "32px", md: "42px" } }} textAlign="center" gutterBottom>
        Select Department
      </Typography>
      <Box sx={{ backgroundColor: "white", p: 2, mb: 1 }}>
        <Grid container spacing={1} gap={1} justifyContent="center" textAlign="center">
          {departments.map((dept, index) => (
            <Grid key={dept.dprtmnt_id}>
              <Button
                variant="contained"
                value={dept.dprtmnt_id}
                onClick={() => handleSelect(dept.dprtmnt_id)}
                sx={{
                  mt: 1, width: "auto", height: 50, fontWeight: "bold",
                  backgroundColor: selectedDepartment === dept.dprtmnt_id ? mainButtonColor : "white",
                  color: selectedDepartment === dept.dprtmnt_id ? "white" : mainButtonColor,
                  border: `1px solid ${borderColor}`,
                  "&:hover": { backgroundColor: mainButtonColor, color: "white" },
                  fontSize: { xs: "11px", sm: "13px" },
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  lineHeight: 1.3,
                  py: 0.75,
                }}
              >
                {dept.dprtmnt_code}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Main Two-Panel Layout */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 3,
          width: "100%",
        }}
      >
        {/* LEFT PANEL — Available Courses */}
        <Box component={Paper} sx={{ backgroundColor: "#f1f1f1", p: { xs: 1.5, sm: 2 }, border: `1px solid ${borderColor}`, overflowX: "auto", width: "100%" }}>
          {/* Student Info */}
          <Box mb={2}>
            <Typography variant="h6" sx={{ fontSize: { xs: "13px", sm: "20px" }, mb: 1 }}>
              Name: {first_name} {middle_name} {last_name}
            </Typography>
            <Typography variant="h6" sx={{ fontSize: { xs: "12px", sm: "20px" }, color: "text.secondary", mb: 1 }}>
              Dept/Course/Section: {" "}
              {courseCode || courseDescription || sectionDescription ? (
                isenrolled ? `(${courseCode}) - ${courseDescription} - ${sectionDescription}` : "Not currently enrolled"
              ) : "—"}
            </Typography>
            <TextField label="Student Number" fullWidth margin="dense" size="small" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSearchStudent(); }} />
            <TextField label="Search Course (Code or Description)" variant="outlined" fullWidth margin="dense" size="small" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value.toLowerCase())} />
            <Button variant="contained" color="primary" fullWidth size="small" sx={{ mt: 1 }} onClick={handleSearchStudent}>
              Search
            </Button>
          </Box>

          <Typography variant="h6" sx={{ fontSize: { xs: "14px", sm: "16px" } }} mt={1} gutterBottom>Available Courses</Typography>

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 500 }}>
              <TableHead>
                <TableRow>
                  {["Course Code", "Description", "Credit Unit", "Prerequisites", "Enrolled Students", "Action"].map((h) => (
                    <TableCell key={h} style={{ border: `1px solid ${borderColor}`, textAlign: "center", fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.filter((c) => {
                  const text = searchQuery.toLowerCase();
                  return c.course_code.toLowerCase().includes(text) || c.course_description.toLowerCase().includes(text);
                }).map((c) => (
                  <TableRow key={c.course_id} sx={getCourseRowSx(c)}>
                    <TableCell style={{ border: `1px solid ${borderColor}`, textAlign: "center", fontSize: "12px" }}>{c.course_code}</TableCell>
                    <TableCell style={{ border: `1px solid ${borderColor}`, textAlign: "center", fontSize: "12px" }}>{c.course_description}</TableCell>
                    <TableCell style={{ border: `1px solid ${borderColor}`, textAlign: "center", fontSize: "12px" }}>{c.course_unit}</TableCell>
                    <TableCell style={{ border: `1px solid ${borderColor}`, textAlign: "center", fontSize: "12px" }}>{c.prereq ? c.prereq.split(",").map(p => p.trim()).join(", ") : "None"}</TableCell>
                    <TableCell style={{ border: `1px solid ${borderColor}`, textAlign: "center", fontSize: "12px" }}>{subjectCounts[c.course_id] || 0}</TableCell>
                    <TableCell style={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                      {!isEnrolledCourse(c.course_id) ? (
                        <Button variant="contained" size="small" sx={{ fontSize: "11px", py: 0.3 }} onClick={() => handleEnrollClick(c)} disabled={!userId}>Enroll</Button>
                      ) : (
                        <Typography color="textSecondary" sx={{ fontSize: "12px" }}>Enrolled</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>

        {/* RIGHT PANEL — Enrolled Courses */}
        <Box component={Paper} sx={{ backgroundColor: "#f1f1f1", p: { xs: 1.5, sm: 2 }, border: `1px solid ${borderColor}`, overflowX: "auto", width: "100%" }}>
          {/* Header row */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: "14px", sm: "16px" } }}>Department Section:</Typography>
            <Button
              style={{ background: mainButtonColor, color: "white", fontWeight: "bold", fontSize: "13px" }}
              size="small"
              onClick={() => {
                if (studentNumber) { localStorage.setItem("studentNumberForCOR", studentNumber); window.open("/search_cor", "_blank"); }
                else { setSnack({ open: true, message: "Please select or provide a student number first", severity: "warning" }); }
              }}
            >
              COR
            </Button>
          </Box>

          {/* Section Dropdown */}
          {loading ? (
            <Box sx={{ width: "100%", mt: 2 }}><LinearWithValueLabel /></Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <TextField
              select fullWidth value={selectedSection} onChange={handleSectionChange}
              variant="outlined" margin="dense" size="small" label="Select a Department Section"
            >
              <MenuItem value=""><em>Select a department section</em></MenuItem>
              {sections.map((section) => (
                <MenuItem key={section.department_and_program_section_id} value={section.department_and_program_section_id}>
                  (<strong>{section.program_code}</strong>) - {section.program_description} {section.major || ""} - {section.description}
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* Year Level Buttons */}
          <Typography variant="body1" sx={{ fontWeight: "bold", mt: 1, mb: 0.5, fontSize: { xs: "13px", sm: "15px" } }}>Year Level</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            {yearLevel.map((year_level, index) => (
              <Button
                key={index} variant="contained" color="success"
                disabled={disableYearButtons || isBulkEnrollDisabled}
                onClick={() => handleBulkEnrollClick(year_level.year_level_id, formatSemester(activeSemester))}
                sx={{ minWidth: { xs: 90, sm: 115 }, fontWeight: "bold", fontSize: { xs: "10px", sm: "12px" }, lineHeight: 1.3 }}
              >
                {formatYear(year_level.year_level_description)}<br />{formatSemester(activeSemester)}
              </Button>
            ))}
            <Button variant="contained" color="warning" sx={{ minWidth: { xs: 90, sm: 115 }, fontSize: { xs: "10px", sm: "12px" } }} onClick={deleteAllCart}>
              Unenroll All
            </Button>
          </Box>

          <Typography variant="h6" sx={{ fontSize: { xs: "14px", sm: "16px" } }} gutterBottom>Enrolled Courses</Typography>

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  {["SUBJECT CODE", "COMPONENTS", "LEC UNIT", "LAB UNIT", "CREDIT UNIT", "SECTION", "DAY", "TIME", "ROOM", "FACULTY", "ENROLLED", "ACTION"].map((h) => (
                    <TableCell key={h} style={{ textAlign: "center", border: `1px solid ${borderColor}`, fontSize: "11px", fontWeight: "bold", whiteSpace: "nowrap" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {enrolled.map((e, idx) => (
                  <TableRow key={idx}>
                    <TableCell style={{ textAlign: "center", border: `1px solid ${borderColor}`, fontSize: "11px" }}>{e.course_code}</TableCell>
                    <TableCell style={{ textAlign: "center", border: `1px solid ${borderColor}`, fontSize: "11px" }}>{e.components}</TableCell>
                    <TableCell style={{ textAlign: "center", border: `1px solid ${borderColor}`, fontSize: "11px" }}>{e.lec_unit}</TableCell>
                    <TableCell style={{ textAlign: "center", border: `1px solid ${borderColor}`, fontSize: "11px" }}>{e.lab_unit}</TableCell>
                    <TableCell style={{ textAlign: "center", border: `1px solid ${borderColor}`, fontSize: "11px" }}>{e.course_unit}</TableCell>
                    <TableCell style={{ textAlign: "center", border: `1px solid ${borderColor}`, fontSize: "11px" }}>{e.program_code}-{e.description}</TableCell>
                    <TableCell style={{ textAlign: "center", border: `1px solid ${borderColor}`, fontSize: "11px" }}>{e.day_description}</TableCell>
                    <TableCell style={{ textAlign: "center", border: `1px solid ${borderColor}`, fontSize: "11px", whiteSpace: "nowrap" }}>{e.school_time_start}-{e.school_time_end}</TableCell>
                    <TableCell style={{ textAlign: "center", border: `1px solid ${borderColor}`, fontSize: "11px" }}>{e.room_description}</TableCell>
                    <TableCell style={{ textAlign: "center", border: `1px solid ${borderColor}`, fontSize: "11px" }}>Prof. {e.lname}</TableCell>
                    <TableCell style={{ textAlign: "center", border: `1px solid ${borderColor}`, fontSize: "11px" }}>({e.number_of_enrolled})</TableCell>
                    <TableCell style={{ textAlign: "center", border: `1px solid ${borderColor}` }}>
                      <Button variant="contained" color="error" size="small" sx={{ fontSize: "10px", py: 0.3 }} onClick={() => deleteFromCart(e.id)}>Unenroll</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total Row */}
                <TableRow>
                  <TableCell colSpan={1} sx={{ textAlign: "center", fontWeight: "600", border: `1px solid ${borderColor}`, fontSize: "12px" }}>Total Unit</TableCell>
                  <TableCell colSpan={2} sx={{ textAlign: "center", border: `1px solid ${borderColor}`, fontSize: "12px" }}>
                    {enrolled.reduce((sum, item) => sum + (parseFloat(item.course_unit) || 0), 0) + enrolled.reduce((sum, item) => sum + (parseFloat(item.lab_unit) || 0), 0)}
                  </TableCell>
                  <TableCell colSpan={7} sx={{ border: `1px solid ${borderColor}` }} />
                  <TableCell colSpan={1} sx={{ textAlign: "center", border: `1px solid ${borderColor}` }}>
                    <Button variant="contained" color="error" size="small" sx={{ fontSize: "10px" }} onClick={deleteAllCart}>Unenroll All</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Box>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleConfirmDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>Confirm Enrollment</DialogTitle>
        <DialogContent>
          <DialogContentText style={{ whiteSpace: "pre-line" }}>{confirmDialogMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"


            onClick={handleConfirmDialogClose}>Cancel</Button>
          <Button onClick={handleConfirmDialogProceed} variant="contained">Continue</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: "100%" }}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CourseTagging;
