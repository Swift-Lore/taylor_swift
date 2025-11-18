import React, { useEffect } from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from 'react-router-dom';
import App from "./App.jsx"
import "./index.css"

function Root() {

  // Fade-in on scroll (matches your new .fade-in classes)
  useEffect(() => {
    const elements = document.querySelectorAll(".fade-in")

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible")
          }
        })
      },
      { threshold: 0.15 }
    )

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />)
