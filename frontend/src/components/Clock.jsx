import React, { useEffect, useState } from "react";
import { Typography, Box } from "@mui/material";

const Clock = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000); // smooth

    return () => clearInterval(timer);
  }, []);

  const formattedTime = dateTime.toLocaleTimeString("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const formattedDate = dateTime.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "short",
    month: "long",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <Box sx={{ textAlign: "right" }}>
      <Typography sx={{  fontSize: "16px" }}>
        <b>Date:</b> {formattedDate}
      </Typography>
      <Typography sx={{  fontSize: "16px"  }}>
        <b>Time:</b> {formattedTime}
      </Typography>

    </Box>
  );
};

export default Clock;