import React from 'react';

// 9 S-curves evenly spaced across the 900px viewport height.
// Each path starts at x=-20 and ends at x=1460 (full bleed).
// Vertical offset steps by 100px (0 → 800) so they fill top-to-bottom.
const LINES = [0, 100, 200, 300, 400, 500, 600, 700, 800];

const GlobalBackground = () => {
    return (
        <div className="iridescent-bg-container">
            <svg
                className="iridescent-bg-svg"
                viewBox="0 0 1440 900"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="iridescent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%"   stopColor="#00f0ff" />
                        <stop offset="35%"  stopColor="#ff007f" />
                        <stop offset="70%"  stopColor="#a044ff" />
                        <stop offset="100%" stopColor="#00f0ff" />
                    </linearGradient>
                </defs>

                <g stroke="url(#iridescent-grad)" strokeWidth="1.3" fill="none" opacity="0.38">
                    {LINES.map((offset) => (
                        <path
                            key={offset}
                            d={`M -20 ${150 + offset} C 360 ${50 + offset}, 720 ${450 + offset}, 1080 ${350 + offset} S 1440 ${600 + offset}, 1460 ${550 + offset}`}
                        />
                    ))}
                </g>
            </svg>
        </div>
    );
};

export default GlobalBackground;
