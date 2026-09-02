"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Deliberate: theme depends on the DOM/localStorage, which don't exist
    // during server rendering, so it can't be computed during render without
    // a hydration mismatch — this has to run once after mount instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(currentTheme());
  }, []);

  function toggle() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-md border border-line px-2.5 py-1.5 text-xs text-muted hover:text-ink hover:border-accent transition-colors"
      aria-label="Toggle color theme"
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
