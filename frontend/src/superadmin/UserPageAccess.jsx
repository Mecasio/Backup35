import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  FormControl,
  Select,
  Card,
  TableCell,
  TextField,
  MenuItem,
  InputLabel,
  Checkbox,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControlLabel,
  Snackbar,
  Alert,
  DialogActions,
  Switch,
} from "@mui/material";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";
import SearchIcon from "@mui/icons-material/Search";

const UserPageAccess = () => {
  const settings = useContext(SettingsContext);

  // UI Colors
  const [titleColor, setTitleColor] = useState("#000000");
  const [borderColor, setBorderColor] = useState("#000000");

  // Access control
  const pageId = 91;
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // User list
  const [allUsers, setAllUsers] = useState([]);

  // Selected user access data
  const [selectedUser, setSelectedUser] = useState(null);
  const [pages, setPages] = useState([]);
  const [pageAccess, setPageAccess] = useState({});
  const [userRole, setUserRole] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [accessDescription, setAccessDescription] = useState("");
  const [createPageAccess, setCreatePageAccess] = useState({});
  const [createPages, setCreatePages] = useState([]);
  const [accessLevels, setAccessLevels] = useState([]);
  const [openEditAccessModal, setOpenEditAccessModal] = useState(false);
  const [editAccessId, setEditAccessId] = useState("");
  const [editAccessDescription, setEditAccessDescription] = useState("");
  const [editPageAccess, setEditPageAccess] = useState({});
  const [editPages, setEditPages] = useState([]);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success", // success | error | warning | info
  });

  const handleCloseSnack = (event, reason) => {
    if (reason === "clickaway") return;
    setSnack((prev) => ({ ...prev, open: false }));
  };

  // Load settings
  useEffect(() => {
    if (!settings) return;
    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.border_color) setBorderColor(settings.border_color);
  }, [settings]);

  // Check page privilege
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedEmployeeID = localStorage.getItem("employee_id");

    if (storedRole !== "registrar") {
      window.location.href = "/login";
      return;
    }

    checkAccess(storedEmployeeID);
    loadAllUsers();
  }, []);

  const checkAccess = async (empID) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/page_access/${empID}/${pageId}`,
      );
      setHasAccess(res.data && res.data.page_privilege === 1);
    } catch {
      setHasAccess(false);
    }
  };

  // Load all users
  const loadAllUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/registrars`);
      setAllUsers(res.data);
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  // Load selected user's access
  const loadUserAccess = async (user) => {
    setLoading(true);
    setSelectedUser(null);
    setPageAccess({});
    setPages([]);
    setUserRole("");

    try {
      const pagesResp = await axios.get(`${API_BASE_URL}/api/pages`);
      const accessResp = await axios.get(
        `${API_BASE_URL}/api/page_access/${user.employee_id}`,
      );

      const allPages = pagesResp.data || [];
      const accessRows = accessResp.data || [];
      const accessMap = buildDefaultPermissionState(allPages);

      accessRows.forEach((row) => {
        const currentPageId = Number(row.page_id);
        accessMap[currentPageId] = {
          access: Number(row.page_privilege) === 1,
          can_create: Number(row.can_create) === 1,
          can_edit: Number(row.can_edit) === 1,
          can_delete: Number(row.can_delete) === 1,
        };
      });

      setPages(allPages);
      setSelectedUser(user); // ✅ full user object
      setPageAccess(accessMap);

      setOpenModal(true);
    } catch {
      setSnack({ open: true, type: "error", message: "Failed to load access" });
    } finally {
      setLoading(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20); // change if you want

  const [searchQuery, setSearchQuery] = useState("");

  const buildDefaultPermissionState = (pagesList) => {
    const defaults = {};
    pagesList.forEach((page) => {
      defaults[page.id] = {
        access: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
      };
    });
    return defaults;
  };

  const filteredUsers = allUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    const fullName =
      `${u.first_name} ${u.middle_name || ""} ${u.last_name}`.toLowerCase();

    return (
      u.employee_id.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      fullName.includes(q)
    );
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Update access privilege
  const handleToggleChange = async (pageId, hasAccessNow) => {
    if (!selectedUser) return;

    const newState = !hasAccessNow;
    const previousState = pageAccess[pageId] || {
      access: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
    };

    // Optimistic update
    setPageAccess((prev) => ({
      ...prev,
      [pageId]: {
        ...previousState,
        access: newState,
        can_create: newState ? true : false,
        can_edit: newState ? true : false,
        can_delete: newState ? true : false,
      },
    }));

    try {
      if (newState) {
        await axios.post(
          `${API_BASE_URL}/api/page_access/${selectedUser.employee_id}/${pageId}`,
        );
      } else {
        await axios.delete(
          `${API_BASE_URL}/api/page_access/${selectedUser.employee_id}/${pageId}`,
        );
      }

      setSnack({
        open: true,
        type: "success",
        message: newState ? "Access granted" : "Access revoked",
      });
    } catch {
      // rollback
      setPageAccess((prev) => ({ ...prev, [pageId]: previousState }));
      setSnack({
        open: true,
        type: "error",
        message: "Failed to update access",
      });
    }
  };

  const handlePermissionToggle = async (pageId, permissionKey) => {
    if (!selectedUser) return;

    const currentState = pageAccess[pageId] || {
      access: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
    };

    const nextState = {
      ...currentState,
      access: true,
      [permissionKey]: !currentState[permissionKey],
    };

    setPageAccess((prev) => ({
      ...prev,
      [pageId]: nextState,
    }));

    try {
      await axios.put(
        `${API_BASE_URL}/api/page_access/${selectedUser.employee_id}/${pageId}`,
        {
          page_privilege: nextState.access ? 1 : 0,
          can_create: nextState.can_create ? 1 : 0,
          can_edit: nextState.can_edit ? 1 : 0,
          can_delete: nextState.can_delete ? 1 : 0,
        },
      );

      setSnack({
        open: true,
        severity: "success",
        message: "Page permissions updated",
      });
    } catch (err) {
      console.error(err);
      setPageAccess((prev) => ({
        ...prev,
        [pageId]: currentState,
      }));
      setSnack({
        open: true,
        severity: "error",
        message: "Failed to update page permissions",
      });
    }
  };

  const openCreateAccessModal = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/pages`);

      const pagesData = res.data || [];

      const defaultAccess = {};
      pagesData.forEach((p) => {
        defaultAccess[p.id] = false;
      });

      setCreatePages(pagesData);
      setCreatePageAccess(defaultAccess);
      setAccessDescription("");
      setOpenCreateModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const normalizeAccessPage = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((v) => Number(v));
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map((v) => Number(v));
      } catch {
        return value
          .split(",")
          .map((v) => Number(v.trim()))
          .filter((v) => !Number.isNaN(v));
      }
    }
    return [];
  };

  const openEditAccessLevelModal = async () => {
    try {
      const [accessRes, pagesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/access_table`),
        axios.get(`${API_BASE_URL}/api/pages`),
      ]);

      const levels = accessRes.data || [];
      const pagesData = pagesRes.data || [];

      const defaultAccess = {};
      pagesData.forEach((p) => {
        defaultAccess[p.id] = false;
      });

      setAccessLevels(levels);
      setEditPages(pagesData);
      setEditPageAccess(defaultAccess);
      setEditAccessId("");
      setEditAccessDescription("");
      setOpenEditAccessModal(true);
    } catch (err) {
      console.error(err);
      setSnack({
        open: true,
        severity: "error",
        message: "Failed to load access levels",
      });
    }
  };

  const handleCreateToggle = (pageId) => {
    setCreatePageAccess((prev) => ({
      ...prev,
      [pageId]: !prev[pageId],
    }));
  };

  const handleCreateAssignAll = () => {
    const allAccess = {};
    createPages.forEach((p) => {
      allAccess[p.id] = true;
    });
    setCreatePageAccess(allAccess);
  };

  const handleSelectAccessLevel = (accessId) => {
    setEditAccessId(accessId);
    const selected = accessLevels.find(
      (level) => Number(level.access_id) === Number(accessId),
    );
    const selectedPages = normalizeAccessPage(selected?.access_page);

    const nextAccess = {};
    editPages.forEach((p) => {
      nextAccess[p.id] = selectedPages.includes(Number(p.id));
    });

    setEditAccessDescription(selected?.access_description || "");
    setEditPageAccess(nextAccess);
  };

  const handleEditToggle = (pageId) => {
    setEditPageAccess((prev) => ({
      ...prev,
      [pageId]: !prev[pageId],
    }));
  };

  const handleEditSelectAll = () => {
    const allAccess = {};
    editPages.forEach((p) => {
      allAccess[p.id] = true;
    });
    setEditPageAccess(allAccess);
  };

  const handleEditClearAll = () => {
    const allAccess = {};
    editPages.forEach((p) => {
      allAccess[p.id] = false;
    });
    setEditPageAccess(allAccess);
  };

  const saveEditedAccess = async () => {
    if (!editAccessId) {
      setSnack({
        open: true,
        severity: "warning",
        message: "Please select an access level",
      });
      return;
    }

    if (!editAccessDescription.trim()) {
      setSnack({
        open: true,
        severity: "warning",
        message: "Description is required",
      });
      return;
    }

    try {
      const selectedPages = Object.keys(editPageAccess)
        .filter((key) => editPageAccess[key])
        .map((id) => Number(id));

      await axios.put(`${API_BASE_URL}/api/access/${editAccessId}`, {
        access_description: editAccessDescription,
        access_page: selectedPages,
      });

      setAccessLevels((prev) =>
        prev.map((level) =>
          Number(level.access_id) === Number(editAccessId)
            ? {
              ...level,
              access_description: editAccessDescription,
              access_page: selectedPages,
            }
            : level,
        ),
      );

      setSnack({
        open: true,
        severity: "success",
        message: "Access level updated successfully",
      });

      setOpenEditAccessModal(false);
    } catch (err) {
      console.error(err);
      setSnack({
        open: true,
        severity: "error",
        message: "Failed to update access level",
      });
    }
  };

  const saveAccess = async () => {
    try {
      const selectedPages = Object.keys(createPageAccess)
        .filter((key) => createPageAccess[key])
        .map((id) => Number(id));

      if (!accessDescription.trim()) {
        setSnack({
          open: true,
          severity: "warning",
          message: "Description is required",
        });
        return;
      }

      await axios.post(`${API_BASE_URL}/api/access`, {
        access_description: accessDescription,
        access_page: selectedPages,
      });

      setSnack({
        open: true,
        severity: "success",
        message: "Access created successfully",
      });

      setOpenCreateModal(false);
    } catch (err) {
      setSnack({
        open: true,
        severity: "error",
        message: "Failed to create access",
      });
    }
  };

  const grantAllAccess = async () => {
    if (!selectedUser) return;

    try {

      await axios.post(
        `${API_BASE_URL}/api/page_access/grant-all`,
        {
          userId: selectedUser.employee_id,
        }
      );


      const newAccess = {};
      pages.forEach((p) => {
        newAccess[p.id] = {
          access: true,
          can_create: true,
          can_edit: true,
          can_delete: true,
        };
      });

      setPageAccess(newAccess);

      setSnack({
        open: true,
        severity: "success",
        message: "All access granted",
      });

    } catch (err) {
      console.error(err);
    }
  };


  const revokeAllAccess = async () => {
    if (!selectedUser) return;

    try {

      await axios.post(
        `${API_BASE_URL}/api/page_access/revoke-all`,
        {
          userId: selectedUser.employee_id,
        }
      );

      const newAccess = {};
      pages.forEach((p) => {
        newAccess[p.id] = {
          access: false,
          can_create: false,
          can_edit: false,
          can_delete: false,
        };
      });

      setPageAccess(newAccess);

      setSnack({
        open: true,
        severity: "success",
        message: "All access removed",
      });

    } catch (err) {
      console.error(err);
    }
  };

  const handleUserStatusToggle = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 1 ? 0 : 1;

    // Optimistic update
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u)),
    );

    try {
      await axios.put(`${API_BASE_URL}/update_student_status/${userId}`, {
        status: nextStatus,
      });

      setSnack({
        open: true,
        severity: "success",
        message: `User status updated to ${nextStatus === 1 ? "Active" : "Inactive"}`,
      });
    } catch (err) {
      console.error(err);
      // Rollback on failure
      setAllUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: currentStatus } : u)),
      );
      setSnack({
        open: true,
        severity: "error",
        message: "Failed to update user status",
      });
    }
  };

  if (hasAccess === false) return <Unauthorized />;

  return (
    <Box
      sx={{
        height: "calc(100vh - 150px)",
        overflowY: "auto",
        paddingRight: 1,
        backgroundColor: "transparent",
        mt: 1,
        padding: 2,
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h4" fontWeight="bold" sx={{ color: titleColor }}>
          USER PAGE ACCESS
        </Typography>

        <TextField
          variant="outlined"
          placeholder="Search Employee ID / Name / Email / Role"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            width: 400,
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
      <br />

      <TableContainer component={Paper} sx={{ width: "100%" }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#6D2323", color: "white" }}>
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
                  justifyContent="space-between"
                  alignItems="center"
                >
                  {/* Left: Total Count */}
                  <Typography fontSize="14px" fontWeight="bold" color="white">
                    Total Admin Account: {filteredUsers.length}
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
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
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
                          fontSize: "12px",
                          height: 36,
                          color: "white",
                          border: "1px solid white",
                          backgroundColor: "transparent",
                          ".MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "& svg": {
                            color: "white", // dropdown arrow icon color
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 200,
                              backgroundColor: "#fff", // dropdown background
                            },
                          },
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
                      of {totalPages} page{totalPages > 1 ? "s" : ""}
                    </Typography>

                    {/* Next & Last */}
                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
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
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
                          color: "white",
                          borderColor: "white",
                          backgroundColor: "transparent",
                          opacity: 1,
                        },
                      }}
                    >
                      Last
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={openCreateAccessModal}
                    >
                      Create Access
                    </Button>
                    <Button
                      variant="contained"
                      color="info"
                      size="small"
                      onClick={openEditAccessLevelModal}
                    >
                      Edit Access Level
                    </Button>
                  </Box>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
      {/* USER LIST TABLE */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: "#F5F5F5" }}>
              <TableRow>
                <TableCell
                  sx={{
                    color: "black",
                    fontWeight: "bold",
                    border: `1px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Employee ID
                </TableCell>
                <TableCell
                  sx={{
                    color: "black",
                    fontWeight: "bold",
                    border: `1px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Name
                </TableCell>
                <TableCell
                  sx={{
                    color: "black",
                    fontWeight: "bold",
                    border: `1px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Email
                </TableCell>
                <TableCell
                  sx={{
                    color: "black",
                    fontWeight: "bold",
                    border: `1px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Role
                </TableCell>
                <TableCell
                  sx={{
                    color: "black",
                    fontWeight: "bold",
                    border: `1px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Access Level
                </TableCell>
                <TableCell
                  sx={{
                    color: "black",
                    fontWeight: "bold",
                    border: `1px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{
                    color: "black",
                    fontWeight: "bold",
                    border: `1px solid ${borderColor}`,
                    textAlign: "center",
                  }}
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedUsers.map((u, p) => (
                <TableRow key={u.id}>
                  <TableCell
                    sx={{
                      color: "black",
                      border: `1px solid ${borderColor}`,
                      textAlign: "center",
                    }}
                  >
                    {u.employee_id}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "black",
                      border: `1px solid ${borderColor}`,
                      textAlign: "center",
                    }}
                  >{`${u.last_name}, ${u.first_name} ${u.middle_name || "."}`}</TableCell>
                  <TableCell
                    sx={{
                      color: "black",
                      border: `1px solid ${borderColor}`,
                      textAlign: "center",
                    }}
                  >
                    {u.email}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "black",
                      border: `1px solid ${borderColor}`,
                      textAlign: "center",
                    }}
                  >
                    {u.role}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "black",
                      border: `1px solid ${borderColor}`,
                      textAlign: "center",
                    }}
                  >
                    {u.access_description}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "black",
                      textAlign: "center",
                      border: `1px solid ${borderColor}`,
                    }}
                    align="center"
                  >
                    <Switch
                      checked={Number(u.status) === 1}
                      onChange={() =>
                        handleUserStatusToggle(u.id, Number(u.status))
                      }
                      color="primary"
                      size="medium"
                    />
                  </TableCell>

                  <TableCell
                    sx={{
                      color: "black",
                      border: `1px solid ${borderColor}`,
                      textAlign: "center",
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={() => loadUserAccess(u)}
                    >
                      Edit Access
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <TableContainer component={Paper} sx={{ width: "100%" }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#6D2323", color: "white" }}>
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
                  justifyContent="space-between"
                  alignItems="center"
                >
                  {/* Left: Total Count */}
                  <Typography fontSize="14px" fontWeight="bold" color="white">
                    Total Admin Account: {filteredUsers.length}
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
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
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
                          fontSize: "12px",
                          height: 36,
                          color: "white",
                          border: "1px solid white",
                          backgroundColor: "transparent",
                          ".MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                          },
                          "& svg": {
                            color: "white", // dropdown arrow icon color
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 200,
                              backgroundColor: "#fff", // dropdown background
                            },
                          },
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
                      of {totalPages} page{totalPages > 1 ? "s" : ""}
                    </Typography>

                    {/* Next & Last */}
                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
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
                        "&:hover": {
                          borderColor: "white",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                        "&.Mui-disabled": {
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

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>
          Editing Access For: {selectedUser?.employee_id} |{" "}
          {`${selectedUser?.last_name}, ${selectedUser?.first_name} ${selectedUser?.middle_name || "."}`}
        </DialogTitle>

        <DialogContent dividers sx={{ maxHeight: "70vh" }}>
          <Box display="flex" gap={2} mb={2}>
            <Button
              variant="contained"
              color="success"
              onClick={grantAllAccess}
            >
              Grant All Access
            </Button>

            <Button
              variant="contained"
              color="warning"
              onClick={revokeAllAccess}
            >
              Remove All Access
            </Button>
          </Box>
          <Paper sx={{ border: `1px solid ${borderColor}` }}>
            <TableContainer>
              <Table>
                <TableHead
                  sx={{ backgroundColor: settings?.header_color || "#1976d2" }}
                >
                  <TableRow>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      #
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      Page Description
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      Page Group
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                        border: `1px solid ${borderColor}`,
                      }}
                      align="center"
                    >
                      Access
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                        border: `1px solid ${borderColor}`,
                      }}
                      align="center"
                    >
                      EDIT
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                        border: `1px solid ${borderColor}`,
                      }}
                      align="center"
                    >
                      DELETE
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {pages.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell
                        sx={{
                          color: "black",
                          textAlign: "center",
                          border: `1px solid ${borderColor}`,
                        }}
                      >
                        {i + 1}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "black",
                          textAlign: "center",
                          border: `1px solid ${borderColor}`,
                        }}
                      >
                        {p.page_description}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "black",
                          textAlign: "center",
                          border: `1px solid ${borderColor}`,
                        }}
                      >
                        {p.page_group}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "black",
                          textAlign: "center",
                          border: `1px solid ${borderColor}`,
                        }}
                        align="center"
                      >
                        <Switch
                          checked={pageAccess[p.id]?.access || false}
                          onChange={() =>
                            handleToggleChange(
                              p.id,
                              pageAccess[p.id]?.access || false,
                            )
                          }
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "black",
                          textAlign: "center",
                          border: `1px solid ${borderColor}`,
                        }}
                        align="center"
                      >
                        <Switch
                          checked={pageAccess[p.id]?.can_edit || false}
                          onChange={() => handlePermissionToggle(p.id, "can_edit")}
                          disabled={!pageAccess[p.id]?.access}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "black",
                          textAlign: "center",
                          border: `1px solid ${borderColor}`,
                        }}
                        align="center"
                      >
                        <Switch
                          checked={pageAccess[p.id]?.can_delete || false}
                          onChange={() => handlePermissionToggle(p.id, "can_delete")}
                          disabled={!pageAccess[p.id]?.access}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            color="error"
            onClick={() => setOpenModal(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>Create New Access</DialogTitle>

        <DialogContent dividers>
          <Box display="flex" gap={2} mb={2}>
            <Button
              variant="contained"
              color="success"
              onClick={handleCreateAssignAll}
            >
              Assign All
            </Button>
          </Box>
          <TextField
            label="Description"
            fullWidth
            value={accessDescription}
            onChange={(e) => setAccessDescription(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Paper sx={{ border: `1px solid ${borderColor}` }}>
            <TableContainer>
              <Table>
                <TableHead
                  sx={{ backgroundColor: settings?.header_color || "#1976d2" }}
                >
                  <TableRow>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      #
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      Page Description
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      Page Group
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      Access
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {createPages.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell align="center">{i + 1}</TableCell>
                      <TableCell align="center">{p.page_description}</TableCell>
                      <TableCell align="center">{p.page_group}</TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={createPageAccess[p.id] || false}
                          onChange={() => handleCreateToggle(p.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            color="error"


            onClick={() => setOpenCreateModal(false)}
          >
            Cancel
          </Button>

          <Button variant="contained" color="success" onClick={saveAccess}>
            Save Access
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openEditAccessModal}
        onClose={() => setOpenEditAccessModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>
          Edit Access Level
        </DialogTitle>

        <DialogContent dividers>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="edit-access-level-select-label">
              Access Level
            </InputLabel>
            <Select
              labelId="edit-access-level-select-label"
              value={editAccessId}
              label="Access Level"
              onChange={(e) => handleSelectAccessLevel(e.target.value)}
            >
              <MenuItem value="">Select Access Level</MenuItem>
              {accessLevels.map((access) => (
                <MenuItem key={access.access_id} value={access.access_id}>
                  {access.access_description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Description"
            fullWidth
            value={editAccessDescription}
            onChange={(e) => setEditAccessDescription(e.target.value)}
            sx={{ mb: 3 }}
            disabled={!editAccessId}
          />

          <Box display="flex" gap={2} mb={2}>
            <Button
              variant="contained"
              color="success"
              onClick={handleEditSelectAll}
              disabled={!editAccessId}
            >
              Select All
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleEditClearAll}
              disabled={!editAccessId}
            >
              Clear All
            </Button>
          </Box>

          <Paper sx={{ border: `1px solid ${borderColor}` }}>
            <TableContainer>
              <Table>
                <TableHead
                  sx={{ backgroundColor: settings?.header_color || "#1976d2" }}
                >
                  <TableRow>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      #
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      Page Description
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      Page Group
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "white",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      Access
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {editPages.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell align="center">{i + 1}</TableCell>
                      <TableCell align="center">{p.page_description}</TableCell>
                      <TableCell align="center">{p.page_group}</TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={editPageAccess[p.id] || false}
                          onChange={() => handleEditToggle(p.id)}
                          disabled={!editAccessId}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            color="error"


            onClick={() => setOpenEditAccessModal(false)}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={saveEditedAccess}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={handleCloseSnack}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserPageAccess;
