import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  AddOutlined,
  SearchOutlined,
  FilterListOutlined,
  ArchiveOutlined,
  MoreVertOutlined,
  PeopleAltOutlined,
  SchoolOutlined,
  RefreshOutlined,
  KeyboardArrowDownOutlined,
  CloseOutlined,
  AccessTimeOutlined,
  CalendarTodayOutlined
} from '@mui/icons-material';

const WEEKDAYS = [
  { label: 'Dushanba', short: 'Du' },
  { label: 'Seshanba', short: 'Se' },
  { label: 'Chorshanba', short: 'Chor' },
  { label: 'Payshanba', short: 'Pay' },
  { label: 'Juma', short: 'Ju' },
  { label: 'Shanba', short: 'Shan' },
  { label: 'Yakshanba', short: 'Yak' },
];

const Classes = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('Guruhlar');
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [apiTeachers, setApiTeachers] = useState([]);
  const [apiStudents, setApiStudents] = useState([]);
  const [refresh, setRefresh] = useState(0);

  const BASE_URL = 'https://najot-edu.softwareengineer.uz/api/v1';

  // Fetch groups, courses, rooms, teachers, students from API
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const headers = { 'Authorization': 'Bearer ' + token };

    // Groups
    fetch(`${BASE_URL}/groups/all`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && data.data && Array.isArray(data.data.items)) list = data.data.items;
        else if (data && Array.isArray(data.items)) list = data.items;
        else if (data && Array.isArray(data.groups)) list = data.groups;
        else if (data && Array.isArray(data.results)) list = data.results;
        if (list.length > 0) {
          const mapped = list.map(g => ({
            id: g.id,
            status: g.is_active !== false ? 'FAOL' : 'ARXIV',
            name: g.name || g.group_name || '',
            course: g.course ? (typeof g.course === 'object' ? (g.course.name || '') : g.course) : (g.course_name || ''),
            courseId: g.course ? (typeof g.course === 'object' ? g.course.id : null) : null,
            duration: (g.duration || g.duration_month || 6) + ' oy',
            time: g.start_time || g.time || '09:00',
            days: g.week_days || g.days || '',
            room: g.room ? (typeof g.room === 'object' ? (g.room.name || '') : g.room) : (g.room_name || ''),
            roomId: g.room ? (typeof g.room === 'object' ? g.room.id : null) : null,
            teacher: (g.teachers && g.teachers.length > 0) ? (g.teachers[0].full_name || g.teachers[0].name || '') : '',
            teacherIds: g.teachers ? g.teachers.map(t => t.id) : [],
            studentIds: g.students ? g.students.map(s => s.id || s) : [],
            students: g.students_count || (g.students ? g.students.length : 0),
            active: g.is_active !== false,
          }));
          setGroups(mapped);
        }
      })
      .catch(() => {});

    // Courses
    fetch(`${BASE_URL}/courses`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.courses)) list = data.courses;
        setCourses(list.map(c => ({ id: c.id, name: c.name || c.title || '' })));
      })
      .catch(() => {});

    // Rooms
    fetch(`${BASE_URL}/rooms`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.rooms)) list = data.rooms;
        setRooms(list.map(r => ({ id: r.id, name: r.name || '' })));
      })
      .catch(() => {});

    // Teachers
    fetch(`${BASE_URL}/teachers`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.teachers)) list = data.teachers;
        setApiTeachers(list.map(t => ({ id: t.id, name: t.full_name || t.name || '' })));
      })
      .catch(() => {});

    // Students
    fetch(`${BASE_URL}/students?page=1&limit=1000`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.students)) list = data.students;
        else if (data && Array.isArray(data.items)) list = data.items;
        setApiStudents(list.map(s => ({
          id: s.id,
          name: s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || '',
        })));
      })
      .catch(() => {});
  }, [refresh]);
  const [search, setSearch] = useState('');
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [tempSelectedStudents, setTempSelectedStudents] = useState([]);

  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [tempSelectedTeachers, setTempSelectedTeachers] = useState([]);

  const availableTeachers = apiTeachers;
  const availableStudents = apiStudents;

  const [form, setForm] = useState({
    name: '',
    course: '',
    room: '',
    days: [],
    time: '09:00',
    startDate: '',
    description: '',
    students: [],
    teachers: [],
  });

  const openAdd = () => {
    setEditId(null);
    setForm({
      name: '',
      course: '',
      room: '',
      days: [],
      time: '09:00',
      startDate: '',
      description: '',
      students: [],
      teachers: [],
    });
    setDrawerOpen(true);
  };

  const openEdit = (group) => {
    setEditId(group.id);
    
    // Map short days back to full days e.g. "Du, Se" -> ["Dushanba", "Seshanba"]
    const dayLabels = (group.days || '').split(',').map(d => d.trim());
    const fullDays = dayLabels.map(short => {
      const match = WEEKDAYS.find(w => w.short === short);
      return match ? match.label : short;
    }).filter(Boolean);

    setForm({
      name: group.name,
      course: group.course,
      room: group.room,
      days: fullDays,
      time: group.time,
      startDate: '',
      description: '',
      students: group.studentsList || [],
      teachers: group.teachersList || [],
    });
    setDrawerOpen(true);
  };

  const handleDayToggle = (dayLabel) => {
    setForm(prev => {
      const isSelected = prev.days.includes(dayLabel);
      const updatedDays = isSelected
        ? prev.days.filter(d => d !== dayLabel)
        : [...prev.days, dayLabel];
      return { ...prev, days: updatedDays };
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.course || !form.room) {
      alert("Iltimos, barcha majburiy maydonlarni kiriting!");
      return;
    }

    const token = localStorage.getItem('accessToken');
    const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

    // week_day ni API formatiga o'tkazish: ["MONDAY", ...]
    const DAY_MAP = {
      'Dushanba': 'MONDAY', 'Seshanba': 'TUESDAY', 'Chorshanba': 'WEDNESDAY',
      'Payshanba': 'THURSDAY', 'Juma': 'FRIDAY', 'Shanba': 'SATURDAY', 'Yakshanba': 'SUNDAY',
    };
    const weekDay = form.days.map(d => DAY_MAP[d] || d.toUpperCase());

    // course va room ID larini topish
    const courseObj = courses.find(c => c.name === form.course || String(c.id) === String(form.course));
    const roomObj = rooms.find(r => r.name === form.room || String(r.id) === String(form.room));
    const courseId = courseObj ? courseObj.id : (parseInt(form.course) || null);
    const roomId = roomObj ? roomObj.id : (parseInt(form.room) || null);

    const body = {
      name: form.name,
      description: form.description || form.name,
      course_id: courseId,
      teachers: form.teachers || [],
      students: form.students || [],
      room_id: roomId,
      start_date: (() => {
        if (!form.startDate) return new Date().toISOString().slice(0, 10);
        // Agar allaqachon ISO formatda bo'lsa (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(form.startDate)) return form.startDate;
        // MM/DD/YYYY yoki DD/MM/YYYY formatlarini o'tkazish
        try {
          const d = new Date(form.startDate);
          if (!isNaN(d)) return d.toISOString().slice(0, 10);
        } catch { /* ignore */ }
        return new Date().toISOString().slice(0, 10);
      })(),
      week_day: weekDay.length > 0 ? weekDay : ['MONDAY'],
      start_time: form.time || '09:00',
      max_student: 20,
    };

    const shortDays = form.days
      .map(d => WEEKDAYS.find(w => w.label === d)?.short || d.slice(0, 3))
      .join(', ');

    if (editId !== null) {
      // PATCH /api/v1/groups/{id}
      try {
        const res = await fetch(`${BASE_URL}/groups/${editId}`, {
          method: 'PATCH', headers, body: JSON.stringify(body),
        });
        if (res.ok) {
          setGroups(p => p.map(g => g.id === editId ? {
            ...g, name: form.name, course: form.course, room: form.room,
            time: form.time, days: shortDays,
          } : g));
        } else {
          try {
            const err = await res.json();
            const rawMsg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || '');
            const msg = rawMsg.toLowerCase().includes('busy')
              ? `Bu xona (${form.room}) tanlangan kun va vaqtda band! Boshqa xona, vaqt yoki kun tanlang.`
              : rawMsg || `Xatolik: ${res.status}`;
            alert(msg);
          } catch { alert(`Xatolik: ${res.status}`); }
          return;
        }
      } catch { alert('Server bilan ulanishda xatolik!'); return; }
    } else {
      // POST /api/v1/groups
      try {
        const res = await fetch(`${BASE_URL}/groups`, {
          method: 'POST', headers, body: JSON.stringify(body),
        });
        if (res.ok) {
          setRefresh(r => r + 1);
        } else {
          try {
            const err = await res.json();
            const rawMsg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || '');
            const msg = rawMsg.toLowerCase().includes('busy')
              ? `Bu xona (${form.room}) tanlangan kun va vaqtda band! Boshqa xona, vaqt yoki kun tanlang.`
              : rawMsg || `Xatolik: ${res.status}`;
            alert(msg);
          } catch { alert(`Xatolik: ${res.status}`); }
          return;
        }
      } catch { alert('Server bilan ulanishda xatolik!'); return; }
    }

    setDrawerOpen(false);
    setEditId(null);
    setForm({ name: '', course: '', room: '', days: [], time: '09:00', startDate: '', description: '', students: [], teachers: [] });
  };

  const toggleGroupActive = (id) => {
    // Function disabled - switches removed
    // setGroups(p => p.map(g => g.id === id ? { ...g, active: !g.active } : g));
  };

  const filteredGroups = groups.filter(g => {
    const term = search.toLowerCase();
    const matchesSearch = (g.name || '').toLowerCase().includes(term) ||
      (g.course || '').toLowerCase().includes(term) ||
      (g.room || '').toLowerCase().includes(term) ||
      (g.teacher || '').toLowerCase().includes(term);
    
    if (activeTab === 'Arxiv') {
      return matchesSearch && !g.active;
    }
    return matchesSearch && g.active;
  });

  return (
    <div className="p-4 lg:p-6 bg-[#f1f5f9] h-full flex flex-col relative">
      
      {/* ── Portals: Modals & Drawer (body ga chiqariladi) ── */}
      {typeof document !== 'undefined' && ReactDOM.createPortal(
        <>
          {/* Drawer Overlay */}
          {drawerOpen && !teacherModalOpen && !studentModalOpen && (
            <div onClick={() => { setDrawerOpen(false); setEditId(null); }}
              style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }} />
          )}

          {/* Students Modal */}
          {studentModalOpen && (
            <>
              <div onClick={() => { setStudentModalOpen(false); setStudentSearchQuery(''); }}
                style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,0.5)' }} />
              <div style={{ position: 'fixed', inset: 0, zIndex: 1310, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}>
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', maxWidth: '480px', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', pointerEvents: 'auto' }}>
                  <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>Talaba qo'shish</h2>
                      <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Bitta yoki bir nechta talabani tanlang</p>
                    </div>
                    <button onClick={() => { setStudentModalOpen(false); setStudentSearchQuery(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px' }}>
                      <CloseOutlined style={{ fontSize: 20 }} />
                    </button>
                  </div>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ position: 'relative' }}>
                      <SearchOutlined style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#9ca3af' }} />
                      <input type="text" placeholder="Talaba qidirish..." value={studentSearchQuery}
                        onChange={e => setStudentSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '10px 16px 10px 40px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', outline: 'none', background: '#f9fafb', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1, minHeight: '200px', borderBottom: '1px solid #e5e7eb' }}>
                    {availableStudents.filter(s => s.name.toLowerCase().includes(studentSearchQuery.toLowerCase())).length === 0 ? (
                      <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Talabalar topilmadi</div>
                    ) : availableStudents.filter(s => s.name.toLowerCase().includes(studentSearchQuery.toLowerCase())).map(student => {
                      const isSelected = tempSelectedStudents.includes(student.id);
                      return (
                        <label key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <input type="checkbox" checked={isSelected}
                            onChange={() => setTempSelectedStudents(prev => prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id])}
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#7c4dff' }} />
                          <span style={{ fontSize: '13px', color: '#1a1a2e', fontWeight: 500 }}>{student.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div style={{ padding: '16px 24px', display: 'flex', gap: '12px', justifyContent: 'flex-end', background: '#f9fafb' }}>
                    <button onClick={() => { setStudentModalOpen(false); setStudentSearchQuery(''); }}
                      style={{ padding: '8px 24px', borderRadius: '10px', border: '1px solid #d1d5db', background: 'white', color: '#1a1a2e', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                      Bekor qilish
                    </button>
                    <button onClick={() => { setForm(p => ({ ...p, students: tempSelectedStudents })); setStudentModalOpen(false); setStudentSearchQuery(''); }}
                      style={{ padding: '8px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(to right, #7c4dff, #5b7fff)', color: 'white', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                      Saqlash
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Teachers Modal */}
          {teacherModalOpen && (
            <>
              <div onClick={() => { setTeacherModalOpen(false); setTeacherSearchQuery(''); }}
                style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,0.5)' }} />
              <div style={{ position: 'fixed', inset: 0, zIndex: 1310, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}>
                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', maxWidth: '480px', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', pointerEvents: 'auto' }}>
                  <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>O'qituvchi qo'shish</h2>
                      <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Bitta yoki bir nechta o'qituvchini tanlang</p>
                    </div>
                    <button onClick={() => { setTeacherModalOpen(false); setTeacherSearchQuery(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px' }}>
                      <CloseOutlined style={{ fontSize: 20 }} />
                    </button>
                  </div>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ position: 'relative' }}>
                      <SearchOutlined style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#9ca3af' }} />
                      <input type="text" placeholder="O'qituvchi qidirish..." value={teacherSearchQuery}
                        onChange={e => setTeacherSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '10px 16px 10px 40px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', outline: 'none', background: '#f9fafb', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1, minHeight: '200px', borderBottom: '1px solid #e5e7eb' }}>
                    {availableTeachers.filter(t => t.name.toLowerCase().includes(teacherSearchQuery.toLowerCase())).length === 0 ? (
                      <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>O'qituvchilar topilmadi</div>
                    ) : availableTeachers.filter(t => t.name.toLowerCase().includes(teacherSearchQuery.toLowerCase())).map(teacher => {
                      const isSelected = tempSelectedTeachers.includes(teacher.id);
                      return (
                        <label key={teacher.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <input type="checkbox" checked={isSelected}
                            onChange={() => setTempSelectedTeachers(prev => prev.includes(teacher.id) ? prev.filter(id => id !== teacher.id) : [...prev, teacher.id])}
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#7c4dff' }} />
                          <span style={{ fontSize: '13px', color: '#1a1a2e', fontWeight: 500 }}>{teacher.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div style={{ padding: '16px 24px', display: 'flex', gap: '12px', justifyContent: 'flex-end', background: '#f9fafb' }}>
                    <button onClick={() => { setTeacherModalOpen(false); setTeacherSearchQuery(''); }}
                      style={{ padding: '8px 24px', borderRadius: '10px', border: '1px solid #d1d5db', background: 'white', color: '#1a1a2e', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                      Bekor qilish
                    </button>
                    <button onClick={() => { setForm(p => ({ ...p, teachers: tempSelectedTeachers })); setTeacherModalOpen(false); setTeacherSearchQuery(''); }}
                      style={{ padding: '8px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(to right, #7c4dff, #5b7fff)', color: 'white', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                      Saqlash
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>,
        document.body
      )}

      {/* Slide-out Drawer */}
      <div className={`fixed top-0 right-0 h-screen w-full sm:w-[440px] bg-white z-[1200] flex flex-col shadow-[-6px_0_28px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Drawer Header */}
        <div className="p-[20px_24px_16px] bg-gradient-to-r from-[#5b7fff] to-[#7c4dff] border-b border-[#f1f1f5] flex justify-between items-start shrink-0">
          <div>
            <h2 className="m-0 mb-1 text-[17px] font-bold text-white">{editId !== null ? "Guruhni tahrirlash" : "Guruh qo'shish"}</h2>
            <p className="m-0 text-[12.5px] text-white/80">
              {editId !== null ? "Guruh ma'lumotlarini tahrirlash uchun quyidagilarni o'zgartiring." : "Yangi guruh yaratish uchun quyidagi ma'lumotlarni kiriting."}
            </p>
          </div>
          <button onClick={() => { setDrawerOpen(false); setEditId(null); }} className="bg-transparent border-none cursor-pointer text-white hover:text-white/70 flex p-[2px]">
            <CloseOutlined style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Drawer Fields Form */}
        <div className="flex-1 overflow-y-auto p-[20px_24px] space-y-5 bg-white">
          {/* Guruh nomi */}
          <div>
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">
              Guruh nomi <span className="text-[#ef4444] font-normal">*</span>
            </label>
            <input 
              type="text" 
              placeholder="N105, N26, ..." 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full p-[11px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff] bg-[#f9fafb] text-[#1a1a2e] placeholder-[#9ca3af] transition-all" 
            />
          </div>

          {/* Kurs */}
          <div>
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">
              Kurs <span className="text-[#ef4444] font-normal">*</span>
            </label>
            <div className="relative">
              <select 
                value={form.course} 
                onChange={e => setForm({ ...form, course: e.target.value })}
                className="w-full p-[11px_14px] pr-[38px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none bg-[#f9fafb] focus:border-[#7c4dff] text-[#1a1a2e] appearance-none cursor-pointer transition-all"
              >
                <option value="">Kursni tanlang</option>
                {courses.length > 0
                  ? courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                  : <>
                      <option value="Backend">Backend</option>
                      <option value="Frontend">Frontend</option>
                      <option value="iOS">iOS</option>
                      <option value="Android">Android</option>
                    </>
                }
              </select>
              <KeyboardArrowDownOutlined className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" style={{ fontSize: 18 }} />
            </div>
          </div>

          {/* Xona */}
          <div>
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">
              Xona <span className="text-[#ef4444] font-normal">*</span>
            </label>
            <div className="relative">
              <select 
                value={form.room} 
                onChange={e => setForm({ ...form, room: e.target.value })}
                className="w-full p-[11px_14px] pr-[38px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none bg-[#f9fafb] focus:border-[#7c4dff] text-[#1a1a2e] appearance-none cursor-pointer transition-all"
              >
                <option value="">Xonani tanlang</option>
                {rooms.length > 0
                  ? rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)
                  : <>
                      <option value="Autodesk">Autodesk</option>
                      <option value="Tesla">Tesla</option>
                      <option value="Newton">Newton</option>
                    </>
                }
              </select>
              <KeyboardArrowDownOutlined className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" style={{ fontSize: 18 }} />
            </div>
          </div>

          {/* Dars kunlari */}
          <div>
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">
              Dars kunlari <span className="text-[#ef4444] font-normal">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {WEEKDAYS.map(day => {
                const isChecked = form.days.includes(day.label);
                return (
                  <div 
                    key={day.label}
                    onClick={() => handleDayToggle(day.label)}
                    className={`flex items-center gap-2.5 p-[10px_14px] border rounded-[10px] cursor-pointer transition-all bg-[#f9fafb] hover:bg-[#f3f4f6] ${
                      isChecked ? 'border-[#7c4dff] bg-[#ede9ff]/20' : 'border-[#e5e7eb]'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => {}} // toggled via parent click
                      className="w-4 h-4 accent-[#7c4dff] cursor-pointer"
                    />
                    <span className="text-[13px] text-[#1a1a2e] font-semibold">{day.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dars vaqti */}
          <div>
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">
              Dars vaqti <span className="text-[#ef4444] font-normal">*</span>
            </label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="09:00" 
                value={form.time} 
                onChange={e => setForm({ ...form, time: e.target.value })}
                className="w-full p-[11px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none bg-[#f9fafb] focus:border-[#7c4dff] text-[#1a1a2e] placeholder-[#9ca3af] transition-all" 
              />
              <AccessTimeOutlined className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" style={{ fontSize: 18 }} />
            </div>
          </div>

          {/* Boshlanish sanasi */}
          <div>
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">
              Boshlanish sanasi <span className="text-[#ef4444] font-normal">*</span>
            </label>
            <div className="relative">
              <input 
                type="date" 
                placeholder="dd/mm/yyyy" 
                value={form.startDate} 
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full p-[11px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none bg-[#f9fafb] focus:border-[#7c4dff] text-[#1a1a2e] placeholder-[#9ca3af] transition-all" 
              />
              <CalendarTodayOutlined className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" style={{ fontSize: 18 }} />
            </div>
          </div>

          {/* Tavsif */}
          <div>
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">Tavsif</label>
            <textarea 
              placeholder="Guruh haqida qo'shimcha ma'lumot (ixtiyoriy)" 
              value={form.description} 
              rows={3}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full p-[12px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none bg-[#f9fafb] focus:border-[#7c4dff] text-[#1a1a2e] placeholder-[#9ca3af] resize-none transition-all" 
            />
          </div>

          {/* O'qituvchilar */}
          <div>
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">O'qituvchilar</label>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setTempSelectedTeachers(form.teachers || []);
                setTeacherSearchQuery('');
                setTeacherModalOpen(true);
              }}
              className="w-full flex items-center justify-start gap-2 p-[12px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-[#f9fafb] cursor-pointer hover:border-[#7c4dff] hover:bg-[#ede9ff]/10 transition-all"
            >
              <span className="text-[#7c4dff] font-bold text-[18px] leading-none mb-0.5">+</span>
              <span className="text-[#7c4dff] font-bold text-[14px]">Qo'shish</span>
            </button>
            {form.teachers && form.teachers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.teachers.map((teacherId, idx) => {
                  const t = availableTeachers.find(x => x.id === teacherId);
                  if (!t) return null;
                  return (
                    <span key={idx} className="bg-[#ede9ff] text-[#7c4dff] text-[12px] font-bold px-2 py-0.5 rounded-[6px] flex items-center gap-1">
                      {t.name}
                      <button 
                        type="button" 
                        onClick={() => {
                          setForm(p => ({ ...p, teachers: p.teachers.filter(id => id !== teacherId) }));
                        }} 
                        className="bg-transparent border-none text-[#7c4dff] font-bold cursor-pointer hover:text-red-500 text-[13px] leading-none ml-1"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Talabalar */}
          <div>
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">Talabalar</label>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setTempSelectedStudents(form.students || []);
                setStudentSearchQuery('');
                setStudentModalOpen(true);
              }}
              className="w-full flex items-center justify-start gap-2 p-[12px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-[#f9fafb] cursor-pointer hover:border-[#7c4dff] hover:bg-[#ede9ff]/10 transition-all"
            >
              <span className="text-[#7c4dff] font-bold text-[18px] leading-none mb-0.5">+</span>
              <span className="text-[#7c4dff] font-bold text-[14px]">Qo'shish</span>
            </button>
            {form.students && form.students.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.students.map((studentId, idx) => {
                  const s = availableStudents.find(x => x.id === studentId);
                  if (!s) return null;
                  return (
                    <span key={idx} className="bg-[#ede9ff] text-[#7c4dff] text-[12px] font-bold px-2 py-0.5 rounded-[6px] flex items-center gap-1">
                      {s.name}
                      <button 
                        type="button" 
                        onClick={() => {
                          setForm(p => ({ ...p, students: p.students.filter(id => id !== studentId) }));
                        }} 
                        className="bg-transparent border-none text-[#7c4dff] font-bold cursor-pointer hover:text-red-500 text-[13px] leading-none ml-1"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-[16px_24px] border-t border-[#f1f1f5] flex gap-3 justify-between shrink-0 bg-[#f9fafb]">
          <button 
            onClick={() => { setDrawerOpen(false); setEditId(null); }}
            className="flex-1 p-[11px_18px] rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-white text-[#4b5563] text-[13.5px] font-bold cursor-pointer hover:bg-[#f5f5fb] transition-colors"
          >
            Bekor qilish
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 p-[11px_18px] rounded-[10px] border-none bg-gradient-to-r from-[#5b7fff] to-[#7c4dff] text-white text-[13.5px] font-bold cursor-pointer shadow-[0_2px_8px_rgba(124,77,255,0.2)] hover:opacity-90 transition-colors"
          >
            Saqlash
          </button>
        </div>
      </div>

      {/* ── Page Header ── */}
      <div className="flex justify-between items-start mb-6 shrink-0">
        <h1 className="m-0 text-[26px] font-bold text-[#1a1a2e] tracking-tight">Guruhlar</h1>
        <button 
          onClick={openAdd}
          className="flex items-center gap-1.5 p-[10px_20px] border-none rounded-[10px] bg-[#7c4dff] text-white text-[13.5px] font-semibold cursor-pointer whitespace-nowrap hover:opacity-90 shadow-[0_4px_12px_rgba(124,77,255,0.2)]"
        >
          <AddOutlined fontSize="small" /> Guruh qo'shish
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-4 shrink-0">
        <button
          onClick={() => setActiveTab('Guruhlar')}
          className={`px-4 py-2 rounded-[10px] text-[13.5px] font-semibold cursor-pointer transition-colors border ${
            activeTab === 'Guruhlar'
              ? 'bg-white text-[#1a1a2e] border-[#e5e7eb] shadow-sm'
              : 'bg-transparent text-[#6b7280] border-transparent hover:bg-white/50'
          }`}
        >
          Guruhlar
        </button>
        <button
          onClick={() => setActiveTab('Arxiv')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13.5px] font-medium cursor-pointer transition-colors border ${
            activeTab === 'Arxiv'
              ? 'bg-white text-[#1a1a2e] border-[#e5e7eb] shadow-sm'
              : 'bg-transparent text-[#6b7280] border-transparent hover:bg-white/50'
          }`}
        >
          <ArchiveOutlined style={{ fontSize: 18 }} /> Arxiv
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 shrink-0">
        {/* Card 1 */}
        <div className="bg-white p-[18px_24px] rounded-[16px] shadow-[0_1px_8px_rgba(0,0,0,0.04)] relative">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-[#f5f5fb] flex items-center justify-center mb-2">
            <PeopleAltOutlined className="text-[#6b7280]" style={{ fontSize: 20 }} />
          </div>
          <MoreVertOutlined className="absolute top-4 right-4 text-[#9ca3af] cursor-pointer" style={{ fontSize: 20 }} />
          <p className="m-0 text-[12.5px] text-[#6b7280] font-medium mb-1">Jami guruhlar</p>
          <p className="m-0 text-[28px] font-bold text-[#1a1a2e]">{groups.length}</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-[18px_24px] rounded-[16px] shadow-[0_1px_8px_rgba(0,0,0,0.04)] relative">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-[#f5f5fb] flex items-center justify-center mb-2">
            <PeopleAltOutlined className="text-[#6b7280]" style={{ fontSize: 20 }} />
          </div>
          <MoreVertOutlined className="absolute top-4 right-4 text-[#9ca3af] cursor-pointer" style={{ fontSize: 20 }} />
          <p className="m-0 text-[12.5px] text-[#6b7280] font-medium mb-1">O'qituvchilar</p>
          <p className="m-0 text-[28px] font-bold text-[#1a1a2e]">0</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-[18px_24px] rounded-[16px] shadow-[0_1px_8px_rgba(0,0,0,0.04)] relative flex justify-between items-end">
          <div>
            <div className="w-[34px] h-[34px] rounded-[10px] bg-[#f5f5fb] flex items-center justify-center mb-2">
              <SchoolOutlined className="text-[#6b7280]" style={{ fontSize: 20 }} />
            </div>
            <p className="m-0 text-[12.5px] text-[#6b7280] font-medium mb-1">O'quvchilar</p>
            <p className="m-0 text-[28px] font-bold text-[#1a1a2e]">
              {groups.reduce((acc, g) => acc + g.students, 0)}
            </p>
          </div>
          <MoreVertOutlined className="absolute top-4 right-4 text-[#9ca3af] cursor-pointer" style={{ fontSize: 20 }} />
          {/* Overlapping avatars */}
          <div className="flex -space-x-2">
            <div className="w-[26px] h-[26px] rounded-full bg-[#1a1a2e] text-white flex items-center justify-center text-[11px] font-bold border-2 border-white relative z-10">M</div>
            <div className="w-[26px] h-[26px] rounded-full bg-[#f97316] text-white flex items-center justify-center text-[11px] font-bold border-2 border-white relative z-20">M</div>
            <div className="w-[26px] h-[26px] rounded-full bg-[#ec4899] text-white flex items-center justify-center text-[11px] font-bold border-2 border-white relative z-30">N</div>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-[16px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] flex flex-col flex-1 min-h-0">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between p-[14px_18px] border-b border-[#f1f1f5] shrink-0">
          {/* Search */}
          <div className="relative w-[240px]">
            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" style={{ fontSize: 18 }} />
            <input 
              placeholder="Qidirish..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full p-[9px_14px_9px_38px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13px] outline-none bg-white focus:border-[#7c4dff] transition-colors placeholder-[#9ca3af]" 
            />
          </div>
          {/* Right Buttons */}
          <div className="flex gap-2.5 items-center">
            <button className="flex items-center gap-1.5 p-[8px_16px] border-[1.5px] border-[#e5e7eb] rounded-[10px] bg-white text-[13px] text-[#374151] font-medium cursor-pointer hover:bg-[#f5f5fb] transition-colors">
              <FilterListOutlined style={{ fontSize: 18 }} /> Filters
            </button>
            <button className="flex items-center gap-1.5 p-[8px_16px] border-[1.5px] border-[#e5e7eb] rounded-[10px] bg-white text-[13px] text-[#374151] font-medium cursor-pointer hover:bg-[#f5f5fb] transition-colors">
              <ArchiveOutlined style={{ fontSize: 18 }} /> Arxiv
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-[13px] min-w-[1000px]">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-[#f1f1f5]">
                <th className="p-[14px_24px] text-left font-semibold text-[#6b7280] text-[12.5px] whitespace-nowrap w-[140px]">Status</th>
                <th className="p-[14px_16px] text-left font-semibold text-[#6b7280] text-[12.5px] whitespace-nowrap">Guruh nomi</th>
                <th className="p-[14px_16px] text-left font-semibold text-[#6b7280] text-[12.5px] whitespace-nowrap">Kurs</th>
                <th className="p-[14px_16px] text-center font-semibold text-[#6b7280] text-[12.5px] whitespace-nowrap">Davomiyligi</th>
                <th className="p-[14px_16px] text-center font-semibold text-[#6b7280] text-[12.5px] whitespace-nowrap">Dars vaqti</th>
                <th className="p-[14px_16px] text-left font-semibold text-[#6b7280] text-[12.5px] whitespace-nowrap">Xona</th>
                <th className="p-[14px_16px] text-left font-semibold text-[#6b7280] text-[12.5px] whitespace-nowrap">O'qituvchi</th>
                <th className="p-[14px_16px] text-center font-semibold text-[#6b7280] text-[12.5px] whitespace-nowrap">Talabalar</th>
                <th className="p-[14px_24px] text-right font-semibold text-[#6b7280] text-[12.5px] whitespace-nowrap">
                  <RefreshOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group, idx) => (
                <tr 
                  key={group.id} 
                  onClick={() => navigate(`/classes/${group.id}`)}
                  className="border-b border-[#f1f1f5] hover:bg-[#fafafa] transition-colors group cursor-pointer"
                >
                  {/* Status Pill */}
                  <td className="p-[16px_24px]">
                    <span className={`px-[8px] py-[3px] rounded-[6px] text-[10.5px] font-bold tracking-wide ${
                      group.active 
                        ? 'bg-[#e8f5e9] text-[#2e7d32]' 
                        : 'bg-[#fee2e2] text-[#ef4444]'
                    }`}>
                      {group.active ? 'FAOL' : 'ARXIV'}
                    </span>
                  </td>
                  
                  {/* Guruh nomi */}
                  <td className="p-[16px_16px]">
                    <span 
                      onClick={() => navigate(`/classes/${group.id}`)}
                      className="font-bold text-[#7c4dff] text-[13.5px] cursor-pointer hover:underline transition-all"
                    >
                      {group.name}
                    </span>
                  </td>
                  
                  {/* Kurs Pill */}
                  <td className="p-[16px_16px]">
                    <span className="px-[10px] py-[5px] rounded-[8px] text-[11.5px] font-bold bg-[#f3e8ff] text-[#9333ea]">
                      {group.course}
                    </span>
                  </td>
                  
                  {/* Davomiyligi */}
                  <td className="p-[16px_16px] text-center">
                    <span className="text-[#374151] font-medium">{group.duration}</span>
                  </td>
                  
                  {/* Dars vaqti */}
                  <td className="p-[16px_16px] text-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#1a1a2e] mb-0.5">{group.time}</span>
                      <span className="text-[12px] text-[#6b7280] whitespace-nowrap">{group.days}</span>
                    </div>
                  </td>
                  
                  {/* Xona */}
                  <td className="p-[16px_16px]">
                    <span className="text-[#374151] font-medium">{group.room}</span>
                  </td>
                  
                  {/* O'qituvchi Pill */}
                  <td className="p-[16px_16px]">
                    <span className="px-[12px] py-[6px] rounded-full bg-[#f3f4f6] text-[#374151] font-semibold text-[12px]">
                      {group.teacher}
                    </span>
                  </td>
                  
                  {/* Talabalar */}
                  <td className="p-[16px_16px] text-center">
                    <span className="font-bold text-[#1a1a2e] text-[14px]">{group.students}</span>
                  </td>
                  
                  {/* Actions */}
                  <td className="p-[16px_24px] text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(group);
                      }}
                      className="bg-transparent border-none p-1 cursor-pointer text-[#9ca3af] hover:text-[#1a1a2e] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertOutlined style={{ fontSize: 20 }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Classes;
