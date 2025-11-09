"use client"
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  return (
    <header className="relative w-full bg-[#8a9ac7] py-12 overflow-hidden">
      {/* Left decorative swirl */}
      <div className="absolute left-0 top-0 h-full w-1/4 pointer-events-none">
        <img
          src="/images/decor_1.png"
          alt=""
          className="h-full w-full object-contain object-left"
          aria-hidden="true"
        />
      </div>

      {/* Right decorative swirl */}
      <div className="absolute right-0 top-15 md:[top-0] h-full w-1/4 pointer-events-none">
        <img
          src="/images/decor_2.png"
          alt=""
          className="h-full w-full object-contain object-right"
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white font-medium mb-6">
          Taylor Swift's <br/>
          Career Timeline
        </h1>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center justify-center rounded-full border border-white/70 bg-transparent px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Return to Home
        </button>
      </div>
    </header>
  )
}
