import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";
import { TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { FaFileExcel } from "react-icons/fa";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  Grid,
  FormControl, Select, MenuItem
} from "@mui/material";

const ProgramPanel = () => {
  const settings = useContext(SettingsContext);

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
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    if (!settings) return;

    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
    if (settings.border_color) setBorderColor(settings.border_color);
    if (settings.main_button_color) setMainButtonColor(settings.main_button_color);
    if (settings.sub_button_color) setSubButtonColor(settings.sub_button_color);
    if (settings.stepper_color) setStepperColor(settings.stepper_color);

    if (settings.logo_url) {
      setFetchedLogo(`${API_BASE_URL}${settings.logo_url}`);
    }

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

  const [program, setProgram] = useState({
    name: "",
    code: "",
    major: "",
    components: "",
    academic_program: "",  // ✅ new
  });


  const [programs, setPrograms] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const pageId = 34;

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


  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const importInputRef = useRef(null);
  const [importingXlsx, setImportingXlsx] = useState(false);

  const fetchPrograms = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_program`);
      setPrograms(res.data);
    } catch (err) {
      console.error("Error fetching programs:", err);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleChangesForEverything = (e) => {
    const { name, value } = e.target;
    setProgram((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddingProgram = async () => {
    if (!program.name || !program.code) {
      setSnackbar({
        open: true,
        message: "Please fill all fields",
        severity: "error",
      });
      return;
    }

    try {
      if (editMode) {
        await axios.put(`${API_BASE_URL}/program/${editId}`, program);
        setSnackbar({
          open: true,
          message: "Program updated successfully!",
          severity: "success",
        });
      } else {
        await axios.post(`${API_BASE_URL}/program`, program);
        setSnackbar({
          open: true,
          message: "Program added successfully!",
          severity: "success",
        });
      }

      setProgram({
        name: "",
        code: "",
        major: "",
        components: "",
        academic_program: "", // ✅
      });

      setEditMode(false);
      setEditId(null);
      fetchPrograms();
    } catch (err) {
      console.error("Error saving program:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Error saving program!",
        severity: "error",
      });
    }
  };

  const [openProgramDialog, setOpenProgramDialog] = useState(false);

  const handleEdit = (prog) => {
    setProgram({
      name: prog.program_description,
      code: prog.program_code,
      major: prog.major || "",
      components: String(prog.components || ""),
      academic_program: String(prog.academic_program || ""), // ✅
    });

    setEditMode(true);
    setEditId(prog.program_id);
    setOpenProgramDialog(true);
  };



  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);


  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/program/${id}`);
      fetchPrograms();
      setSnackbar({
        open: true,
        message: "Program deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Error deleting program:", err);
      setSnackbar({
        open: true,
        message: "Error deleting program!",
        severity: "error",
      });
    }
  };


  const [searchQuery, setSearchQuery] = useState("");
  const getCampusName = (components) => {
    const branch = branches.find(
      (item) => Number(item.id) === Number(components)
    );
    return branch?.branch || "—";
  };

  const filteredPrograms = programs.filter((prog) => {
    const q = searchQuery.toLowerCase();

    return (
      prog.program_description?.toLowerCase().includes(q) ||
      prog.program_code?.toLowerCase().includes(q) ||
      prog.major?.toLowerCase().includes(q) ||
      getCampusName(prog.components).toLowerCase().includes(q)

    );
  });


  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleProgramImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportingXlsx(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(`${API_BASE_URL}/import-program-xlsx`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success) {
        setSnackbar({
          open: true,
          message: response.data.message || "Program import completed.",
          severity: "success",
        });
        fetchPrograms();
      } else {
        setSnackbar({
          open: true,
          message: response.data?.error || "Program import failed.",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Program import failed.",
        severity: "error",
      });
    } finally {
      setImportingXlsx(false);
      event.target.value = "";
    }
  };



  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // adjust how many programs per page

  // Recalculate total pages dynamically based on filteredPrograms
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);

  // Calculate current slice of programs to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPrograms = filteredPrograms.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }

  // ✅ Styles now INSIDE the component
  const styles = {
    container: {
      display: "flex",
      justifyContent: "space-between",
      gap: "20px",
      flexWrap: "wrap",
    },


    formGroup: { marginBottom: "20px" },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "bold",
      color: "#444",
      fontSize: "16px",
    },
    input: {
      width: "100%",
      padding: "12px",
      fontSize: "16px",
      borderRadius: "5px",
      border: "1px solid #ccc",
    },

    table: { width: "100%", borderCollapse: "collapse" },
    th: {

      padding: "8px",
      textAlign: "center",
      fontWeight: "bold",
      border: `1px solid ${borderColor}`,
      fontSize: "16px",
      color: "#000"
    },
    td: {
      padding: "8px",
      textAlign: "left",
      borderBottom: "1px solid #ddd",
      fontSize: "16px",
      border: `1px solid ${borderColor}`,
    },
    editButton: {
      backgroundColor: "green",
      color: "white",
      border: "none",
      borderRadius: "5px",
      padding: "8px 14px",
      marginRight: "6px",
      cursor: "pointer",
      width: "100px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "5px",
    },
    deleteButton: {
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
    },
  };

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: titleColor, fontSize: "36px" }}
        >
          PROGRAM PANEL
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <TextField
            variant="outlined"
            placeholder="Search Program Description / Code / Major"
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
            onChange={handleProgramImport}
            style={{ display: "none" }}
          />
          <Button
            variant="contained"
            onClick={() => importInputRef.current?.click()}
            disabled={importingXlsx}
            sx={{ height: 40, textTransform: "none", fontWeight: "bold", minWidth: 170 }}
          >
            <FaFileExcel style={{ marginRight: 8 }} />
            {importingXlsx ? "Importing..." : "Import Program"}
          </Button>
          <Button
            onClick={() => {
              window.location.href = `${API_BASE_URL}/program_panel_template`;
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
      <br />

      <div style={styles.formSection}>

        <TableContainer component={Paper} sx={{ width: '100%', }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
              <TableRow>
                <TableCell colSpan={20} sx={{ border: `1px solid ${borderColor}`, py: 0.5, backgroundColor: settings?.header_color || "#1976d2", color: "white" }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ padding: "6px" }}
                  >
                    {/* LEFT SIDE - TOTAL PROGRAM */}
                    <Typography fontSize="14px" fontWeight="bold" color="white">
                      Total Program: {filteredPrograms.length}
                    </Typography>

                    {/* RIGHT SIDE - PAGINATION */}
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1}
                      flexWrap="wrap"
                    >
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
                              color: 'white', // dropdown arrow icon color
                            }
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                maxHeight: 200,
                                backgroundColor: '#fff', // dropdown background
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
                          }
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
                          }
                        }}
                      >
                        Last
                      </Button>

                      <Button
                        variant="contained"
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
                        onClick={() => {
                          setProgram({
                            name: "",
                            code: "",
                            major: "",
                            components: "",
                            academic_program: "",
                          });
                          setEditMode(false);
                          setOpenProgramDialog(true);
                        }}
                      >
                        + Add Program
                      </Button>


                    </Box>
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
          </Table>
        </TableContainer>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, backgroundColor: "#f5f5f5" }}>ID</th>
              <th style={{ ...styles.th, backgroundColor: "#f5f5f5" }}>Description</th>
              <th style={{ ...styles.th, backgroundColor: "#f5f5f5" }}>Code</th>
              <th style={{ ...styles.th, backgroundColor: "#f5f5f5" }}>Major</th>
              <th style={{ ...styles.th, backgroundColor: "#f5f5f5" }}>Campus</th>
              <th style={{ ...styles.th, backgroundColor: "#f5f5f5" }}>Academic Program</th>

              <th style={{ ...styles.th, backgroundColor: "#f5f5f5" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPrograms.map((prog, index) => (

              <tr key={prog.program_id}>
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.td}>{prog.program_description}</td>
                <td style={styles.td}>{prog.program_code}</td>
                <td style={styles.td}>{prog.major || "—"}</td>
                <td style={styles.td}>
                  {getCampusName(prog.components)}
                </td>
                <td style={styles.td}>
                  {prog.academic_program === 0
                    ? "Undergraduate"
                    : prog.academic_program === 1
                      ? "Graduate"
                      : prog.academic_program === 2
                        ? "Techvoc"
                        : "—"}
                </td>


                <td style={{ ...styles.td, textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                    <button
                      onClick={() => handleEdit(prog)}
                      style={styles.editButton}
                    >
                      <EditIcon fontSize="small" /> Edit
                    </button>

                    <button
                      onClick={() => {
                        setProgramToDelete(prog);
                        setOpenDeleteDialog(true);
                      }}
                      style={styles.deleteButton}
                    >
                      <DeleteIcon fontSize="small" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
        {programs.length === 0 && <p>No programs available.</p>}
        <TableContainer component={Paper} sx={{ width: '100%', }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
              <TableRow>
                <TableCell colSpan={20} sx={{ border: `1px solid ${borderColor}`, py: 0.5, backgroundColor: settings?.header_color || "#1976d2", color: "white" }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ padding: "6px" }}
                  >
                    {/* LEFT SIDE - TOTAL PROGRAM */}
                    <Typography fontSize="14px" fontWeight="bold" color="white">
                      Total Program: {filteredPrograms.length}
                    </Typography>

                    {/* RIGHT SIDE - PAGINATION */}
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1}
                      flexWrap="wrap"
                    >
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
                              color: 'white', // dropdown arrow icon color
                            }
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                maxHeight: 200,
                                backgroundColor: '#fff', // dropdown background
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
                          }
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
                          }
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
      <Dialog
        open={openProgramDialog}
        onClose={() => setOpenProgramDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: 6
          }
        }}
      >
        {/* ===== HEADER ===== */}
        <DialogTitle
          sx={{
            background: settings?.header_color || "#1976d2",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1.2rem",
            py: 2
          }}
        >
          {editMode ? "Edit Program" : "Add Program"}
        </DialogTitle>

        {/* ===== CONTENT ===== */}
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2}>

            {/* DESCRIPTION */}
            <Grid item xs={12} sx={{ marginTop: "20px" }}>
              <Typography fontWeight="bold">Program Description</Typography>
              <TextField
                fullWidth
                name="name"
                value={program.name}
                onChange={handleChangesForEverything}
                placeholder="Enter Program Description"
              />
            </Grid>

            {/* CODE */}
            <Grid item xs={12}>
              <Typography fontWeight="bold">Program Code</Typography>
              <TextField
                fullWidth
                name="code"
                value={program.code}
                onChange={handleChangesForEverything}
                placeholder="Enter Program Code"
              />
            </Grid>

            {/* MAJOR */}
            <Grid item xs={12}>
              <Typography fontWeight="bold">Major</Typography>
              <TextField
                fullWidth
                name="major"
                value={program.major}
                onChange={handleChangesForEverything}
                placeholder="Optional (e.g., Marketing Management)"
              />
            </Grid>

            {/* CAMPUS */}
            <Grid item xs={12}>
              <Typography fontWeight="bold">Campus</Typography>
              <TextField
                select
                fullWidth
                name="components"
                value={program.components}
                onChange={handleChangesForEverything}
              >
                <MenuItem value="">Select Campus</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={String(branch.id)}>
                    {branch.branch}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* ACADEMIC PROGRAM */}
            <Grid item xs={12}>
              <Typography fontWeight="bold">Academic Program</Typography>
              <TextField
                select
                fullWidth
                name="academic_program"
                value={program.academic_program}
                onChange={handleChangesForEverything}
              >
                <MenuItem value="">Select Type</MenuItem>
                <MenuItem value="0">Undergraduate</MenuItem>
                <MenuItem value="1">Graduate</MenuItem>
                <MenuItem value="2">Techvoc</MenuItem>
              </TextField>
            </Grid>

          </Grid>
        </DialogContent>

        {/* ===== ACTIONS ===== */}
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid #e0e0e0"
          }}
        >
          <Button
            onClick={() => {
              setOpenProgramDialog(false);
              setEditMode(false);
              setEditId(null);
            }}
            variant="contained"
            color="error"


          >
            Cancel
          </Button>

          <Button
            variant="contained"
            sx={{ px: 4, fontWeight: 600 }}
            onClick={() => {
              handleAddingProgram();
              setOpenProgramDialog(false);
            }}
          >
            {editMode ? "Update Program" : "Insert Program"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Delete Program</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete the program{" "}
            <b>{programToDelete?.program_description}</b>{" "}
            (<b>{programToDelete?.program_code}</b>)?
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
              handleDelete(programToDelete.program_id);
              setOpenDeleteDialog(false);
              setProgramToDelete(null);
            }}
          >
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>


      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProgramPanel;
