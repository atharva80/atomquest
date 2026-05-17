import type { Config } from "tailwindcss";

const config: Config = {
  // Tremor uses 'class' strategy for dark mode
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    // Include Tremor module for purging
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Transparent and current colors are required for Tremor
    transparent: "transparent",
    current: "currentColor",
    extend: {
      colors: {
        // shadcn/ui CSS variable-based colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Tremor color overrides (maps to shadcn tokens)
        tremor: {
          brand: {
            faint: "hsl(var(--primary) / 0.05)",
            muted: "hsl(var(--primary) / 0.2)",
            subtle: "hsl(var(--primary) / 0.4)",
            DEFAULT: "hsl(var(--primary))",
            emphasis: "hsl(var(--primary) / 0.9)",
            inverted: "hsl(var(--primary-foreground))",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        "sidebar-width": "240px",
        "inline-gap": "0.5rem",
        "page-margin": "1.5rem",
        "header-height": "56px",
        "card-padding": "1.25rem",
        "field-gap": "0.375rem",
        "component-padding": "1rem",
        "section-gap": "1.5rem"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        "body-relaxed": ["Inter", "sans-serif"],
        "page-title": ["Inter", "sans-serif"],
        "caption": ["Inter", "sans-serif"],
        "data-value-lg": ["Inter", "sans-serif"],
        "badge-label": ["Inter", "sans-serif"],
        "table-cell-primary": ["Inter", "sans-serif"],
        "section-label": ["Inter", "sans-serif"],
        "section-heading": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"]
      },
      fontSize: {
        "body-relaxed": ["14px", { lineHeight: "24px", fontWeight: "400" }],
        "page-title": ["24px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "caption": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "data-value-lg": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "badge-label": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "table-cell-primary": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "section-label": ["12px", { lineHeight: "16px", letterSpacing: "0.1em", fontWeight: "500" }],
        "section-heading": ["16px", { lineHeight: "24px", fontWeight: "500" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }]
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "zoom-in": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.1)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".5" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "fade-in-up-stagger": "fade-in-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.8s ease-out forwards",
        "zoom-in": "zoom-in 20s infinite alternate",
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
