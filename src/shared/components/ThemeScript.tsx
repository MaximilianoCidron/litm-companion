import { THEME_STORAGE_KEY } from "@/shared/lib/theme";

const script = `
(function () {
  try {
    var key = ${JSON.stringify(THEME_STORAGE_KEY)};
    var stored = window.localStorage.getItem(key);
    var theme = stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "system";
    var resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    if (resolved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (e) {}
})();
`.trim();

export function ThemeScript() {
  return (
    <script
      // Pre-hydration sync script: applies the dark class before paint to
      // prevent FOUC. Content is fully static and JSON-stringified.
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
