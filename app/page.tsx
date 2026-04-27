'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogOut, Cloud, ChevronRight, Calendar as CalendarIcon, Settings, Edit3, ChevronLeft, CloudOff } from 'lucide-react';
import { useMoods } from '@/hooks/useMoods';
import { loginWithGoogle, logout } from '@/lib/firebase';

const EMOJIS = [
  { id: 'horrible', icon: '😢', label: 'Horrible', color: 'bg-error', textColor: 'text-error', shadow: 'shadow-[0_0_8px_rgba(255,113,108,0.3)]' },
  { id: 'mal', icon: '😞', label: 'Mal', color: 'bg-tertiary', textColor: 'text-tertiary', shadow: 'shadow-[0_0_8px_rgba(255,115,80,0.3)]' },
  { id: 'normal', icon: '😐', label: 'Normal', color: 'bg-yellow-400', textColor: 'text-yellow-400', shadow: 'shadow-[0_0_8px_rgba(250,204,21,0.4)]' },
  { id: 'bien', icon: '😊', label: 'Bien', color: 'bg-secondary', textColor: 'text-secondary', shadow: 'shadow-[0_0_8px_rgba(110,155,255,0.3)]' },
  { id: 'increible', icon: '😄', label: 'Increíble', color: 'bg-primary', textColor: 'text-primary', shadow: 'shadow-[0_0_12px_rgba(63,255,139,0.4)]' },
];

