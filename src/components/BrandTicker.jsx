'use client';

import React from 'react';

const BrandTicker = () => {
    // List of brand definitions using the official downloaded SVG files
    const brands = [
        { name: 'Jordan', file: 'jordan.svg' },
        { name: 'Adidas', file: 'adidas.svg' },
        { name: 'Numeris', file: 'numeris.svg' },
        { name: 'New Balance', file: 'newbalance.svg' },
        { name: 'LV', file: 'lv.svg' },
        { name: 'Dolce & Gabbana', file: 'dolcegabbana.svg' },
        { name: 'Nike', file: 'nike.svg' },
        { name: 'AF1', file: 'af1.svg' },
        { name: 'Asics', file: 'asics.svg' },
        { name: 'Vans', file: 'vans.svg' },
        { name: 'Alexander McQueen', file: 'alexandermcqueen.svg' }
    ];

    // Double the array for a seamless loop
    const tickerItems = [...brands, ...brands];

    return (
        <div className="brand-ticker-container">
            <div className="brand-ticker-track">
                <div className="brand-ticker-group">
                    {brands.map((brand, idx) => (
                        <div key={`g1-${idx}`} className="brand-logo-item" title={brand.name}>
                            <img 
                                src={`/assets/logos/${brand.file}`} 
                                className="brand-logo-img" 
                                alt={brand.name} 
                            />
                        </div>
                    ))}
                </div>
                <div className="brand-ticker-group" aria-hidden="true">
                    {brands.map((brand, idx) => (
                        <div key={`g2-${idx}`} className="brand-logo-item" title={brand.name}>
                            <img 
                                src={`/assets/logos/${brand.file}`} 
                                className="brand-logo-img" 
                                alt={brand.name} 
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BrandTicker;
