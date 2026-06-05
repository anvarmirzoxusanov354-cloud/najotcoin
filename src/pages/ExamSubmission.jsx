import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BASE   = 'https://najot-edu.softwareengineer.uz/api/v1';
const STATIC = 'https://najot-edu.softwareengineer.uz';

function imgUrl(p) {
  if (!p) return null;
  try { return p.startsWith('http') ? p : STATIC + (p.startsWith('/') ? p : '/' + p); }
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
  return d.data || d.results || d.items || d.homeworks || d.answers || [];
}

const STATUS_INFO = {
  PENDING:  { label:'Kutayabti',       bg:'#fef9c3', color:'#ca8a04' },
  ACCEPTED: { label:'Qabul qilingan',  bg:'#dcfce7', color:'#16a34a' },
  REJECTED: { label:'Qaytarilgan',     bg:'#fee2e2', color:'#ef4444' },
  CHECKED:  { label:'Tekshirilgan',    bg:'#ede9ff', color:'#7c4dff' },
};

export default function ExamSubmission() {
  // Route: /classes/:id/homework/:examId/result/:submissionId
  //    va: /classes/:id/exam/:examId/submission/:submissionId
  const { id: gid, examId: hwId, submissionId } = useParams();
  const nav = useNavigate();
  const token = localStorage.getItem('accessToken');
  const H = { Authorization: `Bearer ${token}` };
  const isHwRoute = window.location.pathname.includes('/homework/');
  const goBack = () => nav(isHwRoute ? `/classes/${gid}/homework/${hwId}` : `/classes/${gid}/exam/${hwId}`);

  const [hw,      setHw]      = useState(null);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [score,   setScore]   = useState(0);
  const [comment, setComment] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [err,     setErr]     = useState('');

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    // 1. Homework ma'lumoti
    // GET /api/v1/homework/{groupId}
    fetch(`${BASE}/homework/${gid}`, { headers: H })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const list = toList(d);
        const found = Array.isArray(list) ? list.find(x => String(x.id) === String(hwId)) : null;
        if (found) setHw(found);
        else if (d && d.id && String(d.id) === String(hwId)) setHw(d);
      })
      .catch(() => {});

    // 2. Talaba javobi
    // GET /api/v1/group/{groupId}/homework/{homeworkId}/result/{submissionId}
    fetch(`${BASE}/group/${gid}/homework/${hwId}/result/${submissionId}`, { headers: H })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setLoading(false); return; }
        const data = Array.isArray(d) ? d[0] : (d.data || d);
        if (data) {
          setResult(data);
          setScore(data.grade ?? data.score ?? data.ball ?? 0);
          setComment(data.comment || data.note || '');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gid, hwId, submissionId]);

  const handleSave = async () => {
    setSaving(true); setErr(''); setSaved(false);
    try {
      // POST /api/v1/group/{groupId}/homework/{homeworkId}/check
      // body: { grade, title, homework_answer_id }
      const answerId = result?.id || result?.homework_answer_id || result?.answer_id || Number(submissionId);
      const body = {
        grade: Number(score),
        title: comment || hw?.title || 'Baholandi',
        homework_answer_id: Number(answerId),
      };
      const res = await fetch(`${BASE}/group/${gid}/homework/${hwId}/check`, {
        method: 'POST',
        headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => goBack(), 1000);
      } else {
        const e = await res.json().catch(() => ({}));
        setErr(e.message || `Xatolik: ${res.status}`);
      }
    } catch { setErr('Server bilan ulanishda xatolik!'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0', gap:10 }}>
      <svg style={{ width:20, height:20, animation:'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <circle cx="12" cy="12" r="10" stroke="#7c4dff" strokeWidth="4" strokeDasharray="32" strokeDashoffset="10"/>
      </svg>
      <span style={{ color:'#9ca3af', fontSize:13 }}>Yuklanmoqda...</span>
    </div>
  );

  if (!result) return (
    <div style={{ paddingBottom:24 }}>
      <div style={{ marginBottom:20 }}>
        <button onClick={goBack} style={{ color:'#3b7cf7', fontWeight:600, fontSize:13, background:'none', border:'none', cursor:'pointer', padding:0 }}>
          ← Orqaga
        </button>
      </div>
      <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', padding:'48px 24px', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
        <p style={{ margin:'0 0 6px', fontSize:15, fontWeight:600, color:'#374151' }}>Natija topilmadi</p>
        <p style={{ margin:0, fontSize:13, color:'#9ca3af' }}>Talaba hali javob yubormaganga o'xshaydi</p>
      </div>
    </div>
  );

  const sName    = result.student
    ? (result.student.full_name || `${result.student.first_name||''} ${result.student.last_name||''}`.trim() || result.student.name || 'Talaba')
    : (result.student_name || 'Talaba');
  const sPhoto   = result.student ? imgUrl(result.student.photo || result.student.avatar) : null;
  const sentAt   = fmt(result.submitted_at || result.created_at || result.createdAt);
  const files    = result.files || [];
  const rawSt    = (result.status || 'PENDING').toUpperCase();
  const si       = STATUS_INFO[rawSt] || STATUS_INFO.PENDING;
  const content  = result.content || result.answer || result.description || '';
  const hwTitle  = hw?.title || hw?.name || hw?.topic || 'Uyga vazifa';
  const hwDesc   = hw?.description || hw?.content || '';

  return (
    <div style={{ paddingBottom:24 }}>
      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, fontSize:13 }}>
        <button onClick={goBack} style={{ color:'#3b7cf7', fontWeight:600, background:'none', border:'none', cursor:'pointer', padding:0 }}>
          Kutayotganlar
        </button>
        <span style={{ color:'#9ca3af' }}>›</span>
        <span style={{ color:'#374151', fontWeight:500 }}>Uyga vazifa</span>
      </div>

      {/* Uy vazifasi */}
      <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', padding:24, marginBottom:20 }}>
        <h3 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700, color:'#1a1a2e' }}>Uy vazifasi</h3>
        <div style={{ background:'#f9fafb', borderRadius:10, padding:16 }}>
          <p style={{ margin:'0 0 4px', fontSize:12, color:'#9ca3af', fontWeight:500 }}>Izoh:</p>
          <p style={{ margin:0, fontSize:14, color:'#1a1a2e' }}>{hwDesc || hwTitle}</p>
        </div>
      </div>

      {/* Talaba javobi */}
      <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', padding:24, marginBottom:20 }}>
        {/* Talaba ismi */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:'#ede9ff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15, color:'#7c4dff', flexShrink:0, overflow:'hidden' }}>
            {sPhoto
              ? <img src={sPhoto} alt={sName} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; }} />
              : sName.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#1a1a2e' }}>{sName}</h2>
        </div>

        {/* Meta */}
        <div style={{ display:'flex', gap:32, flexWrap:'wrap', padding:'14px 16px', background:'#f9fafb', borderRadius:10, marginBottom:16 }}>
          <div>
            <p style={{ margin:'0 0 2px', fontSize:12, color:'#9ca3af' }}>Vaqti:</p>
            <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#1a1a2e' }}>{sentAt}</p>
          </div>
          <div>
            <p style={{ margin:'0 0 2px', fontSize:12, color:'#9ca3af' }}>Fayllar soni:</p>
            <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#1a1a2e' }}>{files.length}</p>
          </div>
          <div>
            <p style={{ margin:'0 0 2px', fontSize:12, color:'#9ca3af' }}>Status:</p>
            <span style={{ padding:'4px 12px', borderRadius:6, fontSize:12, fontWeight:700, background:si.bg, color:si.color }}>{si.label}</span>
          </div>
        </div>

        {/* Fayllar (rasm preview) */}
        {files.length > 0 && (
          <div style={{ padding:'14px 16px', background:'#f9fafb', borderRadius:10, marginBottom:16 }}>
            <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:600, color:'#374151' }}>Fayl: <strong>{files.length}</strong></p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {files.map((f, i) => {
                const url = imgUrl(f.url || f.file_url || f.path || f);
                const isImg = url && /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                return (
                  <a key={i} href={url} target="_blank" rel="noreferrer"
                    style={{ display:'block', width:120, height:90, borderRadius:8, overflow:'hidden', border:'1px solid #e5e7eb', background:'#fff', textDecoration:'none' }}>
                    {isImg
                      ? <img src={url} alt={`fayl-${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#9ca3af', padding:4, textAlign:'center', wordBreak:'break-all' }}>
                          {f.name || f.filename || `Fayl ${i+1}`}
                        </div>
                    }
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Matn javob / izoh */}
        {(content || result.comment) && (
          <div style={{ borderLeft:'4px solid #7c4dff', padding:'12px 16px', background:'#f9fafb', borderRadius:'0 10px 10px 0' }}>
            {content && (
              <>
                <p style={{ margin:'0 0 4px', fontSize:12, color:'#9ca3af' }}>Uyga vazifa izohi:</p>
                <div style={{ fontSize:13, color:'#374151', whiteSpace:'pre-wrap', lineHeight:1.7 }}>{content}</div>
              </>
            )}
          </div>
        )}

        {!content && files.length === 0 && (
          <div style={{ background:'#f9fafb', borderRadius:10, padding:16, fontSize:13, color:'#9ca3af', textAlign:'center' }}>
            Topshiriq yuklanmagan
          </div>
        )}
      </div>

      {/* Ball berish */}
      <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', padding:24 }}>
        {/* Info */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 16px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, marginBottom:24 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0, marginTop:2 }}>
            <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="1.8"/>
            <path d="M12 8v4m0 4h.01" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <p style={{ margin:0, fontSize:12.5, color:'#1d4ed8', fontWeight:500 }}>
            60–100 oralig'ida ball qo'yilgan vazifa 'Qabul qilingan', 0–59 oralig'ida ball qo'yilgan vazifa 'Qaytarilgan' hisoblanadi
          </p>
        </div>

        {/* Slider */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <label style={{ fontSize:15, fontWeight:700, color:'#1a1a2e' }}>Ball</label>
            <div style={{ minWidth:44, height:36, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:'1.5px solid #e5e7eb', fontWeight:700, fontSize:15, color: score >= 60 ? '#16a34a' : '#ef4444', padding:'0 8px' }}>
              {score}
            </div>
          </div>
          <input type="range" min={0} max={100} value={score}
            onChange={e => setScore(Number(e.target.value))}
            style={{ width:'100%', height:8, borderRadius:4, cursor:'pointer', outline:'none', appearance:'none', WebkitAppearance:'none',
              background:`linear-gradient(to right, ${score >= 60 ? '#16a34a' : '#ef4444'} ${score}%, #e5e7eb ${score}%)`,
              accentColor: score >= 60 ? '#16a34a' : '#ef4444' }} />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, position:'relative' }}>
            <span style={{ fontSize:11, color:'#9ca3af' }}>0</span>
            <span style={{ fontSize:12, color:'#6b7280', fontWeight:500, position:'absolute', left:'60%', transform:'translateX(-50%)' }}>O'tish bali</span>
            <span style={{ fontSize:11, color:'#9ca3af' }}>100</span>
          </div>
        </div>

        {/* Izoh textarea */}
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:14, fontWeight:600, color:'#1a1a2e', display:'block', marginBottom:8 }}>Izohingiz</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Izohingiz (ixtiyoriy)" rows={4}
            style={{ width:'100%', padding:'12px 16px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:13, color:'#1a1a2e', outline:'none', resize:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>

        {err && (
          <div style={{ marginBottom:16, padding:'10px 16px', background:'#fee2e2', border:'1px solid #fecaca', borderRadius:8, color:'#dc2626', fontSize:13 }}>
            {err}
          </div>
        )}
        {saved && (
          <div style={{ marginBottom:16, padding:'10px 16px', background:'#dcfce7', border:'1px solid #bbf7d0', borderRadius:8, color:'#16a34a', fontSize:13, fontWeight:600 }}>
            ✓ Muvaffaqiyatli saqlandi! {score >= 60 ? 'Qabul qilingan' : 'Qaytarilgan'}
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:12 }}>
          <button onClick={goBack}
            style={{ padding:'10px 28px', borderRadius:10, border:'1.5px solid #d1d5db', background:'white', color:'#374151', fontSize:14, fontWeight:600, cursor:'pointer' }}>
            Bekor qilish
          </button>
          <button onClick={handleSave} disabled={saving || saved}
            style={{ padding:'10px 28px', borderRadius:10, border:'none',
              background: saving ? '#9ca3af' : '#16a34a',
              color:'white', fontSize:14, fontWeight:600,
              cursor: (saving || saved) ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saqlanmoqda...' : saved ? 'Saqlandi ✓' : 'Yuborish'}
          </button>
        </div>
      </div>
    </div>
  );
}
