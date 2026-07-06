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
async function fetchByStatus(groupId, hwId, status, headers) {
  try {
    const url = status
      ? `${BASE}/group/${groupId}/homework/${hwId}/results?status=${status}`
      : `${BASE}/group/${groupId}/homework/${hwId}/results`;
    const r = await fetch(url, { headers });
    if (!r.ok) return [];
    const json = await r.json();
    // Response: { success: true, data: [{id, full_name, ...}] }
    if (json && json.data && Array.isArray(json.data)) return json.data;
    if (json && Array.isArray(json.data?.students)) return json.data.students;
    if (Array.isArray(json)) return json;
    return [];
  } catch { return []; }
}

function parseGroupStudents(data) {
  if (!data) return [];
  // { success: true, data: [...] } format
  const obj = data.data || data;
  if (Array.isArray(obj)) return obj;
  if (Array.isArray(obj.students)) return obj.students;
  if (Array.isArray(obj.items)) return obj.items;
  if (Array.isArray(obj.results)) return obj.results;
  if (obj.data) {
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.data.students)) return obj.data.students;
    if (Array.isArray(obj.data.items)) return obj.data.items;
  }
  return [];
}

function parseResults(resp) {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  if (resp.data) {
    if (Array.isArray(resp.data)) return resp.data;
    if (resp.data.students && Array.isArray(resp.data.students)) return resp.data.students;
    if (resp.data.items && Array.isArray(resp.data.items)) return resp.data.items;
    if (resp.data.results && Array.isArray(resp.data.results)) return resp.data.results;
  }
  if (resp.students && Array.isArray(resp.students)) return resp.students;
  if (resp.items && Array.isArray(resp.items)) return resp.items;
  if (resp.results && Array.isArray(resp.results)) return resp.results;
  return [];
}

