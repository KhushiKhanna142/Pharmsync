import { useEffect, useState } from "react";

export const AnimatedCounter = ({ value, duration = 1000 }: { value: number, duration?: number }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTimestamp: number | null = null;
        const startValue = displayValue;
        const endValue = value;

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Easing function (easeOutExpo)
            const easeValue = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const current = Math.floor(startValue + (endValue - startValue) * easeValue);
            setDisplayValue(current);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }, [value, duration]);

    return <>{displayValue.toLocaleString()}</>;
};
