import React, {
  createContext,
  useState,
  useEffect,
  Suspense,
  lazy,
} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Box,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import axios from "axios";
import "./App.css";
import Clock from "./components/Clock";

// COMPONENTS FOLDER
import ProtectedRoute, { isTokenValid } from "./components/ProtectedRoute";

import API_BASE_URL from "./apiConfig";
import StudentListForEnrollment from "./registrar/StudentListForEnrollment";
import ApplicationProcessAdmin from "./superadmin/ApplicationProcessAdmin";

// ✅ Create a Context so all components can access settings
export const SettingsContext = createContext(null);

const Unauthorized = lazy(() => import("./components/Unauthorized"));
const Register = lazy(() => import("./components/Register"));
// const AdminRegistrationControl = lazy(() => import("./components/AdminRegistrationControl"));
const Login = lazy(() => import("./components/Login"));
const LoginEnrollment = lazy(() => import("./components/LoginEnrollment"));
const ApplicantForgotPassword = lazy(
  () => import("./components/ApplicantForgotPassword"),
);
const RegistrarForgotPassword = lazy(
  () => import("./components/RegistrarForgotPassword"),
);
const SideBar = lazy(() => import("./components/Sidebar"));
const ApplicantProfile = lazy(() => import("./components/ApplicantProfile"));
const ApplicantProfilePermit = lazy(
  () => import("./components/ApplicantProfile"),
);
const AnnouncementSlider = lazy(
  () => import("./components/AnnouncementSlider"),
);
const CourseManagement = lazy(() => import("./pages/CourseManagement"));
const DepartmentManagement = lazy(() => import("./pages/DepartmentDashboard"));
const AdmissionDashboardPanel = lazy(
  () => import("./pages/AdmissionDashboard"),
);
const SystemDashboardPanel = lazy(() => import("./pages/SystemDashboard"));
const FacultyDashboard = lazy(() => import("./pages/FacultyDashboard"));
const RegistrarDashboard = lazy(() => import("./pages/RegistrarDashboard"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const ApplicantDashboard = lazy(() => import("./pages/ApplicantDashboard"));
const AccountDashboard = lazy(() => import("./pages/AccountDashboard"));
const ScheduleFilterer = lazy(() => import("./pages/SchedulePlottingFilter"));
const HistoryLogs = lazy(() => import("./pages/HistoryLogs"));
const EnrollmentOfficerDashboard = lazy(
  () => import("./pages/EnrollmentOfficerDashboard"),
);
const AdmissionOfficerDashboard = lazy(
  () => import("./pages/AdmissionOfficerDashboard"),
);
const StudentQrInfo = lazy(() => import("./pages/StudentQrInfo"));
const GradingSheet = lazy(() => import("./faculty/GradingSheet"));
const FacultyWorkload = lazy(() => import("./faculty/FacultyWorkload"));
const FacultyMasterList = lazy(() => import("./faculty/FacultyMasterlist"));
const ProgramEvaluation = lazy(() => import("./registrar/ProgramEvaluation"));
const FacultyResetPassword = lazy(
  () => import("./faculty/FacultyResetPassword"),
);
const FacultyEvaluation = lazy(() => import("./faculty/FacultyEvaluation"));
const SearchCertificateOfRegistration = lazy(
  () => import("./registrar/SearchCertificateOfRegistration"),
);
const AdminECATApplicationForm = lazy(
  () => import("./registrar/AdminECATApplicationForm"),
);
const AdminPersonalDataForm = lazy(
  () => import("./registrar/AdminPersonalDataForm"),
);
const AdminOfficeOfTheRegistrar = lazy(
  () => import("./registrar/AdminOfficeOfTheRegistrar"),
);
const AdminAdmissionFormProcess = lazy(
  () => import("./registrar/AdminAdmissionFormProcess"),
);
const AdminDashboard1 = lazy(() => import("./registrar/AdminDashboard1"));
const AdminDashboard2 = lazy(() => import("./registrar/AdminDashboard2"));
const AdminDashboard3 = lazy(() => import("./registrar/AdminDashboard3"));
const AdminDashboard4 = lazy(() => import("./registrar/AdminDashboard4"));
const AdminDashboard5 = lazy(() => import("./registrar/AdminDashboard5"));
const RegistrarDashboard1 = lazy(
  () => import("./registrar/RegistrarDashboard1"),
);
const RegistrarDashboard2 = lazy(
  () => import("./registrar/RegistrarDashboard2"),
);
const RegistrarDashboard3 = lazy(
  () => import("./registrar/RegistrarDashboard3"),
);
const RegistrarDashboard4 = lazy(
  () => import("./registrar/RegistrarDashboard4"),
);
const RegistrarDashboard5 = lazy(
  () => import("./registrar/RegistrarDashboard5"),
);
const ApplicantList = lazy(() => import("./registrar/ApplicantList"));
const ApplicantListAdmin = lazy(() => import("./registrar/ApplicantListAdmin"));
const StudentRequirements = lazy(
  () => import("./registrar/StudentRequirements"),
);
const RegistrarRequirements = lazy(
  () => import("./registrar/RegistrarRequirements"),
);
const RegistrarExaminationProfile = lazy(
  () => import("./registrar/RegistrarExaminationProfile"),
);
const AssignScheduleToApplicants = lazy(
  () => import("./registrar/AssignScheduleToApplicants"),
);
const AssignEntranceExam = lazy(() => import("./registrar/AssignEntranceExam"));
const AdmissionScheduleTile = lazy(
  () => import("./registrar/AdmissionScheduleTile"),
);
const EnrollmentScheduleTile = lazy(
  () => import("./registrar/EnrollmentScheduleTile"),
);
const ProctorApplicantList = lazy(
  () => import("./registrar/ProctorApplicantList"),
);
const ApplicantScoring = lazy(() => import("./registrar/ApplicantScoring"));
const QualifyingInterviewExamScore = lazy(
  () => import("./registrar/QualifyingInterviewExamScore"),
);
const QualifyingInterviewerApplicantList = lazy(
  () => import("./registrar/QualifyingInterviewerApplicantList"),
);
const AssignQualifyingInterviewExam = lazy(
  () => import("./registrar/AssignQualifyingInterviewExam"),
);
const AssignScheduleToApplicantsQualifyingInterviewer = lazy(
  () => import("./registrar/AssignScheduleToApplicantsQualifyingInterviewer"),
);
const ClassRoster = lazy(() => import("./registrar/ClassRoster"));
const ClassRosterForEnrollment = lazy(() => import("./registrar/ClassRosterForEnrollment"));
const DepartmentRegistration = lazy(
  () => import("./registrar/DprtmntRegistration"),
);
const DepartmentRoom = lazy(() => import("./registrar/DprtmntRoom"));
const ProgramTagging = lazy(() => import("./registrar/ProgramTagging"));
const CoursePanel = lazy(() => import("./registrar/CoursePanel"));
const ProgramPanel = lazy(() => import("./registrar/ProgramPanel"));
const CurriculumPanel = lazy(() => import("./registrar/CurriculumPanel"));
const SectionPanel = lazy(() => import("./registrar/SectionPanel"));
const DepartmentSection = lazy(() => import("./registrar/DepartmentSection"));
const YearLevelPanel = lazy(() => import("./registrar/YearLevelPanel"));
const YearPanel = lazy(() => import("./registrar/YearPanel"));
const YearUpdateForm = lazy(() => import("./registrar/YearUpdateForm"));
const SemesterPanel = lazy(() => import("./registrar/SemesterPanel"));
const SchoolYearPanel = lazy(() => import("./registrar/SchoolYearPanel"));
const SchoolYearActivatorPanel = lazy(
  () => import("./registrar/SchoolYearActivatorPanel"),
);
const RequirementsForm = lazy(() => import("./registrar/RequirementsForm"));
const StudentNumbering = lazy(() => import("./registrar/StudentNumbering"));
const StudentNumberingPerCollege = lazy(
  () => import("./registrar/StudentNumberingPerCollege"),
);
const CourseTagging = lazy(() => import("./registrar/CourseTagging"));
const ChangeGradingPeriod = lazy(() => import("./registrar/ChangeYearGradPer"));
const ScheduleChecker = lazy(() => import("./registrar/ScheduleChecker"));
const RoomRegistration = lazy(() => import("./registrar/RoomRegistration"));
const RegistrarExamPermit = lazy(
  () => import("./registrar/RegistrarExamPermit"),
);
const ReportOfGrade = lazy(() => import("./registrar/ReportOfGrade"));
const TranscriptOfRecords = lazy(
  () => import("./registrar/TranscriptOfRecords"),
);
const EvaluationCRUD = lazy(() => import("./registrar/EvaluationCrud"));
const DepartmentCurriculumPanel = lazy(
  () => import("./registrar/DepartmentCurriculumPanel"),
);
const MedicalApplicantList = lazy(
  () => import("./registrar/MedicalApplicantList"),
);
const MedicalRequirementsForm = lazy(
  () => import("./registrar/MedicalRequirementsForm"),
);
const DentalAssessment = lazy(() => import("./registrar/DentalAssessment"));
const PhysicalNeuroExam = lazy(() => import("./registrar/PhysicalNeuroExam"));
const MedicalDashboard1 = lazy(() => import("./registrar/MedicalDashboard1"));
const MedicalDashboard2 = lazy(() => import("./registrar/MedicalDashboard2"));
const MedicalDashboard3 = lazy(() => import("./registrar/MedicalDashboard3"));
const MedicalDashboard4 = lazy(() => import("./registrar/MedicalDashboard4"));
const MedicalDashboard5 = lazy(() => import("./registrar/MedicalDashboard5"));
const MedicalRequirements = lazy(
  () => import("./registrar/MedicalRequirements"),
);
const MedicalCertificate = lazy(() => import("./registrar/MedicalCertificate"));
const HealthRecord = lazy(() => import("./registrar/HealthRecord"));
const ReadmissionDashboard1 = lazy(
  () => import("./registrar/ReadmissionDashboard1"),
);
const ReadmissionDashboard2 = lazy(
  () => import("./registrar/ReadmissionDashboard2"),
);
const ReadmissionDashboard3 = lazy(
  () => import("./registrar/ReadmissionDashboard3"),
);
const ReadmissionDashboard4 = lazy(
  () => import("./registrar/ReadmissionDashboard4"),
);
const ReadmissionDashboard5 = lazy(
  () => import("./registrar/ReadmissionDashboard5"),
);
const AnnouncementForAdmission = lazy(
  () => import("./registrar/AnnouncementForAdmission"),
);
const StudentList = lazy(() => import("./registrar/StudentList"));
const SubmittedDocuments = lazy(() => import("./registrar/SubmittedDocuments"));
const ProgramSlotLimit = lazy(() => import("./registrar/ProgramSlotLimit"));
const GradingEvaluationForRegistrar = lazy(
  () => import("./registrar/GradingEvaluationForRegistrar"),
);
const ProgramPayment = lazy(() => import("./registrar/ProgramPayment"));
const Prerequisite = lazy(() => import("./registrar/Prerequisite"));
const ProgramUnit = lazy(() => import("./registrar/ProgramUnit"));
const EvaluatorApplicantList = lazy(
  () => import("./registrar/EvaluatorApplicantList"),
);
const EvaluatorScheduleTile = lazy(
  () => import("./registrar/EvaluatorScheduleTile"),
);
const Dashboard1 = lazy(() => import("./applicant/Dashboard1"));
const Dashboard2 = lazy(() => import("./applicant/Dashboard2"));
const Dashboard3 = lazy(() => import("./applicant/Dashboard3"));
const Dashboard4 = lazy(() => import("./applicant/Dashboard4"));
const Dashboard5 = lazy(() => import("./applicant/Dashboard5"));
const RequirementUploader = lazy(
  () => import("./applicant/RequirementUploader"),
);
const PersonalDataForm = lazy(() => import("./applicant/PersonalDataForm"));
const ECATApplicationForm = lazy(
  () => import("./applicant/ECATApplicationForm"),
);
const AdmissionFormProcess = lazy(
  () => import("./applicant/AdmissionFormProcess"),
);
const AdmissionServices = lazy(() => import("./applicant/AdmissionServices"));
const OfficeOfTheRegistrar = lazy(
  () => import("./applicant/OfficeOfTheRegistrar"),
);
const ExamPermit = lazy(() => import("./applicant/ExamPermit"));
const ApplicantResetPassword = lazy(
  () => import("./applicant/ApplicantResetPassword"),
);
const StudentSchedule = lazy(() => import("./student/StudentSchedule"));
const StudentGradingPage = lazy(() => import("./student/StudentGrade"));
const StudentFacultyEvaluation = lazy(
  () => import("./student/StudentFacultyEval"),
);
const StudentDashboard1 = lazy(() => import("./student/StudentDashboard1"));
const StudentDashboard2 = lazy(() => import("./student/StudentDashboard2"));
const StudentDashboard3 = lazy(() => import("./student/StudentDashboard3"));
const StudentDashboard4 = lazy(() => import("./student/StudentDashboard4"));
const StudentDashboard5 = lazy(() => import("./student/StudentDashboard5"));
const StudentResetPassword = lazy(
  () => import("./student/StudentResetPassword"),
);
const CertificateOfRegistration = lazy(
  () => import("./student/CertificateOfRegistration"),
);
const StudentECATApplicationForm = lazy(
  () => import("./student/StudentECATApplicationForm"),
);
const StudentOfficeOfTheRegistrar = lazy(
  () => import("./student/StudentOfficeOfTheRegistrar"),
);
const StudentPersonalDataForm = lazy(
  () => import("./student/StudentPersonalDataForm"),
);
const StudentAdmissionServices = lazy(
  () => import("./student/StudentAdmissionServices"),
);
const StudentAdmissionFormProcess = lazy(
  () => import("./student/StudentAdmissionFormProcess"),
);
const EmailTemplateManager = lazy(
  () => import("./superadmin/EmailTemplateManager"),
);
const Announcement = lazy(() => import("./superadmin/Announcement"));
const MigrationDataPanel = lazy(
  () => import("./superadmin/MigrationDataPanel"),
);
const SuperAdminApplicantList = lazy(
  () => import("./superadmin/SuperAdminApplicantList"),
);
const SuperAdminApplicantDashboard1 = lazy(
  () => import("./superadmin/SuperAdminApplicantDashboard1"),
);
const SuperAdminApplicantDashboard2 = lazy(
  () => import("./superadmin/SuperAdminApplicantDashboard2"),
);
const SuperAdminApplicantDashboard3 = lazy(
  () => import("./superadmin/SuperAdminApplicantDashboard3"),
);
const SuperAdminApplicantDashboard4 = lazy(
  () => import("./superadmin/SuperAdminApplicantDashboard4"),
);
const SuperAdminApplicantDashboard5 = lazy(
  () => import("./superadmin/SuperAdminApplicantDashboard5"),
);
const SuperAdminRequirementsUploader = lazy(
  () => import("./superadmin/SuperAdminRequirementsUploader"),
);
const SignatureUpload = lazy(() => import("./superadmin/SignatureUpload"));
const SuperAdminStudentDashboard1 = lazy(
  () => import("./superadmin/SuperAdminStudentDashboard1"),
);
const SuperAdminStudentDashboard2 = lazy(
  () => import("./superadmin/SuperAdminStudentDashboard2"),
);
const SuperAdminStudentDashboard3 = lazy(
  () => import("./superadmin/SuperAdminStudentDashboard3"),
);
const SuperAdminStudentDashboard4 = lazy(
  () => import("./superadmin/SuperAdminStudentDashboard4"),
);
const SuperAdminStudentDashboard5 = lazy(
  () => import("./superadmin/SuperAdminStudentDashboard5"),
);
const SuperAdminApplicantResetPassword = lazy(
  () => import("./superadmin/SuperAdminApplicantResetPassword"),
);
const SuperAdminStudentResetPassword = lazy(
  () => import("./superadmin/SuperAdminStudentResetPassword"),
);
const SuperAdminFacultyResetPassword = lazy(
  () => import("./superadmin/SuperAdminFacultyResetPassword"),
);
const SuperAdminRegistrarPassword = lazy(
  () => import("./superadmin/SuperAdminRegistrarResetPassword"),
);
const SuperAdminProfessorEducation = lazy(
  () => import("./superadmin/SuperAdminProfessorEducation"),
);
const Notifications = lazy(() => import("./superadmin/Notifications"));
const RegistrarResetPassword = lazy(
  () => import("./superadmin/RegistrarResetPassword"),
);
const RegisterProf = lazy(() => import("./superadmin/RegisterProf"));
const RegisterRegistrar = lazy(() => import("./superadmin/RegisterRegistrar"));
const RegisterStudent = lazy(() => import("./superadmin/RegisterStudent"));
const PageCRUD = lazy(() => import("./superadmin/PageCRUD"));
const UserPageAccess = lazy(() => import("./superadmin/UserPageAccess"));
const Settings = lazy(() => import("./superadmin/Settings"));
const SuperAdminRoomRegistration = lazy(
  () => import("./superadmin/SuperAdminRoomRegistration"),
);
const CollegeScheduleChecker = lazy(
  () => import("./registrar/CollegeScheduleChecker"),
);
const StudentGradeFile = lazy(() => import("./superadmin/StudentGradeFile"));
const PaymentExportingModule = lazy(
  () => import("./superadmin/PaymentExportingModule"),
);
const CORExportingModule = lazy(
  () => import("./superadmin/CORExportingModule"),
);
const VerifyDocumentsSchedule = lazy(
  () => import("./registrar/VerifyDocumentsSchedule"),
);
const VerifyApplicantDocumentSchedule = lazy(
  () => import("./registrar/VerifySchedule"),
);
const StudentScholarshipList = lazy(
  () => import("./superadmin/StudentScholarshipList"),
);
const TOSFCrud = lazy(() => import("./superadmin/TOSFCrud"));
const Receipt = lazy(() => import("./superadmin/Receipt"));
const ReceiptCounterAssignment = lazy(
  () => import("./superadmin/ReceiptCounterAssignment"),
);
const MatriculationPaymentModule = lazy(
  () => import("./superadmin/MatriculationPaymentModule"),
);
const SectionSlotMonitoring = lazy(() => import("./superadmin/SlotMonitoring"));
const SearchCorForCollege = lazy(
  () => import("./registrar/SearchCorForCollege"),
);
const CertificateOfRegistrationForCollege = lazy(
  () => import("./registrar/CertificateOfRegistrationForCollege"),
);
const OfficialStudentDashboard1 = lazy(
  () => import("./registrar/OfficialStudentDashboard1"),
);
const OfficialStudentDashboard2 = lazy(
  () => import("./registrar/OfficialStudentDashboard2"),
);
const OfficialStudentDashboard3 = lazy(
  () => import("./registrar/OfficialStudentDashboard3"),
);
const OfficialStudentDashboard4 = lazy(
  () => import("./registrar/OfficialStudentDashboard4"),
);
const OfficialStudentDashboard5 = lazy(
  () => import("./registrar/OfficialStudentDashboard5"),
);
const OfficialRequirements = lazy(
  () => import("./registrar/OfficialRequirements"),
);
const AdminBranches = lazy(
  () => import("./superadmin/AdminBranches"),
);

const CourseTaggingForCollege = lazy(
  () => import("./registrar/CourseTaggingForCollege"),
);
const CourseTaggingForSummer = lazy(
  () => import("./registrar/CourseTaggingForSummer"),
);
const LoadingOverlay = lazy(() => import("./components/LoadingOverlay"));



function App() {
  const getCachedSettings = () => {
    try {
      const raw = localStorage.getItem("app_settings_cache");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return {
        ...parsed,
        branches:
          typeof parsed.branches === "string"
            ? JSON.parse(parsed.branches)
            : parsed.branches || [],
      };
    } catch {
      return null;
    }
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState(() => getCachedSettings());
  const [settingsReady, setSettingsReady] = useState(() =>
    Boolean(getCachedSettings()),
  );
  const [profileImage, setProfileImage] = useState(null);
  const [logoVersion, setLogoVersion] = useState(Date.now());

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/settings`);
      const data = response.data;

      setSettings({
        ...data,
        branches:
          typeof data.branches === "string"
            ? JSON.parse(data.branches)
            : data.branches || [],
      });
      localStorage.setItem("app_settings_cache", JSON.stringify(data));

      setLogoVersion(Date.now());
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setSettingsReady(true);
    }
  };

  const clearAuthStorage = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("person_id");
    localStorage.removeItem("employee_id");
    localStorage.removeItem("department");
    localStorage.removeItem("lastVisitedPath");
  };

  const getDefaultDashboardByRole = (role) => {
    switch (role) {
      case "applicant":
        return "/applicant_dashboard";
      case "student":
        return "/student_dashboard";
      case "faculty":
        return "/faculty_dashboard";
      case "registrar":
        return "/registrar_dashboard";
      case "superadmin":
        return "/system_dashboard";
      default:
        return "/registrar_dashboard";
    }
  };

  const getLastVisitedPath = () => {
    const path = localStorage.getItem("lastVisitedPath");
    if (!path || typeof path !== "string") return null;
    if (!path.startsWith("/")) return null;

    const disallowedPublicPaths = new Set([
      "/",
      "/login",
      "/login_applicant",
      "/register",
      "/announcement_slider",
      "/applicant_forgot_password",
      "/forgot_password",
    ]);

    return disallowedPublicPaths.has(path) ? null : path;
  };

  const PublicOnlyRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (isTokenValid(token)) {
      const targetPath =
        getLastVisitedPath() || getDefaultDashboardByRole(role);
      return <Navigate to={targetPath} replace />;
    }

    return children;
  };

  useEffect(() => {
    fetchSettings();

    // Auto-refresh when settings change in Settings.jsx
    const handleStorageChange = () => fetchSettings();
    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ✅ Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (isTokenValid(token)) {
      setIsAuthenticated(true);
      return;
    }

    clearAuthStorage();
    setIsAuthenticated(false);
  }, []);



  // ✅ Listen for custom 'settingsUpdated' event
  useEffect(() => {
    const handleSettingsUpdate = () => fetchSettings();
    window.addEventListener("settingsUpdated", handleSettingsUpdate);

    return () =>
      window.removeEventListener("settingsUpdated", handleSettingsUpdate);
  }, []);

  const theme = createTheme({
    typography: {
      fontFamily: "Poppins, sans-serif",
    },
  });

  const keys = JSON.parse(localStorage.getItem("dashboardKeys") || "{}");

  if (!settingsReady) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* ✅ Wrap entire app with SettingsContext.Provider */}
      <SettingsContext.Provider value={settings}>
        <Suspense
          fallback={
            <Box
              sx={{
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              <Typography variant="h6">Loading page...</Typography>
            </Box>
          }
        >
          <Router>
            {/* ✅ Layout container */}
            <div className="flex flex-col min-h-screen">
              {/* ✅ Top section (Sidebar + AppBar + Content) */}
              <div className="flex flex-1">
                {/* Sidebar */}
                {isAuthenticated && (
                  <>
                    <aside className="w-[290px] shrink-0">
                      <SideBar
                        setIsAuthenticated={setIsAuthenticated}
                        profileImage={profileImage}
                        setProfileImage={setProfileImage}
                      />
                    </aside>
                  </>
                )}

                {/* Main area */}
                <div className="flex-1 flex flex-col">
                  {/* Navbar */}
                  <AppBar
                    position="fixed"
                    sx={{
                      zIndex: (theme) => theme.zIndex.drawer + 1,
                      bgcolor: settings?.header_color || "#1976d2",
                    }}
                  >
                    <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>

                      {/* LEFT SIDE (logo + title) */}
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {settings?.logo_url && (
                          <img
                            src={`${API_BASE_URL}${settings.logo_url}?t=${Date.now()}`}
                            alt="Logo"
                            style={{
                              height: "55px",
                              width: "55px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              marginRight: "12px",
                              cursor: "pointer",
                              border: "2px solid white",
                            }}
                            onClick={() => window.location.reload()}
                          />
                        )}

                        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                          <span style={{ fontFamily: "Poppins, sans-serif", fontSize: "28px" }}>
                            {settings?.short_term || "SCHOOL NAME"} -
                          </span>{" "}
                          <span style={{ fontFamily: "Poppins, sans-serif", fontSize: "24px" }}>
                            {settings?.company_name || "SCHOOL NAME"}
                          </span>
                        </Typography>
                      </Box>

                      {/* RIGHT SIDE (TIME + DATE) */}
                      <Box sx={{ textAlign: "right" }}>

                        <Typography sx={{ fontSize: "14px" }}>
                          <Clock />
                        </Typography>
                      </Box>

                    </Toolbar>
                  </AppBar>

                  {/* ✅ Main content area */}
                  <main className="flex-1 w-full mt-[64px] pb-[40px]">
                    {/* Add your routes here later */}

                    <Routes>
                      <Route
                        path="/"
                        element={
                          <PublicOnlyRoute>
                            <LoginEnrollment
                              setIsAuthenticated={setIsAuthenticated}
                            />
                          </PublicOnlyRoute>
                        }
                      />
                      <Route
                        path="/login_applicant"
                        element={
                          <PublicOnlyRoute>
                            <Login setIsAuthenticated={setIsAuthenticated} />
                          </PublicOnlyRoute>
                        }
                      />
                      <Route
                        path="/login"
                        element={
                          <PublicOnlyRoute>
                            <LoginEnrollment
                              setIsAuthenticated={setIsAuthenticated}
                            />
                          </PublicOnlyRoute>
                        }
                      />
                      <Route path="/register" element={<Register />} />

                      <Route
                        path="/announcement_slider"
                        element={<AnnouncementSlider />}
                      />
                      <Route
                        path="/applicant_forgot_password"
                        element={<ApplicantForgotPassword />}
                      />
                      {/* <Route
                        path="/admin_registration_control"
                        element={
                          <ProtectedRoute>
                            <AdminRegistrationControl />
                          </ProtectedRoute>
                        }
                      /> */}
                      <Route
                        path="/applicant_reset_password"
                        element={
                          <ProtectedRoute>
                            <ApplicantResetPassword />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/forgot_password"
                        element={<RegistrarForgotPassword />}
                      />
                      <Route
                        path="/registrar_reset_password"
                        element={
                          <ProtectedRoute>
                            <RegistrarResetPassword />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/student_reset_password"
                        element={
                          <ProtectedRoute>
                            <StudentResetPassword />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/faculty_reset_password"
                        element={
                          <ProtectedRoute>
                            <FacultyResetPassword />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/superadmin_applicant_reset_password"
                        element={
                          <ProtectedRoute>
                            <SuperAdminApplicantResetPassword />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/superadmin_student_reset_password"
                        element={
                          <ProtectedRoute>
                            <SuperAdminStudentResetPassword />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/superadmin_faculty_reset_password"
                        element={
                          <ProtectedRoute>
                            <SuperAdminFacultyResetPassword />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/superadmin_registrar_reset_password"
                        element={
                          <ProtectedRoute>
                            <SuperAdminRegistrarPassword />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/superadmin_professor_education"
                        element={
                          <ProtectedRoute>
                            <SuperAdminProfessorEducation />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/signature_upload"
                        element={
                          <ProtectedRoute>
                            <SignatureUpload />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/registrar_dashboard"
                        element={
                          <ProtectedRoute>
                            <RegistrarDashboard
                              profileImage={profileImage}
                              setProfileImage={setProfileImage}
                            />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/faculty_dashboard"
                        element={
                          <ProtectedRoute allowedRoles={["faculty"]}>
                            <FacultyDashboard
                              profileImage={profileImage}
                              setProfileImage={setProfileImage}
                            />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/applicant_dashboard"
                        element={
                          <ProtectedRoute>
                            <ApplicantDashboard
                              profileImage={profileImage}
                              setProfileImage={setProfileImage}
                            />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/register_prof"
                        element={
                          <ProtectedRoute>
                            <RegisterProf />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/register_registrar"
                        element={
                          <ProtectedRoute>
                            <RegisterRegistrar />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/register_student"
                        element={
                          <ProtectedRoute>
                            <RegisterStudent />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/room_registration"
                        element={
                          <ProtectedRoute>
                            <RoomRegistration />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/course_management"
                        element={
                          <ProtectedRoute>
                            <CourseManagement />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/program_tagging"
                        element={
                          <ProtectedRoute>
                            <ProgramTagging />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/course_panel"
                        element={
                          <ProtectedRoute>
                            <CoursePanel />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/program_panel"
                        element={
                          <ProtectedRoute>
                            <ProgramPanel />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/department_section_panel"
                        element={
                          <ProtectedRoute>
                            <DepartmentSection />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/curriculum_panel"
                        element={
                          <ProtectedRoute>
                            <CurriculumPanel />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/department_registration"
                        element={
                          <ProtectedRoute>
                            <DepartmentRegistration />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/section_panel"
                        element={
                          <ProtectedRoute>
                            <SectionPanel />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/year_level_panel"
                        element={
                          <ProtectedRoute>
                            <YearLevelPanel />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/year_panel"
                        element={
                          <ProtectedRoute>
                            <YearPanel />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/year_update_panel"
                        element={
                          <ProtectedRoute>
                            <YearUpdateForm />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/semester_panel"
                        element={
                          <ProtectedRoute>
                            <SemesterPanel />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/school_year_panel"
                        element={
                          <ProtectedRoute>
                            <SchoolYearPanel />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/school_year_activator_panel"
                        element={
                          <ProtectedRoute>
                            <SchoolYearActivatorPanel />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/history_logs"
                        element={
                          <ProtectedRoute>
                            <HistoryLogs />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/enrollment_officer_dashboard"
                        element={
                          <ProtectedRoute>
                            <EnrollmentOfficerDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admission_officer_dashboard"
                        element={
                          <ProtectedRoute>
                            <AdmissionOfficerDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/grading_evaluation_for_registrar"
                        element={
                          <ProtectedRoute>
                            <GradingEvaluationForRegistrar />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/submitted_documents"
                        element={
                          <ProtectedRoute>
                            <SubmittedDocuments />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/requirements_form"
                        element={
                          <ProtectedRoute>
                            <RequirementsForm />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admission_dashboard"
                        element={
                          <ProtectedRoute>
                            <AdmissionDashboardPanel />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/department_dashboard"
                        element={
                          <ProtectedRoute>
                            <DepartmentManagement />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/system_dashboard"
                        element={
                          <ProtectedRoute>
                            <SystemDashboardPanel />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/account_dashboard"
                        element={
                          <ProtectedRoute>
                            <AccountDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_numbering"
                        element={
                          <ProtectedRoute>
                            <StudentNumbering />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_numbering_per_college"
                        element={
                          <ProtectedRoute>
                            <StudentNumberingPerCollege />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/course_tagging"
                        element={
                          <ProtectedRoute>
                            <CourseTagging />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/course_tagging_for_college"
                        element={
                          <ProtectedRoute>
                            <CourseTaggingForCollege />
                          </ProtectedRoute>
                        }
                      />
                       <Route
                        path="/course_tagging_for_summer"
                        element={
                          <ProtectedRoute>
                            <CourseTaggingForSummer />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/schedule_checker/:dprtmnt_id"
                        element={
                          <ProtectedRoute>
                            <ScheduleChecker />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/change_grade_period"
                        element={
                          <ProtectedRoute>
                            <ChangeGradingPeriod />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/department_room"
                        element={
                          <ProtectedRoute>
                            <DepartmentRoom />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/search_cor"
                        element={
                          <ProtectedRoute>
                            <SearchCertificateOfRegistration />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/search_cor_for_college"
                        element={
                          <ProtectedRoute>
                            <SearchCorForCollege />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/cor"
                        element={
                          <ProtectedRoute>
                            <CertificateOfRegistration />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/cor_for_college"
                        element={
                          <ProtectedRoute>
                            <CertificateOfRegistrationForCollege />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/select_college"
                        element={
                          <ProtectedRoute>
                            <ScheduleFilterer />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/college_schedule_plotting"
                        element={
                          <ProtectedRoute>
                            <CollegeScheduleChecker />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/assign_entrance_exam"
                        element={
                          <ProtectedRoute>
                            <AssignEntranceExam />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/assign_schedule_applicant"
                        element={
                          <ProtectedRoute>
                            <AssignScheduleToApplicants />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/verify_schedule"
                        element={
                          <ProtectedRoute>
                            <VerifyApplicantDocumentSchedule />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admission_schedule_room_list"
                        element={
                          <ProtectedRoute>
                            <AdmissionScheduleTile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/enrollment_schedule_room_list"
                        element={
                          <ProtectedRoute>
                            <EnrollmentScheduleTile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/applicant_scoring"
                        element={
                          <ProtectedRoute>
                            <ApplicantScoring />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/evaluator_schedule_room_list"
                        element={
                          <ProtectedRoute>
                            <EvaluatorScheduleTile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/evaluator_applicant_list"
                        element={
                          <ProtectedRoute>
                            <EvaluatorApplicantList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/assign_qualifying_interview_exam"
                        element={
                          <ProtectedRoute>
                            <AssignQualifyingInterviewExam />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/assign_schedule_applicants_qualifying_interview"
                        element={
                          <ProtectedRoute>
                            <AssignScheduleToApplicantsQualifyingInterviewer />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/qualifying_interviewer_applicant_list"
                        element={
                          <ProtectedRoute>
                            <QualifyingInterviewerApplicantList />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/grading_sheet"
                        element={
                          <ProtectedRoute>
                            <GradingSheet />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_list"
                        element={
                          <ProtectedRoute>
                            <StudentList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_list_for_enrollment"
                        element={
                          <ProtectedRoute>
                            <StudentListForEnrollment />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/faculty_workload"
                        element={
                          <ProtectedRoute>
                            <FacultyWorkload />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/faculty_evaluation"
                        element={
                          <ProtectedRoute>
                            <FacultyEvaluation />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/faculty_masterlist"
                        element={
                          <ProtectedRoute>
                            <FacultyMasterList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/program_evaluation"
                        element={
                          <ProtectedRoute>
                            <ProgramEvaluation />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_dashboard"
                        element={
                          <ProtectedRoute allowedRoles={"student"}>
                            <StudentDashboard
                              profileImage={profileImage}
                              setProfileImage={setProfileImage}
                            />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_schedule"
                        element={
                          <ProtectedRoute allowedRoles={"student"}>
                            <StudentSchedule />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/grades_page"
                        element={
                          <ProtectedRoute>
                            <StudentGradingPage allowedRoles={"student"} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_faculty_evaluation"
                        element={
                          <ProtectedRoute allowedRoles={"student"}>
                            <StudentFacultyEvaluation />
                          </ProtectedRoute>
                        }
                      />

                      <Route path="/unauthorized" element={<Unauthorized />} />

                      <Route
                        path="/applicant_list"
                        element={
                          <ProtectedRoute>
                            <ApplicantList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/medical_applicant_list"
                        element={
                          <ProtectedRoute>
                            <MedicalApplicantList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/applicant_list_admin"
                        element={
                          <ProtectedRoute>
                            <ApplicantListAdmin />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/super_admin_applicant_list"
                        element={
                          <ProtectedRoute>
                            <SuperAdminApplicantList />
                          </ProtectedRoute>
                        }
                      />
                        <Route
                        path="/application_process_admin"
                        element={
                          <ProtectedRoute>
                            <ApplicationProcessAdmin />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/proctor_applicant_list"
                        element={
                          <ProtectedRoute>
                            <ProctorApplicantList />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/evaluation_crud"
                        element={
                          <ProtectedRoute>
                            <EvaluationCRUD />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/qualifying_interview_exam_scores"
                        element={
                          <ProtectedRoute>
                            <QualifyingInterviewExamScore />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <Settings onUpdate={fetchSettings} />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/notifications"
                        element={
                          <ProtectedRoute>
                            <Notifications />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/admin_dashboard1"
                        element={
                          <ProtectedRoute>
                            <AdminDashboard1 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin_dashboard2"
                        element={
                          <ProtectedRoute>
                            <AdminDashboard2 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin_dashboard3"
                        element={
                          <ProtectedRoute>
                            <AdminDashboard3 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin_dashboard4"
                        element={
                          <ProtectedRoute>
                            <AdminDashboard4 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin_dashboard5"
                        element={
                          <ProtectedRoute>
                            <AdminDashboard5 />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/student_dashboard1"
                        element={
                          <ProtectedRoute>
                            <StudentDashboard1 allowedRoles={"student"} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_dashboard2"
                        element={
                          <ProtectedRoute>
                            <StudentDashboard2 allowedRoles={"student"} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_dashboard3"
                        element={
                          <ProtectedRoute>
                            <StudentDashboard3 allowedRoles={"student"} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_dashboard4"
                        element={
                          <ProtectedRoute>
                            <StudentDashboard4 allowedRoles={"student"} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_dashboard5"
                        element={
                          <ProtectedRoute>
                            <StudentDashboard5 allowedRoles={"student"} />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/registrar_dashboard1"
                        element={
                          <ProtectedRoute>
                            <RegistrarDashboard1 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/registrar_dashboard2"
                        element={
                          <ProtectedRoute>
                            <RegistrarDashboard2 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/registrar_dashboard3"
                        element={
                          <ProtectedRoute>
                            <RegistrarDashboard3 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/registrar_dashboard4"
                        element={
                          <ProtectedRoute>
                            <RegistrarDashboard4 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/registrar_dashboard5"
                        element={
                          <ProtectedRoute>
                            <RegistrarDashboard5 />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/medical_dashboard1"
                        element={
                          <ProtectedRoute>
                            <MedicalDashboard1 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/medical_dashboard2"
                        element={
                          <ProtectedRoute>
                            <MedicalDashboard2 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/medical_dashboard3"
                        element={
                          <ProtectedRoute>
                            <MedicalDashboard3 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/medical_dashboard4"
                        element={
                          <ProtectedRoute>
                            <MedicalDashboard4 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/medical_dashboard5"
                        element={
                          <ProtectedRoute>
                            <MedicalDashboard5 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/medical_requirements"
                        element={
                          <ProtectedRoute>
                            <MedicalRequirements />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/medical_certificate"
                        element={
                          <ProtectedRoute>
                            <MedicalCertificate />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/health_record"
                        element={
                          <ProtectedRoute>
                            <HealthRecord />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/medical_requirements_form"
                        element={
                          <ProtectedRoute>
                            <MedicalRequirementsForm />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dental_assessment"
                        element={
                          <ProtectedRoute>
                            <DentalAssessment />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/physical_neuro_exam"
                        element={
                          <ProtectedRoute>
                            <PhysicalNeuroExam />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/readmission_dashboard1"
                        element={
                          <ProtectedRoute>
                            <ReadmissionDashboard1 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/readmission_dashboard2"
                        element={
                          <ProtectedRoute>
                            <ReadmissionDashboard2 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/readmission_dashboard3"
                        element={
                          <ProtectedRoute>
                            <ReadmissionDashboard3 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/readmission_dashboard4"
                        element={
                          <ProtectedRoute>
                            <ReadmissionDashboard4 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/readmission_dashboard5"
                        element={
                          <ProtectedRoute>
                            <ReadmissionDashboard5 />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/super_admin_applicant_dashboard1"
                        element={
                          <ProtectedRoute>
                            <SuperAdminApplicantDashboard1 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/super_admin_applicant_dashboard2"
                        element={
                          <ProtectedRoute>
                            <SuperAdminApplicantDashboard2 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/super_admin_applicant_dashboard3"
                        element={
                          <ProtectedRoute>
                            <SuperAdminApplicantDashboard3 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/super_admin_applicant_dashboard4"
                        element={
                          <ProtectedRoute>
                            <SuperAdminApplicantDashboard4 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/super_admin_applicant_dashboard5"
                        element={
                          <ProtectedRoute>
                            <SuperAdminApplicantDashboard5 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/super_admin_requirements_uploader"
                        element={
                          <ProtectedRoute>
                            <SuperAdminRequirementsUploader />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/super_admin_student_dashboard1"
                        element={
                          <ProtectedRoute>
                            <SuperAdminStudentDashboard1 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/super_admin_student_dashboard2"
                        element={
                          <ProtectedRoute>
                            <SuperAdminStudentDashboard2 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/super_admin_student_dashboard3"
                        element={
                          <ProtectedRoute>
                            <SuperAdminStudentDashboard3 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/super_admin_student_dashboard4"
                        element={
                          <ProtectedRoute>
                            <SuperAdminStudentDashboard4 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/super_admin_student_dashboard5"
                        element={
                          <ProtectedRoute>
                            <SuperAdminStudentDashboard5 />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/super_admin_room_registration"
                        element={
                          <ProtectedRoute>
                            <SuperAdminRoomRegistration />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/migration_data_panel"
                        element={
                          <ProtectedRoute>
                            <MigrationDataPanel />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/payment_exporting_module"
                        element={
                          <ProtectedRoute>
                            <PaymentExportingModule />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/cor_exporting_module"
                        element={
                          <ProtectedRoute>
                            <CORExportingModule />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/applicant_dashboard"
                        element={
                          <ProtectedRoute allowedRoles={["applicant"]}>
                            <ApplicantDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {keys.step1 && (
                        <Route
                          path={`/dashboard/${keys.step1}`}
                          element={
                            <ProtectedRoute allowedRoles={["applicant"]}>
                              <Dashboard1 />
                            </ProtectedRoute>
                          }
                        />
                      )}
                      {keys.step2 && (
                        <Route
                          path={`/dashboard/${keys.step2}`}
                          element={
                            <ProtectedRoute allowedRoles={["applicant"]}>
                              <Dashboard2 />
                            </ProtectedRoute>
                          }
                        />
                      )}
                      {keys.step3 && (
                        <Route
                          path={`/dashboard/${keys.step3}`}
                          element={
                            <ProtectedRoute allowedRoles={["applicant"]}>
                              <Dashboard3 />
                            </ProtectedRoute>
                          }
                        />
                      )}
                      {keys.step4 && (
                        <Route
                          path={`/dashboard/${keys.step4}`}
                          element={
                            <ProtectedRoute allowedRoles={["applicant"]}>
                              <Dashboard4 />
                            </ProtectedRoute>
                          }
                        />
                      )}
                      {keys.step5 && (
                        <Route
                          path={`/dashboard/${keys.step5}`}
                          element={
                            <ProtectedRoute allowedRoles={["applicant"]}>
                              <Dashboard5 />
                            </ProtectedRoute>
                          }
                        />
                      )}

                      <Route
                        path="/requirements_uploader"
                        element={
                          <ProtectedRoute allowedRoles={["applicant"]}>
                            <RequirementUploader />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_requirements"
                        element={
                          <ProtectedRoute>
                            <StudentRequirements />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/registrar_requirements"
                        element={
                          <ProtectedRoute>
                            <RegistrarRequirements />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin_ecat_application_form"
                        element={
                          <ProtectedRoute allowedRoles={["registrar"]}>
                            <AdminECATApplicationForm />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin_personal_data_form"
                        element={
                          <ProtectedRoute allowedRoles={["registrar"]}>
                            <AdminPersonalDataForm />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin_admission_form_process"
                        element={
                          <ProtectedRoute allowedRoles={["registrar"]}>
                            <AdminAdmissionFormProcess />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin_office_of_the_registrar"
                        element={
                          <ProtectedRoute allowedRoles={["registrar"]}>
                            <AdminOfficeOfTheRegistrar />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/personal_data_form"
                        element={
                          <ProtectedRoute allowedRoles={["applicant"]}>
                            <PersonalDataForm />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/ecat_application_form"
                        element={
                          <ProtectedRoute allowedRoles={["applicant"]}>
                            <ECATApplicationForm />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admission_form_process"
                        element={
                          <ProtectedRoute
                            allowedRoles={["applicant", "registrar", "student"]}
                          >
                            <AdmissionFormProcess />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admission_services"
                        element={
                          <ProtectedRoute
                            allowedRoles={["applicant", "registrar"]}
                          >
                            <AdmissionServices />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/office_of_the_registrar"
                        element={
                          <ProtectedRoute allowedRoles={["applicant"]}>
                            <OfficeOfTheRegistrar />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/verify_document_schedule"
                        element={
                          <ProtectedRoute allowedRoles={["registrar"]}>
                            <VerifyDocumentsSchedule />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/department_curriculum_panel"
                        element={
                          <ProtectedRoute>
                            <DepartmentCurriculumPanel />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/program_slot_limit"
                        element={
                          <ProtectedRoute>
                            <ProgramSlotLimit />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/class_roster"
                        element={
                          <ProtectedRoute>
                            <ClassRoster />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/class_roster_enrollment"
                        element={
                          <ProtectedRoute>
                            <ClassRosterForEnrollment />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/transcript_of_records"
                        element={
                          <ProtectedRoute>
                            <TranscriptOfRecords />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/tosf_crud"
                        element={
                          <ProtectedRoute>
                            <TOSFCrud />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/receipt"
                        element={
                          <ProtectedRoute>
                            <Receipt />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/program_payment"
                        element={
                          <ProtectedRoute>
                            <ProgramPayment />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/prerequisite"
                        element={
                          <ProtectedRoute>
                            <Prerequisite />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/program_unit"
                        element={
                          <ProtectedRoute>
                            <ProgramUnit />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/email_template_manager"
                        element={
                          <ProtectedRoute>
                            <EmailTemplateManager />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/announcement"
                        element={
                          <ProtectedRoute>
                            <Announcement />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/announcement_for_admission"
                        element={
                          <ProtectedRoute>
                            <AnnouncementForAdmission />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/exam-permit/:applicant_number"
                        element={<ExamPermit />}
                      />
                      <Route
                        path="/applicant-permit/:applicant_number"
                        element={<ApplicantProfilePermit />}
                      />

                      <Route
                        path="/student_ecat_application_form"
                        element={
                          <ProtectedRoute allowedRoles={["student"]}>
                            <StudentECATApplicationForm />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_personal_data_form"
                        element={
                          <ProtectedRoute allowedRoles={["student"]}>
                            <StudentPersonalDataForm />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_office_of_the_registrar"
                        element={
                          <ProtectedRoute allowedRoles={["student"]}>
                            <StudentOfficeOfTheRegistrar />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_admission_services"
                        element={
                          <ProtectedRoute allowedRoles={["student"]}>
                            <StudentAdmissionServices />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_form_process"
                        element={
                          <ProtectedRoute
                            allowedRoles={["student", "registrar", "applicant"]}
                          >
                            <StudentAdmissionFormProcess />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_grade_file"
                        element={
                          <ProtectedRoute>
                            <StudentGradeFile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/assign_receipt_counter"
                        element={
                          <ProtectedRoute>
                            <ReceiptCounterAssignment />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/matriculation_payment"
                        element={
                          <ProtectedRoute>
                            <MatriculationPaymentModule />
                          </ProtectedRoute>
                        }
                      />

                      {/*Public Examination Profile */}
                      <Route
                        path="/applicant_profile"
                        element={<ApplicantProfile />}
                      />
                      <Route
                        path="/applicant_profile/:applicantNumber"
                        element={<ApplicantProfile />}
                      />
                      <Route
                        path="/student_qr_information/:studentNumber"
                        element={<StudentQrInfo />}
                      />

                      {/* ADMIN - Admission Examination Profile */}
                      <Route
                        path="/registrar_exam_permit"
                        element={
                          <ProtectedRoute>
                            <RegistrarExamPermit />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/registrar_examination_profile"
                        element={
                          <ProtectedRoute>
                            <RegistrarExaminationProfile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/registrar_examination_profile/:personId"
                        element={<ApplicantProfile />}
                      />

                      <Route
                        path="/page_crud"
                        element={
                          <ProtectedRoute>
                            <PageCRUD />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/report_of_grades"
                        element={
                          <ProtectedRoute>
                            <ReportOfGrade />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/user_page_access"
                        element={
                          <ProtectedRoute>
                            <UserPageAccess />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_scholarship_list"
                        element={
                          <ProtectedRoute>
                            <StudentScholarshipList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/section_slot_monitoring"
                        element={
                          <ProtectedRoute>
                            <SectionSlotMonitoring />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/official_student_dashboard1"
                        element={
                          <ProtectedRoute>
                            <OfficialStudentDashboard1 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/official_student_dashboard2"
                        element={
                          <ProtectedRoute>
                            <OfficialStudentDashboard2 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/official_student_dashboard3"
                        element={
                          <ProtectedRoute>
                            <OfficialStudentDashboard3 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/official_student_dashboard4"
                        element={
                          <ProtectedRoute>
                            <OfficialStudentDashboard4 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/official_student_dashboard5"
                        element={
                          <ProtectedRoute>
                            <OfficialStudentDashboard5 />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/student_official_requirements"
                        element={
                          <ProtectedRoute>
                            <OfficialRequirements />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin_branches"
                        element={
                          <ProtectedRoute>
                            <AdminBranches />
                          </ProtectedRoute>
                        }
                      />


                    </Routes>
                  </main>
                </div>
              </div>

              {/* Footer */}
              <Box
                component="footer"
                sx={{
                  width: "100%",
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  zIndex: (theme) => theme.zIndex.drawer + 1,
                  bgcolor: settings?.footer_color || "#ffffff",
                  color: "white",
                  textAlign: "center",
                  padding: "10px 5px",
                }}
              >
                <Typography style={{ fontSize: "18px" }}>
                  {settings?.footer_text || "EARIST MANILA"}
                </Typography>
              </Box>
            </div>
          </Router>
        </Suspense>
      </SettingsContext.Provider>
    </ThemeProvider>
  );
}

export default App;
