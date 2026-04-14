import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Paper,
} from '@mui/material';
import Autocomplete from "@mui/material/Autocomplete";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";

import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";

const DepartmentSection = () => {

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

  const [dprtmntSection, setDprtmntSection] = useState({
    curriculum_id: '',
    section_id: '',
  });

  const [curriculumList, setCurriculumList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [departmentSections, setDepartmentSections] = useState([]);

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const [deptSearchQuery, setDeptSearchQuery] = useState("");

  const filteredDepartmentSections = departmentSections.filter((section) =>
    [
      section.year_description,
      section.program_code,
      section.program_description,
      section.major,
      section.section_description,
      section.dsstat === 1 ? "active" : "inactive",
    ]
      .join(" ")
      .toLowerCase()
      .includes(deptSearchQuery.toLowerCase())
  );




  // ✅ Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // success | error | info | warning
  });
  const pageId = 20;

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
    fetchCurriculum();
    fetchSections();
    fetchDepartmentSections();
  }, []);

  const fetchCurriculum = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/get_active_curriculum`);
      setCurriculumList(res.data);
    } catch (err) {
      console.log(err);
    }
  };


  const fetchSections = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/section_table`);
      setSectionsList(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartmentSections = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/department_section`);
      setDepartmentSections(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDprtmntSection((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [editId, setEditId] = useState(null);

  const handleAddDepartmentSection = async () => {
    const { curriculum_id, section_id } = dprtmntSection;
    if (!curriculum_id || !section_id) {
      setSnackbar({
        open: true,
        message: "Please select both curriculum and section.",
        severity: "error",
      });
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/department_section`, dprtmntSection);
      setDprtmntSection({ curriculum_id: '', section_id: '' });
      fetchDepartmentSections();
      setSnackbar({
        open: true,
        message: "Department section added successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to add department section.",
        severity: "error",
      });
    }
  };

  const formatSchoolYear = (yearDesc) => {
    if (!yearDesc) return "";
    const startYear = Number(yearDesc);
    if (isNaN(startYear)) return yearDesc;
    return `${startYear} - ${startYear + 1}`;
  };



  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // number of rows per page


  // total pages based on filteredDepartmentSections
  const totalPages = Math.ceil(filteredDepartmentSections.length / itemsPerPage);

  // slice the current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDepartmentSections = filteredDepartmentSections.slice(indexOfFirstItem, indexOfLastItem);


  const totalFilteredDepartmentSections = filteredDepartmentSections.length;

  // reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [deptSearchQuery]);


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
          gap: 4,
          alignItems: 'stretch',
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
          DEPARTMENT SECTION PANEL
        </Typography>
        <TextField
          variant="outlined"
          placeholder="Search Year / Program Code / Description / Major"
          size="small"
          value={deptSearchQuery}
          onChange={(e) => {
            setDeptSearchQuery(e.target.value);
          }}
          sx={{
            width: 450,
            backgroundColor: "#fff",
            borderRadius: 1,
            mb: 2,
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



      <TableContainer component={Paper} sx={{ width: '100%', }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
            <TableRow>
              <TableCell colSpan={10} sx={{ border: `1px solid ${borderColor}`, py: 0.5, backgroundColor: settings?.header_color || "#1976d2", color: "white" }}>
                <Box
                  display="flex"
                  justifyContent="space-between" // Left & right sides
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                >

                  <Typography fontSize="14px" fontWeight="bold" color="white">
                    Total Department Sections: {totalFilteredDepartmentSections}
                  </Typography>
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
                        setEditId(null);
                        setDprtmntSection({
                          curriculum_id: '',
                          section_id: '',
                        });
                        setOpenFormDialog(true);
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
                      + Add Department Section
                    </Button>
                  </Box>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>

      <Box sx={{ overflowY: 'auto', }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            bborder: `1px solid ${borderColor}`, // outer border
          }}
        >
          <thead style={{ backgroundColor: "#f5f5f5" }}>
            <tr>
              <th
                style={{
                  border: `1px solid ${borderColor}`,
                  padding: "8px",

                  textAlign: "center",
                  color: "#000",
                }}
              >
                ID
              </th>
              <th
                style={{
                  border: `1px solid ${borderColor}`,
                  padding: "8px",

                  textAlign: "center",
                  color: "#000",
                }}
              >
                Curriculum Name
              </th>
              <th
                style={{
                  border: `1px solid ${borderColor}`,
                  padding: "8px",

                  textAlign: "center",
                  color: "#000",
                }}
              >
                Section Description
              </th>
              <th
                style={{
                  border: `1px solid ${borderColor}`,
                  padding: "8px",

                  textAlign: "center",
                  color: "#000",
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {currentDepartmentSections.map((section, index) => (

              <tr key={`dept-${section.ds_id || section.id || index}`}>
                <td
                  style={{
                    border: `1px solid ${borderColor}`,
                    padding: "8px",
                    textAlign: "center"
                  }}
                >
                  {index + 1}
                </td>
                <td
                  style={{
                    border: `1px solid ${borderColor}`,
                    padding: "8px",
                  }}
                >
                  {`${formatSchoolYear(section.year_description)}: (${section.program_code}) ${section.program_description} ${section.major || ""}`}
                </td>
                <td
                  style={{
                    border: `1px solid ${borderColor}`,
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  {section.section_description}
                </td>
                <td
                  style={{
                    border: `1px solid ${borderColor}`,
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  {section.dsstat === 0 ? "Inactive" : "Active"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TableContainer component={Paper} sx={{ width: '100%', }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#6D2323', color: "white" }}>
              <TableRow>
                <TableCell colSpan={10} sx={{ border: `1px solid ${borderColor}`, py: 0.5, backgroundColor: settings?.header_color || "#1976d2", color: "white" }}>
                  <Box
                    display="flex"
                    justifyContent="space-between" // Left & right sides
                    alignItems="center"
                    flexWrap="wrap"
                    gap={1}
                  >

                    <Typography fontSize="14px" fontWeight="bold" color="white">
                      Total Department Sections: {totalFilteredDepartmentSections}
                    </Typography>
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



      </Box>

      <Dialog
        open={openFormDialog}
        onClose={() => {
          setOpenFormDialog(false);
          setEditId(null);
          setDprtmntSection({
            curriculum_id: '',
            section_id: '',
          });
        }}
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
            fontSize: "1.1rem",
            py: 2
          }}
        >
          {editId ? "Edit Department Section" : "Add Department Section"}
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>

          <Typography fontWeight="bold" mb={1} mt={2}>
            Curriculum
          </Typography>

          <Autocomplete
            options={curriculumList}
            fullWidth
            getOptionLabel={(option) =>
              `${formatSchoolYear(option.year_description)}: (${option.program_code}) ${option.program_description} ${option.major || ""}`
            }
            value={
              curriculumList.find(
                (c) => c.curriculum_id === dprtmntSection.curriculum_id
              ) || null
            }
            onChange={(e, newValue) => {
              setDprtmntSection((prev) => ({
                ...prev,
                curriculum_id: newValue ? newValue.curriculum_id : "",
              }));
            }}
            isOptionEqualToValue={(option, value) =>
              option.curriculum_id === value.curriculum_id
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Curriculum"
                sx={{ mb: 2 }}
              />
            )}
          />

          <Typography fontWeight="bold" mb={1}>
            Section
          </Typography>

          <Autocomplete
            options={sectionsList}
            fullWidth
            getOptionLabel={(option) => option.description || ""}
            value={
              sectionsList.find(
                (s) => s.id === dprtmntSection.section_id
              ) || null
            }
            onChange={(e, newValue) => {
              setDprtmntSection((prev) => ({
                ...prev,
                section_id: newValue ? newValue.id : "",
              }));
            }}
            isOptionEqualToValue={(option, value) =>
              option.id === value.id
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Section"
              />
            )}
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
            variant="contained"
            color="error"


            sx={{
              textTransform: "none",
              fontWeight: 600
            }}
            onClick={() => {
              setOpenFormDialog(false);
              setEditId(null);
            }}
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
            onClick={async () => {
              await handleAddDepartmentSection();
              setOpenFormDialog(false);
            }}
          >
            {editId ? "Update" : "Save"}
          </Button>

        </DialogActions>
      </Dialog>


      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>




    </Box>

  );
};

const styles = {
  tableCell: {
    border: '1px solid #ccc',
    padding: '10px',
    textAlign: 'center',
  },
};

export default DepartmentSection;
