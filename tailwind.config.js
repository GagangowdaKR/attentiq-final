// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
//   presets: [require("nativewind/preset")],
//   theme: {
//     extend: {
//       colors: {
//         void:        "#0A0A0F",
//         surface:     "#13131A",
//         panel:       "#1C1C28",
//         border:      "#2A2A3D",
//         muted:       "#4A4A6A",
//         txt:         "#E8E8F0",
//         sub:         "#9090A8",
//         pulse:       "#6C63FF",
//         "pulse-dim": "#3D3880",
//         signal:      "#00D4AA",
//         danger:      "#FF4D6D",
//         warn:        "#FFB347",
//         safe:        "#4ADEAA",
//       },
//     },
//   },
//   plugins: [],
// };

// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
//   theme: { extend: {} },
//   plugins: [],
// };

// module.exports = {};


module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};