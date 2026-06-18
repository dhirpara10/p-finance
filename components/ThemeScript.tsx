// Inline script injected before first paint to prevent flash of wrong theme.
// Reads localStorage and sets .dark class on <html> synchronously.
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var stored = localStorage.getItem('theme');
        if (stored === 'light') {
          document.documentElement.classList.remove('dark');
        } else if (stored === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          }
        }
      } catch(e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
