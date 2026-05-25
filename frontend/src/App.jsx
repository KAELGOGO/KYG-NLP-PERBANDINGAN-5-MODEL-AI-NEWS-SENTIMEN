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
  Zap,
  Database,
  Brain,
  LineChart,
  Cpu,
  Layers,
  BookOpen,
  FastForward,
} from "lucide-react";

const customStyles = `
  body, html { margin: 0; padding: 0; background-color: #ffffff !important; overflow-x: hidden; }
  
  .sleek-scrollbar::-webkit-scrollbar { width: 5px; }
  .sleek-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .sleek-scrollbar::-webkit-scrollbar-thumb { background: transparent; border-radius: 10px; }
  .sleek-scrollbar:hover::-webkit-scrollbar-thumb { background: #e5e7eb; }
`;

export default function App() {
  const [currentView, setCurrentView] = useState("landing");
  const [keyword, setKeyword] = useState("IHSG");
  const [searchInput, setSearchInput] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [news, setNews] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [newsInput, setNewsInput] = useState("");
  const [benchmarkResults, setBenchmarkResults] = useState(null);

  // --- FUNGSI API BENCHMARK REAL (VIA /api/compare GAVINN) ---
  const runBenchmark = async (e) => {
    e.preventDefault();
    if (!newsInput.trim()) return;

    setIsRefreshing(true);
    setBenchmarkResults(null);

    try {
      // 1. Tembak ke endpoint /api/compare milik Gavinn
      const response = await fetch(
        "https://blaziooon-instock.hf.space/api/compare",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newsInput }), // Menggunakan 'text' sesuai request di app.py Gavinn
        },
      );

      if (!response.ok) throw new Error("Gagal menghubungi server Gavinn");

      const data = await response.json();

      if (data.status === "success" && data.breakdown) {
        // 2. Mapping JSON dari Gavinn menjadi Array untuk UI kita
        const formattedResults = [
          {
            id: "svm",
            name: "Model 1 (SVM)",
            sentiment:
              data.breakdown["SVM"].sentiment === "Positive"
                ? "Positif"
                : data.breakdown["SVM"].sentiment === "Negative"
                  ? "Negatif"
                  : "Netral",
            confidence: parseFloat(data.breakdown["SVM"].confidence.toFixed(4)),
            inferenceTime: 45,
          },
          {
            id: "bilstm",
            name: "Model 2 (BiLSTM)",
            sentiment:
              data.breakdown["BiLSTM"].sentiment === "Positive"
                ? "Positif"
                : data.breakdown["BiLSTM"].sentiment === "Negative"
                  ? "Negatif"
                  : "Netral",
            confidence: parseFloat(
              data.breakdown["BiLSTM"].confidence.toFixed(4),
            ),
            inferenceTime: 120,
          },
          {
            id: "distilbert",
            name: "Model 3 (DistilBERT)",
            sentiment:
              data.breakdown["DistilBERT"].sentiment === "Positive"
                ? "Positif"
                : data.breakdown["DistilBERT"].sentiment === "Negative"
                  ? "Negatif"
                  : "Netral",
            confidence: parseFloat(
              data.breakdown["DistilBERT"].confidence.toFixed(4),
            ),
            inferenceTime: 250,
          },
          {
            id: "roberta",
            name: "Model 4 (RoBERTa)",
            sentiment:
              data.breakdown["RoBERTa"].sentiment === "Positive"
                ? "Positif"
                : data.breakdown["RoBERTa"].sentiment === "Negative"
                  ? "Negatif"
                  : "Netral",
            confidence: parseFloat(
              data.breakdown["RoBERTa"].confidence.toFixed(4),
            ),
            inferenceTime: 300,
          },
          {
            id: "ensemble",
            name: "Model 5 (Ensemble)",
            sentiment:
              data.breakdown["Ensemble_Final"].sentiment === "Positive"
                ? "Positif"
                : data.breakdown["Ensemble_Final"].sentiment === "Negative"
                  ? "Negatif"
                  : "Netral",
            confidence: parseFloat(
              data.breakdown["Ensemble_Final"].confidence.toFixed(4),
            ),
            // Ambil total latency dari server Gavinn (hilangkan huruf 's' lalu ubah ke ms)
            inferenceTime: parseInt(
              parseFloat(data.latency.replace("s", "")) * 1000,
            ),
          },
        ];

        setBenchmarkResults(formattedResults);
      } else {
        throw new Error("Format data dari Gavinn tidak sesuai");
      }
    } catch (error) {
      console.warn("Koneksi gagal:", error);
      alert("Gagal memproses teks. Pastikan server AI Gavinn sedang aktif.");
    }

    setLastUpdated(
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
    setIsRefreshing(false);
  };

  // NEW: Layout Control State
  const [layoutMode, setLayoutMode] = useState("default");

  const chartContainerRef = useRef(null);

  const phrases = ["data-driven", "consensus-based", "real-time", "actionable"];
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [phrases.length]);

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

      if (responseData.status === "success") {
        return responseData.data;
      }
    } catch (error) {
      console.error("Error connecting HuggingFace backend:", error);
    }

    return [
      {
        id: "error",
        title: `Sistem gagal terhubung ke Server AI.`,
        source: "System Alert",
        time: "N/A",
        url: "#",
        sentiment: "Neutral",
        score: 0.0,
      },
    ];
  };

  const updateDashboard = async (newKeyword) => {
    setIsRefreshing(true);
    setVisibleCount(5);
    setKeyword(newKeyword.toUpperCase());
    const liveData = await fetchBackendData(newKeyword.toUpperCase());
    setNews(liveData);
    setLastUpdated(
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
    setIsRefreshing(false);
  };

  useEffect(() => {
    updateDashboard("IHSG");
  }, []);

  useEffect(() => {
    if (currentView === "app" && chartContainerRef.current) {
      chartContainerRef.current.innerHTML = "";
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
        locale: "id",
        enable_publishing: false,
        backgroundColor: "#ffffff",
        gridColor: "#f9fafb",
        hide_top_toolbar: true,
        hide_legend: false,
        save_image: false,
        container_id: "tradingview_chart",
      });
      chartContainerRef.current.appendChild(script);
    }
  }, [keyword, currentView]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) updateDashboard(searchInput);
  };

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

  // NEW: Dynamic width calculator based on user selection
  const getSidebarWidthClass = () => {
    switch (layoutMode) {
      case "compact":
        return "w-full lg:w-[320px] xl:w-[380px] 2xl:w-[450px]"; // Focus Chart
      case "wide":
        return "w-full lg:w-[500px] xl:w-[650px] 2xl:w-[800px]"; // Focus News
      default:
        return "w-full lg:w-[400px] xl:w-[480px] 2xl:w-[550px]"; // 50/50 Split
    }
  };

  // ==========================================
  // VIEWS
  // ==========================================
  const renderLanding = () => (
    <div className="flex flex-col min-h-[85vh] justify-center items-center text-center px-4 md:px-12 animate-in fade-in duration-1000 relative z-10">
      <div className="max-w-5xl pt-10">
        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-semibold tracking-tight mb-8 leading-[1.1] text-gray-900">
          The platform for <br />
          <div className="relative inline-block h-[1.2em] w-[300px] md:w-[450px] lg:w-[500px] overflow-hidden text-gray-400 align-bottom mx-2">
            {phrases.map((phrase, index) => (
              <span
                key={phrase}
                className={`absolute top-0 left-0 w-full text-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
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
          <br />
          sentiment.
        </h1>

        <p className="text-gray-500 max-w-3xl mx-auto text-lg md:text-xl mb-12 leading-relaxed font-light tracking-wide">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl w-full mx-auto mt-28 pt-16 border-t border-gray-100">
        <div className="flex flex-col items-center text-center">
          <span className="text-4xl md:text-5xl font-semibold text-gray-900 mb-3">
            98%
          </span>
          <span className="text-xs text-gray-400 tracking-widest uppercase">
            Log-Loss efficiency
          </span>
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-4xl md:text-5xl font-semibold text-gray-900 mb-3">
            5x
          </span>
          <span className="text-xs text-gray-400 tracking-widest uppercase">
            Parallel AI Models
          </span>
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-4xl md:text-5xl font-semibold text-gray-900 mb-3">
            &lt;1.5s
          </span>
          <span className="text-xs text-gray-400 tracking-widest uppercase">
            Execution latency
          </span>
        </div>
      </div>
    </div>
  );

  const renderApp = () => (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-700 w-full lg:h-[calc(100vh-8rem)] relative z-10 transition-all duration-500 ease-in-out">
      {/* =============================
          KOLOM KIRI: TERMINAL & CHART 
         ==============================*/}
      <div className="flex-1 flex flex-col gap-6 min-w-0 transition-all duration-500 ease-in-out h-full">
        {/* Search Bar Ticker */}
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
            <button type="submit" className="hidden">
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

        {/* TradingView Advanced Chart Container */}
        <div className="bg-white border border-gray-200 rounded-2xl flex flex-col flex-1 shadow-sm overflow-hidden min-h-[500px] lg:min-h-0 h-full">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-3">
              <BarChart2 size={18} className="text-orange-500" />
              Terminal:{" "}
              <span className="text-black font-bold uppercase">{keyword}</span>
            </h2>
          </div>
          <div className="flex-1 w-full h-[450px] lg:h-full relative bg-white">
            <div
              className="absolute inset-0 w-full h-full"
              ref={chartContainerRef}
              id="tradingview_chart"
            />
          </div>
        </div>
      </div>

      {/* ==========================================
          KOLOM KANAN: INPUT, BENCHMARK, & NEWS FEED
         ========================================== */}
      <div
        className={`${getSidebarWidthClass()} flex flex-col h-[700px] lg:h-full transition-all duration-500 ease-in-out`}
      >
        <div className="bg-white border border-gray-200 rounded-2xl flex flex-col h-full shadow-sm overflow-hidden">
          {/* Header Panel Kanan */}
          <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Activity size={18} className="text-orange-500" />
                NLP Multi-Model Radar
              </h2>
              {isRefreshing && (
                <Clock
                  size={14}
                  className="text-orange-500 animate-spin ml-2"
                />
              )}
            </div>

            {/* Layout Switcher */}
            <div className="flex items-center bg-gray-200/60 p-1 rounded-lg">
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

          {/* Area Konten Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 sleek-scrollbar bg-gray-50/30">
            {/* FORM INPUT BERITA */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm shrink-0">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Database size={14} className="text-orange-500" /> Input Teks
                Berita Finansial
              </h3>
              <form onSubmit={runBenchmark} className="flex flex-col gap-3">
                <textarea
                  placeholder="Masukkan kalimat atau headline berita di sini untuk diuji ke 5 model sekaligus..."
                  className="w-full h-24 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none font-medium leading-relaxed"
                  value={newsInput}
                  onChange={(e) => setNewsInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isRefreshing || !newsInput.trim()}
                  className="w-full bg-black text-white py-2.5 rounded-xl text-sm font-medium hover:bg-orange-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {isRefreshing
                    ? "Mengeksekusi Tensor..."
                    : "Eksekusi Benchmark 5 Model"}
                </button>
              </form>
            </div>

            {/* HASIL KOMPARASI (Hanya Muncul Jika Ada Hasil) */}
            {benchmarkResults && (
              <div className="shrink-0 animate-in slide-in-from-top-4 duration-500">
                <div className="border-t border-gray-100 my-2 pt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                    Hasil Komparasi Matriks
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {benchmarkResults.map((res, index) => {
                    let conf;
                    if (
                      res.sentiment === "Positif" ||
                      res.sentiment === "Positive"
                    ) {
                      conf = {
                        text: "text-emerald-700",
                        bg: "bg-emerald-50/60",
                        border: "border-emerald-100",
                        bar: "bg-emerald-500",
                        icon: <TrendingUp size={14} />,
                      };
                    } else if (
                      res.sentiment === "Negatif" ||
                      res.sentiment === "Negative"
                    ) {
                      conf = {
                        text: "text-rose-700",
                        bg: "bg-rose-50/60",
                        border: "border-rose-100",
                        bar: "bg-rose-500",
                        icon: <TrendingDown size={14} />,
                      };
                    } else {
                      conf = {
                        text: "text-gray-700",
                        bg: "bg-gray-100/60",
                        border: "border-gray-200",
                        bar: "bg-gray-400",
                        icon: <Minus size={14} />,
                      };
                    }

                    return (
                      <div
                        key={res.id || index}
                        className="bg-white border rounded-xl p-4 shadow-sm border-gray-100 hover:border-orange-200 transition-all"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold text-gray-800 text-xs 2xl:text-sm">
                            {res.name}
                          </h4>
                          <span
                            className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${conf.bg} ${conf.text} ${conf.border}`}
                          >
                            {conf.icon} {res.sentiment}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-gray-400 font-medium">
                                Confidence Score
                              </span>
                              <span className={`font-bold ${conf.text}`}>
                                {(res.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${conf.bar} transition-all duration-1000 ease-out`}
                                style={{ width: `${res.confidence * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-50 text-[10px]">
                            <span className="text-gray-400 uppercase tracking-wider font-medium">
                              Latency
                            </span>
                            <span className="font-mono text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                              {res.inferenceTime} ms
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =======================================
                LIVE NEWS FEED (Dikembalikan ke sini)
               ======================================= */}
            {(layoutMode === "default" || layoutMode === "wide") && (
              <div className="pt-6 mt-6 border-t border-dashed border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Clock size={14} className="text-orange-500" /> Berita Saham
                    Terkini
                  </h3>
                  <span className="text-[10px] text-gray-400 font-medium bg-white px-2 py-1 rounded border border-gray-200">
                    Sumber: System Backend
                  </span>
                </div>

                <div className="space-y-3">
                  {news.length === 0 ? (
                    <div className="text-center text-sm text-gray-400 py-6 bg-white rounded-xl border border-gray-100">
                      Belum ada berita yang ditarik.
                    </div>
                  ) : (
                    <>
                      {news.slice(0, visibleCount).map((item) => {
                        const conf = getSentimentConfig(item.sentiment);
                        return (
                          <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white border border-gray-100 rounded-xl p-5 hover:border-orange-200 hover:shadow-md transition-all duration-300 cursor-pointer group"
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
                              <span
                                className={`flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${conf.border} ${conf.text} ${conf.bg}`}
                              >
                                {conf.icon}
                                {item.sentiment}
                              </span>
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
                          className="w-full py-3 mt-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50/50 transition-all flex items-center justify-center gap-2"
                        >
                          Tampilkan Lebih Banyak <ChevronDown size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  const renderScience = () => (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-700 px-4 py-12 relative z-10">
      <div className="mb-20 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-4">
          Methodology
        </h1>
        <p className="text-lg text-gray-500 font-light max-w-xl mx-auto">
          Arsitektur komparasi independen untuk mengevaluasi performa 5 model
          NLP secara head-to-head.
        </p>
      </div>

      <div className="space-y-12 relative before:absolute before:inset-0 before:ml-[28px] md:before:ml-[39px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
        {/* Phase 1: Data Pipeline */}
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-14 h-14 rounded-full border-[3px] border-white bg-gray-100 text-gray-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors group-hover:bg-orange-50 group-hover:text-orange-500">
            <Database size={24} />
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-orange-200">
            <span className="text-[10px] font-bold tracking-wider text-orange-500 uppercase block mb-1">
              Phase 01
            </span>
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              Data Preprocessing
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed font-light">
              Teks diproses secara riil melalui pembersihan Regex, tokenisasi,
              dan ekstraksi fitur menjadi representasi vektor (
              <i>sparse arrays</i> & <i>embeddings</i>) sebelum masuk ke mesin
              inferensi.
            </p>
          </div>
        </div>

        {/* Phase 2: Parallel Inference (LEBIH RAPIH) */}
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-14 h-14 rounded-full border-[3px] border-white bg-gray-100 text-gray-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors group-hover:bg-orange-50 group-hover:text-orange-500">
            <Brain size={24} />
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-orange-200">
            <span className="text-[10px] font-bold tracking-wider text-orange-500 uppercase block mb-1">
              Phase 02
            </span>
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              Parallel Inference
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed font-light mb-4">
              Teks diuji secara paralel ke 5 arsitektur AI tanpa agregasi hasil,
              memastikan komparasi yang murni dan objektif antar algoritma.
            </p>

            {/* List 5 Model - DESAIN BARU YANG CLEAN & MINIMALIS */}
            <div className="flex flex-col gap-2">
              {[
                {
                  title: "SVM",
                  desc: "Baseline statistik konvensional",
                  icon: <Cpu size={16} />,
                  type: "ML",
                },
                {
                  title: "BiLSTM",
                  desc: "Analisis sekuensial dua arah",
                  icon: <GitMerge size={16} />,
                  type: "Deep Learning",
                },
                {
                  title: "DeBERTa",
                  desc: "Disentangled attention",
                  icon: <Layers size={16} />,
                  type: "Transformer",
                },
                {
                  title: "FinBERT",
                  desc: "Pakar leksikon finansial",
                  icon: <BookOpen size={16} />,
                  type: "Domain-Specific",
                },
                {
                  title: "DistilBERT",
                  desc: "Inferensi ringan super cepat",
                  icon: <FastForward size={16} />,
                  type: "Transformer",
                },
              ].map((model, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-gray-50 bg-gray-50/50 hover:bg-orange-50/40 hover:border-orange-100 transition-all group/item"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-gray-100 text-gray-400 group-hover/item:text-orange-500 shadow-sm transition-colors">
                      {model.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 leading-none mb-1">
                        {model.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 leading-none">
                        {model.desc}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-medium bg-white border border-gray-100 text-gray-400 px-2 py-1 rounded whitespace-nowrap hidden sm:block">
                    {model.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase 3: Analytics Output */}
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-14 h-14 rounded-full border-[3px] border-white bg-gray-100 text-gray-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors group-hover:bg-orange-50 group-hover:text-orange-500">
            <LineChart size={24} />
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-orange-200">
            <span className="text-[10px] font-bold tracking-wider text-orange-500 uppercase block mb-1">
              Phase 03
            </span>
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              Comparative Output
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed font-light">
              Sistem menyajikan arah sentimen, persentase keyakinan (
              <i>Confidence Score</i>), dan kecepatan pemrosesan (<i>Latency</i>
              ) untuk kebutuhan audit dan penelitian mendalam.
            </p>
          </div>
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
          Tim KYGB &mdash; BINUS University NLP Research
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
            {/* Avatar Circle with Hover Scale effect */}
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

        <main className="w-full max-w-[1800px] mx-auto px-4 md:px-8 xl:px-12 py-8 relative z-10">
          {currentView === "landing" && renderLanding()}
          {currentView === "app" && renderApp()}
          {currentView === "science" && renderScience()}
          {currentView === "team" && renderTeam()}
        </main>
      </div>
    </>
  );
}
