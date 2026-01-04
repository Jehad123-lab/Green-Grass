import React, { useState, useEffect, useRef } from 'react';
import Controls from './components/UI/Controls';
import { GrassEngine } from './components/Grass/GrassEngine';
import { GrassConfig } from './types';

// Utility to track previous props
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const styles = {
  container: {
    width: '100%',
    height: '100vh',
    position: 'relative' as const,
    backgroundColor: '#0a0a0a',
    overflow: 'hidden',
    fontFamily: '"Inter", sans-serif',
    color: '#ffffff',
  },
  sceneContainer: {
    position: 'absolute' as const,
    inset: 0,
    zIndex: 0,
    outline: 'none',
  },
  loadingOverlay: {
    position: 'absolute' as const,
    inset: 0,
    backgroundColor: '#000000',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none' as const,
    animation: 'fadeOut 2s ease-out forwards',
  },
  loadingText: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '2.5rem',
    letterSpacing: '0.2em',
    color: '#ffffff',
  },
};

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GrassEngine | null>(null);

  // Initial State
  const [config, setConfig] = useState<GrassConfig>({
    bladeCount: 50000,
    bladeWidth: 0.12,
    bladeHeight: 1.0,
    windSpeed: 1.0,
    windStrength: 1.2,
    baseColor: '#0a420a',
    tipColor: '#84cc16',
    sunAzimuth: 180,
    sunElevation: 30,
  });

  const prevConfig = usePrevious(config);

  const handleConfigChange = (key: keyof GrassConfig, value: number | string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Initialize Engine
  useEffect(() => {
    if (containerRef.current && !engineRef.current) {
      engineRef.current = new GrassEngine(containerRef.current, config);
    }
    
    return () => {
      // Cleanup on unmount (hot reload support)
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []); // Run once on mount

  // Update Engine when Config changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateConfig(config, prevConfig);
    }
  }, [config, prevConfig]);

  return (
    <div style={styles.container}>
      
      {/* 3D Scene Container */}
      <div ref={containerRef} style={styles.sceneContainer} />

      {/* Foreground UI */}
      <Controls config={config} onChange={handleConfigChange} />

      {/* Loading Overlay */}
      <div style={styles.loadingOverlay}>
        <h1 style={styles.loadingText}>INITIALIZING</h1>
      </div>

      <style>{`
        @keyframes fadeOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default App;