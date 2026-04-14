import React, { useState, useEffect, useContext, useRef } from "react";
import { SettingsContext } from "../App";
import {
    Box,
    Paper,
    Typography,
    FormControl,
    Select,
    MenuItem,
    TextField,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Snackbar,
    Alert,
} from "@mui/material";
import axios from "axios";
import API_BASE_URL from "../apiConfig";
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import html2canvas from "html2canvas";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from "recharts";

const PRIORITY_FEE_CONFIG = [
    { priority: 0, key: "tuition_fees", label: "Tuition Fees" },
    { priority: 1, key: "registration_fees", label: "Registration Fee" },
    { priority: 2, key: "school_id_fees", label: "School Id Fee" },
    { priority: 3, key: "medical_and_dental_fees", label: "Medical and Dental Fee" },
    { priority: 4, key: "computer_fees", label: "Computer Fee" },
    { priority: 5, key: "laboratory_fees", label: "Laboratory Fee" },
    { priority: 6, key: "guidance_fees", label: "Guidance Fee" },
    { priority: 7, key: "athletic_fees", label: "Athletic Fee" },
    { priority: 8, key: "library_fees", label: "Library Fee" },
    { priority: 9, key: "cultural_fees", label: "Cultural Fee" },
    { priority: 10, key: "development_fees", label: "Development Fee" },
    { priority: 11, key: "nstp_fees", label: "NSTP Fees" },
];

const RECEIPT_MISC_BREAKDOWN_CONFIG = [
    { key: "registration_fees", label: "Registration Fee" },
    { key: "athletic_fees", label: "Athletic Fee" },
    { key: "computer_fees", label: "Computer Fee" },
    { key: "cultural_fees", label: "Cultural Fee" },
    { key: "development_fees", label: "Development Fee" },
    { key: "guidance_fees", label: "Guidance Fee" },
    { key: "laboratory_fees", label: "Laboratory Fee" },
    { key: "library_fees", label: "Library Fee" },
    { key: "medical_and_dental_fees", label: "Medical and Dental Fee" },
    { key: "school_id_fees", label: "School ID Fee" },
];

const toAmount = (value) => {
    const normalizedValue =
        typeof value === "string" ? value.replace(/,/g, "").trim() : value;
    const parsed = Number(normalizedValue);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
};

const computePriorityPayment = (row, paymentInput) => {
    const totalPayment = toAmount(paymentInput);
    const totalTosf =
        toAmount(row?.total_tosf) ||
        (toAmount(row?.tuition_fees) + toAmount(row?.total_misc) + toAmount(row?.nstp_fees));

    let remaining = totalPayment;
    const deductions = [];

    for (const item of PRIORITY_FEE_CONFIG) {
        const feeAmount = toAmount(row?.[item.key]);
        if (feeAmount <= 0) {
            deductions.push({
                ...item,
                fee_amount: feeAmount,
                paid_amount: 0,
                status: "skipped",
                remaining_after: remaining,
            });
            continue;
        }

        if (remaining <= 0) {
            deductions.push({
                ...item,
                fee_amount: feeAmount,
                paid_amount: 0,
                status: "unpaid",
                remaining_after: 0,
            });
            continue;
        }

        if (remaining >= feeAmount) {
            remaining -= feeAmount;
            deductions.push({
                ...item,
                fee_amount: feeAmount,
                paid_amount: feeAmount,
                status: "paid",
                remaining_after: remaining,
            });
            continue;
        }

        deductions.push({
            ...item,
            fee_amount: feeAmount,
            paid_amount: remaining,
            status: "partial",
            remaining_after: 0,
        });
        remaining = 0;
    }

    const appliedPayment = Math.max(totalPayment - remaining, 0);
    const unpaidTotalRaw = Math.max(totalTosf - appliedPayment, 0);
    const unpaidTotal = Number(unpaidTotalRaw.toFixed(2));

    return {
        totalPayment,
        appliedPayment,
        balance: unpaidTotal,
        totalTosf,
        unpaidTotal,
        deductions,
        paymentStatus: totalPayment > 0 ? 1 : 0,
    };
};

