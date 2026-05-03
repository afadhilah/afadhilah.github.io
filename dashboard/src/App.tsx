import { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// @ts-ignore — Once UI types target React 17; cast to any to avoid React 18 FC incompatibility
import { LayoutProvider as LP_, ToastProvider as TP_, IconProvider as IP_ } from "@once-ui-system/core";
const LayoutProvider = LP_ as any;
const ToastProvider  = TP_ as any;
const IconProvider   = IP_ as any;
import AdminDashboard from "./AdminDashboard";
import ContentEditor from "./ContentEditor";
import { iconLibrary } from "../../src/resources/icons";

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: "dark",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("dashboard-theme") as Theme) || "dark";
  });

  useEffect(() => {
    // shadcn dark mode via .dark class
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // once-ui dark mode via data-theme attribute (for preview canvas)
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <LayoutProvider theme={theme}>
        <ToastProvider>
          <IconProvider icons={iconLibrary}>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/create" element={<ContentEditor />} />
                <Route path="/admin/edit/:type/:slug" element={<ContentEditor />} />
              </Routes>
            </Router>
          </IconProvider>
        </ToastProvider>
      </LayoutProvider>
    </ThemeContext.Provider>
  );
}

export default App;
