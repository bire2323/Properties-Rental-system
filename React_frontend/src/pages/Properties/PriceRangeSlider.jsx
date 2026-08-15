import React, { useState, useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';

export function PriceRangeSlider({ min = 0, max = 200000, step = 1000, value, onValueChange }) {
    const [localValue, setLocalValue] = useState(value || [min, max]);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const formatPrice = (val) => {
        return new Intl.NumberFormat('en-US').format(val);
    };

    const handleValueChange = (newVal) => {
        setLocalValue(newVal);
    };

    const handleValueCommit = (newVal) => {
        if (onValueChange) {
            onValueChange(newVal);
        }
    };

    return (
        <div className="w-full">
            <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={localValue}
                min={min}
                max={max}
                step={step}
                onValueChange={handleValueChange}
                onValueCommit={handleValueCommit}
                minStepsBetweenThumbs={1}
            >
                <Slider.Track className="bg-slate-200 dark:bg-slate-700 relative grow rounded-full h-1.5">
                    <Slider.Range className="absolute bg-[#c99b43] dark:bg-[#f3c96d] rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb
                    className="block w-5 h-5 bg-[#c99b43] dark:bg-[#f3c96d] border-2 border-white dark:border-slate-800 rounded-full shadow-[0_2px_10px] shadow-black/10 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#c99b43]/50"
                    aria-label="Minimum price"
                />
                <Slider.Thumb
                    className="block w-5 h-5 bg-[#c99b43] dark:bg-[#f3c96d] border-2 border-white dark:border-slate-800 rounded-full shadow-[0_2px_10px] shadow-black/10 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#c99b43]/50"
                    aria-label="Maximum price"
                />
            </Slider.Root>
            <div className="flex justify-between items-center mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>{formatPrice(localValue[0])} ETB</span>
                <span>{formatPrice(localValue[1])}{localValue[1] === max ? '+' : ''} ETB</span>
            </div>
        </div>
    );
}
