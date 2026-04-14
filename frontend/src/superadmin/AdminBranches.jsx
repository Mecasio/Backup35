import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import API_BASE_URL from "../apiConfig";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  TextField,
  Button,
  Grid,
  Snackbar,
  Alert,
  Stack,
  Divider,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem
} from "@mui/material";

import BusinessIcon from "@mui/icons-material/Business";
import SaveIcon from "@mui/icons-material/Save";
import EventIcon from "@mui/icons-material/Event";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";

const AdminBranches = () => {
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
    if (settings.campus_address) setCampusAddress(settings.campus_address);

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



  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const pageId = 138;

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

  const [openBranchDialog, setOpenBranchDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");

  const [newBranch, setNewBranch] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  useEffect(() => {
    fetchBranches();
  }, []);


  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/branches`);

      const safeData = res.data.map((b) => ({
        ...b,
        academicPrograms: b.academicPrograms || [
          { id: 0, name: "Undergraduate" },
          { id: 1, name: "Graduate" },
          { id: 2, name: "Techvoc" },
        ],
      }));

      setBranches(safeData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (index, field, value) => {
    setIsEditing(true);
    const updated = [...branches];
    updated[index][field] = value;
    setBranches(updated);
  };

  const handleUpdate = async (branch) => {
    try {
      await axios.put(`${API_BASE_URL}/api/branches/${branch.id}`, branch);
      setIsEditing(false);
      setSnack({ open: true, message: "Saved successfully", severity: "success" });
      fetchBranches();
    } catch {
      setSnack({ open: true, message: "Update failed", severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/branches/${id}`);
      setSnack({ open: true, message: "Deleted", severity: "success" });
      fetchBranches();
    } catch {
      setSnack({ open: true, message: "Delete failed", severity: "error" });
    }
  };

  const handleAddBranch = async () => {
    if (!newBranch || !newAddress) return;

    try {
      await axios.post(`${API_BASE_URL}/api/branches`, {
        branch: newBranch,
        address: newAddress
      });

      setSnack({ open: true, message: "Branch added", severity: "success" });
      setNewBranch("");
      setNewAddress("");
      fetchBranches();
    } catch {
      setSnack({ open: true, message: "Add failed", severity: "error" });
    }
  };

  const formatLocal = (date) => {
    if (!date) return "";
    return date.slice(0, 16); // ✅ NO conversion
  };

  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }


  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: "bold",
          color: titleColor,
          fontSize: "36px",
          background: "white",
          display: "flex",
          alignItems: "center",
          mb: 2,
        }}
      >
        BRANCH MANAGEMENT / REGISTRATION FOR APPLICANTS
      </Typography>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />
      <br />




      {/* ADD FORM */}

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        sx={{
          mb: 3,
          borderRadius: 2,
          fontWeight: 600
        }}
        onClick={() => {
          setEditingBranch(null);
          setBranchName("");
          setBranchAddress("");
          setOpenBranchDialog(true);
        }}
      >
        Add New Branch
      </Button>



      {/* LIST */}
      <Grid container spacing={3}>
        {branches.map((b, index) => (
          <Grid item xs={12} md={6} key={b.id}>
            <Card
              sx={{
                border: `1px solid ${borderColor}`,
                boxShadow: 4,
                borderRadius: 3,
                overflow: "hidden"
              }}
            >
              {/* HEADER */}
              <Box
                sx={{
                  background: settings?.header_color || "#1976d2",
                  color: "#fff",
                  px: 2,
                  py: 2
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography
                    fontWeight={700}
                    variant="subtitle1"
                    sx={{ color: "#fff" }}
                  >
                    {b.branch} Branch #{b.id}
                  </Typography>

                  <Chip
                    label={b.registration_open ? "Open" : "Closed"}
                    size="small"
                    sx={{
                      backgroundColor: b.registration_open ? "green" : "red",
                      color: "white",
                      fontWeight: "bold",
                      border: "1px solid rgba(255,255,255,0.2)"
                    }}
                  />
                </Stack>
              </Box>

              <CardContent>
                <Stack spacing={2}>
                  <Typography fontWeight={600}>
                    Branch Name / Branch Address
                  </Typography>

                  {/* INPUTS */}
                  <TextField
                    label="Branch Name"
                    value={b.branch}
                    onChange={(e) =>
                      handleChange(index, "branch", e.target.value)
                    }
                    fullWidth
                  />

                  <TextField
                    label="Address"
                    value={b.address}
                    onChange={(e) =>
                      handleChange(index, "address", e.target.value)
                    }
                    fullWidth
                  />

                  {/* ACADEMIC PROGRAMS */}
                  <Divider />

                  <Typography fontWeight={600}>
                    Academic Programs
                  </Typography>

                  {(b.academicPrograms || []).map((prog, progIndex) => (
                    <Stack
                      key={prog.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography>{prog.name}</Typography>

                      <Switch
                        checked={prog.open === 1}
                        onChange={(e) => {
                          const updated = [...branches];
                          updated[index].academicPrograms[progIndex].open =
                            e.target.checked ? 1 : 0;

                          setBranches(updated);
                          setIsEditing(true);
                        }}
                      />
                    </Stack>
                  ))}

                  <Divider />

                  <Typography fontWeight={600}>
                    Open and Closing Registration
                  </Typography>

                  {/* TOGGLE */}
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography>Registration</Typography>
                    <Switch
                      checked={b.registration_open === 1}
                      onChange={(e) =>
                        handleChange(
                          index,
                          "registration_open",
                          e.target.checked ? 1 : 0
                        )
                      }
                    />
                  </Stack>

                  {/* DATES */}
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                  >
                    <TextField
                      type="datetime-local"
                      label="Start Date"
                      InputLabelProps={{ shrink: true }}
                      value={formatLocal(b.start_date)}
                      onChange={(e) =>
                        handleChange(index, "start_date", e.target.value)
                      }
                      fullWidth
                    />

                    <TextField
                      type="datetime-local"
                      label="End Date"
                      InputLabelProps={{ shrink: true }}
                      value={formatLocal(b.end_date)}
                      onChange={(e) =>
                        handleChange(index, "end_date", e.target.value)
                      }
                      fullWidth
                    />
                  </Stack>

                  {/* ACTIONS */}
                  <Stack direction="row" spacing={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<SaveIcon />}
                      sx={{ borderRadius: 2 }}
                      onClick={() => handleUpdate(b)}
                    >
                      Save
                    </Button>

                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: "#9E0000",
                        color: "white"
                      }}
                      onClick={() => handleDelete(b.id)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* SNACK */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snack.severity} sx={{ borderRadius: 2 }}>
          {snack.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={openBranchDialog}
        onClose={() => setOpenBranchDialog(false)}
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
          {editingBranch ? "Edit Branch Information" : "New Branch Registration"}
        </DialogTitle>

        {/* CONTENT */}
        <DialogContent sx={{ p: 3 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ mb: 1, mt: 1 }}
          >
            Branch Details
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Branch Name"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>


              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ mb: 1, mt: 1 }}
              >
                Branch Address
              </Typography>

              <TextField
                fullWidth
                label="Address"
                value={branchAddress}
                onChange={(e) => setBranchAddress(e.target.value)}
              />
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
            onClick={() => setOpenBranchDialog(false)}
            variant="contained"
            color="error"


          >
            Cancel
          </Button>

          <Button
            variant="contained"
            sx={{
              px: 4,
              fontWeight: 600
            }}
            onClick={async () => {
              if (!branchName || !branchAddress) return;

              try {
                if (editingBranch) {
                  await axios.put(
                    `${API_BASE_URL}/api/branches/${editingBranch.id}`,
                    {
                      branch: branchName,
                      address: branchAddress
                    }
                  );

                  setSnack({
                    open: true,
                    message: "Branch updated successfully",
                    severity: "success"
                  });
                } else {
                  await axios.post(`${API_BASE_URL}/api/branches`, {
                    branch: branchName,
                    address: branchAddress
                  });

                  setSnack({
                    open: true,
                    message: "Branch added successfully",
                    severity: "success"
                  });
                }

                fetchBranches();
                setOpenBranchDialog(false);
              } catch {
                setSnack({
                  open: true,
                  message: "Operation failed",
                  severity: "error"
                });
              }
            }}
          >
            {editingBranch ? "Update Branch" : "Save Branch"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminBranches;