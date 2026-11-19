/** Loads the Awaaz assistant into the current page from this site (same code the bookmarklet uses). */
export function loadAwaaz(): void {
  const origin = window.location.origin
  window.__AWAAZ__ = { apiBase: origin }
  const script = document.createElement('script')
  script.src = `${origin}/awaaz-overlay.js?v=${Date.now()}`
  document.documentElement.appendChild(script)
}

/** The one-line bookmarklet that does the same on any other website. */
export function bookmarkletFor(origin: string): string {
  const base = JSON.stringify(origin)
  return `javascript:(function(){window.__AWAAZ__={apiBase:${base}};var s=document.createElement('script');s.src=${base}+'/awaaz-overlay.js?v='+Date.now();document.documentElement.appendChild(s)})();`
}
