import { useState, useEffect, useRef } from 'react';
import {
  AddOutlined, DeleteOutlineOutlined, EditOutlined,
  SearchOutlined, FileDownloadOutlined,
  FilterListOutlined, ArchiveOutlined, CloseOutlined,
  ChevronLeftOutlined, ChevronRightOutlined, RefreshOutlined,
  EmailOutlined, CalendarTodayOutlined, CloudUploadOutlined,
} from '@mui/icons-material';

const LABELS_COLORS = ['#e8f0fe', '#fce8f3', '#fff3e0', '#e8f5e9', '#f3e5f5'];
const LABELS_TEXT = ['#1565c0', '#c2185b', '#e65100', '#2e7d32', '#6a1b9a'];

const COLS = ['Nomi', 'Guruh', 'Telefon raqamlari', "Tug'ilgan sanasi", 'Yaratilgan sana', ''];

const LabelBadge = ({ text, idx }) => (
  <span 
    className="rounded-[6px] px-2 py-[2px] text-[11px] font-semibold whitespace-nowrap"
    style={{
      background: LABELS_COLORS[idx % LABELS_COLORS.length],
      color: LABELS_TEXT[idx % LABELS_TEXT.length],
    }}
  >
    {text}
  </span>
);

const Avatar = ({ name }) => (
  <div className="w-8 h-8 rounded-full bg-[#ede9ff] flex items-center justify-center font-bold text-[13px] text-[#7c4dff] shrink-0">
    {name?.charAt(0)?.toUpperCase() || 'Q'}
  </div>
);

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ phone: '+998', email: '', name: '', born: '', guruhlar: [], jinsi: '', avatarName: '' });
  const [guruhSearch, setGuruhSearch] = useState('');
  const [showParol, setShowParol] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterGuruh, setFilterGuruh] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch teachers from API — GET /api/v1/teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('https://najot-edu.softwareengineer.uz/api/v1/teachers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          localStorage.removeItem('isLogged');
          localStorage.removeItem('accessToken');
          window.location.reload();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          console.log('Teachers API response:', data);
          // Barcha mumkin bo'lgan response formatlarni qo'llab-quvvatlash
          let list = [];
          if (Array.isArray(data)) list = data;
          else if (data && Array.isArray(data.data)) list = data.data;
          else if (data && Array.isArray(data.teachers)) list = data.teachers;
          else if (data && Array.isArray(data.items)) list = data.items;
          else if (data && Array.isArray(data.results)) list = data.results;
          else if (data && data.data && Array.isArray(data.data.items)) list = data.data.items;

          const mapped = list.map((u, i) => ({
            id: u.id || u._id || i + 1,
            name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.name || u.fullName || '',
            avatar: u.photo || u.avatar || u.image || null,
            guruh: u.groups && u.groups.length > 0
              ? (typeof u.groups[0] === 'object' ? (u.groups[0].name || '') : u.groups[0])
              : (u.group || u.address || ''),
            phone: u.phone || '',
            email: u.email || '',
            born: (() => {
              const raw = u.birth_date || u.birthDate || u.born || '';
              if (!raw) return '';
              try {
                const d = new Date(raw);
                if (isNaN(d)) return raw;
                return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
              } catch { return raw; }
            })(),
            created: (u.createdAt || u.created_at)
              ? new Date(u.createdAt || u.created_at).toLocaleDateString('ru-RU')
              : '',
            coin: u.coin || 0,
            labels: u.groups
              ? u.groups.map(g => typeof g === 'object' ? (g.name || '') : g)
              : [],
            jinsi: u.gender || '',
            selected: false,
            archived: false,
          }));
          setTeachers(mapped);
          localStorage.setItem('teachersCount', mapped.length);
        } else {
          console.error('Teachers fetch failed with status:', res.status);
        }
      } catch (e) {
        console.error('Teachers fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  // Sync count to localStorage when teachers change
  useEffect(() => {
    localStorage.setItem('teachersCount', teachers.filter(t => !t.archived).length);
  }, [teachers]);

  const PER_PAGE = 10;

  const filtered = teachers.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.phone.includes(search);
    const matchGuruh = filterGuruh ? t.guruh === filterGuruh : true;
    const matchArchived = showArchived ? t.archived : !t.archived;
    return matchSearch && matchGuruh && matchArchived;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const allGuruhlar = [...new Set(teachers.filter(t => t.guruh).map(t => t.guruh))];

  const toggleSelect = (id) =>
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
  const toggleAll = () => {
    const allSelected = paginated.every(t => t.selected);
    setTeachers(prev => prev.map(t => paginated.find(p => p.id === t.id) ? { ...t, selected: !allSelected } : t));
  };

  const deleteSelected = async () => {
    const selected = teachers.filter(t => t.selected);
    const token = localStorage.getItem('accessToken');
    await Promise.all(selected.map(t =>
      fetch(`https://najot-edu.softwareengineer.uz/api/v1/teachers/${t.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    ));
    setTeachers(prev => prev.filter(t => !t.selected));
  };

  const deleteOne = async (id) => {
    const token = localStorage.getItem('accessToken');
    try {
      await fetch(`https://najot-edu.softwareengineer.uz/api/v1/teachers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* ignore */ }
    setTeachers(prev => prev.filter(t => t.id !== id));
  };

  const archiveOne = (id) =>
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, archived: !t.archived } : t));

  const exportCSV = (list) => {
    const header = ['Ismi', 'Guruh', 'Telefon', "Tug'ilgan sana", 'Yaratilgan sana'];
    const rows = list.map(t => [t.name, t.guruh || '', t.phone, t.born, t.created]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'oqituvchilar.csv';
    a.click();
  };

  const openEdit = (t) => {
    setEditId(t.id);
    setForm({ phone: t.phone, email: t.email || '', name: t.name, born: t.born, guruhlar: t.labels || [], jinsi: t.jinsi || '', avatarName: '' });
    setGuruhSearch('');
    setDrawerOpen(true);
  };
  const openAdd = () => {
    setEditId(null);
    resetForm();
    setDrawerOpen(true);
  };

  const resetForm = () => { setForm({ phone: '+998', email: '', name: '', born: '', guruhlar: [], jinsi: '', avatarName: '', parol: '' }); setGuruhSearch(''); setShowParol(false); };
  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editId !== null) {
      // Edit — PATCH /api/v1/teachers/{id}
      try {
        const token = localStorage.getItem('accessToken');
        const formData = new FormData();
        formData.append('full_name', form.name.trim());
        formData.append('phone', form.phone);
        if (form.email) formData.append('email', form.email);
        if (form.parol) formData.append('password', form.parol);
        if (form.born) formData.append('address', form.born);

        const res = await fetch(`https://najot-edu.softwareengineer.uz/api/v1/teachers/${editId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (res.ok) {
          setTeachers(prev => prev.map(t => t.id === editId ? {
            ...t, name: form.name.trim(), phone: form.phone, born: form.born, email: form.email,
            guruh: form.guruhlar[0] || '', labels: form.guruhlar, jinsi: form.jinsi,
          } : t));
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
      // Yangi o'qituvchi — POST /api/v1/teachers
      try {
        const token = localStorage.getItem('accessToken');
        const formData = new FormData();
        formData.append('full_name', form.name.trim());
        formData.append('phone', form.phone);
        if (form.email) formData.append('email', form.email);
        if (form.parol) formData.append('password', form.parol);
        if (form.born) formData.append('address', form.born);

        const res = await fetch('https://najot-edu.softwareengineer.uz/api/v1/teachers', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        if (res.ok) {
          const saved = await res.json();
          const newT = {
            id: saved.id || saved._id || Date.now(),
            name: form.name.trim(),
            avatar: null,
            email: form.email,
            guruh: form.guruhlar[0] || '',
            phone: form.phone,
            born: form.born,
            jinsi: form.jinsi,
            created: new Date().toLocaleDateString('ru-RU'),
            coin: 0,
            labels: form.guruhlar,
            selected: false,
            archived: false,
          };
          setTeachers(prev => [newT, ...prev]);
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
    setEditId(null);
    resetForm();
    setDrawerOpen(false);
  };


  const anySelected = teachers.some(t => t.selected);
  const allSelected = paginated.length > 0 && paginated.every(t => t.selected);

  const pageNums = () => {
    const nums = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) nums.push(i); return nums; }
    nums.push(1, 2, 3, '...', totalPages - 1, totalPages);
    return nums;
  };

  return (
    <div className="p-[24px_28px] bg-[#f1f5f9]">

      {/* Slide-out Add Drawer */}
      {drawerOpen && <div onClick={() => { setDrawerOpen(false); resetForm(); }} className="fixed inset-0 z-[1100] bg-black/20" />}
      <div className={`fixed top-0 right-0 h-screen w-full sm:w-[420px] bg-white z-[1200] flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.1)] transition-transform duration-320 ease-[cubic-bezier(0.4,0,0.2,1)] ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Drawer Header */}
        <div className="p-[20px_20px_14px] border-b border-[#f1f1f5] flex justify-between items-start">
          <div>
            <h2 className="m-0 mb-1 text-[16px] font-bold text-[#1a1a2e]">
              {editId ? "O'qituvchini tahrirlash" : "O'qituvchi qoshish"}
            </h2>
            <p className="m-0 text-[12.5px] text-[#9ca3af]">Bu yerda siz yangi o'qituvchi qo'shishingiz mumkin.</p>
          </div>
          <button onClick={() => { setDrawerOpen(false); resetForm(); }} className="bg-none border-none cursor-pointer text-[#9ca3af] flex p-[2px]">
            <CloseOutlined fontSize="small" />
          </button>
        </div>

        {/* Drawer Form */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Telefon raqam */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#374151] mb-[7px]">Telefon raqam</label>
            <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full p-[10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff]" />
          </div>

          {/* Mail */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#374151] mb-[7px]">Mail</label>
            <div className="relative">
              <EmailOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]" />
              <input type="email" placeholder="Elektron pochtani kiriting" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full p-[10px_14px_10px_38px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff]" />
            </div>
          </div>

          {/* O'qituvchi FIO */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#374151] mb-[7px]">O'qituvchi FIO</label>
            <input type="text" placeholder="Ma'lumotni kiriting" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full p-[10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff]" />
          </div>

          {/* Tug'ilgan sanasi */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#374151] mb-[7px]">Tug'ilgan sanasi</label>
            <div className="relative">
              <CalendarTodayOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[#9ca3af]" />
              <input type="text" placeholder="01.03.1990" value={form.born} onChange={e => setForm({ ...form, born: e.target.value })}
                className="w-full p-[10px_14px_10px_38px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff]" />
            </div>
          </div>

          {/* Guruh — tag chips input */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#374151] mb-[7px]">Guruh</label>
            <div className="flex flex-wrap gap-1.5 p-[8px_12px] rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-white items-center min-h-[44px] cursor-text"
               onClick={() => document.getElementById('guruh-search-input').focus()}>
              <SearchOutlined className="text-[17px] text-[#9ca3af] shrink-0" />
              {form.guruhlar.map((g, i) => (
                <span key={i} className="flex items-center gap-[3px] bg-[#f0ebff] text-[#7c4dff] rounded-[6px] p-[2px_8px] text-[12px] font-semibold">
                  {g}
                  <button onClick={() => setForm(prev => ({ ...prev, guruhlar: prev.guruhlar.filter((_, idx) => idx !== i) }))}
                    className="bg-none border-none cursor-pointer text-[#7c4dff] text-[13px] leading-none p-[0_1px]">×</button>
                </span>
              ))}
              <input id="guruh-search-input" type="text" placeholder={form.guruhlar.length === 0 ? 'Guruh qidiring...' : ''}
                value={guruhSearch} onChange={e => setGuruhSearch(e.target.value)}
                onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && guruhSearch.trim()) { e.preventDefault(); setForm(prev => ({ ...prev, guruhlar: [...prev.guruhlar, guruhSearch.trim()] })); setGuruhSearch(''); } }}
                className="border-none outline-none text-[13px] flex-1 min-w-[80px] p-[2px_0]" />
            </div>
            <p className="m-0 mt-1 text-[11.5px] text-[#9ca3af]">Enter yoki vergul bilan guruh qo'shing</p>
          </div>

          {/* Jinsi */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#374151] mb-2.5">Jinsi</label>
            <div className="flex gap-5">
              {['Erkak', 'Ayol'].map(j => (
                <label key={j} className="flex items-center gap-[7px] cursor-pointer text-[13.5px] text-[#374151]">
                  <input type="radio" name="jinsi" value={j} checked={form.jinsi === j} onChange={() => setForm({ ...form, jinsi: j })}
                    className="accent-[#7c4dff] w-4 h-4 cursor-pointer" />
                  {j}
                </label>
              ))}
            </div>
          </div>

          {/* Surati */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#374151] mb-[7px]">Surati</label>
            <div onClick={() => fileInputRef.current?.click()}
              className="border-[1.5px] border-dashed border-[#d1d5db] rounded-[10px] p-[28px_14px] text-center cursor-pointer bg-[#fafafa] hover:border-[#7c4dff]">
              <CloudUploadOutlined className="text-[28px] text-[#9ca3af] mb-2" />
              <p className="m-0 mb-1 text-[13px] text-[#374151]">
                <span className="text-[#7c4dff] font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="m-0 text-[12px] text-[#9ca3af]">JPG or PNG (max. 800x800px)</p>
              {form.avatarName && <p className="m-0 mt-1.5 text-[12px] text-[#7c4dff] font-medium">{form.avatarName}</p>}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden"
              onChange={e => { if (e.target.files[0]) setForm(prev => ({ ...prev, avatarName: e.target.files[0].name })); }} />
          </div>

          {/* + Parol qo'shish */}
          <div className="text-right mb-1">
            <button onClick={() => setShowParol(p => !p)}
              className="bg-none border-none text-[#7c4dff] text-[13px] font-semibold cursor-pointer">
              + Parol qoshish
            </button>
          </div>
          {showParol && (
            <div className="mb-2">
              <label className="block text-[13px] font-semibold text-[#374151] mb-[7px]">Parol</label>
              <input type="password" placeholder="Parolni kiriting" value={form.parol || ''} onChange={e => setForm({ ...form, parol: e.target.value })}
                className="w-full p-[10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff]" />
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-[14px_20px] border-t border-[#f1f1f5] flex gap-2.5 justify-end">
          <button onClick={() => { setDrawerOpen(false); resetForm(); }}
            className="p-[9px_18px] rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-white text-[#6b7280] text-[13px] font-semibold cursor-pointer hover:bg-[#f5f5fb]">
            Bekor qilish
          </button>
          <button onClick={handleSave}
            className={`p-[9px_22px] rounded-[10px] border-none text-white text-[13px] font-semibold ${form.name.trim() ? 'bg-[#7c4dff] cursor-pointer opacity-100' : 'bg-[#c4b5fd] cursor-default opacity-70'}`}>
            Saqlash
          </button>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <h1 className="m-0 mb-1.5 text-[22px] font-bold text-[#1a1a2e]">O'qituvchilar</h1>
          <p className="m-0 text-[13px] text-[#9ca3af]">Ushbu sahifada siz o'qituvchilar ro'yxatini va ularning ma'lumotlarini topasiz.</p>
        </div>
        <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
          <button onClick={() => exportCSV(filtered)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 p-[9px_18px] border-[1.5px] border-[#e5e7eb] rounded-[10px] bg-white text-[#374151] text-[13px] font-semibold cursor-pointer whitespace-nowrap">
            <FileDownloadOutlined fontSize="small" /> Export
          </button>
          <button onClick={openAdd}
            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 p-[9px_18px] border-none rounded-[10px] bg-[#7c4dff] text-white text-[13px] font-semibold cursor-pointer whitespace-nowrap">
            <AddOutlined fontSize="small" /> O'qituvchi qo'shish
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <div className="relative w-full md:w-auto">
          <button onClick={() => setShowFilter(f => !f)}
            className={`w-full md:w-auto flex items-center justify-center gap-1.5 p-[8px_14px] border-[1.5px] rounded-[8px] text-[13px] cursor-pointer ${showFilter ? 'border-[#7c4dff] bg-[#f0ebff] text-[#7c4dff]' : 'border-[#e5e7eb] bg-white text-[#374151]'}`}>
            <FilterListOutlined fontSize="small" /> Filters {filterGuruh && <span className="bg-[#7c4dff] text-white rounded-[10px] text-[10px] p-[1px_6px] ml-0.5">1</span>}
          </button>
          {showFilter && (
            <div className="absolute top-[42px] left-0 bg-white border border-[#e5e7eb] rounded-[12px] p-3.5 z-[500] w-full md:min-w-[200px] shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
              <p className="m-0 mb-2 text-[12px] font-semibold text-[#374151]">Guruh bo'yicha</p>
              <select value={filterGuruh} onChange={e => { setFilterGuruh(e.target.value); setPage(1); }}
                className="w-full p-[8px_10px] rounded-[8px] border-[1.5px] border-[#e5e7eb] text-[13px] outline-none bg-white">
                <option value="">Barchasi</option>
                {allGuruhlar.map(g => <option key={g} value={g}>{g}</option>)}
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
        <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto">
          <div className="relative flex-1 md:w-[220px]">
            <SearchOutlined className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[18px]" />
            <input placeholder="Search" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full p-[8px_14px_8px_34px] rounded-[8px] border-[1.5px] border-[#e5e7eb] text-[13px] outline-none bg-white focus:border-[#7c4dff]" />
          </div>
          <button onClick={() => { setShowArchived(a => !a); setPage(1); }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 p-[8px_14px] border-[1.5px] rounded-[8px] text-[13px] cursor-pointer whitespace-nowrap ${showArchived ? 'border-[#7c4dff] bg-[#f0ebff] text-[#7c4dff]' : 'border-[#e5e7eb] bg-white text-[#374151]'}`}>
            <ArchiveOutlined fontSize="small" /> {showArchived ? 'Faollar' : 'Arxiv'}
          </button>
        </div>
      </div>

      {/* Bulk action row */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => exportCSV(anySelected ? teachers.filter(t => t.selected) : filtered)}
          className="flex items-center gap-1 p-[7px_14px] border-[1.5px] border-[#e5e7eb] rounded-[8px] bg-white text-[#374151] text-[13px] cursor-pointer">
          <FileDownloadOutlined fontSize="small" /> Export {anySelected ? `(${teachers.filter(t => t.selected).length})` : ''}
        </button>
        <button onClick={deleteSelected} disabled={!anySelected}
          className={`flex items-center gap-1 p-[7px_14px] border-[1.5px] rounded-[8px] bg-white text-[13px] ${anySelected ? 'border-[#ef5350] text-[#ef5350] cursor-pointer' : 'border-[#e5e7eb] text-[#9ca3af] cursor-default'}`}>
          <DeleteOutlineOutlined fontSize="small" /> Delete
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[16px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] overflow-x-auto">
        <table className="w-full border-collapse text-[13px] min-w-[900px]">
          <thead>
            <tr className="border-b border-[#f1f1f5]">
              <th className="p-[12px_14px] text-left w-9">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-[#7c4dff] w-[15px] h-[15px] cursor-pointer" />
              </th>
              {COLS.map((col, i) => (
                <th key={i} className="p-[12px_10px] text-left font-semibold text-[#374151] text-[12.5px] whitespace-nowrap">
                  {col}{col === 'Nomi' ? ' ↓' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-14 text-[#9ca3af] text-[13px]">
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-[#7c4dff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Ma'lumotlar yuklanmoqda...
                </div>
              </td></tr>
            ) : paginated.map((t, rowIdx) => {
              const visibleLabels = t.labels.slice(0, 3);
              const extra = t.labels.length - 3;
              return (
                <tr key={t.id} className={`border-b border-[#f9f9fb] transition-colors duration-150 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'} hover:bg-[#f5f0ff]`}>
                  <td className="p-[10px_14px]">
                    <input type="checkbox" checked={t.selected} onChange={() => toggleSelect(t.id)} className="accent-[#7c4dff] w-[15px] h-[15px] cursor-pointer" />
                  </td>
                  {/* Name + labels */}
                  <td className="p-[10px_10px]">
                    <div className="flex items-center gap-2">
                      <Avatar name={t.name} />
                      <div>
                        <div className="font-semibold text-[#1a1a2e] text-[13px] mb-[3px]">{t.name}</div>
                        <div className="flex gap-1 flex-wrap">
                          {visibleLabels.map((l, i) => <LabelBadge key={i} text={l} idx={i} />)}
                          {extra > 0 && <span className="bg-[#f1f1f5] rounded-[6px] p-[2px_7px] text-[11px] text-[#6b7280] font-semibold">+{extra}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-2.5 text-[#6b7280]">{t.guruh || '—'}</td>
                  <td className="p-2.5 text-[#374151]">{t.phone}</td>
                  <td className="p-2.5 text-[#6b7280]">{t.born}</td>
                  <td className="p-2.5 text-[#6b7280]">{t.created}</td>

                  {/* Actions */}
                  <td className="p-2.5">
                    <div className="flex gap-1 items-center">
                      <button onClick={() => archiveOne(t.id)} title={t.archived ? 'Arxivdan chiqarish' : 'Arxivga qo\'shish'} className="bg-none border-none cursor-pointer text-[#9ca3af] flex p-[3px]"><RefreshOutlined style={{ fontSize: '16px' }} /></button>
                      <button onClick={() => deleteOne(t.id)} className="bg-none border-none cursor-pointer text-[#ef5350] flex p-[3px]"><DeleteOutlineOutlined style={{ fontSize: '16px' }} /></button>
                      <button onClick={() => openEdit(t)} className="bg-none border-none cursor-pointer text-[#7c4dff] flex p-[3px]"><EditOutlined style={{ fontSize: '16px' }} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className={`flex items-center gap-1 p-[8px_16px] border-[1.5px] border-[#e5e7eb] rounded-[8px] bg-white text-[13px] font-medium ${page === 1 ? 'text-[#d1d5db] cursor-default' : 'text-[#374151] cursor-pointer'}`}>
          <ChevronLeftOutlined fontSize="small" /> Previous
        </button>
        <div className="flex gap-1">
          {pageNums().map((n, i) =>
            n === '...' ? (
              <span key={i} className="p-[7px_6px] text-[#9ca3af] text-[13px]">...</span>
            ) : (
              <button key={i} onClick={() => setPage(n)}
                className={`w-[34px] h-[34px] rounded-[8px] border-none text-[13px] cursor-pointer ${page === n ? 'bg-[#7c4dff] text-white font-bold' : 'bg-transparent text-[#374151] font-normal'}`}>
                {n}
              </button>
            )
          )}
        </div>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
          className={`flex items-center gap-1 p-[8px_16px] border-[1.5px] border-[#e5e7eb] rounded-[8px] bg-white text-[13px] font-medium ${page === totalPages ? 'text-[#d1d5db] cursor-default' : 'text-[#374151] cursor-pointer'}`}>
          Next <ChevronRightOutlined fontSize="small" />
        </button>
      </div>
    </div>
  );
};

export default Teachers;
