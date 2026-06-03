import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SearchOutlined, CloseOutlined } from '@mui/icons-material';

const BASE = 'https://najot-edu.softwareengineer.uz/api/v1';

const AddStudentsToGroup = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [allStudents, setAllStudents] = useState([]);
  const [groupStudentIds, setGroupStudentIds] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      // Barcha talabalar
      fetch(`${BASE}/students?page=1&limit=1000`, { headers })
        .then(r => r.ok ? r.json() : null),
      // Guruhda allaqachon bor talabalar
      fetch(`${BASE}/groups/one/students/${id}`, { headers })
        .then(r => r.ok ? r.json() : null),
    ]).then(([studentsData, groupStudents]) => {
      let allList = [];
      if (Array.isArray(studentsData)) allList = studentsData;
      else if (studentsData && Array.isArray(studentsData.data)) allList = studentsData.data;
      else if (studentsData && Array.isArray(studentsData.students)) allList = studentsData.students;
      else if (studentsData && Array.isArray(studentsData.items)) allList = studentsData.items;

      setAllStudents(allList.map(s => ({
        id: s.id,
        name: s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || '',
      })));

      let groupIds = [];
      if (Array.isArray(groupStudents)) groupIds = groupStudents.map(s => s.id);
      else if (groupStudents && Array.isArray(groupStudents.students)) groupIds = groupStudents.students.map(s => s.id);
      setGroupStudentIds(groupIds);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const filteredStudents = allStudents.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !groupStudentIds.includes(s.id)
  );

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(i => i !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSave = async () => {
    if (selectedStudents.length === 0) return;
    setSaving(true);
    setError('');
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    try {
      // POST /api/v1/groups/{id}/students
      const res = await fetch(`${BASE}/groups/${id}/students`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ students: selectedStudents }),
      });
      if (res.ok) {
        navigate(`/classes/${id}`);
      } else {
        // Fallback: har bir talabani alohida qo'shamiz
        let anyOk = false;
        await Promise.all(selectedStudents.map(async (sid) => {
          try {
            const r = await fetch(`${BASE}/groups/${id}/students`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ student_id: sid }),
            });
            if (r.ok) anyOk = true;
          } catch { /* ignore */ }
        }));
        if (anyOk) navigate(`/classes/${id}`);
        else {
          try { const err = await res.json(); setError(err.message || `Xatolik: ${res.status}`); }
          catch { setError(`Xatolik: ${res.status}`); }
        }
      }
    } catch {
      setError('Server bilan ulanishda xatolik!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.15)] max-w-[480px] w-full overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e5e7eb] flex items-start justify-between shrink-0">
          <div>
            <h2 className="m-0 text-[20px] font-bold text-[#1a1a2e] mb-1">Talaba qo'shish</h2>
            <p className="m-0 text-[13px] text-[#6b7280]">Bitta yoki bir nechta talabani tanlang</p>
          </div>
          <button
            onClick={() => navigate(`/classes/${id}`)}
            className="bg-transparent border-none cursor-pointer text-[#9ca3af] hover:text-[#1a1a2e] p-1 flex"
          >
            <CloseOutlined style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-[#e5e7eb] shrink-0">
          <div className="relative">
            <SearchOutlined
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#9ca3af' }}
            />
            <input
              type="text"
              placeholder="Talaba qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 bg-[#f9fafb] border border-[#e5e7eb] rounded-[10px] text-[13px] text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none focus:border-[#7c4dff] focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-3 px-4 py-2.5 bg-[#fee2e2] border border-[#fecaca] rounded-[8px] text-[#dc2626] text-[13px] font-medium shrink-0">
            {error}
          </div>
        )}

        {/* Students List */}
        <div className="overflow-y-auto flex-1 border-b border-[#e5e7eb]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-[#9ca3af] text-[13px]">
              <svg className="animate-spin h-4 w-4 text-[#7c4dff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Yuklanmoqda...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="px-6 py-10 text-center text-[#9ca3af] text-[13px]">
              {searchQuery ? 'Talaba topilmadi' : 'Barcha talabalar guruhda mavjud'}
            </div>
          ) : (
            <div>
              {filteredStudents.map(student => {
                const isSelected = selectedStudents.includes(student.id);
                return (
                  <div
                    key={student.id}
                    onClick={() => toggleStudent(student.id)}
                    className={`px-6 py-3 cursor-pointer flex items-center gap-3 border-b border-[#f3f4f6] transition-colors ${isSelected ? 'bg-[#f5f0ff]' : 'hover:bg-[#f9fafb]'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => { e.stopPropagation(); toggleStudent(student.id); }}
                      className="w-4 h-4 rounded cursor-pointer accent-[#7c4dff]"
                    />
                    <div className="w-8 h-8 rounded-full bg-[#ede9ff] flex items-center justify-center font-bold text-[13px] text-[#7c4dff] shrink-0">
                      {student.name?.charAt(0)?.toUpperCase() || 'T'}
                    </div>
                    <span className="text-[13px] text-[#1a1a2e] font-medium">{student.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between bg-[#f9fafb] shrink-0">
          <span className="text-[13px] text-[#6b7280]">
            {selectedStudents.length > 0 && (
              <span className="font-semibold text-[#7c4dff]">{selectedStudents.length} ta tanlandi</span>
            )}
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/classes/${id}`)}
              className="px-5 py-2 rounded-[10px] border border-[#d1d5db] bg-white text-[#1a1a2e] font-semibold text-[13px] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleSave}
              disabled={selectedStudents.length === 0 || saving}
              className={`px-5 py-2 rounded-[10px] border-none font-semibold text-[13px] transition-all cursor-pointer ${selectedStudents.length > 0 && !saving ? 'bg-[#7c4dff] text-white hover:opacity-90' : 'bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed'}`}
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saqlanmoqda...
                </span>
              ) : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudentsToGroup;
