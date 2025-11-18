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

/* ------------ Shared layout ------------ */

function Layout({ children }) {
  return (
    <>
      <Header />

      <main className="relative z-0">
        {children}

        {/* Soft, subtle fade between content and footer */}
        <div className="pointer-events-none w-full h-10 md:h-14 bg-gradient-to-b from-transparent via-[#e8ecf7] to-[#E8ECF7]" />
      </main>

      <Footer />
    </>
  );
}

/* ------------ Pages ------------ */

function HomePage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <Layout>
      {query ? <SearchResults /> : <Timeline />}
    </Layout>
  );
}

function PostsPage() {
  return (
    <Layout>
      <Posts />
    </Layout>
  );
}

function PostDetailPage() {
  return (
    <Layout>
      <Post_detail />
    </Layout>
  );
}

function CookiePolicyPage() {
  return (
    <Layout>
      <CookiePolicy />
    </Layout>
  );
}

function PrivacyPolicyPage() {
  return (
    <Layout>
      <PrivacyPolicy />
    </Layout>
  );
}

/* ------------ App root ------------ */

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/post_details" element={<PostDetailPage />} />
        <Route path="/timeline" element={<HomePage />} />
        <Route path="/cookie_policy" element={<CookiePolicyPage />} />
        <Route path="/privacy_policy" element={<PrivacyPolicyPage />} />
      </Routes>

      {/* Cookie banner stays once at the very bottom */}
      <CookieConsent
        buttonText="Accept All Cookies"
        declineButtonText="Reject Non-Essential"
        enableDeclineButton
        cookieName="websiteCookieConsent"
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
        🍪 We use cookies to improve your experience on our site. By continuing
        to browse, you agree to our use of cookies.
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
            href="/cookie_policy"
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
