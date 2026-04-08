import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box, Typography, Button, TextField, Snackbar, Alert, TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Paper
} from "@mui/material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";

import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const YearLevelPanel = () => {
  const settings = useContext(SettingsContext);

  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");

  const [userID, setUserID] = useState("");
  const [userRole, setUserRole] = useState("");
  const [employeeID, setEmployeeID] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const pageId = 63;

  const [yearLevelDescription, setYearLevelDescription] = useState("");
  const [yearLevelList, setYearLevelList] = useState([]);
  const [levelType, setLevelType] = useState("year");

  // 🌟 Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`);
      setHasAccess(response.data?.page_privilege === 1);
    } catch (err) {
      console.error("Error checking access:", err);
      setHasAccess(false);
      setSnackbar({ open: true, message: "Failed to check access", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchYearLevelList = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_year_level`);
      setYearLevelList(res.data);
    } catch (err) {
      console.error("Failed to fetch year levels:", err);
      setSnackbar({ open: true, message: "Failed to fetch year levels", severity: "error" });
    }
  };

  useEffect(() => {
    fetchYearLevelList();
  }, []);

  const [openYearLevelDialog, setOpenYearLevelDialog] = useState(false);

  const handleAddYearLevel = async () => {
    if (!yearLevelDescription.trim()) {
      setSnackbar({ open: true, message: "Year level description is required", severity: "warning" });
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/years_level`, {
        year_level_description: yearLevelDescription,
        level_type: levelType,
      });
      setYearLevelDescription("");
      fetchYearLevelList();
      setSnackbar({ open: true, message: "Year level added successfully!", severity: "success" });
    } catch (err) {
      console.error("Error adding year level:", err);
      setSnackbar({ open: true, message: "Failed to add year level", severity: "error" });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const handleEdit = (level) => {
    setEditMode(true);
    setSelectedId(level.year_level_id);
    setYearLevelDescription(level.year_level_description);
    setLevelType(level.level_type);
    setOpenYearLevelDialog(true);
  };

  const handleSave = async () => {
    if (!yearLevelDescription.trim()) {
      setSnackbar({ open: true, message: "Required field", severity: "warning" });
      return;
    }

    try {
      if (editMode) {
        // UPDATE
        await axios.put(`${API_BASE_URL}/years_level/${selectedId}`, {
          year_level_description: yearLevelDescription,
          level_type: levelType,
        });

        setSnackbar({ open: true, message: "Updated successfully!", severity: "success" });
      } else {
        // ADD
        await axios.post(`${API_BASE_URL}/years_level`, {
          year_level_description: yearLevelDescription,
          level_type: levelType,
        });

        setSnackbar({ open: true, message: "Added successfully!", severity: "success" });
      }

      resetForm();
      fetchYearLevelList();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Operation failed", severity: "error" });
    }
  };

  const resetForm = () => {
    setYearLevelDescription("");
    setLevelType("year");
    setEditMode(false);
    setSelectedId(null);
    setOpenYearLevelDialog(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;

    try {
      await axios.delete(`${API_BASE_URL}/years_level/${id}`);
      fetchYearLevelList();
      setSnackbar({ open: true, message: "Deleted successfully!", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Delete failed", severity: "error" });
    }
  };

  if (loading || hasAccess === null) return <LoadingOverlay open={loading} message="Loading..." />;
  if (!hasAccess) return <Unauthorized />;

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: titleColor, fontSize: '36px' }}>
          ACADEMIC LEVEL PANEL
        </Typography>
      </Box>
      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />
      <br />

      <TableContainer component={Paper} sx={{ width: '100%', border: `1px solid ${borderColor}`, }}>
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
                    setEditMode(false);
                    setSelectedId(null);
                    setYearLevelDescription("");
                    setLevelType("year");
                    setOpenYearLevelDialog(true);
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
                  + Add Year Level
                </Button>
              </Box>


            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>


      <Box sx={{ overflowY: "auto",}}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#F5F5F5", color: "#000", border: `1px solid ${borderColor}` }}>
              <th style={styles.tableCell}>Year Level ID</th>
              <th style={styles.tableCell}>Year Level Description</th>
              <th style={styles.tableCell}>Type</th>
              <th style={styles.tableCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {yearLevelList.map((level, index) => (
              <tr key={index}>
                <td style={styles.tableCell}>{level.year_level_id}</td>
                <td style={styles.tableCell}>{level.year_level_description}</td>
                <td style={styles.tableCell}>{level.level_type}</td>
                <td style={styles.tableCell}>
                  <Box   sx={{
                
                        textAlign: "center",
                    
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "10px", // space between buttons
                      }}
                      >
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleEdit(level)}
                    sx={{
                      backgroundColor: "green",
                      color: "white",
                      borderRadius: "5px",
                      padding: "8px 14px",
                      width: "100px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                    }}
                  >
                    <EditIcon fontSize="small" /> Edit
                  </Button>

                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleDelete(level.year_level_id)}
                    sx={{
                      backgroundColor: "#9E0000",
                      color: "white",
                      borderRadius: "5px",
                      padding: "8px 14px",
                      width: "100px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                    }}
                  >
                    <DeleteIcon fontSize="small" /> Delete
                  </Button>
                  </Box>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>



      <Dialog
        open={openYearLevelDialog}
        onClose={() => setOpenYearLevelDialog(false)}
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
          {editMode ? "Edit Year Level" : "Add Year Level"}
        </DialogTitle>

        {/* ===== CONTENT ===== */}
        <DialogContent sx={{ p: 3 }}>



          <Typography fontWeight="bold" mb={1} mt={2}>
            Year Level Description
          </Typography>

          <TextField
            fullWidth
            placeholder="Enter year level (e.g., 1st Year)"
            value={yearLevelDescription}
            onChange={(e) => setYearLevelDescription(e.target.value)}
          />

          <Typography fontWeight="bold" mt={2}>
            Level Type
          </Typography>

          <TextField
            select
            fullWidth
            value={levelType}
            onChange={(e) => setLevelType(e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="year">Year Level</option>
            <option value="special">Special Program</option>
            <option value="graduate">Graduate Level</option>
          </TextField>
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
            onClick={() => setOpenYearLevelDialog(false)}
            color="error"
            variant="outlined"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            sx={{
              px: 4,
              fontWeight: 600,
              textTransform: "none"
            }}
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const styles = {
  tableCell: {
    border: "1px solid #000000",
    padding: "10px",
    textAlign: "center",
  },
};

export default YearLevelPanel;
