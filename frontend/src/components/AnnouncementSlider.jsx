import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE_URL from "../apiConfig";

const AnnouncementSlider = () => {
    const [slides, setSlides] = useState([]);
    const [index, setIndex] = useState(0);

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

    useEffect(() => {
        if (slides.length <= 1) return;

        const timer = setInterval(() => {
            setIndex(prev => (prev + 1) % slides.length);
        }, 4000);

        return () => clearInterval(timer);
    }, [slides.length]);

    if (!slides.length) {
        return (
            <div
                style={{
                    width: "700px",
                    height: "700px",
                    background: "#f2f2f2",
                }}
            />
        );
    }

    const current = slides[index];
    if (!current?.file_path) return null;

    return (
        <div
            style={{
                width: "950px",
                height: "700px",
                overflow: "hidden",
                marginRight: "300px",
                border: "2px solid black",
                background: "#000",
                display: "flex",
                marginTop: "-130px",   // ✅ THIS works
                alignItems: "center",
                marginLeft: "125px",
       
                justifyContent: "center",
                borderRadius: "30px",
    
                overflow: "hidden",
            }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={current.id}
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        borderRadius: "30px",
                        overflow: "hidden"

                    }}
                >
                    {/* Image */}
                    <img
                        src={`${API_BASE_URL}/uploads/announcement/${current.file_path}`}
                        alt={current.title}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "30px",

                        }}
                    />

                    {/* Text Overlay */}
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
