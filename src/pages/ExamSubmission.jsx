import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BASE = 'https://najot-edu.softwareengineer.uz/api/v1';

// Mock imtihon ma'lumotlari
const MOCK_EXAMS = {
  1: {
    id: 1,
    title: 'React JS asoslari va React Router',
    description: 'crm loyihasi\n1. backend github link\n2. frontend github link',
    students: [
      { id: 101, name: "Dilshodbek O'ktamjon o'g'li Tokhirov", submittedAt: '2026-04-24T12:56:00', status: 'CHECKED',  grade: 65, content: '1.https://github.com/dilshod-tokhirov/CRM-Backend\n2.https://github.com/dilshod-tokhirov/CRM-Frontend' },
      { id: 102, name: 'Malika Yusupova',                       submittedAt: '2026-04-25T10:20:00', status: 'PENDING',  grade: null, content: 'https://github.com/malika/project' },
      { id: 103, name: "Jasur Toshmatov",                       submittedAt: '2026-04-25T14:00:00', status: 'ACCEPTED', grade: 78,  content: 'github.com/jasur/crm-app' },
      { id: 104, name: "Nilufar Ergasheva",                     submittedAt: '2026-04-26T09:15:00', status: 'REJECTED', grade: 45,  content: 'Topshiriqni bajardim' },
      { id: 105, name: "Bobur Mirzayev",                        submittedAt: '2026-04-26T16:30:00', status: 'PENDING',  grade: null, content: '' },
    ],
  },
  2: {
    id: 2,
    title: 'JavaScript ES6+ va Async/Await',
    description: 'ES6 loyihasi\n1. GitHub repository link\n2. Deploy link',
    students: [
      { id: 201, name: 'Aziz Karimov',   submittedAt: '2026-05-10T11:00:00', status: 'PENDING',  grade: null, content: 'https://github.com/aziz/js-project' },
      { id: 202, name: 'Zulfiya Nazarova',submittedAt: '2026-05-11T09:30:00', status: 'ACCEPTED', grade: 82,  content: 'github.com/zulfiya/async-app' },
    ],
  },
  3: {
    id: 3,
    title: 'CSS Grid va Flexbox',
    description: 'CSS loyihasi\n1. Figma link\n2. GitHub link',
    students: [
      { id: 301, name: 'Sherzod Umarov', submittedAt: '2026-04-30T10:00:00', status: 'PENDING', grade: null, content: 'github.com/sherzod/css-project' },
    ],
  },
};

