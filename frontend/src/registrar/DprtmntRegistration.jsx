import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from 'axios';
import {
  Container,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
  Snackbar,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Select,
  MenuItem,
  TableContainer,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";


const DepartmentRegistration = () => {

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

  }, [settings]);


  const [department, setDepartment] = useState({ dep_name: '', dep_code: '' });
  const [departmentList, setDepartmentList] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const pageId = 21;

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

  useEffect(() => {
    fetchDepartment();
  }, []);

  const fetchDepartment = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get_department`);
      setDepartmentList(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const handleAddingDepartment = async () => {
    if (!department.dep_name || !department.dep_code) {
      setSnack({
        open: true,
        message: "Please fill all fields",
        severity: "warning",
      });
      return;
    }

    try {
      if (editMode) {
        await axios.put(
          `${API_BASE_URL}/department/${selectedId}`,
          department
        );

        setSnack({
          open: true,
          message: "Department updated successfully!",
          severity: "success",
        });
      } else {
        await axios.post(`${API_BASE_URL}/department`, department);

        setSnack({
          open: true,
          message: "Department added successfully!",
          severity: "success",
        });
      }

      fetchDepartment();
      setDepartment({ dep_name: "", dep_code: "" });
      setEditMode(false);
      setSelectedId(null);
      setOpenModal(false);

    } catch (err) {
      setSnack({
        open: true,
        message: err.response?.data?.message || "Operation failed",
        severity: "error",
      });
    }
  };

  const handleEdit = (dept) => {
    setDepartment({
      dep_name: dept.dprtmnt_name,
      dep_code: dept.dprtmnt_code,
    });
    setSelectedId(dept.dprtmnt_id);
    setEditMode(true);
    setOpenModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department?"))
      return;

    try {
      await axios.delete(`${API_BASE_URL}/department/${id}`);

      setSnack({
        open: true,
        message: "Department deleted successfully!",
        severity: "success",
      });

      fetchDepartment();
    } catch (err) {
      setSnack({
        open: true,
        message: "Failed to delete department",
        severity: "error",
      });
    }
  };



  const handleChangesForEverything = (e) => {
    const { name, value } = e.target;
    setDepartment(prev => ({
      ...prev,
      [name]: value
    }));
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',

          mb: 2,

        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            color: titleColor,
            fontSize: '36px',
          }}
        >
          DEPARTMENT REGISTRATION
        </Typography>




      </Box>
      <hr style={{ border: "1px solid #ccc", width: "100%" }} />

      <br />


      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>


          <Typography
            variant="body1"
            sx={{ color: subtitleColor }}
          >
            Create and manage academic departments
          </Typography>
        </Box>

        <Button
          variant="contained"
          sx={{

            textTransform: "none",
            fontWeight: 600,
            px: 3,
            borderRadius: 2,
            "&:hover": { opacity: 0.9 },
          }}
          onClick={() => {
            setEditMode(false);
            setDepartment({ dep_name: "", dep_code: "" });
            setOpenModal(true);
          }}
        >
          + Add Department
        </Button>
      </Box>
      <br />
      <TableContainer component={Paper} sx={{ width: '100%', border: `2px solid ${borderColor}`, }}>
        <Table>
          <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
            <TableRow>
              <TableCell sx={{ color: 'white', textAlign: "Center" }}>Department Management</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
      <br />
      <br />

      <Grid container spacing={2}>
        {departmentList.map((department) => (
          <Grid item xs={12} sm={6} md={3} key={department.dprtmnt_id}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${borderColor}`,
                borderRadius: 3,
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: 4,
                  transform: "translateY(-4px)",
                },
                height: "100%",
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {department.dprtmnt_name}
                  </Typography>

                  <Typography variant="subtitle" sx={{ color: subtitleColor }}>
                    Code: {department.dprtmnt_code}
                  </Typography>
                </Box>

                <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                  <Button
                    variant="contained"
                    size="small"
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

                    onClick={() => handleEdit(department)}
                  >
                    <EditIcon fontSize="small" /> Edit
                  </Button>

                  <Button
                    variant="contained"
                    size="small"
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
                    onClick={() =>
                      handleDelete(department.dprtmnt_id)
                    }
                  >
                    <DeleteIcon fontSize="small" /> Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>


      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editMode ? "Edit Department" : "Add New Department"}

          <IconButton onClick={() => setOpenModal(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Department Name"
              name="dep_name"
              value={department.dep_name}
              onChange={handleChangesForEverything}
              fullWidth
            />
            <TextField
              label="Department Code"
              name="dep_code"
              value={department.dep_code}
              onChange={handleChangesForEverything}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#primary", color: "white", }}
            onClick={handleAddingDepartment}
          >
            Save
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#B22222", color: "white", }}
            onClick={() => setOpenModal(false)}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack({ ...snack, open: false })}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DepartmentRegistration;
