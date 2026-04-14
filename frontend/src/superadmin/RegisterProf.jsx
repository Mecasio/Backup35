import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  Paper,
  TableHead,
  TableRow,
  Avatar,
  FormControl,
  InputLabel,
  Stack,
  Select,
  Grid,
  MenuItem,
} from "@mui/material";
import { Add, Search, SortByAlpha, FileDownload } from "@mui/icons-material";
import axios from "axios";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import SearchIcon from "@mui/icons-material/Search";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import API_BASE_URL from "../apiConfig";
import * as XLSX from "xlsx";
import LockResetIcon from "@mui/icons-material/LockReset";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ImageIcon from "@mui/icons-material/Image";


const RegisterProf = () => {
  const settings = useContext(SettingsContext);

  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");
  const [subButtonColor, setSubButtonColor] = useState("#ffffff"); // ✅ NEW
  const [stepperColor, setStepperColor] = useState("#000000"); // ✅ NEW

  const [fetchedLogo, setFetchedLogo] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [shortTerm, setShortTerm] = useState("");
  const [campusAddress, setCampusAddress] = useState("");
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    if (!settings) return;

    // 🎨 Colors
    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
    if (settings.border_color) setBorderColor(settings.border_color);
    if (settings.main_button_color)
      setMainButtonColor(settings.main_button_color);
    if (settings.sub_button_color) setSubButtonColor(settings.sub_button_color);
    if (settings.stepper_color) setStepperColor(settings.stepper_color);

    // 🏫 Logo
    if (settings.logo_url) {
      setFetchedLogo(`${API_BASE_URL}${settings.logo_url}`);
    } else {
      setFetchedLogo(EaristLogo);
    }

    // 🏷️ School Info
    if (settings.company_name) setCompanyName(settings.company_name);
    if (settings.short_term) setShortTerm(settings.short_term);

    // ✅ Branches (JSON stored in DB)
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
    }
  }, [settings]);

  // Also put it at the very top
  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");

  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);


  const pageId = 70;

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


  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [professors, setProfessors] = useState([]);
  const [department, setDepartment] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editData, setEditData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);


  const [form, setForm] = useState({
    employee_id: "",
    fname: "",
    mname: "",
    lname: "",
    email: "",
    password: "",
    role: "faculty",
    dprtmnt_id: "",
    profileImage: null,
    preview: "", // ✅ for image preview
  });

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // success | error | info | warning

  const printFacultySlip = (prof, password, email) => {
    const resolvedCampusAddress =
      campusAddress || "No address set in Settings";

    const logoSrc = fetchedLogo || EaristLogo;
    const name = companyName?.trim() || "";

    const words = name.split(" ");
    const middleIndex = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, middleIndex).join(" ");
    const secondLine = words.slice(middleIndex).join(" ");

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
    <html>
      <head>
        <title>Faculty Account Slip</title>
        <style>
          @page { size: A5 portrait; margin: 8mm; }

          body { font-family: Arial; margin: 0; }

          .print-container { padding: 10px; }

          .header-top {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
          }

          .header-top img {
            width: 65px;
            height: 65px;
            border-radius: 50%;
          }

          .school-name {
            font-size: 15px;
            font-weight: bold;
          }

          .title {
            text-align: center;
            margin-top: 15px;
            font-size: 18px;
            font-weight: bold;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            border: 1.5px solid black;
          }

          th, td {
            border: 1.5px solid black;
            padding: 8px;
            font-size: 13px;
          }

          th {
            background: lightgray;
            width: 35%;
          }

          .password-box {
            margin-top: 20px;
            border: 2px dashed black;
            padding: 15px;
            text-align: center;
          }

          .password {
            font-size: 22px;
            font-weight: bold;
            color: red;
            letter-spacing: 2px;
          }

          .footer-note {
            margin-top: 15px;
            text-align: center;
            font-size: 12px;
          }
        </style>
      </head>

      <body onload="window.print(); setTimeout(() => window.close(), 100);">
        <div class="print-container">

          <div class="header-top">
            <img src="${logoSrc}" />
            <div>
              <div style="font-size:11px;">Republic of the Philippines</div>
              <div class="school-name">${firstLine}</div>
              ${secondLine ? `<div class="school-name">${secondLine}</div>` : ""}
              <div style="font-size:11px;">${resolvedCampusAddress}</div>
            </div>
          </div>

          <div class="title">Faculty Portal Account Slip</div>

          <table>
            <tr>
              <th>Employee ID</th>
              <td>${prof.employee_id || ""}</td>
            </tr>
            <tr>
              <th>Last Name</th>
              <td>${prof.lname || ""}</td>
            </tr>
            <tr>
              <th>First Name</th>
              <td>${prof.fname || ""}</td>
            </tr>
            <tr>
              <th>Middle Name</th>
              <td>${prof.mname || ""}</td>
            </tr>
            <tr>
              <th>Email</th>
              <td>${email}</td>
            </tr>
            <tr>
              <th>Username</th>
              <td>${email} / ${prof.employee_id}</td>
            </tr>
          </table>

          <div class="password-box">
            <div>Generated Password</div>
            <div class="password">${password}</div>
          </div>

          <div class="footer-note">
            Please change password after first login.
          </div>

        </div>
      </body>
    </html>
  `);

    printWindow.document.close();
  };

  const fetchProfessors = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/faculty/professors`);

      console.log("Fetched Professors:", res.data); // 👈 check what backend returns

      if (Array.isArray(res.data)) {
        setProfessors(res.data);
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        // some backends wrap results in a `data` property
        setProfessors(res.data.data);
      } else {
        console.warn("Unexpected professors response:", res.data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };


  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_department`);
      setDepartment(res.data);
      console.log(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchProfessors();
    fetchDepartments();
  }, []);

  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");


  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [sortOrder, setSortOrder] = useState("");


  const filteredProfessors = React.useMemo(() => {
    return professors
      .filter((p) => {
        // Search filter
        const fullText = `${p.fname || ""} ${p.mname || ""} ${p.lname || ""} ${p.email || ""}`.toLowerCase();
        const matchesSearch = fullText.includes(searchQuery);

        // Department filter
        const matchesDepartment =
          selectedDepartmentFilter === "" ||                  // All departments
          (selectedDepartmentFilter === "unassigned" && !p.dprtmnt_id) || // Unassigned
          p.dprtmnt_id === selectedDepartmentFilter;          // Matches specific department

        return matchesSearch && matchesDepartment;
      })
      .sort((a, b) => {
        // Sorting by full name
        const nameA = `${a.fname} ${a.lname}`.toLowerCase();
        const nameB = `${b.fname} ${b.lname}`.toLowerCase();
        if (sortOrder === "asc") return nameA.localeCompare(nameB);
        if (sortOrder === "desc") return nameB.localeCompare(nameA);
        return 0;
      });
  }, [professors, searchQuery, selectedDepartmentFilter, sortOrder]);



  const totalPages = Math.ceil(filteredProfessors.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProfessors = filteredProfessors.slice(indexOfFirstItem, indexOfLastItem);

  const maxButtonsToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);

  if (endPage - startPage < maxButtonsToShow - 1) {
    startPage = Math.max(1, endPage - maxButtonsToShow + 1);
  }

  const visiblePages = [];
  for (let i = startPage; i <= endPage; i++) {
    visiblePages.push(i);
  }



  const handleExportCSV = () => {
    const headers = ["Person ID", "Full Name", "Email", "Role", "Status"];
    const rows = currentProfessors.map((p) => [
      p.employee_id,
      `${p.fname} ${p.mname || ""} ${p.lname}`,
      p.email,
      p.role,
      p.status === 1 ? "Active" : "Inactive",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "professors.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleChange = (e) => {
    if (e.target.name === "profileImage") {
      setForm({ ...form, profileImage: e.target.files[0] });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSelect = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const requiredFields = ["fname", "lname", "email"];

    // Only required when creating a new professor
    if (!editData) {
      requiredFields.push("password", "profileImage", "employee_id");
    }

    const missing = requiredFields.filter((key) => !form[key]);
    if (missing.length > 0) {
      alert(`Please fill out required fields: ${missing.join(", ")}`);
      return;
    }

    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      // 💡 If editing and password is empty → DO NOT send it
      if (editData && key === "password" && value === "") return;

      if (value) formData.append(key, value);
    });

    try {
      if (editData) {
        await axios.put(
          `${API_BASE_URL}/faculty/update_prof/${editData.prof_id}`,
          formData
        );
        setSnackbarMessage("Professor updated successfully!");
        setSnackbarSeverity("success");
      } else {
        await axios.post(`${API_BASE_URL}/faculty/register_prof`, formData);
        setSnackbarMessage("Professor registered successfully!");
        setSnackbarSeverity("success");
      }

      setOpenSnackbar(true);

      setTimeout(() => {
        fetchProfessors();
      }, 500);

      handleCloseDialog();
    } catch (err) {
      console.error("Submit Error:", err);
      setSnackbarMessage(err.response?.data?.error || "An error occurred");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };


  const handleNotifyFaculty = async () => {
    if (!form.employee_id || !form.email) {
      setSnackbarMessage("Employee ID and Email are required");
      setSnackbarSeverity("warning");
      setOpenSnackbar(true);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/faculty/notify_faculty`, {
        employee_id: form.employee_id,
        email: form.email,
        password: form.password // optional
      });

      setSnackbarMessage("Faculty notified successfully!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (err) {
      console.error("Notify error:", err);
      setSnackbarMessage("Failed to send email");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleEdit = (prof) => {
    setEditData(prof);
    setForm({
      employee_id: prof.employee_id || "",
      fname: prof.fname,
      mname: prof.mname || "",
      lname: prof.lname,
      email: prof.email,
      password: "", // empty means optional
      role: prof.role || "faculty",
      dprtmnt_id: prof.dprtmnt_id || "",
      profileImage: null,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditData(null);
    setForm({
      employee_id: "",
      fname: "",
      mname: "",
      lname: "",
      email: "",
      password: "",
      role: "faculty",
      dprtmnt_id: "",
      profileImage: null,
    });
  };

  const handleToggleStatus = async (prof_id, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await axios.put(`${API_BASE_URL}/faculty/update_prof_status/${prof_id}`, {
        status: newStatus,
      });
      fetchProfessors();
    } catch (err) {
      console.error("Status toggle failed:", err);
    }
  };

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleImportClick = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    const data = await selectedFile.arrayBuffer();

    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const professors = rows
      .slice(1)
      .map((row) => ({
        employeeNumber: row[0]?.toString().trim(),
        firstName: row[1]?.trim(),
        middleName: row[2]?.trim() || "",
        lastName: row[3]?.trim(),
        email: row[5]?.trim(),
      }))
      .filter((prof) => {
        if (!prof.employeeNumber && !prof.firstName && !prof.lastName && !prof.email) return false;
        if (!prof.email) return false;
        return true;
      });

    console.log("FINAL DATA:", professors);

    const res = await axios.post(`${API_BASE_URL}/faculty/import_professors`, {
      professors,
    });

    console.log(res.data);

    fetchProfessors();
  };




  const handleGeneratePassword = () => {
    const newPassword = generatePassword(10);

    setForm((prev) => ({
      ...prev,
      password: newPassword,
    }));

    setSnackbarMessage("Password generated!");
    setSnackbarSeverity("info");
    setOpenSnackbar(true);
  };

  const generatePassword = (length = 10) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";

    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  };

  // Put this at the very bottom before the return 
  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return (
      <Unauthorized />
    );
  }









  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
      <div style={{ height: "10px" }}></div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} >
        {/* Left: Header */}
        <Typography variant="h4" fontWeight="bold" style={{ color: titleColor, }}>
          PROFESSOR ACCOUNTS
        </Typography>

        {/* Right: Search */}
        <TextField
          variant="outlined"
          placeholder="Search by name or email"
          size="small"

          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value.toLowerCase());
            setCurrentPage(1); // reset to page 1 when searching
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

      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />


      <br />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", mb: 2 }}>


        <TableContainer component={Paper} sx={{ width: '100%' }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
              <TableRow>
                <TableCell
                  colSpan={10}
                  sx={{
                    border: `1px solid ${borderColor}`,
                    py: 0.5,
                    backgroundColor: settings?.header_color || "#1976d2",
                    color: "white"
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" >
                    {/* Left: Applicant List Count */}
                    <Typography fontSize="14px" fontWeight="bold" color="white" >
                      Professor's List:
                    </Typography>

                    {/* Right: Pagination Controls */}
                    <Box display="flex" alignItems="center" gap={1}>
                      {/* First & Prev */}
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
                          },
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
                          },
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
                            '.MuiOutlinedInput-notchedOutline': {
                              borderColor: 'white',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'white',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'white',
                            },
                            '& svg': {
                              color: 'white',
                            }
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                maxHeight: 200,
                                backgroundColor: '#fff',
                              }
                            }
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

                      {/* Next & Last */}
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
                          '&:hover': {
                            borderColor: 'white',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                          },
                          '&.Mui-disabled': {
                            color: "white",
                            borderColor: "white",
                            backgroundColor: "transparent",
                            opacity: 1,
                          },
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
                          '&:hover': {
                            borderColor: 'white',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                          },
                          '&.Mui-disabled': {
                            color: "white",
                            borderColor: "white",
                            backgroundColor: "transparent",
                            opacity: 1,
                          },
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

        <TableContainer
          component={Paper}
          sx={{
            width: "100%",
            border: `1px solid ${borderColor}`,
            mb: -2,
          }}
        >
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between", // left vs right
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 2,
                    }}
                  >
                    {/* Left: Add Professor */}
                    <Button
                      startIcon={<Add />}
                      variant="contained"
                      onClick={() => {
                        setEditData(null);
                        setForm((prev) => ({
                          ...prev,
                          employee_id: "",
                          fname: "",
                          mname: "",
                          lname: "",
                          email: "",
                          password: "",
                          role: "faculty",
                          dprtmnt_id: "",
                          profileImage: null,
                        }));
                        setTimeout(() => setOpenDialog(true), 0);
                      }}

                      sx={{
                        backgroundColor: "default",
                        color: "white",
                        textTransform: "none",
                        fontWeight: "bold",
                        width: "350px",
                        "&:hover": { backgroundColor: "#000" },
                      }}
                    >
                      Add Professor
                    </Button>

                    {/* Right: Filter, Sort, Export */}
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      {/* Department Filter */}
                      <FormControl sx={{ width: "350px" }} size="small">
                        <InputLabel id="filter-department-label">Filter by Department</InputLabel>
                        <Select
                          labelId="filter-department-label"
                          value={selectedDepartmentFilter}
                          onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                          label="Filter by Department"
                        >
                          <MenuItem value="">All Departments</MenuItem>
                          {department.map((dep) => (
                            <MenuItem key={dep.dprtmnt_id} value={dep.dprtmnt_id}>
                              {dep.dprtmnt_name} ({dep.dprtmnt_code})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>


                      <FormControl size="small" sx={{ width: "200px" }}>
                        <Select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                          displayEmpty
                        >
                          <MenuItem value="">Select Order</MenuItem>
                          <MenuItem value="asc">Ascending</MenuItem>
                          <MenuItem value="desc">Descending</MenuItem>
                        </Select>
                      </FormControl>


                      {/* Export */}
                      <Button
                        variant="outlined"
                        startIcon={<FileDownload />}
                        onClick={handleExportCSV}
                        sx={{
                          borderColor: "#800000",
                          color: "#800000",
                          textTransform: "none",
                          fontWeight: "bold",
                          "&:hover": { borderColor: "#a52a2a", color: "#a52a2a" },
                        }}
                      >
                        Export CSV
                      </Button>


                    </Box>

                    <Box display="flex" gap={2}>
                      {/* SELECT FILE */}
                      <Button
                        variant="outlined"
                        component="label"
                      >
                        Select File
                        <input
                          hidden
                          type="file"
                          accept=".csv,.xls,.xlsx"
                          onChange={handleFileSelect}
                        />
                      </Button>

                      {selectedFile && (
                        <Typography variant="body2" mt={1}>
                          Selected: {selectedFile.name}
                        </Typography>
                      )}

                      {/* IMPORT BUTTON */}
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleImportClick}
                        disabled={!selectedFile}
                      >
                        Import
                      </Button>
                    </Box>
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>


      </Box>
      <TableContainer component={Paper} sx={{ width: "100%", border: `1px solid ${borderColor}`, }}>
        <Table>
          <TableHead sx={{
            backgroundColor: settings?.header_color || "#1976d2",

          }}>
            <TableRow>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: `1px solid ${borderColor}`,
                  border: `1px solid ${borderColor}`,
                }}
              >
                EMPLOYEE ID
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: `1px solid ${borderColor}`,
                }}
              >
                Image
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: `1px solid ${borderColor}`,
                }}
              >
                Full Name
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: `1px solid ${borderColor}`,
                }}
              >
                Email
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: `1px solid ${borderColor}`,
                }}
              >
                Department
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: `1px solid ${borderColor}`,
                }}
              >
                Position
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: `1px solid ${borderColor}`,
                  border: `1px solid ${borderColor}`,
                }}
              >
                Actions
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: `1px solid ${borderColor}`,
                }}
              >
                Status
              </TableCell>

            </TableRow>
          </TableHead>

          <TableBody>


            {currentProfessors.map((prof) => (
              <TableRow key={prof.prof_id}>
                <TableCell sx={{ border: `1px solid ${borderColor}`, border: `1px solid ${borderColor}`, }}>{prof.employee_id || ""}</TableCell>
                <TableCell sx={{ border: `1px solid ${borderColor}` }}>
                  <Avatar
                    src={
                      prof.profile_image
                        ? `${API_BASE_URL}/uploads/${prof.profile_image}`
                        : undefined
                    }
                    alt={prof.fname}
                    sx={{ width: 60, height: 60 }}
                  >
                    {prof.fname?.[0]}
                  </Avatar>
                </TableCell>
                <TableCell sx={{ border: `1px solid ${borderColor}` }}>{`${prof.fname} ${prof.mname || ""} ${prof.lname}`}</TableCell>
                <TableCell sx={{ border: `1px solid ${borderColor}` }}>{prof.email}</TableCell>
                <TableCell sx={{ border: `1px solid ${borderColor}` }}>{prof.dprtmnt_name} ({prof.dprtmnt_code})</TableCell>
                <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>{prof.role}</TableCell>
                <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                  <Button
                    onClick={() => handleEdit(prof)}
                    sx={{
                      backgroundColor: "green",
                      color: "white",
                      textTransform: "none",
                      fontWeight: "bold",

                    }}
                    variant="contained"
                  >
                    EDIT
                  </Button>
                </TableCell>
                <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                  <Button
                    onClick={() => handleToggleStatus(prof.prof_id, prof.status)}
                    sx={{
                      backgroundColor: prof.status === 1 ? "green" : "maroon",
                      color: "white",
                      textTransform: "none",
                    }}
                    variant="contained"
                  >
                    {prof.status === 1 ? "Active" : "Inactive"}
                  </Button>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: "hidden", boxShadow: 6 }
        }}
      >
        {/* HEADER */}
        <DialogTitle
          sx={{
            background: settings?.header_color || "#1976d2",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1.1rem",
            py: 2
          }}
        >
          {editData ? "Edit Faculty" : "Faculty Registration"}
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>

          <Typography fontWeight={700} mt={2} mb={2}>
            Faculty Information
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Employee ID"
                fullWidth
                value={form.employee_id}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="First Name"
                fullWidth
                name="fname"
                value={form.fname}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Last Name"
                fullWidth
                name="lname"
                value={form.lname}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Middle Name"
                fullWidth
                name="mname"
                value={form.mname}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Typography fontWeight={700} mt={3} mb={2}>
            Account Details
          </Typography>

          <TextField
            label="Email"
            fullWidth
            value={form.email}
            name="email"
            onChange={handleChange}
          />

          {/* PASSWORD BOX */}
          {form.password && (
            <Box
              mt={3}
              p={3}
              sx={{
                border: "2px dashed #1976d2",
                borderRadius: 2,
                textAlign: "center",
                backgroundColor: "#f9f9f9"
              }}
            >
              <Typography variant="h6">Generated Password</Typography>

              <Typography
                variant="h4"
                sx={{ color: "#d32f2f", fontWeight: "bold" }}
              >
                {form.password}
              </Typography>
            </Box>
          )}

          <FormControl fullWidth margin="dense" sx={{ mt: 3 }}>
            <InputLabel>Department</InputLabel>
            <Select
              name="dprtmnt_id"
              value={form.dprtmnt_id}
              onChange={handleSelect}
              label="Department"
            >
              {department.map((dep) => (
                <MenuItem key={dep.dprtmnt_id} value={dep.dprtmnt_id}>
                  {dep.dprtmnt_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* BUTTONS */}
          <Box mt={3}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">

              {/* GENERATE PASSWORD */}
              <Button
                variant="contained"
                startIcon={<LockResetIcon />}
                onClick={handleGeneratePassword}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  px: 3
                }}
              >
                Generate Password
              </Button>

              {/* UPLOAD IMAGE */}
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadFileIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  px: 3
                }}
              >
                Upload Image
                <input hidden type="file" onChange={handleChange} />
              </Button>

            </Stack>

            {/* IMAGE PREVIEW */}
            {form.preview && (
              <Box mt={3} display="flex" alignItems="center" gap={2}>
                <Avatar
                  src={form.preview}
                  variant="rounded"
                  sx={{ width: 90, height: 90, boxShadow: 2 }}
                />

                <Box>
                  <ImageIcon color="action" />
                  <span style={{ marginLeft: 6, fontSize: 14, color: "#666" }}>
                    Image Preview
                  </span>
                </Box>
              </Box>
            )}
          </Box>


        </DialogContent>

        {/* ACTIONS */}
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "space-between"
          }}
        >
          <Button
            onClick={handleCloseDialog}
            variant="contained"
            color="error"


          >
            Cancel
          </Button>

          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              color="secondary"

              disabled={!form.password}
              onClick={() =>
                printFacultySlip(form, form.password, form.email)
              }
            >
              Print
            </Button>

            <Button
              variant="contained"
              onClick={handleNotifyFaculty}

            >
              Send Email
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>



    </Box>

  );
};

export default RegisterProf;
