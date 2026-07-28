import clampwind from "postcss-clampwind";

const config = {
  plugins: ["@tailwindcss/postcss", clampwind()],
};

export default config;
