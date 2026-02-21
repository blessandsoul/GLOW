import type { HTMLAttributes, Ref } from 'react';
import type { Transition } from 'motion/react';

interface RotatingTextProps extends HTMLAttributes<HTMLSpanElement> {
    texts: string[];
    transition?: Transition;
    initial?: Record<string, unknown>;
    animate?: Record<string, unknown>;
    exit?: Record<string, unknown>;
    animatePresenceMode?: 'wait' | 'sync' | 'popLayout';
    animatePresenceInitial?: boolean;
    rotationInterval?: number;
    staggerDuration?: number;
    staggerFrom?: 'first' | 'last' | 'center' | 'random' | number;
    loop?: boolean;
    auto?: boolean;
    splitBy?: 'characters' | 'words' | 'lines' | string;
    onNext?: (index: number) => void;
    mainClassName?: string;
    splitLevelClassName?: string;
    elementLevelClassName?: string;
    ref?: Ref<{
        next: () => void;
        previous: () => void;
        jumpTo: (index: number) => void;
        reset: () => void;
    }>;
}

declare const RotatingText: React.FC<RotatingTextProps>;
export default RotatingText;
