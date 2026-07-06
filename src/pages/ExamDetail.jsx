import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KeyboardArrowLeftOutlined, EditOutlined } from '@mui/icons-material';

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

// Swagger: status = ACCEPTED | REJECTED | PENDING | CHECKED
const SUBTABS = [
  { label: 'Kutayotganlar', status: 'PENDING' },
  { label: 'Qaytarilganlar', status: 'REJECTED' },
  { label: 'Qabul qilinganlar', status: 'ACCEPTED' },
  { label: 'Bajarilmagan', status: null },
];

async function fetchGroupStudents(groupId, headers) {
  let list = [];
  const role = localStorage.getItem('role');

  if (role !== 'TEACHER') {
    try {
      const r = await fetch(`${BASE}/groups/one/students/${groupId}`, { headers });
      if (r.ok) {
        const data = await r.json();
        if (data) {
          if (Array.isArray(data)) list = data;
          else if (Array.isArray(data.students)) list = data.students;
          else if (Array.isArray(data.items)) list = data.items;
          else if (Array.isArray(data.data)) list = data.data;
          else if (data.data && typeof data.data === 'object') {
            if (Array.isArray(data.data.students)) list = data.data.students;
            else if (Array.isArray(data.data.items)) list = data.data.items;
          }
        }
      }
    } catch {}
  }

  if (list.length === 0) {
    try {
      const r = await fetch(`${BASE}/groups/${groupId}`, { headers });
      if (r.ok) {
        const data = await r.json();
        const d = data.data || data;
        if (d && Array.isArray(d.students)) list = d.students;
        else if (d) {
          if (Array.isArray(d.items)) list = d.items;
          else if (Array.isArray(d.data)) list = d.data;
        }
      }
    } catch {}
  }

  if (list.length === 0 && role !== 'TEACHER') {
    try {
      const r2 = await fetch(`${BASE}/student-group/all`, { headers });
      if (r2.ok) {
        const sgData = await r2.json();
        const all = Array.isArray(sgData) ? sgData : (sgData?.data || sgData?.items || []);
        const matched = all.filter(sg => {
          const gid = sg.group_id || sg.group?.id;
          return String(gid) === String(groupId);
        });
        list = matched.map(sg => sg.student || sg).filter(s => s && s.id != null);
      }
    } catch {}
  }

  const seen = new Set();
  return list.filter(s => {
    const sid = s?.student?.id || s?.student_id || s?.id;
    if (!sid || seen.has(sid)) return false;
    seen.add(sid);
    return true;
  });
}

