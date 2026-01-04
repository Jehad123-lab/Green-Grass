export interface GrassConfig {
  bladeCount: number;
  bladeWidth: number;
  bladeHeight: number;
  windSpeed: number;
  windStrength: number;
  baseColor: string;
  tipColor: string;
  sunAzimuth: number;
  sunElevation: number;
}

export type Vec3 = [number, number, number];