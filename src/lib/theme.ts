export type Theme = "light" | "dark";

const THEME_KEY = "slovoznai:theme";
const THEME_COLORS: Record<Theme, string> = {
  light: "#f2f2f2",
  dark: "#252525",
};

/** Поточна тема, яку вже виставив скрипт у app.html. */
export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Без сховища тема діє до перезавантаження.
  }
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);
}
