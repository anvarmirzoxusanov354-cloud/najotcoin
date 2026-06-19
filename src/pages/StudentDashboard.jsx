import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';

const BASE_URL = 'https://najot-edu.softwareengineer.uz/api/v1';

const MENU = [
  { id: 'home', label: 'Bosh sahifa', Icon: HomeOutlinedIcon },
  { id: 'payments', label: "To'lovlarim", Icon: AccountBalanceWalletOutlinedIcon },
  { id: 'groups', label: 'Guruhlarim', Icon: PeopleAltOutlinedIcon },
  { id: 'stats', label: "Ko'rsatkichlarim", Icon: BarChartOutlinedIcon },
  { id: 'rating', label: 'Reyting', Icon: EmojiEventsOutlinedIcon },
  { id: 'shop', label: "Do'kon", Icon: StorefrontOutlinedIcon },
  { id: 'extra', label: "Qo'shimcha darslar", Icon: PlayCircleOutlinedIcon },
  { id: 'settings', label: 'Sozlamalar', Icon: SettingsOutlinedIcon },
];

/* ── colour tokens (admin bilan bir xil) ─────────────────────── */
const C = {
  purple: '#7c4dff',
  purpleLight: '#f5f0ff',
  purpleShadow: 'rgba(124,77,255,0.3)',
  orange: '#fb923c',   // logo
  red: '#ef4444',   // logout icon
  headerBg: '#f1f5f9',
  sidebarBg: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
  border: '#e5e7eb',
};

