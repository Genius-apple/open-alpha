/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#09090b",
                foreground: "#fafafa",
                primary: "#10b981", // Emerald 500
                secondary: "#8b5cf6", // Violet 500
                surface: "#18181b", // Zinc 900
                border: "#27272a", // Zinc 800
            }
        },
    },
    plugins: [],
}
