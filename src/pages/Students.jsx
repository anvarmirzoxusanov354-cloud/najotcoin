import { useState, useRef, useEffect } from 'react';

import {
  AddOutlined, DeleteOutlineOutlined, EditOutlined,
  SearchOutlined, FilterListOutlined, ArchiveOutlined,
  CloseOutlined, ChevronLeftOutlined, ChevronRightOutlined,
  EmailOutlined, CalendarTodayOutlined, CloudUploadOutlined,
  LocationOnOutlined, VisibilityOutlined,
} from '@mui/icons-material';



const BADGE_COLORS = [
  { bg: '#e8f0fe', text: '#1565c0' },
  { bg: '#fce8f3', text: '#c2185b' },
  { bg: '#fff3e0', text: '#e65100' },
  { bg: '#e8f5e9', text: '#2e7d32' },
];

const BASE_STATIC = 'https://najot-edu.softwareengineer.uz';

function getPhotoUrl(photo) {
  if (!photo) return null;
  const p = String(photo);
  if (p.startsWith('http')) return p;
  // /files/... yoki files/... path
  if (p.startsWith('/files')) return BASE_STATIC + p;
  if (p.startsWith('files/')) return BASE_STATIC + '/' + p;
  if (p.startsWith('/')) return BASE_STATIC + p;
  // Oddiy fayl nomi bo'lsa
  return BASE_STATIC + '/files/' + p;
}

const Avatar = ({ name, photo }) => {
  const url = getPhotoUrl(photo);
  return (
    <div className="w-8 h-8 rounded-full bg-[#ede9ff] flex items-center justify-center font-bold text-[13px] text-[#7c4dff] shrink-0 overflow-hidden">
      {url
        ? <img src={url} alt={name} className="w-full h-full object-cover" onError={function(e){ e.target.style.display='none'; }} />
        : (name?.charAt(0)?.toUpperCase() || 'S')}
    </div>
  );
};