const MatriculationPaymentModule = () => {
    const settings = useContext(SettingsContext);

    const [borderColor, setBorderColor] = useState("#000000");
    const [titleColor, setTitleColor] = useState("#6D2323");
    const [loading, setLoading] = useState(false);
    const [hasAccess, setHasAccess] = useState(null);
    const pageId = 121;

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState([]);
    const [keepVisiblePaidMatriculationId, setKeepVisiblePaidMatriculationId] = useState(null);
    const pageSize = 100; // Number of rows per page
    const visibleData = data.filter((row) => {
        const isPaid = Number(row?.payment_status) === 1;
        const keepVisible = String(row?.id) === String(keepVisiblePaidMatriculationId);
        return !isPaid || keepVisible;
    });

    const totalPages = Math.max(1, Math.ceil(visibleData.length / pageSize));

    // Dialog states
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmRow, setConfirmRow] = useState(null);
    const [paymentValue, setPaymentValue] = useState("");
    const [personData, setPersonData] = useState(null);
    const [viewReceiptPromptOpen, setViewReceiptPromptOpen] = useState(false);
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [closeWithoutPrintConfirmOpen, setCloseWithoutPrintConfirmOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [transactionData, setTransactionData] = useState([]);
    const [voidingReceipt, setVoidingReceipt] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "info",
    });

    const showSnackbar = (message, severity = "info") => {
        setSnackbar({ open: true, message, severity });
    };

    const a5PrintRef = useRef(null);
    const receiptPrintedRef = useRef(false);

    useEffect(() => {
        if (!settings) return;
        if (settings.border_color) setBorderColor(settings.border_color);
        if (settings.title_color) setTitleColor(settings.title_color);
    }, [settings]);

    useEffect(() => {
        const storedUser = localStorage.getItem("email");
        const storedRole = localStorage.getItem("role");
        const storedID = localStorage.getItem("person_id");
        const storedEmployeeID = localStorage.getItem("employee_id");

        if (storedUser && storedRole && storedID) {
            if (storedRole === "registrar") {
                checkAccess(storedEmployeeID);
            } else {
                window.location.href = "/login";
            }
        } else {
            window.location.href = "/login";
        }
    }, []);

    const checkAccess = async (employeeIDValue) => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/page_access/${employeeIDValue}/${pageId}`,
            );
            if (response.data && response.data.page_privilege === 1) {
                setHasAccess(true);
                await fetchStudentData();
            } else {
                setHasAccess(false);
            }
        } catch (error) {
            console.error("Error checking access:", error);
            setHasAccess(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        const person_id = localStorage.getItem("person_id");
        const role = localStorage.getItem("role");

        if (person_id && role) {
            axios
                .get(`${API_BASE_URL}/api/person_data/${person_id}/${role}`)
                .then((res) => setPersonData(res.data))
                .catch((err) => console.error("Failed to fetch person data:", err));
        }
    }, []);

    const fetchStudentData = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/get_student_data_matriculation`);
            setData(res.data);
        } catch {
            showSnackbar("Failed to fetch matriculation data.", "error");
        }
    }

    const handleTransfer = async (row, payment) => {
        try {
            const saveEndpoint = "/api/payment_matriculation/";
            const employeeId = personData?.employee_id || localStorage.getItem("employee_id");
            const paymentSummary = computePriorityPayment(row, payment);

            if (!employeeId) {
                showSnackbar("Employee id is required to save this payment.", "error");
                return;
            }

            if (paymentSummary.totalPayment <= 0) {
                showSnackbar("Payment must be greater than zero.", "warning");
                return;
            }

            const saveRes = await axios.put(`${API_BASE_URL}${saveEndpoint}${row.id}`, {
                payment: paymentSummary.totalPayment,
                balance: paymentSummary.balance,
                payment_status: paymentSummary.paymentStatus,
                employee_id: employeeId,
            });
            setKeepVisiblePaidMatriculationId(row?.id ?? null);
            await fetchStudentData();
            setReceiptData({
                transaction_id: saveRes?.data?.transaction_id || "",
                student_number: row?.student_number || "",
                student_name: `${row?.last_name || ""}, ${row?.given_name || ""} ${row?.middle_initial || ""}`.trim(),
                total_tosf: paymentSummary.totalTosf,
                tuition_fees: row?.tuition_fees ?? 0,
                total_misc: row?.total_misc ?? 0,
                nstp_fees: row?.nstp_fees ?? 0,
                registration_fees: row?.registration_fees ?? 0,
                athletic_fees: row?.athletic_fees ?? 0,
                computer_fees: row?.computer_fees ?? 0,
                cultural_fees: row?.cultural_fees ?? 0,
                development_fees: row?.development_fees ?? 0,
                guidance_fees: row?.guidance_fees ?? 0,
                laboratory_fees: row?.laboratory_fees ?? 0,
                library_fees: row?.library_fees ?? 0,
                medical_and_dental_fees: row?.medical_and_dental_fees ?? 0,
                school_id_fees: row?.school_id_fees ?? 0,
                payment_entered: paymentSummary.totalPayment,
                payment_applied: paymentSummary.appliedPayment,
                balance: paymentSummary.balance,
                unpaid_total: paymentSummary.unpaidTotal,
                payment_breakdown: paymentSummary.deductions,
                employee_id: employeeId,
                active_school_year_id: saveRes?.data?.active_school_year_id || row?.active_school_year_id || "",
                remark: "Matriculation payment",
                created_at: new Date().toLocaleString(),
            });
            receiptPrintedRef.current = false;
            setViewReceiptPromptOpen(true);
            showSnackbar("Matriculation payment saved successfully.", "success");

        } catch (error) {
            console.error(error);
            showSnackbar(
                error?.response?.data?.message || "Failed to save matriculation payment.",
                "error"
            );
        }
    };

    const openConfirm = (row) => {
        setConfirmRow(row);
        setPaymentValue(row?.payment ?? "");
        setConfirmOpen(true);
    };

    const closeConfirm = () => {
        setConfirmOpen(false);
        setConfirmRow(null);
        setPaymentValue("");
    };

    const handleConfirmTransfer = async () => {
        if (!confirmRow) return;
        if (paymentValue === "" || paymentValue === null) {
            showSnackbar("Payment is required.", "warning");
            return;
        }
        const paymentSummary = computePriorityPayment(confirmRow, paymentValue);
        if (paymentSummary.totalPayment > paymentSummary.totalTosf) {
            showSnackbar("Payment exceeds the student's total amount to pay (Total Amount to pay).", "warning");
            return;
        }
        try {
            await handleTransfer(confirmRow, paymentValue);
            setConfirmOpen(false);
            setConfirmRow(null);
            setPaymentValue("");
        } catch (error) {
            console.error(error);
        }
    };

    const openTransactionHistory = async () => {
        setHistoryOpen(true);
        setHistoryLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/payment_matriculation/transactions`);
            setTransactionData(res.data || []);
            showSnackbar("Transaction history loaded.", "success");
        } catch (error) {
            console.error(error);
            showSnackbar(
                error?.response?.data?.message || "Failed to load transaction history.",
                "error"
            );
            setTransactionData([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handlePrintA5 = async () => {
        if (!a5PrintRef.current) return;
        receiptPrintedRef.current = true;

        let canvas;
        try {
            canvas = await html2canvas(a5PrintRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
            });
        } catch (error) {
            console.error("Failed to capture receipt for printing:", error);
            showSnackbar("Failed to print receipt.", "error");
            return;
        }

        const imageData = canvas.toDataURL("image/png", 1.0);
        const printWindow = window.open("", "_blank", "width=900,height=700");
        if (!printWindow) return;

        printWindow.document.write(`
            <!doctype html>
            <html>
                <head>
                    <title>Matriculation Payment Receipt</title>
                    <style>
                        @page { size: A5 portrait; margin: 0; }
                        html, body {
                            width: 148mm;
                            height: 210mm;
                            margin: 0;
                            padding: 0;
                            overflow: hidden;
                            background: #fff;
                        }
                        .print-page {
                            width: 148mm;
                            height: 210mm;
                        }
                        .print-page img {
                            width: 100%;
                            height: 100%;
                            display: block;
                        }
                    </style>
                </head>
                <body>
                    <div class="print-page">
                        <img src="${imageData}" alt="Matriculation Receipt" />
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };
    };

    const markNotPrintedIfUnprinted = async () => {
        if (receiptPrintedRef.current) return;
        const transactionId = receiptData?.transaction_id;
        if (!transactionId || receiptData?.remark === "Not Printed") return;

        try {
            await axios.put(`${API_BASE_URL}/api/payment_matriculation/remark/${transactionId}`, {
                remark: "Not Printed",
            });
            setReceiptData((prev) => ({
                ...prev,
                remark: "Not Printed",
            }));
            showSnackbar("Receipt not printed. Transaction marked as Not Printed.", "warning");
        } catch (error) {
            console.error(error);
            showSnackbar(
                error?.response?.data?.message || "Failed to mark unprinted receipt.",
                "error"
            );
        }
    };

    const handleVoidReceipt = async () => {
        const transactionId = receiptData?.transaction_id;
        if (!transactionId) {
            showSnackbar("No transaction id found for this receipt.", "warning");
            return;
        }

        try {
            setVoidingReceipt(true);
            await axios.put(`${API_BASE_URL}/api/payment_matriculation/void/${transactionId}`);
            setReceiptData((prev) => ({
                ...prev,
                remark: "Void",
            }));
            showSnackbar("Receipt marked as void.", "success");
        } catch (error) {
            console.error(error);
            showSnackbar(
                error?.response?.data?.message || "Failed to void receipt.",
                "error"
            );
        } finally {
            setVoidingReceipt(false);
        }
    };

    const handleViewReceiptNo = async () => {
        setViewReceiptPromptOpen(false);
        await markNotPrintedIfUnprinted();
        receiptPrintedRef.current = false;
        setKeepVisiblePaidMatriculationId(null);
        await fetchStudentData();
    };

    const handleViewReceiptYes = () => {
        setViewReceiptPromptOpen(false);
        receiptPrintedRef.current = false;
        setReceiptOpen(true);
    };

    const handleCloseReceipt = async () => {
        if (!receiptPrintedRef.current) {
            setCloseWithoutPrintConfirmOpen(true);
            return;
        }

        await markNotPrintedIfUnprinted();
        setReceiptOpen(false);
        receiptPrintedRef.current = false;
        setKeepVisiblePaidMatriculationId(null);
        await fetchStudentData();
    };

    const handleConfirmCloseWithoutPrint = async () => {
        setCloseWithoutPrintConfirmOpen(false);
        await markNotPrintedIfUnprinted();
        setReceiptOpen(false);
        receiptPrintedRef.current = false;
        setKeepVisiblePaidMatriculationId(null);
        await fetchStudentData();
    };

    const handleCancelCloseWithoutPrint = () => {
        setCloseWithoutPrintConfirmOpen(false);
    };

    const paginatedData = visibleData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const numberToWords = (num) => {
        if (num === 0) return "Zero";

        const belowTwenty = [
            "", "One", "Two", "Three", "Four", "Five", "Six",
            "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
            "Thirteen", "Fourteen", "Fifteen", "Sixteen",
            "Seventeen", "Eighteen", "Nineteen"
        ];

        const tens = [
            "", "", "Twenty", "Thirty", "Forty",
            "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
        ];

        const thousands = ["", "Thousand", "Million", "Billion"];

        const helper = (n) => {
            if (n === 0) return "";
            if (n < 20) return belowTwenty[n] + " ";
            if (n < 100)
                return tens[Math.floor(n / 10)] + " " + helper(n % 10);
            return (
                belowTwenty[Math.floor(n / 100)] +
                " Hundred " +
                helper(n % 100)
            );
        };

        let word = "";
        let i = 0;

        while (num > 0) {
            if (num % 1000 !== 0) {
                word =
                    helper(num % 1000) +
                    thousands[i] +
                    " " +
                    word;
            }
            num = Math.floor(num / 1000);
            i++;
        }

        return word.trim();
    };

    const confirmPaymentSummary = confirmRow ? computePriorityPayment(confirmRow, paymentValue) : null;
    const isOverPayment = Boolean(
        confirmPaymentSummary && confirmPaymentSummary.totalPayment > confirmPaymentSummary.totalTosf
    );
    const receiptMiscBreakdownItems = RECEIPT_MISC_BREAKDOWN_CONFIG.filter(
        (item) => toAmount(receiptData?.[item.key]) > 0
    );



    const confirmPaymentChartData = [
        {
            name: "Total Amount",
            amount: toAmount(confirmPaymentSummary?.totalTosf),
            color: "#6D2323",
        },
        {
            name: "Student Payment",
            amount: toAmount(confirmPaymentSummary?.totalPayment),
            color: "#1565C0",
        },
        {
            name: "Balance",
            amount: toAmount(confirmPaymentSummary?.balance),
            color: "#EF6C00",
        },
    ];

    if (loading || hasAccess === null) {
        return <LoadingOverlay open={loading} message="Loading..." />;
    }

    if (!hasAccess) {
        return <Unauthorized />;
    }

    return (
        <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    flexWrap: "wrap",
                    mb: 2
                }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: "bold",
                        color: titleColor,
                        fontSize: "36px"
                    }}
                >
                    MATRICULATION PAYMENT MODULE
                </Typography>
            </Box>

            <hr style={{ border: "1px solid #ccc", width: "100%" }} />
            <br />

            <Box fullWidth sx={{ p: '10px 0px', display: "flex", justifyContent: "flex-end" }}>
                <Button
                    startIcon={<HistoryToggleOffIcon />}
                    sx={{
                        backgroundColor: settings?.header_color || "maroon",
                        color: "white",
                        width: "230px",
                    }}
                    onClick={openTransactionHistory}
                >
                    Transaction History
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader size="small"
                    sx={{
                        "& th, & td": {
                            border: `1px solid ${borderColor}`,
                            textAlign: "center",
                            fontSize: "12px",
                        },
                        borderCollapse: "collapse",
                    }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell
                                colSpan={19}
                                sx={{
                                    py: 0.5,
                                    backgroundColor: settings?.header_color || "#6D2323",
                                    color: "white",
                                }}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography fontSize="14px" fontWeight="bold" color="white">
                                        Total Students: {visibleData.length}
                                    </Typography>
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

                        {/* COLUMN HEADERS */}
                        <TableRow>
                            <TableCell>No.</TableCell>
                            <TableCell>Campus</TableCell>
                            <TableCell>Student No.</TableCell>
                            <TableCell>Last Name</TableCell>
                            <TableCell>Given Name</TableCell>
                            <TableCell>MI</TableCell>
                            <TableCell>Degree Program</TableCell>
                            <TableCell>Year Level</TableCell>
                            <TableCell>Sex</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Lab Units</TableCell>
                            <TableCell>Comp Units</TableCell>
                            <TableCell>Acad Units</TableCell>
                            <TableCell>NSTP Units</TableCell>
                            <TableCell>Reg Fees</TableCell>
                            <TableCell>Tuition</TableCell>
                            <TableCell>Total Misc</TableCell>
                            <TableCell>Total Amount</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={19} align="center" sx={{ height: "4cm" }}>
                                    No students to display.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((row, index) => (
                                <TableRow key={row.id || index}>
                                    <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                                    <TableCell>{row.campus_name}</TableCell>
                                    <TableCell>{row.student_number}</TableCell>
                                    <TableCell>{row.last_name}</TableCell>
                                    <TableCell>{row.given_name}</TableCell>
                                    <TableCell>{row.middle_initial}</TableCell>
                                    <TableCell>{row.degree_program}</TableCell>
                                    <TableCell>{row.year_level}</TableCell>
                                    <TableCell>{row.sex}</TableCell>
                                    <TableCell>{row.email_address}</TableCell>
                                    <TableCell align="right">{row.laboratory_units}</TableCell>
                                    <TableCell align="right">{row.computer_units}</TableCell>
                                    <TableCell align="right">{row.academic_units_enrolled}</TableCell>
                                    <TableCell align="right">{row.academic_units_nstp_enrolled}</TableCell>
                                    <TableCell align="right">{row.registration_fees}</TableCell>
                                    <TableCell align="right">{row.tuition_fees}</TableCell>
                                    <TableCell align="right">{row.total_misc}</TableCell>
                                    <TableCell align="right">{row.total_tosf}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                        
                                            onClick={() => openConfirm(row)}
                                        >
                                            Transact to Matriculation
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer >

            {/* CONFIRM DIALOG */}
            <Dialog open={confirmOpen} onClose={closeConfirm} fullWidth maxWidth="lg">
                <DialogTitle>Confirm Payment</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to save the payment to Matriculation for student{" "}
                        {confirmRow?.student_number || ""}?
                    </DialogContentText>
                    <DialogContentText sx={{ mt: "20px", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <Box sx={{ mt: 1 }}>
                            <Box>
                                <Box sx={{ mb: 1, display: "flex", gap: 1 }}>
                                    <Box sx={{ width: "200px", height: "180px", background: "#6a0181", fontWeight: "700", padding: 2, color: "White", borderRadius: "10px" }}>
                                        <Typography>
                                            TOTAL:
                                        </Typography>
                                        <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "34px", marginTop: "-10px" }}>
                                            ₱{" "}{toAmount(confirmPaymentSummary?.totalTosf).toLocaleString()}
                                        </Box>
                                    </Box>
                                    <Box sx={{ width: "200px", height: "180px", background: "#094e9e", fontWeight: "700", padding: 2, color: "White", borderRadius: "10px" }}>
                                        <Typography>
                                            BALANCE:
                                        </Typography>
                                        <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "34px", marginTop: "-10px" }}>
                                            ₱{" "}{toAmount(confirmPaymentSummary?.balance).toLocaleString()}
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={{ mb: 1, display: "flex", gap: 1 }}>
                                    <Box sx={{ width: "410px", height: "180px", background: "#109917", fontWeight: "700", padding: 2, color: "White", borderRadius: "10px" }}>
                                        <Typography>
                                            STUDENT'S PAYMENT:
                                        </Typography>
                                        <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: "0px 20px", fontSize: "34px", marginTop: "-10px" }}>
                                            ₱{" "}{toAmount(confirmPaymentSummary?.totalPayment).toLocaleString()}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                            <TextField
                                size="small"
                                type="number"
                                label="Total Fee"
                                readOnly
                                disabled
                                value={confirmPaymentSummary?.totalTosf || 0}
                                sx={{
                                    mt: 2,
                                    width: "406px",
                                    "& .MuiInputBase-input": { fontSize: "20px" },
                                }}
                            /><br />
                            <TextField
                                size="small"
                                type="number"
                                label="Payment"
                                value={paymentValue}
                                onChange={(e) => setPaymentValue(e.target.value)}
                                sx={{
                                    mt: 2,
                                    width: "406px",
                                    "& .MuiInputBase-input": { fontSize: "20px" },
                                }}
                                error={isOverPayment}
                                helperText={
                                    isOverPayment
                                        ? `Payment exceeds Total Amount to pay (${toAmount(confirmPaymentSummary?.totalTosf).toLocaleString()}).`
                                        : ""
                                }
                            /><br />
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                disabled
                                label="Balance after Payment"
                                value={confirmPaymentSummary?.balance}
                                readOnly
                                sx={{
                                    mt: 2,
                                    width: "406px",
                                    "& .MuiInputBase-input": { fontSize: "20px" },
                                }}
                            />
                            <Box sx={{ mt: 2, width: "406px", display: "flex", alignItems: "center", justifyContent: "end" }}>
                                <Button onClick={closeConfirm}
                                    variant="contained"
                                    color="error"


                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleConfirmTransfer} variant="contained"  disabled={isOverPayment}>
                                    Confirm
                                </Button>
                            </Box>
                        </Box>
                        <Box>
                            <Box sx={{ mt: 2, p: 1, border: "1px solid #d9d9d9", borderRadius: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1, width: "700px" }}>
                                    Payment Summary Graph
                                </Typography>
                                <Box sx={{ height: 220, width: "100%" }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={confirmPaymentChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                                            <CartesianGrid stroke="#666666" strokeOpacity={0.7} strokeWidth={1.2} strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => Number(value).toLocaleString()} />
                                            <Bar dataKey="amount" radius={[6, 6, 0, 0]} fillOpacity={0.3}>
                                                {confirmPaymentChartData.map((entry) => (
                                                    <Cell key={entry.name} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Box>
                            <Box sx={{ mt: 2, p: 1, border: "1px solid #d9d9d9", borderRadius: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                                    Fee Breakdown in Privilege Order{" "}
                                </Typography>
                                <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
                                    Payment is applied in order from fee 0, then fee 1, and so on.
                                </Typography>
                                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 260 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Priority</TableCell>
                                                <TableCell>Fee</TableCell>
                                                <TableCell align="right">Fee Amount</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {(confirmPaymentSummary?.deductions || []).map((item) => (
                                                <TableRow key={item.key}>
                                                    <TableCell>{item.priority}</TableCell>
                                                    <TableCell>{item.label}</TableCell>
                                                    <TableCell align="right">{toAmount(item.fee_amount).toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Box>
                    </DialogContentText>
                </DialogContent>
            </Dialog>

            <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} fullWidth maxWidth="lg">
                <DialogTitle>Transaction History</DialogTitle>
                <DialogContent>
                    {historyLoading ? (
                        <Typography sx={{ py: 2 }}>Loading transaction history...</Typography>
                    ) : (
                        <TableContainer component={Paper} sx={{ mt: 1, maxHeight: 500 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>ID</strong></TableCell>
                                        <TableCell><strong>Student Number</strong></TableCell>
                                        <TableCell><strong>Payment</strong></TableCell>
                                        <TableCell><strong>Employee ID</strong></TableCell>
                                        <TableCell><strong>Active School Year ID</strong></TableCell>
                                        <TableCell><strong>Remark</strong></TableCell>
                                        <TableCell><strong>Created At</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {transactionData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">
                                                No transactions found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactionData.map((tx, idx) => (
                                            <TableRow key={`${tx.id}-${idx}`}>
                                                <TableCell>{tx.id}</TableCell>
                                                <TableCell>{tx.student_number}</TableCell>
                                                <TableCell>{tx.payment}</TableCell>
                                                <TableCell>{tx.employee_id}</TableCell>
                                                <TableCell>{tx.active_school_year_id}</TableCell>
                                                <TableCell>{tx.remark}</TableCell>
                                                <TableCell>{tx.created_at}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHistoryOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={viewReceiptPromptOpen} onClose={handleViewReceiptNo}>
                <DialogTitle>View Receipt</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Payment saved successfully. Do you wish to view the receipt?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleViewReceiptNo} color="inherit">
                        No
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleViewReceiptYes}
                    >
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={receiptOpen}
                onClose={handleCloseReceipt}
                PaperProps={{
                    sx: {
                        width: "168mm",
                        maxWidth: "168mm",
                        height: "210mm",
                        maxHeight: "210mm",
                    },
                }}
            >
                <DialogTitle>RECEIPT</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1, gap: 1 }}>
                        <Button variant="contained" onClick={handlePrintA5}>
                            Print
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleVoidReceipt}
                            disabled={voidingReceipt}
                        >
                            {voidingReceipt ? "Voiding..." : "Void"}
                        </Button>
                    </Box>

                    <Box
                        ref={a5PrintRef}
                        id="student-receipt-a5-print"
                        sx={{
                            mt: 1,
                            minWidth: "14.1cm",
                            maxWidth: "14.1cm",
                            minHeight: "21.7cm",
                            maxHeight: "21.7cm",
                            width: "14.1cm",
                            height: "21.7cm",
                            p: 2,
                            border: "1px solid #d9d9d9",
                            borderRadius: 1,
                            overflow: "auto",
                            boxSizing: "border-box",
                        }}
                    >
                        <Box>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Typography variant="body2" sx={{ mt: '4cm', ml: '6.5cm' }}>
                                </Typography>
                                <Typography variant="body2" sx={{ mt: '4cm', width: '3.1cm' }}>
                                    {receiptData?.transaction_id || "-"}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: '4cm', width: '2cm', ml: '2cm' }}>
                                    {new Date().toLocaleDateString()}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: '4cm', ml: '6.5cm' }}>
                                </Typography>
                            </Box>

                            <>
                                <Typography variant="body2" sx={{ mt: '0.5cm', marginLeft: '2.8cm' }}>
                                    {`${receiptData?.student_name || ""}`} ({receiptData?.student_number || " "})
                                </Typography>
                            </>

                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Typography variant="body2" sx={{ mt: '1.3cm', marginLeft: '1.7cm', width: '7cm' }}>
                                    TUITION FEE
                                </Typography>
                                <Typography variant="body2" sx={{ mt: '1.3cm', ml: '1cm', textAlign: 'right' }}>
                                    {receiptData?.tuition_fees ?? 0}
                                </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Typography variant="body2" sx={{ mt: '0.1cm', marginLeft: '1.7cm', width: '7cm' }}>
                                    MISCELLANEOUS FEE
                                </Typography>
                                <Typography variant="body2" sx={{ mt: '0.1cm', ml: '1cm', textAlign: 'right' }}>
                                    {receiptData?.total_misc ?? 0}
                                </Typography>
                            </Box>

                            {receiptMiscBreakdownItems.map((item) => (
                                <Box key={item.key} sx={{ display: "flex", alignItems: "center" }}>
                                    <Typography variant="body2" sx={{ mt: '0.1cm', marginLeft: '2.1cm', width: '6.6cm' }}>
                                        {item.label}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: '0.1cm', ml: '1cm', textAlign: 'right' }}>
                                        {toAmount(receiptData?.[item.key]).toLocaleString()}
                                    </Typography>
                                </Box>
                            ))}

                            <Box sx={{ display: "flex", alignItems: "center", mt: '0.1cm', }}>
                                {Number(receiptData?.nstp_fees) > 0 ? (
                                    <>
                                        <Typography variant="body2" sx={{ marginLeft: "1.7cm", width: "7cm" }}>
                                            NSTP FEE
                                        </Typography>
                                        <Typography variant="body2" sx={{ ml: "1cm", textAlign: "right" }}>
                                            {receiptData?.nstp_fees ?? 0}
                                        </Typography>
                                    </>
                                ) : (
                                    <>
                                        <Typography variant="body2" sx={{ marginTop: "0.4cm", marginLeft: "1.7cm", width: "7cm" }}>
                                            {" "}
                                        </Typography>
                                        <Typography variant="body2" sx={{ ml: "1cm", textAlign: "right" }}>
                                            {" "}
                                        </Typography>
                                    </>
                                )}
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Typography variant="body2" sx={{ mt: '1.5cm', marginLeft: '1.7cm', width: '7cm' }}>

                                </Typography>
                                <Typography variant="body2" sx={{ mt: '1.5cm', ml: '1cm' }}>
                                    {receiptData?.total_tosf || 0}
                                </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Typography variant="body2" sx={{ mt: '0.7cm', ml: '1.8cm' }}>
                                    {numberToWords(receiptData?.total_tosf || 0)}
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Typography variant="body2" sx={{ mt: '2cm', ml: '3.75cm' }}>
                                </Typography>
                                <Typography variant="body2" sx={{ mt: '2cm', width: '6cm', textAlign: 'center' }}>
                                    {personData
                                        ? `${personData.lname.toUpperCase()}, ${personData.fname.toUpperCase()}`
                                        : ""}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseReceipt} color="inherit">Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={closeWithoutPrintConfirmOpen}
                onClose={handleCancelCloseWithoutPrint}
            >
                <DialogContent>
                    <DialogContentText>
                        You have not printed this receipt yet. Do you want to close it anyway?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelCloseWithoutPrint}
                        variant="contained"
                        color="error"

                    >
                        No
                    </Button>
                    <Button variant="contained" color="error" onClick={handleConfirmCloseWithoutPrint}>
                        Yes, Close
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default MatriculationPaymentModule;
