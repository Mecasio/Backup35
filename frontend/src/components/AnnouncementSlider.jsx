import React, { useEffect, useState, useRef, memo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE_URL from "../apiConfig";

// ✅ MUI Icons
import IconButton from "@mui/material/IconButton";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const AnnouncementSlider = () => {
    const [slides, setSlides] = useState([]);
    const [index, setIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        axios
            .get(`${API_BASE_URL}/api/announcements`)
            .then(res => {
                if (Array.isArray(res.data.data)) {
                    setSlides(res.data.data);
                    setIndex(0);
                }
            })
            .catch(err => console.error("Announcement fetch error:", err));
    }, []);

    const intervalRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (slides.length <= 1 || isDragging || isHovered) return;

        const timer = setTimeout(() => {
            setIndex(prev => (prev + 1) % slides.length);
        }, 5000);

        return () => clearTimeout(timer);
    }, [slides.length, index, isDragging, isHovered]);



    if (!slides.length) {
        return (
            <div style={{ width: "700px", height: "700px", background: "#f2f2f2" }} />
        );
    }

    const handleDragEnd = (_, info) => {
        const threshold = 80;

        // ✅ STRICT horizontal detection
        if (Math.abs(info.offset.x) < Math.abs(info.offset.y)) {
            setIsDragging(false);
            return;
        }

        if (info.offset.x < -threshold && index < slides.length - 1) {
            setIndex(prev => prev + 1);
        } else if (info.offset.x > threshold && index > 0) {
            setIndex(prev => prev - 1);
        }

        setIsDragging(false);
    };

    const goNext = () => {
        if (index < slides.length - 1) {
            setIndex(prev => prev + 1);
        }
    };

    const goPrev = () => {
        if (index > 0) {
            setIndex(prev => prev - 1);
        }
    };

    const current = slides[index];
    if (!current?.file_path) return null;

    return (
        <div
            style={{
                width: "900px",
                height: "700px",
                marginRight: "300px",
                background: "#000",
                display: "flex",
                marginTop: "-130px",
                alignItems: "center",
                marginLeft: "125px",
                justifyContent: "center",
                borderRadius: "30px",
                overflow: "hidden", // ✅ important to hide side images
                position: "relative",
            }}
        >

            {/* ✅ LEFT BUTTON (MUI) */}
            <IconButton
                onClick={goPrev}
                sx={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    "&:hover": { background: "rgba(0,0,0,0.8)" }
                }}
            >
                <ArrowBackIosNewIcon />
            </IconButton>

            {/* ✅ RIGHT BUTTON (MUI) */}
            <IconButton
                onClick={goNext}
                sx={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    "&:hover": { background: "rgba(0,0,0,0.8)" }
                }}
            >
                <ArrowForwardIosIcon />
            </IconButton>

            <AnimatePresence mode="wait">
                <motion.div
                    key={current.id}
                    drag="x"
                    dragDirectionLock
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.02}

                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}

                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={handleDragEnd}

                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    transition={{ duration: 0.5 }}

                    style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        overflow: "hidden",
                        cursor: isDragging ? "grabbing" : "grab",
                    }}
                >

                    <img
                        src={`${API_BASE_URL}/uploads/announcement/${current.file_path}`}
                        alt={current.title}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            userSelect: "none",
                            pointerEvents: "none", // ✅ prevents weird drag glitches
                        }}
                        draggable={false}
                    />

                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            width: "100%",
                            padding: "1.2rem",
                            background: "rgba(0,0,0,0.6)",
                            color: "#fff",
                        }}
                    >
                        <h3 style={{ margin: 0 }}>{current.title}</h3>
                        <p style={{ marginTop: "0.4rem", fontSize: "0.9rem" }}>
                            {current.content}
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AnnouncementSlider;
