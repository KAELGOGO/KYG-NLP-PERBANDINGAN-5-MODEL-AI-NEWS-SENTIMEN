import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Activity,
  BarChart2,
  ChevronRight,
  ChevronDown,
  GitMerge,
  Database,
  Brain,
  Cpu,
  Layers,
  BookOpen,
  FastForward,
  Tag,
  Users,
} from "lucide-react";

const customStyles = `
  body, html { margin: 0; padding: 0; background-color: #ffffff !important; overflow-x: hidden; }
  .sleek-scrollbar::-webkit-scrollbar { width: 5px; }
  .sleek-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .sleek-scrollbar::-webkit-scrollbar-thumb { background: transparent; border-radius: 10px; }
  .sleek-scrollbar:hover::-webkit-scrollbar-thumb { background: #e5e7eb; }
`;

// --- ISOLATED TRADINGVIEW COMPONENT ---
const TradingViewWidget = ({ keyword }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: keyword === "IHSG" ? "IDX:COMPOSITE" : `IDX:${keyword}`,
      interval: "D",
      timezone: "Asia/Jakarta",
      theme: "light",
      style: "1",
      locale: "en",
      enable_publishing: false,
      backgroundColor: "#ffffff",
      gridColor: "#f9fafb",
      hide_top_toolbar: true,
      hide_legend: false,
      save_image: false,
      container_id: "tradingview_chart",
    });
    containerRef.current.appendChild(script);
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [keyword]);

  return (
    <div
      className="absolute inset-0 w-full h-full"
      ref={containerRef}
      id="tradingview_chart"
    />
  );
};

