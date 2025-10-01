import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const BASENAME = "/snoozer";
const REDIRECT_PATHNAME_KEY = "snoozer__pathname";
const REDIRECT_SEARCH_KEY = "snoozer__search";
const REDIRECT_HASH_KEY = "snoozer__hash";

// Handles routing redirects on static sites like GitHub Pages.
// If a user navigates to a URL other than the root URL where the static site
// is hosted, the 404 page that GitHub Pages shows will record the desired URL
// in localStorage and redirect to the root URL. When the app loads, this hook
// will read the desired URL and fulfill the redirect using the router.
// This allows a single-page app to appear as a multi-page app on GitHub Pages.
export function useStaticRedirect() {
  // Handle redirect on static site
  const navigateTo = useNavigate();
  useEffect(() => {
    const redirectFullPathname = localStorage.getItem(REDIRECT_PATHNAME_KEY);
    const redirectSearch = localStorage.getItem(REDIRECT_SEARCH_KEY) ?? "";
    const redirectHash = localStorage.getItem(REDIRECT_HASH_KEY) ?? "";
    if (redirectFullPathname) {
      localStorage.setItem(REDIRECT_PATHNAME_KEY, "");
      const redirectPathname = redirectFullPathname.substring(BASENAME.length);
      // Hash parameters must come after query (search) parameters, otherwise
      // the query parameters will become part of the hash parameters.
      const redirectUrl = `${redirectPathname}${redirectSearch}${redirectHash}`;
      navigateTo(redirectUrl);
    }
  }, [navigateTo]);
}