export default function HomeworkDetail(props) {
  const { id: routeGroupId, homeworkId: routeHwId } = useParams();
  const groupId = props.groupId || routeGroupId;
  const hwId = props.homeworkId || routeHwId;
  const handleBack = props.onBack || (() => nav(`/classes/${groupId}`));
  const nav = useNavigate();
  const location = useLocation();

  const [hw,          setHw]          = useState(null);
  const [counts,      setCounts]      = useState({ PENDING: 0, REJECTED: 0, ACCEPTED: 0, CHECKED: 0 });
  const [students,    setStudents]    = useState([]);
  const [allData,     setAllData]     = useState({ PENDING: [], REJECTED: [], ACCEPTED: [], CHECKED: [] });
  const [loading,     setLoading]     = useState(true);
  const [tabLoad,     setTabLoad]     = useState(false);
  const [tab, setTab] = useState(props.initialTab || location?.state?.initialTab || 'PENDING');

  // Sahifaga qaytib kelganda initialTab o'zgarsa tabni yangilash
  useEffect(() => {
    if (props.initialTab) {
      setTab(props.initialTab);
    } else if (location?.state?.initialTab) {
      setTab(location.state.initialTab);
    }
  }, [props.initialTab, location?.state?.initialTab]);

  // Homework info va barcha statuslar bo'yicha ma'lumot yuklash
  useEffect(() => {
    if (!groupId || !hwId) return;
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };

    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      setLoading(true);
      try {
        // 1. Homework info
        const hwInfoRes = await fetch(`${BASE}/homework/${groupId}?page=1&limit=500`, { headers, signal }).then(r => r.ok ? r.json() : null).catch(() => null);
        if (hwInfoRes) {
          const groupLessons = hwInfoRes.data || (Array.isArray(hwInfoRes) ? hwInfoRes : []);
          let matchedHw = null;
          let foundLesson = null;
          for (const gl of groupLessons) {
            if (gl.homework && Array.isArray(gl.homework)) {
              const h = gl.homework.find(x => String(x.id) === String(hwId));
              if (h) { matchedHw = h; foundLesson = gl; break; }
            }
          }
          if (matchedHw) {
            setHw({
              id: matchedHw.id,
              topic: matchedHw.title || matchedHw.name || matchedHw.topic || foundLesson?.topic || 'Uyga vazifa',
              deadline: matchedHw.deadline || foundLesson?.deadline || '',
              created_at: matchedHw.created_at || foundLesson?.created_at || '',
              file: matchedHw.file || foundLesson?.file || '',
            });
          } else if (groupLessons.length > 0) {
            const fl = groupLessons.find(x => String(x.id) === String(hwId));
            if (fl) {
              setHw({ id: fl.id, topic: fl.topic || fl.title || 'Uyga vazifa', deadline: fl.deadline || '', created_at: fl.created_at || '', file: fl.file || '' });
            }
          }
        }

        const mapItem = (item) => {
          if (!item) return null;
          // API response: { id: studentId, full_name: "..." }
          // yoki { student: { id, full_name }, homeworkResult: {...} }
          const hasStudentField = item.student && item.student.id;
          const studentId = hasStudentField
            ? item.student.id
            : (item.student_id || item.studentId || item.user_id || item.id || null);
          const name = (hasStudentField ? item.student.full_name : null)
            || item.full_name || item.name || 'Talaba';
          const answerId = item.homework_answer_id || item.answer_id;
          return {
            ...item,
            student: hasStudentField ? item.student : { id: studentId, full_name: name },
            full_name: name,
            // answer ID bilan student ID ni aralashtirib yubormaslik uchun
            id: answerId || item.id,
            _studentId: studentId ? String(studentId) : null,
          };
        };

        const getSid = (x) => {
          if (x._studentId) return x._studentId;
          const sid = x.student?.id || x.student_id || x.studentId || x.user_id;
          return sid ? String(sid) : null;
        };

        const dedupeBy = (list, keyFn) => {
          const seen = new Set();
          return list.filter(x => {
            const k = keyFn(x);
            if (!k || seen.has(k)) return false;
            seen.add(k);
            return true;
          });
        };

        // 4 ta parallel so'rov — har status uchun alohida (server filter ishonchli)
        const [pendingRaw, rejectedRaw, acceptedRaw, groupStudentsRaw] = await Promise.all([
          fetch(`${BASE}/group/${groupId}/homework/${hwId}/results?status=PENDING`,  { headers, signal }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`${BASE}/group/${groupId}/homework/${hwId}/results?status=REJECTED`, { headers, signal }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`${BASE}/group/${groupId}/homework/${hwId}/results?status=ACCEPTED`, { headers, signal }).then(r => r.ok ? r.json() : null).catch(() => null),
          // Guruh talabalar — teacher + admin uchun barcha mumkin endpointlar
          (async () => {
            // 1. ADMIN endpoint
            const r1 = await fetch(`${BASE}/groups/one/students/${groupId}`, { headers, signal }).catch(() => null);
            if (r1 && r1.ok) {
              const d = await r1.json().catch(() => null);
              const list = parseGroupStudents(d);
              if (list.length > 0) return d;
            }
            // 2. groups/{groupId} — barcha rollar uchun
            const r2 = await fetch(`${BASE}/groups/${groupId}`, { headers, signal }).catch(() => null);
            if (r2 && r2.ok) {
              const d = await r2.json().catch(() => null);
              const list = parseGroupStudents(d);
              if (list.length > 0) return d;
            }
            // 3. Teacher uchun: teachers/my/groups — guruh ichida students bo'lishi mumkin
            const r3 = await fetch(`${BASE}/teachers/my/groups`, { headers, signal }).catch(() => null);
            if (r3 && r3.ok) {
              const d = await r3.json().catch(() => null);
              const groups = Array.isArray(d) ? d : (d.data || d.groups || d.items || []);
              const group = groups.find(g => String(g.id) === String(groupId));
              if (group) {
                const list = parseGroupStudents(group);
                if (list.length > 0) return group;
              }
            }
            return null;
          })(),
        ]);

        // Har status uchun dedup ro'yxat
        const rawPending  = dedupeBy(parseResults(pendingRaw).map(mapItem).filter(Boolean),  getSid);
        const rawRejected = dedupeBy(parseResults(rejectedRaw).map(mapItem).filter(Boolean), getSid);
        const rawAccepted = dedupeBy(parseResults(acceptedRaw).map(mapItem).filter(Boolean), getSid);

        // Mutual exclusivity: ACCEPTED > REJECTED > PENDING
        const acceptedSids = new Set(rawAccepted.map(getSid).filter(Boolean));
        const rejectedSids = new Set(rawRejected.map(getSid).filter(Boolean));

        const finalAccepted = rawAccepted;
        const cleanRejected = rawRejected.filter(x => !acceptedSids.has(getSid(x)));
        const cleanPending  = rawPending.filter(x => !acceptedSids.has(getSid(x)) && !rejectedSids.has(getSid(x)));

        // Topshirganlar SID lari (barcha 3 statusdan)
        const submittedSids = new Set([
          ...finalAccepted.map(getSid),
          ...cleanRejected.map(getSid),
          ...cleanPending.map(getSid),
        ].filter(Boolean));

        // Bajarilmagan = guruh talabalar - topshirganlar
        const allGroupStudents = parseGroupStudents(groupStudentsRaw);
        const checkedList = dedupeBy(
          allGroupStudents
            .map(s => {
              const st = s.student || s;
              const sid = st.id || s.id || s.student_id;
              const name = st.full_name || st.name || s.full_name || s.name || 'Talaba';
              return { _studentId: sid ? String(sid) : null, student: st, full_name: name, id: sid };
            })
            .filter(x => x._studentId && !submittedSids.has(x._studentId)),
          x => x._studentId
        );


        const newData = {
          PENDING:  cleanPending,
          REJECTED: cleanRejected,
          ACCEPTED: finalAccepted,
          CHECKED:  checkedList,
        };
        setAllData(newData);
        setCounts({
          PENDING:  cleanPending.length,
          REJECTED: cleanRejected.length,
          ACCEPTED: finalAccepted.length,
          CHECKED:  checkedList.length,
        });
        setStudents(newData[tab] || []);

      } catch (err) {
        if (err.name !== 'AbortError') console.error('Error loading homework results:', err);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [groupId, hwId]);

  // Tab o'zgarganda talabalarni yangilash
  useEffect(() => {
    setTabLoad(true);
    setStudents(allData[tab] || []);
    setTabLoad(false);
  }, [tab, allData]);

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
        <button onClick={handleBack}
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
                const name    = s.full_name || s.student?.full_name || s.student?.name || s.name || "Noma'lum";
                const sentAt  = s.created_at || s.submitted_at || s.updatedAt
                  ? fmt(s.created_at || s.submitted_at || s.updatedAt)
                  : '—';
                // navId must be student ID (used in ExamSubmission as studentId path param)
                const navId   = s.student?.id || s.student_id || s.studentId || s.id;
                const canClick = (tab === 'PENDING' || tab === 'ACCEPTED' || tab === 'REJECTED' || tab === 'CHECKED') && !!navId;

                return (
                  <tr key={s.id || i}
                    style={{ borderBottom:'1px solid #f5f5f7', cursor: canClick ? 'pointer' : 'default' }}
                    onMouseEnter={e => { if (canClick) e.currentTarget.style.background = '#fafafa'; }}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    onClick={() => {
                      if (canClick) {
                        if (props.onSubmissionClick) {
                          props.onSubmissionClick(navId, name);
                        } else {
                          nav(`/classes/${groupId}/homework/${hwId}/result/${navId}`);
                        }
                      }
                    }}>
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
                    <td style={{ padding:'14px 24px', color:'#4b5563', fontWeight:500 }}>
                      {tab === 'CHECKED' ? (
                        <span style={{ color:'#9ca3af', fontSize:12 }}>Topshirilmagan</span>
                      ) : sentAt}
                    </td>
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