const StudentDashboard = () => {
  const [open, setOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('groups');
  const [activeTab, setActiveTab] = useState('faol');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonLoad, setLessonLoad] = useState(false);
  const [lessonFilter, setLessonFilter] = useState('Barchasi');

  const { logout } = useAuth();
  const navigate = useNavigate();

  /* auth guard */
  useEffect(() => {
    const logged = localStorage.getItem('isLogged');
    const role = localStorage.getItem('role');
    if (!logged || role !== 'STUDENT') window.location.href = '/login';
  }, []);

  /* fetch — /students/my/groups */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${BASE_URL}/students/my/groups`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setGroups(Array.isArray(json.data) ? json.data : []);
        }
      } catch { }
      finally { setLoading(false); }
    })();
  }, []);

  /* fetch lessons when group clicked */
  useEffect(() => {
    if (!selectedGroup) return;
    setLessons([]);
    setLessonFilter('Barchasi');
    (async () => {
      setLessonLoad(true);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${BASE_URL}/groups/${selectedGroup.groupId}/lessons/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok) setLessons(Array.isArray(json) ? json : (json.data || []));
      } catch { }
      finally { setLessonLoad(false); }
    })();
  }, [selectedGroup]);

  const handleLogout = () => { logout(); window.location.href = '/login'; };

  const filtered = groups.filter(g => {
    const q = search.toLowerCase();
    const name = (g.groupName || '').toLowerCase();
    const tabOk = activeTab === 'faol'
      ? g.status !== 'finished'
      : g.status === 'finished';
    return tabOk && (!q || name.includes(q));
  });

  const phone = localStorage.getItem('phone') || '';
  const initial = phone ? phone.slice(-1).toUpperCase() : 'S';
  const sW = open ? '260px' : '80px';

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif", overflow: 'hidden', backgroundColor: C.headerBg }}>

      {/* ════ SIDEBAR ════════════════════════════════════════════ */}
      <aside style={{
        width: sW, flexShrink: 0,
        backgroundColor: C.sidebarBg,
        borderRadius: '0 24px 24px 0',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
      }}>
        {/* Logo */}
        <div style={{
          padding: open ? '20px 16px 20px 16px' : '20px 0',
          display: 'flex', alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
          gap: '10px', minHeight: '68px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            backgroundColor: C.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: '700', fontSize: '15px', flexShrink: 0,
          }}>E</div>
          {open && <span style={{ fontSize: '18px', fontWeight: '700', color: C.gray700, whiteSpace: 'nowrap' }}>Najotedu</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 8px', overflowY: 'auto' }}>
          {MENU.map(({ id, label, Icon }) => {
            const active = activeMenu === id;
            return (
              <button key={id} onClick={() => setActiveMenu(id)} title={!open ? label : ''}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: open ? '12px' : '0',
                  justifyContent: open ? 'flex-start' : 'center',
                  padding: open ? '11px 14px' : '11px',
                  marginBottom: '2px', borderRadius: '12px', border: 'none',
                  cursor: 'pointer',
                  backgroundColor: active ? C.purple : 'transparent',
                  color: active ? '#fff' : C.gray500,
                  fontSize: '13.5px', fontWeight: active ? '600' : '400',
                  transition: 'all 0.18s',
                  whiteSpace: 'nowrap',
                  boxShadow: active ? `0 2px 8px ${C.purpleShadow}` : 'none',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = C.gray50; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Icon style={{ fontSize: '18px', flexShrink: 0 }} />
                {open && label}
              </button>
            );
          })}
        </nav>

      </aside>

      {/* ════ MAIN ═══════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ─── HEADER ─────────────────────────────────────────── */}
        <header style={{
          height: '64px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px 0 12px',
          backgroundColor: C.headerBg,
        }}>
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            {/* Collapse btn — admin bilan bir xil */}
            <button onClick={() => setOpen(v => !v)} style={hdrBtn}>
              {open
                ? <ChevronLeftOutlinedIcon style={{ fontSize: '18px', transform: 'scale(0.85)' }} />
                : <ChevronRightOutlinedIcon style={{ fontSize: '18px', transform: 'scale(0.85)' }} />}
            </button>

            {/* Search */}
            <div style={{ position: 'relative', maxWidth: '260px', width: '100%' }}>
              <SearchIcon style={{
                position: 'absolute', left: '12px', top: '50%',
                transform: 'translateY(-50%)', color: C.gray400, fontSize: '18px',
              }} />
              <input
                type="text" placeholder="Qidirish..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px 8px 38px',
                  border: 'none', borderRadius: '12px', fontSize: '13px',
                  outline: 'none', backgroundColor: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  color: C.gray700, boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Language */}
            <div style={{ ...hdrBtn, padding: '0 12px', fontSize: '12px', fontWeight: '500', color: C.gray500, width: 'auto', borderRadius: '12px' }}>
              O&apos;zbekcha
            </div>

            {/* Bell */}
            <button style={hdrBtn}>
              <NotificationsNoneIcon style={{ fontSize: '20px' }} />
            </button>

            {/* Dark mode */}
            <button style={hdrBtn}>
              <DarkModeOutlinedIcon style={{ fontSize: '20px' }} />
            </button>

            {/* Avatar */}
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              backgroundColor: C.purple, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: '700', fontSize: '14px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            }}>
              {initial}
            </div>

            {/* Logout — admin bilan bir xil: oq fon, qizil icon */}
            <button
              onClick={handleLogout}
              title="Chiqish"
              style={{
                ...hdrBtn,
                color: '#f87171',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#f87171'; }}
            >
              <LogoutOutlinedIcon style={{ fontSize: '18px' }} />
            </button>
          </div>
        </header>

        {/* ─── CONTENT ────────────────────────────────────────── */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>

          {selectedGroup ? (
            /* ══ GROUP DETAIL VIEW ══════════════════════════════ */
            <div>
              {/* Back + title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <button
                  onClick={() => setSelectedGroup(null)}
                  style={{ ...hdrBtn, boxShadow: 'none', backgroundColor: C.gray100 }}
                >
                  <ChevronLeftOutlinedIcon style={{ fontSize: '20px' }} />
                </button>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: C.gray700 }}>
                    {selectedGroup.groupName}
                  </h2>
                  <span style={{ fontSize: '12px', color: C.gray500 }}>{selectedGroup.courseName}</span>
                </div>
              </div>

              {/* Uy vazifa statusi + filter */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: C.gray700 }}>Uy vazifa statusi</h3>
                <select
                  value={lessonFilter}
                  onChange={e => setLessonFilter(e.target.value)}
                  style={{
                    padding: '7px 32px 7px 12px', border: `1px solid ${C.border}`,
                    borderRadius: '8px', fontSize: '13px', color: C.gray700,
                    backgroundColor: '#fff', cursor: 'pointer', outline: 'none',
                    appearance: 'auto',
                  }}
                >
                  {['Barchasi', 'Qabul qilingan', 'Qaytarilgan', 'Bajarilmagan', 'Berilmagan'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Lessons table */}
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: C.gray50, borderBottom: `1px solid ${C.border}` }}>
                      {['Mavzular', 'Video', 'Uyga vazifa Holati', 'Uyga vazifa tugash vaqti', 'Dars sanasi'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: C.gray700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lessonLoad ? (
                      <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: C.gray400, fontSize: '14px' }}>Yuklanmoqda...</td></tr>
                    ) : lessons.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: C.gray400, fontSize: '14px' }}>Darslar topilmadi</td></tr>
                    ) : lessons
                      .filter(l => lessonFilter === 'Barchasi' || l.status === lessonFilter)
                      .map((l, i, arr) => {
                        const statusColor = {
                          'Qabul qilingan': { bg: '#22c55e', color: '#fff' },
                          'Qaytarilgan': { bg: '#f97316', color: '#fff' },
                          'Bajarilmagan': { bg: '#ef4444', color: '#fff' },
                          'Berilmagan': { bg: '#6b7280', color: '#fff' },
                        }[l.status] || { bg: '#6b7280', color: '#fff' };
                        const darsDate = l.created_at
                          ? new Date(l.created_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })
                          : '-';
                        const rawDeadline = l.homework_deadline || l.deadline || l.due_date || l.dueDate;
                        const deadlineDate = rawDeadline
                          ? new Date(rawDeadline).toLocaleString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : l.created_at
                            ? (() => {
                              const d = new Date(l.created_at);
                              d.setHours(20, 0, 0, 0);
                              return d.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' }) + ' 20:00';
                            })()
                            : '-';
                        return (
                          <tr key={l.id || i}
                            style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = C.gray50}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                          >
                            <td style={{ ...ltd, fontWeight: '500', maxWidth: '220px' }}>{l.topic || '-'}</td>
                            <td style={ltd}>
                              <div style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                border: `2px solid ${C.purple}`, display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontSize: '11px', fontWeight: '600', color: C.purple,
                              }}>{l.videoCount ?? 0}</div>
                            </td>
                            <td style={ltd}>
                              <span style={{
                                ...statusBadge,
                                backgroundColor: statusColor.bg,
                                color: statusColor.color,
                              }}>{l.status || 'Berilmagan'}</span>
                            </td>
                            <td style={{ ...ltd, color: C.gray500 }}>{deadlineDate}</td>
                            <td style={{ ...ltd, color: C.gray500 }}>{darsDate}</td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ══ GROUPS LIST ════════════════════════════════════ */
            <div>
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: `2px solid ${C.border}`, marginBottom: '20px' }}>
                {[{ k: 'faol', l: 'Faol' }, { k: 'tugagan', l: 'Tugagan' }].map(({ k, l }) => (
                  <button key={k} onClick={() => setActiveTab(k)}
                    style={{
                      padding: '10px 22px', border: 'none',
                      borderBottom: activeTab === k ? `2px solid ${C.purple}` : '2px solid transparent',
                      backgroundColor: 'transparent', cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: activeTab === k ? '600' : '400',
                      color: activeTab === k ? C.purple : C.gray500,
                      marginBottom: '-2px', transition: 'all 0.2s',
                    }}
                  >{l}</button>
                ))}
              </div>

              {/* Groups table */}
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: C.gray50, borderBottom: `1px solid ${C.border}` }}>
                      {['#', 'Guruh nomi', "Yo'nalishi", "O'qituvchi", 'Boshlash vaqti'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: C.gray700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: C.gray400, fontSize: '14px' }}>Yuklanmoqda...</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: C.gray400, fontSize: '14px' }}>Guruhlar topilmadi</td></tr>
                    ) : filtered.map((g, i) => {
                      const teacher = g.teachers?.[0]?.full_name || 'T';
                      const course = g.courseName || '-';
                      const date = g.startDate
                        ? new Date(g.startDate).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })
                        : '-';
                      return (
                        <tr key={g.groupId || i}
                          onClick={() => setSelectedGroup(g)}
                          style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.15s', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = C.gray50}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                        >
                          <td style={td}>{i + 1}</td>
                          <td style={{ ...td, fontWeight: '500', color: C.purple }}>{g.groupName || '-'}</td>
                          <td style={td}>{course}</td>
                          <td style={td}>
                            <div style={{
                              width: '30px', height: '30px', borderRadius: '50%',
                              backgroundColor: C.orange,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: '12px', fontWeight: '700',
                            }}>{teacher[0]?.toUpperCase()}</div>
                          </td>
                          <td style={td}>{date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

/* ── shared micro-styles ─────────────────────────────────────── */
const hdrBtn = {
  width: '40px', height: '40px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '12px', border: 'none', cursor: 'pointer',
  backgroundColor: '#fff', color: '#6b7280',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  transition: 'all 0.18s', flexShrink: 0,
};

const td = {
  padding: '13px 16px', fontSize: '13.5px', color: '#374151',
};

/* row for lessons table */
const ltd = {
  padding: '18px 16px', fontSize: '13px', color: '#374151',
};

const statusBadge = {
  display: 'inline-block',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: '600',
  whiteSpace: 'nowrap',
};

export default StudentDashboard;
