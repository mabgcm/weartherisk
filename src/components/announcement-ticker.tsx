"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Made to order — never mass-produced",
  "Free shipping on orders $75+ CAD",
  "New drops land every season",
  "Say it like you mean it",
];

export function AnnouncementTicker() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((value) => (value + 1) % MESSAGES.length), 4000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="announcement" role="status" aria-live="polite">
      <p key={index} className="ticker-message">{MESSAGES[index]}</p>
    </div>
  );
}