function fmtDate(str) {
  if (!str) return '—';
  try {
    const d = new Date(str);
    if (isNaN(d)) return String(str);
    const m = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    return `${d.getDate()} ${m[d.getMonth()]}, ${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch { return String(str); }
}

// Status tab'lari
const STATUS_TABS = [
  { key: 'PENDING',  label: 'Kutayotganlar',     color: '#f59e0b', bg: '#fef9c3' },
  { key: 'REJECTED', label: 'Qaytarilganlar',    color: '#ef4444', bg: '#fee2e2' },
  { key: 'ACCEPTED', label: 'Qabul qilinganlar', color: '#16a34a', bg: '#dcfce7' },
  { key: 'CHECKED',  label: 'Tekshirilgan',      color: '#9ca3af', bg: '#f3f4f6' },
];

// ── Imtihon ro'yxati sahifasi (ExamDetail replacement) ────────────────────────
function ExamListPage({ groupId, examId, navigate }) {
  const exam = MOCK_EXAMS[Number(examId)];
  const [activeTab, setActiveTab] = useState('PENDING');

  if (!exam) return (
    <div style={{ paddingBottom: 24 }}>
      <button onClick={() => navigate(`/classes/${groupId}`)}
        style={{ color: '#3b7cf7', fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20 }}>
        ← Orqaga
      </button>
      <div style={{ background: 'white', borderRadius: 12, padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
        Imtihon topilmadi
      </div>
    </div>
  );

  const getByStatus = (status) => exam.students.filter(s => s.status === status);
  const counts = {};
  STATUS_TABS.forEach(tab => { counts[tab.key] = getByStatus(tab.key).length; });
  const currentList = getByStatus(activeTab);

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate(`/classes/${groupId}`)}
          style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}>
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>{exam.title}</h1>
      </div>

      {/* Info card */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: 20, marginBottom: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>Mavzu</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{exam.title}</p>
        </div>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>Jami talabalar</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{exam.students.length} ta</p>
        </div>
      </div>

      {/* Tabs + Table */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f1f5', overflowX: 'auto' }}>
          {STATUS_TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count = counts[tab.key] ?? 0;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '14px 20px', background: 'transparent', border: 'none',
                  borderBottom: isActive ? `2.5px solid ${tab.color}` : '2.5px solid transparent',
                  marginBottom: -1, cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
                  color: isActive ? tab.color : '#6b7280', whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                {tab.label}
                {count > 0 && (
                  <span style={{ minWidth: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, padding: '0 4px', background: tab.bg, color: tab.color }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {currentList.length === 0 ? (
          <div style={{ padding: '56px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            Bu bo'limda talabalar yo'q
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f1f5' }}>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>O'quvchi ismi</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>Topshirilgan vaqt</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>Status</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>Ball</th>
                <th style={{ padding: '12px 16px', width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {currentList.map((student) => {
                const statusInfo = { PENDING: { label: 'Kutayotgan', bg: '#fff7ed', color: '#f97316' }, ACCEPTED: { label: 'Qabul qilingan', bg: '#dcfce7', color: '#16a34a' }, REJECTED: { label: 'Qaytarilgan', bg: '#fee2e2', color: '#ef4444' }, CHECKED: { label: 'Tekshirilgan', bg: '#ede9ff', color: '#7c4dff' } };
                const si = statusInfo[student.status] || statusInfo.PENDING;
                return (
                  <tr key={student.id}
                    style={{ borderBottom: '1px solid #f5f5f7', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    onClick={() => navigate(`/classes/${groupId}/exam/${examId}/submission/${student.id}`)}>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ede9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#7c4dff', flexShrink: 0 }}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ color: '#3b7cf7', fontWeight: 600, fontSize: 13 }}>{student.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px', color: '#4b5563', fontWeight: 500 }}>{fmtDate(student.submittedAt)}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: si.bg, color: si.color }}>{si.label}</span>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      {student.grade != null
                        ? <span style={{ fontWeight: 700, color: student.grade >= 60 ? '#16a34a' : '#ef4444' }}>⚡ {student.grade}</span>
                        : <span style={{ color: '#9ca3af' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <span style={{ color: '#9ca3af', fontSize: 18, cursor: 'pointer' }}>›</span>
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

// ── Talaba javobini tekshirish sahifasi ──────────────────────────────────────
const ExamSubmission = () => {
  const { id: groupId, examId, submissionId } = useParams();
  const navigate = useNavigate();
  const isSubmissionView = !!submissionId;

  // Agar submissionId yo'q bo'lsa — ro'yxat sahifasini ko'rsat
  if (!isSubmissionView) {
    return <ExamListPage groupId={groupId} examId={examId} navigate={navigate} />;
  }

  // Talaba ma'lumotini mock dan olish
  const exam = MOCK_EXAMS[Number(examId)];
  const mockStudent = exam ? exam.students.find(s => String(s.id) === String(submissionId)) : null;

  const [score, setScore] = useState(mockStudent?.grade ?? 0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const goBack = () => navigate(`/classes/${groupId}/exam/${examId}`);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');

    // API ga yuborish urinishi
    try {
      const token = localStorage.getItem('accessToken');
      if (token && mockStudent) {
        const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        await fetch(`${BASE}/group/${groupId}/homework/${examId}/check`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ grade: Number(score), title: comment || exam?.title || 'Baholandi', homework_answer_id: Number(mockStudent.id) }),
        }).catch(() => {});
      }
    } catch { /* ignore */ }

    // Mock: baholash natijasini saqlash
    if (mockStudent) {
      mockStudent.grade = score;
      mockStudent.status = score >= 60 ? 'ACCEPTED' : 'REJECTED';
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); goBack(); }, 1200);
  };

  if (!mockStudent) return (
    <div style={{ paddingBottom: 24 }}>
      <button onClick={goBack} style={{ color: '#3b7cf7', fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20 }}>← Orqaga</button>
      <div style={{ background: 'white', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>📭</div>
        <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: '#374151' }}>Talaba topilmadi</p>
      </div>
    </div>
  );

  const statusColors = { PENDING: { bg: '#fff7ed', color: '#f97316', label: 'Kutayotgan' }, ACCEPTED: { bg: '#dcfce7', color: '#16a34a', label: 'Qabul qilingan' }, REJECTED: { bg: '#fee2e2', color: '#ef4444', label: 'Qaytarilgan' }, CHECKED: { bg: '#ede9ff', color: '#7c4dff', label: 'Tekshirilgan' } };
  const sc = statusColors[mockStudent.status] || statusColors.PENDING;

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13 }}>
        <button onClick={goBack} style={{ color: '#3b7cf7', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          Kutayotganlar
        </button>
        <span style={{ color: '#9ca3af' }}>›</span>
        <span style={{ color: '#374151', fontWeight: 500 }}>Imtihon</span>
      </div>

      {/* Imtihon vazifasi */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>Imtihon vazifasi</h3>
        <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16 }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Imtihon tobi</p>
          <p style={{ margin: '0 0 10px', fontSize: 13.5, fontWeight: 600, color: '#1a1a2e' }}>{exam?.title}</p>
          {exam?.description && (
            <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{exam.description}</div>
          )}
        </div>
      </div>

      {/* Talaba javobi */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{mockStudent.name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Vaqti: <strong style={{ color: '#374151' }}>{fmtDate(mockStudent.submittedAt)}</strong></span>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Fayllar soni: <strong style={{ color: '#374151' }}>0</strong></span>
            <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.color }}>{sc.label}</span>
          </div>
        </div>
        {mockStudent.content ? (
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Uyga vazifa tobi</p>
            <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{mockStudent.content}</div>
          </div>
        ) : (
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16, fontSize: 13, color: '#9ca3af' }}>Topshiriq yuklanmagan</div>
        )}
      </div>

      {/* Ball berish */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: 24 }}>
        {/* Info */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, marginBottom: 20 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="1.8" />
            <path d="M12 8v4m0 4h.01" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <p style={{ margin: 0, fontSize: 12.5, color: '#1d4ed8', fontWeight: 500 }}>
            60–100 oralig'ida ball qo'yilgan vazifa 'Qabul qilingan', 0–59 oralig'ida ball qo'yilgan vazifa 'Qaytarilgan' hisoblanadi
          </p>
        </div>

        {/* Ball */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a2e' }}>Ball</label>
            <div style={{
              width: 40, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, border: '1.5px solid #e5e7eb', fontWeight: 700, fontSize: 13,
              color: score >= 60 ? '#16a34a' : '#ef4444',
            }}>
              {score}
            </div>
          </div>
          <input
            type="range" min={0} max={100} value={score}
            onChange={e => setScore(Number(e.target.value))}
            style={{
              width: '100%', height: 8, borderRadius: 4, cursor: 'pointer', outline: 'none', appearance: 'none',
              background: `linear-gradient(to right, ${score >= 60 ? '#16a34a' : '#ef4444'} ${score}%, #e5e7eb ${score}%)`,
              accentColor: score >= 60 ? '#16a34a' : '#ef4444',
            }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, position: 'relative' }}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>0</span>
            <span style={{ fontSize: 11, color: '#6b7280', position: 'absolute', left: '60%', transform: 'translateX(-50%)' }}>✦ O'tish ball: 60</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>100</span>
          </div>
          {/* O'tish holati */}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: score >= 60 ? '#16a34a' : '#ef4444', padding: '4px 14px', borderRadius: 20, background: score >= 60 ? '#dcfce7' : '#fee2e2' }}>
              {score >= 60 ? '✓ O\'tadi' : '✕ O\'tmaydi'}
            </span>
          </div>
        </div>

        {/* Izoh */}
        <div style={{ marginBottom: 20 }}>
          <textarea
            value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Izohingiz (ixtiyoriy)" rows={4}
            style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#1a1a2e', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>

        {saveError && (
          <div style={{ marginBottom: 16, padding: '10px 16px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
            {saveError}
          </div>
        )}

        {saved && (
          <div style={{ marginBottom: 16, padding: '10px 16px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 8, color: '#16a34a', fontSize: 13, fontWeight: 600 }}>
            ✓ Muvaffaqiyatli saqlandi! {score >= 60 ? "Qabul qilingan" : "Qaytarilgan"}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={goBack}
            style={{ padding: '10px 24px', borderRadius: 10, border: '1.5px solid #d1d5db', background: 'white', color: '#374151', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
            Bekor qilish
          </button>
          <button onClick={handleSave} disabled={saving || saved}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: saving ? '#9ca3af' : score >= 60 ? '#16a34a' : '#ef4444',
              color: 'white', fontSize: 13.5, fontWeight: 600,
              cursor: (saving || saved) ? 'not-allowed' : 'pointer',
            }}>
            {saving ? 'Saqlanmoqda...' : saved ? 'Saqlandi ✓' : score >= 60 ? 'Qabul qilish' : 'Qaytarish'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamSubmission;
