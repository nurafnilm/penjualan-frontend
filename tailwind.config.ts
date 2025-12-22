/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",  // kalau ada folder components
    // tambahin folder lain kalau perlu
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}