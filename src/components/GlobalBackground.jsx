import React from 'react';

const GlobalBackground = () => {
    return (
        <div className="iridescent-bg-container">
            <svg className="iridescent-bg-svg" viewBox="0 0 1440 900" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="iridescent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00f0ff">
                            <animate attributeName="stop-color" 
                                     values="#00f0ff; #ff007f; #a044ff; #00f0ff" 
                                     dur="12s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="35%" stopColor="#ff007f">
                            <animate attributeName="stop-color" 
                                     values="#ff007f; #a044ff; #00f0ff; #ff007f" 
                                     dur="12s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="70%" stopColor="#a044ff">
                            <animate attributeName="stop-color" 
                                     values="#a044ff; #00f0ff; #ff007f; #a044ff" 
                                     dur="12s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" stopColor="#00f0ff">
                            <animate attributeName="stop-color" 
                                     values="#00f0ff; #ff007f; #a044ff; #00f0ff" 
                                     dur="12s" repeatCount="indefinite" />
                        </stop>
                    </linearGradient>
                </defs>

                <g stroke="url(#iridescent-grad)" strokeWidth="1.6" fill="none" opacity="0.45">
                    <g className="ribbon-group ribbon-group-1">
                        <path d="M -100 100 C 300 150, 500 500, 900 450 S 1200 750, 1600 800" />
                        <path d="M -100 115 C 300 165, 500 515, 900 465 S 1200 765, 1600 815" />
                        <path d="M -100 130 C 300 180, 500 530, 900 480 S 1200 780, 1600 830" />
                        <path d="M -100 145 C 300 195, 500 545, 900 495 S 1200 795, 1600 845" />
                        <path d="M -100 160 C 300 210, 500 560, 900 510 S 1200 810, 1600 860" />
                        <path d="M -100 175 C 300 225, 500 575, 900 525 S 1200 825, 1600 875" />
                    </g>
                    <g className="ribbon-group ribbon-group-2">
                        <path d="M -100 800 C 400 650, 600 350, 1000 450 S 1200 150, 1600 100" />
                        <path d="M -100 815 C 400 665, 600 365, 1000 465 S 1200 165, 1600 115" />
                        <path d="M -100 830 C 400 680, 600 380, 1000 480 S 1200 180, 1600 130" />
                        <path d="M -100 845 C 400 695, 600 395, 1000 495 S 1200 195, 1600 145" />
                        <path d="M -100 860 C 400 710, 600 410, 1000 510 S 1200 210, 1600 160" />
                        <path d="M -100 875 C 400 725, 600 425, 1000 525 S 1200 225, 1600 175" />
                    </g>
                    <g className="ribbon-group ribbon-group-3">
                        <path d="M 100 450 C 300 200, 1100 200, 1300 450 S 300 700, 100 450" />
                        <path d="M 108 450 C 308 205, 1092 205, 1292 450 S 308 695, 108 450" />
                        <path d="M 116 450 C 316 210, 1084 210, 1284 450 S 316 690, 116 450" />
                        <path d="M 124 450 C 326 215, 1076 215, 1276 450 S 326 685, 124 450" />
                        <path d="M 132 450 C 336 220, 1068 220, 1268 450 S 336 680, 132 450" />
                        <path d="M 140 450 C 346 225, 1060 225, 1260 450 S 346 675, 140 450" />
                    </g>
                </g>
            </svg>
        </div>
    );
};

export default GlobalBackground;
