/*
 * CoreLock Security — Icon Logo (Sidebar Collapsed)
 */

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  svg: {
    width: 28,
    height: 28,
  },
});

const LogoIcon = () => {
  const classes = useStyles();

  return (
    <svg
      className={classes.svg}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 36 40"
      fill="none"
    >
      {/* Outer shield */}
      <path
        d="M18 2L4 8v10c0 9.55 5.97 18.48 14 22 8.03-3.52 14-12.45 14-22V8L18 2z"
        fill="#0A1628"
        stroke="#00D4FF"
        strokeWidth="2.5"
      />
      {/* Inner shield glow */}
      <path
        d="M18 5L7 10v8c0 7.73 4.84 14.97 11 17.8 6.16-2.83 11-10.07 11-17.8v-8L18 5z"
        fill="#0A1628"
        opacity="0.8"
      />
      {/* Lock body */}
      <rect
        x="12"
        y="17"
        width="12"
        height="10"
        rx="2"
        fill="#00D4FF"
      />
      {/* Lock shackle */}
      <path
        d="M14 17v-3a4 4 0 0 1 8 0v3"
        stroke="#00D4FF"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Keyhole */}
      <circle cx="18" cy="22" r="1.5" fill="#0A1628" />
      <rect x="17.25" y="23" width="1.5" height="2.5" rx="0.5" fill="#0A1628" />
    </svg>
  );
};

export default LogoIcon;
