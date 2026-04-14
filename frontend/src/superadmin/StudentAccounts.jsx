import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    Paper,
    Typography,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Select,
    MenuItem,
    Grid,
    FormControl
} from "@mui/material";
import API_BASE_URL from "../apiConfig";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import SearchIcon from "@mui/icons-material/Search";
import {
    Snackbar,
    Alert
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import PrintIcon from "@mui/icons-material/Print";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import SendIcon from "@mui/icons-material/Send";

const rowsPerPage = 100;

export default function StudentAccounts() {
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

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success"
    });


    const branchMap = React.useMemo(() => {
        return branches.reduce((acc, branch) => {
            acc[branch.id] = branch.branch;
            return acc;
        }, {});
    }, [branches]);

    const generatePassword = (length = 10) => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let password = "";

        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return password;
    };
    const [userID, setUserID] = useState("");
    const [user, setUser] = useState("");
    const [userRole, setUserRole] = useState("");
    const [adminData, setAdminData] = useState({ dprtmnt_id: "" });

    const [hasAccess, setHasAccess] = useState(null);
    const [loading, setLoading] = useState(false);


    const pageId = 143;

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
            const response = await axios.get(
                `${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`,
            );
            if (response.data && response.data.page_privilege === 1) {
                setHasAccess(true);
            } else {
                setHasAccess(false);
            }
        } catch (error) {
            console.error("Error checking access:", error);
            setHasAccess(false);
            if (error.response && error.response.data.message) {
                console.log(error.response.data.message);
            } else {
                console.log("An unexpected error occurred.");
            }
            setLoading(false);
        }
    };

    const [persons, setPersons] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [generatedPassword, setGeneratedPassword] = useState("");



    const fetchPersons = async () => {
        try {
            const res = await axios.get(
                `${API_BASE_URL}/api/student_list`,
                {
                    params: {
                        page: currentPage,
                        limit: 100,
                        search: searchQuery
                    }
                }
            );

            setPersons(res.data.data);
            setTotalPages(res.data.totalPages);
            setTotalStudents(res.data.total);

        } catch (err) {
            console.error(err);
        }
    };

    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);

    const handleOpen = async (person) => {
        try {
            setLoading(true);

            const res = await axios.get(
                `${API_BASE_URL}/api/student_list/${person.student_number}`
            );

            let selectedData;

            if (res.data.length > 0) {
                selectedData = res.data[0];
            } else {
                selectedData = person;
            }

            setSelectedPerson(selectedData);

            // ✅ AUTO-FILL EXISTING EMAIL
            setEmail(selectedData.emailAddress || "");

            setGeneratedPassword("");

            setOpen(true);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    const printAccountSlip = (student, password, email) => {
        const resolvedCampusAddress =
            campusAddress || "No address set in Settings";

        const logoSrc = fetchedLogo || EaristLogo;
        const name = companyName?.trim() || "";

        const words = name.split(" ");
        const middleIndex = Math.ceil(words.length / 2);
        const firstLine = words.slice(0, middleIndex).join(" ");
        const secondLine = words.slice(middleIndex).join(" ");

        const printWindow = window.open("", "_blank");

        printWindow.document.write(`
    <html>
      <head>
        <title>Student Account Slip</title>
        <style>
          @page {
            size: A5 portrait;
            margin: 8mm;
          }

          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }

          .print-container {
            padding: 10px;
          }

          .print-header {
            text-align: center;
            margin-bottom: 15px;
          }

          .header-top {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }

          .header-top img {
            width: 65px;
            height: 65px;
            border-radius: 50%;
            object-fit: cover;
          }

          .header-text {
            text-align: center;
          }

          .school-name {
            font-size: 15px;
            font-weight: bold;
            letter-spacing: 1px;
          }

          .title {
            margin-top: 15px;
            font-size: 18px;
            font-weight: bold;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            border: 1.5px solid black;
          }

          th, td {
            border: 1.5px solid black;
            padding: 8px;
            font-size: 13px;
            text-align: left;
          }

          th {
            background-color: lightgray;
            color: black;
            width: 35%;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .password-box {
            margin-top: 20px;
            border: 2px dashed black;
            padding: 15px;
            text-align: center;
          }

          .password {
            font-size: 22px;
            font-weight: bold;
            color: red;
            letter-spacing: 2px;
          }

          .footer-note {
            margin-top: 15px;
            font-size: 12px;
            text-align: center;
          }
        </style>
      </head>

      <body onload="window.print(); setTimeout(() => window.close(), 100);">
        <div class="print-container">

          <!-- HEADER -->
          <div class="print-header">
            <div class="header-top">
              <img src="${logoSrc}" alt="School Logo" />

              <div class="header-text">
                <div style="font-size: 11px;">
                  Republic of the Philippines
                </div>

                <div class="school-name">
                  ${firstLine}
                </div>

                ${secondLine
                ? `<div class="school-name">${secondLine}</div>`
                : ""
            }

                <div style="font-size: 11px;">
                  ${resolvedCampusAddress}
                </div>
              </div>
            </div>

            <div class="title">
              Student Portal Account Slip
            </div>
          </div>

          <!-- TABLE -->
          <table>
            <tr>
              <th>Student Number</th>
              <td>${student.student_number || ""}</td>
            </tr>

            <tr>
              <th>Last Name</th>
              <td>${student.last_name || ""}</td>
            </tr>

            <tr>
              <th>First Name</th>
              <td>${student.first_name || ""}</td>
            </tr>

            <tr>
              <th>Middle Name</th>
              <td>${student.middle_name || ""}</td>
            </tr>

            <tr>
              <th>Email Address</th>
              <td>${email}</td>
            </tr>

            <tr>
              <th>Username</th>
              <td>${email} / ${student.student_number}</td>
            </tr>
          </table>

          <!-- PASSWORD -->
          <div class="password-box">
            <div style="font-size:14px; margin-bottom:8px;">
              Generated Password
            </div>

            <div class="password">
              ${password}
            </div>
          </div>

          <div class="footer-note">
            Please change password after first login.
          </div>
        </div>
      </body>
    </html>
    `);

        printWindow.document.close();
    };


    const handleNotify = async () => {
        try {
            if (!generatedPassword) {
                setSnackbar({
                    open: true,
                    message: "Please generate password first",
                    severity: "warning"
                });
                return;
            }

            setLoading(true);

            const res = await axios.post(
                `${API_BASE_URL}/api/notify_student`,
                {
                    person_id: selectedPerson.person_id,
                    email,
                    password: generatedPassword // ✅ use existing
                }
            );

            if (res.data.success) {
                setSnackbar({
                    open: true,
                    message: "Email sent successfully!",
                    severity: "success"
                });

                printAccountSlip(
                    selectedPerson,
                    generatedPassword,
                    email
                );
            }
        } catch (error) {
            console.error(error);

            setSnackbar({
                open: true,
                message: "Failed to send email",
                severity: "error"
            });
        } finally {
            setLoading(false);
        }
    };


    const [searchQuery, setSearchQuery] = useState("");


    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchPersons();
        }, 500);

        return () => clearTimeout(timeout);
    }, [currentPage, searchQuery]);


    const startIndex =
        (currentPage - 1) *
        rowsPerPage;

    const currentData = persons || [];

    const paginationButtonStyle = {
        minWidth: 70,
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
    };

    const paginationSelectStyle = {
        fontSize: '12px',
        height: 36,
        color: 'white',
        border: '1px solid white',
        backgroundColor: 'transparent',
        '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
        '& svg': { color: 'white' }
    };

    // Put this at the very bottom before the return
    if (loading || hasAccess === null) {
        return <LoadingOverlay open={loading} message="Loading..." />;
    }

    if (!hasAccess) {
        return <Unauthorized />;
    }

    return (
        <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>



            {/* Top header: DOCUMENTS SUBMITTED + Search + Import */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",

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
                    STUDENT ACCOUNTS
                </Typography>


                <TextField
                    variant="outlined"
                    placeholder="Search Student Number / Name / Program / Department"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1); // reset to first page when searching
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
                        startAdornment: (
                            <SearchIcon sx={{ mr: 1, color: "gray" }} />
                        ),
                    }}
                />

            </Box>

            <hr style={{ border: "1px solid #ccc", width: "100%" }} />
            <br />
            <br />






            {/* TOP PAGINATION + TOTAL */}
            <TableContainer>
                <Table size="small">

                    <TableHead>

                        <TableRow>

                            <TableCell
                                colSpan={4}
                                sx={{
                                    border: `1px solid ${borderColor}`,
                                    py: 0.5,
                                    backgroundColor:
                                        settings?.header_color ||
                                        "#1976d2",
                                    color: "white"
                                }}
                            >

                                <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    flexWrap="wrap"
                                    gap={1}
                                >

                                    {/* TOTAL STUDENTS */}
                                    <Typography
                                        fontSize="14px"
                                        fontWeight="bold"
                                        color="white"
                                    >
                                        Total Students: {totalStudents}
                                    </Typography>

                                    {/* PAGINATION */}
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={1}
                                        flexWrap="wrap"
                                    >

                                        <Button
                                            onClick={() =>
                                                setCurrentPage(1)
                                            }
                                            disabled={
                                                currentPage === 1
                                            }
                                            variant="outlined"
                                            size="small"
                                            sx={paginationButtonStyle}
                                        >
                                            First
                                        </Button>

                                        <Button
                                            onClick={() =>
                                                setCurrentPage(prev =>
                                                    Math.max(prev - 1, 1)
                                                )
                                            }
                                            disabled={
                                                currentPage === 1
                                            }
                                            variant="outlined"
                                            size="small"
                                            sx={paginationButtonStyle}
                                        >
                                            Prev
                                        </Button>

                                        <FormControl
                                            size="small"
                                            sx={{ minWidth: 80 }}
                                        >
                                            <Select
                                                value={currentPage}
                                                onChange={(e) =>
                                                    setCurrentPage(
                                                        Number(e.target.value)
                                                    )
                                                }
                                                sx={paginationSelectStyle}
                                                MenuProps={{
                                                    PaperProps: {
                                                        sx: {
                                                            maxHeight: 200
                                                        }
                                                    }
                                                }}
                                            >
                                                {Array.from(
                                                    {
                                                        length: totalPages
                                                    },
                                                    (_, i) => (
                                                        <MenuItem
                                                            key={i + 1}
                                                            value={i + 1}
                                                        >
                                                            Page {i + 1}
                                                        </MenuItem>
                                                    )
                                                )}
                                            </Select>
                                        </FormControl>

                                        <Typography
                                            fontSize="11px"
                                            color="white"
                                        >
                                            of {totalPages} page
                                            {totalPages > 1
                                                ? "s"
                                                : ""}
                                        </Typography>

                                        <Button
                                            onClick={() =>
                                                setCurrentPage(prev =>
                                                    Math.min(
                                                        prev + 1,
                                                        totalPages
                                                    )
                                                )
                                            }
                                            disabled={
                                                currentPage ===
                                                totalPages
                                            }
                                            variant="outlined"
                                            size="small"
                                            sx={paginationButtonStyle}
                                        >
                                            Next
                                        </Button>

                                        <Button
                                            onClick={() =>
                                                setCurrentPage(
                                                    totalPages
                                                )
                                            }
                                            disabled={
                                                currentPage ===
                                                totalPages
                                            }
                                            variant="outlined"
                                            size="small"
                                            sx={paginationButtonStyle}
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


            {/* TABLE */}
            <Box
                sx={{

                    overflowY: "auto"
                }}
            >

                <Table
                    stickyHeader
                    size="small"
                >

                    <TableHead>

                        <TableRow>
                            <TableCell
                                sx={{
                                    border: `1px solid ${borderColor}`,
                                    backgroundColor: "#f5f5f5"
                                }}
                            >
                                #
                            </TableCell>
                            <TableCell
                                sx={{
                                    border: `1px solid ${borderColor}`,
                                    backgroundColor: "#f5f5f5"
                                }}
                            >
                                Campus
                            </TableCell>
                            <TableCell
                                sx={{
                                    border: `1px solid ${borderColor}`,
                                    backgroundColor: "#f5f5f5"
                                }}
                            >
                                Student Number
                            </TableCell>

                            <TableCell
                                sx={{
                                    border: `1px solid ${borderColor}`,
                                    backgroundColor: "#f5f5f5"
                                }}
                            >
                                Name
                            </TableCell>

                            <TableCell
                                sx={{
                                    border: `1px solid ${borderColor}`,
                                    backgroundColor: "#f5f5f5"
                                }}
                            >
                                Department
                            </TableCell>


                            <TableCell
                                sx={{
                                    border: `1px solid ${borderColor}`,
                                    backgroundColor: "#f5f5f5"
                                }}
                            >
                                Program
                            </TableCell>
                            <TableCell
                                sx={{
                                    border: `1px solid ${borderColor}`,
                                    backgroundColor: "#f5f5f5"
                                }}
                            >
                                Email Address
                            </TableCell>


                        </TableRow>

                    </TableHead>


                    <TableBody>

                        {currentData.map(
                            (row, index) => (

                                <TableRow
                                    key={row.person_id}
                                >
                                    <TableCell
                                        sx={{
                                            border: `1px solid ${borderColor}`
                                        }}
                                    >
                                        {startIndex + index + 1}
                                    </TableCell>

                                    <TableCell
                                        sx={{
                                            border: `1px solid ${borderColor}`
                                        }}
                                    >
                                        {branchMap[row.campus] || ""}
                                    </TableCell>




                                    <TableCell
                                        sx={{
                                            border: `1px solid ${borderColor}`
                                        }}
                                    >

                                        <Typography
                                            sx={{
                                                color: "blue",
                                                cursor: "pointer",
                                                textDecoration:
                                                    "underline"
                                            }}
                                            onClick={() =>
                                                handleOpen(row)
                                            }
                                        >
                                            {row.student_number}
                                        </Typography>

                                    </TableCell>


                                    <TableCell
                                        sx={{
                                            border: `1px solid ${borderColor}`
                                        }}
                                    >
                                        {row.last_name},
                                        {row.first_name}
                                        {row.middle_name}
                                    </TableCell>

                                    <TableCell
                                        sx={{
                                            border: `1px solid ${borderColor}`
                                        }}
                                    >
                                        {row.dprtmnt_name}
                                    </TableCell>


                                    <TableCell
                                        sx={{
                                            border: `1px solid ${borderColor}`
                                        }}
                                    >
                                        {row.program_code} - {row.program_description} ({row.major})
                                    </TableCell>

                                    <TableCell
                                        sx={{
                                            border: `1px solid ${borderColor}`
                                        }}>
                                        {row.emailAddress ? (
                                            <Typography color="green">
                                                {row.emailAddress}
                                            </Typography>
                                        ) : (
                                            <Typography color="red">
                                                No Email
                                            </Typography>
                                        )}
                                    </TableCell>


                                </TableRow>

                            )
                        )}

                    </TableBody>

                </Table>

            </Box>


            {/* BOTTOM PAGINATION (same as top) */}

            <TableContainer>
                <Table size="small">

                    <TableHead>

                        <TableRow>

                            <TableCell
                                colSpan={4}
                                sx={{
                                    border: `1px solid ${borderColor}`,
                                    py: 0.5,
                                    backgroundColor:
                                        settings?.header_color ||
                                        "#1976d2",
                                    color: "white"
                                }}
                            >

                                <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    flexWrap="wrap"
                                    gap={1}
                                >

                                    <Typography
                                        fontSize="14px"
                                        fontWeight="bold"
                                        color="white"
                                    >
                                        Total Students: {totalStudents}
                                    </Typography>

                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={1}
                                        flexWrap="wrap"
                                    >

                                        <Button
                                            onClick={() =>
                                                setCurrentPage(1)
                                            }
                                            disabled={
                                                currentPage === 1
                                            }
                                            variant="outlined"
                                            size="small"
                                            sx={paginationButtonStyle}
                                        >
                                            First
                                        </Button>

                                        <Button
                                            onClick={() =>
                                                setCurrentPage(prev =>
                                                    Math.max(prev - 1, 1)
                                                )
                                            }
                                            disabled={
                                                currentPage === 1
                                            }
                                            variant="outlined"
                                            size="small"
                                            sx={paginationButtonStyle}
                                        >
                                            Prev
                                        </Button>

                                        <FormControl
                                            size="small"
                                            sx={{ minWidth: 80 }}
                                        >
                                            <Select
                                                value={currentPage}
                                                onChange={(e) =>
                                                    setCurrentPage(
                                                        Number(e.target.value)
                                                    )
                                                }
                                                sx={paginationSelectStyle}
                                            >
                                                {Array.from(
                                                    {
                                                        length: totalPages
                                                    },
                                                    (_, i) => (
                                                        <MenuItem
                                                            key={i + 1}
                                                            value={i + 1}
                                                        >
                                                            Page {i + 1}
                                                        </MenuItem>
                                                    )
                                                )}
                                            </Select>
                                        </FormControl>

                                        <Typography
                                            fontSize="11px"
                                            color="white"
                                        >
                                            of {totalPages} page
                                            {totalPages > 1
                                                ? "s"
                                                : ""}
                                        </Typography>

                                        <Button
                                            onClick={() =>
                                                setCurrentPage(prev =>
                                                    Math.min(
                                                        prev + 1,
                                                        totalPages
                                                    )
                                                )
                                            }
                                            disabled={
                                                currentPage ===
                                                totalPages
                                            }
                                            variant="outlined"
                                            size="small"
                                            sx={paginationButtonStyle}
                                        >
                                            Next
                                        </Button>

                                        <Button
                                            onClick={() =>
                                                setCurrentPage(
                                                    totalPages
                                                )
                                            }
                                            disabled={
                                                currentPage ===
                                                totalPages
                                            }
                                            variant="outlined"
                                            size="small"
                                            sx={paginationButtonStyle}
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
                open={open}
                onClose={() => setOpen(false)}
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
                    Student Account Registration
                </DialogTitle>

                {/* CONTENT */}
                <DialogContent sx={{ p: 3 }}>
                    <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        sx={{ mb: 2, mt: 1 }}
                    >
                        Student Information
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="Student Number"
                                fullWidth
                                value={selectedPerson?.student_number || ""}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <TextField
                                label="Last Name"
                                fullWidth
                                value={selectedPerson?.last_name || ""}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <TextField
                                label="First Name"
                                fullWidth
                                value={selectedPerson?.first_name || ""}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Middle Name"
                                fullWidth
                                value={selectedPerson?.middle_name || ""}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>
                    </Grid>

                    <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        sx={{ mt: 4, mb: 2 }}
                    >
                        Account Details
                    </Typography>

                    <TextField
                        label="Email Address"
                        fullWidth
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    {generatedPassword && (
                        <Box
                            mt={3}
                            p={3}
                            sx={{
                                border: "2px dashed #1976d2",
                                borderRadius: 2,
                                textAlign: "center",
                                backgroundColor: "#f9f9f9"
                            }}
                        >
                            <Typography variant="h6" gutterBottom>
                                Generated Password
                            </Typography>

                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: "bold",
                                    letterSpacing: 2,
                                    color: "#d32f2f"
                                }}
                            >
                                {generatedPassword}
                            </Typography>

                            <Typography variant="body2" mt={1}>
                                Please print or save this password.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>

                {/* ACTIONS */}
                {/* ACTIONS */}
                <DialogActions
                    sx={{
                        px: 3,
                        py: 2,
                        borderTop: "1px solid #e0e0e0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "#fafafa"
                    }}
                >
                    {/* CANCEL */}
                    <Button
                        onClick={() => setOpen(false)}
                        variant="contained"
                        color="error"


                        startIcon={<CancelIcon />}
                        sx={{
                            fontWeight: 600,
                            borderRadius: 2,
                            minWidth: 110
                        }}
                    >
                        Cancel
                    </Button>

                    {/* RIGHT SIDE - SINGLE LINE */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "nowrap" // 🚫 NO WRAP (IMPORTANT)
                        }}
                    >
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VpnKeyIcon />}
                            onClick={() => {
                                const pwd = generatePassword(10);
                                setGeneratedPassword(pwd);
                            }}
                            sx={{ fontWeight: 600 }}
                        >
                            Generate
                        </Button>

                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PrintIcon />}
                            disabled={!generatedPassword}
                            onClick={() =>
                                printAccountSlip(
                                    selectedPerson,
                                    generatedPassword,
                                    email
                                )
                            }
                            sx={{ fontWeight: 600 }}
                        >
                            Print
                        </Button>

                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<SendIcon />}
                            disabled={!generatedPassword || !email}
                            onClick={handleNotify}
                            sx={{
                                fontWeight: 700,
                                px: 2.5
                            }}
                        >
                            Send
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() =>
                    setSnackbar({ ...snackbar, open: false })
                }
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() =>
                        setSnackbar({ ...snackbar, open: false })
                    }
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

        </Box>
    );
}
