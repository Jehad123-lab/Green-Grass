import React, { useState } from 'react';
import { GrassConfig } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretLeft, CaretRight, Faders } from '@phosphor-icons/react';

interface ControlsProps {
  config: GrassConfig;
  onChange: (key: keyof GrassConfig, value: number | string) => void;
}

const styles = {
  container: {
    position: 'absolute' as const,
    top: '24px',
    left: '24px',
    zIndex: 10,
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    maxHeight: 'calc(100vh - 48px)',
  },
  toggleButton: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: 'rgba(18, 18, 18, 0.65)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    transition: 'all 0.2s ease',
  },
  panel: {
    width: '320px',
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,0.05)',
    borderRadius: '16px',
    padding: '24px',
    overflowY: 'auto' as const,
    maxHeight: 'calc(100vh - 48px)',
    scrollbarWidth: 'none' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  title: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '28px',
    color: '#ffffff',
    letterSpacing: '0.05em',
    lineHeight: 1,
    margin: 0,
  },
  subtitle: {
    color: '#71717a', // Content 3
    fontSize: '10px',
    fontFamily: '"Victor Mono", monospace',
    marginTop: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  sectionTitle: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#a1a1aa', // Content 2
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
    marginTop: '20px',
    letterSpacing: '0.1em',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  controlGroup: {
    marginBottom: '16px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  label: {
    color: '#d4d4d8', // Content 2ish
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    fontFamily: '"Inter", sans-serif',
    fontWeight: 500,
  },
  value: {
    color: '#22c55e', // Accent
    fontSize: '10px',
    fontFamily: '"Victor Mono", monospace',
  },
  sliderContainer: {
    position: 'relative' as const,
    width: '100%',
    height: '16px', // Taller hit area
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  sliderTrack: {
    position: 'absolute' as const,
    width: '100%',
    height: '2px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  sliderInput: {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    zIndex: 2,
    margin: 0,
  },
  sliderThumb: {
    position: 'absolute' as const,
    height: '10px',
    width: '10px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    boxShadow: '0 0 10px rgba(34,197,94,0.8)',
    transform: 'translateX(-50%)',
    pointerEvents: 'none' as const,
    zIndex: 1,
  },
  colorContainer: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  colorWrapper: {
    flex: 1,
    height: '32px',
    borderRadius: '6px',
    overflow: 'hidden',
    position: 'relative' as const,
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
  },
  colorInput: {
    position: 'absolute' as const,
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  footer: {
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '9px',
    color: '#52525b',
    fontFamily: '"Victor Mono", monospace',
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
  const percentage = ((value - min) / (max - min)) * 100;
  
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

const ColorPicker: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
}> = ({ label, value, onChange }) => (
  <div style={{ ...styles.controlGroup, marginBottom: '0' }}>
    <div style={styles.labelRow}>
      <span style={styles.label}>{label}</span>
      <span style={{...styles.value, color: value}}>{value}</span>
    </div>
    <div style={styles.colorWrapper}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.colorInput}
      />
    </div>
  </div>
);

const Controls: React.FC<ControlsProps> = ({ config, onChange }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div style={styles.container}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={styles.panel}
          >
            <div style={styles.header}>
              <div>
                <h1 style={styles.title}>Zenith Grass</h1>
                <p style={styles.subtitle}>Interactive GLSL Simulation</p>
              </div>
              <Faders size={20} color="#22c55e" weight="fill" />
            </div>

            <div style={{ marginTop: '-12px' }}>
              <h2 style={styles.sectionTitle}>Solar</h2>
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

              <h2 style={styles.sectionTitle}>Environment</h2>
              <Slider
                label="Wind Speed"
                value={config.windSpeed}
                min={0}
                max={5}
                step={0.1}
                onChange={(v) => onChange('windSpeed', v)}
              />
              <Slider
                label="Wind Strength"
                value={config.windStrength}
                min={0}
                max={3}
                step={0.1}
                onChange={(v) => onChange('windStrength', v)}
              />

              <h2 style={styles.sectionTitle}>Growth</h2>
              <Slider
                label="Density (Count)"
                value={config.bladeCount}
                min={1000}
                max={100000}
                step={1000}
                onChange={(v) => onChange('bladeCount', v)}
              />
              <Slider
                label="Width"
                value={config.bladeWidth}
                min={0.05}
                max={0.3}
                step={0.01}
                onChange={(v) => onChange('bladeWidth', v)}
              />
              
              <h2 style={styles.sectionTitle}>Pigmentation</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <ColorPicker
                    label="Base"
                    value={config.baseColor}
                    onChange={(v) => onChange('baseColor', v)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                   <ColorPicker
                    label="Tip"
                    value={config.tipColor}
                    onChange={(v) => onChange('tipColor', v)}
                  />
                </div>
              </div>
            </div>
            
            <div style={styles.footer}>
              <p style={styles.footerText}>
                THREE.JS • REACT • WEBGL
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={styles.toggleButton}
        title={isOpen ? "Collapse Controls" : "Expand Controls"}
      >
        {isOpen ? <CaretLeft size={20} /> : <CaretRight size={20} />}
      </motion.button>
    </div>
  );
};

export default Controls;