const ENERGIES = ['Baja', 'Media', 'Alta'];
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const formatDate = (date: Date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Page() {
  const { entries, saveEntry, isLoaded, user, isCloudMode } = useMoods();

  const [view, setView] = useState<'diario' | 'calendario' | 'ajustes'>('diario');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [energy, setEnergy] = useState<string | null>(null);
  const [word, setWord] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const dateStr = formatDate(selectedDate);
    const entry = entries[dateStr];
    /* eslint-disable react-hooks/set-state-in-effect */
    if (entry) {
      setSelectedEmoji(entry.emojiId);
      setNote(entry.note);
      setEnergy(entry.energy);
      setWord(entry.word);
    } else {
      setSelectedEmoji(null);
      setNote('');
      setEnergy(null);
      setWord('');
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [selectedDate, entries]);

  const handleSave = async () => {
    if (!selectedEmoji) return;
    setIsSaving(true);
    const dateStr = formatDate(selectedDate);
    await saveEntry({
      date: dateStr,
      emojiId: selectedEmoji,
      energy: energy || '',
      word,
      note,
      timestamp: Date.now()
    });
    setTimeout(() => setIsSaving(false), 600);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));

  const monthName = isLoaded ? capitalize(new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(currentMonth)) : '';
  const formattedSelectedDate = isLoaded ? capitalize(new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(selectedDate)) : '';

  const getEmojiData = (emojiId: string) => EMOJIS.find(e => e.id === emojiId);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
      alert('Error en conexión con Firebase, asegúrate de haber configurado las variables de entorno en AI Studio o usa el modo Local.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setView('diario');
    } catch (e) {
      console.error(e);
    }
  };

  if (!isLoaded) return null;

  const renderCalendar = (fullWidth = false) => (
    <section className={`flex flex-col gap-4 ${fullWidth ? 'w-full' : ''}`}>
      <div className="flex justify-between items-end mb-2">
        <div className="flex items-center gap-3">
          <h2 className="font-headline text-3xl font-semibold tracking-tight text-on-surface">{monthName}</h2>
          <span className="text-on-surface-variant font-medium text-sm mb-1">{year}</span>
        </div>
        <div className="flex gap-2 mb-1">
          <button onClick={prevMonth} className="p-1 text-zinc-500 hover:text-white transition-colors"><ChevronLeft size={20}/></button>
          <button onClick={nextMonth} className="p-1 text-zinc-500 hover:text-white transition-colors"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-6 gap-x-2 text-center">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{day}</div>
        ))}
        {blanks.map(b => <div key={`blank-${b}`} />)}
        {days.map(day => {
          const date = new Date(year, month, day);
          const dateStr = formatDate(date);
          const entry = entries[dateStr];
          const isSelected = formatDate(selectedDate) === dateStr;
          const isFuture = date > new Date();
          const emojiData = entry ? getEmojiData(entry.emojiId) : null;

          return (
            <button
              key={day}
              onClick={() => {
                if (!isFuture) {
                  setSelectedDate(date);
                  if (view === 'calendario') setView('diario');
                }
              }}
              disabled={isFuture}
              className={`flex flex-col items-center gap-1 relative group ${isFuture ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={`text-xs z-10 transition-colors ${isSelected ? 'text-primary font-bold' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                {day}
              </span>
              {isSelected && (
                <motion.div layoutId="selected-day" className="w-8 h-8 absolute -top-1 rounded-xl bg-primary/10 border border-primary/20 z-0" />
              )}
              <div className={`w-2 h-2 rounded-full transition-all duration-300 z-10 ${emojiData ? emojiData.color : 'bg-zinc-800'} ${emojiData ? emojiData.shadow : ''} ${isSelected && entry ? 'animate-pulse' : ''} ${!entry && !isFuture ? 'group-hover:bg-zinc-600' : ''}`} />
            </button>
          );
        })}
      </div>
    </section>
  );

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#0e0e0e]/60 backdrop-blur-xl border-none shadow-[0_20_40px_rgba(0,0,0,0.4)]">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center">
              <img src={user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuA6jcj4iCZ5wdks-FaZhnr5jz4-ULgwZYYEfaVjUvnzaoWYnyHt09BDMRe6-EFZXJahFR6pfB_VrGYOnYsXcKlawMoGHIPvNHuGaKklC2pSRTdkzXet0tf4jrisbJrj9qJ1t81cIpMxVenWGD1RbA-CJ7ejj54fel4_XiGuAoy8VFyF37OvLc9V5vjSuJPY-0uY2aCmlOinP1ADPzgYt-oeC1wNbTQvX8y6xB0FLP3M7Sl65kccoxfBJ8v5i8WWs2ekrTan9DTZjvA"} alt="Perfil" className="w-full h-full object-cover" />
            </div>
            <h1 className="font-headline text-2xl font-bold text-primary tracking-tight">MoodSchool</h1>
          </div>
          <div className="flex items-center gap-4">
            {isCloudMode ? (
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-secondary">
                <Cloud size={14} />
                <span>Nube</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500">
                <CloudOff size={14} />
                <span>Local</span>
              </div>
            )}
            {user && (
              <button onClick={handleLogout} className="text-zinc-400 hover:text-white hover:scale-95 transition-all duration-200">
                <LogOut size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto min-h-screen">
        {view === 'diario' && (
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
            {/* Left Column */}
            <div className="flex-1 flex flex-col gap-8">
              {/* Login Banner */}
              {!user && (
                <button onClick={handleLogin} className="bg-surface-container-low rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-surface-container border-none text-left group">
                  <div className="bg-white/5 p-2 rounded-xl group-hover:bg-white/10 transition-colors">
                    <Cloud className="text-secondary" size={20} />
                  </div>
                  <p className="text-sm font-medium text-on-surface-variant leading-tight flex-1">
                    Inicia sesión con Google para guardar tu historial
                  </p>
                  <ChevronRight className="text-zinc-600 group-hover:text-zinc-400 transition-colors" size={20} />
                </button>
              )}

              {/* Calendar (Hidden on mobile if we use tabs, but visible on desktop) */}
              <div className="hidden lg:block">
                {renderCalendar()}
              </div>
              
              {/* Mobile Calendar Preview */}
              <div className="lg:hidden">
                {renderCalendar()}
              </div>
            </div>

            {/* Right Column (Form) */}
            <section className="flex-1 flex flex-col gap-10 lg:mt-2">
              <header className="space-y-1">
                <h3 className="font-headline text-2xl font-medium">¿Cómo te sientes hoy?</h3>
                <p className="text-on-surface-variant text-sm font-medium">{formattedSelectedDate}</p>
              </header>

              {/* Emoji Selector */}
              <div className="flex justify-between items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                {EMOJIS.map(emoji => {
                  const isSelected = selectedEmoji === emoji.id;
                  return (
                    <button
                      key={emoji.id}
                      onClick={() => setSelectedEmoji(emoji.id)}
                      className="flex flex-col items-center gap-3 min-w-[72px] group transition-all active:scale-90 focus:outline-none"
                    >
                      <span className={`text-3xl transition-all duration-300 ${isSelected ? `scale-110 grayscale-0 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]` : 'filter grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                        {emoji.icon}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isSelected ? emoji.textColor : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                        {emoji.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Form Controls */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">¿Qué ha pasado hoy?</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={150}
                    className="w-full bg-surface-container-highest border-none rounded-2xl p-5 text-on-surface placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all min-h-[120px] resize-none text-base leading-relaxed"
                    placeholder="Escribe tus pensamientos aquí..."
                  />
                  <div className="flex justify-end pr-1">
                    <span className="text-[10px] font-bold text-zinc-600">{note.length} / 150</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Nivel de Energía</label>
                  <div className="flex gap-3">
                    {ENERGIES.map(e => {
                      const isSelected = energy === e;
                      return (
                        <button
                          key={e}
                          onClick={() => setEnergy(e)}
                          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 focus:outline-none ${
                            isSelected
                              ? 'bg-secondary/10 border border-secondary/20 text-secondary'
                              : 'bg-surface-container-low text-zinc-500 hover:bg-surface-container hover:text-zinc-300 border border-transparent'
                          }`}
                        >
                          {e}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Una palabra para hoy</label>
                  <input
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    maxLength={30}
                    className="w-full bg-surface-container-highest border-none rounded-xl px-5 py-4 text-on-surface placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                    placeholder="Ej: Calma, Caos, Gratitud..."
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={!selectedEmoji || isSaving}
                  className={`w-full py-5 rounded-[1.5rem] font-bold text-sm uppercase tracking-[0.2em] transition-all duration-300 focus:outline-none ${
                    selectedEmoji
                      ? isSaving
                        ? 'bg-primary/80 text-on-primary scale-[0.98]'
                        : 'bg-primary text-on-primary shadow-[0_8px_32px_rgba(63,255,139,0.2)] hover:scale-[0.98] active:scale-95'
                      : 'bg-surface-container-highest text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {isSaving ? 'Guardando...' : 'Guardar Registro'}
                </button>
              </div>
            </section>
          </div>
        )}

        {view === 'calendario' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <h3 className="font-headline text-3xl font-bold mb-8">Tu Historial</h3>
            {renderCalendar(true)}
            <div className="mt-12 p-6 bg-surface-container rounded-3xl border border-white/5">
              <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Resumen del mes</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl">
                  <p className="text-2xl font-headline font-bold text-primary">{Object.keys(entries).length}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Días registrados</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl">
                  <p className="text-2xl font-headline font-bold text-secondary">😊</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Mood más frecuente</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'ajustes' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-8">
            <h3 className="font-headline text-3xl font-bold mb-8">Ajustes</h3>
            
            <section className="bg-surface-container rounded-3xl p-6 border border-white/5 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container-highest">
                  <img src={user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuA6jcj4iCZ5wdks-FaZhnr5jz4-ULgwZYYEfaVjUvnzaoWYnyHt09BDMRe6-EFZXJahFR6pfB_VrGYOnYsXcKlawMoGHIPvNHuGaKklC2pSRTdkzXet0tf4jrisbJrj9qJ1t81cIpMxVenWGD1RbA-CJ7ejj54fel4_XiGuAoy8VFyF37OvLc9V5vjSuJPY-0uY2aCmlOinP1ADPzgYt-oeC1wNbTQvX8y6xB0FLP3M7Sl65kccoxfBJ8v5i8WWs2ekrTan9DTZjvA"} alt="Perfil" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{user?.displayName || "Usuario Invitado"}</h4>
                  <p className="text-sm text-zinc-500">{user?.email || "Modo offline (Local)"}</p>
                </div>
              </div>
              
              {!user && (
                <button onClick={handleLogin} className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-sm font-bold uppercase tracking-widest transition-all">
                  Vincular cuenta de Google
                </button>
              )}
            </section>

            <section className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">Preferencia</h4>
              <div className="bg-surface-container rounded-3xl border border-white/5 divide-y divide-white/5">
                <div className="p-5 flex justify-between items-center">
                  <span className="text-sm font-medium">Notificaciones diarias</span>
                  <div className="w-10 h-6 bg-zinc-800 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-zinc-500 rounded-full" />
                  </div>
                </div>
                <div className="p-5 flex justify-between items-center">
                  <span className="text-sm font-medium">Idioma</span>
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Español</span>
                </div>
                <div className="p-5 flex justify-between items-center">
                  <span className="text-sm font-medium">Exportar datos (Próximamente)</span>
                  <span className="material-symbols-outlined text-zinc-600">lock</span>
                </div>
              </div>
            </section>

            {user && (
              <button onClick={handleLogout} className="w-full py-4 text-error font-bold text-xs uppercase tracking-widest hover:bg-error/5 rounded-2xl transition-all">
                Cerrar Sesión
              </button>
            )}
          </motion.div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full rounded-t-[1.5rem] z-50 bg-[#1a1a1a]/80 backdrop-blur-lg shadow-2xl flex justify-around items-center px-4 pb-6 pt-3">
        <button 
          onClick={() => setView('diario')}
          className={`flex flex-col items-center justify-center rounded-2xl px-4 py-2 transition-all active:scale-90 ${view === 'diario' ? 'text-primary bg-primary/10' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Edit3 size={24} />
          <span className="font-body text-[10px] font-medium uppercase tracking-wider mt-1">Diario</span>
        </button>
        <button 
          onClick={() => setView('calendario')}
          className={`flex flex-col items-center justify-center rounded-2xl px-4 py-2 transition-all active:scale-90 ${view === 'calendario' ? 'text-primary bg-primary/10' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <CalendarIcon size={24} />
          <span className="font-body text-[10px] font-medium uppercase tracking-wider mt-1">Calendario</span>
        </button>
        <button 
          onClick={() => setView('ajustes')}
          className={`flex flex-col items-center justify-center rounded-2xl px-4 py-2 transition-all active:scale-90 ${view === 'ajustes' ? 'text-primary bg-primary/10' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Settings size={24} />
          <span className="font-body text-[10px] font-medium uppercase tracking-wider mt-1">Ajustes</span>
        </button>
      </nav>

      {/* Decorative Background Glows */}
      <div className="fixed -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none z-[-1]" />
      <div className="fixed -top-40 -right-40 w-80 h-80 bg-secondary/5 rounded-full blur-[100px] pointer-events-none z-[-1]" />
    </>
  );
}
