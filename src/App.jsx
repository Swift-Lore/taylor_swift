import { Routes, Route, useSearchParams } from "react-router-dom";
import Header from "./components/header";
import Timeline from "./components/timeline";
import Footer from "./components/footer";
import Posts from "./components/posts";
import Post_detail from "./components/post_details";
import SearchResults from "./components/search_results";
import CookiePolicy from "./components/cookie_policy";
import PrivacyPolicy from "./components/privacy_policy";
import CookieConsent from "react-cookie-consent";
import ErasTourShows from "./components/ErasTourShows";
import AboutContact from "./components/AboutContact";
import { useEffect } from 'react';
import WeddingPage from "./components/WeddingPage";
import { usePageMetadata } from "./lib/pageMetadata";

/* ------------ Shared layout ------------ */

function Layout({ children, showHero = true }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header showHero={showHero} />
      <main className="flex-1 min-h-0 relative z-0">
        {children}
        {/* Reduced height gradient - only show if needed */}
        <div className="pointer-events-none w-full h-4 bg-gradient-to-b from-transparent to-[#e8ecf7]" />
      </main>
      <Footer />
    </div>
  );
}

/* ------------ Pages ------------ */

function HomePage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <Layout showHero={true}>
      {query ? <SearchResults /> : <Timeline />}
    </Layout>
  );
}

function PostsPage() {
  return (
    <Layout showHero={false}>
      <Posts />
    </Layout>
  );
}

function PostDetailPage() {
  return (
    <Layout showHero={false}>
      <Post_detail />
    </Layout>
  );
}

function CookiePolicyPage() {
  return (
    <Layout showHero={false}>
      <CookiePolicy />
    </Layout>
  );
}

function PrivacyPolicyPage() {
  return (
    <Layout showHero={false}>
      <PrivacyPolicy />
    </Layout>
  );
}

// 🔹 NEW: Eras Tour Shows page wrapper
function ErasTourShowsPage() {
  return (
    <Layout showHero={false}>
      <ErasTourShows />
    </Layout>
  );
}

/* ------------ App root ------------ */

// Load Google scripts after acceptance, on the live domains only.
function loadConsentedScripts() {
  if (!import.meta.env.PROD) return;

  if (
    !["swift-lore.com", "www.swift-lore.com"].includes(
      window.location.hostname
    )
  ) return;

  if (
    !document.querySelector(
      'script[src*="googletagmanager.com/gtag/js"]'
    )
  ) {
    window.dataLayer = window.dataLayer || [];

    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());
    window.gtag("config", "G-XY6VFJX95H");

    const analytics = document.createElement("script");
    analytics.async = true;
    analytics.src =
      "https://www.googletagmanager.com/gtag/js?id=G-XY6VFJX95H";
    document.head.appendChild(analytics);
  }

  if (
    !document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    )
  ) {
    const ads = document.createElement("script");
    ads.async = true;
    ads.crossOrigin = "anonymous";
    ads.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4534610257929133";
    document.head.appendChild(ads);
  }
}

function App() {
  usePageMetadata();
  useEffect(() => {
    // We only load ads in the real live site, not the Bolt preview
    if (!import.meta.env.PROD) return;

    const hasConsent = document.cookie
  .split(";")
  .some((cookie) => cookie.trim() === "websiteCookieConsent=true");
    if (!hasConsent) return;

    loadConsentedScripts();
  }, []);
  return (
    <>
      <Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/timeline" element={<HomePage />} />
  <Route path="/posts" element={<PostsPage />} />
  <Route path="/post_details" element={<PostDetailPage />} />
  <Route path="/cookie-policy" element={<CookiePolicyPage />} />
  <Route path="/privacy_policy" element={<PrivacyPolicyPage />} />

  <Route
    path="/about"
    element={
      <Layout showHero={false}>
        <AboutContact />
      </Layout>
    }
  />

  <Route path="/eras-tour-shows" element={<ErasTourShowsPage />} />

  <Route
    path="/wedding"
    element={
      <Layout showHero={false}>
        <WeddingPage />
      </Layout>
    }
  />
</Routes>

      {/* Cookie banner stays once at the very bottom */}
      <CookieConsent
        location="bottom"
  disableStyles={false}
        buttonText="Accept All Cookies"
        declineButtonText="Reject Non-Essential"
        enableDeclineButton
        cookieName="websiteCookieConsent"
          sameSite="Lax"
        onAccept={() => {
          if (!import.meta.env.PROD) return;
          loadConsentedScripts();
        }}
onDecline={() => {
}}
        style={{
          position: "fixed",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "40px",
          background: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: "#6b7db3",
          fontSize: "14px",
          padding: "20px",
          border: "2px solid #ffcaca",
          borderRadius: "12px",
          maxWidth: "600px",
          width: "90%",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
          zIndex: "9999",
        }}
        buttonStyle={{
          background: "#b91c1c",
          color: "white",
          fontSize: "13px",
          borderRadius: "6px",
          padding: "10px 20px",
          border: "none",
          cursor: "pointer",
          fontWeight: "600",
        }}
        declineButtonStyle={{
          background: "#8a9ac7",
          color: "white",
          fontSize: "13px",
          borderRadius: "6px",
          padding: "10px 20px",
          border: "none",
          cursor: "pointer",
          marginRight: "10px",
          fontWeight: "600",
        }}
        expires={365}
      >
        🍪 We use optional cookies for analytics and advertising.
You can accept or reject these cookies.
        <span style={{ fontSize: "12px", display: "block", marginTop: "8px" }}>
          <a
  href="/privacy_policy"
  style={{
    color: "#b91c1c",
    textDecoration: "underline",
    fontWeight: "500",
  }}
>
  Privacy Policy
</a>
{" | "}
<a
  href="/cookie-policy"
  style={{
    color: "#b91c1c",
    textDecoration: "underline",
    fontWeight: "500",
  }}
>
  Cookie Policy
</a>
        </span>
      </CookieConsent>
    </>
  );
}

export default App;
