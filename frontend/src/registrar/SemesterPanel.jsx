import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Alert,
  TableContainer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";
const SemesterPanel = () => {
  const settings = useContext(SettingsContext);
  const [headerColor, setHeaderColor] = useState("#1976d2");
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

  useEffect(() => {
    if (!settings) return;

    // 🎨 Colors
    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
    if (settings.border_color) setBorderColor(settings.border_color);
    if (settings?.header_color) setHeaderColor(settings.header_color);
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

  }, [settings]);


  const [userID, setUserID] = useState("");
  const [userRole, setUserRole] = useState("");
  const [employeeID, setEmployeeID] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const pageId = 58;

  const [semesterDescription, setSemesterDescription] = useState("");
  const [semesters, setSemesters] = useState([]);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });


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

  const fetchSemesters = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_semester`);
      setSemesters(res.data);
    } catch (err) {
      console.error("Error fetching semesters:", err);
      setSnackbar({ open: true, message: "Failed to fetch semesters", severity: "error" });
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);
  const [openDialog, setOpenDialog] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!semesterDescription.trim()) {
      setSnackbar({ open: true, message: "Semester description is required", severity: "warning" });
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/semesters`, {
        semester_description: semesterDescription,
      });
      setSemesterDescription("");
      fetchSemesters();
      setSnackbar({ open: true, message: "Semester added successfully!", severity: "success" });
    } catch (err) {
      console.error("Error saving semester:", err);
      setSnackbar({ open: true, message: "Failed to add semester", severity: "error" });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };



  if (loading || hasAccess === null) return <LoadingOverlay open={loading} message="Loading..." />;
  if (!hasAccess) return <Unauthorized />;

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: titleColor, fontSize: '36px' }}>
          SEMESTER PANEL
        </Typography>
      </Box>
      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
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
                  onClick={() => setOpenDialog(true)}
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
                  + Add Schedule
                </Button>
              </Box>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>


      {/* Display Section */}
      <Grid item xs={12} md={7}>


        <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      border: `1px solid ${borderColor}`,
                      color: "black",
                      backgroundColor: "#f5f5f5",
                    }}
                  >
                    Semester ID
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      border: `1px solid ${borderColor}`,
                      color: "black",
                      backgroundColor: "#f5f5f5",
                    }}
                  >
                    Description
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {semesters.map((semester, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>{semester.semester_id}</TableCell>
                    <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>{semester.semester_description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

      </Grid>


      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
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
          Add Semester
        </DialogTitle>

        {/* CONTENT */}
        <DialogContent sx={{ p: 3 }}>
          <Typography fontWeight="bold" mb={1} mt={1}>
            Semester Description
          </Typography>

          <TextField
            fullWidth
            placeholder="Enter semester (e.g., First Semester)"
            value={semesterDescription}
            onChange={(e) => setSemesterDescription(e.target.value)}
            autoFocus
          />
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
            onClick={() => setOpenDialog(false)}
            variant="contained"
            color="error"


            sx={{
              textTransform: "none",
              fontWeight: 600
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"

            sx={{
              px: 4,
              fontWeight: 600,
              textTransform: "none",

            }}
            onClick={async () => {
              await handleSubmit({
                preventDefault: () => { }
              });

              setOpenDialog(false);
            }}
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

export default SemesterPanel;
