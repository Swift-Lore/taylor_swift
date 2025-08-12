"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate, useLocation } from 'react-router-dom';
import AdComponent from "./ad_component";

// Hardcoded list of all keywords
const ALL_KEYWORDS = [
  "112 Day Theory", "1989", "1989 Tour", "Aaron Dessner", "Abigail Anderson",
  "Acoustic Song Mess-Up", "Album Announcement", "Album Release", "Amsterdam",
  "Ashley Avignone", "Award Show", "Awards", "Behind the scenes / Filming",
  "Benefit Event", "Beyonce", "Blake Lively", "Brand Deals / Merch",
  "Bug Swallow - Eras Tour", "Calvin Harris", "Cara Delevigne", "Career Event",
  "Cats Movie", "Charity / Altruism", "Chiefs Game", "Choreo Error", "Claire Winter",
  "Commercial", "Competition Show", "Concert Film", "Conor Kennedy", "Cory Monteith",
  "Cover Songs", "Daisy attire", "Debut", "Demi Lovato", "Dianna Agron",
  "Documentary", "Ed Sheeran", "Ellen", "Emily Poe", "Emma Stone",
  "Equipment Malfunction", "evermore", "Evil Eye Jewelry", "Fan Interactions & Surprises",
  "Fearless", "Fearless Tour", "Features / Cameos", "Feuds / Gossip / Drama",
  "folklore", "Full Moon", "Gigi Hadid", "Girl Squad", "GMA",
  "Gold Neck Tattoo", "Grammy's", "HAIM", "Hannah Montana: The Movie",
  "Harry Styles", "Hayley Williams", "Ice Spice", "Infinity Bracelet", "J Necklace",
  "Jack Antonoff", "Jake Gyllenhall", "Jingle Ball", "Joe Alwyn", "Joe Jonas",
  "John Mayer", "Journal Entry", "July 4th Parties", "Kanye West", "Karlie Kloss",
  "Katy Perry", "Keleigh Teller", "LGBTQ", "Life Event", "Lily Aldridge",
  "Lily Donaldson", "Live Performances", "Liz Huett", "Lorde", "Lover",
  "Lyric Change", "Magazine Interview / Cover", "Martin Johnson", "Masters Drama",
  "Matt Healy", "Merchandise Release", "Meredith / Olivia / Benjamin", "Met Gala",
  "Midnights", "Miley Cyrus", "Miscellaneous Events", "Miss Americana", "Movie Release",
  "Music Industry Drama", "Music Release", "Music Video Release", "Myspace Blog",
  "New Eras Tour Outfit Variant", "Olivia Rodrigo", "Pap Walk / Sighting", "Paul McCartney",
  "Plane Travel", "Politics", "Product Release", "Radio Show", "Rain Show",
  "Real Estate", "Recording Studio", "Red", "Red Tour", "Reputation",
  "Reputation Tour", "Sabrina Carpenter", "Sapphire Evil Eye Ring", "Scissor Jewelry",
  "Secret Sessions", "Selena Gomez", "Setlist Change", "Sexual Assault Trial", "SNL",
  "Social Media Activity", "Social Media Post", "Songwriting", "Sophie Turner", "Soundtrack",
  "Speak Now", "Speak Now Tour", "Special Guest", "Stevie Nicks", "Talk Show",
  "Taylor Lautner", "Taylor Nation Post", "Taylor's Birthday", "The Eras Tour",
  "The Errors Tour", "The Giver", "The Lorax", "Tilly Necklace", "Tiny Braid",
  "TNT Bracelet", "Tom Hiddleston", "Travis Kelce", "Tree Paine",
  "TS12 Potential Easter Eggs", "TTPD", "TV / Streaming Special", "TV / Web Interview",
  "TV Show Appearances", "Unique Tour Occurence", "Vacation", "Valentine's Day (Movie)",
  "Victoria's Secret Fashion Show", "Vlog", "VSFS Ring", "Wardrobe Malfunction",
  "White Wine", "Will Anderson", "Wizard of Oz", "Zoe Kravitz"
];

