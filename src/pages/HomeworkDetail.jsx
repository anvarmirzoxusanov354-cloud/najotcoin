import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { KeyboardArrowLeftOutlined } from '@mui/icons-material';

const BASE = 'https://najot-edu.softwareengineer.uz/api/v1';

function fmt(str) {
  if (!str) return '—';
  try {
    const d = new Date(str);
    if (isNaN(d)) return String(str);
    const M = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
    return `${d.getDate()} ${M[d.getMonth()]}, ${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  } catch { return String(str); }
}

const TABS = [
  { key: 'PENDING',  label: 'Kutayotganlar',     color: '#f59e0b', bg: '#fef9c3' },
  { key: 'REJECTED', label: 'Qaytarilganlar',    color: '#ef4444', bg: '#fee2e2' },
  { key: 'ACCEPTED', label: 'Qabul qilinganlar', color: '#16a34a', bg: '#dcfce7' },
  { key: 'CHECKED',  label: 'Bajarilmagan',      color: '#9ca3af', bg: '#f3f4f6' },
];

// API: GET /api/v1/group/{groupId}/homework/{homeworkId}/results?status=STATUS
// Response: { success: true, data: { students: [{id, full_name, created_at}] } }
async function fetchByStatus(groupId, hwId, status, headers) {
  try {
    const r = await fetch(
      `${BASE}/group/${groupId}/homework/${hwId}/results?status=${status}`,
      { headers }
    );
    if (!r.ok) return [];
    const json = await r.json();
    // Response: { success, data: { students: [...] } }
    if (json && json.data && Array.isArray(json.data.students)) return json.data.students;
    if (json && Array.isArray(json.data)) return json.data;
    if (Array.isArray(json)) return json;
    return [];
  } catch { return []; }
}

export default function HomeworkDetail() {
  const { id: groupId, homeworkId: hwId } = useParams();
  const nav = useNavigate();
  const location = useLocation();

  const [hw,       setHw]       = useState(null);
  const [counts,   setCounts]   = useState({ PENDING: 0, REJECTED: 0, ACCEPTED: 0, CHECKED: 0 });
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tabLoad,  setTabLoad]  = useState(false);
  // location.state.initialTab kelsa shu tabdan boshlash
  const [tab, setTab] = useState(location?.state?.initialTab || 'PENDING');

  // Sahifaga qaytib kelganda initialTab o'zgarsa tabni yangilash
  useEffect(() => {
    if (location?.state?.initialTab) {
      setTab(location.state.initialTab);
    }
  }, [location?.state?.initialTab]);

  // Homework info yuklaymiz
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };

    // GET /api/v1/homework/{groupId} — homework ma'lumotlari
    fetch(`${BASE}/homework/${groupId}`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const list = d && d.data ? d.data : (Array.isArray(d) ? d : []);
        const found = Array.isArray(list) ? list.find(x => String(x.id) === String(hwId)) : null;
        if (found) setHw(found);
      })
      .catch(() => {});

    // Barcha tab lar uchun count ni bir vaqtda yuklaymiz
    setLoading(true);
    Promise.all(
      TABS.map(t =>
        fetchByStatus(groupId, hwId, t.key, headers).then(list => ({ key: t.key, count: list.length }))
      )
    ).then(results => {
      const newCounts = {};
      results.forEach(({ key, count }) => { newCounts[key] = count; });
      setCounts(newCounts);
      setLoading(false);
    });
  }, [groupId, hwId]);

  // Tab o'zgarganda shu tabdagi studentlarni yuklaymiz
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    setTabLoad(true);
    fetchByStatus(groupId, hwId, tab, headers).then(list => {
      setStudents(list);
      setTabLoad(false);
    });
  }, [groupId, hwId, tab]);

  const title    = hw?.topic || hw?.title || hw?.name || 'Uyga vazifa';
  const deadline = hw?.deadline || hw?.end_date || '';

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0', gap:10 }}>
      <svg style={{ width:20, height:20 }} viewBox="0 0 50 50">
        <style>{`@keyframes rtt{to{transform:rotate(360deg)}} .rtt{transform-origin:center;animation:rtt 0.9s linear infinite}`}</style>
        <circle className="rtt" cx="25" cy="25" r="20" fill="none" stroke="#7c4dff" strokeWidth="5" strokeDasharray="60 40"/>
      </svg>
      <span style={{ color:'#9ca3af', fontSize:13 }}>Yuklanmoqda...</span>
    </div>
  );

  return (
    <div style={{ paddingBottom:24 }}>
      {/* Sarlavha */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={() => nav(`/classes/${groupId}`)}
          style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:'none', background:'transparent', cursor:'pointer', color:'#6b7280' }}>
          <KeyboardArrowLeftOutlined style={{ fontSize:22 }} />
        </button>
        <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1a1a2e' }}>{title}</h1>
      </div>

      {/* Info card */}
      <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', padding:20, marginBottom:20, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div>
          <p style={{ margin:'0 0 4px', fontSize:12, color:'#9ca3af', fontWeight:500 }}>Mavzu</p>
          <p style={{ margin:0, fontSize:15, fontWeight:700, color:'#1a1a2e' }}>{title}</p>
        </div>
        {deadline && (
          <div>
            <p style={{ margin:'0 0 4px', fontSize:12, color:'#9ca3af', fontWeight:500 }}>Tugash vaqti</p>
            <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#1a1a2e' }}>{fmt(deadline)}</p>
          </div>
        )}
      </div>

      {/* Tabs + jadval */}
      <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', overflow:'hidden' }}>
        {/* Tab bar */}
        <div style={{ display:'flex', borderBottom:'1px solid #f1f1f5', overflowX:'auto' }}>
          {TABS.map(t => {
            const active = tab === t.key;
            const cnt    = counts[t.key] ?? 0;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'14px 20px', background:'transparent', border:'none',
                  borderBottom: active ? `2.5px solid ${t.color}` : '2.5px solid transparent',
                  marginBottom:-1, cursor:'pointer', fontSize:13.5, fontWeight:600,
                  color: active ? t.color : '#6b7280', whiteSpace:'nowrap', flexShrink:0,
                }}>
                {t.label}
                {/* Tab sonini har doim ko'rsatamiz */}
                <span style={{
                  minWidth:20, height:20, borderRadius:10, display:'inline-flex', alignItems:'center',
                  justifyContent:'center', fontSize:11, fontWeight:700, padding:'0 5px',
                  background: active ? t.bg : '#f3f4f6',
                  color: active ? t.color : '#9ca3af',
                }}>
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Kontent */}
        {tabLoad ? (
          <div style={{ padding:'48px 0', textAlign:'center', color:'#9ca3af', fontSize:13 }}>
            Yuklanmoqda...
          </div>
        ) : students.length === 0 ? (
          <div style={{ padding:'56px 0', textAlign:'center', color:'#9ca3af', fontSize:13 }}>
            Bu bo'limda talabalar yo'q
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #f1f1f5', background:'#fafafa' }}>
                <th style={{ padding:'12px 24px', textAlign:'left', fontWeight:600, color:'#6b7280', fontSize:12 }}>#</th>
                <th style={{ padding:'12px 24px', textAlign:'left', fontWeight:600, color:'#6b7280', fontSize:12 }}>O'quvchi ismi</th>
                <th style={{ padding:'12px 24px', textAlign:'left', fontWeight:600, color:'#6b7280', fontSize:12 }}>Topshirilgan vaqt</th>
                <th style={{ padding:'12px 16px', width:40 }}></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const name   = s.full_name || s.name || "Noma'lum";
                const sentAt = fmt(s.created_at || s.submitted_at);
                const navId  = s.answer_id || s.homework_answer_id || s.id;
                // Faqat PENDING tabda bosish mumkin
                const canClick = tab === 'PENDING' && !!navId;

                return (
                  <tr key={s.id || i}
                    style={{ borderBottom:'1px solid #f5f5f7', cursor: canClick ? 'pointer' : 'default' }}
                    onMouseEnter={e => { if (canClick) e.currentTarget.style.background = '#fafafa'; }}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    onClick={() => { if (canClick) nav(`/classes/${groupId}/homework/${hwId}/result/${navId}`); }}>
                    <td style={{ padding:'14px 24px', color:'#9ca3af', fontWeight:500 }}>{i + 1}</td>
                    <td style={{ padding:'14px 24px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{
                          width:32, height:32, borderRadius:'50%', background:'#ede9ff',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontWeight:700, fontSize:13, color:'#7c4dff', flexShrink:0,
                        }}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ color: canClick ? '#3b7cf7' : '#1a1a2e', fontWeight:600 }}>{name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'14px 24px', color:'#4b5563', fontWeight:500 }}>{sentAt}</td>
                    <td style={{ padding:'14px 16px', textAlign:'right', color: canClick ? '#9ca3af' : 'transparent', fontSize:16 }}>
                      {canClick ? '›' : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
