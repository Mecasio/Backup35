import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  Button,
  Select,
  MenuItem,
  Typography,
  Paper,
  Grid,
  Snackbar,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Alert
} from "@mui/material";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";


const DepartmentRoom = () => {
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

  // 🧠 Snackbar State
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // 🎓 Data States
  const [room, setRoom] = useState({ room_id: "", dprtmnt_id: "" });
  const [assignedRoomIds, setAssignedRoomIds] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [roomList, setRoomList] = useState([]);
  const [assignedRooms, setAssignedRooms] = useState({});

  // 🔐 Access Control
  const [userID, setUserID] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const pageId = 22;

  useEffect(() => {
    if (!settings) return;
    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.border_color) setBorderColor(settings.border_color);
    if (settings.main_button_color) setMainButtonColor(settings.main_button_color);
  }, [settings]);

  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");
    const storedEmployeeID = localStorage.getItem("employee_id");

    if (storedUser && storedRole && storedID) {
      setUserRole(storedRole);
      setUserID(storedID);
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
      setHasAccess(response.data?.page_privilege === 1);
    } catch (error) {
      console.error("Error checking access:", error);
      setHasAccess(false);
    }
  };

  const fetchDepartment = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get_department`);
      setDepartmentList(response.data);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const fetchRoomList = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/room_list`);
      setRoomList(response.data);
    } catch (err) {
      console.log("Error fetching room list:", err);
    }
  };

  const fetchRoomAssignments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/assignments`);
      const assignments = response.data;

      const groupedAssignments = assignments.reduce((acc, assignment) => {
        const deptId = assignment.dprtmnt_id;
        if (!acc[deptId]) acc[deptId] = [];
        acc[deptId].push({
          room_id: assignment.dprtmnt_room_id,
          room_description: assignment.room_description,
        });
        return acc;
      }, {});

      const assignedIds = assignments.map((a) => a.room_id || a.dprtmnt_room_id);
      setAssignedRoomIds(assignedIds);
      setAssignedRooms(groupedAssignments);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
  };

  useEffect(() => {
    fetchDepartment();
    fetchRoomList();
    fetchRoomAssignments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRoom((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAssignRoom = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/assign`, room);
      fetchRoomAssignments();
      setRoom({ room_id: "", dprtmnt_id: "" });

      setSnackbar({
        open: true,
        message: "Room assigned successfully!",
        severity: "success",
      });
    } catch (err) {
      console.log("Error assigning room:", err);
      setSnackbar({
        open: true,
        message: "Failed to assign room. Please try again.",
        severity: "error",
      });
    }
  };


  const [openUnassignDialog, setOpenUnassignDialog] = useState(false);
  const [roomToUnassign, setRoomToUnassign] = useState(null);


  const handleUnassignRoom = async (dprtmnt_room_id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/unassign/${dprtmnt_room_id}`);
      fetchRoomAssignments();

      setSnackbar({
        open: true,
        message: "Room unassigned successfully!",
        severity: "info",
      });
    } catch (err) {
      console.log("Error unassigning room:", err);
      setSnackbar({
        open: true,
        message: "Failed to unassign room.",
        severity: "error",
      });
    }
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
        sx={{ fontWeight: "bold", color: titleColor, fontSize: "36px", mb: 2 }}
      >
        DEPARTMENT ROOM
      </Typography>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />

      <TableContainer component={Paper} sx={{ width: '100%', border: `1px solid ${borderColor}`, }}>
        <Table>
          <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2", }}>
            <TableRow>
              <TableCell sx={{ color: 'white', textAlign: "Center" }}>Department Room</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          border: `1px solid ${borderColor}`,

        }}
      >
        <Box display="flex" gap={2} alignItems="flex-start" mb={4}>


          <Box width="50%">
            <Typography variant="body1" fontWeight="bold">
              Select Department:
            </Typography>
            <Select
              name="dprtmnt_id"
              value={room.dprtmnt_id}
              onChange={handleChange}
              displayEmpty
              fullWidth
            >
              <MenuItem value="">Select Department</MenuItem>
              {departmentList.map((dept) => (
                <MenuItem key={dept.dprtmnt_id} value={dept.dprtmnt_id}>
                  {dept.dprtmnt_name}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box width="50%">
            <Typography variant="body1" fontWeight="bold">
              Select Room:
            </Typography>
            <Select
              name="room_id"
              value={room.room_id}
              onChange={handleChange}
              displayEmpty
              fullWidth
            >
              <MenuItem value="">Select Available Room</MenuItem>
              {roomList
                .filter((room) => !assignedRoomIds.includes(room.room_id))
                .map((room) => (
                  <MenuItem key={room.room_id} value={room.room_id}>
                    {room.room_description}
                  </MenuItem>
                ))}
            </Select>
          </Box>

          <Button
            variant="contained"
            style={{ backgroundColor: "#primary", color: "#fff", width: "200px" }}
            onClick={handleAssignRoom}
            disabled={!room.room_id || !room.dprtmnt_id}
            sx={{ height: 56, alignSelf: "flex-end" }}
          >
            Save
          </Button>
        </Box>
      </Paper>


      <br />
      <br />

      <Typography variant="h6" gutterBottom>
        Department Room Assignments
      </Typography>

      <Grid container spacing={1}>
        {departmentList.map((dept) => (
          <Grid item xs={12} md={4} key={dept.dprtmnt_id}>
            <Paper elevation={2} style={{ padding: "10px", border: `1px solid ${borderColor}` }}>
              <Typography variant="subtitle2" style={{ fontSize: "14px", marginBottom: "8px" }}>
                {dept.dprtmnt_name}
              </Typography>

              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {assignedRooms[dept.dprtmnt_id]?.length > 0 ? (
                  assignedRooms[dept.dprtmnt_id].map((room) => (
                    <Box
                      key={room.room_id}
                      sx={{
                        backgroundColor: mainButtonColor,
                        color: "white",
                        borderRadius: "4px",
                        padding: "6px 8px",
                        fontSize: "12px",
                        position: "relative",
                      }}
                    >
                      Room {room.room_description}
                      <Button
                        onClick={() => {
                          setRoomToUnassign({
                            id: room.room_id || room.dprtmnt_room_id,
                            description: room.room_description,
                          });
                          setOpenUnassignDialog(true);
                        }}
                        size="small"
                        sx={{
                          position: "absolute",
                          top: "-6px",
                          right: "-6px",
                          minWidth: "22px",
                          height: "22px",
                          padding: "0",
                          color: "white",
                          backgroundColor: "rgba(0,0,0,0.4)",
                          borderRadius: "50%",
                          fontSize: "14px",
                          "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
                        }}
                      >
                        ×
                      </Button>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" style={{ fontSize: "12px" }}>
                    No rooms assigned.
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={openUnassignDialog}
        onClose={() => setOpenUnassignDialog(false)}
      >
        <DialogTitle>Confirm Unassign Room</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to unassign{" "}
            <b>Room {roomToUnassign?.description}</b> from this department?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            color="error"


            onClick={() => setOpenUnassignDialog(false)}>
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={() => {
              handleUnassignRoom(roomToUnassign.id);
              setOpenUnassignDialog(false);
              setRoomToUnassign(null);
            }}
          >
            Yes, Unassign
          </Button>
        </DialogActions>
      </Dialog>


      {/* ✅ Snackbar Notification */}
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

export default DepartmentRoom;
