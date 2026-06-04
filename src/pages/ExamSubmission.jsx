import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BASE = 'https://najot-edu.softwareengineer.uz/api/v1';

function fmtDate(str) {
  if (!str) return '—';
  try {
    const d = new Date(str);
    if (isNaN(d)) return str;
    const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d.getDate()} ${m[d.getMonth()]}, ${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  } catch { return str; }
}

// Swagger: POST /api/v1/group/{groupId}/homework/{homeworkId}/check
// body: { grade, title, homework_answer_id }

const ExamSubmission = () => {
  const { id: groupId, examId: homeworkId, submissionId: studentId } = useParams();
  const navigate = useNavigate();

  const [homework, setHomework] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      // Homework ma'lumotlari
      fetch(`${BASE}/homework/${groupId}`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          let list = Array.isArray(data) ? data : (data?.data || data?.homeworks || []);
          return list.find(h => String(h.id) === String(homeworkId)) || null;
        })
        .catch(() => null),

      // Talaba natijasi: GET /api/v1/group/{groupId}/homework/{homeworkId}/result/{studentId}
      fetch(`${BASE}/group/${groupId}/homework/${homeworkId}/result/${studentId}`, { headers })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ]).then(([hw, res]) => {
      if (hw) setHomework(hw);
      if (res) {
        const data = res.data || res;
        setResult(data);
        setScore(data.grade ?? data.score ?? data.ball ?? 0);
        setComment(data.comment || data.note || '');
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [groupId, homeworkId, studentId]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    try {
      // POST /api/v1/group/{groupId}/homework/{homeworkId}/check
      // Swagger: body: { grade: number, title: string, homework_answer_id: number }
      const answerId = result?.id || result?.homework_answer_id || result?.answer_id || result?.homeworkAnswerId;
      if (!answerId) {
        setError("Talabaning javob IDsi topilmadi. Avval talaba javob yuborishi kerak.");
        setSaving(false);
        return;
      }
      const body = {
        grade: Number(score),
        title: comment || homework?.title || 'Baholandi',
        homework_answer_id: Number(answerId),
      };

      const res = await fetch(`${BASE}/group/${groupId}/homework/${homeworkId}/check`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        navigate(`/classes/${groupId}/exam/${homeworkId}`);
      } else {
        try {
          const err = await res.json();
          setError(err.message || `Xatolik: ${res.status}`);
        } catch {
          setError(`Xatolik: ${res.status}`);
        }
      }
    } catch {
      setError('Server bilan ulanishda xatolik!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin h-6 w-6 text-[#7c4dff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  );

  const hwTitle = homework?.title || homework?.name || 'Imtihon';
  const hwDesc = homework?.description || homework?.content || '';
  const studentName = result?.student
    ? (result.student.full_name || `${result.student.first_name || ''} ${result.student.last_name || ''}`.trim() || result.student.name || 'Talaba')
    : (result?.student_name || 'Talaba');
  const submittedAt = fmtDate(result?.submitted_at || result?.created_at || result?.createdAt);
  const filesCount = result?.files?.length ?? result?.file_count ?? 0;
  const rawStatus = (result?.status || 'pending').toUpperCase();
  const statusMap = { PENDING: 'Kutayotgan', ACCEPTED: 'Qabul qilingan', REJECTED: 'Qaytarilgan', CHECKED: 'Tekshirilgan' };
  const statusLabel = statusMap[rawStatus] || 'Kutayotgan';
  const statusColors = {
    'Kutayotgan': { bg: '#fff7ed', color: '#f97316' },
    'Qabul qilingan': { bg: '#dcfce7', color: '#16a34a' },
    'Qaytarilgan': { bg: '#fee2e2', color: '#ef4444' },
    'Tekshirilgan': { bg: '#ede9ff', color: '#7c4dff' },
  };
  const sc = statusColors[statusLabel] || { bg: '#f3f4f6', color: '#6b7280' };
  const submissionContent = result?.content || result?.answer || result?.title || result?.description || '';
  const submissionFiles = result?.files || (result?.file_url ? [{ url: result.file_url, name: 'Fayl' }] : []);

  return (
    <div className="min-h-full bg-[#f1f5f9]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5 text-[13px]">
        <button onClick={() => navigate(`/classes/${groupId}/exam/${homeworkId}`)}
          className="text-[#3b7cf7] font-semibold bg-transparent border-none cursor-pointer hover:underline p-0">
          Kutayotganlar
        </button>
        <span className="text-[#9ca3af]">›</span>
        <span className="text-[#374151] font-medium">Imtihon</span>
      </div>

      {/* Imtihon vazifasi */}
      <div className="bg-white rounded-[12px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-6 mb-5">
        <h3 className="m-0 mb-4 text-[15px] font-bold text-[#1a1a2e]">Imtihon vazifasi</h3>
        <div className="bg-[#f9fafb] rounded-[10px] p-4">
          <p className="m-0 mb-2 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Imtihon tobi</p>
          <p className="m-0 text-[13.5px] text-[#1a1a2e] font-semibold mb-2">{hwTitle}</p>
          {hwDesc && <div className="text-[13px] text-[#374151] whitespace-pre-wrap leading-relaxed">{hwDesc}</div>}
        </div>
      </div>

      {/* Talaba javobi */}
      <div className="bg-white rounded-[12px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-6 mb-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="m-0 text-[15px] font-bold text-[#1a1a2e]">{studentName}</h3>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[12px] text-[#9ca3af]">Vaqti: <span className="font-semibold text-[#374151]">{submittedAt}</span></span>
            <span className="text-[12px] text-[#9ca3af]">Fayllar soni: <span className="font-semibold text-[#374151]">{filesCount}</span></span>
            <span className="px-3 py-1 rounded-[6px] text-[12px] font-bold" style={{ background: sc.bg, color: sc.color }}>
              {statusLabel}
            </span>
          </div>
        </div>

        {submissionContent ? (
          <div className="bg-[#f9fafb] rounded-[10px] p-4">
            <p className="m-0 mb-2 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Uyga vazifa tobi</p>
            <div className="text-[13px] text-[#374151] whitespace-pre-wrap leading-relaxed">{submissionContent}</div>
          </div>
        ) : submissionFiles.length > 0 ? (
          <div className="bg-[#f9fafb] rounded-[10px] p-4">
            <p className="m-0 mb-3 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Yuborilgan fayllar</p>
            <div className="flex flex-col gap-2">
              {submissionFiles.map((f, i) => (
                <a key={i} href={f.url || f.file_url || f} target="_blank" rel="noreferrer"
                  className="text-[#3b7cf7] text-[13px] font-medium hover:underline">
                  {f.name || f.filename || `Fayl ${i + 1}`}
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#f9fafb] rounded-[10px] p-4 text-[13px] text-[#9ca3af]">
            Topshiriq yuklanmagan
          </div>
        )}
      </div>

      {/* Ball berish */}
      <div className="bg-white rounded-[12px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-6">
        {/* Info */}
        <div className="flex items-start gap-2.5 px-4 py-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] mb-5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="1.8"/>
            <path d="M12 8v4m0 4h.01" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <p className="m-0 text-[12.5px] text-[#1d4ed8] font-medium">
            60-100 oralig'ida ball qo'yilgan vazifa 'Qabul qilingan', 0-59 oralig'ida ball qo'yilgan vazifa 'Qaytarilgan' hisoblanadi
          </p>
        </div>

        {/* Slider */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[13.5px] font-semibold text-[#1a1a2e]">Ball</label>
            <div className="w-10 h-8 flex items-center justify-center rounded-[8px] border-[1.5px] border-[#e5e7eb] font-bold text-[13px] text-[#1a1a2e]">
              {score}
            </div>
          </div>
          <input type="range" min={0} max={100} value={score}
            onChange={e => setScore(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, ${Number(score) >= 60 ? '#16a34a' : '#ef4444'} ${score}%, #e5e7eb ${score}%)`, accentColor: Number(score) >= 60 ? '#16a34a' : '#ef4444' }} />
          <div className="flex justify-between mt-1.5 relative">
            <span className="text-[11px] text-[#9ca3af]">0</span>
            <span className="text-[11px] text-[#9ca3af] absolute left-[60%] -translate-x-1/2">✦ O'tish ball: 60</span>
            <span className="text-[11px] text-[#9ca3af]">100</span>
          </div>
        </div>

        {/* Izoh */}
        <div className="mb-5">
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Izohingiz" rows={4}
            className="w-full px-4 py-3 border-[1.5px] border-[#e5e7eb] rounded-[10px] text-[13px] text-[#1a1a2e] placeholder-[#9ca3af] outline-none resize-none focus:border-[#7c4dff] transition-colors font-inherit" />
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 bg-[#fee2e2] border border-[#fecaca] rounded-[8px] text-[#dc2626] text-[13px]">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button onClick={() => navigate(`/classes/${groupId}/exam/${homeworkId}`)}
            className="px-6 py-[10px] rounded-[10px] border-[1.5px] border-[#d1d5db] bg-white text-[#374151] text-[13.5px] font-semibold cursor-pointer hover:bg-[#f3f4f6] transition-colors">
            Bekor qilish
          </button>
          <button onClick={handleSave} disabled={saving}
            className={`px-6 py-[10px] rounded-[10px] border-none text-white text-[13.5px] font-semibold transition-all ${!saving ? 'bg-[#16a34a] cursor-pointer hover:opacity-90' : 'bg-[#9ca3af] cursor-not-allowed'}`}>
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Saqlanmoqda...
              </span>
            ) : 'Qoytarish'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamSubmission;
