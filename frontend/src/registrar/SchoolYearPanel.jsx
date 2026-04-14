import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box, Typography, Snackbar, Alert, Button, TextField, Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  MenuItem,
  Select,
  FormControl
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";

const SchoolYearPanel = () => {
  const settings = useContext(SettingsContext);

  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");

  const [userID, setUserID] = useState("");
  const [userRole, setUserRole] = useState("");
  const [employeeID, setEmployeeID] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const pageId = 55;

  const [years, setYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // 🔍 Search query

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [editID, setEditID] = useState(null); // To track which school year is being edited

  useEffect(() => {
    if (!settings) return;
    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
    if (settings.border_color) setBorderColor(settings.border_color);
  }, [settings]);

  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");
    const storedEmployeeID = localStorage.getItem("employee_id");

    if (storedUser && storedRole && storedID) {
      setUserID(storedID);
      setUserRole(storedRole);
      setEmployeeID(storedEmployeeID);

      if (storedRole === "registrar") checkAccess(storedEmployeeID);
      else window.location.href = "/login";
    } else {
      window.location.href = "/login";
    }
  }, []);

  const checkAccess = async (employeeID) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`);
      setHasAccess(response.data?.page_privilege === 1);
    } catch {
      setHasAccess(false);
      setSnackbar({ open: true, message: "Failed to check access", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchYears = async () => {
    try { const res = await axios.get(`${API_BASE_URL}/year_table`); setYears(res.data); }
    catch { setSnackbar({ open: true, message: "Failed to fetch years", severity: "error" }); }
  };

  const fetchSemesters = async () => {
    try { const res = await axios.get(`${API_BASE_URL}/get_semester`); setSemesters(res.data); }
    catch { setSnackbar({ open: true, message: "Failed to fetch semesters", severity: "error" }); }
  };

  const fetchSchoolYears = async () => {
    try { const res = await axios.get(`${API_BASE_URL}/school_years`); setSchoolYears(res.data); }
    catch { setSnackbar({ open: true, message: "Failed to fetch school years", severity: "error" }); }
  };

  useEffect(() => {
    fetchYears();
    fetchSemesters();
    fetchSchoolYears();
  }, []);

  const formatYearRange = (year) => {
    const start = parseInt(year.year_description);
    return `${start}-${start + 1}`;
  };

  const [openDialog, setOpenDialog] = useState(false);
  const handleSubmitOrUpdate = async (e) => {
    if (e) e.preventDefault();
    if (!selectedYear || !selectedSemester) {
      setSnackbar({ open: true, message: "Please select both Year and Semester", severity: "warning" });
      return;
    }

    // If editing
    if (editID) {
      try {
        await axios.put(`${API_BASE_URL}/school_years/${editID}`, {
          year_id: selectedYear,
          semester_id: selectedSemester,
        });
        setSnackbar({ open: true, message: "School year updated successfully!", severity: "success" });
        setEditID(null);
        setSelectedYear("");
        setSelectedSemester("");
        fetchSchoolYears();
      } catch {
        setSnackbar({ open: true, message: "Failed to update school year", severity: "error" });
      }
      return;
    }

    // Check duplicate
    const duplicate = schoolYears.find(
      (sy) => sy.year_id === selectedYear && sy.semester_id === selectedSemester
    );
    if (duplicate) {
      setSnackbar({ open: true, message: "This school year already exists", severity: "error" });
      return;
    }

    // Create new
    try {
      await axios.post(`${API_BASE_URL}/school_years`, {
        year_id: selectedYear,
        semester_id: selectedSemester,
        activator: 0,
      });
      setSelectedYear("");
      setSelectedSemester("");
      fetchSchoolYears();
      setSnackbar({ open: true, message: "School year added successfully!", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to save school year", severity: "error" });
    }
  };

  const handleEdit = (sy) => {
    setSelectedYear(sy.year_id);
    setSelectedSemester(sy.semester_id);
    setEditID(sy.school_year_id); // assuming backend returns school_year_id
  };

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [schoolYearToDelete, setSchoolYearToDelete] = useState(null);

  const handleConfirmDelete = async () => {
    if (!schoolYearToDelete) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/school_years/${schoolYearToDelete.school_year_id}`
      );
      setSnackbar({
        open: true,
        message: "School year deleted successfully!",
        severity: "success",
      });
      fetchSchoolYears();
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to delete school year",
        severity: "error",
      });
    } finally {
      setOpenDeleteDialog(false);
      setSchoolYearToDelete(null);
    }
  };


  // 🔍 Filtered list for search
  const filteredSchoolYears = schoolYears.filter(sy =>
    String(sy.year_description).includes(searchQuery) ||
    sy.semester_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const totalPages = Math.ceil(filteredSchoolYears.length / rowsPerPage);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const paginatedSchoolYears = filteredSchoolYears.slice(startIndex, endIndex);

  if (loading || hasAccess === null) return <LoadingOverlay open={loading} message="Loading..." />;
  if (!hasAccess) return <Unauthorized />;

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", padding: 2, mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: titleColor, fontSize: '36px' }}>
          SCHOOL YEAR PANEL
        </Typography>

        {/* Search Bar */}
        <TextField
          variant="outlined"
          placeholder="Search School Year..."
          size="small"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
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

      <TableContainer component={Paper} sx={{ width: '100%', }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
            <TableRow>
              <TableCell colSpan={10} sx={{ border: `1px solid ${borderColor}`, py: 0.5, backgroundColor: settings?.header_color || "#1976d2", color: "white" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography fontSize="14px" fontWeight="bold">
                    Total School Years: {filteredSchoolYears.length}
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
                      onClick={() => {
                        setEditID(null); // reset edit
                        setSelectedYear("");
                        setSelectedSemester("");
                        setOpenDialog(true);
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
                      + Add School Year
                    </Button>
                  </Box>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>


      <Box sx={{ maxHeight: 750, overflowY: "auto" }}>
        <table className="w-full text-sm" style={{ borderCollapse: "collapse", border: `1px solid ${borderColor}` }}>
          <thead>
            <tr style={{ backgroundColor: "#F5f5f5", color: "#000" }}>
              <th className="p-2 text-center" style={{ border: `1px solid ${borderColor}` }}>ID</th>
              <th className="p-2 text-center" style={{ border: `1px solid ${borderColor}` }}>Year Level</th>
              <th className="p-2 text-center" style={{ border: `1px solid ${borderColor}` }}>Semester</th>
              <th className="p-2 text-center" style={{ border: `1px solid ${borderColor}` }}>Status</th>
              <th className="p-2 text-center" style={{ border: `1px solid ${borderColor}` }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchoolYears.length > 0 ? paginatedSchoolYears.map((sy, index) => (
              <tr key={index} style={{ backgroundColor: sy.astatus === 1 ? "#d4edda" : "transparent", color: sy.astatus === 1 ? "#155724" : "inherit" }}>
                <td className="p-2 text-center" style={{ border: `1px solid ${borderColor}` }}>{startIndex + index + 1}</td>
                <td className="p-2 text-center" style={{ border: `1px solid ${borderColor}` }}>{`${sy.year_description}-${parseInt(sy.year_description) + 1}`}</td>
                <td className="p-2 text-center" style={{ border: `1px solid ${borderColor}` }}>{sy.semester_description}</td>
                <td className="p-2 text-center" style={{ border: `1px solid ${borderColor}` }}>{sy.astatus === 1 ? "Active" : "Inactive"}</td>
                <td className="p-2 text-center" style={{ border: `1px solid ${borderColor}` }}>
                  <Button size="small"
                    sx={{ backgroundColor: "green", color: "white", mr: 1, }}
                    onClick={() => {
                      handleEdit(sy);
                      setOpenDialog(true); // 👉 open dialog when editing
                    }}

                  >Edit</Button>
                  <Button size="small" sx={{ backgroundColor: "#B22222", color: "white", "&:hover": { backgroundColor: "#8B0000" } }} onClick={() => {
                    setSchoolYearToDelete(sy);
                    setOpenDeleteDialog(true);
                  }}
                  >Delete</Button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="4" style={{ padding: 15, color: "#777" }}>No school years found.</td></tr>
            )}
          </tbody>
        </table>
      </Box>

      <TableContainer component={Paper} sx={{ width: '100%', }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
            <TableRow>
              <TableCell colSpan={10} sx={{ border: `1px solid ${borderColor}`, py: 0.5, backgroundColor: settings?.header_color || "#1976d2", color: "white" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography fontSize="14px" fontWeight="bold" color="white">
                    Total School Years: {filteredSchoolYears.length}
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

      <br />
      <br />



      {/* Table */}




      <Dialog
        open={openDeleteDialog}
        onClose={() => {
          setOpenDeleteDialog(false);
          setSchoolYearToDelete(null);
        }}
      >
        <DialogTitle>Confirm Delete School Year</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete the school year{" "}
            <b>
              {schoolYearToDelete
                ? `${schoolYearToDelete.year_description}-${parseInt(
                  schoolYearToDelete.year_description
                ) + 1}`
                : ""}
            </b>{" "}
            ({schoolYearToDelete?.semester_description})?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            color="error"


            onClick={() => {
              setOpenDeleteDialog(false);
              setSchoolYearToDelete(null);
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirmDelete}
          >
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>


      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setEditID(null);
        }}
        maxWidth="xs"
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
            fontSize: "1.1rem",
            py: 2
          }}
        >
          {editID ? "Edit School Year" : "Add School Year"}
        </DialogTitle>

        {/* ===== CONTENT ===== */}
        <DialogContent sx={{ p: 3 }}>
          <Box display="flex" flexDirection="column" gap={3}>

            {/* YEAR */}
            <Box>
              <Typography fontWeight="bold" mb={1} mt={2}>
                School Year
              </Typography>

              <FormControl fullWidth size="small">
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: "8px"
                  }}
                >
                  <MenuItem value="">
                    -- Select School Year --
                  </MenuItem>

                  {years.map((year) => (
                    <MenuItem
                      key={year.year_id}
                      value={year.year_id}
                    >
                      {formatYearRange(year)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* SEMESTER */}
            <Box>
              <Typography fontWeight="bold" mb={1}>
                Semester
              </Typography>

              <FormControl fullWidth size="small">
                <Select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: "8px"
                  }}
                >
                  <MenuItem value="">
                    -- Select Semester --
                  </MenuItem>

                  {semesters.map((semester) => (
                    <MenuItem
                      key={semester.semester_id}
                      value={semester.semester_id}
                    >
                      {semester.semester_description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

          </Box>
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
              setOpenDialog(false);
              setEditID(null);
            }}
            color="error"
            variant="outlined"
            sx={{
              textTransform: "none",
              fontWeight: 600
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={(e) => {
              handleSubmitOrUpdate(e);
              setOpenDialog(false);
            }}
            sx={{
              px: 4,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            {editID ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default SchoolYearPanel;
