import React, { useState, useEffect, useContext, forwardRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import { Box, Container, Snackbar, Alert } from "@mui/material";
import FreeTuitionImage from "../assets/FreeTuition.png";
import EaristLogo from "../assets/EaristLogo.png";
import "../styles/Print.css";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import { MdOutlinePayment } from "react-icons/md";
import { IoMdSchool } from "react-icons/io";
import API_BASE_URL from "../apiConfig";
const CertificateOfRegistration = forwardRef(
  (
    { student_number, person_id, preload, containerId, onReady },
    divToPrintRef,
  ) => {
    const settings = useContext(SettingsContext);
    const [fetchedLogo, setFetchedLogo] = useState(null);
    const [companyName, setCompanyName] = useState("");
    const [branches, setBranches] = useState([]);
    const [snack, setSnack] = useState({
      open: false,
      message: "",
      severity: "",
    });
    
    const showSnackbar = (message, severity) => {
      setSnack({ open: true, message, severity });
    };
    const handleSnackClose = (_, reason) => {
      if (reason === "clickaway") return;
      setSnack((prev) => ({ ...prev, open: false }));
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
      }
    }, [settings]);

    const words = companyName.trim().split(" ");
    const middle = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, middle).join(" ");
    const secondLine = words.slice(middle).join(" ");

    const [data, setData] = useState([]);
    const hasStudentData = Boolean(student_number?.trim() && data?.[0]);

    const [profilePicture, setProfilePicture] = useState(null);
    const [personID, setPersonID] = useState("");
    const [person, setPerson] = useState({
      profile_img: "",
      campus: "",
      academicProgram: "",
      classifiedAs: "",
      program: "",
      program2: "",
      program3: "",
      yearLevel: "",
      last_name: "",
      first_name: "",
      middle_name: "",
      extension: "",
      nickname: "",
      height: "",
      weight: "",
      lrnNumber: "",
      gender: "",
      pwdType: "",
      pwdId: "",
      birthOfDate: "",
      age: "",
      birthPlace: "",
      languageDialectSpoken: "",
      citizenship: "",
      religion: "",
      civilStatus: "",
      tribeEthnicGroup: "",
      cellphoneNumber: "",
      emailAddress: "",
      presentStreet: "",
      presentBarangay: "",
      presentZipCode: "",
      presentRegion: "",
      presentProvince: "",
      presentMunicipality: "",
      presentDswdHouseholdNumber: "",
      permanentStreet: "",
      permanentBarangay: "",
      permanentZipCode: "",
      permanentRegion: "",
      permanentProvince: "",
      permanentMunicipality: "",
      permanentDswdHouseholdNumber: "",
      father_family_name: "",
      father_given_name: "",
      father_middle_name: "",
      father_ext: "",
      father_contact: "",
      father_occupation: "",
      father_income: "",
      father_email: "",
      mother_family_name: "",
      mother_given_name: "",
      mother_middle_name: "",
      mother_contact: "",
      mother_occupation: "",
      mother_income: "",
      guardian: "",
      guardian_family_name: "",
      guardian_given_name: "",
      guardian_middle_name: "",
      guardian_ext: "",
      guardian_nickname: "",
      guardian_address: "",
      guardian_contact: "",
      guardian_email: "",
      generalAverage1: "",
    });

    const [campusAddress, setCampusAddress] = useState("");

    useEffect(() => {
      if (!settings) return;

      const branchId = person?.campus;
      const matchedBranch = branches.find(
        (branch) => String(branch?.id) === String(branchId),
      );

      if (matchedBranch?.address) {
        setCampusAddress(matchedBranch.address);
        return;
      }

      if (settings.campus_address) {
        setCampusAddress(settings.campus_address);
        return;
      }

      setCampusAddress(settings.address || "");
    }, [settings, branches, person?.campus]);

    const [hasAccess, setHasAccess] = useState(null);
    const [approvedBy, setApprovedBy] = useState(null);

    useEffect(() => {
      const fetchApprovedBy = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/signature-latest`);
          const data = await res.json();

          if (data.success) {
            setApprovedBy(data.data);
          }
        } catch (err) {
          console.error(err);
        }
      };

      fetchApprovedBy();
    }, []);

    useEffect(() => {
      axios
        .get(`${API_BASE_URL}/get_active_school_years`)
        .then((res) => setActiveSchoolYear(res.data))
        .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
      if (person_id) {
        fetchPersonData(person_id);
      }
    }, [person_id]);

    // ✅ Fetch person data from backend
    const fetchPersonData = async (person_id) => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/person/enrollment_data/${person_id}`,
        );
        setPerson(res.data);
      } catch (error) {
        console.error("Failed to fetch person:", error);
      }
    };

    const fetchProfilePicture = async (person_id) => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/user/${person_id}`);
        if (res.data && res.data.profile_img) {
          setProfilePicture(`${API_BASE_URL}/uploads/Student1by1/${res.data.profile_img}`);
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
        setProfilePicture(null);
      }
    };

    useEffect(() => {
      if (personID) {
        fetchProfilePicture(personID);
      }
    }, [personID]);

    const [shortDate, setShortDate] = useState("");
    const [longDate, setLongDate] = useState("");

    useEffect(() => {
      const updateDates = () => {
        const now = new Date();

        // Format 1: MM/DD/YYYY
        const formattedShort = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}/${now.getFullYear()}`;
        setShortDate(formattedShort);

        // Format 2: MM DD, YYYY hh:mm:ss AM/PM
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = now.getFullYear();
        const hours = String(now.getHours() % 12 || 12).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const ampm = now.getHours() >= 12 ? "PM" : "AM";

        const formattedLong = `${month} ${day}, ${year} ${hours}:${minutes}:${seconds} ${ampm}`;
        setLongDate(formattedLong);
      };

      updateDates(); // Set initial values
      const interval = setInterval(updateDates, 1000); // Update every second

      return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    const [courses, setCourses] = useState([]);
    const [enrolled, setEnrolled] = useState([]);

    const [userId, setUserId] = useState(null); // Dynamic userId
    const [first_name, setUserFirstName] = useState(null); // Dynamic userId
    const [middle_name, setUserMiddleName] = useState(null); // Dynamic userId

    const [last_name, setUserLastName] = useState(null); // Dynamic userId
    const [currId, setCurr] = useState(null); // Dynamic userId
    const [courseCode, setCourseCode] = useState("");
    const [courseDescription, setCourseDescription] = useState("");

    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    const [subjectCounts, setSubjectCounts] = useState({});
    const [year_Level_Description, setYearLevelDescription] = useState(null);
    const [activeSchoolYear, setActiveSchoolYear] = useState([]);
    const [major, setMajor] = useState(null);
    
    // Track when all critical data is loaded
    const [dataLoaded, setDataLoaded] = useState({
      student: false,
      courses: false,
      enrolled: false,
      tosf: false,
    });

    useEffect(() => {
      if (selectedSection) {
        fetchSubjectCounts(selectedSection);
      }
    }, [selectedSection]);

    const fetchSubjectCounts = async (sectionId) => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/subject-enrollment-count`,
          {
            params: { sectionId },
          },
        );

        // Transform into object for easy lookup: { subject_id: enrolled_count }
        const counts = {};
        response.data.forEach((item) => {
          counts[item.subject_id] = item.enrolled_count;
        });

        setSubjectCounts(counts);
      } catch (err) {
        console.error("Failed to fetch subject counts", err);
      }
    };

    useEffect(() => {
      if (currId) {
        axios
          .get(`${API_BASE_URL}/courses/${currId}`)
          .then((res) => {
            setCourses(res.data);
            setDataLoaded((prev) => ({ ...prev, courses: true }));
          })
          .catch((err) => {
            console.error(err);
            setDataLoaded((prev) => ({ ...prev, courses: true })); // Mark as loaded even on error
          });
      } else {
        setDataLoaded((prev) => ({ ...prev, courses: true }));
      }
    }, [currId]);

    useEffect(() => {
      if (userId && currId) {
        axios
          .get(`${API_BASE_URL}/enrolled_courses/${userId}/${currId}`)
          .then((res) => {
            setEnrolled(res.data);
            setDataLoaded((prev) => ({ ...prev, enrolled: true }));
          })
          .catch((err) => {
            console.error(err);
            setDataLoaded((prev) => ({ ...prev, enrolled: true })); // Mark as loaded even on error
          });
      } else {
        setDataLoaded((prev) => ({ ...prev, enrolled: true }));
      }
    }, [userId, currId]);

    // Fetch department sections when component mounts
    useEffect(() => {
      fetchDepartmentSections();
    }, []);

    // Fetch sections whenever selectedDepartment changes
    useEffect(() => {
      if (selectedDepartment) {
        fetchDepartmentSections();
      }
    }, [selectedDepartment]);

    // Fetch department sections based on selected department
    const fetchDepartmentSections = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/department-sections`,
          {
            params: { departmentId: selectedDepartment },
          },
        );
        // Artificial delay
        setTimeout(() => {
          setSections(response.data);
          setLoading(false);
        }, 700); // 3 seconds delay
      } catch (err) {
        console.error("Error fetching department sections:", err);
        setError("Failed to load department sections");
        setLoading(false);
      }
    };

    const [gender, setGender] = useState(null);
    const [age, setAge] = useState(null);
    const [email, setEmail] = useState(null);
    const [program, setProgram] = useState(null);
    const [course_unit, setCourseUnit] = useState(null);
    const [lab_unit, setLabUnit] = useState(null);
    const [year_desc, setYearDescription] = useState(null);
    const [yearlevel, setYearLevelId] = useState("");
    const [isHaveNSTP, setIsHaveNSTP] = useState(0);
    const [isHaveComputerFees, setIsHaveComputerFees] = useState(0);
    const [isHaveLaboratory, setIsHaveLaboratory] = useState(0);
    const [totalLecFees, setTotalLecFees] = useState(0);
    const [totalLabFees, setTotalLabFees] = useState(0);
    const isFirstYear = Number(yearlevel) === 1;
    const isFirstSemester = Number(activeSchoolYear[0]?.semester_id) === 1;
    const isFirstYearFirstSem = isFirstYear && isFirstSemester;

    const applyTaggedStudent = (tagged) => {
      if (!tagged) return { studentNum: null, activeCurriculum: null };

      const studentNum =
        tagged.student_number ?? tagged.studentNumber ?? tagged.studentNum;
      const personId = tagged.person_id ?? tagged.person_id2 ?? tagged.personId;
      const activeCurriculumRaw =
        tagged.active_curriculum ?? tagged.activeCurriculum ?? tagged.program;
      const effectiveCurriculum =
        activeCurriculumRaw && activeCurriculumRaw !== 0
          ? activeCurriculumRaw
          : (tagged.program ?? activeCurriculumRaw);

      setTotalLecFees(Number(tagged.totalLecFee || 0));
      setTotalLabFees(Number(tagged.totalLabFee || 0));
      setIsHaveNSTP(Number(tagged.totalNstpCount || 0));
      setIsHaveComputerFees(Number(tagged.totalComputerLab || 0));
      setIsHaveLaboratory(Number(tagged.totalLaboratory || 0));

      setUserId(studentNum);
      setUserFirstName(tagged.first_name ?? tagged.firstName ?? "");
      setUserMiddleName(tagged.middle_name ?? tagged.middleName ?? "");
      setUserLastName(tagged.last_name ?? tagged.lastName ?? "");
      setCurr(effectiveCurriculum);
      setMajor(tagged.major || "");
      setDepartments(tagged.dprtmnt_name ?? tagged.departmentName ?? "");
      setCourseCode(tagged.program_code ?? tagged.courseCode ?? "");
      setCourseDescription(
        tagged.program_description ?? tagged.courseDescription ?? "",
      );
      setCourseUnit(tagged.courseUnit ?? tagged.course_unit ?? "");
      setLabUnit(tagged.labUnit ?? tagged.lab_unit ?? "");
      setPersonID(personId);
      setYearLevelDescription(
        tagged.year_level_description ?? tagged.yearLevelDescription ?? "",
      );
      setYearLevelId(tagged.year_level_id ?? tagged.yearLevel ?? "");
      setYearDescription(tagged.year_description ?? tagged.yearDesc ?? "");

      return { studentNum, activeCurriculum: effectiveCurriculum };
    };

    useEffect(() => {
      if (!student_number || !student_number.trim()) return; // don't run if empty

      const fetchStudent = async () => {
        try {
          let tagged = preload;

          if (!tagged) {
            const response = await axios.post(
              `${API_BASE_URL}/student-tagging`,
              { studentNumber: student_number },
              { headers: { "Content-Type": "application/json" } },
            );
            tagged = response.data;
          }

          const { studentNum, activeCurriculum } = applyTaggedStudent(tagged);
          if (!studentNum && !student_number) return;

          // 2. Fetch full student data (COR info)
          const corResponse = await axios.get(
            `${API_BASE_URL}/student-data/${studentNum}`,
          );
          const fullData = corResponse.data;
          setData([fullData]); // Wrap in array for data[0] compatibility

          // 3. Set additional fields: gender, age, email, program
          setGender(fullData.gender || null);
          setAge(fullData.age || null);
          setEmail(fullData.email || null);
          setProgram(activeCurriculum);
          
          // Small delay to ensure state is updated before signaling ready
          setTimeout(() => {
            setDataLoaded((prev) => ({ ...prev, student: true }));
          }, 100);
        } catch (error) {
          console.error("Student search failed:", error);
          setDataLoaded((prev) => ({ ...prev, student: true })); // Mark as loaded even on error
        }
      };

      fetchStudent();
    }, [student_number, preload]);

    // Call onReady only when ALL critical data is loaded and rendered
    useEffect(() => {
      const allDataLoaded = 
        dataLoaded.student && 
        dataLoaded.courses && 
        dataLoaded.enrolled && 
        dataLoaded.tosf;

      if (allDataLoaded && onReady && student_number) {
        // Wait for data arrays to have content
        if (data.length === 0 && enrolled.length === 0) {
          // Data not yet populated, wait longer
          const retryTimer = setTimeout(() => {
            if (onReady) onReady(student_number);
          }, 2000);
          return () => clearTimeout(retryTimer);
        }
        
        // Add extra delay to ensure DOM is fully rendered with actual values
        const timer = setTimeout(() => {
          // Verify DOM actually has content rendered
          const checkContent = () => {
            if (containerId) {
              const container = document.getElementById(containerId);
              if (container) {
                const inputs = container.querySelectorAll('input[value]');
                const filledInputs = Array.from(inputs).filter(inp => inp.value && inp.value.trim() !== '');
                
                // Only signal ready if we have some filled inputs OR force after timeout
                if (filledInputs.length > 5 || Date.now() > checkContent.startTime + 3000) {
                  onReady(student_number);
                  return;
                }
              }
            }
            // Fallback - just signal ready
            onReady(student_number);
          };
          checkContent.startTime = Date.now();
          checkContent();
        }, 1200); // Increased from 800ms to 1200ms
        
        return () => clearTimeout(timer);
      }
    }, [dataLoaded, onReady, student_number, enrolled, data, containerId]);

    // Fetch all departments when component mounts
    useEffect(() => {
      const fetchDepartments = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/departments`);
          setDepartments(res.data);
        } catch (err) {
          console.error("Error fetching departments:", err);
        }
      };

      fetchDepartments();
    }, []);

    const toWholeUnit = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? Math.round(num) : 0;
    };

    const totalCourseUnits = enrolled.reduce(
      (sum, item) => sum + toWholeUnit(item.course_unit),
      0,
    );
    const totalLabUnits = enrolled.reduce(
      (sum, item) => sum + toWholeUnit(item.lab_unit),
      0,
    );
    const totalCombined = totalCourseUnits + totalLabUnits;

    const [tosf, setTosfData] = useState([]);
    const [curriculumOptions, setCurriculumOptions] = useState([]);

    useEffect(() => {
      const fetchCurriculums = async () => {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/applied_program`,
          );
          setCurriculumOptions(response.data);
        } catch (error) {
          console.error("Error fetching curriculum options:", error);
        }
      };

      fetchCurriculums();
    }, []);

    {
      curriculumOptions.find(
        (item) =>
          item?.curriculum_id?.toString() ===
          (person?.program ?? "").toString(),
      )?.program_description ||
        (person?.program ?? "");
    }

    const fetchTosf = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/tosf`);
        setTosfData(res.data);
        setDataLoaded((prev) => ({ ...prev, tosf: true }));
      } catch (error) {
        console.error("Error fetching data:", error);
        showSnackbar("Error fetching data", "error");
        setDataLoaded((prev) => ({ ...prev, tosf: true })); // Mark as loaded even on error
      }
    };



    useEffect(() => {
      fetchTosf();
    }, []);

    // 🔒 Disable right-click
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    // 🔒 Block DevTools shortcuts + Ctrl+P silently
    document.addEventListener("keydown", (e) => {
      const isBlockedKey =
        e.key === "F12" || // DevTools
        e.key === "F11" || // Fullscreen
        (e.ctrlKey &&
          e.shiftKey &&
          (e.key.toLowerCase() === "i" || e.key.toLowerCase() === "j")) || // Ctrl+Shift+I/J
        (e.ctrlKey && e.key.toLowerCase() === "u") || // Ctrl+U (View Source)
        (e.ctrlKey && e.key.toLowerCase() === "p"); // Ctrl+P (Print)

      if (isBlockedKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    return (
      <Container className="mb-[4rem]">
        <div className="flex-container">
          <div className="section">
            <Box></Box>

            <div ref={divToPrintRef} className="certificate-wrapper">
              {/* Watermark across the page */}

              <style>
                {`
                .certificate-wrapper {
                  position: relative;
                }

                .certificate-watermark {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%) rotate(-45deg); /* diagonal */
                  font-size: 7rem; /* adjust to fit your page */
                  font-weight: 900;
                  color: rgba(0, 0, 0, 0.08); /* light grey, adjust opacity */
                  text-transform: uppercase;
                  white-space: nowrap;
                  pointer-events: none;
                  user-select: none;
                  z-index: 9999;
                }

                @media print {
                  .certificate-watermark {
                    color: rgba(0, 0, 0, 0.15); /* a bit darker so it prints */
                  }
                  button {
                    display: none;
                  }
                  .fee-table-con{
                    width: calc(8in - 2px) !important;
                  }
                }
              `}</style>

              <div className="section">
                <table
                  className="student-table"
                  style={{
                    borderCollapse: "collapse",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    width: "8in",
                    margin: "0 auto", // Center the table inside the form
                    textAlign: "center",
                    tableLayout: "fixed",
                  }}
                >
                  <style>
                    {`
                  @media print {
                    .Box {
                      display: none;
                    }

                  }
                `}
                  </style>

                  <tbody>
                    <tr>
                      <td
                        colSpan={2}
                        style={{ height: "0.1in", fontSize: "72.5%" }}
                      >
                        <b></b>
                      </td>
                      <td
                        colSpan={1}
                        style={{ height: "0.1in", fontSize: "72.5%" }}
                      ></td>
                      <td
                        colSpan={1}
                        style={{ height: "0.1in", fontSize: "72.5%" }}
                      ></td>
                      <td
                        colSpan={1}
                        style={{ height: "0.1in", fontSize: "72.5%" }}
                      ></td>
                      <td
                        colSpan={1}
                        style={{ height: "0.1in", fontSize: "72.5%" }}
                      ></td>
                      <td
                        colSpan={1}
                        style={{ height: "0.1in", fontSize: "72.5%" }}
                      ></td>
                      <td
                        colSpan={1}
                        style={{ height: "0.1in", fontSize: "72.5%" }}
                      ></td>
                      <td
                        colSpan={1}
                        style={{ height: "0.1in", fontSize: "72.5%" }}
                      ></td>
                      <td
                        colSpan={1}
                        style={{ height: "0.1in", fontSize: "72.5%" }}
                      ></td>
                      <td
                        colSpan={1}
                        style={{ height: "0.1in", fontSize: "72.5%" }}
                      ></td>
                      <td
                        colSpan={1}
                        style={{ height: "0.1in", fontSize: "72.5%" }}
                      ></td>
                      <td
                        colSpan={1}
                        style={{ height: "0.1in", fontSize: "72.5%" }}
                      ></td>
                      <td
                        colSpan={1}
                        style={{ height: "0.1in", fontSize: "72.5%" }}
                      ></td>
                      <td
                        colSpan={1}
                        style={{ height: "0.1in", fontSize: "72.5%" }}
                      ></td>
                    </tr>
                    <tr>
                      <td
                        colSpan={2}
                        style={{ height: "0.1in", fontSize: "62.5%" }}
                      ></td>
                    </tr>
                    <tr>
                      <td
                        colSpan={40}
                        style={{ height: "0.5in", textAlign: "center" }}
                      >
                        <table
                          width="100%"
                          style={{ borderCollapse: "collapse" }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ width: "20%", textAlign: "center" }}>
                                <img
                                  src={fetchedLogo || EaristLogo}
                                  alt="School Logo"
                                  style={{
                                    marginLeft: "10px",
                                    width: "140px",
                                    height: "140px",
                                    borderRadius: "50%", // ? makes it circular
                                    objectFit: "cover",
                                  }}
                                />
                              </td>

                              {/* Center Column - School Information */}
                              <td
                                style={{
                                  width: "60%",
                                  textAlign: "center",
                                  lineHeight: "1",
                                  fontFamily: "Arial",
                                }}
                              >
                                <div>Republic of the Philippines</div>
                                <div
                                  style={{
                                    fontWeight: "bold",
                                    fontFamily: "Arial",
                                  }}
                                >
                                  {firstLine}
                                </div>
                                {secondLine && (
                                  <div
                                    style={{
                                      fontWeight: "bold",
                                      fontFamily: "Arial",
                                    }}
                                  >
                                    {secondLine}
                                  </div>
                                )}
                                <div>{campusAddress}</div>

                                {/* Add spacing here */}
                                <div style={{ marginTop: "30px" }}>
                                  <b
                                    style={{
                                      fontSize: "20px",
                                      letterSpacing: "2px",
                                    }}
                                  >
                                    CERTIFICATE OF REGISTRATION
                                  </b>
                                </div>
                              </td>

                              <td
                                colSpan={4}
                                rowSpan={6}
                                style={{
                                  textAlign: "center",
                                  position: "relative",
                                  width: "4.5cm",
                                  height: "4.5cm",
                                }}
                              >
                                <div
                                  style={{
                                    width: "3.80cm",
                                    height: "3.80cm",
                                    marginRight: "30px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    position: "relative",
                                    border: "1px solid #ccc",
                                  }}
                                >
                                  {profilePicture ? (
                                    <img
                                      src={profilePicture}
                                      alt="Profile"
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: "12px",
                                        color: "#666",
                                      }}
                                    >
                                      No Profile Picture Found
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td
                        colSpan={10}
                        style={{
                          height: "0.1in",
                          fontSize: "55%",
                          textAlign: "start",
                        }}
                      >
                        <b
                          style={{
                            fontFamily: "Arial, sans-serif",
                            fontSize: "12px",
                            color: "black",
                            textAlign: "start",
                            marginLeft: "25px",
                          }}
                        >
                          Registration No:&nbsp;
                          <span style={{ color: "red" }}></span>
                        </b>
                      </td>

                      <td
                        colSpan={30}
                        style={{
                          height: "0.1in",
                          fontSize: "50%",
                          textAlign: "right",
                        }}
                      >
                        <b
                          style={{
                            fontFamily: "Arial, sans-serif",
                            fontSize: "12px",
                            color: "black",
                          }}
                        >
                          Academic Year/Term :{" "}
                          <span style={{ color: "red" }}></span>
                        </b>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table
                  style={{
                    borderLeft: "1px solid black",
                    borderTop: "1px solid black",
                    borderRight: "1px solid black",
                    borderCollapse: "collapse",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    width: "8in",
                    margin: "0 auto", // Center the table inside the form
                    textAlign: "center",
                    tableLayout: "fixed",
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        colSpan={42}
                        style={{
                          height: "0.2in",
                          fontSize: "72.5%",
                          backgroundColor: "gray",
                          color: "white",
                        }}
                      >
                        <b>
                          <b
                            style={{
                              border: "1px solid black",
                              color: "black",
                              fontFamily: "Arial, sans-serif",
                              fontSize: "12px",
                              textAlign: "center",
                              display: "block",
                            }}
                          >
                            STUDENT GENERAL INFORMATION
                          </b>
                        </b>
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={4} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          value="Student No:"
                          readOnly
                          style={{
                            fontWeight: "bold",
                            color: "black",
                            width: "98%",
                            fontFamily: "Arial, sans-serif",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>

                      <td colSpan={11} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          value={data[0]?.student_number || ""}
                          readOnly
                          style={{
                            fontFamily: "Arial, sans-serif",
                            color: "black",
                            width: "98%",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>

                      <td colSpan={4} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          value="College:"
                          readOnly
                          style={{
                            fontWeight: "bold",
                            color: "black",
                            width: "98%",
                            fontFamily: "Arial, sans-serif",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>

                      {/* College Display */}
                      <td colSpan={16} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          value={data[0]?.college || ""}
                          readOnly
                          style={{
                            fontFamily: "Arial, sans-serif",
                            color: "black",
                            width: "98%",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>
                    </tr>

                    <tr>
                      {/* Name Label */}
                      <td colSpan={4} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          value="Name:"
                          readOnly
                          style={{
                            fontWeight: "bold",
                            color: "black",
                            width: "98%",
                            fontFamily: "Arial, sans-serif",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>
                      {/* Name Value */}
                      <td colSpan={11} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          value={`${data[0]?.last_name || ""}, ${data[0]?.first_name || ""} ${data[0]?.middle_name || ""} ${data[0]?.extension || ""}`.trim()}
                          readOnly
                          style={{
                            fontFamily: "Arial, sans-serif",
                            color: "black",
                            width: "98%",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>

                      {/* Program Label */}
                      <td colSpan={4} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          value="Program:"
                          readOnly
                          style={{
                            fontWeight: "bold",
                            color: "black",
                            width: "98%",
                            fontFamily: "Arial, sans-serif",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>

                      <td colSpan={23} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          value={(() => {
                            const match = curriculumOptions.find(
                              (item) =>
                                item?.curriculum_id?.toString() ===
                                (data[0]?.program ?? "").toString(),
                            );
                            return match
                              ? match.program_description
                              : (data[0]?.program ?? "");
                          })()}
                          readOnly
                          style={{
                            fontFamily: "Arial, sans-serif",
                            color: "black",
                            width: "98%",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>
                    </tr>

                    <tr>
                      {/* Gender Label */}
                      <td colSpan={4} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          value="Gender:"
                          readOnly
                          style={{
                            fontWeight: "bold",
                            color: "black",
                            width: "98%",
                            fontFamily: "Arial, sans-serif",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>

                      {/* Gender Value */}
                      <td colSpan={11} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          value={
                            data[0]?.gender === 0
                              ? "Male"
                              : data[0]?.gender === 1
                                ? "Female"
                                : ""
                          }
                          readOnly
                          style={{
                            fontFamily: "Arial, sans-serif",
                            color: "black",
                            width: "98%",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>

                      {/* Major Label */}
                      <td colSpan={4} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          value="Major:"
                          readOnly
                          style={{
                            fontWeight: "bold",
                            color: "black",
                            width: "98%",
                            fontFamily: "Arial, sans-serif",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>
                      <td colSpan={9} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          readOnly
                          value={
                            major
                              ? major.charAt(0).toUpperCase() +
                              major.slice(1).toLowerCase()
                              : ""
                          }
                          style={{
                            fontFamily: "Arial, sans-serif",
                            color: "black",
                            width: "98%",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>

                      {/* Curriculum Label */}
                      <td colSpan={5} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          value="Curriculum:"
                          readOnly
                          style={{
                            fontWeight: "bold",
                            color: "black",
                            width: "98%",
                            fontFamily: "Arial, sans-serif",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>

                      {/* Curriculum Value */}
                      <td colSpan={9} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          value={`${year_desc || ""}-${year_desc + 1 || ""}`}
                          readOnly
                          style={{
                            fontFamily: "Arial, sans-serif",
                            color: "black",
                            width: "98%",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={4} style={{ fontSize: "50%" }}>
                        <input
                          readOnly
                          type="text"
                          value={"Age:"}
                          style={{
                            fontWeight: "bold",
                            color: "black",
                            fontFamily: "Arial, sans-serif",
                            fontSize: "12px",
                            width: "98%",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>
                      <td colSpan={11} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          value={data[0]?.age || ""}
                          readOnly
                          style={{
                            fontFamily: "Arial, sans-serif",
                            color: "black",
                            width: "98%",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>
                      <td colSpan={4} style={{ fontSize: "50%" }}>
                        <input
                          readOnly
                          type="text"
                          value={"Year Level:"}
                          style={{
                            fontWeight: "bold",
                            color: "black",
                            fontFamily: "Arial, sans-serif",
                            fontSize: "12px",
                            width: "98%",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>
                      <td colSpan={9} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          value={year_Level_Description || ""}
                          readOnly
                          style={{
                            fontFamily: "Arial, sans-serif",
                            color: "black",
                            width: "98%",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>
                      <td colSpan={8} style={{ fontSize: "50%" }}>
                        <input
                          type="text"
                          value={"Scholarship/Discount:"}
                          readOnly
                          style={{
                            fontWeight: "bold",
                            color: "black",
                            fontFamily: "Arial, sans-serif",
                            fontSize: "12px",
                            width: "98%",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>
                      <td colSpan={6} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          readOnly
                          style={{
                            fontFamily: "Arial, sans-serif",
                            color: "black",
                            width: "98%",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={5} style={{ fontSize: "50%" }}>
                        <input
                          type="text"
                          value={"Email Address:"}
                          readOnly
                          style={{
                            color: "black",
                            fontWeight: "bold",
                            fontFamily: "Arial, sans-serif",
                            fontSize: "12px",
                            width: "98%",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>
                      <td colSpan={12} style={{ fontSize: "62.5%" }}>
                        <input
                          type="text"
                          value={data[0]?.email || ""}
                          readOnly
                          style={{
                            fontFamily: "Arial, sans-serif",
                            color: "black",
                            width: "98%",
                            fontSize: "12px",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>
                    </tr>

                    {/*----------------------------------------------------------------------------------------------------------------------------------*/}

                    <tr>
                      <td
                        colSpan={6}
                        rowSpan={2}
                        style={{
                          color: "black",
                          height: "0.3in",
                          fontFamily: "Arial, sans-serif",
                          fontSize: "12px",
                          fontWeight: "bold",

                          backgroundColor: "gray",
                          border: "1px solid black",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            marginTop: "-1px",
                          }}
                        >
                          CODE
                        </div>
                      </td>
                      <td
                        colSpan={10}
                        rowSpan={2}
                        style={{
                          color: "black",
                          height: "0.3in",
                          fontFamily: "Arial, sans-serif",
                          fontSize: "12px",
                          fontWeight: "bold",
                          backgroundColor: "gray",
                          border: "1px solid black",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            marginTop: "-1px",
                          }}
                        >
                          SUBJECT TITLE
                        </div>
                      </td>

                      <td
                        colSpan={6}
                        style={{
                          color: "black",
                          height: "0.2in",
                          fontFamily: "Arial, sans-serif",
                          fontSize: "12px",
                          fontWeight: "bold",

                          backgroundColor: "gray",
                          border: "1px solid black",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            marginTop: "-1px",
                          }}
                        >
                          UNIT
                        </div>
                      </td>

                      <td
                        colSpan={4}
                        rowSpan={2}
                        style={{
                          color: "black",
                          height: "0.3in",
                          fontFamily: "Arial, sans-serif",
                          fontSize: "12px",
                          fontWeight: "bold",

                          backgroundColor: "gray",
                          border: "1px solid black",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            marginTop: "-1px",
                          }}
                        >
                          SECTION
                        </div>
                      </td>
                      <td
                        colSpan={8}
                        rowSpan={2}
                        style={{
                          color: "black",
                          height: "0.3in",
                          fontSize: "12px",
                          fontWeight: "bold",
                          backgroundColor: "gray",
                          border: "1px solid black",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            marginTop: "-1px",
                          }}
                        >
                          SCHEDULE ROOM
                        </div>
                      </td>
                      <td
                        colSpan={8}
                        rowSpan={2}
                        style={{
                          color: "black",
                          height: "0.3in",
                          fontFamily: "Arial, sans-serif",
                          fontSize: "12px",
                          fontWeight: "bold",
                          backgroundColor: "gray",
                          border: "1px solid black",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            marginTop: "-1px",
                          }}
                        >
                          FACULTY
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={1}
                        style={{
                          color: "black",
                          height: "0.1in",
                          fontSize: "50%",
                          backgroundColor: "gray",
                          border: "1px solid black",
                          textAlign: "center",
                        }}
                      >
                        Lec
                      </td>
                      <td
                        colSpan={1}
                        style={{
                          color: "black",
                          height: "0.1in",
                          fontSize: "50%",
                          backgroundColor: "gray",
                          border: "1px solid black",
                          textAlign: "center",
                        }}
                      >
                        Lab
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          color: "black",
                          height: "0.1in",
                          fontSize: "50%",
                          backgroundColor: "gray",
                          border: "1px solid black",
                          textAlign: "center",
                        }}
                      >
                        Credit
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          color: "black",
                          height: "0.1in",
                          fontSize: "50%",
                          backgroundColor: "gray",
                          border: "1px solid black",
                          textAlign: "center",
                        }}
                      >
                        Tuition
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          color: "black",
                          height: "0.1in",
                          fontSize: "50%",
                          backgroundColor: "gray",
                          border: "1px solid black",
                          textAlign: "center",
                          display: "none",
                        }}
                      >
                        Lec Value
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          color: "black",
                          height: "0.1in",
                          fontSize: "50%",
                          backgroundColor: "gray",
                          border: "1px solid black",
                          textAlign: "center",
                          display: "none",
                        }}
                      >
                        Lab Value
                      </td>
                    </tr>
                    {enrolled.map((item, index) => (
                      <tr key={index}>
                        <td colSpan={6} style={{ border: "1px solid black" }}>
                          <input
                            type="text"
                            value={item.course_code || ""}
                            readOnly
                            style={{
                              width: "98%",
                              border: "none",
                              textAlign: "center",
                              background: "none",
                              fontSize: "12px",
                            }}
                          />
                        </td>
                        <td colSpan={10} style={{ border: "1px solid black" }}>
                          <input
                            type="text"
                            value={item.course_description || ""}
                            readOnly
                            style={{
                              width: "98%",
                              border: "none",
                              background: "none",
                              textAlign: "center",
                              fontSize: "8px",
                            }}
                          />
                        </td>
                        <td colSpan={1} style={{ border: "1px solid black" }}>
                          <input
                            type="text"
                            value={
                              item.course_unit == null
                                ? ""
                                : toWholeUnit(item.course_unit)
                            }
                            readOnly
                            style={{
                              width: "98%",
                              border: "none",
                              background: "none",
                              textAlign: "center",
                              fontSize: "12px",
                            }}
                          />
                        </td>
                        <td colSpan={1} style={{ border: "1px solid black" }}>
                          <input
                            type="text"
                            value={
                              item.lab_unit == null
                                ? ""
                                : toWholeUnit(item.lab_unit)
                            }
                            readOnly
                            style={{
                              width: "98%",
                              border: "none",
                              background: "none",
                              textAlign: "center",
                              fontSize: "12px",
                            }}
                          />
                        </td>
                        <td colSpan={2} style={{ border: "1px solid black" }}>
                          <input
                            type="text"
                            value={
                              toWholeUnit(item.course_unit) +
                              toWholeUnit(item.lab_unit)
                            }
                            style={{
                              width: "98%",
                              border: "none",
                              background: "none",
                              textAlign: "center",
                              fontSize: "12px",
                            }}
                            readOnly
                          />
                        </td>

                        <td colSpan={2} style={{ border: "1px solid black" }}>
                          <input
                            type="text"
                            value={
                              toWholeUnit(item.course_unit) +
                              toWholeUnit(item.lab_unit)
                            }
                            style={{
                              width: "98%",
                              border: "none",
                              background: "none",
                              textAlign: "center",
                              fontSize: "12px",
                            }}
                            readOnly
                          />
                        </td>
                        <td
                          colSpan={2}
                          style={{ border: "1px solid black", display: "none" }}
                        >
                          <input
                            type="text"
                            value={item.total_lec_value ?? ""}
                            readOnly
                            style={{
                              width: "98%",
                              border: "none",
                              background: "none",
                              textAlign: "center",
                              fontSize: "12px",
                            }}
                          />
                        </td>
                        <td
                          colSpan={2}
                          style={{ border: "1px solid black", display: "none" }}
                        >
                          <input
                            type="text"
                            value={item.total_lab_value ?? ""}
                            readOnly
                            style={{
                              width: "98%",
                              border: "none",
                              background: "none",
                              textAlign: "center",
                              fontSize: "12px",
                            }}
                          />
                        </td>
                        <td colSpan={4} style={{ border: "1px solid black" }}>
                          <input
                            type="text"
                            value={item.description || ""}
                            readOnly
                            style={{
                              width: "98%",
                              border: "none",
                              background: "none",
                              textAlign: "center",
                              fontSize: "12px",
                            }}
                          />
                        </td>
                        <td colSpan={8} style={{ border: "1px solid black" }}>
                          <input
                            type="text"
                            value={`${item.day_description} ${item.school_time_start}-${item.school_time_end}`}
                            readOnly
                            style={{
                              width: "98%",
                              border: "none",
                              background: "none",
                              textAlign: "center",
                              fontSize: "8px",
                            }}
                          />
                        </td>
                        <td colSpan={8} style={{ border: "1px solid black" }}>
                          <input
                            type="text"
                            value={`Prof. ${item.lname}`}
                            readOnly
                            style={{
                              width: "98%",
                              border: "none",
                              background: "none",
                              textAlign: "center",
                              fontSize: "8px",
                            }}
                          />
                        </td>
                      </tr>
                    ))}

                    {/*----------------------------------------------------------------------------------------------------------------------------------*/}

                    <tr>
                      <td
                        colSpan={10}
                        style={{
                          height: "0.1in",
                          fontSize: "45%",
                          color: "black",
                          textAlign: "left",
                        }}
                      >
                        <b>Note: Subject marked with "*" is Special Subject</b>
                      </td>
                      <td
                        colSpan={6}
                        style={{
                          fontSize: "50%",
                          color: "black",
                          textAlign: "CENTER",
                        }}
                      >
                        <b>Total Unit(s)</b>
                      </td>
                      <td
                        colSpan={1}
                        style={{
                          fontSize: "12px",
                          color: "black",
                          fontFamily: "Arial",
                          textAlign: "center",
                        }}
                      >
                        {totalCourseUnits}
                      </td>
                      <td
                        colSpan={1}
                        style={{
                          fontSize: "12px",
                          color: "black",
                          fontFamily: "Arial",
                          textAlign: "center",
                        }}
                      >
                        {totalLabUnits}
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          fontSize: "12px",
                          color: "black",
                          fontFamily: "Arial",
                          textAlign: "center",
                        }}
                      >
                        {totalCourseUnits + totalLabUnits}
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          fontSize: "12px",
                          color: "black",
                          fontFamily: "Arial",
                          textAlign: "center",
                        }}
                      >
                        {totalCombined}
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          fontSize: "12px",
                          color: "black",
                          fontFamily: "Arial",
                          textAlign: "center",
                          display: "none",
                        }}
                      >
                        {totalLecFees}
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          fontSize: "12px",
                          color: "black",
                          fontFamily: "Arial",
                          textAlign: "center",
                          display: "none",
                        }}
                      >
                        {totalLabFees}
                      </td>

                      <td
                        colSpan={2}
                        style={{
                          height: "0.1in",
                          fontSize: "55%",
                          color: "black",
                          textAlign: "center",
                        }}
                      ></td>
                      <td
                        colSpan={3}
                        style={{
                          height: "0.1in",
                          fontSize: "55%",
                          color: "black",
                          textAlign: "center",
                        }}
                      ></td>
                    </tr>
                  
                    <tr
                      colSpan={12}
                      style={{
                        color: "white",

                        height: "0.1in",
                        fontSize: "62.5%",
                        backgroundColor: "gray",
                        textAlign: "center",
                      }}
                    ></tr>
                  </tbody>
                </table>

                <div
                  className="fee-table-con"
                  style={{
                    display: "flex",
                    width: "8in",
                    margin: "0 auto",
                    alignItems: "flex-start",
                    borderLeft: "1px solid black",
                    borderRight: "1px solid black",
                  }}
                >
                  <div style={{ width: "50%", marginLeft: "9px" }}>
                    <table
                      className="fee-table"
                      style={{
                        borderCollapse: "collapse",
                        fontFamily: "Arial, Helvetica, sans-serif",
                        width: "100%",
                        textAlign: "center",
                        tableLayout: "fixed",
                        borderLeft: "none",
                        borderRight: "none",
                        borderBottom: "none",
                        borderTop: "1px solid black",
                      }}
                    >
                      <style>{`

                        .fee-table td {
                          padding-top: 0px;
                          padding-bottom: 0px;
                        }
                        .fee-table input {
                          padding-top: 0px;
                          padding-bottom: 0px;
                          line-height: 1;
                        }
                      `}</style>
                      <tbody>
                        <tr>
                          <td
                            colSpan={20}
                            style={{
                              margin: "0px",
                              padding: "0px",
                              fontSize: "63.5%",
                              border: "1px solid black",
                              backgroundColor: "gray",
                              height: "auto",
                            }}
                          >
                            <input
                              type="text"
                              value={"A S S E S S E D  F E E S"}
                              readOnly
                              style={{
                                color: "black",
                                fontWeight: "bold",
                                margin: "0px",
                                padding: "0px",
                                textAlign: "center",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                                height: "auto",
                                lineHeight: "1",
                              }}
                            />
                          </td>
                        </tr>

                        <tr style={{borderLeft: "1px solid black", height: "2px", borderRight: "1px solid black"}}>
                          <td colSpan={20}>

                          </td>
                        </tr>

                        <tr style={{height: "2px",}}>
                          <td colSpan={15} style={{ padding: 0, borderLeft: "1px solid black"}}>
                            <input
                              type="text"
                              value={`Tuition (${totalCourseUnits} unit(s))`}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "60.5%",
                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={Number(totalLecFees) + Number(totalLabFees)}
                              readOnly
                              style={{
                                textAlign: "center",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "black",
                                width: "100%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={15}
                            style={{
                              fontSize: "62.5%",
                              borderLeft: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={"Athletic Fee"}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",
                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={tosf[0]?.athletic_fee || "0"}
                              readOnly
                              style={{
                                textAlign: "center",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "black",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={15}
                            style={{
                              fontSize: "62.5%",
                              borderLeft: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={"NSTP Fee"}
                              readOnly
                              style={{
                                display: isHaveNSTP === 0 ? "none" : "block",
                                color: "black",
                                width: "98%",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",
                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={tosf[0]?.nstp_fees || "0"}
                              readOnly
                              style={{
                                display: isHaveNSTP === 0 ? "none" : "block",
                                textAlign: "center",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "black",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={15}
                            style={{
                              fontSize: "62.5%",
                              borderLeft: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={"Cultural Fee"}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",

                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={tosf[0]?.cultural_fee || "0"}
                              readOnly
                              style={{
                                textAlign: "center",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "black",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={15}
                            style={{
                              fontSize: "62.5%",
                              borderLeft: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={"Developmental Fee"}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",

                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={tosf[0]?.developmental_fee || "0"}
                              readOnly
                              style={{
                                textAlign: "center",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "black",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={15}
                            style={{
                              fontSize: "62.5%",
                              borderLeft: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={"Guidance Fee"}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",

                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={tosf[0]?.guidance_fee || "0"}
                              readOnly
                              style={{
                                textAlign: "center",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "black",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={15}
                            style={{
                              fontSize: "62.5%",
                              borderLeft: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={"Library Fee"}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",

                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={tosf[0]?.library_fee || "0"}
                              readOnly
                              style={{
                                textAlign: "center",
                                color: "black",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={15}
                            style={{
                              fontSize: "62.5%",
                              borderLeft: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={"Medical and Dental Fee"}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",

                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={tosf[0]?.medical_and_dental_fee || "0"}
                              readOnly
                              style={{
                                textAlign: "center",
                                color: "black",
                                width: "98%",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={15}
                            style={{
                              fontSize: "62.5%",
                              borderLeft: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={"Registration Fee"}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",

                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={tosf[0]?.registration_fee || "0"}
                              readOnly
                              style={{
                                textAlign: "center",
                                color: "black",
                                width: "98%",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={15}
                            style={{
                              fontSize: "62.5%",
                              borderLeft: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={"School ID Fee"}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                                display: isFirstYearFirstSem ? "block" : "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",

                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={tosf[0]?.school_id_fees || "0"}
                              readOnly
                              style={{
                                textAlign: "center",
                                color: "black",
                                width: "98%",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                outline: "none",
                                display: isFirstYearFirstSem ? "block" : "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={15}
                            style={{
                              fontSize: "62.5%",
                              borderLeft: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={"Computer Fee"}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                                display:
                                  isHaveComputerFees === 0 ? "none" : "block",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",

                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={tosf[0]?.computer_fees || "0"}
                              readOnly
                              style={{
                                textAlign: "center",
                                color: "black",
                                width: "98%",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                outline: "none",
                                display:
                                  isHaveComputerFees === 0 ? "none" : "block",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={15}
                            style={{
                              fontSize: "62.5%",
                              borderLeft: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={"Laboratory Fee"}
                              readOnly
                              style={{
                                display: isHaveLaboratory === 0 ? "none" : "block",
                                color: "black",
                                width: "98%",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",
                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={tosf[0]?.laboratory_fees || "0"}
                              readOnly
                              style={{
                                display: isHaveLaboratory === 0 ? "none" : "block",
                                textAlign: "center",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "black",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={2}
                            style={{
                              fontSize: "62.5%",
                              marginRight: "20px",
                              borderLeft: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={13}
                            style={{
                              fontSize: "62.5%",
                              marginRight: "20px",
                            }}
                          >
                            <input
                              type="text"
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",
                              marginRight: "20px",

                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              readOnly
                              style={{
                                textAlign: "left",
                                color: "black",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={2}
                            style={{
                              marginRight: "20px",
                              borderLeft: "1px solid black",
                            }}
                          ></td>
                          <td
                            colSpan={13}
                            style={{
                              fontSize: "62.5%",
                            }}
                          >
                            <input
                              type="text"
                              value={"Total Assessment : "}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",
                              marginRight: "20px",

                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={
                                totalLecFees +
                                totalLabFees +
                                Number(tosf[0]?.cultural_fee || 0) +
                                Number(tosf[0]?.athletic_fee || 0) +
                                (isHaveNSTP !== 0
                                  ? Number(tosf[0]?.nstp_fees || 0)
                                  : 0) +
                                Number(tosf[0]?.developmental_fee || 0) +
                                Number(tosf[0]?.guidance_fee || 0) +
                                Number(tosf[0]?.library_fee || 0) +
                                Number(tosf[0]?.medical_and_dental_fee || 0) +
                                Number(tosf[0]?.registration_fee || 0) +
                                (isHaveComputerFees !== 0
                                  ? Number(tosf[0]?.computer_fees || 0)
                                  : 0) +
                                (isHaveLaboratory !== 0
                                  ? Number(tosf[0]?.laboratory_fees || 0)
                                  : 0)
                              }
                              readOnly
                              style={{
                                textAlign: "center",
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={2}
                            style={{
                              marginRight: "20px",
                              borderLeft: "1px solid black",
                            }}
                          ></td>
                          <td
                            colSpan={13}
                            style={{
                              fontSize: "62.5%",
                            }}
                          >
                            <input
                              type="text"
                              value={"Less Financial Aid : "}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",
                              marginRight: "20px",

                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              readOnly
                              style={{
                                textAlign: "center",
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={2}
                            style={{
                              marginRight: "20px",
                              borderLeft: "1px solid black",
                            }}
                          ></td>
                          <td
                            colSpan={13}
                            style={{
                              fontSize: "62.5%",
                            }}
                          >
                            <input
                              type="text"
                              value={"Net Assessed : "}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",
                              marginRight: "20px",

                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              readOnly
                              style={{
                                textAlign: "center",
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>
                        
                        <tr>
                          <td
                            colSpan={2}
                            style={{
                              marginRight: "20px",
                              borderLeft: "1px solid black",
                            }}
                          ></td>
                          <td
                            colSpan={13}
                            style={{
                              fontSize: "62.5%",
                            }}
                          >
                            <input
                              type="text"
                              value={"Credit Memo : "}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",
                              marginRight: "20px",

                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              readOnly
                              style={{
                                textAlign: "center",
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>

                        </tr>

                        <tr>
                          <td
                            colSpan={2}
                            style={{
                              marginRight: "20px",
                              borderLeft: "1px solid black",
                            }}
                          ></td>
                          <td
                            colSpan={13}
                            style={{
                              fontSize: "62.5%",
                            }}
                          >
                            <input
                              type="text"
                              value={"Total Discount : "}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",
                              marginRight: "20px",

                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              readOnly
                              style={{
                                textAlign: "center",
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={2}
                            style={{
                              marginRight: "20px",
                              borderLeft: "1px solid black",
                            }}
                          ></td>
                          <td
                            colSpan={13}
                            style={{
                              fontSize: "62.5%",
                            }}
                          >
                            <input
                              type="text"
                              value={"Total Payment : "}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={5}
                            style={{
                              fontSize: "62.5%",
                              marginRight: "20px",

                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              readOnly
                              style={{
                                textAlign: "center",
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={2}
                            style={{
                              marginRight: "20px",
                              borderLeft: "1px solid black",
                            }}
                          ></td>
                          <td
                            colSpan={18}
                            style={{
                              fontSize: "62.5%",
                              borderRight: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={"Outstanding Balance : "}
                              readOnly
                              style={{
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr style={{borderLeft: "1px solid black", height: "5px", borderRight: "1px solid black"}}>
                          <td>

                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={20}
                            style={{
                              margin: "0px",
                              padding: "0px",
                              fontSize: "63.5%",
                              border: "1px solid black",
                              backgroundColor: "gray",
                              height: "auto",
                            }}
                          >
                            <input
                              type="text"
                              value={"S C H E D U L E O F P A Y M E N T"}
                              readOnly
                              style={{
                                color: "black",
                                fontWeight: "bold",
                                margin: "0px",
                                padding: "0px",
                                textAlign: "center",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                                lineHeight: "1",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              fontSize: "62.5%",
                              border: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={"1st Payment/Due"}
                              readOnly
                              style={{
                                color: "black",
                                textAlign: "center",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={6}
                            style={{
                              border: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={"2nd Payment/Due"}
                              readOnly
                              style={{
                                color: "black",
                                textAlign: "center",
                                fontWeight: "bold",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={7}
                            style={{
                              border: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              value={"3rd Payment/Due"}
                              readOnly
                              style={{
                                color: "black",
                                textAlign: "center",
                                fontWeight: "bold",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              fontSize: "62.5%",
                              border: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              readOnly
                              style={{
                                color: "black",
                                fontWeight: "bold",
                                textAlign: "center",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={6}
                            style={{
                              fontSize: "62.5%",
                              border: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              readOnly
                              style={{
                                color: "black",
                                textAlign: "center",
                                fontWeight: "bold",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={7}
                            style={{
                              fontSize: "62.5%",
                              border: "1px solid black",
                            }}
                          >
                            <input
                              type="text"
                              readOnly
                              style={{
                                color: "black",
                                textAlign: "center",
                                width: "98%",
                                fontWeight: "bold",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={12}
                            style={{
                              fontSize: "62.5%",
                            }}
                          >
                            <input
                              type="text"
                              value={"Payment/Validation Date : "}
                              readOnly
                              style={{
                                color: "black",
                                textAlign: "center",
                                width: "98%",
                                fontWeight: "bold",
                                textDecorationThickness: "2px", // <-- Thicker underline

                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={8}
                            style={{
                              height: "0.25in",
                              fontSize: "12px",
                              fontFamily: "Arial",
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <input
                              type="text"
                              value={shortDate}
                              readOnly
                              style={{
                                color: "black",
                                textAlign: "center",
                                width: "100%", // ensures full-width underline
                                border: "none",
                                outline: "none",

                                fontWeight: "bold",
                                background: "none",
                                borderBottom: "1px solid black", // thicker, longer underline
                              }}
                            />
                          </td>
                        </tr>
                        
                        <tr>
                          <td
                            colSpan={9}
                            style={{
                              fontSize: "62.5%",
                            }}
                          >
                            <input
                              type="text"
                              value={"Official Receipt :"}
                              readOnly
                              style={{
                                color: "black",
                                textAlign: "center",
                                width: "98%",
                                fontWeight: "bold",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                          <td
                            colSpan={10}
                            style={{
                              fontSize: "62.5%",
                              textAlign: "center",
                              fontWeight: "Bold",
                            }}
                          >
                            <input
                              type="text"
                              value={"Scholar"}
                              readOnly
                              style={{
                                color: "black",
                                textAlign: "center",
                                width: "95%",
                                fontWeight: "bold",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                border: "none",
                                outline: "none",
                                background: "none",
                                borderBottom: "1px solid black", // underlines the field like a line
                              }}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ width: "50%" }}>
                    <table
                      style={{
                        borderCollapse: "collapse",
                        fontFamily: "Arial, Helvetica, sans-serif",
                        width: "100%",
                        margin: "0",
                        textAlign: "center",
                        tableLayout: "fixed",
                        borderLeft: "none",
                        borderBottom: "none",
                        borderTop: "none",
                      }}
                    >
                      <tbody>
                        <br />
                        <tr>
                          <td style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>
                            <input
                              type="text"
                              value={"RULES OF REFUND"}
                              readOnly
                              style={{
                                textAlign: "center",
                                color: "black",
                                width: "98%",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>
                        {[
                          "1. Full refund of tuition fee - Before the start of classes.",
                          "2. 80% refund of tuition fee - within 1 week from the start of classes.",
                          "3. 50% refund - within 2 weeks from the start of classes.",
                          "4. No refund - after the 2nd week of classes.",
                        ].map((rule, index) => (
                          <tr key={`refund-rule-${index}`}>
                            <td style={{ fontSize: "10px" }}>
                              <input
                                type="text"
                                value={rule}
                                readOnly
                                style={{
                                  textAlign: "left",
                                  color: "black",
                                  paddingLeft: "40px",
                                  width: "98%",
                                  border: "none",
                                  fontFamily: "Arial, sans-serif",
                                  fontSize: "10px",
                                  fontWeight: "bold",
                                  outline: "none",
                                  background: "none",
                                  fontStyle: "italic",
                                }}
                              />
                            </td>
                          </tr>
                        ))}

                        <tr>
                          <td style={{ height: "0.12in" }}></td>
                        </tr>

                        <tr>
                          <td style={{ fontSize: "12px", fontWeight: "bold" }}>
                            <input
                              type="text"
                              value={"PLEDGE UPON ADMISSION"}
                              readOnly
                              style={{
                                fontWeight: "bold",
                                textAlign: "center",
                                color: "black",
                                width: "98%",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontSize: "10px", fontWeight: "bold" }}>
                            <input
                              type="text"
                              value={
                                "\"As a student of EARIST, I do solemnly promise that I will"
                              }
                              readOnly
                              style={{
                                textAlign: "center",
                                color: "black",
                                width: "98%",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "10px",
                                fontWeight: "bold",
                                outline: "none",
                                background: "none",
                                fontStyle: "italic",
                              }}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontSize: "10px", fontWeight: "bold" }}>
                            <input
                              type="text"
                              value={"comply with the rules and regulations of the Institution.\""}
                              readOnly
                              style={{
                                textAlign: "center",
                                color: "black",
                                width: "98%",
                                border: "none",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "10px",
                                fontWeight: "bold",
                                outline: "none",
                                background: "none",
                                fontStyle: "italic",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td style={{ height: "0.2in" }}></td>
                        </tr>

                        <tr>
                          <td>
                            <input
                              type="text"
                              value={"_________________________________"}
                              readOnly
                              style={{
                                color: "black",
                                textAlign: "center",
                                fontWeight: "bold",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                textDecoration: "underline",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <input
                              type="text"
                              value={"Student's Signature"}
                              readOnly
                              style={{
                                color: "black",
                                textAlign: "center",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                fontWeight: "bold",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td style={{ height: "0.12in" }}></td>
                        </tr>
                        <tr>
                          <td style={{ height: "0.12in" }}></td>
                        </tr>

                        <tr>
                          <td style={{ textAlign: "left", paddingLeft: "20px" }}>
                            <input
                              type="text"
                              value={"APPROVED BY : "}
                              readOnly
                              style={{
                                color: "black",
                                textAlign: "left",
                                fontWeight: "bold",
                                width: "98%",
                                border: "none",
                                outline: "none",
                                background: "none",
                                fontSize: "12px"
                              }}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td style={{ textAlign: "center", fontSize: "12px" }}>
                            {approvedBy?.signature_image && (
                              <img
                                src={`${API_BASE_URL}/uploads/${approvedBy.signature_image}`}
                                alt="Signature"
                                style={{
                                  height: "60px",
                                  objectFit: "contain",
                                  width: "250px",
                                  marginBottom: "2px",
                                  display: !student_number ? "none" : "block",
                                  marginLeft: "auto",
                                  marginRight: "auto",
                                }}
                              />
                            )}

                            <div
                              style={{
                                display: "inline-block",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                marginTop: "-10px",
                                fontWeight: "bold",
                                lineHeight: "1.1",
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  minHeight: "14px",
                                  display: !student_number ? "none" : "block",
                                }}
                              >
                                {approvedBy?.full_name || ""}
                              </div>
                              <div style={{ whiteSpace: "pre", marginTop: "-6px" }}>
                                __________________________________
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <input
                              type="text"
                              value={"Registrar"}
                              readOnly
                              style={{
                                color: "black",
                                textAlign: "center",
                                width: "98%",
                                fontWeight: "bold",
                                fontFamily: "Arial, sans-serif",
                                fontSize: "12px",
                                border: "none",
                                outline: "none",
                                background: "none",
                              }}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <table
                  style={{
                    borderCollapse: "collapse",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    width: "8in",
                    margin: "0 auto",
                    textAlign: "center",
                    tableLayout: "fixed",
                    borderLeft: "1px solid black",
                    borderBottom: "1px solid black",
                    borderRight: "1px solid black",
                  }}
                >
                  <tbody>
                    {/* TOP ROW: IMAGE (LEFT) + QR (RIGHT) */}
                    <tr>
                      {/* LEFT SIDE */}
                      <td
                        style={{
                          width: "50%",
                          textAlign: "left",
                          paddingLeft: "50px", // ?? margin-left effect
                        }}
                      >
                        <img
                          src={FreeTuitionImage}
                          alt="EARIST MIS FEE"
                          style={{
                            width: "175px",
                            height: "125px",
                          }}
                        />
                      </td>

                      {/* RIGHT SIDE */}
                      <td
                        style={{
                          width: "100%",
                          paddingRight: "30px",
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        {hasStudentData && (
                          <img
                            className="qr-code-img"
                            style={{ width: "150px", height: "150px", }}
                            src={`${API_BASE_URL}/uploads/QrCodeGenerated/${student_number}_qrcode.png`}
                            alt="QR Code"
                          />
                        )}
                      </td>
                    </tr>

                    {/* DATE ROW */}
                    <tr>
                      <td
                        colSpan={2}
                        style={{
                          height: "0.25in",
                          fontSize: "15px",
                          textAlign: "right",
                          verticalAlign: "middle",
                          paddingRight: "20px",
                        }}
                      >
                        <input
                          type="text"
                          value={longDate}
                          readOnly
                          style={{
                            color: "black",
                            textAlign: "right",
                            width: "98%",
                            border: "none",
                            outline: "none",
                            background: "none",
                          }}
                        />
                      </td>
                    </tr>

                    {/* FOOTER */}
                    <tr>
                      <td
                        colSpan={2}
                        style={{
                          height: "0.2in",
                          fontSize: "72.5%",
                          backgroundColor: "gray",
                          color: "white",
                        }}
                      >
                        <b>
                          <i
                            style={{
                              color: "black",
                              textAlign: "center",
                              display: "block",
                            }}
                          >
                            KEEP THIS CERTIFICATE. YOU WILL BE REQUIRED TO PRESENT THIS IN ALL
                            YOUR DEALINGS WITH THE COLLEGE.
                          </i>
                        </b>
                      </td>
                    </tr>
                  </tbody>
                </table>

              </div>
            </div>
          </div>
        </div>

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={handleSnackClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleSnackClose}
            severity={snack.severity || "info"}
            variant="filled"
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </Container>
    );
  },
);

export default CertificateOfRegistration;

