"use client"

import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import axios from "axios"
import { Button } from "./ui/Button"

// Helper: format Airtable date in UTC so it doesn't shift a day
const formatAirtableDate = (isoDate) => {
  if (!isoDate) return "No date"

  try {
    const d = new Date(isoDate)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      timeZone: "UTC", // <<< key line
    })
  } catch {
    return "No date"
  }
}

export default function SearchResults() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const handleReadMore = (postId) => {
    navigate(`/post_details?id=${postId}`)
  }

  const handleTagClick = (e, keyword) => {
    e.stopPropagation();
    navigate(`/posts?keyword=${encodeURIComponent(keyword)}`);
  };

  // Fetch search results from Airtable
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setResults([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Handle multiple search terms
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)

        // Create search conditions for each term across multiple fields
        const searchConditions = searchTerms.map(term =>
          `OR(
        SEARCH("${term}", LOWER({EVENT})),
        SEARCH("${term}", LOWER({NOTES})),
        SEARCH("${term}", LOWER(ARRAYJOIN({KEYWORDS}, ", ")))
      )`
        )

        // Combine all conditions with AND (all terms must match)
        const filterFormula = searchConditions.length > 1
          ? `AND(${searchConditions.join(', ')})`
          : searchConditions[0]

        console.log('Search filter:', filterFormula) // Debug log

        const response = await axios.get(
          "https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker",
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
            },
            params: {
              maxRecords: 100,
              filterByFormula: filterFormula,
              sort: [{ field: "DATE", direction: "desc" }],
            },
          }
        )

        console.log('Search results:', response.data.records) // Debug log
        setResults(response.data.records || [])
      } catch (error) {
        console.error("Error fetching search results:", error)
        setError("Failed to fetch search results. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [query])

  const clearSearch = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <section className="w-full bg-[#e8ecf7] py-8 px-4 md:px-12 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8a9ad4] mx-auto mb-4"></div>
          <p className="text-[#8e3e3e] text-lg">Searching the Swift Lore...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full bg-[#e8ecf7] py-4 md:py-8 px-2 md:px-12 min-h-[60vh]">
      <div className="container mx-auto">
        {/* Search Results Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="relative w-full mb-4 px-2 md:px-6">
            <div className="relative w-full px-4 py-6 bg-[#e8eef9] rounded-lg">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-serif text-[#8e3e3e]">
                  <span className="block">SEARCH RESULTS</span>
                  <span className="text-sm sm:text-lg md:text-2xl lg:text-3xl block mt-2">
                    for "{query}"
                  </span>
                </h2>
              </div>

              {/* Decorative Stars */}
              <div className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2">
                <img
                  src="/images/star.png"
                  alt="Star"
                  className="w-[40px] h-[40px] md:w-[80px] md:h-[80px] lg:w-[120px] lg:h-[120px]"
                />
              </div>
              <div className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2">
                <img
                  src="/images/star.png"
                  alt="Star"
                  className="w-[40px] h-[40px] md:w-[80px] md:h-[80px] lg:w-[120px] lg:h-[120px]"
                />
              </div>
            </div>
          </div>

          {/* Results count and clear button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <p className="text-[#8e3e3e] text-lg font-medium">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
            <Button
              variant="outline"
              className="rounded-full px-6 py-2 text-sm border-[#8e3e3e] text-[#8e3e3e] hover:bg-[#8e3e3e] hover:text-white"
              onClick={clearSearch}
            >
              Back to Timeline
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <Button
              variant="secondary"
              className="rounded-full px-6 py-2"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && results.length === 0 && query.trim() && (
          <div className="text-center py-12">
            <div className="mb-6">
              <img
                src="/images/star.png"
                alt="No results"
                className="w-16 h-16 mx-auto opacity-50 mb-4"
              />
              <h3 className="text-2xl font-serif text-[#8e3e3e] mb-2">No Results Found</h3>
              <p className="text-[#8a9ad4] text-lg">
                No events match your search for "{query}"
              </p>
            </div>
            <Button
              variant="secondary"
              className="rounded-full px-8 py-3"
              onClick={clearSearch}
            >
              Back to Timeline
            </Button>
          </div>
        )}

        {/* Search Results Grid */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
            {results.map((record) => (
              <div
                key={record.id}
                className="bg-[#ffe8e8] rounded-xl overflow-hidden border border-[#ffcaca] flex flex-col hover:shadow-lg transition-shadow duration-200 cursor-pointer h-80"
                onClick={() => handleReadMore(record.id)}
              >
                <div className="relative pt-1 h-48 flex flex-col">
                  {/* Date Badge */}
                  <div className="absolute -top-0.1 left-1/2 transform -translate-x-1/2 bg-white text-[#b91c1c] text-xs font-medium px-2 py-1 rounded-full z-10 min-w-[102px] text-center">
                    {record?.fields?.DATE
                      ? new Date(record.fields.DATE).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric'
                      })
                      : 'No date'}
                  </div>

                  {/* Title */}
                  <div className="px-4 pt-6 pb-2 mt-2 mb-2">
                    <h3 className="text-[#b91c1c] font-medium text-sm text-center line-clamp-2">
                      {record?.fields?.EVENT || 'Untitled Event'}
                    </h3>
                  </div>

                  {/* Image */}
                  <div className="w-[90%] h-32 mx-auto rounded-[3%] flex items-center justify-center">
                    {record?.fields?.IMAGE?.[0]?.url && (
                      <img
                        src={record.fields.IMAGE[0].url}
                        alt={record.fields.EVENT || 'Event image'}
                        className="w-full h-full object-cover object-[center_30%] rounded-[3%]"
                      />
                    )}
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-grow">
                  {/* Notes */}
                  {record?.fields?.NOTES && (
                    <p className="text-[#6b7db3] text-xs mb-2 line-clamp-2">
                      {record.fields.NOTES}
                    </p>
                  )}

                  {/* Tags */}
                  <div className="mt-auto">
                    <div className="flex flex-wrap gap-2">
                      {record?.fields?.KEYWORDS?.slice(0, 3).map((keyword, index) => (
                        <span
                          key={index}
                          className="bg-[#8a9ac7] text-white text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap cursor-pointer hover:bg-[#6b7db3] transition-colors"
                          onClick={(e) => handleTagClick(e, keyword)}
                        >
                          {keyword}
                        </span>
                      ))}
                      {record?.fields?.KEYWORDS?.length > 3 && (
                        <span className="bg-gray-300 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          +{record.fields.KEYWORDS.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {results.length >= 50 && (
          <div className="text-center">
            <p className="text-[#8a9ad4] text-sm mb-4">
              Showing first 50 results. Refine your search for more specific results.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}