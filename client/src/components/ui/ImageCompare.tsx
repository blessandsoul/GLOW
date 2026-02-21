'use client';

import {
    useState,
    useRef,
    useCallback,
} from 'react';
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
} from 'motion/react';
import { cn } from '@/lib/utils';

interface ImageCompareProps {
    beforeSrc: string;
    afterSrc: string;
    beforeAlt?: string;
    afterAlt?: string;
    initialPosition?: number;
    className?: string;
}

const SPRING_CONFIG = { damping: 20, stiffness: 300, mass: 0.5 };

export function ImageCompare({
    beforeSrc,
    afterSrc,
    beforeAlt = 'Before',
    afterAlt = 'After',
    initialPosition = 50,
    className,
}: ImageCompareProps): React.JSX.Element {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const rawPosition = useMotionValue(initialPosition);
    const position = useSpring(rawPosition, SPRING_CONFIG);

    const beforeClip = useTransform(position, (v) => `inset(0 ${100 - v}% 0 0)`);
    const afterClip = useTransform(position, (v) => `inset(0 0 0 ${v}%)`);
    const dividerLeft = useTransform(position, (v) => `${v}%`);

    const getPercentFromEvent = useCallback(
        (clientX: number): number => {
            if (!containerRef.current) return initialPosition;
            const rect = containerRef.current.getBoundingClientRect();
            const x = clientX - rect.left;
            return Math.min(Math.max((x / rect.width) * 100, 0), 100);
        },
        [initialPosition],
    );

    const handlePointerDown = useCallback(
        (e: React.PointerEvent): void => {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            setIsDragging(true);
            rawPosition.set(getPercentFromEvent(e.clientX));
        },
        [rawPosition, getPercentFromEvent],
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent): void => {
            if (!isDragging) return;
            rawPosition.set(getPercentFromEvent(e.clientX));
        },
        [isDragging, rawPosition, getPercentFromEvent],
    );

    const handlePointerUp = useCallback((): void => {
        setIsDragging(false);
    }, []);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent): void => {
            const step = e.shiftKey ? 10 : 2;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                rawPosition.set(Math.max(rawPosition.get() - step, 0));
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                rawPosition.set(Math.min(rawPosition.get() + step, 100));
            }
        },
        [rawPosition],
    );

    return (
        <div
            ref={containerRef}
            className={cn(
                'relative select-none overflow-hidden',
                className,
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            role="slider"
            aria-label="Image comparison slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={initialPosition}
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            {/* Before image (left side, full width, clipped from right) */}
            <motion.img
                src={beforeSrc}
                alt={beforeAlt}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ clipPath: beforeClip, willChange: 'clip-path' }}
                draggable={false}
            />

            {/* After image (right side, full width, clipped from left) */}
            <motion.img
                src={afterSrc}
                alt={afterAlt}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ clipPath: afterClip, willChange: 'clip-path' }}
                draggable={false}
            />

            {/* Divider line */}
            <motion.div
                className="absolute top-0 bottom-0 z-10 w-0.5 bg-background shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                style={{ left: dividerLeft, willChange: 'left' }}
            >
                {/* Drag handle */}
                <div
                    className={cn(
                        'absolute left-1/2 top-1/2 z-20 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background bg-background shadow-lg transition-transform duration-200 cursor-grab',
                        isDragging && 'scale-110 cursor-grabbing',
                    )}
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        className="text-muted-foreground"
                    >
                        <path
                            d="M4.5 3L1.5 7L4.5 11"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M9.5 3L12.5 7L9.5 11"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </motion.div>
        </div>
    );
}
