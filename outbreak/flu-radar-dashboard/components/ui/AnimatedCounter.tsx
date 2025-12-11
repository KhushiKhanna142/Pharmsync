'use client';
import { useEffect, useState, useRef } from 'react';
import React from 'react';

export const AnimatedCounter = React.memo(function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
    const [count, setCount] = useState(value);
    const prevValueRef = useRef(value);
    const animationFrameRef = useRef<number | null>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        // On first render, just set the value without animation
        if (isFirstRender.current) {
            setCount(value);
            prevValueRef.current = value;
            isFirstRender.current = false;
            return;
        }

        // Only animate if value actually changed significantly (more than 1)
        if (Math.abs(prevValueRef.current - value) < 1) {
            if (prevValueRef.current !== value) {
                setCount(value);
                prevValueRef.current = value;
            }
            return;
        }

        const start = prevValueRef.current;
        const end = value;
        
        // Cancel any ongoing animation
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Only animate if difference is significant
        if (Math.abs(end - start) < 1) {
            setCount(end);
            prevValueRef.current = end;
            return;
        }

        // Better implementation with proper cleanup
        let startTime: number | null = null;
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const currentValue = Math.floor(progress * (end - start) + start);
            setCount(currentValue);
            
            if (progress < 1) {
                animationFrameRef.current = window.requestAnimationFrame(step);
            } else {
                setCount(end);
                prevValueRef.current = end;
                animationFrameRef.current = null;
            }
        };

        animationFrameRef.current = window.requestAnimationFrame(step);

        // Cleanup function
        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [value, duration]);

    return <span>{count.toLocaleString()}</span>;
});
