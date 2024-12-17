module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx}", // Include all files in the app directory
      "./components/**/*.{js,ts,jsx,tsx}", // Include reusable components
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ["var(--font-inter)", "sans-serif"], // Set Inter as the default sans-serif font
        },
      },
    },
    plugins: [],
  };
