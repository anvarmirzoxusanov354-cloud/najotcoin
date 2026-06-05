import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KeyboardArrowLeftOutlined, EditOutlined } from '@mui/icons-material';

const BASE = 'https://najot-edu.softwareengineer.uz/api/v1';
const BASE_STATIC = 'https://najot-edu.softwareengineer.uz';

function getPhotoUrl(photo) {
  if (!photo) return null;
  if (photo.startsWith('http')) return photo;
  if (photo.startsWith('/')) return BASE_STATIC + photo;
  return BASE_STATIC + '/' + photo;
}

function fmtDate(str) {
  if (!str) return '—';
  try {
    const d = new Date(str);
    if (isNaN(d)) return str;
    const m = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
    return `${d.getDate()} ${m[d.getMonth()]}, ${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  } catch { return str; }
}

// GET /api/v1/group/{groupId}/homework/{homeworkId}/results?status=PENDING|REJECTED|ACCEPTED|CHECKED
const STATUS_TABS = [
  { key: 'PENDING',  label: 'Kutayotganlar',    color: '#f59e0b', bg: '#fef9c3' },
  { key: 'REJECTED', label: 'Qaytarilganlar',   color: '#ef4444', bg: '#fee2e2' },
  { key: 'ACCEPTED', label: 'Qabul qilinganlar', color: '#16a34a', bg: '#dcfce7' },
  { key: 'CHECKED',  label: 'Bajarilmagan',      color: '#9ca3af', bg: '#f3f4f6' },
];

export default function HomeworkDetail() {
  const { id: groupId, homeworkId } = useParams();
  const navigate = useNavigate();

  const [homework, setHomework] = useState(null);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [results, setResults] = useState({});
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  // token va headers ni render daqidagi qiymat sifatida olamiz
  const token = localStorage.getItem('accessToken');

  // Homework ma'lumotlarini olish
  useEffect(() => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    fetch(`${BASE}/homework/${groupId}`, { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || data?.homeworks || []);
        const found = list.find(h => String(h.id) === String(homeworkId));
        if (found) setHomework(found);
      })
      .catch(() => {});
  }, [groupId, homeworkId]);

  // Har tab uchun natijalarni yuklaymiz
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const h = { Authorization: `Bearer ${token}` };
    setLoading(true);
    Promise.all(
      STATUS_TABS.map(tab =>
        fetch(`${BASE}/group/${groupId}/homework/${homeworkId}/results?status=${tab.key}`, { headers: h })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            const list = Array.isArray(data) ? data : (data?.data || data?.results || data?.items || []);
            return { key: tab.key, list };
          })
          .catch(() => ({ key: tab.key, list: [] }))
      )
    ).then(allResults => {
      const newResults = {};
      const newCounts = {};
      allResults.forEach(({ key, list }) => {
        newResults[key] = list;
        newCounts[key] = list.length;
      });
      setResults(newResults);
      setCounts(newCounts);
      setLoading(false);
    });
  }, [groupId, homeworkId]);

  const currentList = results[activeTab] || [];
  const hwTitle = homework?.title || homework?.name || homework?.topic || 'Uyga vazifa';
  const deadline = homework?.deadline || homework?.end_date || '';

  return (
    <div className="min-h-full bg-[#f1f5f9]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(`/classes/${groupId}`)}
          className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-transparent border-none cursor-pointer text-[#6b7280] hover:bg-[#e5e7eb] transition-colors">
          <KeyboardArrowLeftOutlined style={{ fontSize: 22 }} />
        </button>
        <h1 className="m-0 text-[22px] font-bold text-[#1a1a2e]">{hwTitle}</h1>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-[12px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-5 mb-5 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="m-0 mb-1 text-[12px] text-[#9ca3af] font-medium">Mavzu</p>
          <p className="m-0 text-[15px] font-bold text-[#1a1a2e]">{hwTitle}</p>
        </div>
        {deadline && (
          <div>
            <p className="m-0 mb-1 text-[12px] text-[#9ca3af] font-medium">Tugash vaqti:</p>
            <p className="m-0 text-[14px] font-semibold text-[#1a1a2e]">{fmtDate(deadline)}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-[12px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex border-b border-[#f1f1f5] overflow-x-auto">
          {STATUS_TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count = counts[tab.key] ?? 0;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-5 py-4 bg-transparent border-none cursor-pointer text-[13.5px] font-semibold whitespace-nowrap transition-colors shrink-0"
                style={{
                  color: isActive ? tab.color : '#6b7280',
                  borderBottom: isActive ? `2.5px solid ${tab.color}` : '2.5px solid transparent',
                  marginBottom: '-1px',
                }}>
                {tab.label}
                {count > 0 && (
                  <span className="min-w-[20px] h-5 rounded-full flex items-center justify-center text-[11px] font-bold px-1"
                    style={{ background: tab.bg, color: tab.color }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[#9ca3af] text-[13px]">
            <svg className="animate-spin h-4 w-4 text-[#7c4dff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Yuklanmoqda...
          </div>
        ) : currentList.length === 0 ? (
          <div className="py-14 text-center text-[#9ca3af] text-[13px]">
            Hali hech kim uyga vazifani jo'hatmagan
          </div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#f1f1f5]">
                <th className="px-6 py-3 text-left font-semibold text-[#6b7280] text-[12px]">O'quvchi ismi</th>
                <th className="px-6 py-3 text-left font-semibold text-[#6b7280] text-[12px]">Topshirilgan vaqt</th>
                <th className="px-6 py-3 text-left font-semibold text-[#6b7280] text-[12px]">Tekshirilgan vaqt</th>
                <th className="px-6 py-3 text-left font-semibold text-[#6b7280] text-[12px]">Ball</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {currentList.map((res, idx) => {
                const studentName = res.student
                  ? (res.student.full_name || `${res.student.first_name || ''} ${res.student.last_name || ''}`.trim() || res.student.name || "Noma'lum")
                  : (res.student_name || res.name || "Noma'lum");
                const studentPhoto = res.student ? getPhotoUrl(res.student.photo || res.student.avatar) : null;
                const studentId = res.student?.id || res.student_id;
                const submittedAt = fmtDate(res.submitted_at || res.created_at || res.createdAt);
                const checkedAt = res.checked_at ? fmtDate(res.checked_at) : '—';
                const score = res.grade ?? res.score ?? res.ball;

                return (
                  <tr key={res.id || idx} className="border-b border-[#f5f5f7] hover:bg-[#fafafa] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#ede9ff] flex items-center justify-center font-bold text-[13px] text-[#7c4dff] shrink-0 overflow-hidden">
                          {studentPhoto
                            ? <img src={studentPhoto} alt={studentName} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                            : studentName.charAt(0).toUpperCase()}
                        </div>
                        <button
                          onClick={() => navigate(`/classes/${groupId}/homework/${homeworkId}/result/${studentId}`)}
                          className="text-[#3b7cf7] font-semibold text-[13px] bg-transparent border-none cursor-pointer hover:underline p-0">
                          {studentName}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#4b5563] font-medium">{submittedAt}</td>
                    <td className="px-6 py-4 text-[#4b5563] font-medium">{checkedAt}</td>
                    <td className="px-6 py-4">
                      {score != null ? (
                        <span className="flex items-center gap-1 font-bold text-[#f59e0b]">
                          <span style={{ fontSize: 14 }}>⚡</span>{score}
                        </span>
                      ) : <span className="text-[#9ca3af]">—</span>}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => navigate(`/classes/${groupId}/homework/${homeworkId}/result/${studentId}`)}
                        className="bg-transparent border-none cursor-pointer text-[#9ca3af] hover:text-[#7c4dff] transition-colors p-1">
                        <EditOutlined style={{ fontSize: 16 }} />
                      </button>
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