export default function TimelineBody() {
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(null)
  const recordsPerPage = 12

  // Filter states
  const [sortOrder, setSortOrder] = useState("asc")
  const [filterKeywords, setFilterKeywords] = useState([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [monthDay, setMonthDay] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Missing state variable - FIXED
  const [showKeywordDropdown, setShowKeywordDropdown] = useState(false)

  // New states for keyword search and has any/all
  const [keywordSearchQuery, setKeywordSearchQuery] = useState("")
  const [keywordMatchType, setKeywordMatchType] = useState("all") // "any" or "all"

  // Store pagination history
  const [offsetHistory, setOffsetHistory] = useState([null])
  const [currentOffsetIndex, setCurrentOffsetIndex] = useState(0)

  /* NEW */
  // Add this state near your other state declarations
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  /* NEW */

  // Get search query from URL params
  // useEffect(() => {
  //   const urlParams = new URLSearchParams(location.search)
  //   const queryFromUrl = urlParams.get('q')
  //   if (queryFromUrl) {
  //     setSearchQuery(queryFromUrl)
  //   }
  // }, [location.search])

  const handleCardClick = (postId) => {
    navigate(`/post_details?id=${postId}`);
  };

  // New function to handle tag clicks
  const handleTagClick = (keyword) => {
    if (!filterKeywords.includes(keyword)) {
      setFilterKeywords([...filterKeywords, keyword]);
    }
    resetPagination();
  };

  // Update the useEffect that reads URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const queryFromUrl = urlParams.get('q');
    const keywordFromUrl = urlParams.get('keyword');

    if (keywordFromUrl) {
      // Only process if not already in filter
      if (!filterKeywords.includes(keywordFromUrl)) {
        setFilterKeywords([keywordFromUrl]);
      }
      setSearchQuery('');
      setStartDate('');
      setEndDate('');
      setMonthDay('');
      resetPagination();

      // Clean up URL after state updates
      setTimeout(() => {
        urlParams.delete('keyword');
        navigate(`?${urlParams.toString()}`, { replace: true });
      }, 0);
    } else if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
    }
  }, [location.search, navigate, filterKeywords]);

  // Function to filter keywords based on search query
  const getFilteredKeywords = () => {
    if (!keywordSearchQuery.trim()) {
      return ALL_KEYWORDS;
    }

    const query = keywordSearchQuery.toLowerCase();
    return ALL_KEYWORDS.filter(keyword =>
      keyword.toLowerCase().includes(query)
    ).sort((a, b) => {
      // Prioritize exact matches and starts with matches
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();

      if (aLower.startsWith(query) && !bLower.startsWith(query)) return -1;
      if (!aLower.startsWith(query) && bLower.startsWith(query)) return 1;

      return a.localeCompare(b);
    });
  };

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)

      try {
        let filterFormula = ""

        if (startDate && endDate) {
          filterFormula += `AND(IS_AFTER({DATE}, '${startDate}'), IS_BEFORE({DATE}, '${endDate}'))`
        } else if (startDate) {
          filterFormula += `IS_AFTER({DATE}, '${startDate}')`
        } else if (endDate) {
          filterFormula += `IS_BEFORE({DATE}, '${endDate}')`
        }

        if (monthDay) {
          const [month, day] = monthDay.split('/')
          if (filterFormula) {
            filterFormula = `AND(${filterFormula}, AND(MONTH({DATE}) = ${month}, DAY({DATE}) = ${day}))`
          } else {
            filterFormula = `AND(MONTH({DATE}) = ${month}, DAY({DATE}) = ${day})`
          }
        }

        // Updated keyword filter with "has any" vs "has all" logic
        if (filterKeywords.length > 0) {
          const keywordFilters = filterKeywords.map(keyword => {
            return `FIND('${keyword}', ARRAYJOIN({KEYWORDS}, ',')) > 0`;
          });

          const keywordFormula = keywordMatchType === "any"
            ? `OR(${keywordFilters.join(',')})`
            : `AND(${keywordFilters.join(',')})`;

          filterFormula = filterFormula
            ? `AND(${filterFormula}, ${keywordFormula})`
            : keywordFormula;
        }

        // Capitalize first letter for search query
        if (searchQuery.trim()) {
          // Capitalize the first letter of the search query
          const capitalizedQuery = searchQuery.trim().charAt(0).toUpperCase() + searchQuery.trim().slice(1);

          const searchFilter = `OR(
            FIND('${capitalizedQuery}', {EVENT}) > 0,
            FIND('${capitalizedQuery}', {LOCATION}) > 0,
            FIND('${capitalizedQuery}', {CATEGORY}) > 0,
            FIND('${capitalizedQuery}', ARRAYJOIN({KEYWORDS}, ',')) > 0
          )`;

          filterFormula = filterFormula
            ? `AND(${filterFormula}, ${searchFilter})`
            : searchFilter;
        }

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
            setOffsetHistory(prev => [...prev, response.data.offset])
          }
        }

        const formattedPosts = response.data.records.map(record => ({
          id: record.id,
          date: record.fields.DATE ? (() => {
            const date = new Date(record.fields.DATE);
            const options = {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
              timeZone: 'UTC'
            }
            return date.toLocaleDateString('en-US', options);
          })() : 'No date',
          category: record.fields.CATEGORY || 'Uncategorized',
          title: record.fields.EVENT || 'Untitled Event',
          location: record.fields.LOCATION || 'Location unknown',
          image: record.fields.IMAGE?.[0]?.url || null,
          year: record.fields.DATE ? new Date(record.fields.DATE).getFullYear() : '',
          keywords: record.fields.KEYWORDS || [],
          notes: record.fields.NOTES || null
        }))

        setPosts(formattedPosts)

      } catch (error) {
        console.error("Error fetching records:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [currentOffsetIndex, sortOrder, filterKeywords, keywordMatchType, startDate, endDate, monthDay, searchQuery])

  // Handle filter changes - reset pagination when filters change
  const handleSortChange = (order) => {
    setSortOrder(order)
    resetPagination()
  }

  const handleKeywordFilter = (keyword) => {
    if (filterKeywords.includes(keyword)) {
      setFilterKeywords(filterKeywords.filter(k => k !== keyword))
    } else {
      setFilterKeywords([...filterKeywords, keyword])
    }
  }

  const handleDateRangeChange = (start, end) => {
    setStartDate(start)
    setEndDate(end)
    resetPagination()
  }

  const handleMonthDayChange = (value) => {
    setMonthDay(value)
    resetPagination()
  }

  {/* NEW */ }
  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      try {
        setLoading(true);
        setIsSearchMode(true);

        // Handle multiple search terms (same as search_results.jsx)
        const searchTerms = searchQuery.trim().toLowerCase().split(' ').filter(term => term.length > 0);

        // Create search conditions (same as search_results.jsx)
        const searchConditions = searchTerms.map(term =>
          `OR(
          SEARCH("${term}", LOWER({EVENT})),
          SEARCH("${term}", LOWER({NOTES})),
          SEARCH("${term}", LOWER(ARRAYJOIN({KEYWORDS}, ", ")))
        )`
        );

        // Combine conditions with AND (same as search_results.jsx)
        const filterFormula = searchConditions.length > 1
          ? `AND(${searchConditions.join(', ')})`
          : searchConditions[0];

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
        );

        // Format results to match posts structure
        const formattedResults = response.data.records.map(record => ({
          id: record.id,
          date: record.fields.DATE ? (() => {
            const date = new Date(record.fields.DATE);
            const options = {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
              timeZone: 'UTC'
            };
            return date.toLocaleDateString('en-US', options);
          })() : 'No date',
          category: record.fields.CATEGORY || 'Uncategorized',
          title: record.fields.EVENT || 'Untitled Event',
          location: record.fields.LOCATION || 'Location unknown',
          image: record.fields.IMAGE?.[0]?.url || null,
          year: record.fields.DATE ? new Date(record.fields.DATE).getFullYear() : '',
          keywords: record.fields.KEYWORDS || [],
          notes: record.fields.NOTES || null
        }));

        setSearchResults(formattedResults);
      } catch (error) {
        console.error("Error fetching search results:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    } else {
      setIsSearchMode(false);
      setSearchResults([]);
    }
  };

  // Add a function to clear search
  const clearSearch = () => {
    setIsSearchMode(false)
    setSearchResults([])
    setSearchQuery('')
    // navigate('/')
  }
  // const handleSearch = (e) => {
  //   e.preventDefault()
  //   if (searchQuery.trim()) {
  //     // Capitalize the first letter before navigating
  //     const capitalizedQuery = searchQuery.trim().charAt(0).toUpperCase() + searchQuery.trim().slice(1);
  //     navigate(`/?q=${encodeURIComponent(capitalizedQuery)}`)
  //   } else {
  //     navigate('/')
  //   }
  //   resetPagination()
  // }
  {/* NEW */ }

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e)
    }
  }

  // Reset pagination when filters change
  const resetPagination = () => {
    setPage(1)
    setCurrentOffsetIndex(0)
    setOffsetHistory([null])
  }

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentOffsetIndex > 0) {
      setCurrentOffsetIndex(prev => prev - 1)
      setPage(prev => prev - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentOffsetIndex(prev => prev + 1)
      setPage(prev => prev + 1)
      window.scrollTo(0, 0)
    }
  }

  // Fixed AdSense initialization
  useEffect(() => {
    // Initialize AdSense ad after component mounts (only in production)
    if (typeof window !== 'undefined' && window.adsbygoogle && process.env.NODE_ENV === 'production') {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }, []);

  return (
    <div className="bg-[#e6edf7] py-8 overflow-hidden">
      {/* Ad Placement - Fixed for mobile */}
      <div className="w-full max-w-4xl mx-auto px-4 mb-6">
        <div className="py-8 bg-[#fef2f2] rounded-lg text-center min-h-[100px] flex items-center justify-center">
          {process.env.NODE_ENV === 'production' ? (
            <ins
              className="adsbygoogle"
              style={{
                display: 'block',
                width: '100%',
                maxWidth: '728px',
                margin: '0 auto'
              }}
              data-ad-client="ca-pub-4534610257929133"
              data-ad-slot="3327797457"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          ) : (
            <div className="text-[#6b7280] text-sm">
              <AdComponent />
            </div>
          )}
        </div>
      </div>

      {/* Filters - Fixed for mobile */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="flex flex-wrap gap-2 py-4">
          {/* Sort By */}
          <div className="relative">
            <button
              className="flex items-center justify-between bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-4 py-1.5 text-sm min-w-[100px]"
              onClick={() => handleSortChange(sortOrder === "asc" ? "desc" : "asc")}
            >
              <span>Sort By {sortOrder === "asc" ? "Oldest" : "Newest"}</span>
              <span className="ml-2">▼</span>
            </button>
          </div>

          {/* Filter Keywords with Dropdown - Updated with search functionality */}
          <div className="relative">
            <button
              className="flex items-center justify-between bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-4 py-1.5 text-sm min-w-[150px]"
              onClick={() => setShowKeywordDropdown(!showKeywordDropdown)}
            >
              <span>{filterKeywords.length > 0 ? `${filterKeywords.length} selected` : "Filter Key words"}</span>
              <span className="ml-2">▼</span>
            </button>

            {showKeywordDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-[#6b7db3] rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
                <div className="p-2">
                  {/* Search input for keywords */}
                  <div className="relative mb-2">
                    <input
                      type="text"
                      placeholder="Search keywords..."
                      className="w-full bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-3 py-1.5 text-sm"
                      value={keywordSearchQuery}
                      onChange={(e) => setKeywordSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Has Any/All toggle - only show when keywords are selected */}
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
                              setKeywordMatchType(e.target.value);
                              resetPagination();
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
                              setKeywordMatchType(e.target.value);
                              resetPagination();
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

                  <div className="max-h-48 overflow-y-auto">
                    {getFilteredKeywords().map((keyword, index) => (
                      <div key={index} className="flex items-center px-3 py-2">
                        <input
                          type="checkbox"
                          id={`keyword-${index}`}
                          checked={filterKeywords.includes(keyword)}
                          onChange={() => handleKeywordFilter(keyword)}
                          className="mr-2"
                        />
                        <label htmlFor={`keyword-${index}`} className="text-sm cursor-pointer">
                          {keyword}
                        </label>
                      </div>
                    ))}
                    {getFilteredKeywords().length === 0 && keywordSearchQuery && (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No keywords found matching "{keywordSearchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Start Date - Input field */}
          <div className="relative">
            <input
              type="text"
              placeholder="Start Date (YYYY-MM-DD)"
              className="bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-4 py-1.5 text-sm min-w-[150px]"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                handleDateRangeChange(e.target.value, endDate)
              }}
            />
          </div>

          {/* End Date - Input field */}
          <div className="relative">
            <input
              type="text"
              placeholder="End Date (YYYY-MM-DD)"
              className="bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-4 py-1.5 text-sm min-w-[150px]"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                handleDateRangeChange(startDate, e.target.value)
              }}
            />
          </div>

          {/* Month/Day - Input field */}
          <div className="relative">
            <input
              type="text"
              placeholder="Month/Day (MM/DD)"
              className="bg-white text-[#6b7db3] border border-[#6b7db3] rounded-full px-4 py-1.5 text-sm min-w-[150px]"
              value={monthDay}
              onChange={(e) => {
                setMonthDay(e.target.value)
                handleMonthDayChange(e.target.value)
              }}
            />
          </div>

          {/* Search - Updated */}
          <div className="relative flex-grow min-w-[200px]">
            <form onSubmit={handleSearch} className="relative ml-2">
              <input
                type="text"
                placeholder="Search Any key words or title"
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

          {/* Clear filter button when tags are selected */}
          {filterKeywords.length > 0 && (
            <div className="relative">
              <button
                className="flex items-center justify-between bg-[#b91c1c] text-white rounded-full px-4 py-1.5 text-sm"
                onClick={() => {
                  setFilterKeywords([]);
                  resetPagination();
                }}
              >
                Clear {filterKeywords.length} Filter{filterKeywords.length !== 1 ? 's' : ''}
                <span className="ml-2">×</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selected keywords chips with match type indicator */}
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
                  setFilterKeywords(filterKeywords.filter(k => k !== keyword));
                  resetPagination();
                }}
              >
                {keyword}
                <span className="ml-1 text-xs">×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
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
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </p>
                <button
                  onClick={clearSearch}
                  className="bg-[#b91c1c] text-white rounded-full px-4 py-1.5 text-sm mb-6"
                >
                  Clear Search
                </button>
              </div>

              {/* Search results grid */}
              {searchResults.length === 0 ? (
                <div className="text-center py-12 text-[#b91c1c]">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
                  {searchResults.map((post) => (
                    <div
                      key={post.id}
                      className="bg-[#ffe8e8] rounded-xl overflow-hidden border border-[#ffcaca] flex flex-col hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full"
                      onClick={() => handleCardClick(post.id)}
                    >
                      <div className="relative pt-1 h-48 flex flex-col">
                        <div className="absolute -top-0.1 left-1/2 transform -translate-x-1/2 bg-white text-[#b91c1c] text-xs font-medium px-2 py-1 rounded-full z-10">
                          {post.date}
                        </div>

                        <div className="px-4 pt-6 pb-2 mt-2 mb-2">
                          <h3 className="text-[#b91c1c] font-medium text-sm text-center line-clamp-2">
                            {post.title}
                          </h3>
                        </div>

                        <div className="w-[90%] h-32 mx-auto rounded-[3%] flex items-center justify-center">
                          {post.image && (
                            <img
                              src={post.image}
                              alt={post.title}
                              className="w-full h-full object-cover object-[center_30%] rounded-[3%]"
                            />
                          )}
                        </div>
                      </div>

                      <div className="p-4 flex flex-col flex-grow">
                        {post.notes && (
                          <div className="text-[#6b7db3] text-xs mb-2 line-clamp-2 whitespace-pre-line">
                            {post.notes}
                          </div>
                        )}

                        <div className="mt-auto">
                          <div className="flex flex-wrap gap-2">
                            {post.keywords?.slice(0, 3).map((keyword, index) => (
                              <span
                                key={index}
                                className="bg-[#8a9ac7] text-white text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap cursor-pointer hover:bg-[#6b7db3] transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTagClick(keyword);
                                }}
                              >
                                {keyword}
                              </span>
                            ))}
                            {post.keywords?.length > 3 && (
                              <span className="bg-gray-300 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                +{post.keywords.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Original posts grid when not in search mode */
            posts.length === 0 ? (
              <div className="text-center py-12 text-[#b91c1c]">
                No posts found matching your criteria. Try different filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-[#ffe8e8] rounded-xl overflow-hidden border border-[#ffcaca] flex flex-col hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full"
                    onClick={() => handleCardClick(post.id)}
                  >
                    <div className="relative pt-1 h-48 flex flex-col">
                      <div className="absolute -top-0.1 left-1/2 transform -translate-x-1/2 bg-white text-[#b91c1c] text-xs font-medium px-2 py-1 rounded-full z-10">
                        {post.date}
                      </div>

                      <div className="px-4 pt-6 pb-2 mt-2 mb-2">
                        <h3 className="text-[#b91c1c] font-medium text-sm text-center line-clamp-2">
                          {post.title}
                        </h3>
                      </div>

                      <div className="w-[90%] h-32 mx-auto rounded-[3%] flex items-center justify-center">
                        {post.image && (
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover object-[center_30%] rounded-[3%]"
                          />
                        )}
                      </div>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTagClick(keyword);
                              }}
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="max-w-6xl mx-auto px-4 my-8 flex justify-center items-center gap-2">
        <span
          className={`text-sm ${page > 1 ? 'text-[#bb6d6d] cursor-pointer' : 'text-[#bb6d6d]/50'}`}
          onClick={page > 1 ? handlePreviousPage : undefined}
        >
          Previous Page
        </span>
        <button
          className={`w-8 h-8 flex items-center justify-center rounded-full border border-[#bb6d6d] ${page > 1 ? 'bg-[#e6edf7] text-[#bb6d6d]' : 'bg-[#e6edf7]/50 text-[#bb6d6d]/50'}`}
          onClick={page > 1 ? handlePreviousPage : undefined}
          disabled={page <= 1}
        >
          &lt;
        </button>
        <div className="mx-2 text-[#bb6d6d]">Page {page}</div>
        <button
          className={`w-8 h-8 flex items-center justify-center rounded-full border border-[#bb6d6d] ${hasMore ? 'bg-[#e6edf7] text-[#bb6d6d]' : 'bg-[#e6edf7]/50 text-[#bb6d6d]/50'}`}
          onClick={hasMore ? handleNextPage : undefined}
          disabled={!hasMore}
        >
          &gt;
        </button>
        <span
          className={`text-sm ${hasMore ? 'text-[#bb6d6d] cursor-pointer' : 'text-[#bb6d6d]/50'}`}
          onClick={hasMore ? handleNextPage : undefined}
        >
          Next Page
        </span>
      </div>

      {/* View On This Day Button */}
      <div className="max-w-6xl mx-auto px-4 mb-0">
        <button
          className="w-full bg-[#c25e5e] text-white py-3 rounded-full font-medium"
          onClick={() => {
            navigate("/timeline");
            window.scrollTo(0, 0);
          }}
        >
          View On This Day
        </button>
      </div>
      <br />
    </div>
  )
}