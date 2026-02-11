import React, { useState } from 'react';
import { GrassConfig } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CaretLeft, 
  CaretRight, 
  Sun, 
  Wind, 
  Plant, 
  Palette, 
  ArrowCounterClockwise,
  Sliders
} from '@phosphor-icons/react';

interface ControlsProps {
  config: GrassConfig;
  onChange: (key: keyof GrassConfig, value: number | string) => void;
  onReset?: () => void;
}

// Design Tokens & Styles
const theme = {
  colors: {
    surface: 'rgba(8, 8, 8, 0.6)',
    surfaceHighlight: 'rgba(255, 255, 255, 0.03)',
    border: 'rgba(255, 255, 255, 0.08)',
    primary: '#ffffff',
    secondary: '#71717a',
    accent: '#d9f99d', // Lime 200
    accentGlow: 'rgba(217, 249, 157, 0.4)',
  },
  blur: 'backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);',
};

const styles = {
  container: {
    position: 'absolute' as const,
    top: '32px',
    left: '32px',
    zIndex: 20,
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    fontFamily: '"Inter", sans-serif',
  },
  panel: {
    width: '300px',
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '16px',
    padding: '0',
    overflow: 'hidden',
    boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    padding: '20px 24px',
    background: 'linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(255,255,255,0))',
    borderBottom: `1px solid ${theme.colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  title: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '24px',
    color: theme.colors.primary,
    letterSpacing: '0.05em',
    lineHeight: 0.9,
    margin: 0,
    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
  },
  subtitle: {
    fontFamily: '"Victor Mono", monospace',
    fontSize: '9px',
    color: theme.colors.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  scrollArea: {
    padding: '24px',
    maxHeight: '60vh',
    overflowY: 'auto' as const,
    scrollbarWidth: 'none' as const,
  },
  section: {
    marginBottom: '28px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    color: theme.colors.primary,
    opacity: 0.8,
  },
  sectionIcon: {
    color: theme.colors.accent,
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.15em',
    margin: 0,
  },
  controlGroup: {
    marginBottom: '18px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '10px',
  },
  label: {
    color: theme.colors.secondary,
    fontSize: '10px',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  value: {
    color: theme.colors.accent,
    fontSize: '10px',
    fontFamily: '"Victor Mono", monospace',
    background: 'rgba(255,255,255,0.05)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  sliderContainer: {
    position: 'relative' as const,
    width: '100%',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'grab',
  },
  sliderTrack: {
    position: 'absolute' as const,
    width: '100%',
    height: '4px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    boxShadow: `0 0 10px ${theme.colors.accentGlow}`,
  },
  sliderInput: {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'grab',
    zIndex: 2,
    margin: 0,
  },
  sliderThumb: {
    position: 'absolute' as const,
    height: '14px',
    width: '4px',
    backgroundColor: '#fff',
    borderRadius: '1px',
    transform: 'translateX(-50%)',
    pointerEvents: 'none' as const,
    zIndex: 1,
    boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  colorButton: {
    height: '36px',
    borderRadius: '8px',
    border: `1px solid ${theme.colors.border}`,
    position: 'relative' as const,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.1s ease',
  },
  colorInput: {
    position: 'absolute' as const,
    top: '-10px',
    left: '-10px',
    width: 'calc(100% + 20px)',
    height: 'calc(100% + 20px)',
    opacity: 0,
    cursor: 'pointer',
  },
  colorLabel: {
    position: 'absolute' as const,
    bottom: '4px',
    left: '6px',
    fontSize: '8px',
    fontFamily: '"Victor Mono", monospace',
    color: 'rgba(0,0,0,0.7)',
    fontWeight: 700,
    pointerEvents: 'none' as const,
    textTransform: 'uppercase' as const,
    background: 'rgba(255,255,255,0.4)',
    padding: '1px 3px',
    borderRadius: '3px',
  },
  toggleBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.colors.primary,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  resetBtn: {
    background: 'transparent',
    border: 'none',
    color: theme.colors.secondary,
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'color 0.2s',
  }
};

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}> = ({ label, value, min, max, step, onChange }) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  
  return (
    <div style={styles.controlGroup}>
      <div style={styles.labelRow}>
        <span style={styles.label}>{label}</span>
        <span style={styles.value}>{value.toFixed(step < 0.1 ? 2 : 1)}</span>
      </div>
      <div style={styles.sliderContainer}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={styles.sliderInput}
        />
        <div style={styles.sliderTrack}>
          <div style={{ ...styles.sliderFill, width: `${percentage}%` }} />
        </div>
        <div style={{ ...styles.sliderThumb, left: `${percentage}%` }} />
      </div>
    </div>
  );
};

const ColorSwatch: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
}> = ({ label, value, onChange }) => (
  <div style={styles.colorButton} title={label}>
    <div 
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: value,
      }} 
    />
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={styles.colorInput}
    />
    <div style={styles.colorLabel}>{label}</div>
  </div>
);

const Controls: React.FC<ControlsProps> = ({ config, onChange, onReset }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div style={styles.container}>
      {/* Panel */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 300 }}
            exit={{ opacity: 0, x: -20, width: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{...styles.panel, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)'}}
          >
            <div style={styles.header}>
              <div style={styles.titleGroup}>
                <h1 style={styles.title}>Zenith Grass</h1>
                <span style={styles.subtitle}>v1.0 • GLSL Simulation</span>
              </div>
              {onReset && (
                <motion.button 
                  style={styles.resetBtn} 
                  onClick={onReset}
                  whileHover={{ color: '#fff', rotate: 180 }}
                  title="Reset to Defaults"
                >
                  <ArrowCounterClockwise size={16} />
                </motion.button>
              )}
            </div>

            <div style={styles.scrollArea}>
              {/* Solar Section */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <Sun size={14} weight="fill" style={styles.sectionIcon} />
                  <h3 style={styles.sectionTitle}>Solar Dynamics</h3>
                </div>
                <Slider
                  label="Azimuth"
                  value={config.sunAzimuth}
                  min={0}
                  max={360}
                  step={1}
                  onChange={(v) => onChange('sunAzimuth', v)}
                />
                <Slider
                  label="Elevation"
                  value={config.sunElevation}
                  min={0}
                  max={90}
                  step={0.5}
                  onChange={(v) => onChange('sunElevation', v)}
                />
              </div>

              {/* Environment Section */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <Wind size={14} weight="fill" style={styles.sectionIcon} />
                  <h3 style={styles.sectionTitle}>Atmosphere</h3>
                </div>
                <Slider
                  label="Wind Speed"
                  value={config.windSpeed}
                  min={0}
                  max={5}
                  step={0.1}
                  onChange={(v) => onChange('windSpeed', v)}
                />
                <Slider
                  label="Turbulence"
                  value={config.windStrength}
                  min={0}
                  max={3}
                  step={0.1}
                  onChange={(v) => onChange('windStrength', v)}
                />
              </div>

              {/* Growth Section */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <Plant size={14} weight="fill" style={styles.sectionIcon} />
                  <h3 style={styles.sectionTitle}>Vegetation</h3>
                </div>
                <Slider
                  label="Density"
                  value={config.bladeCount}
                  min={1000}
                  max={100000}
                  step={1000}
                  onChange={(v) => onChange('bladeCount', v)}
                />
                <Slider
                  label="Blade Width"
                  value={config.bladeWidth}
                  min={0.05}
                  max={0.3}
                  step={0.01}
                  onChange={(v) => onChange('bladeWidth', v)}
                />
              </div>
              
              {/* Pigmentation Section */}
              <div style={{...styles.section, marginBottom: 0}}>
                <div style={styles.sectionHeader}>
                  <Palette size={14} weight="fill" style={styles.sectionIcon} />
                  <h3 style={styles.sectionTitle}>Pigmentation</h3>
                </div>
                <div style={styles.colorGrid}>
                  <ColorSwatch
                    label="Root / Base"
                    value={config.baseColor}
                    onChange={(v) => onChange('baseColor', v)}
                  />
                  <ColorSwatch
                    label="Tip / Highlight"
                    value={config.tipColor}
                    onChange={(v) => onChange('tipColor', v)}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.3)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={styles.toggleBtn}
      >
        {isOpen ? <CaretLeft size={20} /> : <Sliders size={20} />}
      </motion.button>
    </div>
  );
};

export default Controls;