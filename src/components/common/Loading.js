import React from 'react';

const CircularLoader = ({ size = 40, strokeWidth = 4, color = '#0aa76e' }) => {
  return (
    <div className="circular-loader">
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      <style jsx>{`
        .circular-loader {
          display: inline-block;
        }
        circle {
          stroke-dasharray: 150, 200;
          stroke-dashoffset: -10;
          animation: dash 1.5s ease-in-out infinite;
        }
        @keyframes dash {
          0% {
            stroke-dasharray: 1, 200;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -35;
          }
          100% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -124;
          }
        }
      `}</style>
    </div>
  );
};

export default CircularLoader;