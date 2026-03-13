"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { GripVertical } from "lucide-react";

interface ComparisonSliderProps {
    originalImage: string;
    enhancedImage: string;
}

export default function ComparisonSlider({ originalImage, enhancedImage }: ComparisonSliderProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = (x / rect.width) * 100;
        setSliderPosition(percentage);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        handleMove(e.clientX);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
    };

    useEffect(() => {
        const handleMouseUp = () => setIsDragging(false);
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) handleMove(e.clientX);
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging) handleMove(e.touches[0].clientX);
        };

        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            window.addEventListener("touchmove", handleTouchMove, { passive: false });
            window.addEventListener("touchend", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-[400px] sm:h-[500px] overflow-hidden rounded-3xl cursor-ew-resize select-none border border-zinc-800"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            {/* Background (Enhanced Image) */}
            <Image
                src={enhancedImage}
                alt="Enhanced Image"
                fill
                className="object-cover"
                priority
            />

            {/* Foreground Container (Original Image) */}
            <div
                className="absolute top-0 left-0 bottom-0 right-0 overflow-hidden bg-black"
                style={{ width: `${sliderPosition}%` }}
            >
                <div className="absolute top-0 left-0 bottom-0" style={{ width: "100vw", maxWidth: "800px" /* Approximation to prevent squishing */ }}>
                    {/* We must wrap the original image so it doesn't shrink when the container shrinks */}
                    <Image
                        src={originalImage}
                        alt="Original Image"
                        fill
                        className="object-cover object-left"
                        priority
                    />
                </div>
            </div>

            {/* Slider Line & Handle */}
            <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
                style={{ left: `${sliderPosition}%` }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white text-zinc-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <GripVertical className="w-5 h-5" />
                </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full z-10">
                Before
            </div>
            <div className="absolute top-4 right-4 bg-indigo-500/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full z-0">
                After
            </div>
        </div>
    );
}