const ExamDetail = () => {
  const { id: groupId, examId: homeworkId } = useParams();
  const navigate = useNavigate();
  const [homework, setHomework] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Kutayotganlar');

  const fetchResults = async (status) => {
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: `Bearer ${token}` };
    setLoading(true);

    try {
      const groupStudents = await fetchGroupStudents(groupId, headers);
      const groupStudentIds = new Set(groupStudents.map(s => s.student?.id || s.student_id || s.studentId || s.id).filter(Boolean));

      if (status === null) {
        // "Bajarilmagan" uchun — guruhdagi barcha o'quvchilardan topshirganlarini chegirib tashlaymiz
        const allResultsRaw = await fetch(`${BASE}/group/${groupId}/homework/${homeworkId}/results`, { headers }).then(r => r.ok ? r.json() : []);

        let allResults = [];
        const resData = allResultsRaw.data || allResultsRaw;
        if (Array.isArray(resData)) allResults = resData;
        else if (resData && Array.isArray(resData.data)) allResults = resData.data;

        // Deduplicate submissions
        const submittedIds = new Set();
        allResults.forEach(item => {
          const sid = item.student?.id || item.student_id || item.id;
          if (sid) submittedIds.add(sid);
        });

        // Unsubmitted students list
        const list = groupStudents
          .filter(item => {
            const sid = item.student?.id || item.student_id || item.studentId || item.id;
            return sid && !submittedIds.has(sid);
          })
          .map(item => {
            const studentObj = item.student || item;
            return {
              id: studentObj.id,
              student: studentObj,
              status: 'BAJARILMAGAN',
              created_at: null,
            };
          });

        setResults(list);
        setLoading(false);
      } else {
        const url = `${BASE}/group/${groupId}/homework/${homeworkId}/results?status=${status}`;
        const r = await fetch(url, { headers });
        if (r.ok) {
          const data = await r.json();
          let list = [];
          const resData = data.data || data;
          if (Array.isArray(resData)) list = resData;
          else if (resData && Array.isArray(resData.data)) list = resData.data;

          // Filter by group members & deduplicate
          const seen = new Set();
          const filtered = list.filter(item => {
            const studentId = item.student?.id || item.student_id || item.id;
            if (!studentId || !groupStudentIds.has(studentId)) return false;
            if (seen.has(studentId)) return false;
            seen.add(studentId);
            return true;
          });

          setResults(filtered);
        } else {
          setResults([]);
        }
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setResults([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${BASE}/homework/${groupId}?page=1&limit=500`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        let list = Array.isArray(data) ? data : (data?.data || data?.homeworks || []);
        if (!Array.isArray(list)) return;
        const foundLesson = list.find(x => {
          if (String(x.id) === String(homeworkId)) return true;
          if (x.homework && Array.isArray(x.homework)) {
            return x.homework.some(h => String(h.id) === String(homeworkId));
          }
          return false;
        });
        if (foundLesson) {
          const hwItem = foundLesson.homework?.find(h => String(h.id) === String(homeworkId));
          setHomework({
            ...foundLesson,
            title: hwItem?.title || hwItem?.name || hwItem?.topic || foundLesson.topic || 'Imtihon',
            deadline: hwItem?.deadline || foundLesson.deadline || '',
            created_at: hwItem?.created_at || foundLesson.created_at || '',
          });
        }
      })
      .catch(() => {});

    fetchResults('PENDING');
  }, [groupId, homeworkId]);

  const handleTabChange = (tab) => {
    setActiveTab(tab.label);
    fetchResults(tab.status);
  };

  const acceptedCount = SUBTABS.find(t => t.label === 'Qabul qilinganlar') ? null : 0;

  const hwTitle = homework?.title || homework?.name || homework?.topic || 'Imtihon';
  const deadline = homework?.deadline || homework?.end_date || '';
  const createdAt = homework?.created_at || homework?.createdAt || '';
  let timeStr = '';
  if (createdAt && deadline) timeStr = `${fmtDate(createdAt)} - ${fmtDate(deadline)}`;
  else if (deadline) timeStr = fmtDate(deadline);

  return (
    <div className="pb-6 bg-[#f1f5f9]">
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/classes/${groupId}`)}
          className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-transparent border-none cursor-pointer text-[#6b7280] hover:bg-[#e5e7eb] transition-colors">
          <KeyboardArrowLeftOutlined style={{ fontSize: 22 }} />
        </button>
        <h1 className="m-0 text-[22px] font-bold text-[#1a1a2e]">Examination</h1>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-[12px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-6 mb-5 flex items-start justify-between">
        <div className="flex gap-10 flex-wrap">
          <div>
            <p className="m-0 mb-1 text-[12px] text-[#9ca3af] font-medium">Mavzu</p>
            <p className="m-0 text-[15px] font-bold text-[#1a1a2e]">{hwTitle}</p>
          </div>
          {timeStr && (
            <div>
              <p className="m-0 mb-1 text-[12px] text-[#9ca3af] font-medium">Imtihon Vaqti</p>
              <p className="m-0 text-[14px] font-semibold text-[#374151]">{timeStr}</p>
            </div>
          )}
        </div>
        <button className="px-5 py-2 rounded-[8px] border border-[#e5e7eb] bg-white text-[13px] font-semibold text-[#374151] cursor-pointer hover:bg-[#f9fafb] whitespace-nowrap">
          E'lon qilish
        </button>
      </div>

      {/* Tabs + Table */}
      <div className="bg-white rounded-[12px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex border-b border-[#f1f1f5] px-2">
          {SUBTABS.map(tab => {
            const isActive = activeTab === tab.label;
            return (
              <button key={tab.label} onClick={() => handleTabChange(tab)}
                className="relative flex items-center gap-1.5 px-5 py-4 bg-transparent border-none cursor-pointer text-[13.5px] font-semibold transition-colors"
                style={{ color: isActive ? '#7c4dff' : '#6b7280', borderBottom: isActive ? '2.5px solid #7c4dff' : '2.5px solid transparent', marginBottom: '-1px' }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[#9ca3af] text-[13px]">
            <svg className="animate-spin h-4 w-4 text-[#7c4dff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Yuklanmoqda...
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center text-[#9ca3af] text-[13px]">Ma'lumotlar mavjud emas</div>
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
              {results.map((res, idx) => {
                const studentName = res.student
                  ? (res.student.full_name || `${res.student.first_name || ''} ${res.student.last_name || ''}`.trim() || res.student.name || "Noma'lum")
                  : (res.student_name || res.name || "Noma'lum");
                const submittedAt = fmtDate(res.submitted_at || res.created_at || res.createdAt);
                const checkedAt = res.checked_at || res.updated_at ? fmtDate(res.checked_at || res.updated_at) : '—';
                const score = res.grade ?? res.score ?? res.ball;
                const studentId = res.student?.id || res.student_id;
                const submissionId = res.id || res.answer_id || res.homework_answer_id;
                const navId = studentId || submissionId;

                return (
                  <tr key={res.id || idx} className="border-b border-[#f5f5f7] hover:bg-[#fafafa] transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => { if (navId) navigate(`/classes/${groupId}/homework/${homeworkId}/result/${navId}`); }}
                        className="text-[#3b7cf7] font-semibold text-[13px] bg-transparent border-none cursor-pointer hover:underline p-0">
                        {studentName}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-[#4b5563] font-medium">{submittedAt}</td>
                    <td className="px-6 py-4 text-[#4b5563] font-medium">{checkedAt}</td>
                    <td className="px-6 py-4">
                      {score != null ? (
                        <span className="flex items-center gap-1 font-bold text-[#f59e0b]">
                          <span style={{ fontSize: 14 }}>⚡</span> {score}
                        </span>
                      ) : <span className="text-[#9ca3af]">—</span>}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => { if (navId) navigate(`/classes/${groupId}/homework/${homeworkId}/result/${navId}`); }}
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
};

export default ExamDetail;
