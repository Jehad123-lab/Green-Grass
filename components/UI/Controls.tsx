import React from 'react';
import { GrassConfig } from '../../types';

interface ControlsProps {
  config: GrassConfig;
  onChange: (key: keyof GrassConfig, value: number | string) => void;
}

const styles = {
  panelContainer: {
    position: 'absolute' as const,
    top: '24px',
    left: '24px',
    width: '340px',
    zIndex: 10,
    height: 'calc(100vh - 48px)',
    overflowY: 'auto' as const,
    paddingBottom: '24px',
    // Hide scrollbar but allow scroll
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
  },
  glassPanel: {
    background: 'rgba(18, 18, 18, 0.65)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,0.05)',
    borderRadius: '16px',
    padding: '24px',
    transition: 'all 0.3s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
  },
  title: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '24px',
    color: '#ffffff',
    letterSpacing: '0.05em',
    lineHeight: 1,
  },
  subtitle: {
    color: '#52525b',
    fontSize: '10px',
    fontFamily: '"Victor Mono", monospace',
    marginTop: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    boxShadow: '0 0 10px rgba(34,197,94,0.5)',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#52525b',
    textTransform: 'uppercase' as const,
    marginBottom: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    letterSpacing: '0.05em',
  },
  controlGroup: {
    marginBottom: '20px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  label: {
    color: '#a1a1aa',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    fontFamily: '"Inter", sans-serif',
    fontWeight: 500,
  },
  value: {
    color: '#ffffff',
    fontSize: '11px',
    fontFamily: '"Victor Mono", monospace',
  },
  sliderContainer: {
    position: 'relative' as const,
    width: '100%',
    height: '4px',
    backgroundColor: '#27272a', // Surface 3
    borderRadius: '999px',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  sliderTrack: {
    height: '100%',
    backgroundColor: '#22c55e', // Accent
    transition: 'width 0.1s ease-out',
  },
  sliderInput: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    margin: 0,
  },
  colorInputContainer: {
    position: 'relative' as const,
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
  },
  colorInput: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '150%',
    height: '150%',
    padding: 0,
    border: 'none',
    cursor: 'pointer',
    background: 'none',
  },
  footer: {
    marginTop: '32px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '10px',
    color: '#52525b',
    fontFamily: '"Victor Mono", monospace',
    opacity: 0.6,
  }
};

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}> = ({ label, value, min, max, step, onChange }) => (
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
      <div 
        style={{
          ...styles.sliderTrack,
          width: `${((value - min) / (max - min)) * 100}%`
        }}
      />
    </div>
  </div>
);

const ColorPicker: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
}> = ({ label, value, onChange }) => (
  <div style={{ ...styles.controlGroup, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
    <span style={styles.label}>{label}</span>
    <div style={styles.colorInputContainer}>
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
  return (
    <div className="animate-fade-in" style={styles.panelContainer}>
      <div style={styles.glassPanel}>
        <div style={styles.header}>
            <div>
                <h1 style={styles.title}>Zenith Grass</h1>
                <p style={styles.subtitle}>GLSL / THREE.JS</p>
            </div>
            <div className="animate-pulse-glow" style={styles.statusDot}></div>
        </div>

        <div>
            <h2 style={styles.sectionTitle}>Lighting</h2>
             <Slider
                label="Sun Azimuth"
                value={config.sunAzimuth}
                min={0}
                max={360}
                step={1}
                onChange={(v) => onChange('sunAzimuth', v)}
            />
             <Slider
                label="Sun Elevation"
                value={config.sunElevation}
                min={0}
                max={90}
                step={0.5}
                onChange={(v) => onChange('sunElevation', v)}
            />

            <h2 style={styles.sectionTitle}>Atmosphere</h2>
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

            <h2 style={styles.sectionTitle}>Botany</h2>
            <Slider
                label="Blade Count"
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
            
            <h2 style={styles.sectionTitle}>Pigment</h2>
            <ColorPicker
                label="Base Color"
                value={config.baseColor}
                onChange={(v) => onChange('baseColor', v)}
            />
            <ColorPicker
                label="Tip Color"
                value={config.tipColor}
                onChange={(v) => onChange('tipColor', v)}
            />
        </div>
        
        <div style={styles.footer}>
            <p style={styles.footerText}>
                RENDERED IN REALTIME • VANILLA THREE
            </p>
        </div>
      </div>
    </div>
  );
};

export default Controls;