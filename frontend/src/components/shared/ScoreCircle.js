import React from 'react';
import { motion } from 'framer-motion';

export default function ScoreCircle({ score = 0, size = 120, label, color }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (color) return color;
    if (s >= 80) return '#10b981';
    if (s >= 60) return '#0ea5e9';
    if (s >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const strokeColor = getColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ width: size, height: size }} className="relative">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={strokeColor} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            style={{ filter: `drop-shadow(0 0 6px ${strokeColor}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-bold font-display"
            style={{ color: strokeColor }}
          >
            {score}
          </motion.span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>/ 100</span>
        </div>
      </div>
      {label && <p className="text-sm font-medium text-center" style={{ color: 'var(--text-secondary)' }}>{label}</p>}
    </div>
  );
}
