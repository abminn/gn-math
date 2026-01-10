import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Search, Settings, ExternalLink, Maximize, X, Sun, Moon, Phone, ShieldCheck, Database, FileUp, FileDown, Clock, Flame, Rocket, Sparkles, RefreshCw, Download } from 'lucide-react';
import { Zone, PopularityStats } from './types';

const ZONES_URL = "https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json";
const COVER_BASE = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const HTML_BASE = "https://cdn.jsdelivr.net/gh/gn-math/html@main";

const GamePlayer: React.FC<{ zone: Zone; resolveUrl: (url: string) => string; onClose: () => void; onFullscreen: () => void; iframeRef: React.RefObject<HTMLIFrameElement | null> }> = ({ zone, resolveUrl, onClose, onFullscreen, iframeRef }) => {
  const gameUrl = resolveUrl(zone.url);
  const [blobUrl, setBlobUrl] = useState<string>('');

  useEffect(() => {
    let currentUrl = '';
    const loadGame = async () => {
      try {
        const response = await fetch(`${gameUrl}?t=${Date.now()}`);
        if (!response.ok) throw new Error("Failed to load game resource");
        const html = await response.text();
        
        // Constructing a full document blob to ensure proper parsing
        const blob = new Blob([html], { type: 'text/html' });
        currentUrl = URL.createObjectURL(blob);
        setBlobUrl(currentUrl);
      } catch (err) {
        console.error(err);
      }
    };

    loadGame();
    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [gameUrl]);

  const handleDownload = async () => {
    try {
      const response = await fetch(`${gameUrl}?t=${Date.now()}`);
      if (!response.ok) throw new Error("Failed to fetch game source for download");
      const html = await response.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${zone.name.replace(/\s+/g, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col animate-in fade-in duration-300">
      <div className="glass p-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
             <Rocket size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-none mb-1">{zone.name}</h3>
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Signal Locked</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onFullscreen} className="p-2 hover:bg-white/10 rounded-xl transition-all" title="Fullscreen"><Maximize size={20} className="text-white" /></button>
          <button onClick={handleDownload} className="p-2 hover:bg-white/10 rounded-xl transition-all" title="Download Game"><Download size={20} className="text-white" /></button>
          <button onClick={onClose} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all"><X size={20} /></button>
        </div>
      </div>
      <div className="flex-1 w-full bg-[#020617] relative">
        {!blobUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-primary font-bold tracking-widest text-xs uppercase animate-pulse">Initializing {zone.name}...</p>
          </div>
        )}
        {blobUrl && (
          <iframe 
            ref={iframeRef}
            src={blobUrl}
            className="w-full h-full border-none"
            title={zone.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [popularity, setPopularity] = useState<PopularityStats>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'popular'>('popular');
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [zonesRes, popularityRes] = await Promise.all([
        fetch(`${ZONES_URL}?t=${Date.now()}`),
        fetch("https://data.jsdelivr.net/v1/stats/packages/gh/gn-math/html@main/files?period=year").catch(() => null)
      ]);

      if (!zonesRes.ok) throw new Error("Failed to reach game nebula");
      
      const zonesData: Zone[] = await zonesRes.json();
      const stats: PopularityStats = {};

      if (popularityRes && popularityRes.ok) {
        const popData = await popularityRes.json();
        popData.forEach((file: any) => {
          const idMatch = file.name.match(/\/(\d+)\.html$/);
          if (idMatch) {
            stats[parseInt(idMatch[1])] = file.hits.total;
          }
        });
      }

      zonesData.forEach(z => {
        if (z.name.toLowerCase().includes('cattle') || z.name.toLowerCase().includes('drivemad')) {
          z.featured = true;
        }
      });
      if (zonesData.length > 0) zonesData[0].featured = true;

      setZones(zonesData);
      setPopularity(stats);
      
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      if (id) {
        const zone = zonesData.find(z => String(z.id) === id);
        if (zone) setActiveZone(zone);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lost signal to game repository");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredZones = useMemo(() => {
    let result = zones.filter(z => z.name.toLowerCase().includes(searchQuery.toLowerCase()));
    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'id') return b.id - a.id;
      if (sortBy === 'popular') return (popularity[b.id] || 0) - (popularity[a.id] || 0);
      return 0;
    });
    return result;
  }, [zones, searchQuery, sortBy, popularity]);

  const resolveUrl = useCallback((template: string) => {
    return template.replace("{COVER_URL}", COVER_BASE).replace("{HTML_URL}", HTML_BASE);
  }, []);

  const handleOpenZone = (zone: Zone) => {
    if (zone.url.startsWith("http")) {
      window.open(zone.url, "_blank");
      return;
    }
    setActiveZone(zone);
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('id', String(zone.id));
    window.history.pushState(null, '', `?${urlParams.toString()}`);
  };

  const handleCloseZone = () => {
    setActiveZone(null);
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete('id');
    window.history.pushState(null, '', window.location.pathname || '/');
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
        if (iframeRef.current.requestFullscreen) iframeRef.current.requestFullscreen();
        else if ((iframeRef.current as any).webkitRequestFullscreen) (iframeRef.current as any).webkitRequestFullscreen();
    }
  };

  const handleTabCloak = () => {
    const title = prompt("Enter new tab title:", "Google Docs");
    const icon = prompt("Enter new tab icon URL:", "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png");
    if (title) document.title = title;
    if (icon) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = icon;
    }
    setShowSettings(false);
  };

  const handleExport = () => {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) data[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sagittarius-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass sticky top-0 z-[60] px-6 py-4 border-b border-white/5">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => (window.location.href = '/')}>
            <div className="p-2.5 bg-primary rounded-xl rotate-3 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-primary/30">
                <Rocket className="text-white" size={26} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-glow">
              SAGITTARIUS
            </h1>
          </div>

          <div className="flex flex-1 w-full max-w-xl gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search the nebula..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder-slate-500 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all text-slate-300"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="popular">Hottest</option>
              <option value="id">Recent</option>
              <option value="name">A-Z</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setShowSettings(true)} className="p-3 bg-white/5 text-slate-300 rounded-2xl hover:bg-primary/20 hover:text-white transition-all border border-white/5">
                <Settings size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full p-6 md:p-8 space-y-12">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold animate-pulse tracking-widest uppercase text-xs">Syncing with Cosmos...</p>
            </div>
        ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-6 text-center">
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl">
                    <X size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto">Communications interrupted. Please check your connection to the nebula.</p>
                </div>
                <button onClick={fetchData} className="flex items-center gap-2 px-6 py-3 bg-primary rounded-xl font-bold hover:scale-105 transition-all">
                    <RefreshCw size={18} /> Reconnect
                </button>
            </div>
        ) : (
            <>
                {searchQuery === '' && filteredZones.some(z => z.featured) && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center gap-3 mb-6">
                            <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tight italic">Hot Orbit</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                            {filteredZones.filter(z => z.featured).map(zone => (
                                <ZoneCard key={zone.id} zone={zone} onClick={() => handleOpenZone(zone)} resolveUrl={resolveUrl} />
                            ))}
                        </div>
                    </section>
                )}

                <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <div className="flex items-center gap-3 mb-6">
                        <Sparkles className="text-primary" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight italic">
                            {searchQuery ? `Scanning: "${searchQuery}"` : "The Catalog"}
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent ml-4"></div>
                    </div>
                    {filteredZones.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 glass rounded-[2rem]">No signal found for this query.</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                            {filteredZones.map((zone) => (
                                <ZoneCard key={zone.id} zone={zone} onClick={() => handleOpenZone(zone)} resolveUrl={resolveUrl} />
                            ))}
                        </div>
                    )}
                </section>
            </>
        )}
      </main>

      <footer className="mt-20 border-t border-white/5 py-12 px-8 glass">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-slate-400">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Rocket className="text-primary" size={24} />
                    <span className="text-2xl font-black italic text-white">SAGITTARIUS</span>
                </div>
                <p className="text-sm leading-relaxed max-w-xs">Access the stars. The premier unblocked gaming experience. Fast, clean, and always expanding.</p>
            </div>
            <div className="flex flex-wrap gap-8">
                <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Navigation</h4>
                    <ul className="text-sm space-y-2 font-medium">
                        <li><button onClick={() => setShowContact(true)} className="hover:text-primary transition-colors">Contact</button></li>
                        <li><button onClick={() => setShowPrivacy(true)} className="hover:text-primary transition-colors">Privacy</button></li>
                    </ul>
                </div>
                <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Tools</h4>
                    <ul className="text-sm space-y-2 font-medium">
                        <li><button onClick={handleTabCloak} className="hover:text-primary transition-colors">Tab Cloak</button></li>
                        <li><button onClick={handleExport} className="hover:text-primary transition-colors">Export Data</button></li>
                    </ul>
                </div>
            </div>
            <div className="space-y-4 md:text-right">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 inline-block text-left">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-bold text-slate-200">{zones.length} Nodes Active</span>
                    </div>
                </div>
            </div>
        </div>
      </footer>

      {activeZone && (
        <GamePlayer 
          zone={activeZone} 
          resolveUrl={resolveUrl} 
          onClose={handleCloseZone} 
          onFullscreen={handleFullscreen} 
          iframeRef={iframeRef} 
        />
      )}

      {showSettings && (
        <Modal title="System Config" onClose={() => setShowSettings(false)}>
          <div className="space-y-6">
            <button onClick={handleTabCloak} className="w-full flex items-center justify-between p-5 bg-white/5 rounded-2xl hover:bg-primary/20 group transition-all border border-white/5">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="text-green-500" />
                    <span className="font-bold text-white">Ghost Protocol (Cloak)</span>
                </div>
                <Rocket size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
            </button>
            <div className="pt-6 border-t border-white/10">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-4">Memory Banks</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleExport} className="flex items-center gap-2 justify-center p-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm">
                        <FileDown size={18} /> Export
                    </button>
                    <label className="flex items-center gap-2 justify-center p-3.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 cursor-pointer transition-all font-bold text-sm text-white">
                        <FileUp size={18} /> Import
                        <input type="file" className="hidden" onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (!file) return;
                             const reader = new FileReader();
                             reader.onload = (event) => {
                               try {
                                 const data = JSON.parse(event.target?.result as string);
                                 Object.keys(data).forEach(key => localStorage.setItem(key, data[key]));
                                 window.location.reload();
                               } catch (err) { alert("Error importing data"); }
                             };
                             reader.readAsText(file);
                        }} />
                    </label>
                </div>
            </div>
          </div>
        </Modal>
      )}

      {showContact && (
        <Modal title="Communications" onClose={() => setShowContact(false)}>
          <div className="space-y-4 text-slate-300">
            <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Signal ID</p>
                <p className="font-bold text-white">gn.math.business@gmail.com</p>
            </div>
            <a href="https://discord.gg/NAFw4ykZ7n" target="_blank" rel="noopener" className="block p-5 bg-[#5865F2] text-white rounded-2xl hover:scale-[1.02] transition-all text-center font-bold">
                Join the Discord Nexus
            </a>
          </div>
        </Modal>
      )}

      {showPrivacy && (
        <Modal title="Privacy Protocols" onClose={() => setShowPrivacy(false)}>
          <div className="prose prose-invert max-h-[50vh] overflow-y-auto text-slate-400 text-sm pr-4">
            <h2 className="text-lg font-black text-primary uppercase italic">Stealth Zero</h2>
            <p>Sagittarius operates under absolute stealth protocols. We do not store browser fingerprints, IP logs, or personal identity markers.</p>
            <p>Any game progress is stored in your local session nebula (LocalStorage).</p>
          </div>
        </Modal>
      )}
    </div>
  );
};

const ZoneCard: React.FC<{ zone: Zone; onClick: () => void; resolveUrl: (url: string) => string }> = ({ zone, onClick, resolveUrl }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div onClick={onClick} className="group bg-white/5 rounded-[1.5rem] overflow-hidden transition-all duration-300 cursor-pointer border border-white/5 flex flex-col game-card-shadow">
      <div className="relative aspect-square overflow-hidden bg-white/5">
        <img src={resolveUrl(zone.cover)} alt={zone.name} loading="lazy" className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${loaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setLoaded(true)} />
        {!loaded && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity"></div>
        {zone.featured && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-xl">Hot</div>
        )}
      </div>
      <div className="p-3 text-center">
        <h3 className="font-bold text-xs truncate text-slate-200 group-hover:text-primary transition-colors tracking-tight uppercase italic">{zone.name}</h3>
      </div>
    </div>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <div className="glass rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="font-black italic tracking-widest uppercase text-primary text-xs">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={20} /></button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

export default App;