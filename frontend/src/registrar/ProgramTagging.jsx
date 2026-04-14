import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box, Typography, Button, Snackbar, Alert, FormControl, Select, MenuItem, TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  Grid
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";
import { Autocomplete, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ProgramTaggingFilter from "../registrar/ProgramTaggingFilter";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { FaFileExcel } from "react-icons/fa";


const ProgramTagging = () => {
  const settings = useContext(SettingsContext);
  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");
  const [subButtonColor, setSubButtonColor] = useState("#ffffff");   // ✅ NEW
  const [stepperColor, setStepperColor] = useState("#000000");       // ✅ NEW

  const [fetchedLogo, setFetchedLogo] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [shortTerm, setShortTerm] = useState("");
  const [campusAddress, setCampusAddress] = useState("");
  const [branches, setBranches] = useState([]);

  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");

  const [filteredPrograms, setFilteredPrograms] = useState([]);

  useEffect(() => {
    if (!settings) return;

    // 🎨 Colors
    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
    if (settings.border_color) setBorderColor(settings.border_color);
    if (settings.main_button_color) setMainButtonColor(settings.main_button_color);
    if (settings.sub_button_color) setSubButtonColor(settings.sub_button_color);   // ✅ NEW
    if (settings.stepper_color) setStepperColor(settings.stepper_color);           // ✅ NEW

    // 🏫 Logo
    if (settings.logo_url) {
      setFetchedLogo(`${API_BASE_URL}${settings.logo_url}`);
    } else {
      setFetchedLogo(EaristLogo);
    }

    // 🏷️ School Information
    if (settings.company_name) setCompanyName(settings.company_name);
    if (settings.short_term) setShortTerm(settings.short_term);
    if (settings.campus_address) setCampusAddress(settings.campus_address);
    if (settings?.branches) {
      try {
        const parsed =
          typeof settings.branches === "string"
            ? JSON.parse(settings.branches)
            : settings.branches;
        setBranches(parsed);
      } catch (err) {
        console.error("Failed to parse branches:", err);
        setBranches([]);
      }
    } else {
      setBranches([]);
    }

  }, [settings]);

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const importInputRef = useRef(null);
  const [importingXlsx, setImportingXlsx] = useState(false);

  const pageId = 35;

  const [employeeID, setEmployeeID] = useState("");

  const [openFormDialog, setOpenFormDialog] = useState(false);

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
      console.error('Error checking access:', error);
      setHasAccess(false);
      if (error.response && error.response.data.message) {
        console.log(error.response.data.message);
      } else {
        console.log("An unexpected error occurred.");
      }
      setLoading(false);
    }
  };

  const [progTag, setProgTag] = useState({
    curriculum_id: "",
    year_level_id: "",
    semester_id: "",
    course_id: "",
    lec_fee: "",
    lab_fee: "",
    iscomputer_lab: 0,
    islaboratory_fee: 0,
    is_nstp: 0,
    amount: 0,
  });



  const [courseList, setCourseList] = useState([]);
  const [yearLevelList, setYearlevelList] = useState([]);
  const [semesterList, setSemesterList] = useState([]);
  const [curriculumList, setCurriculumList] = useState([]);
  const [taggedPrograms, setTaggedPrograms] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [curriculumSearch, setCurriculumSearch] = useState("");

  useEffect(() => {
    // Start with all programs
    let filtered = taggedPrograms;

    // ✅ Filter by dropdowns safely (convert both sides to Number)
    if (selectedCurriculum) {
      filtered = filtered.filter(
        (p) => Number(p.curriculum_id) === Number(selectedCurriculum)
      );
    }
    if (selectedYearLevel) {
      filtered = filtered.filter(
        (p) => Number(p.year_level_id) === Number(selectedYearLevel)
      );
    }
    if (selectedSemester) {
      filtered = filtered.filter(
        (p) => Number(p.semester_id) === Number(selectedSemester)
      );
    }

    // ✅ Filter by search query (case-insensitive)
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) =>
        (p.curriculum_description || "").toLowerCase().includes(q) ||
        (p.program_code || "").toLowerCase().includes(q) ||
        (p.major || "").toLowerCase().includes(q) ||
        (p.course_description || "").toLowerCase().includes(q) ||
        (p.year_level_description || "").toLowerCase().includes(q) ||
        (p.semester_description || "").toLowerCase().includes(q)
      );
    }

    // ✅ Update state
    setFilteredPrograms(filtered);
    setCurrentPage(1);
  }, [searchQuery, selectedCurriculum, selectedYearLevel, selectedSemester, taggedPrograms]);


  const filteredCourses = courseList.filter((course) => {
    const words = courseSearch.toLowerCase().split(" ");

    const courseCode = (course.course_code || "").toLowerCase();
    const courseDesc = (course.course_description || "").toLowerCase();
    const coursePreq = (course.prereq || "").toLowerCase();

    return words.every((word) =>
      courseCode.includes(word) || courseDesc.includes(word) || coursePreq.includes(word)
    );
  });


  useEffect(() => {
    fetchYearLevel();
    fetchSemester();
    fetchCurriculum();
    fetchTaggedPrograms();
  }, []);

  const fetchYearLevel = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_year_level`);
      setYearlevelList(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchSemester = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_semester`);
      setSemesterList(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchCurriculum = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_active_curriculum`);
      setCurriculumList(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchCourse = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/course_list`);

      // 🔽 SORT COURSES alphabetically (course_code)
      setCourseList(
        res.data.sort((a, b) =>
          a.course_code.localeCompare(b.course_code, undefined, { numeric: true })
        )
      );

    } catch (err) {
      console.log(err);
    }
  };

  // useEffect(() => {
  //   fetchCourse();
  // }, []);

  useEffect(() => {
    fetchCourse();
  }, []);

  const fetchTaggedPrograms = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/program_tagging_list`);

      const normalized = res.data.map(p => ({
        ...p,
        iscomputer_lab: Number(p.iscomputer_lab ?? 0),
        islaboratory_fee: Number(p.islaboratory_fee ?? 0),
        is_nstp: Number(p.is_nstp ?? 0),
      }));

      // ✅ REMOVE DUPLICATES BASED ON UNIQUE PROGRAM KEY
      const unique = [];
      const seen = new Set();

      normalized.forEach(p => {
        const key = `${p.curriculum_id}-${p.year_level_id}-${p.semester_id}-${p.course_id}`;

        if (!seen.has(key)) {
          seen.add(key);
          unique.push(p);
        }
      });

      setTaggedPrograms(unique);
      setFilteredPrograms(unique);

    } catch (err) {
      console.log(err);
    }
  };

  const handleChangesForEverything = (e) => {
    const { name, value, type } = e.target;

    setProgTag((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };


  const handleInsertingProgTag = async () => {
    const {
      curriculum_id,
      year_level_id,
      semester_id,
      course_id,
      lec_fee,
      lab_fee,
      iscomputer_lab,
      islaboratory_fee,
      is_nstp,
      amount,
    } = progTag;

    // ✅ Required fields
    if (!curriculum_id || !year_level_id || !semester_id || !course_id) {
      setSnackbar({
        open: true,
        message: "Please fill all fields",
        severity: "error",
      });
      return;
    }

    // ✅ Fee validation
    if (lec_fee < 0 || lab_fee < 0) {
      setSnackbar({
        open: true,
        message: "Fees cannot be negative",
        severity: "error",
      });
      return;
    }

    // 🔍 Prevent duplicate (ignore self when editing)
    const isDuplicate = taggedPrograms.some(
      (p) =>
        Number(p.curriculum_id) === Number(curriculum_id) &&
        Number(p.year_level_id) === Number(year_level_id) &&
        Number(p.semester_id) === Number(semester_id) &&
        Number(p.course_id) === Number(course_id) &&
        Number(p.program_tagging_id) !== Number(editingId)
    );

    if (isDuplicate) {
      setSnackbar({
        open: true,
        message: "This program tag already exists!",
        severity: "error",
      });
      return;
    }

    try {
      if (editingId) {
        // ✅ Update existing program tag
        await axios.put(`${API_BASE_URL}/program_tagging/${editingId}`, {
          curriculum_id,
          year_level_id,
          semester_id,
          course_id,
          lec_fee: Number(lec_fee) || 0,
          lab_fee: Number(lab_fee) || 0,
          iscomputer_lab: Number(iscomputer_lab),
          islaboratory_fee: Number(islaboratory_fee),
          is_nstp: Number(is_nstp),
        });

        // 🔥 Update state locally instead of refetch
        setTaggedPrograms(prev =>
          prev.map(p =>
            p.program_tagging_id === editingId
              ? {
                ...p,
                ...progTag,
              }
              : p
          )
        );

        fetchTaggedPrograms();

        setSnackbar({
          open: true,
          message: "Program tag updated successfully!",
          severity: "success",
        });
      } else {
        // ✅ Insert new program tag
        const { data } = await axios.post(`${API_BASE_URL}/program_tagging`, {
          curriculum_id,
          year_level_id,
          semester_id,
          course_id,
          lec_fee: Number(lec_fee) || 0,
          lab_fee: Number(lab_fee) || 0,
          iscomputer_lab: Number(iscomputer_lab),
          islaboratory_fee: Number(islaboratory_fee),
          is_nstp: Number(is_nstp),
        });

        // 🔥 Add new tag to state immediately
        setTaggedPrograms((prev) => [
          ...prev,
          {
            program_tagging_id: data.insertId, // Use returned insertId
            curriculum_id,
            year_level_id,
            semester_id,
            course_id,
            lec_fee: Number(lec_fee) || 0,
            lab_fee: Number(lab_fee) || 0,
            iscomputer_lab: Number(iscomputer_lab),
            islaboratory_fee: Number(islaboratory_fee),
            is_nstp: Number(is_nstp),
            amount: Number(amount) || 0,
          },
        ]);

        fetchTaggedPrograms();
        setSnackbar({
          open: true,
          message: "Program tag inserted successfully!",
          severity: "success",
        });
      }

      // ✅ Reset form
      setProgTag({
        curriculum_id: "",
        year_level_id: "",
        semester_id: "",
        course_id: "",
        lec_fee: "",
        lab_fee: "",
        iscomputer_lab: 0,
        islaboratory_fee: 0,
        is_nstp: 0,
        amount: 0,
      });

      setEditingId(null);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Error saving data.",
        severity: "error",
      });
    }
  };



  const handleEdit = (program) => {
    setEditingId(program.program_tagging_id);

    setProgTag({
      curriculum_id: program.curriculum_id,
      year_level_id: program.year_level_id,
      semester_id: program.semester_id,
      course_id: program.course_id,
      lec_fee: program.lec_fee ?? "",
      lab_fee: program.lab_fee ?? "",
      iscomputer_lab: program.iscomputer_lab ?? 0,
      islaboratory_fee: program.islaboratory_fee ?? 0,
      is_nstp: program.is_nstp ?? 0,
      amount: program.amount ?? 0,

    });

  };
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [programToDelete, setProgramToDelete] = useState(null);

  const [openDeleteAllDialog, setOpenDeleteAllDialog] = useState(false);

  const [deleteAllFilter, setDeleteAllFilter] = useState(null);

  const handleDeleteAllTagged = async () => {
    if (!deleteAllFilter) return;

    try {
      await axios.delete(`${API_BASE_URL}/program_tagging/delete_all`, {
        data: deleteAllFilter, // send filter as body
      });

      // Remove from frontend state immediately
      setTaggedPrograms(prev =>
        prev.filter(p =>
          !(
            Number(p.curriculum_id) === Number(deleteAllFilter.curriculum_id) &&
            Number(p.year_level_id) === Number(deleteAllFilter.year_level_id) &&
            Number(p.semester_id) === Number(deleteAllFilter.semester_id)
          )
        )
      );

      setSnackbar({
        open: true,
        message: "All matching program tags deleted successfully!",
        severity: "success",
      });

    } catch (err) {
      setSnackbar({
        open: true,
        message: "Error deleting all tagged programs.",
        severity: "error",
      });
    }
  };


  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/program_tagging/${id}`);

      setTaggedPrograms(prev =>
        prev.filter(p => p.program_tagging_id !== id)
      );

      setSnackbar({
        open: true,
        message: "Program tag deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Error deleting program tag.",
        severity: "error",
      });
    }
  };

  const handleProgramTaggingImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportingXlsx(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(`${API_BASE_URL}/import-program-tagging-xlsx`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success) {
        setSnackbar({
          open: true,
          message: response.data.message || "Program tagging import completed.",
          severity: "success",
        });
        fetchTaggedPrograms();
      } else {
        setSnackbar({
          open: true,
          message: response.data?.error || "Program tagging import failed.",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Program tagging import failed.",
        severity: "error",
      });
    } finally {
      setImportingXlsx(false);
      event.target.value = "";
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // total pages (cap at 100 like your original)
  const totalPages = Math.min(
    100,
    Math.ceil(filteredPrograms.length / itemsPerPage)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentPrograms = filteredPrograms.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCurriculum, selectedYearLevel, selectedSemester]);


  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedAcademicProgram, setSelectedAcademicProgram] = useState("");

  const getBranchLabel = (branchId) => {
    const branch = branches.find((item) => Number(item.id) === Number(branchId));
    return branch?.branch || "�";
  };

  const filteredCurriculumList = Array.from(
    new Map(
      curriculumList
        .filter(item => {
          if (selectedCampus !== "") {
            if (Number(item.components) !== Number(selectedCampus))
              return false;
          }

          if (selectedAcademicProgram !== "") {
            if (
              Number(item.academic_program) !==
              Number(selectedAcademicProgram)
            )
              return false;
          }

          return true;
        })
        .map(item => [item.curriculum_id, item])
    ).values()
  );

  const formatSchoolYear = (yearDesc) => {
    if (!yearDesc) return "";
    const startYear = Number(yearDesc);
    if (isNaN(startYear)) return yearDesc;
    return `${startYear} - ${startYear + 1}`;
  };


  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: titleColor, fontSize: "36px" }}
        >
          PROGRAM AND COURSE MANAGEMENT
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <TextField
            variant="outlined"
            placeholder="Search Curriculum / Course / Year / Semester"
            size="small"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            sx={{
              width: 450,
              backgroundColor: "#fff",
              borderRadius: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
              },
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: "gray" }} />,
            }}
          />
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleProgramTaggingImport}
            style={{ display: "none" }}
          />
          <Button
            variant="contained"
            onClick={() => importInputRef.current?.click()}
            disabled={importingXlsx}
            sx={{ height: 40, textTransform: "none", fontWeight: "bold", minWidth: 210 }}
          >
            <FaFileExcel style={{ marginRight: 8 }} />
            {importingXlsx ? "Importing..." : "Import Program Tagging"}
          </Button>
          <Button
            onClick={() => {
              window.location.href = `${API_BASE_URL}/program_tagging_template`;
            }}
            sx={{
              height: 40, color: "black", border: "2px solid black",
              backgroundColor: "#f0f0f0", textTransform: "none", fontWeight: "bold", minWidth: 165
            }}
          >
            📥 Download Template
          </Button>
        </Box>


      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />

      <div style={styles.container}>





        <TableContainer component={Paper} sx={{ width: '100%', border: `1px solid ${borderColor}`, mb: "-30px" }}>
          <Table>
            <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
              <TableRow>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%"
                  }}
                >
                  <TableCell sx={{ color: "white", textAlign: "center" }}>
                    Existing Schedules
                  </TableCell>


                  <Button
                    variant="contained"
                    onClick={() => {
                      setEditingId(null);

                      setProgTag({
                        curriculum_id: "",
                        year_level_id: "",
                        semester_id: "",
                        course_id: "",
                        lec_fee: "",
                        lab_fee: "",
                        iscomputer_lab: 0,
                        islaboratory_fee: 0,
                        is_nstp: 0,
                        amount: 0,
                      });

                      setOpenFormDialog(true);
                    }}
                    sx={{
                      backgroundColor: "#1976d2", // ✅ Blue
                      color: "#fff",
                      fontWeight: "bold",
                      borderRadius: "8px",
                      width: "250px",
                      textTransform: "none",
                      px: 2,
                      mr: "15px",
                      '&:hover': {
                        backgroundColor: "#1565c0" // darker blue hover
                      }
                    }}
                  >
                    + Insert Program Tag
                  </Button>
                </Box>
              </TableRow>
            </TableHead>
          </Table>
        </TableContainer>
        <div style={{ ...styles.displaySection, border: `1px solid ${borderColor}` }}>
          <ProgramTaggingFilter
            curriculumList={curriculumList}
            yearLevelList={yearLevelList}
            semesterList={semesterList}
            taggedPrograms={taggedPrograms}

            selectedCurriculum={selectedCurriculum}
            selectedYearLevel={selectedYearLevel}
            selectedSemester={selectedSemester}

            setSelectedCurriculum={setSelectedCurriculum}
            setSelectedYearLevel={setSelectedYearLevel}
            setSelectedSemester={setSelectedSemester}

            setFilteredPrograms={setFilteredPrograms}
          />

          <TableContainer component={Paper} sx={{ width: '100%', mt: 4 }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
                <TableRow>
                  <TableCell
                    colSpan={10}
                    sx={{
                      border: `1px solid ${borderColor}`,
                      py: 0.5,
                      backgroundColor: settings?.header_color || "#1976d2",
                      color: "white",
                    }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between" // Left & right sides
                      alignItems="center"
                      flexWrap="wrap"
                      gap={1}
                    >
                      {/* Left side: Total Tagged Programs */}
                      <Typography fontSize="14px" fontWeight="bold" color="white">
                        Total Tagged Programs: {filteredPrograms.length}
                      </Typography>

                      {/* Right side: Pagination / Filtering Controls */}
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          variant="outlined"
                          size="small"
                          sx={{
                            minWidth: 80,
                            color: "white",
                            borderColor: "white",
                            backgroundColor: "transparent",
                            '&:hover': {
                              borderColor: 'white',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                            },
                            '&.Mui-disabled': {
                              color: "white",
                              borderColor: "white",
                              backgroundColor: "transparent",
                              opacity: 1,
                            }
                          }}
                        >
                          First
                        </Button>

                        <Button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          variant="outlined"
                          size="small"
                          sx={{
                            minWidth: 80,
                            color: "white",
                            borderColor: "white",
                            backgroundColor: "transparent",
                            '&:hover': {
                              borderColor: 'white',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                            },
                            '&.Mui-disabled': {
                              color: "white",
                              borderColor: "white",
                              backgroundColor: "transparent",
                              opacity: 1,
                            }
                          }}
                        >
                          Prev
                        </Button>

                        {/* Page Dropdown */}
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <Select
                            value={currentPage}
                            onChange={(e) => setCurrentPage(Number(e.target.value))}
                            displayEmpty
                            sx={{
                              fontSize: '12px',
                              height: 36,
                              color: 'white',
                              border: '1px solid white',
                              backgroundColor: 'transparent',
                              '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                              '& svg': { color: 'white' }
                            }}
                            MenuProps={{
                              PaperProps: { sx: { maxHeight: 200, backgroundColor: '#fff' } }
                            }}
                          >
                            {Array.from({ length: totalPages }, (_, i) => (
                              <MenuItem key={i + 1} value={i + 1}>
                                Page {i + 1}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <Typography fontSize="11px" color="white">
                          of {totalPages} page{totalPages > 1 ? 's' : ''}
                        </Typography>

                        <Button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          variant="outlined"
                          size="small"
                          sx={{
                            minWidth: 80,
                            color: "white",
                            borderColor: "white",
                            backgroundColor: "transparent",
                            '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
                            '&.Mui-disabled': { color: "white", borderColor: "white", backgroundColor: "transparent", opacity: 1 }
                          }}
                        >
                          Next
                        </Button>

                        <Button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          variant="outlined"
                          size="small"
                          sx={{
                            minWidth: 80,
                            color: "white",
                            borderColor: "white",
                            backgroundColor: "transparent",
                            '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
                            '&.Mui-disabled': { color: "white", borderColor: "white", backgroundColor: "transparent", opacity: 1 }
                          }}
                        >
                          Last
                        </Button>
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
            </Table>
          </TableContainer>

          <div style={styles.taggedProgramsContainer}>
            {taggedPrograms.length > 0 ? (

              <table style={{ ...styles.table, mt: "-15px", mb: 4 }}>

                <thead>

                  <tr>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `1px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      #
                    </th>


                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `1px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Curriculum
                    </th>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `1px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Course
                    </th>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `1px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Year Level
                    </th>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `1px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Semester
                    </th>

                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `1px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Lec Fee
                    </th>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `1px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Lab Fee
                    </th>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `1px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Computer Fee
                    </th>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `1px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Laboratory Fee
                    </th>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `1px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      NSTP Fee
                    </th>
                    <th
                      style={{
                        ...styles.th,
                        backgroundColor: "#f5f5f5",
                        border: `1px solid ${borderColor}`,
                        color: "black",
                        textAlign: "center"
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentPrograms.map((program, index) => (

                    <tr key={program.program_tagging_id}>
                      <td style={{ ...styles.td, border: `1px solid ${borderColor}` }}>
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td style={{ ...styles.td, border: `1px solid ${borderColor}` }}>
                        {formatSchoolYear(program.year_description)}  ({program.program_code}) – {program.curriculum_description}
                        {program.major ? ` (${program.major})` : ""}
                      </td>



                      <td style={{ ...styles.td, border: `1px solid ${borderColor}` }}>
                        ({program.course_code}) - {program.course_description} - ({program.prereq})
                      </td>
                      <td style={{ ...styles.td, border: `1px solid ${borderColor}`, textAlign: "center" }}>
                        {program.year_level_description}
                      </td>
                      <td style={{ ...styles.td, border: `1px solid ${borderColor}`, textAlign: "center" }}>
                        {program.semester_description}
                      </td>
                      <td style={{ ...styles.td, border: `1px solid ${borderColor}`, textAlign: "center" }}>
                        {program.lec_fee ?? "—"}
                      </td>
                      <td style={{ ...styles.td, border: `1px solid ${borderColor}`, textAlign: "center" }}>
                        {program.lab_fee ?? "—"}
                      </td>

                      <td style={{ ...styles.td, border: `1px solid ${borderColor}`, textAlign: "center" }}>
                        {Number(program.iscomputer_lab) === 1 ? "Yes" : "No"}
                      </td>

                      <td style={{ ...styles.td, border: `1px solid ${borderColor}`, textAlign: "center" }}>
                        {Number(program.islaboratory_fee) === 1 ? "Yes" : "No"}
                      </td>

                      <td style={{ ...styles.td, border: `1px solid ${borderColor}`, textAlign: "center" }}>
                        {Number(program.is_nstp) === 1 ? "Yes" : "No"}
                      </td>

                      {/* <td
                        style={{
                          ...styles.td,
                          border: `1px solid ${borderColor}`,
                          textAlign: "right",
                          fontWeight: "bold",
                          textAlign: "center"
                        }}
                      >
                        ₱ {Number(program.amount || 0).toLocaleString()}
                      </td> */}

                      <td
                        style={{
                          ...styles.td,
                          whiteSpace: "nowrap",
                          border: `1px solid ${borderColor}`,

                        }}
                      >
                        <button
                          onClick={() => {
                            handleEdit(program);
                            setOpenFormDialog(true);
                          }}
                          style={{
                            backgroundColor: "green",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            padding: "8px 14px",

                            cursor: "pointer",
                            width: "100px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "5px",


                          }}
                        >
                          <EditIcon fontSize="small" /> Edit
                        </button>

                        <button
                          onClick={() => {
                            setDeleteId(program.program_tagging_id);
                            setProgramToDelete(program); // 👈 save full row
                            setOpenDeleteDialog(true);
                          }}
                          style={{

                            backgroundColor: "#9E0000",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            padding: "8px 14px",
                            cursor: "pointer",
                            width: "100px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "5px",
                          }}
                        >
                          <DeleteIcon fontSize="small" /> Delete
                        </button>

                      </td>
                    </tr>
                  ))}
                </tbody>


              </table>


            ) : (
              <p>No tagged programs available.</p>
            )}

            <TableContainer component={Paper} sx={{ width: '100%', mb: 4 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      sx={{
                        border: `1px solid ${borderColor}`,
                        py: 0.5,
                        backgroundColor: settings?.header_color || "#1976d2",
                        color: "white",
                      }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between" // Left & right sides
                        alignItems="center"
                        flexWrap="wrap"
                        gap={1}
                      >
                        {/* Left side: Total Tagged Programs */}
                        <Typography fontSize="14px" fontWeight="bold" color="white">
                          Total Tagged Programs: {filteredPrograms.length}
                        </Typography>

                        {/* Right side: Pagination / Filtering Controls */}
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            variant="outlined"
                            size="small"
                            sx={{
                              minWidth: 80,
                              color: "white",
                              borderColor: "white",
                              backgroundColor: "transparent",
                              '&:hover': {
                                borderColor: 'white',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                              },
                              '&.Mui-disabled': {
                                color: "white",
                                borderColor: "white",
                                backgroundColor: "transparent",
                                opacity: 1,
                              }
                            }}
                          >
                            First
                          </Button>

                          <Button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            variant="outlined"
                            size="small"
                            sx={{
                              minWidth: 80,
                              color: "white",
                              borderColor: "white",
                              backgroundColor: "transparent",
                              '&:hover': {
                                borderColor: 'white',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                              },
                              '&.Mui-disabled': {
                                color: "white",
                                borderColor: "white",
                                backgroundColor: "transparent",
                                opacity: 1,
                              }
                            }}
                          >
                            Prev
                          </Button>

                          {/* Page Dropdown */}
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <Select
                              value={currentPage}
                              onChange={(e) => setCurrentPage(Number(e.target.value))}
                              displayEmpty
                              sx={{
                                fontSize: '12px',
                                height: 36,
                                color: 'white',
                                border: '1px solid white',
                                backgroundColor: 'transparent',
                                '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                                '& svg': { color: 'white' }
                              }}
                              MenuProps={{
                                PaperProps: { sx: { maxHeight: 200, backgroundColor: '#fff' } }
                              }}
                            >
                              {Array.from({ length: totalPages }, (_, i) => (
                                <MenuItem key={i + 1} value={i + 1}>
                                  Page {i + 1}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <Typography fontSize="11px" color="white">
                            of {totalPages} page{totalPages > 1 ? 's' : ''}
                          </Typography>

                          <Button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            variant="outlined"
                            size="small"
                            sx={{
                              minWidth: 80,
                              color: "white",
                              borderColor: "white",
                              backgroundColor: "transparent",
                              '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
                              '&.Mui-disabled': { color: "white", borderColor: "white", backgroundColor: "transparent", opacity: 1 }
                            }}
                          >
                            Next
                          </Button>

                          <Button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            variant="outlined"
                            size="small"
                            sx={{
                              minWidth: 80,
                              color: "white",
                              borderColor: "white",
                              backgroundColor: "transparent",
                              '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
                              '&.Mui-disabled': { color: "white", borderColor: "white", backgroundColor: "transparent", opacity: 1 }
                            }}
                          >
                            Last
                          </Button>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
              </Table>
            </TableContainer>
          </div>

        </div>


      </div>

      <Dialog
        open={openFormDialog}
        onClose={() => setOpenFormDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: 6
          }
        }}
      >
        {/* HEADER */}
        <DialogTitle
          sx={{
            background: settings?.header_color || "#1976d2",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1.2rem",
            py: 2
          }}
        >
          {editingId ? "Edit Program Tag" : "Insert Program Tag"}
        </DialogTitle>

        {/* CONTENT */}
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>

            {/* CAMPUS */}
            <Grid item xs={12} md={6}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Campus
              </Typography>
              <TextField
                select
                fullWidth
                label="Campus"
                value={selectedCampus}
                onChange={(e) => {
                  setSelectedCampus(e.target.value);
                  setSelectedAcademicProgram("");
                  setProgTag(prev => ({
                    ...prev,
                    curriculum_id: ""
                  }));
                }}
              >
                <MenuItem value="">Choose Campus</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.branch}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* PROGRAM */}
            <Grid item xs={12} md={6}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Program
              </Typography>
              <TextField
                select
                fullWidth
                label="Academic Program"
                value={selectedAcademicProgram}
                onChange={(e) => {
                  setSelectedAcademicProgram(e.target.value);
                  setProgTag(prev => ({
                    ...prev,
                    curriculum_id: ""
                  }));
                }}
              >
                <MenuItem value="">Select Program</MenuItem>
                <MenuItem value="0">Undergraduate</MenuItem>
                <MenuItem value="1">Graduate</MenuItem>
                <MenuItem value="2">Techvoc</MenuItem>
              </TextField>
            </Grid>



            {/* CURRICULUM */}
            <Grid item xs={12}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Curriculum
              </Typography>

              <Autocomplete
                fullWidth
                options={filteredCurriculumList}
                value={
                  filteredCurriculumList.find(
                    item => item.curriculum_id === progTag.curriculum_id
                  ) || null
                }
                onChange={(event, newValue) => {
                  setProgTag(prev => ({
                    ...prev,
                    curriculum_id: newValue?.curriculum_id || ""
                  }));
                }}
                getOptionLabel={(option) =>
                  `${formatSchoolYear(option.year_description)}: (${option.program_code}) ${option.program_description
                  }${option.major ? ` (${option.major})` : ""} (${getBranchLabel(
                    option.components
                  )})`
                }
                renderInput={(params) => (
                  <TextField {...params} label="Choose Curriculum" />
                )}
              />
            </Grid>


            <Grid item xs={12}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Course
              </Typography>

              <Autocomplete
                fullWidth
                options={courseList}
                value={
                  courseList.find(
                    (course) => course.course_id === progTag.course_id
                  ) || null
                }
                onChange={(event, newValue) => {
                  setProgTag((prev) => ({
                    ...prev,
                    course_id: newValue?.course_id || "",
                  }));
                }}
                getOptionLabel={(option) =>
                  `${option.course_code} - ${option.course_description} (${option.prereq || "No prereq"})`
                }
                filterOptions={(options, { inputValue }) => {
                  const words = inputValue.toLowerCase().split(" ");

                  return options.filter((course) => {
                    const courseCode = (course.course_code || "").toLowerCase();
                    const courseDesc = (course.course_description || "").toLowerCase();
                    const coursePreq = (course.prereq || "").toLowerCase();

                    return words.every(
                      (word) =>
                        courseCode.includes(word) ||
                        courseDesc.includes(word) ||
                        coursePreq.includes(word)
                    );
                  });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Choose Course" />
                )}
              />
            </Grid>

            {/* YEAR */}
            <Grid item xs={6}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Year Level
              </Typography>
              <TextField
                select
                fullWidth
                label="Year Level"
                name="year_level_id"
                value={progTag.year_level_id}
                onChange={handleChangesForEverything}
              >
                {yearLevelList.map((year) => (
                  <MenuItem
                    key={year.year_level_id}
                    value={year.year_level_id}
                  >
                    {year.year_level_description}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* SEM */}
            <Grid item xs={6}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Semester
              </Typography>
              <TextField
                select
                fullWidth
                label="Semester"
                name="semester_id"
                value={progTag.semester_id}
                onChange={handleChangesForEverything}
              >
                {semesterList.map((semester) => (
                  <MenuItem
                    key={semester.semester_id}
                    value={semester.semester_id}
                  >
                    {semester.semester_description}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* FEES */}
            <Grid item xs={6}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Lecture Fee
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Lecture Fee"
                name="lec_fee"
                value={progTag.lec_fee}
                onChange={handleChangesForEverything}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Laboratory Fee
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Laboratory Fee"
                name="lab_fee"
                value={progTag.lab_fee}
                onChange={handleChangesForEverything}
              />
            </Grid>

            {/* BULLET */}
            <Grid item xs={12}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Fee Type
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="radio"
                    style={{
                      width: "25px",
                      height: "25px",
                      cursor: "pointer"
                    }}
                    checked={progTag.iscomputer_lab === 1}
                    onChange={() =>
                      setProgTag(prev => ({
                        ...prev,
                        iscomputer_lab: 1,
                        islaboratory_fee: 0,
                        is_nstp: 0
                      }))
                    }
                  />
                  Computer Lab
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="radio"
                    style={{
                      width: "25px",
                      height: "25px",
                      cursor: "pointer"
                    }}
                    checked={progTag.islaboratory_fee === 1}
                    onChange={() =>
                      setProgTag(prev => ({
                        ...prev,
                        iscomputer_lab: 0,
                        islaboratory_fee: 1,
                        is_nstp: 0
                      }))
                    }
                  />
                  Laboratory Fee
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="radio"
                    style={{
                      width: "25px",
                      height: "25px",
                      cursor: "pointer"
                    }}
                    checked={progTag.is_nstp === 1}
                    onChange={() =>
                      setProgTag(prev => ({
                        ...prev,
                        iscomputer_lab: 0,
                        islaboratory_fee: 0,
                        is_nstp: 1
                      }))
                    }
                  />
                  NSTP Subject
                </label>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        {/* ACTIONS */}
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid #e0e0e0"
          }}
        >
          <Button
            variant="contained"
            color="error"


            onClick={() => setOpenFormDialog(false)}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              handleInsertingProgTag();
              setOpenFormDialog(false);
            }}
          >
            {editingId ? "Update Program Tag" : "Insert Program Tag"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Delete Program Tag</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete the course{" "}
            <b>{programToDelete?.course_description}</b>{" "}
            from curriculum{" "}
            <b>{programToDelete?.curriculum_description}</b>?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            color="error"


            onClick={() => setOpenDeleteDialog(false)}>
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={() => {
              handleDelete(deleteId);
              setOpenDeleteDialog(false);
              setProgramToDelete(null);
            }}
          >
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteAllDialog}
        onClose={() => setOpenDeleteAllDialog(false)}
      >
        <DialogTitle>Confirm Delete ALL Program Tags</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete ALL tagged courses under this:
            <br /><br />
            <b>Curriculum ID:</b> {deleteAllFilter?.curriculum_id} <br />
            <b>Year Level:</b> {deleteAllFilter?.year_level_id} <br />
            <b>Semester:</b> {deleteAllFilter?.semester_id}
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            color="error"


            onClick={() => setOpenDeleteAllDialog(false)}>
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={() => {
              handleDeleteAllTagged();
              setOpenDeleteAllDialog(false);
            }}
          >
            Yes, Delete All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column", // 👈 TOP & BOTTOM
    gap: "30px",
    width: "95%",
    margin: "30px auto",
  },
  formSection: {
    width: "100%",   // 👈 instead of minWidth: "48%"
    background: "#f8f8f8",
    padding: "25px",

    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },

  displaySection: {
    width: "100%",   // 👈 instead of minWidth: "48%"
    background: "#f8f8f8",
    padding: "25px",

    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    overflowY: "auto",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    fontWeight: "bold",
    display: "block",
    marginBottom: "8px",
  },
  select: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  taggedProgramsContainer: {

    maxHeight: "750px",

  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",

  },
  th: {
    padding: "12px",
    borderBottom: "2px solid #ccc",
    backgroundColor: "#f1f1f1",
    fontWeight: "bold",
    fontSize: "15px",
    color: "#333",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #ddd",
    fontSize: "14px",
    color: "#333",
  },
};

export default ProgramTagging;

