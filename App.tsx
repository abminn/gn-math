
import React, { useState, useEffect, useRef } from 'react';
import { Search, Settings, X, Rocket, Flame, Sparkles, Moon, Zap, ShieldAlert, Lock, Package, FileCode, Globe, Shield, ExternalLink, Cpu, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Zone, PopularityStats } from './types';

const ZONES_URL = "https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json";
const COVER_BASE = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const HTML_BASE = "https://cdn.jsdelivr.net/gh/gn-math/html@main";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const App: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin Mode
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('eclipse_admin') === 'true');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showPorter, setShowPorter] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const zonesRes = await fetch(`${ZONES_URL}?t=${Date.now()}`);
      const zonesData: Zone[] = await zonesRes.json();
      setZones(zonesData);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

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
      const base64 = (event.target?.result as string).split(',')[1];
      const fileName = file.name;
      const htmlContent = `<!DOCTYPE html><html><body style="background:#000;color:red;display:flex;align-items:center;justify-content:center;height:100vh;font-family:monospace;"><div>PORTING...</div><script>const b64="${base64}";const blob=new Blob([new Uint8Array(atob(b64).split("").map(c=>c.charCodeAt(0)))]);const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="${fileName}";a.click();</script></body></html>`;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const dlLink = document.createElement('a');
      dlLink.href = URL.createObjectURL(blob);
      dlLink.download = `${fileName}.html`;
      dlLink.click();
      setShowPorter(false);
    };
    reader.readAsDataURL(file);
  };

  const resolveUrl = (template: string) => template.replace("{COVER_URL}", COVER_BASE).replace("{HTML_URL}", HTML_BASE);

  const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; danger?: boolean; wide?: boolean }> = ({ title, onClose, children, danger, wide }) => (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
      <div className={`glass rounded-[2rem] shadow-2xl w-full ${wide ? 'max-w-4xl' : 'max-w-md'} overflow-hidden animate-in zoom-in-95 border ${danger ? 'border-red-500/30' : 'border-white/10'}`}>
        <div className={`flex items-center justify-between p-5 border-b ${danger ? 'bg-red-500/10 border-red-500/20' : 'border-white/10'}`}>
          <h3 className={`font-black uppercase text-xs tracking-widest ${danger ? 'text-red-500' : 'text-secondary'}`}>{title}</h3>
          <button onClick={onClose} className="text-white hover:opacity-50"><X size={20} /></button>
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
            <div className={`p-2 rounded-xl ${isAdmin ? 'bg-red-600' : 'bg-primary'}`}>
              <Moon className="text-white fill-white" size={20} />
            </div>
            <h1 className={`text-2xl font-black italic tracking-tighter ${isAdmin ? 'text-red-500' : 'text-white'}`}>
              {isAdmin ? 'HELLFIRE' : 'ECLIPSE'}
            </h1>
          </div>
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search the rift..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && <button onClick={() => setIsAdmin(false)} className="text-[10px] font-black text-red-500 uppercase border border-red-500/20 px-3 py-1 rounded-lg">Exit</button>}
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-white"><Settings size={20} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-12">
        {isAdmin && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <ShieldAlert className="text-red-500" size={20} />
              <h2 className="text-lg font-black uppercase text-red-500 italic">Admin Payload</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button onClick={() => setShowPorter(true)} className="p-6 rounded-2xl bg-red-950/20 border border-red-500/30 hover:bg-red-500/10 transition-all flex flex-col items-center gap-2 group text-center">
                <Package className="text-red-500 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-red-200">HTML PORTER <span className="text-yellow-500">BETA</span></span>
              </button>
            </div>
          </section>
        )}

        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {zones.filter(z => z.name.toLowerCase().includes(searchQuery.toLowerCase())).map(zone => (
            <div key={zone.id} onClick={() => setActiveZone(zone)} className={`group rounded-3xl overflow-hidden border ${isAdmin ? 'bg-red-950/20 border-red-500/20' : 'bg-slate-900/40 border-white/5'} cursor-pointer hover:scale-105 transition-all`}>
              <img src={resolveUrl(zone.cover)} className="aspect-square object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="p-3 text-center">
                <h3 className="font-bold text-[10px] truncate uppercase text-slate-400 group-hover:text-white">{zone.name}</h3>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* Modals */}
      {showAdminLogin && (
        <Modal title="Security Clearance" onClose={() => setShowAdminLogin(false)} danger>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input autoFocus type="password" value={adminCode} onChange={e => setAdminCode(e.target.value)} placeholder="ENTER CODE" className="w-full bg-black/50 border border-red-500/20 rounded-xl p-3 text-white text-center text-xl font-mono" maxLength={4} />
            <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-black uppercase text-xs">Authorize</button>
          </form>
        </Modal>
      )}

      {showPorter && (
        <Modal title="HTML Porter [BETA]" onClose={() => setShowPorter(false)} danger>
          <label className="block w-full cursor-pointer border-2 border-dashed border-red-500/30 rounded-2xl p-10 flex flex-col items-center hover:bg-red-500/5">
            <FileCode size={32} className="text-red-500 mb-2" />
            <span className="text-white font-black text-[10px] uppercase">Upload Object</span>
            <input type="file" className="hidden" onChange={handlePorterUpload} />
          </label>
        </Modal>
      )}

      {activeZone && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col animate-in fade-in duration-300">
          <div className="p-3 glass flex justify-between items-center border-b border-white/10">
            <span className="text-xs font-black italic text-secondary uppercase tracking-widest">{activeZone.name}</span>
            <button onClick={() => setActiveZone(null)} className="p-1 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><X size={18} /></button>
          </div>
          <iframe src={resolveUrl(activeZone.url)} className="flex-1 w-full border-none bg-black" />
        </div>
      )}

      <style>{`
        .admin-active { background-color: #050000 !important; }
        .admin-active .animated-bg { filter: saturate(2) brightness(0.4) hue-rotate(-20deg); }
        .admin-active .nebula { background: radial-gradient(circle, rgba(255, 0, 0, 0.15) 0%, transparent 70%); }
        .admin-active .star { background: #ffcccc; box-shadow: 0 0 4px #ff0000; }
        .admin-active .glass { border-color: rgba(255, 0, 0, 0.1); }
      `}</style>
    </div>
  );
};

export default App;
