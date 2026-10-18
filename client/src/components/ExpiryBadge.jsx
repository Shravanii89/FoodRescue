import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

const ExpiryBadge = ({ expiryTime, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState({ text: '', isExpired: false, hours: 0 });

  useEffect(() => {
    const calculate = () => {
      if (!expiryTime) return;
      const now = new Date().getTime();
      const target = new Date(expiryTime).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ text: 'Expired', isExpired: true, hours: 0 });
        return;
      }

      const totalHours = diff / (1000 * 60 * 60);
      const hours = Math.floor(totalHours);
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft({ text: `${days}d ${hours % 24}h left`, isExpired: false, hours: totalHours });
      } else if (hours >= 1) {
        setTimeLeft({ text: `${hours}h ${minutes}m left`, isExpired: false, hours: totalHours });
      } else {
        setTimeLeft({ text: `${minutes} mins left`, isExpired: false, hours: totalHours });
      }
    };

    calculate();
    const interval = setInterval(calculate, 30000);
    return () => clearInterval(interval);
  }, [expiryTime]);

  if (timeLeft.isExpired) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5" />
        Expired
      </span>
    );
  }

  // Critical (<2 hours left)
  if (timeLeft.hours < 2) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse shadow-sm ${className}`}>
        <Clock className="w-3.5 h-3.5" />
        {timeLeft.text} (Urgent)
      </span>
    );
  }

  // Elevated (<6 hours left)
  if (timeLeft.hours < 6) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
        <Clock className="w-3.5 h-3.5" />
        {timeLeft.text}
      </span>
    );
  }

  // Comfortable window
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
      <Clock className="w-3.5 h-3.5" />
      {timeLeft.text}
    </span>
  );
};

export default ExpiryBadge;
