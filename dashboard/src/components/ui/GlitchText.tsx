import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface GlitchTextProps {
    text: string;
    className?: string;
    intensity?: 'low' | 'medium' | 'high';
    trigger?: 'hover' | 'always';
}

const GlitchText = ({
    text,
    className = '',
    intensity = 'medium',
    trigger = 'hover'
}: GlitchTextProps) => {
    const [isGlitching, setIsGlitching] = useState(trigger === 'always');
    const [glitchedText, setGlitchedText] = useState(text);

    const glitchChars = '!<>-_\\/[]{}—=+*^?#________';

    const intensityConfig = {
        low: { chars: 1, duration: 50 },
        medium: { chars: 3, duration: 30 },
        high: { chars: 5, duration: 20 },
    };

    useEffect(() => {
        if (!isGlitching) {
            setGlitchedText(text);
            return;
        }

        const config = intensityConfig[intensity];
        const interval = setInterval(() => {
            const chars = text.split('');
            const numGlitches = Math.floor(Math.random() * config.chars) + 1;

            for (let i = 0; i < numGlitches; i++) {
                const randomIndex = Math.floor(Math.random() * chars.length);
                chars[randomIndex] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
            }

            setGlitchedText(chars.join(''));

            setTimeout(() => setGlitchedText(text), config.duration);
        }, 100);

        return () => clearInterval(interval);
    }, [isGlitching, text, intensity]);

    const handleMouseEnter = () => {
        if (trigger === 'hover') setIsGlitching(true);
    };

    const handleMouseLeave = () => {
        if (trigger === 'hover') setIsGlitching(false);
    };

    return (
        <motion.span
            className={`relative inline-block ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ position: 'relative' }}
        >
            {/* Main text */}
            <span className="relative z-10">{glitchedText}</span>

            {/* RGB split effect */}
            {isGlitching && (
                <>
                    <motion.span
                        className="absolute inset-0 text-third opacity-70"
                        animate={{
                            x: [0, -2, 2, -1, 1, 0],
                            y: [0, 1, -1, 2, -2, 0],
                        }}
                        transition={{ duration: 0.2, repeat: Infinity }}
                        style={{ mixBlendMode: 'screen' }}
                    >
                        {text}
                    </motion.span>
                    <motion.span
                        className="absolute inset-0 text-accent opacity-70"
                        animate={{
                            x: [0, 2, -2, 1, -1, 0],
                            y: [0, -1, 1, -2, 2, 0],
                        }}
                        transition={{ duration: 0.2, repeat: Infinity, delay: 0.1 }}
                        style={{ mixBlendMode: 'screen' }}
                    >
                        {text}
                    </motion.span>
                </>
            )}
        </motion.span>
    );
};

export default GlitchText;
