import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ApplicantExamPermit from "../components/ApplicantExamPermit";
import {
  TextField,
  Button,
  Box,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import QRScanner from "./QRScanner";
import API_BASE_URL from "../apiConfig";

const ApplicantProfile = () => {
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
  
  const { applicantNumber } = useParams();
  const navigate = useNavigate();

  const [personId, setPersonId] = useState(null);
  const [searchQuery, setSearchQuery] = useState(applicantNumber || "");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "info",
  });

  const showSnackbar = (message, type = "info") => {
    setSnackbar({ open: true, message, type });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // 🔁 Auto-load when URL has applicant number
  useEffect(() => {
    if (applicantNumber) {
      setHasSearched(true);
      setSearchQuery(applicantNumber);
      fetchApplicantData(applicantNumber);
    }
  }, [applicantNumber]);

  const [finalDocsCompleted, setFinalDocsCompleted] = useState(false);

  const fetchSubmittedDocuments = async (pid) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/applicant-documents/${pid}`);

      if (Array.isArray(res.data)) {
        const allSubmitted = res.data.every(doc => Number(doc.submitted_documents) === 1);

        setFinalDocsCompleted(allSubmitted);

        if (allSubmitted) {
          showSnackbar("📄 You may now proceed to your respective college to tag your subjects and schedule.", "success");

        }
      }
    } catch (err) {
      console.error("Error fetching requirements:", err);
    }
  };


  const fetchApplicantData = async (query) => {
    if (!query) return;

    try {
      // 1️⃣ Get person_id by applicant_number
      const res = await axios.get(`${API_BASE_URL}/api/person-by-applicant/${query}`);
      if (!res.data?.person_id) {
        showSnackbar("❌ Applicant not found.", "error");
        setPersonId(null);
        return;
      }

      const pid = res.data.person_id;

      // 2️⃣ Check document verification
      const verifiedRes = await axios.get(`${API_BASE_URL}/api/document_status/check/${query}`);
      if (!verifiedRes.data.verified) {
        showSnackbar("❌ Documents not yet verified. Not qualified for exam.", "error");
        setPersonId(null);
        return;
      }

      // 3️⃣ Get applicant scores
      const scoreRes = await axios.get(`${API_BASE_URL}/api/applicant-scores/${query}`);

      const {
        entrance_exam_score,
        qualifying_result,
        interview_result
      } = scoreRes.data || {};

      // 🧮 Determine current applicant status
      if (!entrance_exam_score) {
        showSnackbar(
          "📝 Documents verified. This applicant can proceed with taking the Entrance Examination.",
          "info"
        );
      }
      else if (entrance_exam_score && !qualifying_result) {
        showSnackbar(
          "✅ Applicant passed Entrance Exam. Proceed to Qualifying Examination.",
          "success"
        );
      }
      else if (qualifying_result && !interview_result) {
        showSnackbar(
          "✅ Applicant passed Qualifying Exam. Proceed to Interview.",
          "success"
        );
      }
      else if (interview_result) {
        showSnackbar(
          "🏁 Applicant has completed Entrance, Qualifying, and Interview Exams.",
          "success"
        );
      }

      // 4️⃣ Check acceptance (medical step)
      const statusRes = await axios.get(`${API_BASE_URL}/api/applicant-status/${query}`);
      if (statusRes.data?.found && statusRes.data.status === "Accepted") {
        showSnackbar("🎉 Applicant ACCEPTED! Proceed to Medical.", "success");

        // 🚀 FETCH FINAL DOCUMENT SUBMISSION STATUS
        fetchSubmittedDocuments(pid);

        setPersonId(pid);
        return;
      }

      // 🚀 FETCH FINAL DOCUMENT SUBMISSION STATUS (even if not yet accepted)
      fetchSubmittedDocuments(pid);

      setPersonId(pid);

    } catch (err) {
      console.error("Error fetching applicant:", err);
      showSnackbar("⚠️ Error fetching applicant data. Check console for details.", "error");
      setPersonId(null);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setHasSearched(true);

    // ✅ stays on VITE (5173)
    navigate(`/applicant_profile/${searchQuery.trim()}`);
    fetchApplicantData(searchQuery.trim());
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 150px)",
        overflowY: "auto",
        backgroundColor: "transparent",
        p: 2,
        mt: 2
      }}
    >
      <Typography
        variant="h4"
        sx={{ fontWeight: "bold", color: "maroon", mb: 2 }}
      >
        APPLICANT PROFILE
      </Typography>
      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="Enter Applicant Number"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
        />

        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<CameraAltIcon />}
          onClick={() => setScannerOpen(true)}
        >
          Scan QR
        </Button>
      </Box>

      {/* QR Scanner */}
      <QRScanner
        open={scannerOpen}
        onScan={(text) => {
          let scanned = String(text || "").trim();
          if (scanned.includes("/")) scanned = scanned.split("/").pop();

          setScannerOpen(false);
          setSearchQuery(scanned);
          setHasSearched(true);
          navigate(`/applicant_profile/${scanned}`);
          fetchApplicantData(scanned);
        }}
        onClose={() => setScannerOpen(false)}
      />

      {/* RESULT */}
      {hasSearched && (
        <>
          {personId ? (
            <ApplicantExamPermit personId={personId} />
          ) : (
            <Typography color="error">
              Invalid Applicant Number
            </Typography>
          )}
        </>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.type} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ApplicantProfile;
