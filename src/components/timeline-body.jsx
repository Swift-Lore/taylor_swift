"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate, useLocation, Link } from "react-router-dom"
import AdComponent from "./ad_component"

// helper: convert "MM/DD/YYYY" -> "YYYY-MM-DD" for Airtable
const parseMMDDYYYYToISO = (value) => {
  if (!value) return ""
  const trimmed = value.trim()
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed)
  if (!match) return ""

  const [, m, d, y] = match
  const month = m.padStart(2, "0")
  const day = d.padStart(2, "0")
  return `${y}-${month}-${day}`
}

export default function TimelineBody() {
  const navigate = useNavigate()
  const location = useLocation()

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const recordsPerPage = 12

  // Filter states
  const [sortOrder, setSortOrder] = useState("asc")
  const [filterKeywords, setFilterKeywords] = useState([])

  // these are what the user types, in MM/DD/YYYY
  const [startDateInput, setStartDateInput] = useState("")
  const [endDateInput, setEndDateInput] = useState("")

  const [monthDay, setMonthDay] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // keywords
  const [allKeywords, setAllKeywords] = useState([])
  const [keywordsLoading, setKeywordsLoading] = useState(false)
  const [keywordsLoaded, setKeywordsLoaded] = useState(false)
  const [showKeywordDropdown, setShowKeywordDropdown] = useState(false)

  // keyword search + match type
  const [keywordSearchQuery, setKeywordSearchQuery] = useState("")
  const [keywordMatchType, setKeywordMatchType] = useState("all") // "any" or "all"

  // pagination offsets
  const [offsetHistory, setOffsetHistory] = useState([null])
  const [currentOffsetIndex, setCurrentOffsetIndex] = useState(0)

  // search mode
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchResults, setSearchResults] = useState([])

  const [isFilterMode, setIsFilterMode] = useState(false)

  // view mode: "grid" or "compact"
  const [viewMode, setViewMode] = useState("grid")
  const TIMELINE_FILTERS_KEY = "swiftLoreTimelineFilters"
  // Tag click = add filter, don’t navigate
  const handleTagClick = (e, keyword) => {
    e.preventDefault()
    e.stopPropagation()

    if (!filterKeywords.includes(keyword)) {
      setFilterKeywords([...filterKeywords, keyword])
    }
    resetPagination()
  }

  // Read query params (?q=, ?keyword=)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const queryFromUrl = urlParams.get("q")
    const keywordFromUrl = urlParams.get("keyword")

    if (keywordFromUrl) {
      if (!filterKeywords.includes(keywordFromUrl)) {
        setFilterKeywords([keywordFromUrl])
      }
      setSearchQuery("")
      setStartDateInput("")
      setEndDateInput("")
      setMonthDay("")
      resetPagination()

      setTimeout(() => {
        urlParams.delete("keyword")
        navigate(`?${urlParams.toString()}`, { replace: true })
      }, 0)
    } else if (queryFromUrl) {
      setSearchQuery(queryFromUrl)
    }
  }, [location.search, navigate, filterKeywords])

  // lazy-load all unique keywords from Airtable when dropdown first opens
  const loadKeywordsIfNeeded = async () => {
    if (keywordsLoaded || keywordsLoading) return

    setKeywordsLoading(true)
    try {
      const keywordSet = new Set()
      let offset = undefined

      do {
        const response = await axios.get(
          "https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker",
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
            },
            params: {
              pageSize: 100,
              offset,
              fields: ["KEYWORDS"],
            },
          }
        )

        response.data.records.forEach((record) => {
          ;(record.fields.KEYWORDS || []).forEach((kw) => {
            const cleaned = typeof kw === "string" ? kw.trim() : ""
            if (cleaned) keywordSet.add(cleaned)
          })
        })

        offset = response.data.offset
      } while (offset)

      setAllKeywords(Array.from(keywordSet).sort((a, b) => a.localeCompare(b)))
      setKeywordsLoaded(true)
    } catch (error) {
      console.error("Error fetching all keywords:", error)
    } finally {
      setKeywordsLoading(false)
    }
  }

  // preload keywords in the background as soon as the page mounts
  useEffect(() => {
    loadKeywordsIfNeeded()
  }, [])

  // filter keywords list (using dynamic list from Airtable)
  const getFilteredKeywords = () => {
    const source = allKeywords.length ? allKeywords : []
    if (!keywordSearchQuery.trim()) return source

    const query = keywordSearchQuery.toLowerCase()
    return source
      .filter((keyword) => keyword.toLowerCase().includes(query))
      .sort((a, b) => {
        const aLower = a.toLowerCase()
        const bLower = b.toLowerCase()
        if (aLower.startsWith(query) && !bLower.startsWith(query)) return -1
        if (!aLower.startsWith(query) && bLower.startsWith(query)) return 1
        return a.localeCompare(b)
      })
  }

  // Fetch posts (filters + pagination)
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)

      try {
        const clauses = []

        const startISO = parseMMDDYYYYToISO(startDateInput)
        const endISO = parseMMDDYYYYToISO(endDateInput)

        // inclusive start: DATE >= startISO
        if (startISO) {
          clauses.push(
            `OR(IS_SAME({DATE}, '${startISO}'), IS_AFTER({DATE}, '${startISO}'))`
          )
        }

        // inclusive end: DATE <= endISO
        if (endISO) {
          clauses.push(
            `OR(IS_SAME({DATE}, '${endISO}'), IS_BEFORE({DATE}, '${endISO}'))`
          )
        }

        // month/day MM/DD (any year), only when fully entered
        if (monthDay && monthDay.length === 5) {
          const [m, d] = monthDay.split("/")
          const monthNum = parseInt(m, 10)
          const dayNum = parseInt(d, 10)

          if (!isNaN(monthNum) && !isNaN(dayNum)) {
            clauses.push(
              `AND(MONTH({DATE}) = ${monthNum}, DAY({DATE}) = ${dayNum})`
            )
          }
        }

        // keyword filters
        if (filterKeywords.length > 0) {
          const keywordFilters = filterKeywords.map((keyword) => {
            const safe = keyword.replace(/'/g, "\\'")
            return `FIND('${safe}', ARRAYJOIN({KEYWORDS}, ',')) > 0`
          })

          const keywordFormula =
            keywordMatchType === "any"
              ? `OR(${keywordFilters.join(",")})`
              : `AND(${keywordFilters.join(",")})`

          clauses.push(keywordFormula)
        }

        // basic search (when not in "search mode")
        if (searchQuery.trim() && !isSearchMode) {
          const capitalizedQuery =
            searchQuery.trim().charAt(0).toUpperCase() +
            searchQuery.trim().slice(1)

          const searchFormula = `OR(
            FIND('${capitalizedQuery}', {EVENT}) > 0,
            FIND('${capitalizedQuery}', {LOCATION}) > 0,
            FIND('${capitalizedQuery}', {CATEGORY}) > 0,
            FIND('${capitalizedQuery}', ARRAYJOIN({KEYWORDS}, ',')) > 0
          )`

          clauses.push(searchFormula)
        }

        const filterFormula =
          clauses.length === 0
            ? ""
            : clauses.length === 1
            ? clauses[0]
            : `AND(${clauses.join(",")})`

        const isFilterActive = clauses.length > 0
        setIsFilterMode(isFilterActive)

        console.log("Airtable filter formula:", filterFormula || "(none)")

        // Filter mode fetch (no pagination)
        if (isFilterActive) {
          const response = await axios.get(
            "https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker",
            {
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
              },
              params: {
                maxRecords: 100,
                filterByFormula: filterFormula || undefined,
                sort: [{ field: "DATE", direction: sortOrder }],
              },
            }
          )

          const formattedPosts = response.data.records.map((record) => ({
            id: record.id,
            date: record.fields.DATE
              ? (() => {
                  const date = new Date(record.fields.DATE)
                  const options = {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                    timeZone: "UTC",
                  }
                  return date.toLocaleDateString("en-US", options)
                })()
              : "No date",
            category: record.fields.CATEGORY || "Uncategorized",
            title: record.fields.EVENT || "Untitled Event",
            location: record.fields.LOCATION || "",
            image: record.fields.IMAGE?.[0]?.url || null,
            year: record.fields.DATE
              ? new Date(record.fields.DATE).getFullYear()
              : "",
            keywords: record.fields.KEYWORDS || [],
            notes: record.fields.NOTES || null,
          }))

          setPosts(formattedPosts)
          setHasMore(false)
        } else {
          // normal paginated mode
          const currentOffset = offsetHistory[currentOffsetIndex]
          const response = await axios.get(
            "https://api.airtable.com/v0/appVhtDyx0VKlGbhy/Taylor%20Swift%20Master%20Tracker",
            {
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
              },
              params: {
                pageSize: recordsPerPage,
                offset: currentOffset,
                filterByFormula: filterFormula || undefined,
                sort: [{ field: "DATE", direction: sortOrder }],
                view: "Grid view",
              },
            }
          )

          const hasMoreRecords = !!response.data.offset
          setHasMore(hasMoreRecords)

          if (hasMoreRecords) {
            if (currentOffsetIndex === offsetHistory.length - 1) {
              setOffsetHistory((prev) => [...prev, response.data.offset])
            }
          }

          const formattedPosts = response.data.records.map((record) => ({
            id: record.id,
            date: record.fields.DATE
              ? (() => {
                  const date = new Date(record.fields.DATE)
                  const options = {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                    timeZone: "UTC",
                  }
                  return date.toLocaleDateString("en-US", options)
                })()
              : "No date",
            category: record.fields.CATEGORY || "Uncategorized",
            title: record.fields.EVENT || "Untitled Event",
            location: record.fields.LOCATION || "",
            image: record.fields.IMAGE?.[0]?.url || null,
            year: record.fields.DATE
              ? new Date(record.fields.DATE).getFullYear()
              : "",
            keywords: record.fields.KEYWORDS || [],
            notes: record.fields.NOTES || null,
          }))

          setPosts(formattedPosts)
        }
      } catch (error) {
        console.error("Error fetching records:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [
    currentOffsetIndex,
    sortOrder,
    filterKeywords,
    keywordMatchType,
    startDateInput,
    endDateInput,
    monthDay,
    searchQuery,
    offsetHistory,
    isSearchMode,
  ])

  // filter helpers
  const handleSortChange = (order) => {
    setSortOrder(order)
    resetPagination()
  }

  const handleKeywordFilter = (keyword) => {
    if (filterKeywords.includes(keyword)) {
      setFilterKeywords(filterKeywords.filter((k) => k !== keyword))
    } else {
      setFilterKeywords([...filterKeywords, keyword])
    }
  }

  const handleMonthDayChange = (value) => {
    setMonthDay(value)

    // Only reset + trigger a real filter when complete (MM/DD) or cleared
    if (value === "" || value.length === 5) {
      resetPagination()
    }
  }

  const handleStartDateChange = (value) => {
    setStartDateInput(value)
    resetPagination()
  }

  const handleEndDateChange = (value) => {
    setEndDateInput(value)
    resetPagination()
  }

  // Search
  const handleSearch = async (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      try {
        setLoading(true)
        setIsSearchMode(true)

        const searchTerms = searchQuery
          .trim()
          .toLowerCase()
          .split(" ")
          .filter((term) => term.length > 0)

        const searchConditions = searchTerms.map(
          (term) => `OR(
          SEARCH("${term}", LOWER({EVENT})),
          SEARCH("${term}", LOWER({NOTES})),
          SEARCH("${term}", LOWER(ARRAYJOIN({KEYWORDS}, ", ")))
        )`
        )

        const filterFormula =
          searchConditions.length > 1
            ? `AND(${searchConditions.join(", ")})`
            : searchConditions[0]

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

        const formattedResults = response.data.records.map((record) => ({
          id: record.id,
          date: record.fields.DATE
            ? (() => {
                const date = new Date(record.fields.DATE)
                const options = {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                  timeZone: "UTC",
                }
                return date.toLocaleDateString("en-US", options)
              })()
            : "No date",
          category: record.fields.CATEGORY || "Uncategorized",
          title: record.fields.EVENT || "Untitled Event",
          location: record.fields.LOCATION || "",
          image: record.fields.IMAGE?.[0]?.url || null,
          year: record.fields.DATE
            ? new Date(record.fields.DATE).getFullYear()
            : "",
          keywords: record.fields.KEYWORDS || [],
          notes: record.fields.NOTES || null,
        }))

        setSearchResults(formattedResults)
      } catch (error) {
        console.error("Error fetching search results:", error)
        setSearchResults([])
      } finally {
        setLoading(false)
      }
    } else {
      setIsSearchMode(false)
      setSearchResults([])
    }
  }

  const clearSearch = () => {
    setIsSearchMode(false)
    setSearchResults([])
    setSearchQuery("")
  }

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch(e)
    }
  }

  // pagination helpers
  const resetPagination = () => {
    setPage(1)
    setCurrentOffsetIndex(0)
    setOffsetHistory([null])
  }

  const handlePreviousPage = () => {
    if (currentOffsetIndex > 0) {
      setCurrentOffsetIndex((prev) => prev - 1)
      setPage((prev) => prev - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentOffsetIndex((prev) => prev + 1)
      setPage((prev) => prev + 1)
      window.scrollTo(0, 0)
    }
  }

  // Reset ALL filters
  const resetAllFilters = () => {
    setSortOrder("asc")
    setFilterKeywords([])
    setKeywordMatchType("all")
    setKeywordSearchQuery("")
    setStartDateInput("")
    setEndDateInput("")
    setMonthDay("")
    setSearchQuery("")
    setIsSearchMode(false)
    setSearchResults([])
    setShowKeywordDropdown(false)
    resetPagination()
  }

  // group posts by year in original order
  const groupPostsByYear = (list) => {
    const groups = []
    const map = new Map()
    list.forEach((post) => {
      const year = post.year || "Unknown"
      if (!map.has(year)) {
        const group = { year, posts: [] }
        map.set(year, group)
        groups.push(group)
      }
      map.get(year).posts.push(post)
    })
    return groups
  }

  // render helpers: grid vs compact archive
  const renderGridCards = (items) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
      {items.map((post) => (
        <Link
          key={post.id}
          to={`/post_details?id=${post.id}`}
          className="bg-[#ffe8e8] rounded-xl overflow-hidden border border-[#ffcaca] flex flex-col hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full"
        >
          <div className="relative pt-1 flex flex-col">
            {/* date pill */}
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 bg-white text-[#b91c1c] text-xs font-medium px-2 py-1 rounded-full z-10">
              {post.date}
            </div>

            {/* title */}
            <div className="px-4 pt-6 pb-2 mt-2">
              <h3 className="text-[#b91c1c] font-medium text-sm text-center line-clamp-2">
                {post.title}
              </h3>
            </div>

            {/* image */}
            {post.image && (
              <div className="w-[90%] aspect-[4/3] mx-auto mb-2 rounded-[3%] overflow-hidden flex items-center justify-center">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover object-[center_30%]"
                />
              </div>
            )}
          </div>

          <div className="p-4 flex flex-col flex-grow">
            {post.notes && (
              <div className="text-[#6b7db3] text-xs mb-2 line-clamp-2 whitespace-pre-line">
                {post.notes}
              </div>
            )}

            <div className="mt-auto">
              <div className="flex flex-wrap gap-2">
                {post.keywords?.map((keyword, index) => (
                  <span
                    key={index}
                    className="bg-[#8a9ac7] text-white text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap cursor-pointer hover:bg-[#6b7db3] transition-colors"
                    onClick={(e) => handleTagClick(e, keyword)}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )

  const renderCompactArchive = (items) => {
    const groups = groupPostsByYear(items)
    return (
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.year}>
            <h3 className="text-sm font-semibold text-[#8e3e3e] mb-1 mt-2">
              {group.year}
            </h3>
            <div className="space-y-2">
              {group.posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/post_details?id=${post.id}`}
                  className="flex items-start gap-3 bg-[#ffe8e8] border border-[#ffcaca] rounded-lg px-3 py-2 hover:shadow-md transition-shadow duration-150 cursor-pointer"
                >
                  {/* date pill */}
                  <div className="shrink-0">
                    <div className="bg-white text-[#b91c1c] text-[11px] font-medium px-2 py-1 rounded-full text-center min-w-[88px]">
                      {post.date}
                    </div>
                  </div>

                  {/* text content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                      <h3 className="text-[#b91c1c] font-medium text-sm line-clamp-1">
                        {post.title}
                      </h3>
                      {post.location && (
                        <span className="text-[11px] text-[#6b7db3] line-clamp-1">
                          {post.location}
                        </span>
                      )}
                    </div>

                    {post.notes && (
                      <p className="mt-1 text-[11px] text-[#6b7db3] line-clamp-2 whitespace-pre-line">
                        {post.notes}
                      </p>
                    )}

                    {/* tags row */}
                    {post.keywords?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {post.keywords.slice(0, 4).map((keyword, index) => (
                          <span
                            key={index}
                            className="bg-[#8a9ac7] text-white text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap cursor-pointer hover:bg-[#6b7db3] transition-colors"
                            onClick={(e) => handleTagClick(e, keyword)}
                          >
                            {keyword}
                          </span>
                        ))}
                        {post.keywords.length > 4 && (
                          <span className="text-[10px] text-gray-500">
                            +{post.keywords.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // AdSense init
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.adsbygoogle &&
      process.env.NODE_ENV === "production"
    ) {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (e) {
        console.error("AdSense error:", e)
      }
    }
  }, [])

  return (
    <div className="bg-[#e6edf7] py-8 overflow-x-hidden">
      {/* Ad Placement */}
      <div className="w-full max-w-4xl mx-auto px-4 mb-6">
        <div className="relative rounded-2xl border border-[#f8dada] bg-gradient-to-b from-[#fff8f8] to-[#fdeeee] shadow-sm px-4 py-6 min-h-[110px] flex items-center justify-center">
          <span className="absolute top-2 left-4 text-[10px] uppercase tracking-[0.12em] text-[#9ca3af]">
            Sponsored
          </span>

          {process.env.NODE_ENV === "production" ? (
            <AdComponent />
          ) : (
            <div className="text-[#9ca3af] text-sm italic">
              Advertisement space — supporting Swift Lore 💫
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="relative flex flex-wrap gap-2 py-4 items-center overflow-visible">
          {/* Sort By */}
          <div className="relative">
            <button
              className="flex items-center justify-between bg.white text-[#6b7db3] border border-[#6b7db3] rounded-full px-4 py-1.5 text-sm min-w-[120px] bg-white"
              onClick={() =>
                handleSortChange(sortOrder === "asc" ? "desc" : "asc")
              }
            >
              <span>Sort by {sortOrder === "asc" ? "oldest" : "newest"}</span>
              <span className="ml-2">▼</span>
            </button>
          </div>

          {/* Filter Keywords dropdown */}
          <div className="relative">
            <button
              className="flex items-center justify-between bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-4 py-1.5 text-sm min-w-[150px]"
              onClick={() => {
                const next = !showKeywordDropdown
                setShowKeywordDropdown(next)
                if (next) loadKeywordsIfNeeded()
              }}
            >
              <span>
                {filterKeywords.length > 0
                  ? `${filterKeywords.length} selected`
                  : "Filter by keyword"}
              </span>
              <span className="ml-2">▼</span>
            </button>

            {showKeywordDropdown && (
    <div className="absolute left-0 top-full mt-1 w-[90vw] sm:w-64 max-w-[90vw] bg-white border border-[#6b7db3] rounded-lg shadow-lg z-50 max-h-[60vh] overflow-y-auto">
    <div className="p-2">
                  {keywordsLoading && allKeywords.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-gray-500">
                      Loading keywords…
                    </div>
                  ) : (
                    <>
                      {/* Keyword search input */}
                      <div className="relative mb-2">
                        <input
                          type="text"
                          placeholder="Search keywords..."
                          className="w-full bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-3 py-1.5 text-sm"
                          value={keywordSearchQuery}
                          onChange={(e) =>
                            setKeywordSearchQuery(e.target.value)
                          }
                        />
                      </div>

                      {/* Any / All toggle */}
                      {filterKeywords.length > 0 && (
                        <div className="mb-2 p-2 bg-[#e6edf7] rounded">
                          <div className="flex items-center gap-4">
                            <label className="flex items-center text-sm">
                              <input
                                type="radio"
                                name="matchType"
                                value="any"
                                checked={keywordMatchType === "any"}
                                onChange={(e) => {
                                  setKeywordMatchType(e.target.value)
                                  resetPagination()
                                }}
                                className="mr-1"
                              />
                              Has Any
                            </label>
                            <label className="flex items-center text-sm">
                              <input
                                type="radio"
                                name="matchType"
                                value="all"
                                checked={keywordMatchType === "all"}
                                onChange={(e) => {
                                  setKeywordMatchType(e.target.value)
                                  resetPagination()
                                }}
                                className="mr-1"
                              />
                              Has All
                            </label>
                          </div>
                        </div>
                      )}

                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#e6edf7] rounded mb-1"
                        onClick={() => {
                          setFilterKeywords([])
                          setShowKeywordDropdown(false)
                          setKeywordSearchQuery("")
                          resetPagination()
                        }}
                      >
                        Clear All Filters
                      </button>

                      <div className="max-h-[50vh] overflow-y-auto">
                        {getFilteredKeywords().map((keyword, index) => (
                          <div
                            key={index}
                            className="flex items-center px-3 py-2"
                          >
                            <input
                              type="checkbox"
                              id={`keyword-${index}`}
                              checked={filterKeywords.includes(keyword)}
                              onChange={() => handleKeywordFilter(keyword)}
                              className="mr-2"
                            />
                            <label
                              htmlFor={`keyword-${index}`}
                              className="text-sm cursor-pointer"
                            >
                              {keyword}
                            </label>
                          </div>
                        ))}

                        {getFilteredKeywords().length === 0 &&
                          keywordSearchQuery && (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No keywords found matching "{keywordSearchQuery}"
                            </div>
                          )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Start Date */}
          <div className="relative">
            <input
              type="text"
              placeholder="Start Date (MM/DD/YYYY)"
              className="bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-4 py-1.5 text-sm min-w-[170px]"
              value={startDateInput}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <input
              type="text"
              placeholder="End Date (MM/DD/YYYY)"
              className="bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-4 py-1.5 text-sm min-w-[170px]"
              value={endDateInput}
              onChange={(e) => handleEndDateChange(e.target.value)}
            />
          </div>

          {/* Month/Day */}
          <div className="relative">
            <input
              type="text"
              placeholder="Month/Day (MM/DD)"
              className="bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-4 py-1.5 text-sm min-w-[150px]"
              value={monthDay}
              onChange={(e) => handleMonthDayChange(e.target.value)}
            />
          </div>

          {/* Search */}
          <div className="relative flex-grow min-w-[200px]">
            <form onSubmit={handleSearch} className="relative ml-2">
              <input
                type="text"
                placeholder="Search any keywords"
                className="w-full rounded-full py-1.5 pl-10 pr-4 text-sm bg-white border border-[#6b7db3] text-[#6b7db3]"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={handleSearchKeyPress}
              />
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="#6b7db3"
                >
                  <path d="M10 2a8 8 0 105.293 14.293l4.707 4.707 1.414-1.414-4.707-4.707A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z" />
                </svg>
              </div>
            </form>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              className={`px-3 py-1 text-xs rounded-full border ${
                viewMode === "grid"
                  ? "bg-[#c25e5e] text-white border-[#c25e5e]"
                  : "bg-white text-[#6b7db3] border-[#6b7db3]"
              }`}
              onClick={() => setViewMode("grid")}
            >
              Grid
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-xs rounded-full border ${
                viewMode === "compact"
                  ? "bg-[#c25e5e] text-white border-[#c25e5e]"
                  : "bg.white text-[#6b7db3] border-[#6b7db3] bg-white"
              }`}
              onClick={() => setViewMode("compact")}
            >
              Compact
            </button>
          </div>

          {/* Reset Filters button */}
          <button
            className="flex items-center bg-white text-[#b91c1c] border border-[#b91c1c] rounded-full px-4 py-1.5 text-sm"
            onClick={resetAllFilters}
          >
            Reset filters
          </button>

          {/* Clear keyword filters button (when some selected) */}
          {filterKeywords.length > 0 && (
            <div className="relative">
              <button
                className="flex items-center justify-between bg-[#b91c1c] text-white rounded-full px-4 py-1.5 text-sm"
                onClick={() => {
                  setFilterKeywords([])
                  resetPagination()
                }}
              >
                Clear {filterKeywords.length} Filter
                {filterKeywords.length !== 1 ? "s" : ""}
                <span className="ml-2">×</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selected keywords chips */}
      {filterKeywords.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 mb-4">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm text-[#6b7db3] font-medium">
              Has {keywordMatchType === "all" ? "All" : "Any"}:
            </span>
            {filterKeywords.map((keyword, index) => (
              <div
                key={index}
                className="bg-[#8a9ac7] text-white text-xs px-3 py-1 rounded-full flex items-center cursor-pointer hover:bg-[#6b7db3]"
                onClick={() => {
                  setFilterKeywords(filterKeywords.filter((k) => k !== keyword))
                  resetPagination()
                }}
              >
                {keyword}
                <span className="ml-1 text-xs">×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content / grids */}
      {!loading && (
        <div className="max-w-6xl mx-auto px-4">
          {isSearchMode ? (
            <>
              {/* Search results header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-serif text-[#8e3e3e] mb-2">
                  Search Results for "{searchQuery}"
                </h2>
                <p className="text-[#8e3e3e] text-lg mb-4">
                  {searchResults.length} result
                  {searchResults.length !== 1 ? "s" : ""} found
                </p>
                <button
                  onClick={clearSearch}
                  className="bg-[#b91c1c] text-white rounded-full px-4 py-1.5 text-sm mb-6"
                >
                  Clear Search
                </button>
              </div>

              {/* Search results list */}
              {searchResults.length === 0 ? (
                <div className="text-center py-12 text-[#b91c1c]">
                  No results found for "{searchQuery}"
                </div>
              ) : viewMode === "grid" ? (
                renderGridCards(searchResults)
              ) : (
                renderCompactArchive(searchResults)
              )}
            </>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-[#b91c1c]">
              No posts found matching your criteria. Try different filters.
            </div>
          ) : viewMode === "grid" ? (
            renderGridCards(posts)
          ) : (
            renderCompactArchive(posts)
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading &&
        !isFilterMode &&
        !isSearchMode &&
        (posts.length > recordsPerPage || hasMore) && (
          <div className="max-w-6xl mx-auto px-4 my-8 flex justify-center items-center gap-2">
            <span
              className={`text-sm ${
                page > 1 ? "text-[#bb6d6d] cursor-pointer" : "text-[#bb6d6d]/50"
              }`}
              onClick={page > 1 ? handlePreviousPage : undefined}
            >
              Previous Page
            </span>
            <button
              className={`w-8 h-8 flex items-center justify-center rounded-full border border-[#bb6d6d] ${
                page > 1
                  ? "bg-[#e6edf7] text-[#bb6d6d]"
                  : "bg-[#e6edf7]/50 text-[#bb6d6d]/50"
              }`}
              onClick={page > 1 ? handlePreviousPage : undefined}
              disabled={page <= 1}
            >
              &lt;
            </button>
            <div className="mx-2 text-[#bb6d6d]">Page {page}</div>
            <button
              className={`w-8 h-8 flex items-center justify-center rounded-full border border-[#bb6d6d] ${
                hasMore
                  ? "bg-[#e6edf7] text-[#bb6d6d]"
                  : "bg-[#e6edf7]/50 text-[#bb6d6d]/50"
              }`}
              onClick={hasMore ? handleNextPage : undefined}
              disabled={!hasMore}
            >
              &gt;
            </button>
            <span
              className={`text-sm ${
                hasMore ? "text-[#bb6d6d] cursor-pointer" : "text-[#bb6d6d]/50"
              }`}
              onClick={hasMore ? handleNextPage : undefined}
            >
              Next Page
            </span>
          </div>
        )}

      {/* View On This Day Button */}
      <div className="max-w-6xl mx-auto px-4 mt-16">
        <button
          className="w-full bg-[#c25e5e] text.white py-3 rounded-full font-medium text-white"
          onClick={() => {
            navigate("/timeline")
            window.scrollTo(0, 0)
          }}
        >
          View On This Day
        </button>
      </div>
      <br />
    </div>
  )
}
