
import React, { useState, useEffect } from 'react';
import { Search, Settings, X, Rocket, Moon, ShieldAlert, Package, FileCode, Globe, Cpu, Terminal, Radio, Info, Activity, ShieldCheck, Github, Zap, ShieldQuestion } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Zone } from './types';

const ZONES_URL = "https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json";
const COVER_BASE = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const HTML_BASE = "https://cdn.jsdelivr.net/gh/gn-math/html@main";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Static Bypass Nodes - These use enterprise CDN mirrors that are harder to block
const STATIC_MIRRORS = [
  { id: 'math-core', name: 'GN-Math Core Mirror', url: 'https://cdn.jsdelivr.net/gh/gn-math/gn-math.github.io@main/index.html', type: 'system' },
  { id: 'vault-alpha', name: 'Alpha Static Node', url: 'https://cdn.statically.io/gh/gn-math/html/main/index.html', type: 'static' },
  { id: 'bypass-beta', name: 'Beta Injection Relay', url: 'https://raw.githack.com/gn-math/assets/main/index.html', type: 'backup' }
];

const App: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Admin Mode
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('eclipse_admin') === 'true');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showPorter, setShowPorter] = useState(false);
  const [showProxyNodes, setShowProxyNodes] = useState(false);
  
  const [customMirror, setCustomMirror] = useState('');
  const [activeProxy, setActiveProxy] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState(STATIC_MIRRORS[0]);

  const fetchData = async () => {
    try {
      const zonesRes = await fetch(`${ZONES_URL}?t=${Date.now()}`);
      const zonesData: Zone[] = await zonesRes.json();
      setZones(zonesData);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  // Scroll to top immediately when admin mode is toggled
  useEffect(() => {
    if (isAdmin) {
      window.scrollTo(0, 0);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.altKey && e.code === 'KeyU') {
        e.preventDefault();
        setShowAdminLogin(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode === '4739') {
      setIsAdmin(true);
      localStorage.setItem('eclipse_admin', 'true');
      setShowAdminLogin(false);
      setAdminCode('');
    } else {
      setAdminCode('');
    }
  };

  const handlePorterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const fileName = file.name;
      const isImage = file.type.startsWith('image/');
      
      let htmlContent = '';
      if (isImage) {
        htmlContent = `<!DOCTYPE html><html><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${content}" style="max-width:100%;max-height:100%;object-fit:contain;"></body></html>`;
      } else {
        htmlContent = `<!DOCTYPE html><html><body style="margin:0;background:#0d1117;color:#c9d1d9;padding:20px;font-family:monospace;white-space:pre-wrap;">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body></html>`;
      }

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const dlLink = document.createElement('a');
      dlLink.href = URL.createObjectURL(blob);
      dlLink.download = `${fileName}.eclipse.html`;
      dlLink.click();
      setShowPorter(false);
    };
    if (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const launchCustomMirror = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMirror) return;
    
    let url = customMirror.trim();
    // GitHub to jsDelivr Transform Engine
    if (url.includes('github.com')) {
      // Handles both repository root and specific files
      url = url.replace('github.com', 'cdn.jsdelivr.net/gh')
               .replace('/blob/', '@')
               .replace('/tree/', '@');
      if (!url.endsWith('.html') && !url.includes('@')) url += '@main/index.html';
    }
    
    setActiveProxy(url);
  };

  const resolveUrl = (template: string) => template.replace("{COVER_URL}", COVER_BASE).replace("{HTML_URL}", HTML_BASE);

  const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; danger?: boolean; wide?: boolean }> = ({ title, onClose, children, danger, wide }) => (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
      <div className={`glass rounded-[2rem] shadow-2xl w-full ${wide ? 'max-w-4xl' : 'max-w-md'} overflow-hidden animate-in zoom-in-95 border ${danger ? 'border-red-500/30' : 'border-white/10'}`}>
        <div className={`flex items-center justify-between p-5 border-b ${danger ? 'bg-red-500/10 border-red-500/20' : 'border-white/10'}`}>
          <div className="flex items-center gap-2">
            {danger ? <Terminal size={14} className="text-red-500" /> : <Cpu size={14} className="text-secondary" />}
            <h3 className={`font-black uppercase text-[10px] tracking-[0.2em] ${danger ? 'text-red-500' : 'text-secondary'}`}>{title}</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-700 ${isAdmin ? 'admin-active' : ''}`}>
      <header className="glass sticky top-0 z-[60] px-6 py-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
            <div className={`p-2 rounded-xl transition-all duration-500 ${isAdmin ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-primary'}`}>
              <Moon className="text-white fill-white" size={20} />
            </div>
            <h1 className={`text-2xl font-black italic tracking-tighter transition-colors duration-500 ${isAdmin ? 'text-red-500' : 'text-white'}`}>
              {isAdmin ? 'HELLFIRE' : 'ECLIPSE'}
            </h1>
          </div>
          
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder={isAdmin ? "LOCALIZING STATIC ASSETS..." : "Search the rift..."}
              className={`w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary transition-all ${isAdmin ? 'placeholder:text-red-900/50 text-red-500 font-mono border-red-500/20 bg-red-950/5' : ''}`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && <button onClick={() => setIsAdmin(false)} className="text-[10px] font-black text-red-500 uppercase border border-red-500/20 px-3 py-1 rounded-lg hover:bg-red-500/10 transition-colors">Relinquish</button>}
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-white transition-colors"><Settings size={20} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-12">
        {isAdmin && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-red-500 animate-pulse" size={20} />
              <h2 className="text-lg font-black uppercase text-red-500 italic tracking-widest">Administrator Overrides</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button onClick={() => setShowPorter(true)} className="p-6 rounded-2xl bg-red-950/10 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/50 transition-all flex flex-col items-center gap-2 group">
                <Package className="text-red-500 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-red-200 tracking-tighter uppercase">File Porter</span>
              </button>
              <button onClick={() => setShowProxyNodes(true)} className="p-6 rounded-2xl bg-red-950/10 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/50 transition-all flex flex-col items-center gap-2 group">
                <Globe className="text-red-500 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-red-200 tracking-tighter uppercase">Static Vault</span>
              </button>
            </div>
          </section>
        )}

        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {zones.filter(z => z.name.toLowerCase().includes(searchQuery.toLowerCase())).map(zone => (
            <div key={zone.id} onClick={() => setActiveZone(zone)} className={`group rounded-3xl overflow-hidden border transition-all duration-300 ${isAdmin ? 'bg-red-950/10 border-red-500/10 hover:border-red-500/40' : 'bg-slate-900/40 border-white/5'} cursor-pointer hover:scale-105 shadow-xl`}>
              <div className="relative aspect-square overflow-hidden bg-slate-950">
                <img src={resolveUrl(zone.cover)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
                {isAdmin && <div className="absolute top-2 right-2 p-1 bg-red-600 rounded-md shadow-lg"><Radio size={12} className="text-white animate-pulse" /></div>}
              </div>
              <div className="p-3 text-center">
                <h3 className={`font-bold text-[10px] truncate uppercase tracking-wider ${isAdmin ? 'text-red-400 group-hover:text-red-200 font-mono' : 'text-slate-400 group-hover:text-white'}`}>{zone.name}</h3>
              </div>
            </div>
          ))}
        </section>
      </main>

      {showAdminLogin && (
        <Modal title="Auth Protocol 47" onClose={() => setShowAdminLogin(false)} danger>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="text-center space-y-1 mb-4">
              <p className="text-[9px] text-red-500/60 font-black uppercase">Unauthorized access is prohibited.</p>
            </div>
            <input autoFocus type="password" value={adminCode} onChange={e => setAdminCode(e.target.value)} placeholder="0000" className="w-full bg-black/50 border border-red-500/20 rounded-xl p-4 text-white text-center text-2xl font-mono tracking-[0.5em] focus:border-red-500/50 outline-none" maxLength={4} />
            <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-500 active:scale-95 transition-all">Authorize</button>
          </form>
        </Modal>
      )}

      {showPorter && (
        <Modal title="File Encapsulator" onClose={() => setShowPorter(false)} danger>
          <label className="block w-full cursor-pointer border-2 border-dashed border-red-500/20 rounded-2xl p-10 flex flex-col items-center hover:bg-red-500/5 hover:border-red-500/40 transition-all">
            <FileCode size={32} className="text-red-500 mb-2" />
            <span className="text-white font-black text-[10px] uppercase tracking-tighter text-center">Select Asset<br/><span className="text-red-500/60 font-normal italic">Wraps into standalone HTML</span></span>
            <input type="file" className="hidden" onChange={handlePorterUpload} />
          </label>
        </Modal>
      )}

      {showProxyNodes && (
        <Modal title="Static Vault Terminal" onClose={() => setShowProxyNodes(false)} danger wide>
          <div className="space-y-6">
            <form onSubmit={launchCustomMirror} className="space-y-3">
               <div className="relative group">
                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500/50 group-focus-within:text-red-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  value={customMirror}
                  onChange={e => setCustomMirror(e.target.value)}
                  placeholder="Paste GitHub Repository URL..."
                  className="w-full bg-black/60 border border-red-500/20 rounded-2xl p-4 pl-12 text-sm text-red-400 font-mono focus:border-red-500/50 outline-none placeholder:text-red-900/30"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-red-600 rounded-xl hover:bg-red-500 transition-colors">
                  <Rocket size={16} className="text-white" />
                </button>
              </div>
              <p className="text-[8px] text-red-500/50 uppercase font-black px-2 flex items-center gap-1">
                <ShieldCheck size={10} /> Bypass Engine: Active (GitHub -> jsDelivr Auto-Switch)
              </p>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h4 className="text-[10px] font-black uppercase text-red-500 flex items-center gap-2">
                  <Activity size={12} /> Pre-Cached Nodes
                </h4>
                <div className="space-y-2">
                  {STATIC_MIRRORS.map((node) => (
                    <button 
                      key={node.id}
                      onClick={() => {
                        setSelectedNode(node);
                        setActiveProxy(node.url);
                      }}
                      className={`w-full flex items-center justify-between text-[10px] font-mono p-3 rounded-lg border transition-all bg-transparent border-white/5 text-slate-500 hover:border-red-500 hover:text-red-400`}
                    >
                      <div className="flex items-center gap-2">
                        <Github size={12} className="text-red-500" />
                        <span>{node.name}</span>
                      </div>
                      <span className="opacity-50 uppercase text-[8px]">{node.type}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-center p-4 bg-red-950/10 border border-red-500/10 rounded-2xl text-[9px] text-red-400/80 uppercase font-bold leading-relaxed space-y-3">
                <div className="flex items-start gap-2">
                  <Info size={12} className="shrink-0 mt-0.5" />
                  <p>Static Vault converts GitHub links into Raw CDN streams. This bypasses both DNS blocks on `github.com` and `X-Frame-Options` restrictions.</p>
                </div>
                <div className="pt-2 border-t border-red-500/10 space-y-1">
                  <div className="flex items-center justify-between text-white/30 font-mono text-[8px]">
                    <span>Inbound Traffic</span>
                    <span className="text-green-500">Encrypted</span>
                  </div>
                  <div className="flex items-center justify-between text-white/30 font-mono text-[8px]">
                    <span>Header Stripping</span>
                    <span className="text-green-500">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {(activeZone || activeProxy) && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col animate-in fade-in duration-300">
          <div className={`p-3 glass flex justify-between items-center border-b ${isAdmin ? 'border-red-500/20' : 'border-white/10'}`}>
            <div className="flex items-center gap-3">
              {isAdmin && <Radio size={14} className="text-red-500 animate-pulse" />}
              <span className={`text-[10px] font-black italic uppercase tracking-widest ${isAdmin ? 'text-red-500' : 'text-secondary'}`}>
                {activeProxy ? `Bypass Active: ${selectedNode.name}` : activeZone?.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
               <button 
                  onClick={() => {
                    const frame = document.getElementById('rift-iframe') as HTMLIFrameElement;
                    if(frame) frame.src = frame.src;
                  }}
                  className="p-1.5 text-white/40 hover:text-white transition-colors"
                  title="Reload Rift"
               >
                 <Zap size={16} />
               </button>
               <button onClick={() => { setActiveZone(null); setActiveProxy(null); }} className={`p-1 rounded-lg transition-all ${isAdmin ? 'bg-red-500/20 text-red-500 hover:bg-red-600 hover:text-white shadow-lg shadow-red-500/10' : 'bg-white/10 text-white hover:bg-white/20'}`}><X size={18} /></button>
            </div>
          </div>
          <iframe 
            id="rift-iframe"
            src={activeProxy || (activeZone ? resolveUrl(activeZone.url) : '')} 
            className="flex-1 w-full border-none bg-white" 
            title="rift-viewport"
            allowFullScreen
            loading="eager"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      <style>{`
        .admin-active { background-color: #030000 !important; }
        .admin-active .animated-bg { filter: saturate(2.5) brightness(0.2) hue-rotate(-25deg) contrast(1.1); }
        .admin-active .nebula { background: radial-gradient(circle, rgba(220, 38, 38, 0.25) 0%, transparent 70%); }
        .admin-active .star { background: #ff1111; box-shadow: 0 0 5px #ff0000; opacity: 0.7; }
        .admin-active .glass { background: rgba(8, 0, 0, 0.85); border-color: rgba(220, 38, 38, 0.15); }
        
        @keyframes glitch {
          0% { transform: translate(0) }
          1% { transform: translate(-1px, 1px) }
          2% { transform: translate(1px, -1px) }
          3% { transform: translate(0) }
          100% { transform: translate(0) }
        }
        .admin-active h1 { animation: glitch 4s infinite linear; }
        
        iframe {
          color-scheme: light;
        }
      `}</style>
    </div>
  );
};

export default App;
