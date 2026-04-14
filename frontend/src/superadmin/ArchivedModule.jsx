import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RestoreIcon from "@mui/icons-material/Restore";
import DeleteIcon from "@mui/icons-material/Delete";
import API_BASE_URL from "../apiConfig";
import { SettingsContext } from "../App";
import LoadingOverlay from "../components/LoadingOverlay";

const pageId = 142;

const formatDate = (value) => {
  if (!value) return "N/A";

  const dateOnly = String(value).split("T")[0];
  const date = new Date(dateOnly);

  if (Number.isNaN(date.getTime())) {
    return dateOnly;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatName = (account) => {
  const name = [account?.last_name, account?.first_name]
    .filter(Boolean)
    .join(", ");
  const suffix = [account?.middle_name, account?.extension]
    .filter(Boolean)
    .join(" ");

  return [name, suffix].filter(Boolean).join(" ");
};

const ArchivedModule = () => {

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
    if (settings.branches) {
      setBranches(
        typeof settings.branches === "string"
          ? JSON.parse(settings.branches)
          : settings.branches
      );
    }

  }, [settings]);

  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [archivedAccounts, setArchivedAccounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeID, setEmployeeID] = useState("");
  const [canDelete, setCanDelete] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [dialogType, setDialogType] = useState("");
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 100;


  useEffect(() => {
    if (!settings) return;

    if (settings.border_color) {
      setBorderColor(settings.border_color);
    }

    if (settings.main_button_color) {
      setMainButtonColor(settings.main_button_color);
    }

    if (settings?.branches) {
      try {
        const parsed =
          typeof settings.branches === "string"
            ? JSON.parse(settings.branches)
            : settings.branches;

        setBranches(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error("Failed to parse branches:", error);
        setBranches([]);
      }
    }
  }, [settings]);

  const showSnack = (message, severity = "info") => {
    setSnack({
      open: true,
      message,
      severity,
    });
  };

  const fetchArchivedAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/auth/archived-accounts`,
      );
      setArchivedAccounts(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching archived accounts:", error);
      showSnack("Failed to load archived accounts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedEmployeeID = localStorage.getItem("employee_id") || "";
    setEmployeeID(storedEmployeeID);
    fetchArchivedAccounts();
  }, []);

  useEffect(() => {
    if (!employeeID) return;

    axios
      .get(`${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`)
      .then((response) => {
        setCanDelete(Number(response.data?.can_delete) === 1);
        setCanEdit(Number(response.data?.can_edit) === 1);
      })
      .catch((error) => {
        console.error("Error fetching archived module permissions:", error);
        setCanDelete(false);
        setCanEdit(false);
      });
  }, [employeeID]);

  const filteredAccounts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return archivedAccounts;
    }

    return archivedAccounts.filter((account) => {
      const values = [
        account.applicant_number,
        account.email,
        formatName(account),
      ].filter(Boolean);

      return values.some((value) =>
        String(value).toLowerCase().includes(query),
      );
    });
  }, [archivedAccounts, searchQuery]);

  const totalPages = Math.ceil(filteredAccounts.length / rowsPerPage);

  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    return filteredAccounts.slice(startIndex, endIndex);
  }, [filteredAccounts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);


  const getCampusName = (campusId) => {
    const branch = branches.find(
      (item) => String(item?.id) === String(campusId),
    );

    return branch?.branch || campusId || "N/A";
  };

  const closeDialog = () => {
    if (actionLoading) return;
    setDialogType("");
    setSelectedAccount(null);
  };

  const openDialog = (type, account) => {
    setDialogType(type);
    setSelectedAccount(account);
  };

  const handleRestore = async () => {
    if (!selectedAccount?.person_id) return;

    try {
      setActionLoading(true);

      await axios.put(
        `${API_BASE_URL}/auth/restore-account/${selectedAccount.person_id}`,
        {},
        {
          headers: {
            "x-employee-id": employeeID,
            "x-page-id": pageId,
          },
        },
      );

      setArchivedAccounts((prev) =>
        prev.filter((item) => item.person_id !== selectedAccount.person_id),
      );
      setDialogType("");
      setSelectedAccount(null);
      showSnack("Account restored successfully", "success");
    } catch (error) {
      console.error("Restore account error:", error);
      showSnack(
        error.response?.data?.message || "Failed to restore account",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedAccount?.person_id) return;

    try {
      setActionLoading(true);

      await axios.delete(
        `${API_BASE_URL}/auth/permanent-delete-account/${selectedAccount.person_id}`,
        {
          headers: {
            "x-employee-id": employeeID,
            "x-page-id": pageId,
          },
        },
      );

      setArchivedAccounts((prev) =>
        prev.filter((item) => item.person_id !== selectedAccount.person_id),
      );
      setDialogType("");
      setSelectedAccount(null);
      showSnack("Account permanently deleted", "success");
    } catch (error) {
      console.error("Permanent delete error:", error);
      showSnack(
        error.response?.data?.message || "Failed to permanently delete account",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSnackClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack((prev) => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <LoadingOverlay open={loading} message="Loading archived accounts..." />
    );
  }

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
          ARCHIVED MODULE
        </Typography>


        {/* Right: Search */}
        <TextField
          variant="outlined"
          placeholder="Search by Applicant / Message / Type"
          size="small"


          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
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
      <br />


      <TableContainer component={Paper} sx={{ width: "100" }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#6D2323", color: "white" }}>
            <TableRow>
              <TableCell
                colSpan={20}
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
                  flexWrap="wrap"

                >
                  {/* LEFT */}
                  <Typography fontSize="14px" fontWeight="bold" color="white">
                    Total Archived Accounts: {filteredAccounts.length}
                  </Typography>

                  {/* RIGHT */}
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                        },
                        '&.Mui-disabled': {
                          color: "white",
                          borderColor: "white",
                          opacity: 1,
                        }
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
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                        },
                        '&.Mui-disabled': {
                          color: "white",
                          borderColor: "white",
                          opacity: 1,
                        }
                      }}
                    >
                      Prev
                    </Button>

                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={currentPage}
                        onChange={(e) =>
                          setCurrentPage(Number(e.target.value))
                        }
                        sx={{
                          fontSize: '12px',
                          height: 36,
                          color: 'white',
                          border: '1px solid white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'white',
                          },
                          '& svg': {
                            color: 'white',
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
                      of {totalPages} page{totalPages > 1 ? "s" : ""}
                    </Typography>

                    <Button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, totalPages)
                        )
                      }
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                        },
                        '&.Mui-disabled': {
                          color: "white",
                          borderColor: "white",
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
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                        },
                        '&.Mui-disabled': {
                          color: "white",
                          borderColor: "white",
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

      <TableContainer
        component={Paper}
        sx={{ border: `1px solid ${borderColor}` }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ border: `1px solid ${borderColor}`, py: 0.5, backgroundColor: "#F5F5F5", color: "black", textAlign: "center" }}>
                #
              </TableCell>
              <TableCell sx={{ border: `1px solid ${borderColor}`, py: 0.5, backgroundColor: "#F5F5F5", color: "black", textAlign: "center" }}>
                Applicant Number
              </TableCell>
              <TableCell sx={{ border: `1px solid ${borderColor}`, py: 0.5, backgroundColor: "#F5F5F5", color: "black", textAlign: "center" }}>Name</TableCell>
              <TableCell sx={{ border: `1px solid ${borderColor}`, py: 0.5, backgroundColor: "#F5F5F5", color: "black", textAlign: "center" }}>Email</TableCell>
              <TableCell sx={{ border: `1px solid ${borderColor}`, py: 0.5, backgroundColor: "#F5F5F5", color: "black", textAlign: "center" }}>
                Campus
              </TableCell>
              <TableCell sx={{ border: `1px solid ${borderColor}`, py: 0.5, backgroundColor: "#F5F5F5", color: "black", textAlign: "center" }}>
                Application Date
              </TableCell>
              <TableCell sx={{ border: `1px solid ${borderColor}`, py: 0.5, backgroundColor: "#F5F5F5", color: "black", textAlign: "center" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: "center", py: 4 }}>
                  No archived accounts found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedAccounts.map((account, index) => (
                <TableRow key={account.person_id} hover>
                  <TableCell sx={{
                    textAlign: "center",
                    border: `1px solid ${borderColor}`,
                    fontSize: "12px",
                    py: 0.5,
                  }}>
                    {(currentPage - 1) * rowsPerPage + index + 1}
                  </TableCell>
                  <TableCell sx={{
                    textAlign: "center",
                    border: `1px solid ${borderColor}`,
                    fontSize: "12px",
                    py: 0.5,
                  }}>
                    {account.applicant_number || "N/A"}
                  </TableCell>
                  <TableCell sx={{
                    textAlign: "center",
                    border: `1px solid ${borderColor}`,
                    fontSize: "12px",
                    py: 0.5,
                  }}>{formatName(account) || "N/A"}</TableCell>
                  <TableCell sx={{
                    textAlign: "center",
                    border: `1px solid ${borderColor}`,
                    fontSize: "12px",
                    py: 0.5,
                  }}>{account.email || "N/A"}</TableCell>
                  <TableCell sx={{
                    textAlign: "center",
                    border: `1px solid ${borderColor}`,
                    fontSize: "12px",
                    py: 0.5,
                  }}>
                    {getCampusName(account.campus)}
                  </TableCell>
                  <TableCell sx={{
                    textAlign: "center",
                    border: `1px solid ${borderColor}`,
                    fontSize: "12px",
                    py: 0.5,
                  }}>
                    {formatDate(account.created_at)}
                  </TableCell>
                  <TableCell sx={{
                    textAlign: "center",
                    border: `1px solid ${borderColor}`,
                    fontSize: "12px",
                    py: 0.5,
                  }} >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<RestoreIcon />}
                        disabled={!canEdit}
                        onClick={() => openDialog("restore", account)}
                        sx={{
                          backgroundColor: "#2e7d32",
                          "&:hover": { backgroundColor: "#1b5e20" },
                          "&.Mui-disabled": {
                            backgroundColor: "#C9C9C9",
                            color: "#666666",
                          },
                        }}
                      >
                        Restore
                      </Button>

                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}

                        sx={{
                          backgroundColor: "#9E0000",

                        }}
                        disabled={!canDelete}
                        onClick={() => openDialog("delete", account)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TableContainer component={Paper} sx={{ width: "100" }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#6D2323", color: "white" }}>
            <TableRow>
              <TableCell
                colSpan={20}
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
                  flexWrap="wrap"

                >
                  {/* LEFT */}
                  <Typography fontSize="14px" fontWeight="bold" color="white">
                    Total Archived Accounts: {filteredAccounts.length}
                  </Typography>

                  {/* RIGHT */}
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                        },
                        '&.Mui-disabled': {
                          color: "white",
                          borderColor: "white",
                          opacity: 1,
                        }
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
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                        },
                        '&.Mui-disabled': {
                          color: "white",
                          borderColor: "white",
                          opacity: 1,
                        }
                      }}
                    >
                      Prev
                    </Button>

                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={currentPage}
                        onChange={(e) =>
                          setCurrentPage(Number(e.target.value))
                        }
                        sx={{
                          fontSize: '12px',
                          height: 36,
                          color: 'white',
                          border: '1px solid white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'white',
                          },
                          '& svg': {
                            color: 'white',
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
                      of {totalPages} page{totalPages > 1 ? "s" : ""}
                    </Typography>

                    <Button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, totalPages)
                        )
                      }
                      disabled={currentPage === totalPages}
                      variant="outlined"
                      size="small"
                      sx={{
                        minWidth: 80,
                        color: "white",
                        borderColor: "white",
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                        },
                        '&.Mui-disabled': {
                          color: "white",
                          borderColor: "white",
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
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                        },
                        '&.Mui-disabled': {
                          color: "white",
                          borderColor: "white",
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

      <Dialog
        open={dialogType === "restore"}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Confirm Restore</DialogTitle>
        <DialogContent>
          <Typography>
            Restore this archived account for{" "}
            <b>{formatName(selectedAccount) || "this item"}</b>?
          </Typography>
          <Typography sx={{ mt: 2 }} color="text.secondary">
            This will return the item to the active list.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"


            onClick={closeDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleRestore}
            variant="contained"
            disabled={actionLoading}
            sx={{
              backgroundColor: "#2e7d32",
              "&:hover": { backgroundColor: "#1b5e20" },
            }}
          >
            Restore
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialogType === "delete"}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Confirm Permanent Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Permanently delete{" "}
            <b>{formatName(selectedAccount) || "this item"}</b>?
          </Typography>
          <Typography sx={{ mt: 2, color: "#b71c1c", fontWeight: "bold" }}>
            Warning: this action cannot be undone. Once deleted, the item cannot
            be recovered.
          </Typography>
          <Typography sx={{ mt: 1 }} color="text.secondary">
            This will permanently remove the archived account and related
            applicant records from the system.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"


            onClick={closeDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handlePermanentDelete}
            variant="contained"
            color="error"
            disabled={actionLoading}
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackClose}
          severity={snack.severity}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ArchivedModule;