const LIMIT = 5;

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [refresh, setRefresh]   = useState(0); // API ni qayta chaqirish uchun trigger

  const [search, setSearch]         = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [groupsModalOpen, setGroupsModalOpen] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const [tempSelectedGroups, setTempSelectedGroups] = useState([]);
  const [editId, setEditId]         = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterGuruh, setFilterGuruh] = useState('');
  const [form, setForm] = useState({ name: '', phone: '+998', email: '', born: '', guruh: '', guruhIds: [], manzil: '', avatarName: '', avatarFile: null, password: '' });
  const fileInputRef = useRef(null);

  const [availableGroups, setAvailableGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // Fetch groups from API
  useEffect(() => {
    const fetchGroups = async () => {
      setGroupsLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(
          `https://najot-edu.softwareengineer.uz/api/v1/groups/all?page=1&limit=1000`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          console.log('Groups API response:', data);
          // Backend javobini arrayga o'tkazamiz — barcha mumkin formatlar
          let list = [];
          if (Array.isArray(data)) list = data;
          else if (data && Array.isArray(data.data)) list = data.data;
          else if (data && data.data && Array.isArray(data.data.items)) list = data.data.items;
          else if (data && Array.isArray(data.items)) list = data.items;
          else if (data && Array.isArray(data.groups)) list = data.groups;
          else if (data && Array.isArray(data.results)) list = data.results;

          const mapped = list.map(g => ({
            id: g.id || g._id,
            name: g.name || g.group_name || g.title || 'Nomsiz guruh',
          }));
          setAvailableGroups(mapped);
        } else {
          console.error('Groups API xatosi:', res.status);
          setAvailableGroups([]);
        }
      } catch (e) {
        console.error('Groups fetch error:', e);
        setAvailableGroups([]);
      } finally {
        setGroupsLoading(false);
      }
    };
    if (groupsModalOpen) {
      fetchGroups();
    }
  }, [groupsModalOpen]);


  // Fetch students from API
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(
          `https://najot-edu.softwareengineer.uz/api/v1/students?page=1&limit=1000`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.status === 401) {
          localStorage.removeItem('isLogged');
          localStorage.removeItem('accessToken');
          window.location.reload();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          console.log('Students API fetch response:', data);

          // Backenddan kelgan data formatini aniqlash va array'ni olish
          let list = [];
          if (Array.isArray(data)) list = data;
          else if (Array.isArray(data.data)) list = data.data;
          else if (Array.isArray(data.students)) list = data.students;
          else if (Array.isArray(data.items)) list = data.items;
          else if (Array.isArray(data.results)) list = data.results;
          else if (data.data && Array.isArray(data.data.students)) list = data.data.students;
          else if (data.data && Array.isArray(data.data.items)) list = data.data.items;
          else if (data.data && Array.isArray(data.data.data)) list = data.data.data;
          else if (data.data && typeof data.data === 'object') {
            // {data: {data: [], total: N}} kabi nested format
            const inner = Object.values(data.data).find(v => Array.isArray(v));
            if (inner) list = inner;
          }

          console.log('Parsed students list:', list.length, 'ta');

          const mapped = list.map((s, i) => ({
            id: s.id || s._id || i + 1,
            name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || s.fullName || s.full_name || '',
            photo: s.photo || s.avatar || s.image || null,
            guruhlar: s.groups ? s.groups.map(g => typeof g === 'object' ? (g.name || '') : g) : (s.group ? [s.group] : []),
            guruhIds: s.groups ? s.groups.map(g => typeof g === 'object' ? (g.id || g._id) : g) : [],
            phone: s.phone || '',
            email: s.email || '',
            born: (() => {
              const raw = s.birth_date || s.birthDate || s.born || '';
              if (!raw) return '';
              try {
                const d = new Date(raw);
                if (isNaN(d)) return raw;
                return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
              } catch { return raw; }
            })(),
            manzil: s.address || s.manzil || '',
            created: s.createdAt || s.created_at
              ? new Date(s.createdAt || s.created_at).toLocaleDateString('ru-RU')
              : '',
            selected: false,
            archived: false,
          }));
          setStudents(mapped);
        }
      } catch (e) {
        console.error('Students fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [refresh]);

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search);
    const matchArchived = showArchived ? s.archived : !s.archived;
    const matchGroup = filterGuruh ? (s.guruhlar || []).includes(filterGuruh) : true;
    return matchSearch && matchArchived && matchGroup;
  });
  
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / LIMIT));
  const paginated  = filteredStudents.slice((page - 1) * LIMIT, page * LIMIT);
  const allChecked = paginated.length > 0 && paginated.every(s => s.selected);

  const toggleSelect = id => setStudents(p => p.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  const toggleAll    = () => {
    const all = paginated.every(s => s.selected);
    setStudents(p => p.map(s => ({ ...s, selected: !all })));
  };
  const deleteOne = async (id) => {
    const token = localStorage.getItem('accessToken');
    try {
      await fetch(`https://najot-edu.softwareengineer.uz/api/v1/students/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* ignore */ }
    setStudents(p => p.filter(s => s.id !== id));
  };

  const archiveOne = (id) => setStudents(p => p.map(s => s.id === id ? { ...s, archived: !s.archived } : s));

  const resetForm = () => setForm({ name: '', phone: '+998', email: '', born: '', guruh: '', guruhIds: [], manzil: '', avatarName: '', avatarFile: null, password: '' });

  const openAdd  = ()  => { setEditId(null); resetForm(); setDrawerOpen(true); };
  const openEdit = (s) => {
    setEditId(s.id);
    setForm({ name: s.name, phone: s.phone, email: s.email, born: s.born, guruh: (s.guruhlar || []).join(', '), guruhIds: s.guruhIds || [], manzil: s.manzil, avatarName: '', password: '' });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const guruhlar = (form.guruh || '').split(',').map(g => g.trim()).filter(Boolean);
    
    if (editId !== null) {
      // PATCH /api/v1/students/{id}
      try {
        const token = localStorage.getItem('accessToken');
        const fd = new FormData();
        fd.append('full_name', form.name.trim());
        fd.append('phone', form.phone);
        if (form.email) fd.append('email', form.email);
        if (form.manzil) fd.append('address', form.manzil);
        if (form.password) fd.append('password', form.password);
        if (form.avatarFile) fd.append('photo', form.avatarFile);
        (form.guruhIds || []).forEach(gid => fd.append('groups[]', gid));

        const res = await fetch(`https://najot-edu.softwareengineer.uz/api/v1/students/${editId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (res.ok) {
          setStudents(p => p.map(s => s.id === editId ? {
            ...s, name: form.name.trim(), phone: form.phone, email: form.email,
            born: form.born, guruhlar, manzil: form.manzil,
          } : s));
        } else {
          try {
            const err = await res.json();
            alert(err.message || `Xatolik: ${res.status}`);
          } catch { alert(`Xatolik: ${res.status}`); }
          return;
        }
      } catch {
        alert('Server bilan ulanishda xatolik!');
        return;
      }
    } else {
      // POST yangi talaba — multipart/form-data
      try {
        const token = localStorage.getItem('accessToken');

        let isoDate = null;
        if (form.born) {
          const cleanBorn = form.born.replace(/\//g, '.');
          const parts = cleanBorn.split('.');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            if (year.length === 4 && day.length === 2 && month.length === 2) {
              isoDate = `${year}-${month}-${day}`;
            }
          }
          if (!isoDate) {
            try {
              const d = new Date(form.born);
              if (!isNaN(d)) isoDate = d.toISOString().slice(0, 10);
            } catch { /* ignore */ }
          }
        }

        // Telefon raqamini tozalash
        let cleanPhone = form.phone.replace(/[\s\(\)\-]/g, '');
        if (cleanPhone.startsWith('998') && cleanPhone.length === 12) {
          cleanPhone = '+' + cleanPhone;
        } else if (!cleanPhone.startsWith('+') && cleanPhone.length === 9) {
          cleanPhone = '+998' + cleanPhone;
        }

        // FormData orqali yuborish (Swagger: multipart/form-data)
        const fd = new FormData();
        fd.append('full_name', form.name.trim());
        fd.append('phone', cleanPhone);
        if (form.email) fd.append('email', form.email);
        fd.append('password', form.password || 'Student123!');
        if (form.manzil) fd.append('address', form.manzil);
        if (isoDate) fd.append('birth_date', isoDate);
        if (form.avatarFile) fd.append('photo', form.avatarFile);
        // Tanlangan guruh IDlarini qo'shamiz
        (form.guruhIds || []).forEach(id => fd.append('groups[]', id));

        const res = await fetch('https://najot-edu.softwareengineer.uz/api/v1/students', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });

        if (res.ok) {
          setRefresh(r => r + 1);
        } else {
          let errMsg = 'Xatolik yuz berdi!';
          if (res.status === 409) {
            errMsg = 'Bu telefon raqam yoki email allaqachon mavjud!';
          } else {
            try {
              const err = await res.json();
              errMsg = err.message || err.error || JSON.stringify(err);
            } catch {
              errMsg = `Server xatosi: ${res.status}`;
            }
          }
          alert(errMsg);
          return;
        }
      } catch {
        alert('Server bilan ulanishda xatolik!');
        return;
      }
    }
    resetForm(); setEditId(null); setDrawerOpen(false);
  };

  const pageNums = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    return [1, 2, 3, '...', totalPages - 2, totalPages - 1, totalPages];
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 bg-[#f1f5f9] h-full flex flex-col overflow-hidden">

      {/* Groups Modal Overlay */}
      {groupsModalOpen && (
        <div onClick={(e) => { 
          e.stopPropagation();
          setTempSelectedGroups([]); 
          setGroupSearch('');
          setGroupsModalOpen(false); 
        }}
          className="fixed inset-0 z-[1250] bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300" />
      )}

      {/* Groups Selection Modal - Centered */}
      <div className={`fixed inset-0 z-[1260] flex items-center justify-center transition-opacity duration-300 ${groupsModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.15)] max-w-[520px] w-full mx-4 overflow-hidden">
          {/* Modal Header */}
          <div className="px-6 py-6 border-b border-[#e5e7eb]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="m-0 text-[20px] font-bold text-[#1a1a2e] mb-2">Guruhlarga biriktirish</h2>
                <p className="m-0 text-[13px] text-[#6b7280]">Bitta yoki bir nechta guruhni tanlang</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTempSelectedGroups([]);
                  setGroupsModalOpen(false);
                  setGroupSearch('');
                }}
                className="bg-transparent border-none cursor-pointer text-[#9ca3af] hover:text-[#1a1a2e] p-0.5"
              >
                <CloseOutlined style={{ fontSize: 20 }} />
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="px-6 py-4 border-b border-[#e5e7eb]">
            <div className="relative">
              <input
                type="text"
                placeholder="Guruh qidirish..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 bg-[#f9fafb] border border-[#e5e7eb] rounded-[10px] text-[13px] text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none focus:border-[#7c4dff] focus:bg-white transition-colors"
              />
              <SearchOutlined
                style={{
                  fontSize: 16,
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                }}
              />
            </div>
          </div>

          {/* Groups List */}
          <div className="max-h-[300px] overflow-y-auto border-b border-[#e5e7eb]">
            <div className="divide-y divide-[#e5e7eb]">
              {groupsLoading ? (
                <div className="px-6 py-8 text-center text-[#9ca3af] text-[13px] flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-[#7c4dff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Guruhlar yuklanmoqda...
                </div>
              ) : availableGroups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase())).length === 0 ? (
                <div className="px-6 py-8 text-center text-[#9ca3af] text-[13px]">
                  {availableGroups.length === 0 ? 'Guruhlar mavjud emas yoki yuklanmadi' : 'Guruhlar topilmadi'}
                </div>
              ) : (
                availableGroups
                  .filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()))
                  .map(group => {
                    const isSelected = tempSelectedGroups.some(g => g.id === group.id);
                    return (
                      <div
                        key={group.id}
                        onClick={() => {
                          setTempSelectedGroups(prev =>
                            prev.some(g => g.id === group.id)
                              ? prev.filter(g => g.id !== group.id)
                              : [...prev, { id: group.id, name: group.name }]
                          );
                        }}
                        className="px-6 py-3 hover:bg-[#f9fafb] transition-colors cursor-pointer flex items-center gap-3"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            setTempSelectedGroups(prev =>
                              prev.some(g => g.id === group.id)
                                ? prev.filter(g => g.id !== group.id)
                                : [...prev, { id: group.id, name: group.name }]
                            );
                          }}
                          className="w-4 h-4 rounded border-[#d1d5db] text-[#7c4dff] cursor-pointer accent-[#7c4dff]"
                        />
                        <span className="text-[13px] text-[#1a1a2e] font-medium">{group.name}</span>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 flex gap-3 justify-end bg-[#f9fafb]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTempSelectedGroups([]);
                setGroupsModalOpen(false);
                setGroupSearch('');
              }}
              className="px-6 py-2 rounded-[10px] border border-[#d1d5db] bg-white text-[#1a1a2e] font-semibold text-[13px] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const names = tempSelectedGroups.map(g => g.name).join(', ');
                const ids = tempSelectedGroups.map(g => g.id);
                setForm(p => ({ ...p, guruh: names, guruhIds: ids }));
                setGroupsModalOpen(false);
                setGroupSearch('');
              }}
              className="px-6 py-2 rounded-[10px] bg-gradient-to-r from-[#7c4dff] to-[#5b7fff] text-white font-semibold text-[13px] hover:shadow-md transition-all cursor-pointer border-none"
            >
              Saqlash
            </button>
          </div>
        </div>
      </div>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div onClick={() => { setDrawerOpen(false); resetForm(); }}
          className="fixed inset-0 z-[1100] bg-black/35 backdrop-blur-[2px] transition-opacity duration-300" />
      )}

      {/* Slide-out Drawer */}
      <div className={`fixed top-0 right-0 h-screen w-full sm:w-[420px] bg-white z-[1200] flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.10)] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-[20px_20px_14px] border-b border-[#f1f1f5] flex justify-between items-start">
          <div>
            <h2 className="m-0 mb-1 text-[16px] font-bold text-[#1a1a2e]">{editId ? "Talabani tahrirlash" : "Talaba qo'shish"}</h2>
            <p className="m-0 text-[12.5px] text-[#9ca3af]">Bu yerda siz yangi talaba qo'shishingiz mumkin.</p>
          </div>
          <button onClick={() => { setDrawerOpen(false); resetForm(); }} className="bg-transparent border-none cursor-pointer text-[#9ca3af] flex p-[2px]">
            <CloseOutlined fontSize="small" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-[20px_24px]">
          <div className="mb-4">
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">Telefon raqam</label>
            <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full p-[10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff] text-[#1a1a2e]" />
          </div>
          <div className="mb-4">
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">Mail</label>
            <input type="email" placeholder="Elektron pochtani kiriting" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full p-[10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff] placeholder-[#9ca3af] text-[#1a1a2e]" />
          </div>
          <div className="mb-4">
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">Talaba FIO</label>
            <input type="text" placeholder="Ma'lumotni kiriting" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full p-[10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff] placeholder-[#9ca3af] text-[#1a1a2e]" />
          </div>
          <div className="mb-4">
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">Tug'ilgan sanasi</label>
            <div className="relative">
              <input type="text" placeholder="dd/mm/yyyy" value={form.born} onChange={e => setForm({ ...form, born: e.target.value })}
                className="w-full p-[10px_14px_10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff] placeholder-[#9ca3af] text-[#1a1a2e]" />
              <CalendarTodayOutlined className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1a2e]" style={{ fontSize: 18 }} />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">Manzil</label>
            <input type="text" placeholder="Manzilni kiriting" value={form.manzil} onChange={e => setForm({ ...form, manzil: e.target.value })}
              className="w-full p-[10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff] placeholder-[#9ca3af] text-[#1a1a2e]" />
          </div>
          <div className="mb-4">
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">Parol</label>
            <input type="password" placeholder="Parolni kiriting" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full p-[10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff] placeholder-[#9ca3af] text-[#1a1a2e]" />
          </div>
          <div className="mb-4">
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">Guruh</label>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Modal ochilganda tempSelectedGroups ni init qil
                const currentNames = form.guruh ? form.guruh.split(',').map(g => g.trim()).filter(Boolean) : [];
                const currentIds = form.guruhIds || [];
                const current = currentNames.map((name, idx) => ({
                  id: currentIds[idx] ?? (availableGroups.find(g => g.name === name)?.id ?? null),
                  name,
                })).filter(g => g.id !== null);
                setTempSelectedGroups(current);
                setGroupSearch('');
                setGroupsModalOpen(true);
              }}
              className="w-full flex items-center justify-start gap-2 p-[12px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-white cursor-pointer hover:border-[#7c4dff] transition-colors"
            >
              <span className="text-[#7c4dff] font-bold text-[18px] leading-none mb-0.5">+</span>
              <span className="text-[#7c4dff] font-bold text-[14px]">Guruh qo'shish</span>
            </button>
            {form.guruh && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.guruh.split(',').map(g => g.trim()).filter(Boolean).map((g, idx) => (
                  <span key={idx} className="bg-[#ede9ff] text-[#7c4dff] text-[12px] font-bold px-2 py-0.5 rounded-[6px] flex items-center gap-1">
                    {g}
                    <button 
                      type="button" 
                      onClick={() => {
                        const updatedNames = form.guruh.split(',').map(item => item.trim()).filter(item => item !== g).join(', ');
                        // Mos keluvchi guruh IDsini topib o'chirish
                        const removedGroup = availableGroups.find(ag => ag.name === g);
                        const updatedIds = removedGroup
                          ? (form.guruhIds || []).filter(id => id !== removedGroup.id)
                          : (form.guruhIds || []).filter((_, i) => {
                              const names = form.guruh.split(',').map(n => n.trim()).filter(Boolean);
                              return names[i] !== g;
                            });
                        setForm(p => ({ ...p, guruh: updatedNames, guruhIds: updatedIds }));
                      }} 
                      className="bg-transparent border-none text-[#7c4dff] font-bold cursor-pointer hover:text-red-500 text-[13px] leading-none ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">Surati</label>
            <div onClick={() => fileInputRef.current?.click()}
              className="border-[1.5px] border-dashed border-[#e5e7eb] rounded-[12px] p-[28px_14px] text-center cursor-pointer bg-white hover:border-[#7c4dff] transition-colors relative">
              {form.avatarFile ? (
                <img
                  src={URL.createObjectURL(form.avatarFile)}
                  alt="preview"
                  className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                />
              ) : (
                <CloudUploadOutlined style={{ fontSize: 32, color: '#9ca3af', mb: '8px' }} />
              )}
              <p className="m-0 mb-1 text-[13px] text-[#374151] font-medium mt-2"><span className="text-[#7c4dff] font-bold">Click to upload</span> or drag and drop</p>
              <p className="m-0 text-[11.5px] text-[#9ca3af]">JPG or PNG (max. 2 MB)</p>
              {form.avatarName && <p className="m-0 mt-2 text-[12px] text-[#7c4dff] font-bold">{form.avatarName}</p>}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden"
              onChange={e => { if (e.target.files[0]) setForm(p => ({ ...p, avatarName: e.target.files[0].name, avatarFile: e.target.files[0] })); }} />
          </div>
        </div>

        <div className="p-[16px_24px] border-t border-[#f1f1f5] flex gap-3 justify-between">
          <button onClick={() => { setDrawerOpen(false); resetForm(); }}
            className="flex-1 p-[11px_18px] rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-white text-[#4b5563] text-[13.5px] font-bold cursor-pointer hover:bg-[#f5f5fb] transition-colors">
            Bekor qilish
          </button>
          <button onClick={handleSave}
            className={`flex-1 p-[11px_18px] rounded-[10px] border-none text-[13.5px] font-bold transition-colors ${form.name.trim() ? 'bg-[#7c4dff] text-white cursor-pointer shadow-[0_2px_8px_rgba(124,77,255,0.2)] hover:opacity-90' : 'bg-[#f3f4f6] text-[#9ca3af] cursor-default'}`}>
            Saqlash
          </button>
        </div>
      </div>

      {/* ── Page Header ── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="m-0 mb-1 text-[22px] font-bold text-[#1a1a2e]">Talabalar</h1>
          <p className="m-0 text-[13px] text-[#9ca3af]">
            Ushbu sahifada siz Talabalar ro'yxatini va ularning ma'lumotlarini topasiz. Har bir Talaba ismi, fanlari va aloqa ma'lumotlari keltirilgan.
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 p-[10px_20px] border-none rounded-[10px] bg-[#7c4dff] text-white text-[13px] font-semibold cursor-pointer whitespace-nowrap hover:opacity-90 shrink-0 ml-6">
          <AddOutlined fontSize="small" /> Talaba qo'shish
        </button>
      </div>

      {/* ── White Card ── */}
      <div className="bg-white rounded-[16px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] flex flex-col flex-1 min-h-0">

        {/* Toolbar inside card */}
        <div className="flex items-center justify-between p-[14px_18px] border-b border-[#f1f1f5] gap-3 shrink-0">
          {/* Search */}
          <div className="relative w-[220px]">
            <SearchOutlined className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" style={{ fontSize: 18 }} />
            <input placeholder="Search" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full p-[8px_14px_8px_34px] rounded-[8px] border-[1.5px] border-[#e5e7eb] text-[13px] outline-none bg-white focus:border-[#7c4dff]" />
          </div>
          {/* Right buttons */}
          <div className="flex gap-2 items-center">
            <div className="relative">
              <button onClick={() => setShowFilter(f => !f)}
                className={`flex items-center gap-1.5 p-[7px_14px] border-[1.5px] rounded-[8px] text-[13px] cursor-pointer transition-colors ${showFilter ? 'border-[#7c4dff] bg-[#f0ebff] text-[#7c4dff]' : 'border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f5f5fb]'}`}>
                <FilterListOutlined style={{ fontSize: 16 }} /> Filters {filterGuruh && <span className="bg-[#7c4dff] text-white rounded-[10px] text-[10px] p-[1px_6px] ml-0.5">1</span>}
              </button>
              {showFilter && (
                <div className="absolute top-[42px] right-0 bg-white border border-[#e5e7eb] rounded-[12px] p-3.5 z-[500] w-full min-w-[200px] shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                  <p className="m-0 mb-2 text-[12px] font-semibold text-[#374151]">Guruh bo'yicha</p>
                  <select value={filterGuruh} onChange={e => { setFilterGuruh(e.target.value); setPage(1); }}
                    className="w-full p-[8px_10px] rounded-[8px] border-[1.5px] border-[#e5e7eb] text-[13px] outline-none bg-white">
                    <option value="">Barchasi</option>
                    {[...new Set(students.flatMap(s => s.guruhlar || []))].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {filterGuruh && (
                    <button onClick={() => { setFilterGuruh(''); setPage(1); }}
                      className="mt-2 w-full p-1.5 border-none rounded-[8px] bg-[#f5f5fb] text-[#7c4dff] text-[12.5px] cursor-pointer font-semibold">
                      Filterni tozalash
                    </button>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => { setShowArchived(a => !a); setPage(1); }}
              className={`flex items-center gap-1.5 p-[7px_14px] border-[1.5px] rounded-[8px] text-[13px] cursor-pointer whitespace-nowrap transition-colors ${showArchived ? 'border-[#7c4dff] bg-[#f0ebff] text-[#7c4dff]' : 'border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f5f5fb]'}`}>
              <ArchiveOutlined style={{ fontSize: 16 }} /> {showArchived ? 'Faollar' : 'Arxiv'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-[13px] min-w-[900px]">
            <thead>
              <tr className="border-b border-[#f1f1f5]">
                <th className="p-[11px_14px] w-9 text-left">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-[#7c4dff] w-[15px] h-[15px] cursor-pointer" />
                </th>
                {['Nomi ↓', 'Guruh', 'Telefon raqamlari', 'Email', "Tug'ilgan sanasi", 'Manzil', 'Yaratilgan sana', 'Amallar'].map((col, i) => (
                  <th key={i} className="p-[11px_10px] text-left font-semibold text-[#374151] text-[12.5px] whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-14 text-[#9ca3af] text-[13px]">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-[#7c4dff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Ma'lumotlar yuklanmoqda...
                  </div>
                </td></tr>
              ) : paginated.map((s, idx) => (
                <tr key={s.id} className={`border-b border-[#f9f9fb] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'} hover:bg-[#f5f0ff]`}>
                  <td className="p-[10px_14px]">
                    <input type="checkbox" checked={s.selected} onChange={() => toggleSelect(s.id)} className="accent-[#7c4dff] w-[15px] h-[15px] cursor-pointer" />
                  </td>
                  {/* Nomi */}
                  <td className="p-[10px_10px]">
                    <div className="flex items-center gap-2">
                      <Avatar name={s.name} photo={s.photo} />
                      <span className="font-semibold text-[#1a1a2e] text-[13px]">{s.name}</span>
                    </div>
                  </td>
                  {/* Guruh badges */}
                  <td className="p-[10px_10px]">
                    <div className="flex gap-1 flex-wrap">
                      {(s.guruhlar || []).map((g, i) => (
                        <span key={i} className="rounded-[6px] px-2 py-[2px] text-[11px] font-semibold whitespace-nowrap"
                          style={{ background: BADGE_COLORS[i % BADGE_COLORS.length].bg, color: BADGE_COLORS[i % BADGE_COLORS.length].text }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-[10px_10px] text-[#374151]">{s.phone}</td>
                  <td className="p-[10px_10px] text-[#6b7280]">{s.email}</td>
                  <td className="p-[10px_10px] text-[#6b7280]">{s.born}</td>
                  <td className="p-[10px_10px] text-[#6b7280]">{s.manzil}</td>
                  <td className="p-[10px_10px] text-[#6b7280]">{s.created}</td>
                  {/* Amallar */}
                  <td className="p-[10px_10px]">
                    <div className="flex gap-1 items-center">
                      <button title="Ko'rish" className="bg-transparent border-none cursor-pointer text-[#9ca3af] flex p-[3px] hover:text-[#7c4dff]">
                        <VisibilityOutlined style={{ fontSize: 16 }} />
                      </button>
                      <button onClick={() => archiveOne(s.id)} title={s.archived ? "Arxivdan chiqarish" : "Arxivga qo'shish"} className="bg-transparent border-none cursor-pointer text-[#f59e0b] flex p-[3px] hover:text-[#d97706]">
                        <ArchiveOutlined style={{ fontSize: 16 }} />
                      </button>
                      <button onClick={() => deleteOne(s.id)} className="bg-transparent border-none cursor-pointer text-[#ef5350] flex p-[3px]">
                        <DeleteOutlineOutlined style={{ fontSize: 16 }} />
                      </button>
                      <button onClick={() => openEdit(s)} className="bg-transparent border-none cursor-pointer text-[#7c4dff] flex p-[3px]">
                        <EditOutlined style={{ fontSize: 16 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={9} className="text-center py-14 text-[#9ca3af] text-[14px]">Ma'lumotlar mavjud emas</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination inside card */}
        <div className="flex justify-between items-center px-5 py-3 border-t border-[#f1f1f5] shrink-0">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className={`flex items-center gap-1 p-[7px_14px] border-[1.5px] border-[#e5e7eb] rounded-[8px] bg-white text-[13px] font-medium ${page === 1 ? 'text-[#d1d5db] cursor-default' : 'text-[#374151] cursor-pointer hover:bg-[#f5f5fb]'}`}>
            <ChevronLeftOutlined fontSize="small" /> Previous
          </button>
          <div className="flex gap-1">
            {pageNums().map((n, i) =>
              n === '...' ? (
                <span key={i} className="w-[34px] h-[34px] flex items-center justify-center text-[#9ca3af] text-[13px]">...</span>
              ) : (
                <button key={i} onClick={() => setPage(n)}
                  className={`w-[34px] h-[34px] rounded-[8px] border-none text-[13px] cursor-pointer transition-colors ${page === n ? 'bg-[#7c4dff] text-white font-bold' : 'bg-transparent text-[#374151] hover:bg-[#f5f0ff]'}`}>
                  {n}
                </button>
              )
            )}
          </div>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className={`flex items-center gap-1 p-[7px_14px] border-[1.5px] border-[#e5e7eb] rounded-[8px] bg-white text-[13px] font-medium ${page === totalPages ? 'text-[#d1d5db] cursor-default' : 'text-[#374151] cursor-pointer hover:bg-[#f5f5fb]'}`}>
            Next <ChevronRightOutlined fontSize="small" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Students;
