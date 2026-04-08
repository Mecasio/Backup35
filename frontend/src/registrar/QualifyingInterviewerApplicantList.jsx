import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  Typography,
  Table,
  Card,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
} from "@mui/material";
import API_BASE_URL from "../apiConfig";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search } from "@mui/icons-material";
import { FcPrint } from "react-icons/fc";
import EaristLogo from "../assets/EaristLogo.png";
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PeopleIcon from '@mui/icons-material/People';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import SearchIcon from "@mui/icons-material/Search";
import MenuBookIcon from '@mui/icons-material/MenuBook';
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { Snackbar, Alert } from "@mui/material";


const InterviewerApplicantList = () => {
  const location = useLocation();


  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const scheduleId = params.get("schedule");
    const interviewerName = params.get("interviewer");

    if (scheduleId) {
      setSearchQuery(interviewerName || "");  // pre-fill search bar
      handleSearch(); // immediately fetch applicants for this schedule
    }
  }, [location.search]);

  const settings = useContext(SettingsContext);
  const [fetchedLogo, setFetchedLogo] = useState(null);
  const [companyName, setCompanyName] = useState("");

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const pageId = 36;

  // ✅ Snackbar State
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
    key: new Date().getTime(),
  });

  const handleCloseSnack = (event, reason) => {
    if (reason === "clickaway") return;

    setSnack((prev) => ({
      ...prev,
      open: false,
    }));
  };

  const handleOpenDeleteDialog = (applicant) => {
    setApplicantToDelete(applicant);
    setOpenDeleteDialog(true);
  };


  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");
  const [subButtonColor, setSubButtonColor] = useState("#ffffff");   // ✅ NEW
  const [stepperColor, setStepperColor] = useState("#000000");       // ✅ NEW

  const [shortTerm, setShortTerm] = useState("");
  const [campusAddress, setCampusAddress] = useState("");
  const [branches, setBranches] = useState([]);

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
    if (settings?.branches) {
      try {
        const parsed =
          typeof settings.branches === "string"
            ? JSON.parse(settings.branches)
            : settings.branches;

        setBranches(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        console.error("Failed to parse branches:", err);
        setBranches([]);
      }
    } else {
      setBranches([]);
    }

  }, [settings]);

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
    if (settings) {
      // ✅ load dynamic logo
      if (settings.logo_url) {
        setFetchedLogo(`${API_BASE_URL}${settings.logo_url}`);
      } else {
        setFetchedLogo(EaristLogo);
      }

      // ✅ load dynamic name + address
      if (settings.company_name) setCompanyName(settings.company_name);
      if (settings.campus_address) setCampusAddress(settings.campus_address);
    }
  }, [settings]);

  const words = companyName.trim().split(" ");
  const middle = Math.ceil(words.length / 2);
  const firstLine = words.slice(0, middle).join(" ");
  const secondLine = words.slice(middle).join(" ");


  // const tabs = [

  //   { label: "Qualifying / Interview Room Assignment", to: "/assign_qualifying_interview_exam", icon: <MeetingRoomIcon fontSize="large" /> },
  //   { label: "Qualifying / Interview Schedule Management", to: "/assign_schedule_applicants_qualifying_interview", icon: <ScheduleIcon fontSize="large" /> },
  //   { label: "Qualifying / Interviewer Applicant's List", to: "/enrollment_schedule_room_list", icon: <PeopleIcon fontSize="large" /> },




  // ];



  const navigate = useNavigate();
  // const [activeStep, setActiveStep] = useState(2);
  // const [clickedSteps, setClickedSteps] = useState(Array(tabs.length).fill(false));
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [applicantToDelete, setApplicantToDelete] = useState(null);

  const handleStepClick = (index, to) => {
    setActiveStep(index);
    navigate(to); // this will actually change the page
  };



  const [searchQuery, setSearchQuery] = useState("");
  const [interviewerData, setInterviewerData] = useState(null);

  const [applicants, setApplicants] = useState([]);
  const [person, setPerson] = useState({
    campus: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    program: "",
    extension: "",


  });

  const handleSearch = async (scheduleId = null) => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/interviewers`, {
        params: {
          query: searchQuery,
          schedule: scheduleId, // send schedule ID if provided
        },
      });

      setInterviewerData(data[0]?.schedule || null);
      setApplicants(data[0]?.applicants || []);
    } catch (err) {
      console.error(err);
    }
  };



  const [curriculumOptions, setCurriculumOptions] = useState([]);

  useEffect(() => {
    const fetchCurriculums = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/applied_program`);
        console.log("✅ curriculumOptions:", response.data); // <--- add this
        setCurriculumOptions(response.data);
      } catch (error) {
        console.error("Error fetching curriculum options:", error);
      }
    };

    fetchCurriculums();
  }, []);

  const printDiv = () => {
    const newWin = window.open("", "Print-Window");
    newWin.document.open();

    const logoSrc = fetchedLogo || EaristLogo;
    const name = companyName?.trim() || "No Company Name Available";

    const words = name.split(" ");
    const mid = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, mid).join(" ");
    const secondLine = words.slice(mid).join(" ");

    const branchList = Array.isArray(branches) ? branches : [];
    const matchedBranch = branchList.find(
      (branch) =>
        String(branch?.branch).trim().toLowerCase() ===
        String(interviewerData?.branch || "").trim().toLowerCase()
    );
    const campus =
      matchedBranch?.address ||
      matchedBranch?.branch_address ||
      campusAddress ||
      settings?.address ||
      "No address set in Settings";

    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const borderColor = "black"; // border color for table

    const htmlContent = `
<html>
<head>
  <title>Qualifying / Interviewer Applicant List</title>
  <style>
    @page { size: A4 landscape; margin: 5mm; }

    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .print-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

 .print-header img {
   position: absolute;
  left: 180px; /* adjust if needed */
   top: -5px;
   width: 120px;
   height: 120px;
   border-radius: 50%;
   object-fit: cover;
 }
    .print-header div { font-size: 12px; }

    table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 10px;
    }

    th, td {
      border: 1px solid ${borderColor};
      padding: 3px 4px;
      font-size: 10px;
      line-height: 1.1;
    }

    th {
      text-align: center;
      background-color: lightgray;
      color: black;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Column width balancing like Proctor */
    th:nth-child(1) { width: 3%; }
    th:nth-child(2) { width: 10%; }
    th:nth-child(3) { width: 25%; }
    th:nth-child(4) { width: 25%; }
    th:nth-child(5) { width: 10%; }

    .info-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 11px;
    }
  </style>
</head>

<body onload="window.print(); setTimeout(() => window.close(), 100);">
  <div class="print-container">
      <div class="print-header">
        <img src="${logoSrc}" alt="School Logo" />
        <div>
          <div style="font-size: 13px; font-family: Arial">Republic of the Philippines</div>
          <b style="letter-spacing:1px; font-size:20px; font-family: Arial">${firstLine}</b>
          ${secondLine ? `<div style="letter-spacing:1px; font-size: 20px; font-family: Arial"><b>${secondLine}</b></div>` : ""}
          <div style="font-size: 13px; font-family: Arial">${campus}</div>
          <div style="margin-top:25px;"><b style="font-size:20px; letter-spacing:1px;">Proctor Applicant List</b></div>
        </div>
      </div>
    <!-- INTERVIEW DETAILS -->
    <div style="width: 100%; margin-top: 15px;">
      <div class="info-row">
        <span><b>Interviewer:</b> ${interviewerData?.interviewer || "N/A"}</span>
        <span><b>Building:</b> ${interviewerData?.building_description || "N/A"}</span>
      </div>
      <div class="info-row">
        <span><b>Room:</b> ${interviewerData?.room_description || "N/A"}</span>
        <span><b>Schedule:</b>
          ${interviewerData?.day_description || ""} |
          ${interviewerData?.start_time ? new Date("1970-01-01T" + interviewerData.start_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : ""}
          -
          ${interviewerData?.end_time ? new Date("1970-01-01T" + interviewerData.end_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : ""}
        </span>
      </div>
    </div>

    <!-- TABLE -->
    <table>
      <thead>
        <tr>
        
            <th style="width:20%">Applicant ID</th>
            <th style="width:30%">Applicant Name</th>
            <th style="width:30%">Program</th>
            <th style="width:20%">Signature</th>
        </tr>
      </thead>
      <tbody>
        ${applicants.map((a, index) => {
      const programItem = curriculumOptions.find(item => item.curriculum_id?.toString() === a.program?.toString());
      const program = programItem ? `(${programItem.program_code}) - ${programItem.program_description} ${programItem.major || ""}` : "N/A";

      return `
            <tr>
             <td style="width:20%; text-align:center;">${a.applicant_number}</td>
              <td style="width:30%; text-align:left;">${a.last_name}, ${a.first_name} ${a.middle_name || ""}</td>
              <td style="width:30%; text-align:center;">${program}</td>
              <td style="width:20%; text-align:center;"></td>
            </tr>`;
    }).join("")}
        <tr>
          <td colspan="5" style="text-align:right; font-weight:bold;">Total Applicants: ${applicants.length}</td>
        </tr>
      </tbody>
    </table>

  </div>
</body>
</html>
`;

    newWin.document.write(htmlContent);
    newWin.document.close();
  };



  // 🔎 Auto-search whenever searchQuery changes (debounced)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim() !== "") {
        handleSearch();
      } else {
        setApplicants([]); // clear results if empty search
        setInterviewerData(null);

      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);


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
            fontWeight: "bold",
            color: titleColor,
            fontSize: "36px",
          }}
        >
          QUALIFYING / INTERVIEWER APPLICANT LIST
        </Typography>

        <TextField
          variant="outlined"
          placeholder="Search Qualifying / Interviewer Name / Email"
          size="small"

          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handleSearch();
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

      {/* <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "nowrap", // ❌ prevent wrapping
          width: "100%",
          mt: 3,
          gap: 2,
        }}
      >
        {tabs.map((tab, index) => (
          <Card
            key={index}
            onClick={() => handleStepClick(index, tab.to)}
            sx={{
              flex: `1 1 ${100 / tabs.length}%`, // evenly divide row
              height: 140,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              borderRadius: 2,
              border: `2px solid ${borderColor}`,
              backgroundColor: activeStep === index ? settings?.header_color || "#1976d2" : "#E8C999",
              color: activeStep === index ? "#fff" : "#000",
              boxShadow:
                activeStep === index
                  ? "0px 4px 10px rgba(0,0,0,0.3)"
                  : "0px 2px 6px rgba(0,0,0,0.15)",
              transition: "0.3s ease",
              "&:hover": {
                backgroundColor: activeStep === index ? "#000000" : "#f5d98f",
              },
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Box sx={{ fontSize: 40, mb: 1 }}>{tab.icon}</Box>
              <Typography sx={{ fontSize: 14, fontWeight: "bold", textAlign: "center" }}>
                {tab.label}
              </Typography>
            </Box>
          </Card>
        ))}
      </Box> */}


      <br />
      {interviewerData && (
        <Box
          sx={{
            display: "flex",
            gap: 4,
            flexWrap: "wrap",

            mb: 2,
            fontSize: "16px",
          }}
        >
          <span><b>Interviewer:</b> {interviewerData.interviewer || "N/A"}</span>
          <span><b>Building:</b> {interviewerData.building_description || "N/A"}</span>
          <span><b>Room:</b> {interviewerData.room_description || "N/A"}</span>
          <span>
            <b>Schedule:</b> {interviewerData.day_description || ""} |{" "}
            {interviewerData.start_time
              ? new Date(`1970-01-01T${interviewerData.start_time}`).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
              : ""}{" "}
            -{" "}
            {interviewerData.end_time
              ? new Date(`1970-01-01T${interviewerData.end_time}`).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
              : ""}
          </span>

        </Box>
      )}


      {applicants.length > 0 && (
        <Button
          onClick={printDiv}
          variant="outlined"
          sx={{
            padding: "5px 20px",
            border: "2px solid black",
            backgroundColor: "#f0f0f0",
            color: "black",
            borderRadius: "5px",
            fontSize: "14px",
            fontWeight: "bold",
            height: "40px",
            display: "flex",
            alignItems: "center",
            gap: 1, // 8px gap between icon and text
            userSelect: "none",
            transition: "background-color 0.3s, transform 0.2s",
            "&:hover": {
              backgroundColor: "#d3d3d3",
            },
            "&:active": {
              transform: "scale(0.95)",
            },
          }}
          startIcon={<FcPrint size={20} />}
        >
          Print Applicant List
        </Button>

      )}
      <br />

      {/* TableContainer */}
      {applicants.length === 0 && (
        <Box
          sx={{
            border: `2px dashed ${borderColor}`,
            borderRadius: 2,
            p: 3,
            textAlign: "center",
            backgroundColor: "#fafafa",
          }}
        >
          <Typography sx={{ fontWeight: "bold" }}>
            There are no applicants for this schedule.
          </Typography>
        </Box>
      )}

      {applicants.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: settings?.header_color || "#1976d2" }}>
              <TableRow>
                <TableCell sx={{ color: "white", textAlign: "center", border: `2px solid ${borderColor}` }}>#</TableCell>
                <TableCell sx={{ color: "white", textAlign: "center", border: `2px solid ${borderColor}` }}>Applicant</TableCell>
                <TableCell sx={{ color: "white", textAlign: "center", border: `2px solid ${borderColor}` }}>Name</TableCell>
                <TableCell sx={{ color: "white", textAlign: "center", border: `2px solid ${borderColor}` }}>Program</TableCell>
                <TableCell sx={{ color: "white", textAlign: "center", border: `2px solid ${borderColor}` }}>Building</TableCell>
                <TableCell sx={{ color: "white", textAlign: "center", border: `2px solid ${borderColor}` }}>Room</TableCell>
                <TableCell sx={{ color: "white", textAlign: "center", border: `2px solid ${borderColor}` }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {applicants.map((a, idx) => (
                <TableRow key={idx}>
                  <TableCell align="center" sx={{ border: `2px solid ${borderColor}` }}>{idx + 1}</TableCell>
                  <TableCell align="left" sx={{ border: `2px solid ${borderColor}` }}>{a.applicant_number}</TableCell>
                  <TableCell align="left" sx={{ border: `2px solid ${borderColor}` }}>
                    {`${a.last_name}, ${a.first_name} ${a.middle_name || ""}`}
                  </TableCell>
                  <TableCell align="left" sx={{ border: `2px solid ${borderColor}` }}>
                    {(() => {
                      const programItem = curriculumOptions.find(
                        (item) => item.curriculum_id?.toString() === a.program?.toString()
                      );
                      return programItem
                        ? `(${programItem.program_code}) - ${programItem.program_description} ${programItem.major || ""}`
                        : "N/A";
                    })()}
                  </TableCell>

                  <TableCell align="left" sx={{ border: `2px solid ${borderColor}` }}>
                    {a.building_description || interviewerData?.building_description || "N/A"} {/* ✅ NEW */}
                  </TableCell>
                  <TableCell align="left" sx={{ border: `2px solid ${borderColor}` }}>
                    {a.room_description || interviewerData?.room_description || "N/A"} {/* ✅ NEW */}
                  </TableCell>
                  <TableCell align="center" sx={{ border: `2px solid ${borderColor}` }}>
                    <IconButton
                      color="error"
                      onClick={() => handleOpenDeleteDialog(a)}
                      sx={{
                        backgroundColor: "#ffebee",
                        border: "2px solid red",
                        "&:hover": {
                          backgroundColor: "#ffcdd2",
                        },
                        borderRadius: "8px",
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>

            {/* ✅ Snackbar */}
            <Snackbar
              key={snack.key}
              open={snack.open}
              autoHideDuration={4000}
              onClose={handleCloseSnack}
              anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
              <Alert
                onClose={handleCloseSnack}
                severity={snack.severity}
                sx={{ width: "100%" }}
              >
                {snack.message}
              </Alert>
            </Snackbar>


            <Dialog
              open={openDeleteDialog}
              onClose={() => {
                setOpenDeleteDialog(false);
                setApplicantToDelete(null);
              }}
            >
              <DialogTitle>Confirm Remove Applicant</DialogTitle>

              <DialogContent>
                <Typography>
                  Are you sure you want to remove applicant{" "}
                  <b>{applicantToDelete?.last_name}, {applicantToDelete?.first_name}</b>
                  from the exam schedule?
                </Typography>
              </DialogContent>

              <DialogActions>
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => {
                    setOpenDeleteDialog(false);
                    setApplicantToDelete(null);
                  }}
                >
                  Cancel
                </Button>

                <Button
                  color="error"
                  variant="contained"
                  onClick={async () => {
                    if (!applicantToDelete) return;

                    try {
                      await axios.put(`${API_BASE_URL}/api/interview/remove_applicant`, {
                        applicant_id: applicantToDelete.applicant_number,
                      });

                      // ✅ Show success snackbar
                      setSnack({
                        open: true,
                        message: "Applicant successfully removed.",
                        severity: "success",
                        key: new Date().getTime(),
                      });

                      handleSearch(); // refresh table

                    } catch (error) {
                      console.error("Error removing applicant:", error);

                      setSnack({
                        open: true,
                        message: "Failed to remove applicant.",
                        severity: "error",
                        key: new Date().getTime(),
                      });
                    }

                    setOpenDeleteDialog(false);
                    setApplicantToDelete(null);
                  }}
                >
                  Yes, Remove
                </Button>
              </DialogActions>
            </Dialog>


          </Table>
        </TableContainer>

      )}
    </Box>
  );
};

export default InterviewerApplicantList;
