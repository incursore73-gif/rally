export var THEMES = {
  alpine: {
    road: { style: "switchback", length: 1800, cx: 0, xHalf: 150, wild: 0.4, maxTurn: 0.5, step: 40, techP: 0.3 },
    terrain: { wallX: 470, wallK: 0.3, baseSlope: 0.26, noiseAmp: 34 },
    pal: { gr: "#3e6b28", me: "#5f8438", sc: "#8b8c74", ro: "#7d7367", dk: "#57503f", sn: true, snow: "#f6fafd", hz: "#a9c3de", strata: 0.12, strataF: 1.25 },
    veg: { type: "conifer", density: 1.15, treeLine: true, hsl: [0.29, 0.36, 0.32, 0.62, 0.24, 0.52] },
    rock: 9075304,
    fogK: 0.7,
    gorgeK: 0.45
  },
  // Varianti alpine: stili diversi per varietà di pista
  alpineVariant: {
    // "swift": curve fluide, lunghe, poche svolte tecniche
    swift: { road: { style: "switchback", length: 2000, cx: 0, xHalf: 160, wild: 0.3, maxTurn: 0.4, step: 45, techP: 0.25 } },
    // "technical": curve strette, tecniche, più svolte tech
    technical: { road: { style: "switchback", length: 1600, cx: 0, xHalf: 130, wild: 0.6, maxTurn: 0.7, step: 35, techP: 0.4 } },
    // "flow": miscela di switchback e meander fluido
    flow: { road: { style: "meander", length: 1800, cx: 0, xHalf: 150, wild: 0.5, maxTurn: 0.55, step: 40, techP: 0.35 } }
  },
  forest: {
    road: { style: "meander", length: 2300, cx: 0, xHalf: 150, wild: 0.5, maxTurn: 0.6, step: 40, techP: 0.3 },
    terrain: { baseSlope: 0.14, noiseAmp: 34, ridgeAmp: 120, wallX: 380, wallK: 0.35 },
    pal: { gr: "#2f4a2c", me: "#3e5c37", sc: "#6a6a5a", ro: "#5d5b55", dk: "#403f3a", sn: false, hz: "#8fa59c" },
    veg: { type: "conifer", density: 1.6, treeLine: false, hsl: [0.3, 0.36, 0.3, 0.45, 0.45, 0.85] },
    rock: 7170916,
    tint: { c: "#9fb5ab", k: 0.3 },
    fogK: 0.6,
    gorgeK: 0.25
  },
  canyon: {
    road: { style: "meander", length: 2100, cx: 0, xHalf: 90, xMin: -120, xMax: 120, wild: 0.9, maxTurn: 0.8, step: 32, techP: 0.5 },
    terrain: { baseSlope: 0.12, noiseAmp: 16, ridgeAmp: 200, terrace: 14, wallX: 210, wallK: 1 },
    pal: { gr: "#b08a5a", me: "#c79a62", sc: "#b9774e", ro: "#a4553a", dk: "#7a3b2a", sn: false, hz: "#d8b08c", strata: 0.22, strataF: 2.2 },
    veg: { type: "shrub", density: 0.35, treeLine: false, hsl: [0.09, 0.15, 0.3, 0.45, 0.42, 0.65] },
    rock: 11032379,
    tint: { c: "#f0c08a", k: 0.28 },
    fogK: 1.1,
    gorgeK: 0.8
  },
  coast: {
    road: { style: "meander", length: 2500, cx: 60, xHalf: 80, xMin: -70, xMax: 135, wild: 0.3, maxTurn: 0.45, step: 48, techP: 0.08 },
    terrain: { baseSlope: 0.05, noiseAmp: 24, ridgeAmp: 60, wallX: 300, wallK: 0.18, sea: { x0: 150, x1: 430, drop: 170 } },
    pal: { gr: "#7d8a52", me: "#a3a064", sc: "#cfc7a8", ro: "#c8c1b0", dk: "#8b8678", sn: false, hz: "#9ec0d8", sand: "#e6d9b0" },
    veg: { type: "pine", density: 0.55, treeLine: false, hsl: [0.24, 0.3, 0.3, 0.45, 0.45, 0.8] },
    rock: 13617336,
    tint: { c: "#bfe0f2", k: 0.2 },
    fogK: 1.2,
    gorgeK: 0.6
  },
  autumn: {
    road: { style: "meander", length: 2400, cx: 0, xHalf: 160, wild: 0.5, maxTurn: 0.6, step: 40, techP: 0.3 },
    terrain: { baseSlope: 0.1, noiseAmp: 42, ridgeAmp: 80, wallX: 420, wallK: 0.3 },
    pal: { gr: "#8a8a3a", me: "#a89a42", sc: "#7b6a4a", ro: "#7a7468", dk: "#5a5248", sn: false, hz: "#c4c8a8" },
    veg: { type: "broadleaf", density: 1.2, treeLine: false, hsl: [0.02, 0.13, 0.7, 0.85, 0.38, 0.55] },
    rock: 8288107,
    tint: { c: "#ffd9a0", k: 0.22 },
    fogK: 0.9,
    gorgeK: 0.2
  }
};
