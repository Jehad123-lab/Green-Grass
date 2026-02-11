import React, { useState, useEffect, useRef } from 'react';
import Controls from './components/UI/Controls';
import { GrassEngine } from './components/Grass/GrassEngine';
import { GrassConfig } from './types';
import { motion, AnimatePresence } from 'framer-motion';

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
  watermark: {
    position: 'absolute' as const,
    bottom: '32px',
    right: '32px',
    textAlign: 'right' as const,
    pointerEvents: 'none' as const,
    zIndex: 10,
    opacity: 0.5,
  },
  watermarkTitle: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '24px',
    margin: 0,
    letterSpacing: '0.1em',
    color: '#ffffff',
  },
  watermarkSub: {
    fontFamily: '"Victor Mono", monospace',
    fontSize: '10px',
    color: '#71717a',
  },
  loadingContainer: {
    position: 'absolute' as const,
    inset: 0,
    backgroundColor: '#050505',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column' as const,
  },
  loadingText: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '4rem',
    letterSpacing: '0.2em',
    color: '#ffffff',
    margin: 0,
    background: 'linear-gradient(to right, #fff, #666)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  loadingBar: {
    width: '200px',
    height: '2px',
    background: '#333',
    marginTop: '20px',
    overflow: 'hidden',
    borderRadius: '1px',
  },
  loadingProgress: {
    width: '100%',
    height: '100%',
    background: '#d9f99d', // Lime 200
    transformOrigin: 'left',
  }
};

const DEFAULT_CONFIG: GrassConfig = {
  bladeCount: 50000,
  bladeWidth: 0.12,
  bladeHeight: 1.0,
  windSpeed: 1.0,
  windStrength: 1.2,
  baseColor: '#0a420a',
  tipColor: '#84cc16',
  sunAzimuth: 180,
  sunElevation: 30,
};

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GrassEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial State
  const [config, setConfig] = useState<GrassConfig>(DEFAULT_CONFIG);

  const prevConfig = usePrevious(config);

  const handleConfigChange = (key: keyof GrassConfig, value: number | string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  // Initialize Engine
  useEffect(() => {
    // Artificial load time for cinematic effect and to ensure fonts/resources align
    const timer = setTimeout(() => setIsLoading(false), 2000);

    if (containerRef.current && !engineRef.current) {
      engineRef.current = new GrassEngine(containerRef.current, config);
    }
    
    return () => {
      clearTimeout(timer);
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []); 

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
      <AnimatePresence>
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <Controls 
              config={config} 
              onChange={handleConfigChange} 
              onReset={handleReset}
            />
            
            {/* Watermark */}
            <div style={styles.watermark}>
              <h2 style={styles.watermarkTitle}>ZENITH</h2>
              <span style={styles.watermarkSub}>PROCEDURAL SYSTEM</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            style={styles.loadingContainer}
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <motion.h1 
              style={styles.loadingText}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              ZENITH
            </motion.h1>
            <div style={styles.loadingBar}>
              <motion.div 
                style={styles.loadingProgress}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;