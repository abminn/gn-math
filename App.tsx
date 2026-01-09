
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Settings, ExternalLink, Maximize, Download, X, Sun, Moon, Phone, ShieldCheck, Database, FileUp, FileDown, Clock } from 'lucide-react';
import { Zone, PopularityStats } from './types';

const ZONES_URL = "https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json";
const COVER_BASE = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const HTML_BASE = "https://cdn.jsdelivr.net/gh/gn-math/html@main";

const App: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [popularity, setPopularity] = useState<PopularityStats>({});
  const [filteredZones, setFilteredZones] = useState<Zone[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'popular'>('name');
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [zonesRes, popularityRes] = await Promise.all([
          fetch(`${ZONES_URL}?t=${Date.now()}`),
          fetch("https://data.jsdelivr.com/v1/stats/packages/gh/gn-math/html@main/files?period=year")
        ]);

        const zonesData: Zone[] = await zonesRes.json();
        const popData = await popularityRes.json();

        const stats: PopularityStats = {};
        popData.forEach((file: any) => {
          const idMatch = file.name.match(/\/(\d+)\.html$/);
          if (idMatch) {
            stats[parseInt(idMatch[1])] = file.hits.total;
          }
        });

        // Ensure first zone is featured as per original logic
        if (zonesData.length > 0) zonesData[0].featured = true;

        setZones(zonesData);
        setPopularity(stats);
        
        // Handle URL ID if present
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (id) {
          const zone = zonesData.find(z => String(z.id) === id);
          if (zone) setActiveZone(zone);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };

    fetchData();

    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filter and Sort Logic
  useEffect(() => {
    let result = zones.filter(z => z.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'id') return a.id - b.id;
      if (sortBy === 'popular') return (popularity[b.id] || 0) - (popularity[a.id] || 0);
      return 0;
    });

    // Always keep Discord (-1) first
    result.sort((a, b) => (a.id === -1 ? -1 : b.id === -1 ? 1 : 0));

    setFilteredZones(result);
  }, [zones, searchQuery, sortBy, popularity]);

  // Dark Mode Toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const resolveUrl = (template: string) => {
    return template.replace("{COVER_URL}", COVER_BASE).replace("{HTML_URL}", HTML_BASE);
  };

  const handleOpenZone = useCallback(async (zone: Zone) => {
    if (zone.url.startsWith("http")) {
      window.open(zone.url, "_blank");
      return;
    }

    setActiveZone(zone);
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('id', String(zone.id));
    window.history.pushState(null, '', `?${urlParams.toString()}`);
  }, []);

  const handleCloseZone = () => {
    setActiveZone(null);
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete('id');
    window.history.pushState(null, '', window.location.pathname);
  };

  const handleDownload = async () => {
    if (!activeZone) return;
    try {
      const url = resolveUrl(activeZone.url);
      const res = await fetch(`${url}?t=${Date.now()}`);
      const text = await res.text();
      const blob = new Blob([text], { type: "text/html" });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `${activeZone.name}.html`;
      a.click();
      URL.revokeObjectURL(dlUrl);
    } catch (err) {
      alert("Download failed");
    }
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      iframeRef.current.requestFullscreen?.() || 
      (iframeRef.current as any).webkitRequestFullscreen?.() ||
      (iframeRef.current as any).msRequestFullscreen?.();
    }
  };

  const handleTabCloak = () => {
    const title = prompt("Enter new tab title:");
    const icon = prompt("Enter new tab icon URL:");
    if (title) document.title = title;
    if (icon) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = icon;
    }
    setShowSettings(false);
  };

  const handleExport = () => {
    const data = JSON.stringify(localStorage);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gn-math-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        Object.keys(data).forEach(key => localStorage.setItem(key, data[key]));
        alert("Data imported successfully!");
      } catch (err) {
        alert("Invalid data file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="bg-primary text-white sticky top-0 z-50 shadow-lg px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black tracking-tighter">GN-MATH</h1>
            <div className="hidden md:flex items-center gap-2 text-xs opacity-80">
              <Clock size={14} />
              <span>{currentTime}</span>
            </div>
          </div>

          <div className="flex flex-1 w-full md:max-w-xl gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search zones..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:bg-white/20 placeholder-white/60 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-white focus:outline-none"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="name" className="text-black">Name</option>
              <option value="id" className="text-black">Date</option>
              <option value="popular" className="text-black">Popular</option>
            </select>
          </div>

          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Settings size={24} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 space-y-8">
        {/* Featured Section */}
        {searchQuery === '' && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b-2 border-primary w-fit pb-1">
              Featured Zones
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredZones.filter(z => z.featured).map(zone => (
                <ZoneCard key={zone.id} zone={zone} onClick={() => handleOpenZone(zone)} resolveUrl={resolveUrl} />
              ))}
            </div>
          </section>
        )}

        {/* All Zones Section */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b-2 border-primary w-fit pb-1">
            {searchQuery ? `Results for "${searchQuery}"` : "All Zones"} ({filteredZones.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredZones.map(zone => (
              <ZoneCard key={zone.id} zone={zone} onClick={() => handleOpenZone(zone)} resolveUrl={resolveUrl} />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-[#252525] p-8 border-t dark:border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-6 text-primary font-semibold">
            <button onClick={() => setShowContact(true)}>Contact</button>
            <button onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
            <button onClick={handleExport}>Export Data</button>
            <label className="cursor-pointer">
              Import Data
              <input type="file" className="hidden" onChange={handleImport} />
            </label>
          </div>
          <p className="text-gray-500 text-sm">© 2025 GN-Math. Play unblocked everywhere.</p>
        </div>
      </footer>

      {/* Zone Viewer Iframe Overlay */}
      {activeZone && (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-[#181818] flex flex-col">
          <div className="bg-primary text-white p-3 flex items-center justify-between shadow-md">
            <div>
              <h3 className="text-lg font-bold leading-tight">{activeZone.name}</h3>
              {activeZone.author && (
                <a 
                  href={activeZone.authorLink || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs opacity-80 hover:underline"
                >
                  by {activeZone.author}
                </a>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleFullscreen} className="p-2 hover:bg-white/20 rounded-lg"><Maximize size={20} /></button>
              <button onClick={handleDownload} className="p-2 hover:bg-white/20 rounded-lg"><Download size={20} /></button>
              <button 
                onClick={() => window.open(resolveUrl(activeZone.url), '_blank')} 
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                <ExternalLink size={20} />
              </button>
              <button onClick={handleCloseZone} className="p-2 hover:bg-white/20 rounded-lg"><X size={20} /></button>
            </div>
          </div>
          <iframe 
            ref={iframeRef}
            srcDoc={`
              <html>
                <body style="margin:0; padding:0; background:#000;">
                  <div id="loader" style="color:white; font-family:sans-serif; height:100vh; display:flex; align-items:center; justify-content:center; flex-direction:column;">
                    <h2 style="font-weight:900;">GN-MATH</h2>
                    <p>Loading ${activeZone.name}...</p>
                  </div>
                  <script>
                    fetch("${resolveUrl(activeZone.url)}?t=${Date.now()}")
                      .then(r => r.text())
                      .then(h => {
                        document.documentElement.innerHTML = h;
                        // Execute scripts
                        const scripts = Array.from(document.querySelectorAll('script'));
                        scripts.forEach(oldScript => {
                          const newScript = document.createElement('script');
                          if (oldScript.src) newScript.src = oldScript.src;
                          else newScript.textContent = oldScript.textContent;
                          document.body.appendChild(newScript);
                        });
                      });
                  </script>
                </body>
              </html>
            `}
            className="flex-1 w-full border-none"
            title={activeZone.name}
          />
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Modal title="Settings" onClose={() => setShowSettings(false)}>
          <div className="space-y-4 p-2">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-xl hover:opacity-80 transition"
            >
              <span className="font-medium">Theme</span>
              {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-600" />}
            </button>
            <button 
              onClick={handleTabCloak}
              className="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-xl hover:opacity-80 transition"
            >
              <span className="font-medium">Tab Cloak</span>
              <ShieldCheck size={20} className="text-green-500" />
            </button>
            <div className="pt-4 border-t dark:border-gray-700">
              <p className="text-xs text-gray-500 uppercase font-bold mb-2">Data Management</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleExport} className="flex items-center gap-2 justify-center p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  <FileDown size={16} /> Export
                </button>
                <label className="flex items-center gap-2 justify-center p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 cursor-pointer">
                  <FileUp size={16} /> Import
                  <input type="file" className="hidden" onChange={handleImport} />
                </label>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Contact Modal */}
      {showContact && (
        <Modal title="Contact Us" onClose={() => setShowContact(false)}>
          <div className="space-y-4 p-2">
            <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <Phone className="text-primary" />
              <div>
                <p className="text-sm font-bold">Email</p>
                <p className="text-gray-500">gn.math.business@gmail.com</p>
              </div>
            </div>
            <a 
              href="https://discord.gg/NAFw4ykZ7n" 
              target="_blank" 
              rel="noopener"
              className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <Database className="text-indigo-500" />
              <div>
                <p className="text-sm font-bold">Discord Server</p>
                <p className="text-gray-500">Join our community</p>
              </div>
            </a>
          </div>
        </Modal>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <Modal title="Privacy Policy" onClose={() => setShowPrivacy(false)}>
          <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto pr-2">
            <h2 className="text-lg font-bold">GN-MATH PRIVACY POLICY</h2>
            <p className="text-xs text-gray-400">Last updated April 17, 2025</p>
            <p>This Privacy Notice describes how gn-math handles your data. We respect your privacy and don't collect personal identifiers through our site.</p>
            <p><strong>Analytics:</strong> We use basic tracking for site traffic but do not link this to personal identity.</p>
            <p><strong>Ads:</strong> Third-party vendors use cookies to serve ads based on your visits to our site.</p>
            <p><strong>Local Storage:</strong> Your game saves and preferences are stored locally on your device.</p>
          </div>
        </Modal>
      )}
    </div>
  );
};

interface ZoneCardProps {
  zone: Zone;
  onClick: () => void;
  resolveUrl: (url: string) => string;
}

const ZoneCard: React.FC<ZoneCardProps> = ({ zone, onClick, resolveUrl }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div 
      onClick={onClick}
      className="group bg-white dark:bg-[#252525] rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border dark:border-gray-800 flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-200 dark:bg-gray-700">
        <img 
          src={resolveUrl(zone.cover)}
          alt={zone.name}
          loading="lazy"
          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
        />
        {!loaded && <div className="absolute inset-0 flex items-center justify-center animate-pulse bg-gray-300 dark:bg-gray-600" />}
      </div>
      <div className="p-3 text-center">
        <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{zone.name}</h3>
      </div>
    </div>
  );
};

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#252525] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-800 bg-gray-50 dark:bg-[#2a2a2a]">
          <h3 className="font-black tracking-tight uppercase text-primary">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default App;
