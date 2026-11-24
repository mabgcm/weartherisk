"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Original designs, bold statements",
  "Free shipping on orders $75+ CAD",
  "New drops land every season",
  "Say it like you mean it",
];

/** Seasonal Christmas-ordering reminder, shown Nov 20 – Dec 4 (made-to-order + shipping time). */
function seasonalMessage(): string | null {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  if ((month === 10 && day >= 20) || (month === 11 && day <= 4)) return "Made to order for Christmas — order by Dec 4";
  return null;
}

export function AnnouncementTicker() {
  const [messages] = useState(() => {
    const seasonal = seasonalMessage();
    return seasonal ? [seasonal, ...MESSAGES] : MESSAGES;
  });
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((value) => (value + 1) % messages.length), 4000);
    return () => clearInterval(timer);
  }, [messages.length]);
  return (
    <div className="announcement" role="status" aria-live="polite">
      <p key={index} className="ticker-message">{messages[index % messages.length]}</p>
    </div>
  );
}
