export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:  '#00AEEF',
        accent:   '#00D1C1',
        surface:  '#0C1635',
        base:     '#080E24',
        bg:       '#0A1128',
      },
      fontWeight: {
        body: '400',
        label: '500',
        heading: '700',
        display: '800',
      },
    },
  },
  plugins: [],
}
