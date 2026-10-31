// WattWise AI — Signature animated energy heartbeat visual
// Concentric pulsing rings that reflect real-time power consumption
import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Props {
  currentPower: number;  // watts
  maxPower?: number;     // max expected watts
  efficiency?: number;   // 0-100
  size?: 'sm' | 'md' | 'lg';
}

export default function EnergyPulseVisual({
  currentPower,
  maxPower = 5000,
  efficiency = 70,
  size = 'md',
}: Props) {
  // Determine color scheme based on consumption level
  const ratio = Math.min(currentPower / maxPower, 1);
  const isLow = ratio < 0.3;
  const isHigh = ratio > 0.7;

  const colorConfig = useMemo(() => {
    if (isLow) return {
      primary: '#a3e635',    // lime — optimized
      glow: 'rgba(163, 230, 53, 0.2)',
      ringAlpha: 'rgba(163, 230, 53,',
      label: 'Optimized',
    };
    if (isHigh) return {
      primary: '#e8762d',    // orange — high
      glow: 'rgba(232, 118, 45, 0.25)',
      ringAlpha: 'rgba(232, 118, 45,',
      label: 'High Load',
    };
    return {
      primary: '#d4a047',    // amber — normal
      glow: 'rgba(212, 160, 71, 0.2)',
      ringAlpha: 'rgba(212, 160, 71,',
      label: 'Normal',
    };
  }, [isLow, isHigh]);

  // Pulse speed: faster when consumption is higher
  const pulseSpeed = 2.5 - ratio * 1.5; // 2.5s (low) → 1s (high)

  const sizeMap = { sm: 160, md: 240, lg: 320 };
  const dim = sizeMap[size];
  const kw = (currentPower / 1000).toFixed(1);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: dim, height: dim }}
    >
      {/* Outer ring 3 */}
      <motion.div
        className="absolute rounded-full border"
        style={{
          width: '100%',
          height: '100%',
          borderColor: `${colorConfig.ringAlpha} 0.12)`,
        }}
        animate={{
          scale: [1, 1.06, 1],
          opacity: [0.3, 0.08, 0.3],
        }}
        transition={{
          duration: pulseSpeed * 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Outer ring 2 */}
      <motion.div
        className="absolute rounded-full border"
        style={{
          width: '78%',
          height: '78%',
          borderColor: `${colorConfig.ringAlpha} 0.2)`,
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.12, 0.4],
        }}
        transition={{
          duration: pulseSpeed * 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.15,
        }}
      />

      {/* Middle ring */}
      <motion.div
        className="absolute rounded-full border-2"
        style={{
          width: '58%',
          height: '58%',
          borderColor: `${colorConfig.ringAlpha} 0.3)`,
        }}
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.5, 0.15, 0.5],
        }}
        transition={{
          duration: pulseSpeed,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.3,
        }}
      />

      {/* Inner glow ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '42%',
          height: '42%',
          background: `radial-gradient(circle, ${colorConfig.glow} 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 0.3, 0.6],
        }}
        transition={{
          duration: pulseSpeed * 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Core circle */}
      <div
        className="relative z-10 rounded-full flex flex-col items-center justify-center border-2"
        style={{
          width: '38%',
          height: '38%',
          borderColor: `${colorConfig.ringAlpha} 0.5)`,
          background: `radial-gradient(circle at 50% 40%, ${colorConfig.ringAlpha} 0.08) 0%, transparent 70%)`,
          boxShadow: `0 0 30px ${colorConfig.glow}, inset 0 0 20px ${colorConfig.glow}`,
        }}
      >
        <span
          className="number-mono font-bold leading-none"
          style={{
            fontSize: size === 'lg' ? '1.75rem' : size === 'md' ? '1.25rem' : '0.95rem',
            color: colorConfig.primary,
          }}
        >
          {kw}
        </span>
        <span
          className="text-[0.6rem] font-medium uppercase tracking-wider mt-0.5"
          style={{ color: `${colorConfig.ringAlpha} 0.7)` }}
        >
          kW
        </span>
      </div>

      {/* Status label */}
      <div
        className="absolute -bottom-1 text-[10px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: colorConfig.primary }}
      >
        {colorConfig.label}
      </div>

      {/* Floating particles */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: colorConfig.primary,
            top: `${20 + i * 15}%`,
            left: `${15 + i * 20}%`,
          }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.5, 0.15, 0.5],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.4,
          }}
        />
      ))}
    </div>
  );
}
