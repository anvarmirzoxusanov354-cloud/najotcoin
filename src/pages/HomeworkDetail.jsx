import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KeyboardArrowLeftOutlined } from '@mui/icons-material';

const BASE   = 'https://najot-edu.softwareengineer.uz/api/v1';
const STATIC = 'https://najot-edu.softwareengineer.uz';

function imgUrl(p) {
  if (!p) return null;
  try { return String(p).startsWith('http') ? p : STATIC + (String(p).startsWith('/') ? p : '/' + p); }
  catch { return null; }
}

function fmt(str) {
  if (!str) return '—';
  try {
    const d = new Date(str);
    if (isNaN(d)) return String(str);
    const M = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
    return `${d.getDate()} ${M[d.getMonth()]}, ${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  } catch { return String(str); }
}

function toList(d) {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.data)) return d.data;
  if (Array.isArray(d.results)) return d.results;
  if (Array.isArray(d.items)) return d.items;
  if (Array.isArray(d.homeworks)) return d.homeworks;
  if (Array.isArray(d.answers)) return d.answers;
  return [];
}

const TABS = [
  { key: 'PENDING',  label: 'Kutayotganlar',     color: '#f59e0b', bg: '#fef9c3' },
  { key: 'REJECTED', label: 'Qaytarilganlar',    color: '#ef4444', bg: '#fee2e2' },
  { key: 'ACCEPTED', label: 'Qabul qilinganlar', color: '#16a34a', bg: '#dcfce7' },
  { key: 'CHECKED',  label: 'Bajarilmagan',      color: '#9ca3af', bg: '#f3f4f6' },
];

export default function HomeworkDetail() {
  const { id: gid, homeworkId: hwId } = useParams();
  const nav = useNavigate();

  const [hw,      setHw]      = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('PENDING');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };

    // 1. Homework info — GET /api/v1/homework/{groupId}
    fetch(`${BASE}/homework/${gid}`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const list = toList(d);
        if (list.length > 0) {
          const found = list.find(x => String(x.id) === String(hwId));
          if (found) setHw(found);
        } else if (d && d.id && String(d.id) === String(hwId)) {
          setHw(d);
        }
      })
      .catch(() => {});

    // 2. Javoblar — har status uchun
    //    GET /api/v1/group/{groupId}/homework/{homeworkId}/results?status=PENDING|REJECTED|ACCEPTED|CHECKED
    setLoading(true);
    Promise.all(
      TABS.map(t =>
        fetch(`${BASE}/group/${gid}/homework/${hwId}/results?status=${t.key}`, { headers })
          .then(r => r.ok ? r.json() : null)
          .then(d => toList(d).map(x => ({ ...x, _tab: t.key })))
          .catch(() => [])
      )
    ).then(all => {
      setAnswers(all.flat());
      setLoading(false);
    });
  }, [gid, hwId]); // token o'zgarmaydi, shuning uchun dependency da kerak emas

  const byTab  = k => answers.filter(x => ((x.status || x._tab) || '').toUpperCase() === k);
  const counts = Object.fromEntries(TABS.map(t => [t.key, byTab(t.key).length]));
  const list   = byTab(tab);
  const title  = hw?.title || hw?.name || hw?.topic || 'Uyga vazifa';
  const dl     = hw?.deadline || hw?.end_date || '';

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
        <button onClick={() => nav(`/classes/${gid}`)}
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
        {dl && (
          <div>
            <p style={{ margin:'0 0 4px', fontSize:12, color:'#9ca3af', fontWeight:500 }}>Tugash vaqti</p>
            <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#1a1a2e' }}>{fmt(dl)}</p>
          </div>
        )}
      </div>

      {/* Tabs + jadval */}
      <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', overflow:'hidden' }}>
        <div style={{ display:'flex', borderBottom:'1px solid #f1f1f5', overflowX:'auto' }}>
          {TABS.map(t => {
            const active = tab === t.key;
            const cnt    = counts[t.key] ?? 0;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'14px 20px', background:'transparent',
                  border:'none', borderBottom: active ? `2.5px solid ${t.color}` : '2.5px solid transparent',
                  marginBottom:-1, cursor:'pointer', fontSize:13.5, fontWeight:600,
                  color: active ? t.color : '#6b7280', whiteSpace:'nowrap', flexShrink:0 }}>
                {t.label}
                {cnt > 0 && (
                  <span style={{ minWidth:20, height:20, borderRadius:10, display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:11, fontWeight:700, padding:'0 4px', background:t.bg, color:t.color }}>
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {list.length === 0 ? (
          <div style={{ padding:'56px 0', textAlign:'center', color:'#9ca3af', fontSize:13 }}>
            Hali hech kim uyga vazifani jo'natmagan
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #f1f1f5', background:'#fafafa' }}>
                <th style={{ padding:'12px 24px', textAlign:'left', fontWeight:600, color:'#6b7280', fontSize:12 }}>O'quvchi ismi</th>
                <th style={{ padding:'12px 24px', textAlign:'left', fontWeight:600, color:'#6b7280', fontSize:12 }}>Topshirilgan vaqt</th>
                <th style={{ padding:'12px 24px', textAlign:'left', fontWeight:600, color:'#6b7280', fontSize:12 }}>Tekshirilgan vaqt</th>
                <th style={{ padding:'12px 24px', textAlign:'left', fontWeight:600, color:'#6b7280', fontSize:12 }}>Ball</th>
                <th style={{ padding:'12px 16px', width:40 }}></th>
              </tr>
            </thead>
            <tbody>
              {list.map((r, i) => {
                const nm    = r.student
                  ? (r.student.full_name || `${r.student.first_name||''} ${r.student.last_name||''}`.trim() || r.student.name || "Noma'lum")
                  : (r.student_name || r.name || "Noma'lum");
                const photo = r.student ? imgUrl(r.student.photo || r.student.avatar) : null;
                const navId = r.id || r.answer_id || r.homework_answer_id || r.student?.id || r.student_id;
                const sentAt = fmt(r.submitted_at || r.created_at || r.createdAt);
                const chkAt  = r.checked_at ? fmt(r.checked_at) : '—';
                const score  = r.grade ?? r.score ?? r.ball;

                return (
                  <tr key={r.id || i} style={{ borderBottom:'1px solid #f5f5f7', cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background='white'}
                    onClick={() => { if (navId) nav(`/classes/${gid}/homework/${hwId}/result/${navId}`); }}>
                    <td style={{ padding:'14px 24px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'#ede9ff', display:'flex',
                          alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#7c4dff', flexShrink:0, overflow:'hidden' }}>
                          {photo
                            ? <img src={photo} alt={nm} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.style.display='none';}} />
                            : nm.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ color:'#3b7cf7', fontWeight:600 }}>{nm}</span>
                      </div>
                    </td>
                    <td style={{ padding:'14px 24px', color:'#4b5563', fontWeight:500 }}>{sentAt}</td>
                    <td style={{ padding:'14px 24px', color:'#4b5563', fontWeight:500 }}>{chkAt}</td>
                    <td style={{ padding:'14px 24px' }}>
                      {score != null
                        ? <span style={{ fontWeight:700, color: score >= 60 ? '#16a34a' : '#ef4444' }}>⚡ {score}</span>
                        : <span style={{ color:'#9ca3af' }}>—</span>}
                    </td>
                    <td style={{ padding:'14px 16px', textAlign:'right', color:'#9ca3af', fontSize:16 }}>›</td>
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