// --- ISOLATED ANIMATED HERO TEXT ---
// FIX: phraseIndex state lives here only, removed duplicate in App
const AnimatedHeroText = () => {
  const phrases = ["data-driven", "consensus-based", "real-time", "actionable"];
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [phrases.length]);

  return (
    <div className="relative inline-block h-[1.2em] w-full overflow-hidden text-gray-200">
      {phrases.map((phrase, index) => (
        <span
          key={phrase}
          className={`absolute top-0 left-0 w-full text-center whitespace-nowrap transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            index === phraseIndex
              ? "opacity-100 translate-y-0"
              : index < phraseIndex ||
                  (phraseIndex === 0 && index === phrases.length - 1)
                ? "opacity-0 -translate-y-full"
                : "opacity-0 translate-y-full"
          }`}
        >
          {phrase}
        </span>
      ))}
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState("landing");
  const [keyword, setKeyword] = useState("IHSG");
  const [searchInput, setSearchInput] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [news, setNews] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);

  // Benchmark State
  const [newsInput, setNewsInput] = useState("");
  const [benchmarkResults, setBenchmarkResults] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Layout State
  const [layoutMode, setLayoutMode] = useState("default");

  // ==========================================
  // API FETCH FUNCTIONS
  // ==========================================
  const fetchBackendData = async (query) => {
    try {
      const response = await fetch(
        "https://blaziooon-instock.hf.space/api/scan",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker: query }),
        },
      );
      const responseData = await response.json();
      if (responseData.status === "success") return responseData.data;
    } catch (error) {
      console.error("Error connecting to AI backend:", error);
    }
    return [
      {
        id: "error",
        title: "Failed to connect to AI server.",
        source: "System Alert",
        time: "N/A",
        url: "#",
        sentiment: "Neutral",
        score: 0.0,
      },
    ];
  };

  const updateDashboard = async (newKeyword) => {
    if (!newKeyword) return;
    setIsRefreshing(true);
    setVisibleCount(5);
    setKeyword(newKeyword.toUpperCase());
    const liveData = await fetchBackendData(newKeyword.toUpperCase());
    setNews(liveData);
    setLastUpdated(
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
    setIsRefreshing(false);
  };

  // FIX: Only one runBenchmark — removed the duplicate Indonesian version
  const runBenchmark = async (e) => {
    e.preventDefault();
    if (!newsInput.trim()) return;

    setIsEvaluating(true);
    setBenchmarkResults(null);

    try {
      const response = await fetch(
        "https://blaziooon-instock.hf.space/api/compare",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newsInput }),
        },
      );

      if (!response.ok) throw new Error("Failed to reach server");
      const data = await response.json();

      if (data.status === "success" && data.breakdown) {
        const formattedResults = [
          {
            id: "svm",
            name: "Model 1 (SVM)",
            data: data.breakdown["SVM"],
            latency: 45,
          },
          {
            id: "bilstm",
            name: "Model 2 (BiLSTM)",
            data: data.breakdown["BiLSTM"],
            latency: 120,
          },
          {
            id: "distilbert",
            name: "Model 3 (DistilBERT)",
            data: data.breakdown["DistilBERT"],
            latency: 250,
          },
          {
            id: "roberta",
            name: "Model 4 (RoBERTa)",
            data: data.breakdown["RoBERTa"],
            latency: 300,
          },
          {
            id: "ensemble",
            name: "Model 5 (Ensemble)",
            data: data.breakdown["Ensemble_Final"],
            latency: parseInt(parseFloat(data.latency.replace("s", "")) * 1000),
          },
        ].map((item) => ({
          ...item,
          sentiment: item.data.sentiment,
          confidence: parseFloat(item.data.confidence.toFixed(4)),
        }));
        setBenchmarkResults(formattedResults);
      }
    } catch (error) {
      console.warn("Connection failed:", error);
      alert("Failed to process text. Please ensure the AI server is running.");
    }
    setIsEvaluating(false);
  };

  useEffect(() => {
    updateDashboard("IHSG");
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) updateDashboard(searchInput);
  };

  // ==========================================
  // HELPERS
  // ==========================================
  const getSentimentConfig = (sentiment) => {
    switch (sentiment) {
      case "Positive":
        return {
          text: "text-emerald-700",
          bg: "bg-emerald-50/50",
          border: "border-emerald-100",
          bar: "bg-emerald-500",
          icon: <TrendingUp size={14} />,
        };
      case "Negative":
        return {
          text: "text-rose-700",
          bg: "bg-rose-50/50",
          border: "border-rose-100",
          bar: "bg-rose-500",
          icon: <TrendingDown size={14} />,
        };
      default:
        return {
          text: "text-gray-500",
          bg: "bg-gray-50",
          border: "border-gray-200",
          bar: "bg-gray-300",
          icon: <Minus size={14} />,
        };
    }
  };

  const getSidebarWidthClass = () => {
    switch (layoutMode) {
      case "compact":
        return "w-full lg:w-[320px] xl:w-[380px] 2xl:w-[450px]";
      case "wide":
        return "w-full lg:w-[500px] xl:w-[650px] 2xl:w-[800px]";
      default:
        return "w-full lg:w-[400px] xl:w-[480px] 2xl:w-[550px]";
    }
  };

  // ==========================================
  // VIEWS
  // ==========================================
  const renderLanding = () => (
    <div className="flex flex-col min-h-[85vh] justify-center items-center text-center px-4 md:px-12 animate-in fade-in duration-1000 relative z-10">
      <div className="max-w-5xl pt-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] font-semibold tracking-tight mb-8 leading-tight text-gray-900 flex flex-col items-center justify-center gap-2">
          <span>The platform for</span>
          <AnimatedHeroText />
          <span>sentiment.</span>
        </h1>
        <p className="text-gray-500 max-w-3xl mx-auto text-base sm:text-lg md:text-xl mb-12 leading-relaxed font-light tracking-wide px-4">
          Your toolkit to stop guessing and start analyzing. Extract, aggregate,
          and quantify actionable economic signals from Indonesian financial
          news in milliseconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button
            onClick={() => setCurrentView("app")}
            className="w-full sm:w-auto bg-black text-white px-8 py-3.5 rounded-full font-medium hover:bg-orange-500 transition-all duration-300 flex items-center justify-center gap-2"
          >
            Start Analyzing <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setCurrentView("science")}
            className="w-full sm:w-auto bg-white text-gray-900 border border-gray-200 px-8 py-3.5 rounded-full font-medium hover:bg-gray-50 transition-all duration-300"
          >
            Read the docs
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 max-w-6xl w-full mx-auto mt-20 md:mt-28 pt-12 border-t border-gray-100">
        <div className="flex flex-col items-center text-center">
          <span className="text-3xl md:text-5xl font-semibold text-gray-900 mb-2">
            98%
          </span>
          <span className="text-[10px] sm:text-xs text-gray-400 tracking-widest uppercase">
            Log-Loss efficiency
          </span>
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-3xl md:text-5xl font-semibold text-gray-900 mb-2">
            5x
          </span>
          <span className="text-[10px] sm:text-xs text-gray-400 tracking-widest uppercase">
            Parallel AI Models
          </span>
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-3xl md:text-5xl font-semibold text-gray-900 mb-2">
            &lt;1.5s
          </span>
          <span className="text-[10px] sm:text-xs text-gray-400 tracking-widest uppercase">
            Execution latency
          </span>
        </div>
      </div>
    </div>
  );

  const renderApp = () => (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-700 w-full lg:h-[calc(100vh-8rem)] relative z-10 transition-all duration-500 ease-in-out">
      {/* LEFT COLUMN: CHART & SEARCH */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 transition-all duration-500 ease-in-out h-[500px] lg:h-full">
        <div className="bg-white border border-gray-200 rounded-2xl p-2.5 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Search ticker (e.g. GOTO, BBCA)"
              className="w-full bg-transparent text-gray-900 px-4 py-2 pl-12 focus:outline-none uppercase font-medium placeholder:text-gray-400 placeholder:normal-case"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Search
              className="absolute left-4 top-2.5 text-gray-400"
              size={18}
            />
            <button type="submit" className="sr-only">
              Search
            </button>
          </form>
          <button
            onClick={() => updateDashboard(searchInput || keyword)}
            className="w-full sm:w-auto bg-black text-white px-8 py-2.5 rounded-xl font-medium hover:bg-orange-500 transition-colors whitespace-nowrap"
          >
            Scan Ticker
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl flex flex-col flex-1 shadow-sm overflow-hidden h-full">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-3">
              <BarChart2 size={18} className="text-orange-500" /> Terminal:{" "}
              <span className="text-black font-bold uppercase">{keyword}</span>
            </h2>
          </div>
          <div className="flex-1 w-full relative bg-white min-h-[350px]">
            <TradingViewWidget keyword={keyword} />
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: BENCHMARK TOOL & NEWS FEED */}
      <div
        className={`${getSidebarWidthClass()} flex flex-col h-[700px] lg:h-full transition-all duration-500 ease-in-out`}
      >
        <div className="bg-white border border-gray-200 rounded-2xl flex flex-col h-full shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Activity size={18} className="text-orange-500" /> NLP
                Multi-Model Radar
              </h2>
              {(isRefreshing || isEvaluating) && (
                <Clock
                  size={14}
                  className="text-orange-500 animate-spin ml-2"
                />
              )}
            </div>
            <div className="hidden lg:flex items-center bg-gray-200/60 p-1 rounded-lg">
              <button
                onClick={() => setLayoutMode("compact")}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wider transition-all ${layoutMode === "compact" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"}`}
              >
                Chart
              </button>
              <button
                onClick={() => setLayoutMode("default")}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wider transition-all ${layoutMode === "default" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"}`}
              >
                Split
              </button>
              <button
                onClick={() => setLayoutMode("wide")}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wider transition-all ${layoutMode === "wide" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"}`}
              >
                News
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 sleek-scrollbar bg-gray-50/30">
            {/* BENCHMARK TOOL — collapses when results are shown */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Database size={14} className="text-orange-500" /> Manual
                  5-Model Benchmark
                </h3>
                {benchmarkResults && (
                  <button
                    onClick={() => setBenchmarkResults(null)}
                    className="text-[10px] font-bold text-orange-500 hover:text-orange-700 uppercase tracking-wider transition-colors"
                  >
                    ← New Test
                  </button>
                )}
              </div>

              {!benchmarkResults ? (
                <form onSubmit={runBenchmark} className="flex flex-col gap-3">
                  <textarea
                    placeholder="Enter a financial news headline to test across all 5 NLP architectures at once..."
                    className="w-full h-20 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none font-medium leading-relaxed"
                    value={newsInput}
                    onChange={(e) => setNewsInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isEvaluating || !newsInput.trim()}
                    className="w-full bg-black text-white py-2 rounded-xl text-sm font-medium hover:bg-orange-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {isEvaluating ? "Running Tensors..." : "Run Benchmark"}
                  </button>
                </form>
              ) : (
                <div className="animate-in slide-in-from-top-4 duration-500">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">
                    Model Comparison Results
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {benchmarkResults.map((res, index) => {
                      const conf = getSentimentConfig(res.sentiment);
                      return (
                        <div
                          key={res.id || index}
                          className={`bg-white border rounded-xl p-3 shadow-sm border-gray-100 ${res.id === "ensemble" ? "ring-1 ring-orange-400 sm:col-span-2" : ""}`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h4
                              className={`font-bold text-xs ${res.id === "ensemble" ? "text-orange-600" : "text-gray-800"}`}
                            >
                              {res.name}
                            </h4>
                            <span
                              className={`flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${conf.bg} ${conf.text} ${conf.border}`}
                            >
                              {conf.icon} {res.sentiment}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-gray-400 font-medium">
                                Confidence
                              </span>
                              <span className={`font-bold ${conf.text}`}>
                                {(res.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${conf.bar} transition-all duration-1000 ease-out`}
                                style={{ width: `${res.confidence * 100}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center pt-1.5 border-t border-gray-50 text-[9px]">
                              <span className="text-gray-400 uppercase tracking-wider font-medium">
                                Latency
                              </span>
                              {/* FIX: was res.inferenceTime — now correctly res.latency */}
                              <span className="font-mono text-gray-600 bg-gray-50 px-1 py-0.5 rounded border border-gray-100">
                                {res.latency} ms
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-200 pt-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Clock size={14} className="text-orange-500" /> Latest Market
                News
              </h3>

              {isRefreshing ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4 text-gray-400">
                  <Activity
                    size={28}
                    className="animate-pulse text-orange-500"
                  />
                  <p className="text-sm font-medium animate-pulse">
                    Scoring live data...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {news.length === 0 ? (
                    <div className="text-center text-sm text-gray-400 py-6 bg-white rounded-xl border border-gray-100">
                      No news articles fetched yet.
                    </div>
                  ) : (
                    <>
                      {news.slice(0, visibleCount).map((item) => {
                        const conf = getSentimentConfig(item.sentiment);
                        return (
                          <a
                            key={item.id}
                            href={item.url !== "#" ? item.url : undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-orange-200 hover:shadow-md transition-all duration-300 cursor-pointer group"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-900">
                                  {item.source}
                                </span>
                                <span className="text-[10px] text-gray-400 mt-0.5">
                                  {item.time}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1.5 items-end">
                                <span
                                  className={`flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${conf.border} ${conf.text} ${conf.bg}`}
                                >
                                  {conf.icon} {item.sentiment}
                                </span>
                                <span className="flex items-center gap-1 text-[9px] font-medium text-gray-500 border border-gray-100 px-1.5 py-0.5 rounded bg-gray-50">
                                  <Tag size={9} /> {item.sector || "General"}
                                </span>
                              </div>
                            </div>
                            <h4 className="text-[13px] font-medium leading-relaxed mb-3 text-gray-800 group-hover:text-orange-600 transition-colors">
                              {item.title}
                            </h4>
                            <div className="flex items-center justify-between mt-auto">
                              <div className="flex items-center gap-3 w-2/3">
                                <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">
                                  Conf
                                </span>
                                <div className="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${conf.bar} transition-all duration-1000 ease-out`}
                                    style={{ width: `${item.score * 100}%` }}
                                  />
                                </div>
                                <span
                                  className={`text-[10px] font-semibold ${conf.text}`}
                                >
                                  {(item.score * 100).toFixed(0)}%
                                </span>
                              </div>
                              <ExternalLink
                                size={14}
                                className="text-gray-300 group-hover:text-orange-500 transition-colors"
                              />
                            </div>
                          </a>
                        );
                      })}
                      {news.length > visibleCount && (
                        <button
                          onClick={() => setVisibleCount((prev) => prev + 5)}
                          className="w-full py-2.5 mt-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50/50 transition-all flex items-center justify-center gap-2"
                        >
                          Load More <ChevronDown size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScience = () => (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-700 px-4 py-12 relative z-10">
      <div className="mb-16 text-center">
        <span className="text-orange-500 font-bold tracking-widest text-xs uppercase mb-3 block">
          Under the Hood
        </span>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-4">
          The NLP Pipeline
        </h1>
        <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto">
          A transparent look at how raw financial news is transformed into
          actionable market sentiment in under 2 seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16 relative">
        <div className="hidden lg:block absolute top-[52px] left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-transparent via-gray-200 to-transparent -z-10"></div>
        {[
          {
            icon: <Database size={28} />,
            num: "01",
            title: "Live Ingestion",
            desc: "Raw text is fetched in real-time, processed through strict Regex cleaning, tokenization, and vector extraction (Sparse Arrays & Embeddings) before hitting the tensors.",
          },
          {
            icon: <Brain size={28} />,
            num: "02",
            title: "Parallel Inference",
            desc: "The clean payload is instantly routed across 5 isolated AI architectures simultaneously. No sequential bottlenecks, ensuring sub-second evaluation.",
          },
          {
            icon: <GitMerge size={28} />,
            num: "03",
            title: "Soft-Voting Consensus",
            desc: "Instead of relying on a single model's bias, we mathematically average the continuous probability distributions of all 5 models to crown the final sentiment.",
          },
        ].map((step) => (
          <div
            key={step.num}
            className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-md hover:border-orange-200 transition-all relative group overflow-hidden"
          >
            <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mb-6 text-gray-400 group-hover:text-orange-500 group-hover:bg-orange-50 transition-colors">
              {step.icon}
            </div>
            <div className="absolute top-6 right-6 text-7xl font-extrabold text-gray-50 opacity-60 select-none pointer-events-none group-hover:-translate-y-2 transition-transform duration-500">
              {step.num}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {step.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed font-light">
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-gray-100 gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              The Ensemble Matrix
            </h2>
            <p className="text-sm text-gray-500 font-light">
              The five independent architectures powering the consensus engine.
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 self-start md:self-auto">
            <Cpu size={14} /> From SVM to Transformers
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: "SVM",
              desc: "Statistical Baseline",
              icon: <Cpu size={18} />,
              type: "Machine Learning",
              color:
                "text-blue-600 bg-blue-50 border-blue-100 group-hover:bg-blue-600 group-hover:text-white",
            },
            {
              title: "BiLSTM",
              desc: "Sequential Memory",
              icon: <GitMerge size={18} />,
              type: "Deep Learning",
              color:
                "text-purple-600 bg-purple-50 border-purple-100 group-hover:bg-purple-600 group-hover:text-white",
            },
            {
              title: "DistilBERT",
              desc: "High-Speed Transformer",
              icon: <FastForward size={18} />,
              type: "Transformer",
              color:
                "text-emerald-600 bg-emerald-50 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white",
            },
            {
              title: "RoBERTa",
              desc: "Optimized Context",
              icon: <Layers size={18} />,
              type: "Transformer",
              color:
                "text-rose-600 bg-rose-50 border-rose-100 group-hover:bg-rose-600 group-hover:text-white",
            },
            {
              title: "XLM-RoBERTa",
              desc: "Multilingual Powerhouse",
              icon: <Brain size={18} />,
              type: "Transformer",
              color:
                "text-indigo-600 bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white",
            },
            {
              title: "Final Output",
              desc: "Mathematical Consensus",
              icon: <BookOpen size={18} />,
              type: "Ensemble Hybrid",
              color:
                "text-orange-600 bg-orange-50 border-orange-200 group-hover:bg-orange-500 group-hover:text-white ring-1 ring-orange-100",
            },
          ].map((model, i) => (
            <div
              key={i}
              className="flex flex-col p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all group bg-gray-50/30"
            >
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 transition-colors duration-300 ${model.color}`}
              >
                {model.icon}
              </div>
              <h4 className="font-bold text-gray-900 mb-1">{model.title}</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                {model.desc}
              </p>
              <div className="mt-auto">
                <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                  {model.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-700 px-4 py-12 relative z-10">
      <div className="mb-20 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-4">
          The Team
        </h1>
        <p className="text-lg text-gray-500 font-light">
          Team KYGB &mdash; BINUS University NLP Research
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { name: "Nathanael Setiorahardjo", role: "Full-Stack Architecture" },
          { name: "Kelvin Leandi", role: "Machine Learning Engineer" },
          { name: "Gavinn Aloys", role: "Data Infrastructure" },
          { name: "Mohammad Faisal R.", role: "NLP Researcher" },
        ].map((member, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center text-center group cursor-pointer p-6 rounded-2xl border border-transparent hover:border-orange-100 hover:bg-orange-50/40 hover:shadow-sm transition-all duration-300"
          >
            <div className="w-24 h-24 rounded-full border border-gray-200 bg-white flex items-center justify-center mb-5 shadow-sm group-hover:border-orange-500 group-hover:scale-110 transition-all duration-300">
              <span className="text-3xl font-light text-gray-400 group-hover:text-orange-500 transition-colors">
                {member.name.charAt(0)}
              </span>
            </div>
            <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5">
              {member.name}
            </h3>
            <p className="text-[11px] text-gray-500 tracking-widest uppercase font-medium">
              {member.role}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="min-h-screen w-full bg-white text-gray-900 font-sans selection:bg-orange-500/20 relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-[0.4] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #f3f4f6 1px, transparent 1px), linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        ></div>

        <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-gray-100">
          <div className="w-full max-w-[1800px] mx-auto px-4 md:px-8 xl:px-12 h-20 flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => setCurrentView("landing")}
            >
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                <Activity className="text-white" size={16} strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-xl tracking-tight text-gray-900 ml-1">
                InStock
              </span>
            </div>
            <div className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-500">
              <button
                onClick={() => setCurrentView("app")}
                className={`transition-colors hover:text-gray-900 ${currentView === "app" ? "text-gray-900" : ""}`}
              >
                Terminal
              </button>
              <button
                onClick={() => setCurrentView("science")}
                className={`transition-colors hover:text-gray-900 ${currentView === "science" ? "text-gray-900" : ""}`}
              >
                Methodology
              </button>
              <button
                onClick={() => setCurrentView("team")}
                className={`transition-colors hover:text-gray-900 ${currentView === "team" ? "text-gray-900" : ""}`}
              >
                Team
              </button>
            </div>
            <div className="w-32 flex justify-end">
              {currentView === "app" && (
                <span className="text-[11px] font-medium text-gray-500 flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    {isRefreshing && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    )}
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  {lastUpdated}
                </span>
              )}
            </div>
          </div>
        </nav>

        <main className="w-full max-w-[1800px] mx-auto px-4 md:px-8 xl:px-12 pt-8 pb-24 md:pb-8 relative z-10">
          {currentView === "landing" && renderLanding()}
          {currentView === "app" && renderApp()}
          {currentView === "science" && renderScience()}
          {currentView === "team" && renderTeam()}
        </main>

        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200 z-50">
          <div className="flex items-center justify-around h-16 px-2">
            <button
              onClick={() => setCurrentView("app")}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${currentView === "app" ? "text-orange-500" : "text-gray-400 hover:text-gray-900"}`}
            >
              <BarChart2 size={20} />
              <span className="text-[10px] font-bold tracking-wide">
                Terminal
              </span>
            </button>
            <button
              onClick={() => setCurrentView("science")}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${currentView === "science" ? "text-orange-500" : "text-gray-400 hover:text-gray-900"}`}
            >
              <Database size={20} />
              <span className="text-[10px] font-bold tracking-wide">
                Methodology
              </span>
            </button>
            <button
              onClick={() => setCurrentView("team")}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${currentView === "team" ? "text-orange-500" : "text-gray-400 hover:text-gray-900"}`}
            >
              <Users size={20} />
              <span className="text-[10px] font-bold tracking-wide">Team</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
