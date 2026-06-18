import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KeyboardArrowLeftOutlined } from '@mui/icons-material';

const BASE = 'https://najot-edu.softwareengineer.uz/api/v1';

// Swagger: GET /api/v1/groups/one/students/{groupId}
function parseGroupStudents(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.students)) return data.students;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.data)) return data.data;
  if (data.data && typeof data.data === 'object') {
    if (Array.isArray(data.data.students)) return data.data.students;
    if (Array.isArray(data.data.items)) return data.data.items;
    if (Array.isArray(data.data.results)) return data.data.results;
  }
  return [];
}

// YYYY-MM-DD formatini chiroyli ko'rsatish
function fmtDisplayDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
    return d.getFullYear() + ' ' + months[d.getMonth()] + ' ' + String(d.getDate()).padStart(2,'0');
  } catch { return dateStr; }
}

// Toggle switch komponenti
function Toggle({ checked, onChange, disabled }) {
  return (
    <div
      onClick={disabled ? undefined : onChange}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? '#7c4dff' : '#d1d5db',
        position: 'relative', transition: 'background 0.2s', opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%', background: 'white',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

const AttendancePage = () => {
  const { id: groupId, date } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: true/false }
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [topicType, setTopicType] = useState('other'); // 'plan' | 'other'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lessonStatus, setLessonStatus] = useState('Dars o\'tilgan'); // 'Dars o\'tilgan' | 'Dars bo\'lmagan'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingLessonId, setExistingLessonId] = useState(null);

  // Bugun yoki o'tgan kun tekshiruvi
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const dateObj = new Date(date + 'T00:00:00');
  const isPast = dateObj < today;
  const isToday = dateObj.toDateString() === new Date().toDateString();
  const canEdit = isPast || isToday; // faqat o'tgan va bugun

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    const headers = { Authorization: 'Bearer ' + token };

    Promise.all([
      // Group ma'lumotlari
      fetch(BASE + '/groups/' + groupId, { headers })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      // Guruh talabalari
      fetch(BASE + '/groups/one/students/' + groupId, { headers })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      // Bugungi lesson bormi
      fetch(BASE + '/groups/' + groupId + '/lesson?date=' + date, { headers })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ]).then(function([groupData, studentsData, lessonData]) {
      if (groupData) {
        setGroup(groupData.data || groupData);
      }
      if (studentsData) {
        let list = parseGroupStudents(studentsData);
        if (!list.length && groupData) {
          list = parseGroupStudents(groupData);
          if (!list.length && Array.isArray(groupData.students)) list = groupData.students;
        }
        setStudents(list);
        const init = {};
        list.forEach(s => { if (s && s.id != null) init[s.id] = false; });
        setAttendance(init);
      } else if (groupData) {
        let list = parseGroupStudents(groupData);
        if (!list.length && Array.isArray(groupData.students)) list = groupData.students;
        if (list.length > 0) {
          setStudents(list);
          const init = {};
          list.forEach(s => { if (s && s.id != null) init[s.id] = false; });
          setAttendance(init);
        }
      }
      // Mavjud lesson va davomat
      if (lessonData) {
        const lesson = lessonData.data || lessonData;
        if (lesson && lesson.id) {
          setExistingLessonId(lesson.id);
          setTopic(lesson.topic || '');
          setDescription(lesson.description || '');
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [groupId, date]);

  const teacherName = group?.teachers?.[0]?.full_name || group?.teachers?.[0]?.name || "O'qituvchi";
  const teacherPhoto = group?.teachers?.[0]?.photo || null;

  const handleToggle = (studentId) => {
    if (!canEdit) return;
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleSaveAttendance = async () => {
    if (!canEdit) return;
    if (!topic.trim()) { setError("Mavzuni kiriting!"); return; }
    setSaving(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };

    try {
      // 1. Shu sanada lesson bor-yo'qligini tekshiramiz
      // GET /api/v1/groups/{groupId}/lesson?date=YYYY-MM-DD
      let lessonId = existingLessonId;
      if (!lessonId) {
        try {
          const checkRes = await fetch(BASE + '/groups/' + groupId + '/lesson?date=' + date, {
            headers: { Authorization: 'Bearer ' + token }
          });
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            const cStr = JSON.stringify(checkData);
            const cMatch = cStr.match(/"id"\s*:\s*(\d+)/);
            if (cMatch) { lessonId = parseInt(cMatch[1]); setExistingLessonId(lessonId); }
          }
        } catch(e) { /* ignore */ }
      }

      // 2. Lesson yo'q bo'lsa — yangi yaratamiz
      // POST /api/v1/groups/{groupId}/lesson → { group_id, topic, description }
      if (!lessonId) {
        const r = await fetch(BASE + '/groups/' + groupId + '/lesson', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            group_id: Number(groupId),
            topic: topic.trim(),
            description: description.trim() || topic.trim(),
          }),
        });
        if (r.ok) {
          const d = await r.json();
          const lStr = JSON.stringify(d);
          const lMatch = lStr.match(/"id"\s*:\s*(\d+)/);
          if (lMatch) { lessonId = parseInt(lMatch[1]); setExistingLessonId(lessonId); }
        } else {
          const errText = await r.text();
          setError('Lesson yaratishda xatolik: ' + r.status + ' ' + errText);
          setSaving(false);
          return;
        }
      }

      if (!lessonId) {
        setError('Lesson IDsi topilmadi!');
        setSaving(false);
        return;
      }

      // 3. Har bir talaba uchun davomat
      // POST /api/v1/attendance → { group_id, student_id, isPresent }
      const results = await Promise.allSettled(
        students.map(s =>
          fetch(BASE + '/attendance', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              group_id: Number(groupId),
              student_id: s.id,
              isPresent: attendance[s.id] === true,
            }),
          })
        )
      );
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.ok));
      if (failed.length === 0) {
        setSuccess("✓ Davomat muvaffaqiyatli saqlandi!");
      } else if (failed.length < results.length) {
        setSuccess("Qisman saqlandi (" + (results.length - failed.length) + "/" + results.length + ")");
      } else {
        setError("Davomatni saqlashda xatolik yuz berdi.");
      }
    } catch(e) {
      setError('Server bilan ulanishda xatolik: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLessonStatus = () => {
    setLessonStatus(prev => prev === "Dars o'tilgan" ? "Dars bo'lmagan" : "Dars o'tilgan");
  };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:300 }}>
      <svg className="animate-spin h-6 w-6 text-[#7c4dff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ width:24, height:24 }}>
        <circle style={{ opacity:0.25 }} cx="12" cy="12" r="10" stroke="#7c4dff" strokeWidth="4"/>
        <path style={{ opacity:0.75 }} fill="#7c4dff" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  );

  return (
    <div style={{ minHeight:'100%', background:'#f1f5f9' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={() => navigate('/classes/' + groupId)}
          style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:'none', background:'transparent', cursor:'pointer', color:'#1a1a2e' }}>
          <KeyboardArrowLeftOutlined style={{ fontSize:22 }} />
        </button>
      </div>

      {/* Teacher info card */}
      <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', padding:'20px 24px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:'50%', background:'#ede9ff', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {teacherPhoto
                ? <img src={teacherPhoto} alt={teacherName} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontSize:16, fontWeight:700, color:'#7c4dff' }}>{teacherName.charAt(0).toUpperCase()}</span>
              }
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#1a1a2e' }}>{teacherName}</div>
              <div style={{ fontSize:12, color:'#9ca3af' }}>Teacher</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, color:'#9ca3af', fontWeight:500, marginBottom:2 }}>DARS KUNI</div>
              <div style={{ fontSize:13.5, fontWeight:700, color:'#1a1a2e' }}>{fmtDisplayDate(date)}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, color:'#9ca3af', fontWeight:500, marginBottom:2 }}>HOLAT</div>
              <button
                onClick={canEdit ? handleLessonStatus : undefined}
                style={{
                  fontSize:13.5, fontWeight:700, cursor: canEdit ? 'pointer' : 'default',
                  color: lessonStatus === "Dars o'tilgan" ? '#16a34a' : '#ef4444',
                  background:'none', border:'none', padding:0,
                }}
              >
                {lessonStatus}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Topic input */}
      <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', padding:'20px 24px', marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#1a1a2e', marginBottom:14 }}>Yo'qlama va mavzu kiritish</div>

        {/* Topic type radio */}
        <div style={{ display:'flex', gap:20, marginBottom:14 }}>
          {[{val:'plan', label:"O'quv reja bo'yicha"}, {val:'other', label:'Boshqa'}].map(opt => (
            <label key={opt.val} style={{ display:'flex', alignItems:'center', gap:6, cursor: canEdit ? 'pointer' : 'default', fontSize:13 }}>
              <input type="radio" name="topicType" value={opt.val} checked={topicType === opt.val}
                onChange={() => canEdit && setTopicType(opt.val)}
                disabled={!canEdit}
                style={{ accentColor:'#7c4dff', width:15, height:15 }} />
              <span style={{ color: topicType === opt.val ? '#7c4dff' : '#6b7280', fontWeight: topicType === opt.val ? 600 : 400 }}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>

        {/* Mavzu */}
        <div style={{ marginBottom:12 }}>
          <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:'#ef4444', marginBottom:6 }}>* Mavzu</label>
          <input
            type="text"
            placeholder="Mavzu kiritib bo'lingan"
            value={topic}
            onChange={e => canEdit && setTopic(e.target.value)}
            disabled={!canEdit}
            style={{
              width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #e5e7eb',
              fontSize:13, outline:'none', boxSizing:'border-box', background: canEdit ? 'white' : '#f9fafb',
              color:'#1a1a2e', opacity: canEdit ? 1 : 0.6,
            }}
          />
        </div>

        {/* Tavsif */}
        <div style={{ marginBottom:0 }}>
          <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:'#6b7280', marginBottom:6 }}>Tavsif (ixtiyoriy)</label>
          <textarea
            placeholder="Tavsif kiritib bo'lingan"
            value={description}
            onChange={e => canEdit && setDescription(e.target.value)}
            disabled={!canEdit}
            rows={4}
            style={{
              width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #e5e7eb',
              fontSize:13, outline:'none', resize:'none', fontFamily:'inherit', boxSizing:'border-box',
              background: canEdit ? 'white' : '#f9fafb', color:'#1a1a2e', opacity: canEdit ? 1 : 0.6,
            }}
          />
        </div>
      </div>

      {/* Students attendance table */}
      <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', overflow:'hidden', marginBottom:16 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #f1f1f5', background:'#fafafa' }}>
              <th style={{ padding:'12px 20px', textAlign:'left', fontWeight:600, color:'#9ca3af', fontSize:12, width:40 }}>#</th>
              <th style={{ padding:'12px 16px', textAlign:'left', fontWeight:600, color:'#374151', fontSize:12 }}>O'quvchi ismi</th>
              <th style={{ padding:'12px 20px', textAlign:'right', fontWeight:600, color:'#374151', fontSize:12 }}>Keldi</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={3} style={{ padding:'40px', textAlign:'center', color:'#9ca3af', fontSize:13 }}>Talabalar yo'q</td></tr>
            ) : students.map((s, idx) => {
              const name = s.full_name || ((s.first_name||'') + ' ' + (s.last_name||'')).trim() || s.name || "Noma'lum";
              const isPresent = attendance[s.id] === true;
              return (
                <tr key={s.id || idx} style={{ borderBottom:'1px solid #f5f5f7' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fafafa'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}>
                  <td style={{ padding:'14px 20px', color:'#9ca3af', fontWeight:500 }}>{idx + 1}</td>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'#ede9ff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, color:'#7c4dff', flexShrink:0 }}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight:600, color:'#1a1a2e' }}>{name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'14px 20px', textAlign:'right' }}>
                    <Toggle
                      checked={isPresent}
                      onChange={() => handleToggle(s.id)}
                      disabled={!canEdit}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Error / Success */}
      {error && (
        <div style={{ marginBottom:12, padding:'10px 16px', background:'#fee2e2', borderRadius:8, color:'#dc2626', fontSize:13, fontWeight:500 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ marginBottom:12, padding:'10px 16px', background:'#dcfce7', borderRadius:8, color:'#16a34a', fontSize:13, fontWeight:600 }}>
          {success}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:12, paddingBottom:32 }}>
        <button
          onClick={canEdit ? handleSaveAttendance : undefined}
          disabled={!canEdit || saving}
          style={{
            padding:'10px 28px', borderRadius:10, border:'none',
            background: canEdit ? '#7c4dff' : '#d1d5db',
            color: 'white', fontSize:13.5, fontWeight:600,
            cursor: canEdit && !saving ? 'pointer' : 'not-allowed',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saqlanmoqda...' : 'Davomatni saqlash'}
        </button>
        <button
          onClick={canEdit ? handleLessonStatus : undefined}
          disabled={!canEdit}
          style={{
            padding:'10px 28px', borderRadius:10,
            border: '1.5px solid ' + (lessonStatus === "Dars o'tilgan" ? '#16a34a' : '#ef4444'),
            background: 'white',
            color: lessonStatus === "Dars o'tilgan" ? '#16a34a' : '#ef4444',
            fontSize:13.5, fontWeight:600,
            cursor: canEdit ? 'pointer' : 'not-allowed',
          }}
        >
          {lessonStatus}
        </button>
      </div>

      {!canEdit && (
        <div style={{ textAlign:'center', padding:'12px', color:'#9ca3af', fontSize:12.5, marginTop:-16 }}>
          Bu sana uchun davomat qilib bo'lmaydi (kelajak sana)
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
