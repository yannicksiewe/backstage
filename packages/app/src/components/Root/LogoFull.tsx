/*
 * CoreLock Security — Full Logo (Sidebar Expanded)
 */

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  svg: {
    width: 'auto',
    height: 28,
  },
});

const LogoFull = () => {
  const classes = useStyles();

  return (
    <svg
      className={classes.svg}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 280 40"
      fill="none"
    >
      {/* Shield icon */}
      <g transform="translate(0, 2)">
        {/* Outer shield */}
        <path
          d="M18 2L4 8v10c0 9.55 5.97 18.48 14 22 8.03-3.52 14-12.45 14-22V8L18 2z"
          fill="#0A1628"
          stroke="#00D4FF"
          strokeWidth="2"
        />
        {/* Inner lock body */}
        <rect
          x="12"
          y="16"
          width="12"
          height="10"
          rx="2"
          fill="#00D4FF"
        />
        {/* Lock shackle */}
        <path
          d="M14 16v-3a4 4 0 0 1 8 0v3"
          stroke="#00D4FF"
          strokeWidth="2"
          fill="none"
        />
        {/* Keyhole */}
        <circle cx="18" cy="21" r="1.5" fill="#0A1628" />
        <rect x="17.25" y="22" width="1.5" height="2.5" rx="0.5" fill="#0A1628" />
      </g>

      {/* "CoreLock" text */}
      <text
        x="44"
        y="24"
        fontFamily="'Inter', 'Segoe UI', 'Roboto', sans-serif"
        fontSize="22"
        fontWeight="700"
        letterSpacing="-0.5"
      >
        <tspan fill="#FFFFFF">Core</tspan>
        <tspan fill="#00D4FF">Lock</tspan>
      </text>

      {/* "Platform" subtitle */}
      <text
        x="178"
        y="24"
        fontFamily="'Inter', 'Segoe UI', 'Roboto', sans-serif"
        fontSize="12"
        fontWeight="400"
        fill="#8892B0"
        letterSpacing="2"
      >
        PLATFORM
      </text>
    </svg>
  );
};

export default LogoFull;
