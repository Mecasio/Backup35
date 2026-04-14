import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Switch,
  Grid,
  FormControlLabel
} from "@mui/material";
import EaristLogo from "../assets/EaristLogo.png";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";

const TOSF = () => {
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

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const pageId = 99;

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

  const [tosfData, setTosfData] = useState([]);


  const [formData, setFormData] = useState({
    athletic_fee: "",
    cultural_fee: "",
    developmental_fee: "",
    guidance_fee: "",
    library_fee: "",
    medical_and_dental_fee: "",
    registration_fee: "",
    school_id_fees: "",   // ✅ ADD THIS
    nstp_fees: "",
    computer_fees: "",
    laboratory_fees: "",
  });




  const [editingId, setEditingId] = useState(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [tosfUpdateDialogOpen, setTosfUpdateDialogOpen] = useState(false);
  const [scholarshipUpdateDialogOpen, setScholarshipUpdateDialogOpen] = useState(false);
  const [scholarshipDeleteDialogOpen, setScholarshipDeleteDialogOpen] = useState(false);
  const [selectedScholarshipId, setSelectedScholarshipId] = useState(null);
  const [scholarshipTypes, setScholarshipTypes] = useState([]);
  const [scholarshipForm, setScholarshipForm] = useState({
    scholarship_name: "",
    rfd: "50",
    tfd: "50",
    mfd: "50",
    nfd: "50",
    afd: "0",
    scholarship_status: 1,
  });
  const [editingScholarshipId, setEditingScholarshipId] = useState(null);

  // Fetch all TOSF data
  const fetchTosf = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/tosf`);
      setTosfData(res.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      showSnackbar("Error fetching data", "error");
    }
  };

  const yearLevelMap = {
    1: "First Year",
    2: "Second Year",
    3: "Third Year",
    4: "Fourth Year",
    5: "Fifth Year",
  };

  const semesterMap = {
    1: "First Semester",
    2: "Second Semester",
    3: "Summer",
  };

  useEffect(() => {
    fetchTosf();
  }, []);

  const fetchScholarshipTypes = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/scholarship_types`);
      setScholarshipTypes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching scholarship types:", error);
      showSnackbar("Error fetching scholarship types", "error");
    }
  };

  useEffect(() => {
    fetchScholarshipTypes();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Show snackbar
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle submit for create or update
  const saveTosf = async () => {
    try {
      if (editingId) {
        await axios.put(`${API_BASE_URL}/update_tosf/${editingId}`, formData);
        showSnackbar("Data successfully updated!");
      } else {
        await axios.post(`${API_BASE_URL}/insert_tosf`, formData);
        showSnackbar("Data successfully inserted!");
      }
      setFormData({
        athletic_fee: "",
        cultural_fee: "",
        developmental_fee: "",
        guidance_fee: "",
        library_fee: "",
        medical_and_dental_fee: "",
        registration_fee: "",
        school_id_fees: "",   // ✅ ADD
        nstp_fees: "",
        computer_fees: "",
        laboratory_fees: "",
      });

      setEditingId(null);
      fetchTosf();
    } catch (error) {
      console.error("Error submitting data:", error);
      showSnackbar("Error while saving data", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      setTosfUpdateDialogOpen(true);
      return;
    }
    await saveTosf();
  };



  // Handle edit
  const handleEdit = (item) => {
    setFormData(item);
    setEditingId(item.tosf_id);
  };

  // Open delete dialog
  const handleDeleteDialog = (tosf_id) => {
    setSelectedId(tosf_id);
    setDialogOpen(true);
  };

  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/departments`);
        setDepartments(res.data); // [{ dprtmnt_id, dprtmnt_name }]
      } catch (err) {
        console.error("Failed to fetch departments:", err);
      }
    };

    const fetchPrograms = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/programs`);
        setPrograms(res.data);
      } catch (err) {
        console.error("Failed to fetch programs:", err);
      }
    };


    fetchDepartments();
    fetchPrograms();
  }, []);


  // Confirm delete
  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/delete_tosf/${selectedId}`);
      showSnackbar("Data successfully deleted!");
      fetchTosf();
    } catch (error) {
      console.error("Error deleting data:", error);
      showSnackbar("Error while deleting data", "error");
    } finally {
      setDialogOpen(false);
      setSelectedId(null);
    }
  };


  // Add these new states near your existing states for TOSF
  const [feeRules, setFeeRules] = useState([]);
  const [feeForm, setFeeForm] = useState({
    fee_code: "",
    description: "",
    amount: "",
    applies_to_all: 0,
    semester_id: "",
    year_level_id: "",
    dprtmnt_id: "",
    program_id: ""
  });

  const [editingFeeId, setEditingFeeId] = useState(null);

  // Fetch all fee rules
  const fetchFeeRules = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/fee_rules`);
      setFeeRules(res.data);
    } catch (err) {
      console.error("Error fetching fee rules:", err);
      showSnackbar("Failed to fetch fee rules", "error");
    }
  };

  useEffect(() => {
    fetchFeeRules();
  }, []);

  const [miscFee, setMiscFee] = useState(null);


  const fetchMiscFee = async (year_level_id, semester_id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/misc_fee`, {
        params: {
          year_level_id,
          semester_id
        }
      });
      setMiscFee(res.data);
    } catch (err) {
      console.error("Failed to fetch misc fee", err);
      setMiscFee(null);
    }
  };



  // Handle input changes for fee form
  const handleFeeChange = (e) => {
    setFeeForm({ ...feeForm, [e.target.name]: e.target.value });
  };

  // Handle fee form submit (create or update)
  const handleFeeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFeeId) {
        await axios.put(`${API_BASE_URL}/update_fee_rule/${editingFeeId}`, feeForm);
        showSnackbar("Fee rule updated!");
      } else {
        await axios.post(`${API_BASE_URL}/insert_fee_rule`, feeForm);
        showSnackbar("Fee rule added!");
      }
      setFeeForm({
        fee_code: "",
        description: "",
        amount: "",
        applies_to_all: 0,
        semester_id: "",
        year_level_id: "",
        dprtmnt_id: "",
        program_id: ""
      });

      setEditingFeeId(null);
      fetchFeeRules();
    } catch (err) {
      console.error("Error submitting fee rule:", err);
      showSnackbar("Error saving fee rule", "error");
    }
  };

  // Handle edit fee rule
  const handleEditFee = (item) => {
    setFeeForm(item);
    setEditingFeeId(item.fee_rule_id);

  };


  // Handle delete fee rule
  const handleDeleteFee = async (fee_code) => {
    try {
      await axios.delete(`${API_BASE_URL}/delete_fee_rule/${fee_code}`);
      showSnackbar("Fee rule deleted!");
      fetchFeeRules();
    } catch (err) {
      console.error("Error deleting fee rule:", err);
      showSnackbar("Error deleting fee rule", "error");
    }
  };


  // Cancel delete
  const handleDeleteCancel = () => {
    setDialogOpen(false);
    setSelectedId(null);
  };

  const scholarshipPercentFields = ["rfd", "tfd", "mfd", "nfd"];

  const sanitizeDigitsOnly = (value) => value.replace(/\D/g, "");

  const sanitizePercent = (value) => {
    const digits = sanitizeDigitsOnly(value);
    if (digits === "") return "";
    const n = Number(digits);
    if (Number.isNaN(n)) return "";
    return String(Math.max(0, Math.min(100, n)));
  };

  const blockNonNumericKeyDown = (e) => {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];

    if (allowedKeys.includes(e.key)) return;
    if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  const blockNonNumericPaste = (e) => {
    const pasted = e.clipboardData?.getData("text") ?? "";
    if (!/^\d+$/.test(pasted)) {
      e.preventDefault();
    }
  };

  const handleScholarshipChange = (e) => {
    const { name, value } = e.target;

    if (name === "scholarship_status") {
      setScholarshipForm((prev) => ({
        ...prev,
        scholarship_status: Number(value),
      }));
      return;
    }

    if (scholarshipPercentFields.includes(name)) {
      setScholarshipForm((prev) => ({
        ...prev,
        [name]: sanitizePercent(value),
      }));
      return;
    }

    if (name === "afd") {
      const afdValue = sanitizeDigitsOnly(value);
      setScholarshipForm((prev) => ({
        ...prev,
        afd: afdValue,
        ...(Number(afdValue || 0) > 0
          ? { rfd: "", tfd: "", mfd: "", nfd: "" }
          : {}),
      }));
      return;
    }

    setScholarshipForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetScholarshipForm = () => {
    setScholarshipForm({
      scholarship_name: "",
      scholarship_status: 1,
      rfd: "50",
      tfd: "50",
      mfd: "50",
      nfd: "50",
      afd: "0",
    });
    setEditingScholarshipId(null);
  };

  const saveScholarshipType = async () => {
    try {
      if (editingScholarshipId) {
        await axios.put(
          `${API_BASE_URL}/update_scholarship_type/${editingScholarshipId}`,
          scholarshipForm
        );
        showSnackbar("Scholarship type updated successfully!");
      } else {
        await axios.post(`${API_BASE_URL}/insert_scholarship_type`, scholarshipForm);
        showSnackbar("Scholarship type added successfully!");
      }

      resetScholarshipForm();
      fetchScholarshipTypes();
    } catch (error) {
      console.error("Error saving scholarship type:", error);
      showSnackbar("Error saving scholarship type", "error");
    }
  };

  const handleScholarshipSubmit = async (e) => {
    e.preventDefault();
    if (editingScholarshipId) {
      setScholarshipUpdateDialogOpen(true);
      return;
    }
    await saveScholarshipType();
  };

  const handleScholarshipEdit = (item) => {
    setScholarshipForm({
      scholarship_name: item.scholarship_name || "",
      scholarship_status: Number(item.scholarship_status ?? 1),
      rfd: item.rfd?.toString() ?? "50",
      tfd: item.tfd?.toString() ?? "50",
      mfd: item.mfd?.toString() ?? "50",
      nfd: item.nfd?.toString() ?? "50",
      afd: item.afd?.toString() ?? "0",
    });
    setEditingScholarshipId(item.id);
  };

  const handleScholarshipDelete = (id) => {
    setSelectedScholarshipId(id);
    setScholarshipDeleteDialogOpen(true);
  };

  const executeScholarshipDelete = async () => {
    if (!selectedScholarshipId) return;
    try {
      await axios.delete(`${API_BASE_URL}/delete_scholarship_type/${selectedScholarshipId}`);
      showSnackbar("Scholarship type deleted successfully!");
      fetchScholarshipTypes();
    } catch (error) {
      console.error("Error deleting scholarship type:", error);
      showSnackbar("Error deleting scholarship type", "error");
    } finally {
      setScholarshipDeleteDialogOpen(false);
      setSelectedScholarshipId(null);
    }
  };

  // ✅ Access Guards
  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Checking Access..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }


  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <Typography
          variant="h4"
          sx={{

            fontWeight: "bold",
            color: titleColor,
            fontSize: "36px",
          }}
        >
          TUITION FEE MANAGEMENT
        </Typography>
      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />


      {/* TITLE */}
      <TableContainer component={Paper} sx={{ width: "100%", border: `1px solid ${borderColor}` }}>
        <Table>
          <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2" }}>
            <TableRow>
              <TableCell sx={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
                TOSF MANAGEMENT
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>

      {/* FORM CONTAINER */}
      <Paper sx={{ padding: 2, mb: 3, border: `1px solid ${borderColor}` }}>
        <form onSubmit={handleSubmit}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 2,
            }}
          >
            {Object.keys(formData).map((key) => (
              <Box key={key} sx={{ display: "flex", flexDirection: "column" }}>
                <Typography sx={{ fontWeight: "500", mb: 0.5 }}>
                  {key.replace(/_/g, " ").toUpperCase()}
                </Typography>
                <TextField
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  variant="outlined"
                  size="small"
                  required
                />
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Button
              type="submit"
              variant="contained"
              color={editingId ? "warning" : "primary"}
            >
              {editingId ? "Update Record" : "Add Record"}
            </Button>

            {editingId && (
              <Button
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    athletic_fee: "",
                    cultural_fee: "",
                    developmental_fee: "",
                    guidance_fee: "",
                    library_fee: "",
                    medical_and_dental_fee: "",
                    registration_fee: "",
                    school_id_fees: "",   // ✅ ADD
                    nstp_fees: "",
                    computer_fees: "",
                    laboratory_fees: "",
                  });

                }}
                variant="contained"
                color="error"


                sx={{ ml: 2 }}
              >
                Cancel
              </Button>
            )}
          </Box>
        </form>
      </Paper>

      {/* TABLE SECTION */}
      <TableContainer component={Paper} sx={{ border: `1px solid ${borderColor}` }}>
        <Table>
          <TableHead
            style={{
              border: `1px solid ${borderColor}`,
              backgroundColor: settings?.header_color || "#1976d2",
            }}
          >
            <TableRow>
              <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                ID
              </TableCell>
              <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                Athletic Fee
              </TableCell>
              <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                Cultural Fee
              </TableCell>
              <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                Developmental Fee
              </TableCell>
              <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                Guidance Fee
              </TableCell>
              <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                Library Fee
              </TableCell>
              <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                Medical & Dental
              </TableCell>
              <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                Registration Fee
              </TableCell>

              <TableCell
                style={{
                  border: `1px solid ${borderColor}`,
                  color: "white",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                School ID Fee
              </TableCell>



              <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                NSTP Fee
              </TableCell>
              <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                Computer Fee
              </TableCell>
              <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                Laboratory Fee
              </TableCell>
              <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                Actions
              </TableCell>

            </TableRow>

          </TableHead>

          <TableBody>
            {tosfData.map((item, index) => (
              <TableRow key={item.tosf_id}>
                <TableCell style={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                  {index + 1}
                </TableCell>

                <TableCell style={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                  {item.athletic_fee}
                </TableCell>

                <TableCell style={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                  {item.cultural_fee}
                </TableCell>

                <TableCell style={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                  {item.developmental_fee}
                </TableCell>

                <TableCell style={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                  {item.guidance_fee}
                </TableCell>

                <TableCell style={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                  {item.library_fee}
                </TableCell>

                <TableCell style={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                  {item.medical_and_dental_fee}
                </TableCell>

                <TableCell style={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                  {item.registration_fee}
                </TableCell>

                <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                  {item.school_id_fees}
                </TableCell>


                <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                  {item.nstp_fees}
                </TableCell>

                <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                  {item.computer_fees}
                </TableCell>

                <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                  {item.laboratory_fees}
                </TableCell>


                {/* ACTIONS SIDE BY SIDE */}
                <TableCell
                  style={{
                    border: `1px solid ${borderColor}`,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Button
                    onClick={() => handleEdit(item)}
                    size="small"
                    sx={{
                      backgroundColor: "green",
                      color: "white",
                      borderRadius: "5px",
                      marginRight: "6px",
                      width: "85px",
                      height: "35px",
                    }}
                  >
                    Edit
                  </Button>

                  <Button
                    onClick={() => handleDeleteDialog(item.tosf_id)}
                    size="small"
                    sx={{
                      backgroundColor: "#9E0000",
                      color: "white",
                      borderRadius: "5px",
                      width: "85px",
                      height: "35px",
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 4 }}>
        <TableContainer component={Paper} sx={{ width: "100%", border: `1px solid ${borderColor}` }}>
          <Table>
            <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2" }}>
              <TableRow>
                <TableCell sx={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
                  SCHOLARSHIP TYPE MANAGEMENT
                </TableCell>
              </TableRow>
            </TableHead>
          </Table>
        </TableContainer>

        <Paper sx={{ padding: 2, mb: 3, border: `1px solid ${borderColor}` }}>
          <form onSubmit={handleScholarshipSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography sx={{ fontWeight: "500", mb: 0.5 }}>
                  SCHOLARSHIP NAME
                </Typography>
                <TextField
                  name="scholarship_name"
                  value={scholarshipForm.scholarship_name}
                  onChange={handleScholarshipChange}
                  variant="outlined"
                  size="small"
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography sx={{ fontWeight: "500", mb: 0.5 }}>
                  STATUS
                </Typography>
                <TextField
                  select
                  SelectProps={{ native: true }}
                  name="scholarship_status"
                  value={scholarshipForm.scholarship_status}
                  onChange={handleScholarshipChange}
                  variant="outlined"
                  size="small"
                  fullWidth
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </TextField>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Button
                type="submit"
                variant="contained"
                color={editingScholarshipId ? "warning" : "primary"}
              >
                {editingScholarshipId ? "Update Scholarship Type" : "Add Scholarship Type"}
              </Button>

              {editingScholarshipId && (
                <Button
                  onClick={resetScholarshipForm}
                  variant="contained"
                  color="error"


                  sx={{ ml: 2 }}
                >
                  Cancel
                </Button>
              )}
            </Box>
          </form>
        </Paper>

        <TableContainer component={Paper} sx={{ border: `1px solid ${borderColor}` }}>
          <Table>
            <TableHead
              style={{
                border: `1px solid ${borderColor}`,
                backgroundColor: settings?.header_color || "#1976d2",
              }}
            >
              <TableRow>
                <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                  ID
                </TableCell>
                <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                  Scholarship Name
                </TableCell>
                <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                  Status
                </TableCell>
                <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                  RFD (%)
                </TableCell>
                <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                  TFD (%)
                </TableCell>
                <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                  MFD (%)
                </TableCell>
                <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                  NFD (%)
                </TableCell>
                <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                  AFD
                </TableCell>
                <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                  Created At
                </TableCell>
                <TableCell style={{ border: `1px solid ${borderColor}`, color: "white", textAlign: "center", fontWeight: "bold" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scholarshipTypes.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}
                  >
                    No scholarship types found.
                  </TableCell>
                </TableRow>
              )}

              {scholarshipTypes.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                    {index + 1}
                  </TableCell>
                  <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                    {item.scholarship_name}
                  </TableCell>
                  <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                    {Number(item.scholarship_status) === 1 ? "Active" : "Inactive"}
                  </TableCell>
                  <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                    <TextField
                      name="rfd"
                      value={editingScholarshipId === item.id ? scholarshipForm.rfd : (item.rfd?.toString() ?? "50")}
                      onChange={editingScholarshipId === item.id ? handleScholarshipChange : undefined}
                      onKeyDown={editingScholarshipId === item.id ? blockNonNumericKeyDown : undefined}
                      onPaste={editingScholarshipId === item.id ? blockNonNumericPaste : undefined}
                      size="small"
                      fullWidth
                      disabled={
                        editingScholarshipId !== item.id ||
                        Number(scholarshipForm.afd || 0) > 0
                      }
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                    />
                  </TableCell>
                  <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                    <TextField
                      name="tfd"
                      value={editingScholarshipId === item.id ? scholarshipForm.tfd : (item.tfd?.toString() ?? "50")}
                      onChange={editingScholarshipId === item.id ? handleScholarshipChange : undefined}
                      onKeyDown={editingScholarshipId === item.id ? blockNonNumericKeyDown : undefined}
                      onPaste={editingScholarshipId === item.id ? blockNonNumericPaste : undefined}
                      size="small"
                      fullWidth
                      disabled={
                        editingScholarshipId !== item.id ||
                        Number(scholarshipForm.afd || 0) > 0
                      }
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                    />
                  </TableCell>
                  <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                    <TextField
                      name="mfd"
                      value={editingScholarshipId === item.id ? scholarshipForm.mfd : (item.mfd?.toString() ?? "50")}
                      onChange={editingScholarshipId === item.id ? handleScholarshipChange : undefined}
                      onKeyDown={editingScholarshipId === item.id ? blockNonNumericKeyDown : undefined}
                      onPaste={editingScholarshipId === item.id ? blockNonNumericPaste : undefined}
                      size="small"
                      fullWidth
                      disabled={
                        editingScholarshipId !== item.id ||
                        Number(scholarshipForm.afd || 0) > 0
                      }
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                    />
                  </TableCell>
                  <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                    <TextField
                      name="nfd"
                      value={editingScholarshipId === item.id ? scholarshipForm.nfd : (item.nfd?.toString() ?? "50")}
                      onChange={editingScholarshipId === item.id ? handleScholarshipChange : undefined}
                      onKeyDown={editingScholarshipId === item.id ? blockNonNumericKeyDown : undefined}
                      onPaste={editingScholarshipId === item.id ? blockNonNumericPaste : undefined}
                      size="small"
                      fullWidth
                      disabled={
                        editingScholarshipId !== item.id ||
                        Number(scholarshipForm.afd || 0) > 0
                      }
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                    />
                  </TableCell>
                  <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                    <TextField
                      name="afd"
                      value={editingScholarshipId === item.id ? scholarshipForm.afd : (item.afd?.toString() ?? "0")}
                      onChange={editingScholarshipId === item.id ? handleScholarshipChange : undefined}
                      onKeyDown={editingScholarshipId === item.id ? blockNonNumericKeyDown : undefined}
                      onPaste={editingScholarshipId === item.id ? blockNonNumericPaste : undefined}
                      size="small"
                      fullWidth
                      disabled={editingScholarshipId !== item.id}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                    />
                  </TableCell>
                  <TableCell sx={{ border: `1px solid ${borderColor}`, textAlign: "center" }}>
                    {item.created_at
                      ? new Date(Number(item.created_at) * 1000).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      border: `1px solid ${borderColor}`,
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Button
                      onClick={() => handleScholarshipEdit(item)}
                      size="small"
                      sx={{
                        backgroundColor: "green",
                        color: "white",
                        borderRadius: "5px",
                        marginRight: "6px",
                        width: "85px",
                        height: "35px",
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleScholarshipDelete(item.id)}
                      size="small"
                      sx={{
                        backgroundColor: "#9E0000",
                        color: "white",
                        borderRadius: "5px",
                        width: "85px",
                        height: "35px",
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ mt: 5 }}>
        {/* <Box
          sx={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            flexWrap: "wrap",
            mb: 2,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: titleColor,
              fontSize: "36px",
            }}
          >
            EXTRA FEE
          </Typography>
        </Box> */}

        <hr style={{ border: "1px solid #ccc", width: "100%" }} />
        <br />


        {/* 
        <Paper sx={{ p: 3, mb: 4, border: `1px solid ${borderColor}` }}>
          <form onSubmit={handleFeeSubmit}>
            <Grid container spacing={3}>

      
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Fee Code"
                  name="fee_code"
                  value={feeForm.fee_code}
                  onChange={handleFeeChange}
                  required
                  size="small"
                  disabled={!!editingFeeId}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={feeForm.description}
                  onChange={handleFeeChange}
                  required
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Amount"
                  name="amount"
                  type="number"
                  value={feeForm.amount}
                  onChange={handleFeeChange}
                  size="small"
             
                />
              </Grid>

           
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Year Level (Optional)"
                  name="year_level_id"
                  type="number"
                  value={feeForm.year_level_id}
                  onChange={handleFeeChange}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Semester (Optional)"
                  name="semester_id"
                  type="number"
                  value={feeForm.semester_id}
                  onChange={handleFeeChange}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Department (Optional)"
                  name="dprtmnt_id"
                  value={feeForm.dprtmnt_id || ""}
                  onChange={handleFeeChange}
                  SelectProps={{ native: true }}
                  size="small"
                >
                  <option value=""></option>
                  {departments.map((dept) => (
                    <option key={dept.dprtmnt_id} value={dept.dprtmnt_id}>
                      {dept.dprtmnt_name}
                    </option>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Program (Optional)"
                  name="program_id"
                  value={feeForm.program_id || ""}
                  onChange={handleFeeChange}
                  SelectProps={{ native: true }}
                  size="small"
                >
                  <option value=""></option>
                  {programs.map((prog) => (
                    <option key={prog.program_id} value={prog.program_id}>
                      ({prog.program_code}) - {prog.program_description} {prog.major ? `(${prog.major})` : ""}
                    </option>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={feeForm.applies_to_all === 1}
                      onChange={(e) =>
                        setFeeForm(prev => ({
                          ...prev,
                          applies_to_all: e.target.checked ? 1 : 0,
                          semester_id: "",
                          year_level_id: "",
                          dprtmnt_id: "",
                          program_id: ""
                        }))
                      }
                      color="primary"
                    />
                  }
                  label="Applies to ALL students"
                />
                <Typography variant="caption" color="textSecondary" sx={{ display: "block", ml: 5 }}>
                  When enabled, this fee applies to all students regardless of program or semester.
                </Typography>
              </Grid>

              <Grid item xs={12} sx={{ textAlign: "right" }}>
                <Button type="submit" variant="contained" color={editingFeeId ? "warning" : "primary"} sx={{ mr: 2 }}>
                  {editingFeeId ? "Update Fee" : "Add Fee"}
                </Button>
                {editingFeeId && (
                  <Button
                    onClick={() => {
                      setEditingFeeId(null);
                      setFeeForm({ fee_code: "", description: "", amount: "" });
                    }}
                    variant="outlined"
                    color="secondary"
                  >
                    Cancel
                  </Button>
                )}
              </Grid>

            </Grid>
          </form>
        </Paper> */}


        {/* Fee Rules Table */}
        {/* Fee Rules Table */}
        {/* <TableContainer component={Paper} sx={{ border: `1px solid ${borderColor}` }}>
          <Table>
            <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2" }}>
              <TableRow>
                {["ID", "Fee Code", "Description", "Amount", "Year Level", "Semester", "Department", "Program", "Actions"].map((header) => (
                  <TableCell
                    key={header}
                    sx={{ color: "white", fontWeight: "bold", textAlign: "center", border: `1px solid ${borderColor}` }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {feeRules.map((fee, index) => (
                <TableRow key={fee.fee_code}>
                  <TableCell sx={{ textAlign: "center", border: `1px solid ${borderColor}` }}>
                    {index + 1}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center", border: `1px solid ${borderColor}` }}>{fee.fee_code}</TableCell>
                  <TableCell sx={{ textAlign: "center", border: `1px solid ${borderColor}` }}>{fee.description}</TableCell>
                  <TableCell sx={{ textAlign: "center", border: `1px solid ${borderColor}` }}>{fee.amount}</TableCell>

                  <TableCell sx={{ textAlign: "center", border: `1px solid ${borderColor}` }}>
                    {fee.year_level_id ? yearLevelMap[fee.year_level_id] : "ALL"}
                  </TableCell>

                  <TableCell sx={{ textAlign: "center", border: `1px solid ${borderColor}` }}>
                    {fee.semester_id ? semesterMap[fee.semester_id] : "ALL"}
                  </TableCell>


                  <TableCell sx={{ textAlign: "center", border: `1px solid ${borderColor}` }}>
                    {fee.dprtmnt_id
                      ? departments.find((d) => d.dprtmnt_id === fee.dprtmnt_id)?.dprtmnt_name || "NONE"
                      : "NONE"}
                  </TableCell>

                  <TableCell sx={{ textAlign: "center", border: `1px solid ${borderColor}` }}>
                    {(() => {
                      const prog = programs.find(p => p.program_id === fee.program_id);
                      if (!prog) return "NONE";
                      return `${prog.program_description}${prog.major ? " — " + prog.major : ""}`;
                    })()}
                  </TableCell>


                  <TableCell sx={{ textAlign: "center", border: `1px solid ${borderColor}` }}>
                    <Button
                      onClick={() => handleEditFee(fee)}
                      size="small"
                      sx={{
                        backgroundColor: "green",
                        color: "white",
                        borderRadius: "5px",
                        marginRight: "6px",
                        width: "85px",
                        height: "35px",
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteFee(fee.fee_code)}
                      size="small"
                      sx={{
                        backgroundColor: "#9E0000",
                        color: "white",
                        borderRadius: "5px",
                        width: "85px",
                        height: "35px",
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer> */}

      </Box>

      {miscFee && (
        <Paper sx={{ mt: 3, p: 2, border: `1px solid ${borderColor}` }}>
          <Typography sx={{ fontWeight: "bold", mb: 1 }}>
            Miscellaneous Fee
          </Typography>

          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>{miscFee.description}</TableCell>
                <TableCell align="right">
                  {Number(miscFee.amount).toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      )}



      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this record? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}
            variant="contained"
            color="error"

          >
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={tosfUpdateDialogOpen}
        onClose={() => setTosfUpdateDialogOpen(false)}
      >
        <DialogTitle>Confirm Update</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to save the updated TOSF record?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTosfUpdateDialogOpen(false)}
            variant="contained"
            color="error"


          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setTosfUpdateDialogOpen(false);
              await saveTosf();
            }}
            variant="contained"
            color="warning"
          >
            Yes, Update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={scholarshipUpdateDialogOpen}
        onClose={() => setScholarshipUpdateDialogOpen(false)}
      >
        <DialogTitle>Confirm Update</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to save the updated scholarship type?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScholarshipUpdateDialogOpen(false)}
            variant="contained"
            color="error"


          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setScholarshipUpdateDialogOpen(false);
              await saveScholarshipType();
            }}
            variant="contained"
            color="warning"
          >
            Yes, Update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={scholarshipDeleteDialogOpen}
        onClose={() => {
          setScholarshipDeleteDialogOpen(false);
          setSelectedScholarshipId(null);
        }}
      >
        <DialogTitle>Delete Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this scholarship type? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setScholarshipDeleteDialogOpen(false);
              setSelectedScholarshipId(null);
            }}
            variant="contained"
            color="error"


          >
            Cancel
          </Button>
          <Button onClick={executeScholarshipDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TOSF;
