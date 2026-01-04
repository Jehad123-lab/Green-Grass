export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const hexToVec3 = (hex: string): [number, number, number] => {
  const c = parseInt(hex.replace('#', ''), 16);
  const r = ((c >> 16) & 255) / 255;
  const g = ((c >> 8) & 255) / 255;
  const b = (c & 255) / 255;
  return [r, g, b];
};