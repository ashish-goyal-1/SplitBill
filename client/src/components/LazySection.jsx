import { useState, useEffect, useRef } from 'react';
import { Box, Skeleton } from '@mui/material';

/**
 * LazySection - Renders children only when visible in viewport
 * Uses IntersectionObserver to detect visibility
 * 
 * Benefits:
 * - Defers heavy component loading (like charts) until needed
 * - Reduces initial JS parsing/execution on mobile
 * - Improves LCP and TBT scores
 */
export default function LazySection({
    children,
    height = 300,
    rootMargin = '100px',
    placeholder = null
}) {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Once visible, stay visible (don't unload)
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin, // Start loading slightly before visible
                threshold: 0.1
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [rootMargin]);

    return (
        <Box ref={containerRef} sx={{ minHeight: height }}>
            {isVisible ? children : (
                placeholder || (
                    <Skeleton
                        variant="rectangular"
                        height={height}
                        sx={{ borderRadius: 2 }}
                    />
                )
            )}
        </Box>
    );
}
