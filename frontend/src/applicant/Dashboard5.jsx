import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import { Button, Box, Container, Typography, Checkbox, Card, FormControl, Alert, Snackbar, FormControlLabel, FormHelperText, Modal } from "@mui/material";
import { Link } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import SchoolIcon from "@mui/icons-material/School";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import InfoIcon from "@mui/icons-material/Info";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import ErrorIcon from '@mui/icons-material/Error';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ExamPermit from "../applicant/ExamPermit";
import API_BASE_URL from "../apiConfig";

const Dashboard5 = (props) => {
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


  const navigate = useNavigate();
  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });
  const [person, setPerson] = useState({
    termsOfAgreement: "",
  });

  const [activeYearId, setActiveYearId] = useState(null);
  const [activeSemesterId, setActiveSemesterId] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/active_school_year`)
      .then(res => {
        const active = res.data?.[0];
        if (active) {
          setActiveYearId(active.year_id);
          setActiveSemesterId(active.semester_id);
        }
      })
      .catch(err => {
        console.error("Failed to fetch active school year", err);
      });
  }, []);


  // do not alter
  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");
    const keys = JSON.parse(localStorage.getItem("dashboardKeys") || "{}");


    const overrideId = props?.adminOverridePersonId; // new

    if (overrideId) {
      // Admin editing other person
      setUserRole("superadmin");
      setUserID(overrideId);
      fetchPersonData(overrideId);
      return;
    }

    if (storedUser && storedRole && storedID) {
      setUser(storedUser);
      setUserRole(storedRole);
      setUserID(storedID);

      if (storedRole === "applicant") {
        fetchPersonData(storedID);
      } else {
        window.location.href = "/login";
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  const keys = JSON.parse(localStorage.getItem("dashboardKeys") || "{}");

  const steps = [
    { label: "Personal Information", icon: <PersonIcon />, path: `/dashboard/${keys.step1}` },
    { label: "Family Background", icon: <FamilyRestroomIcon />, path: `/dashboard/${keys.step2}` },
    { label: "Educational Attainment", icon: <SchoolIcon />, path: `/dashboard/${keys.step3}` },
    { label: "Health Medical Records", icon: <HealthAndSafetyIcon />, path: `/dashboard/${keys.step4}` },
    { label: "Other Information", icon: <InfoIcon />, path: `/dashboard/${keys.step5}` },
  ];


  const [activeStep, setActiveStep] = useState(4);
  const [clickedSteps, setClickedSteps] = useState(Array(steps.length).fill(false));

  const handleStepClick = (index) => {
    if (isFormValid()) {
      setActiveStep(index);
      const newClickedSteps = [...clickedSteps];
      newClickedSteps[index] = true;
      setClickedSteps(newClickedSteps);
      navigate(steps[index].path); // ✅ actually move to step
    } else {
      alert("Please fill all required fields before proceeding.");
    }
  };
  // Do not alter
  const fetchPersonData = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/form/person/${id}`);
      setPerson(res.data);
    } catch (error) { }
  };

  // Do not alter
  const handleUpdate = async () => {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split("T")[0];

    const updatedPerson = {
      ...person,
      created_at: person.created_at // Only add if not already set
    };

    try {
      await axios.put(`${API_BASE_URL}/form/person/${userID}`, updatedPerson);
      console.log("Auto-saved with created_at:", updatedPerson.created_at);
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };


  // Real-time save on every character typed
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    const updatedPerson = {
      ...person,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    };
    setPerson(updatedPerson);
    handleUpdate(updatedPerson);
  };


  const handleBlur = async () => {
    try {
      await axios.put(`${API_BASE_URL}/form/person/${userID}`, person);
      console.log("Auto-saved");
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  };

  const [errors, setErrors] = useState({});

  const isFormValid = () => {
    let newErrors = {};
    let isValid = true;

    if (person.termsOfAgreement !== 1) {
      newErrors.termsOfAgreement = true;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnack(prev => ({ ...prev, open: false }));
  };

  // Add this state at the top if not already:
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Snackbar close handler
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Example: replace previous calls with this:
  const showSnackbar = (message) => {
    setSnackbar({ open: true, message, severity: "success" });
  };

  const submitFinalApplication = async () => {
    if (!isFormValid()) {
      showSnackbar("Please accept the Terms of Agreement.", "error");
      return;
    }

    if (!person.program) {
      showSnackbar("No program selected.", "error");
      return;
    }

    if (!activeYearId || !activeSemesterId) {
      showSnackbar("Active school year not found.", "error");
      console.log(activeSemesterId)
      return;
    }

    try {


      console.log(activeSemesterId)

      // optional notification
      await axios.post(`${API_BASE_URL}/api/notify-submission`, {
        person_id: userID,
      });

      localStorage.setItem("currentStep", "6");

      showSnackbar(
        "Application submitted successfully. Please upload your documents.",
        "success"
      );

      setTimeout(() => navigate("/requirements_uploader"), 1500);

    } catch (error) {
      if (error.response?.status === 409) {
        showSnackbar(error.response.data.message, "error");
      } else {
        showSnackbar("Submission failed. Please try again.", "error");
      }
    }
  };


  const divToPrintRef = useRef();
  const [showPrintView, setShowPrintView] = useState(false);

  const printDiv = () => {
    const divToPrint = divToPrintRef.current;
    if (divToPrint) {
      const newWin = window.open("", "Print-Window");
      newWin.document.open();
      newWin.document.write(`
        <html>
          <head>
            <title>Examination Permit</title>
            <style>
              @page { size: A4; margin: 0; }
              body {
                margin: 0;
                padding: 0;
                display: flex;
                margin-left: "
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .print-container {
                width: 8.5in;
                min-height: 11in;
                margin: auto;
                background: white;
              }
              * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            </style>
          </head>
          <body onload="window.print(); setTimeout(() => window.close(), 100);">
            <div class="print-container">${divToPrint.innerHTML}</div>
          </body>
        </html>
      `);
      newWin.document.close();
    }
  };


  const [examPermitError, setExamPermitError] = useState("");
  const [examPermitModalOpen, setExamPermitModalOpen] = useState(false);

  const handleCloseExamPermitModal = () => {
    setExamPermitModalOpen(false);
    setExamPermitError("");
  };

  const handleExamPermitClick = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/exampermit/verified-exam-applicants`);
      const verified = res.data.some(a => a.person_id === parseInt(userID));

      if (!verified) {
        setExamPermitError("❌ You cannot print the Exam Permit until all required documents are verified.");
        setExamPermitModalOpen(true);
        return;
      }

      // ✅ Render permit and print
      setShowPrintView(true);
      setTimeout(() => {
        printDiv();
        setShowPrintView(false);
      }, 500);
    } catch (err) {
      console.error("Error verifying exam permit eligibility:", err);
      setExamPermitError("⚠️ Unable to check document verification status right now.");
      setExamPermitModalOpen(true);
    }
  };

  const links = [
    { to: "/ecat_application_form", label: "ECAT Application Form" },
    { to: "/admission_form_process", label: "Admission Form Process" },
    { to: "/personal_data_form", label: "Personal Data Form" },
    {
      to: "/office_of_the_registrar",
      label: `Application For ${shortTerm ? shortTerm.toUpperCase() : ""} College Admission`,
    },
    { to: "/admission_services", label: "Application/Student Satisfactory Survey" },
    { label: "Examination Permit", onClick: handleExamPermitClick },
  ];



  const [canPrintPermit, setCanPrintPermit] = useState(false);

  useEffect(() => {
    if (!userID) return;
    axios.get(`${API_BASE_URL}/exampermit/verified-exam-applicants`)
      .then(res => {
        const verified = res.data.some(a => a.person_id === parseInt(userID));
        setCanPrintPermit(verified);
      });
  }, [userID]);






  // dot not alter
  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>

      {showPrintView && (
        <div ref={divToPrintRef} style={{ display: "block" }}>
          <ExamPermit />
        </div>
      )}
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
          OTHER INFORMATION
        </Typography>




      </Box>
      <hr style={{ border: "1px solid #ccc", width: "100%" }} />

      <br />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          mt: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 2,
            borderRadius: "10px",
            backgroundColor: "#fffaf5",
            border: "1px solid #6D2323",
            boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
            width: "100%",
            overflow: "hidden",
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#800000",
              borderRadius: "8px",
              width: 60,
              height: 60,
              flexShrink: 0,
            }}
          >
            <ErrorIcon sx={{ color: "white", fontSize: 40 }} />
          </Box>

          {/* Text */}
          <Typography
            sx={{
              fontSize: "20px",
              fontFamily: "Arial",
              color: "#3e3e3e",
              lineHeight: 1.3, // slightly tighter to fit in fewer rows
              whiteSpace: "normal",
              overflow: "hidden",
            }}
          >
            <strong style={{ color: "maroon" }}>Notice:</strong> &nbsp;
            <strong></strong> <span style={{ fontSize: '1.2em', margin: '0 15px' }}>➔</span> Kindly type 'NA' or N/A in boxes where there are no possible answers to the information being requested. &nbsp;  &nbsp; <br />
            <strong></strong> <span style={{ fontSize: '1.2em', margin: '0 15px', marginLeft: "100px", }}>➔</span> To make use of the letter 'Ñ', please press ALT while typing "165", while for 'ñ', please press ALT while typing "164"

          </Typography>
        </Box>
      </Box>





      <h1
        style={{
          fontSize: "30px",
          fontWeight: "bold",
          textAlign: "center",
          color: "black",
          marginTop: "25px",
        }}
      >
        AVAILABLE PRINTABLE DOCUMENTS
      </h1>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mt: 2,
          pb: 1,
          justifyContent: "center", // Centers all cards horizontally
        }}
      >
        {links.map((lnk, i) => (
          <motion.div
            key={i}
            style={{ flex: "0 0 calc(30% - 16px)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Card
              sx={{
                minHeight: 60,
                borderRadius: 2,
                border: `2px solid ${borderColor}`,
                backgroundColor: "#fff",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                p: 1.5,
                cursor: "pointer",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "scale(1.05)",
                  backgroundColor: settings?.header_color || "#1976d2",

                  "& .card-text": {
                    color: "#fff", // ✅ text becomes white
                  },
                  "& .card-icon": {
                    color: "#fff", // ✅ icon becomes white
                  },
                },
              }}
              onClick={() => {
                if (lnk.onClick) {
                  lnk.onClick(); // run handler
                } else if (lnk.to) {
                  navigate(lnk.to); // navigate if it has a `to`
                }
              }}
            >
              {/* Icon */}
              <PictureAsPdfIcon
                className="card-icon"
                sx={{ fontSize: 35, color: mainButtonColor, mr: 1.5 }}
              />

              {/* Label */}
              <Typography
                className="card-text"
                sx={{
                  color: mainButtonColor,
                  fontFamily: "Arial",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                }}
              >
                {lnk.label}
              </Typography>
            </Card>
          </motion.div>
        ))}
      </Box>

      <Container maxWidth="lg">

        <Container>
          <h1 style={{ fontSize: "50px", fontWeight: "bold", textAlign: "center", color: subtitleColor, marginTop: "25px" }}>
            APPLICANT FORM
          </h1>
          <div style={{ textAlign: "center" }}>
            Complete the applicant form to secure your place for the upcoming academic year at{" "}
            {shortTerm ? (
              <>
                <strong>{shortTerm.toUpperCase()}</strong> <br />
                {companyName || ""}
              </>
            ) : (
              companyName || ""
            )}
            .
          </div>

        </Container>
        <br />
        <Box sx={{ display: "flex", justifyContent: "center", width: "100%", px: 4 }}>
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => handleStepClick(index)}
              >
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    border: `2px solid ${borderColor}`,
                    backgroundColor: activeStep === index ? settings?.header_color || "#1976d2" : "#E8C999",
                    color: activeStep === index ? "#fff" : "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {step.icon}
                </Box>
                <Typography
                  sx={{
                    mt: 1,
                    color: activeStep === index ? "#6D2323" : "#000",
                    fontWeight: activeStep === index ? "bold" : "normal",
                    fontSize: 14,
                  }}
                >
                  {step.label}
                </Typography>
              </Box>
              {index < steps.length - 1 && (
                <Box
                  sx={{
                    height: "2px",
                    backgroundColor: mainButtonColor,
                    flex: 1,
                    alignSelf: "center",
                    mx: 2,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </Box>



        <br />
        <form>
          <Container maxWidth="100%" sx={{ backgroundColor: settings?.header_color || "#1976d2", border: "2px solid black", color: "white", borderRadius: 2, boxShadow: 3, padding: "4px" }}>
            <Box sx={{ width: "100%" }}>
              <Typography style={{ fontSize: "20px", padding: "10px", fontFamily: "Arial Black" }}>Step 5: Other Information</Typography>
            </Box>
          </Container>
          <Container maxWidth="100%" sx={{ backgroundColor: "#f1f1f1", border: `2px solid ${borderColor}`, padding: 4, borderRadius: 2, boxShadow: 3 }}>
            <Typography style={{ fontSize: "20px", color: mainButtonColor, fontWeight: "bold" }}>
              Other Information:
            </Typography>
            <hr style={{ border: "1px solid #ccc", width: "100%" }} />
            <Typography style={{ fontWeight: "bold", textAlign: "Center" }}>
              Data Subject Consent Form
            </Typography>
            < br />
            <Typography style={{ fontSize: "12px", fontFamily: "Arial", textAlign: "Left" }}>
              In accordance with RA 10173 or Data Privacy Act of 2012, I give my consent to the following terms and conditions on the collection, use, processing, and disclosure of my personal data:
            </Typography>
            < br />
            <Typography
              style={{ fontSize: "12px", fontFamily: "Arial", textAlign: "left" }}
            >
              1. I am aware that the{" "}
              {companyName || "Your School Name"}{" "}
              {shortTerm ? `(${shortTerm.toUpperCase()})` : ""}{" "}
              has collected and stored my personal data during my admission/enrollment at{" "}
              {shortTerm ? shortTerm.toUpperCase() : companyName || ""}.
              This data includes my demographic profile, contact details like home address,
              email address, landline numbers, and mobile numbers.
            </Typography>

            <Typography style={{ fontSize: "12px", fontFamily: "Arial", textAlign: "Left" }}>
              2. I agree to personally update these data through personal request from the Office of the registrar.
            </Typography>
            <Typography
              style={{ fontSize: "12px", fontFamily: "Arial", textAlign: "left" }}
            >
              3. In consonance with the above stated Act, I am aware that the University will
              protect my school records related to my being a student/graduate of{" "}
              {shortTerm ? shortTerm.toUpperCase() : ""}. However, I have the
              right to authorize a representative to claim the same subject to the policy of
              the University.
            </Typography>

            <Typography style={{ fontSize: "12px", fontFamily: "Arial", textAlign: "Left" }}>
              4. In order to promote efficient management of the organization’s records, I authorize the University to manage my data for data sharing with industry partners, government agencies/embassies, other educational institutions, and other offices for the university for employment, statistics, immigration, transfer credentials, and other legal purposes that may serve me best.
            </Typography>
            < br />
            <Typography style={{ fontSize: "12px", fontFamily: "Arial", textAlign: "Left" }}>
              By clicking the submit button, I warrant that I have read, understood all of the above provisions, and agreed to its full implementation.
            </Typography>
            <br />
            <hr style={{ border: "1px solid #ccc", width: "100%" }} />
            < br />
            <Typography style={{ fontSize: "12px", fontFamily: "Arial", textAlign: "Left" }}>
              I certify that the information given above are true, complete, and accurate to the best of my knowledge and belief. I promise to abide by the rules and regulations of Eulogio "Amang" Rodriguez Institute of Science and Technology regarding the ECAT and my possible admission. I am aware that any false or misleading information and/or statement may result in the refusal or disqualification of my admission to the institution.
            </Typography>

            <FormControl required error={!!errors.termsOfAgreement} component="fieldset" sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="termsOfAgreement"
                    checked={person.termsOfAgreement === 1}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                }
                label="I agree Terms of Agreement"
              />
              {errors.termsOfAgreement && (
                <FormHelperText>This field is required.</FormHelperText>
              )}
            </FormControl>

            <Modal
              open={examPermitModalOpen}
              onClose={handleCloseExamPermitModal}
              aria-labelledby="exam-permit-error-title"
              aria-describedby="exam-permit-error-description"
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 400,
                  bgcolor: "background.paper",
                  border: "2px solid #6D2323",
                  boxShadow: 24,
                  p: 4,
                  borderRadius: 2,
                  textAlign: "center",
                }}
              >
                <ErrorIcon sx={{ color: mainButtonColor, fontSize: 50, mb: 2 }} />
                <Typography id="exam-permit-error-title" variant="h6" component="h2" color="maroon">
                  Exam Permit Notice
                </Typography>
                <Typography id="exam-permit-error-description" sx={{ mt: 2 }}>
                  {examPermitError}
                </Typography>
                <Button
                  onClick={handleCloseExamPermitModal}
                  variant="contained"
                  sx={{ mt: 3, backgroundcolor: mainButtonColor, "&:hover": { backgroundColor: "#8B0000" } }}
                >
                  Close
                </Button>
              </Box>
            </Modal>




            <Box display="flex" justifyContent="space-between" mt={4}>
              {/* Previous Page Button */}
              <Button
                variant="contained"
                onClick={() => navigate(`/dashboard/${keys.step4}`)} // ✅ FIXED to use step4 key
                startIcon={
                  <ArrowBackIcon
                    sx={{
                      color: "#000",
                      transition: "color 0.3s",
                    }}
                  />
                }
                sx={{
                  backgroundColor: subButtonColor,
                  border: `2px solid ${borderColor}`,
                  color: "#000",
                  "&:hover": {
                    backgroundColor: "#000000",
                    color: "#fff",
                    "& .MuiSvgIcon-root": {
                      color: "#fff",
                    },
                  },
                }}
              >
                Previous Step
              </Button>
              <Button
                variant="contained"
                onClick={submitFinalApplication}
                endIcon={<FolderIcon sx={{ color: "#fff" }} />}
                sx={{
                  backgroundColor: mainButtonColor,
                  border: `2px solid ${borderColor}`,
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "#000000",
                    "& .MuiSvgIcon-root": { color: "#fff" },
                  },
                }}
              >
                Submit (Save Information)
              </Button>

            </Box>


            <Snackbar
              open={snackbar.open}
              autoHideDuration={3000} // 3 seconds
              onClose={handleCloseSnackbar}
              anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
              <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                {snackbar.message}
              </Alert>
            </Snackbar>



          </Container>

        </form>

      </Container>


    </Box>

  );
};


export default Dashboard5;