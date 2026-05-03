import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CursorPosition {
    x: number;
    y: number;
}

const BrutalistCursor = () => {
    const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [trail, setTrail] = useState<CursorPosition[]>([]);

    useEffect(() => {
        const updateCursor = (e: MouseEvent) => {
            const newPos = { x: e.clientX, y: e.clientY };
            setPosition(newPos);

            // Add to trail
            setTrail(prev => [...prev.slice(-8), newPos]);
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', updateCursor);
        window.addEventListener('mouseover', handleMouseOver);

        return () => {
            window.removeEventListener('mousemove', updateCursor);
            window.removeEventListener('mouseover', handleMouseOver);
        };
    }, []);

    return (
        <>
            {/* Hide default cursor */}
            <style>{`
        * {
          cursor: none !important;
        }
      `}</style>

            {/* Trail */}
            {trail.map((pos, i) => (
                <motion.div
                    key={i}
                    className="fixed pointer-events-none z-[9999] mix-blend-difference"
                    style={{
                        left: pos.x,
                        top: pos.y,
                        width: 4,
                        height: 4,
                        backgroundColor: '#EA1F1D',
                        opacity: (i + 1) / trail.length * 0.3,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.1 }}
                />
            ))}

            {/* Main cursor */}
            <motion.div
                className="fixed pointer-events-none z-[10000] mix-blend-difference"
                style={{
                    left: position.x,
                    top: position.y,
                }}
                animate={{
                    scale: isHovering ? 2 : 1,
                    rotate: isHovering ? 45 : 0,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            >
                <div
                    className="relative -translate-x-1/2 -translate-y-1/2"
                    style={{
                        width: isHovering ? 32 : 16,
                        height: isHovering ? 32 : 16,
                        border: '2px solid #EA1F1D',
                        backgroundColor: isHovering ? 'rgba(234, 31, 29, 0.2)' : 'transparent',
                    }}
                />
            </motion.div>

            {/* Outer ring */}
            <motion.div
                className="fixed pointer-events-none z-[9998] mix-blend-difference"
                style={{
                    left: position.x,
                    top: position.y,
                }}
                animate={{
                    scale: isHovering ? 1.5 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
            >
                <div
                    className="relative -translate-x-1/2 -translate-y-1/2 border border-white/30"
                    style={{
                        width: 40,
                        height: 40,
                    }}
                />
            </motion.div>
        </>
    );
};

export default BrutalistCursor;
