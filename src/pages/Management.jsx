import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Dashboard from './Dashboard';
import {
  AddOutlined, DeleteOutlineOutlined, EditOutlined,
  SchoolOutlined, MeetingRoomOutlined, AccountBalanceOutlined,
  PeopleAltOutlined, ReportProblemOutlined, AdminPanelSettingsOutlined,
  SendOutlined, HelpOutlineOutlined,
  FactCheckOutlined,
  RefreshOutlined, CloseOutlined, CreditCardOutlined, SearchOutlined,
  ChevronRightOutlined,
  ChevronLeftOutlined,
} from '@mui/icons-material';




const menuItems = [
  { icon: <SchoolOutlined fontSize="small" />, label: 'Kurslar' },
  { icon: <MeetingRoomOutlined fontSize="small" />, label: 'Xonalar' },
];

const filialTabs = ['Filial 1', 'Filial 2', 'Arxiv'];

const initialCourseCards = [
  { id: 1, title: 'Human Resources Manager', desc: "A little about the company and the team that you'll be working with. A li...", duration: '90 min', period: '3 oy', price: '1 000 000 mln', bg: '#e8f0fe', border: '#c5d7fb' },
  { id: 2, title: 'Human Resources Manager', desc: "A little about the company and the team that you'll be working with. A li...", duration: '90 min', period: '3 oy', price: '1 000 000 mln', bg: '#fce8f3', border: '#f5c6e4' },
  { id: 3, title: 'Human Resources Manager', desc: "A little about the company and the team that you'll be working with. A li...", duration: '90 min', period: '3 oy', price: '1 000 000 mln', bg: '#fff3e0', border: '#ffe0b2' },
  { id: 4, title: 'Human Resources Manager', desc: "A little about the company and the team that you'll be working with. A li...", duration: '90 min', period: '3 oy', price: '1 000 000 mln', bg: '#e8f5e9', border: '#c8e6c9' },
  { id: 5, title: 'Human Resources Manager', desc: "A little about the company and the team that you'll be working with. A li...", duration: '90 min', period: '3 oy', price: '1 000 000 mln', bg: '#e8f0fe', border: '#c5d7fb' },
  { id: 6, title: 'Human Resources Manager', desc: "A little about the company and the team that you'll be working with. A li...", duration: '90 min', period: '3 oy', price: '1 000 000 mln', bg: '#fce8f3', border: '#f5c6e4' },
];

const darsDavomiyligi = ['30 min', '45 min', '60 min', '90 min', '120 min'];
const kursDavomlyligi = ['1 oy', '2 oy', '3 oy', '4 oy', '6 oy', '12 oy'];
const rangli = ['#2c3e50','#7c4dff','#e53935','#f57c00','#2e7d32','#00838f','#1565c0','#4527a0','#c2185b'];
const bgColors = ['#e8f0fe','#fce8f3','#fff3e0','#e8f5e9','#e0f7fa','#fffde7','#f3e5f5','#fbe9e7'];
const borderColors = ['#c5d7fb','#f5c6e4','#ffe0b2','#c8e6c9','#b2ebf2','#fff9c4','#e1bee7','#ffccbc'];

const KurslarContent = () => {
  const [activeFilial, setActiveFilial] = useState(0);
  const [search, setSearch] = useState('');
  const [courses, setCourses] = useState([]);
  const [archivedCourses, setArchivedCourses] = useState([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, title }
  const [form, setForm] = useState({
    nomi: '', filiallar: ['Filial 1', 'Filial 2'],
    darsDavomiyligi: '', kursDavomiyligi: '',
    narx: '', description: '', rangi: rangli[1],
  });

  const resetForm = () => setForm({ nomi: '', filiallar: ['Filial 1', 'Filial 2'], darsDavomiyligi: '', kursDavomiyligi: '', narx: '', description: '', rangi: rangli[1] });

  const BASE_URL = 'https://najot-edu.softwareengineer.uz/api/v1';

  // GET /api/v1/courses  va  GET /api/v1/courses/archive
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };
    const idx_map = ['#e8f0fe','#fce8f3','#fff3e0','#e8f5e9','#e8f0fe','#fce8f3'];
    const brd_map = ['#c5d7fb','#f5c6e4','#ffe0b2','#c8e6c9','#c5d7fb','#f5c6e4'];
    const mapCourse = (c, i) => ({
      id: c.id,
      title: c.name || c.title || '',
      desc: c.description || "Kurs haqida ma'lumot mavjud emas.",
      duration: c.duration_hours ? `${c.duration_hours} soat` : '90 min',
      period: c.duration_month ? `${c.duration_month} oy` : '3 oy',
      price: c.price ? `${Number(c.price).toLocaleString()} so'm` : "0 so'm",
      bg: idx_map[i % idx_map.length],
      border: brd_map[i % brd_map.length],
    });

    Promise.all([
      fetch(`${BASE_URL}/courses`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${BASE_URL}/courses/archive`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([activeData, archiveData]) => {
      const toList = (d) => Array.isArray(d) ? d : (d?.data || d?.courses || []);
      setCourses(toList(activeData).map(mapCourse));
      setArchivedCourses(toList(archiveData).map(mapCourse));
      setLoading(false);
    });
  }, []);

  const toggleFilial = (f) => {
    setForm(prev => ({
      ...prev,
      filiallar: prev.filiallar.includes(f) ? prev.filiallar.filter(x => x !== f) : [...prev.filiallar, f],
    }));
  };

  const openAdd = () => { setEditId(null); resetForm(); setDrawerOpen(true); };

  const openEdit = (course) => {
    setEditId(course.id);
    setForm({
      nomi: course.title,
      filiallar: ['Filial 1', 'Filial 2'],
      darsDavomiyligi: course.duration,
      kursDavomiyligi: course.period,
      narx: course.price.replace(/[^0-9]/g, ''),
      description: course.desc,
      rangi: course.rangi || rangli[1],
    });
    setDrawerOpen(true);
  };

  // DELETE /api/v1/courses/{id}
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    const token = localStorage.getItem('accessToken');
    try {
      await fetch(`${BASE_URL}/courses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* ignore */ }
    // UI da arxivga o'tkazamiz
    const course = courses.find(c => c.id === id);
    setCourses(prev => prev.filter(c => c.id !== id));
    if (course) setArchivedCourses(prev => [...prev, course]);
    setDeleteConfirm(null);
  };

  const handleSave = async () => {
    if (!form.nomi.trim()) return;
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const body = {
      name: form.nomi.trim(),
      description: form.description || form.nomi.trim(),
      price: parseFloat(form.narx) || 0,
      duration_month: parseInt(form.kursDavomiyligi) || 3,
      duration_hours: parseInt(form.darsDavomiyligi) || 90,
    };

    if (editId !== null) {
      // PATCH /api/v1/courses/{id}
      try {
        const res = await fetch(`${BASE_URL}/courses/${editId}`, {
          method: 'PATCH', headers, body: JSON.stringify(body),
        });
        if (res.ok) {
          setCourses(prev => prev.map(c => c.id === editId ? {
            ...c, title: form.nomi.trim(), desc: form.description,
            duration: form.darsDavomiyligi, period: form.kursDavomiyligi,
            price: form.narx ? `${form.narx} so'm` : c.price,
          } : c));
        } else {
          try {
            const err = await res.json();
            const rawMsg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || '');
            const msg = rawMsg.toLowerCase().includes('already exist') || rawMsg.toLowerCase().includes('exists')
              ? `"${form.nomi}" nomli kurs allaqachon mavjud. Boshqa nom bering.`
              : rawMsg || `Xatolik: ${res.status}`;
            alert(msg);
          } catch { alert(`Xatolik: ${res.status}`); }
          return;
        }
      } catch { alert('Server bilan ulanishda xatolik!'); return; }
    } else {
      // POST /api/v1/courses
      try {
        const res = await fetch(`${BASE_URL}/courses`, {
          method: 'POST', headers, body: JSON.stringify(body),
        });
        if (res.ok) {
          const saved = await res.json();
          const idx = courses.length % bgColors.length;
          setCourses(prev => [...prev, {
            id: saved.id || Date.now(),
            title: form.nomi.trim(),
            desc: form.description || "A little about the company and the team that you'll be working with.",
            duration: form.darsDavomiyligi || '90 min',
            period: form.kursDavomiyligi || '3 oy',
            price: form.narx ? `${form.narx} so'm` : '0 so\'m',
            bg: bgColors[idx], border: borderColors[idx],
          }]);
        } else {
          try {
            const err = await res.json();
            const rawMsg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || '');
            const msg = rawMsg.toLowerCase().includes('already exist') || rawMsg.toLowerCase().includes('exists')
              ? `"${form.nomi}" nomli kurs allaqachon mavjud. Boshqa nom bering.`
              : rawMsg || `Xatolik: ${res.status}`;
            alert(msg);
          } catch { alert(`Xatolik: ${res.status}`); }
          return;
        }
      } catch { alert('Server bilan ulanishda xatolik!'); return; }
    }
    resetForm();
    setDrawerOpen(false);
  };

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[16px] p-5 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">

      {/* O'chirish tasdiqlash modal */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 z-[1400] bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
            <div className="bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.18)] w-full max-w-[360px] p-6">
              <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>Kursni o'chirish</h3>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280' }}>
                <strong>"{deleteConfirm.title}"</strong> kursini o'chirishni hohlaysizmi?
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setDeleteConfirm(null)}
                  style={{ padding: '9px 22px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                  Bekor qilish
                </button>
                <button onClick={handleDelete}
                  style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
                  Ha
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Overlay */}
      {drawerOpen && <div onClick={() => { setDrawerOpen(false); resetForm(); }} className="fixed inset-0 z-[1100] bg-black/22" />}

      {/* Slide-out Drawer */}
      <div className={`fixed top-0 right-0 h-screen w-full sm:w-[420px] bg-white z-[1200] flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.12)] transition-transform duration-350 ease-[cubic-bezier(0.4,0,0.2,1)] ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="p-[20px_20px_14px] border-b border-[#f1f1f5]">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="m-0 mb-1 text-[17px] font-bold text-[#1a1a2e]">{editId ? 'Kursni tahrirlash' : 'Kurs qoshish'}</h2>
              <p className="m-0 text-[12.5px] text-[#9ca3af]">Bu yerda siz yangi Kurs qo'shishingiz yoki tahrirlashingiz mumkin.</p>
            </div>
            <button onClick={() => { setDrawerOpen(false); resetForm(); }} className="bg-none border-none cursor-pointer text-[#9ca3af] flex p-[2px]">
              <CloseOutlined fontSize="small" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Nomi */}
          <div className="mb-[18px]">
            <label className="block text-[13px] font-semibold text-[#374151] mb-[7px]">Nomi</label>
            <input type="text" placeholder="HR Manager..." value={form.nomi} onChange={e => setForm({ ...form, nomi: e.target.value })}
              className="w-full p-[10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff]" />
          </div>

          {/* Filiallar */}
          <div className="mb-[18px]">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[13px] font-semibold text-[#374151]">Kurs mavjud boledigon filiallar</label>
              <button onClick={() => setForm({ ...form, filiallar: ['Filial 1', 'Filial 2'] })} className="bg-none border-none color-[#7c4dff] text-[12.5px] cursor-pointer font-semibold text-[#7c4dff]">Hammasini tanlash</button>
            </div>
            {['Filial 1', 'Filial 2'].map(f => (
              <label key={f} className="flex items-center gap-2 mb-2 cursor-pointer text-[13.5px] text-[#374151]">
                <input type="checkbox" checked={form.filiallar.includes(f)} onChange={() => toggleFilial(f)}
                  className="accent-[#7c4dff] w-4 h-4 cursor-pointer" />
                {f}
              </label>
            ))}
          </div>

          {/* Dars davomiyligi */}
          <div className="mb-[18px]">
            <label className="block text-[13px] font-semibold text-[#374151] mb-[7px]">Dars davomiyligi</label>
            <select value={form.darsDavomiyligi} onChange={e => setForm({ ...form, darsDavomiyligi: e.target.value })}
              className={`w-full p-[10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none bg-white cursor-pointer ${form.darsDavomiyligi ? 'text-[#1a1a2e]' : 'text-[#9ca3af]'}`}>
              <option value="">Tanlang</option>
              {darsDavomiyligi.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Kurs davomiyligi */}
          <div className="mb-[18px]">
            <label className="block text-[13px] font-semibold text-[#374151] mb-[7px]">Kurs davomiyligi (oylarda)</label>
            <select value={form.kursDavomiyligi} onChange={e => setForm({ ...form, kursDavomiyligi: e.target.value })}
              className={`w-full p-[10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none bg-white cursor-pointer ${form.kursDavomiyligi ? 'text-[#1a1a2e]' : 'text-[#9ca3af]'}`}>
              <option value="">Tanlang</option>
              {kursDavomlyligi.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Narx */}
          <div className="mb-[18px]">
            <label className="block text-[13px] font-semibold text-[#374151] mb-[7px]">Narx</label>
            <div className="relative">
              <CreditCardOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]" />
              <input type="text" placeholder="Narxini kiriting" value={form.narx} onChange={e => setForm({ ...form, narx: e.target.value })}
                className="w-full p-[10px_14px_10px_38px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff]" />
            </div>
          </div>

          {/* Description */}
          <div className="mb-[18px]">
            <label className="block text-[13px] font-semibold text-[#374151] mb-[7px]">Description</label>
            <textarea placeholder="A little about the company and the team that you'll be working with." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4} className="w-full p-[10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none resize-none box-border font-inherit focus:border-[#7c4dff]" />
            <p className="m-0 mt-1.5 text-[12px] text-[#9ca3af]">This is a hint text to help user.</p>
          </div>

          {/* Rangi */}
          <div className="mb-2">
            <label className="block text-[13px] font-semibold text-[#374151] mb-1">Rangi</label>
            <p className="m-0 mb-2.5 text-[12px] text-[#9ca3af]">The color you choose will be displayed to users and in the list of roles.</p>
            <div className="flex gap-2 flex-wrap">
              {rangli.map(c => (
                <button key={c} onClick={() => setForm({ ...form, rangi: c })}
                  className={`w-8 h-8 rounded-full cursor-pointer transition-all duration-150 ${form.rangi === c ? 'border-[3px] border-[#7c4dff] outline-[2px] outline-white -outline-offset-5' : 'border-[3px] border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-[14px_20px] border-t border-[#f1f1f5] flex gap-2.5 justify-end">
          <button onClick={() => { setDrawerOpen(false); resetForm(); }}
            className="p-[10px_20px] rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-white text-[#6b7280] text-[13.5px] font-semibold cursor-pointer hover:bg-[#f5f5fb]">
            Bekor qilish
          </button>
          <button onClick={handleSave}
            className="p-[10px_24px] rounded-[10px] border-none bg-[#7c4dff] text-white text-[13.5px] font-semibold cursor-pointer hover:opacity-90">
            Saqlash
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <span className="font-semibold text-[15px] text-[#1a1a2e]">Kurslar</span>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[220px]">
            <SearchOutlined className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[18px]" />
            <input placeholder="Search" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full p-[8px_14px_8px_34px] rounded-[8px] border-[1.5px] border-[#e5e7eb] text-[13px] outline-none bg-white focus:border-[#7c4dff]" />
          </div>
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#7c4dff] text-white border-none rounded-[10px] p-[8px_16px] text-[13px] font-semibold cursor-pointer hover:opacity-90 whitespace-nowrap">
            <AddOutlined fontSize="small" /> Kurslar qo'shish
          </button>
        </div>
      </div>

      {/* Filial tabs */}
      <div className="flex gap-1 mb-5">
        {filialTabs.map((tab, i) => (
          <button key={i} onClick={() => setActiveFilial(i)} className={`p-[7px_16px] border-none rounded-[8px] cursor-pointer text-[13px] transition-all duration-150 ${activeFilial === i ? 'font-semibold bg-[#f0ebff] text-[#7c4dff]' : 'font-normal bg-[#f5f5fb] text-[#6b7280]'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Course cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {filteredCourses.map((card) => (
          <div key={card.id} className="rounded-[12px] p-3.5 border" style={{ background: card.bg, borderColor: card.border }}>
            <div className="flex justify-between items-start mb-1.5">
              <span className="font-semibold text-[13px] text-[#1a1a2e] leading-[1.4]">{card.title}</span>
              <div className="flex gap-1 shrink-0 ml-1.5">
                <button onClick={() => setDeleteConfirm({ id: card.id, title: card.title })} className="bg-white/85 border-none rounded-[6px] p-1 cursor-pointer text-[#ef5350] flex transition-colors hover:bg-white">
                  <DeleteOutlineOutlined style={{ fontSize: '14px' }} />
                </button>
                <button onClick={() => openEdit(card)} className="bg-white/85 border-none rounded-[6px] p-1 cursor-pointer text-[#7c4dff] flex transition-colors hover:bg-white">
                  <EditOutlined style={{ fontSize: '14px' }} />
                </button>
              </div>
            </div>
            <p className="text-[11.5px] text-[#6b7280] m-0 mb-2.5 leading-[1.5]">{card.desc}</p>
            <div className="flex gap-1.5 flex-wrap">
              {[card.duration, card.period, card.price].map((info, j) => (
                <span key={j} className="text-[11px] text-[#374151] font-medium bg-white/75 rounded-[6px] p-[2px_7px]">{info}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const xonalarFilialTabs = ['Fizika va Matematika', '4-maktab', 'Niner markazi', 'IELTS full mock', 'IELTS full mock centre', 'Arxiv'];

const initialRooms = [
  { id: 1, name: 'genius room', capacity: 15 },
  { id: 2, name: 'Impact room', capacity: 12 },
  { id: 3, name: '1A', capacity: 25 },
  { id: 4, name: '205-xona', capacity: 32 },
  { id: 5, name: '16-xona', capacity: 18 },
  { id: 6, name: '5 xona', capacity: 30 },
  { id: 7, name: 'IELTS with islombek', capacity: 20 },
  { id: 8, name: 'Beginner', capacity: 18 },
  { id: 9, name: '99', capacity: 25 },
];

const XonalarContent = () => {
  const [activeFilial, setActiveFilial] = useState(0);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({ nomi: '', sigimi: '' });
  const [rooms, setRooms] = useState([]);
  const [archivedRooms, setArchivedRooms] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }

  const BASE_URL = 'https://najot-edu.softwareengineer.uz/api/v1';
  const isArchiveTab = activeFilial === xonalarFilialTabs.length - 1;

  // GET /api/v1/rooms  va  GET /api/v1/rooms/arxive
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${BASE_URL}/rooms`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${BASE_URL}/rooms/arxive`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([activeData, archiveData]) => {
      const toRoomList = (d) => {
        if (!d) return [];
        const list = Array.isArray(d) ? d : (d.data || d.rooms || []);
        return list.map(r => ({ id: r.id, name: r.name || '', capacity: r.capacity || 0 }));
      };
      setRooms(toRoomList(activeData));
      setArchivedRooms(toRoomList(archiveData));
      setLoading(false);
    });
  }, []);

  const openAdd = () => { setEditId(null); setForm({ nomi: '', sigimi: '' }); setDrawerOpen(true); };
  const openEdit = (room) => { setEditId(room.id); setForm({ nomi: room.name, sigimi: String(room.capacity) }); setDrawerOpen(true); };

  // O'chirishni tasdiqlash
  const confirmDelete = (room) => setDeleteConfirm({ id: room.id, name: room.name });

  // DELETE /api/v1/rooms/{id}
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      await fetch(`${BASE_URL}/rooms/${id}`, { method: 'DELETE', headers });
    } catch { /* ignore, UI da baribir arxivga o'tkazamiz */ }

    // UI da arxivga o'tkazamiz
    const room = rooms.find(r => r.id === id);
    setRooms(prev => prev.filter(r => r.id !== id));
    if (room) setArchivedRooms(prev => [...prev, room]);
    setDeleteConfirm(null);
  };

  // Arxivdan qayta tiklash — PATCH /api/v1/rooms/{id}
  const handleRestore = async (room) => {
    const token = localStorage.getItem('accessToken');
    try {
      await fetch(`${BASE_URL}/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: room.name, capacity: room.capacity }),
      });
    } catch { /* ignore */ }
    setArchivedRooms(prev => prev.filter(r => r.id !== room.id));
    setRooms(prev => [...prev, room]);
  };

  const handleSave = async () => {
    if (!form.nomi.trim()) return;
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const body = { name: form.nomi.trim(), capacity: parseInt(form.sigimi) || 0 };

    if (editId !== null) {
      // PATCH /api/v1/rooms/{id}
      try {
        const res = await fetch(`${BASE_URL}/rooms/${editId}`, {
          method: 'PATCH', headers, body: JSON.stringify(body),
        });
        if (res.ok) {
          setRooms(prev => prev.map(r => r.id === editId ? { ...r, name: form.nomi.trim(), capacity: parseInt(form.sigimi) || 0 } : r));
        } else {
          try { const err = await res.json(); alert(err.message || `Xatolik: ${res.status}`); } catch { alert(`Xatolik: ${res.status}`); }
          return;
        }
      } catch { alert('Server bilan ulanishda xatolik!'); return; }
    } else {
      // POST /api/v1/rooms
      try {
        const res = await fetch(`${BASE_URL}/rooms`, {
          method: 'POST', headers, body: JSON.stringify(body),
        });
        if (res.ok) {
          const saved = await res.json();
          setRooms(prev => [...prev, { id: saved.id || Date.now(), name: form.nomi.trim(), capacity: parseInt(form.sigimi) || 0 }]);
        } else {
          try { const err = await res.json(); alert(err.message || `Xatolik: ${res.status}`); } catch { alert(`Xatolik: ${res.status}`); }
          return;
        }
      } catch { alert('Server bilan ulanishda xatolik!'); return; }
    }
    setForm({ nomi: '', sigimi: '' });
    setEditId(null);
    setDrawerOpen(false);
  };

  const displayRooms = isArchiveTab
    ? archivedRooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-white rounded-[16px] p-5 shadow-[0_1px_8px_rgba(0,0,0,0.06)] relative">

      {/* O'chirish tasdiqlash modal */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 z-[1400] bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
            <div className="bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.18)] w-full max-w-[360px] p-6">
              <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>Xonani o'chirish</h3>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280' }}>
                <strong>"{deleteConfirm.name}"</strong> xonasini o'chirishni hohlaysizmi?
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setDeleteConfirm(null)}
                  style={{ padding: '9px 22px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                  Bekor qilish
                </button>
                <button onClick={handleDelete}
                  style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
                  Ha
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Right-side drawer overlay */}
      {drawerOpen && <div onClick={() => setDrawerOpen(false)} className="fixed inset-0 z-[1100] bg-black/18" />}

      {/* Drawer panel */}
      <div className={`fixed top-0 right-0 h-screen w-full sm:w-[360px] bg-white z-[1200] flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.10)] transition-transform duration-350 ease-[cubic-bezier(0.4,0,0.2,1)] ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center gap-2.5 p-[20px_20px_16px_16px] border-b border-[#f1f1f5]">
          <button onClick={() => setDrawerOpen(false)}
            className="w-[30px] h-[30px] rounded-[8px] border-none bg-[#f5f5fb] cursor-pointer flex items-center justify-center text-[#7c4dff] shrink-0">
            <ChevronLeftOutlined fontSize="small" />
          </button>
          <span className="font-bold text-[16px] text-[#1a1a2e]">
            {editId !== null ? "Xonani tahrirlash" : "Xonani qo'shish"}
          </span>
        </div>
        <div className="flex-1 p-[24px_20px] overflow-y-auto">
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#374151] mb-2">Nomi <span className="text-[#ef5350]">*</span></label>
            <input type="text" placeholder="Xona nomi" value={form.nomi} onChange={e => setForm({ ...form, nomi: e.target.value })}
              className="w-full p-[10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff]" />
          </div>
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#374151] mb-2">Sig'imi <span className="text-[#ef5350]">*</span></label>
            <input type="number" placeholder="Masalan: 20" value={form.sigimi} onChange={e => setForm({ ...form, sigimi: e.target.value })}
              className="w-full p-[10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff]" />
          </div>
        </div>
        <div className="p-[16px_20px] border-t border-[#f1f1f5] flex gap-2.5 justify-end">
          <button onClick={() => { setDrawerOpen(false); setForm({ nomi: '', sigimi: '' }); }}
            className="p-[10px_20px] rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-white text-[#6b7280] text-[13.5px] font-semibold cursor-pointer hover:bg-[#f5f5fb]">
            Bekor qilish
          </button>
          <button onClick={handleSave}
            className="p-[10px_24px] rounded-[10px] border-none bg-[#7c4dff] text-white text-[13.5px] font-semibold cursor-pointer hover:opacity-90">
            Saqlash
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[15px] text-[#1a1a2e]">Xonalar</span>
          <button onClick={() => { setLoading(true); }} className="bg-none border-none cursor-pointer text-[#9ca3af] flex items-center p-0.5">
            <RefreshOutlined style={{ fontSize: '16px' }} />
          </button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[220px]">
            <SearchOutlined className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[18px]" />
            <input placeholder="Search" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full p-[8px_14px_8px_34px] rounded-[8px] border-[1.5px] border-[#e5e7eb] text-[13px] outline-none bg-white focus:border-[#7c4dff]" />
          </div>
          {!isArchiveTab && (
            <button onClick={openAdd}
              className="flex items-center gap-1.5 bg-[#7c4dff] text-white border-none rounded-[10px] p-[8px_16px] text-[13px] font-semibold cursor-pointer hover:opacity-90 whitespace-nowrap">
              <AddOutlined fontSize="small" /> Xonani qo'shish
            </button>
          )}
        </div>
      </div>

      {/* Filial tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {xonalarFilialTabs.map((tab, i) => (
          <button key={i} onClick={() => setActiveFilial(i)}
            className={`p-[6px_14px] border-none rounded-[8px] cursor-pointer text-[12.5px] transition-all duration-150 ${activeFilial === i ? 'font-semibold bg-[#f0ebff] text-[#7c4dff]' : 'font-normal bg-[#f5f5fb] text-[#6b7280]'}`}>
            {tab}
            {i === xonalarFilialTabs.length - 1 && archivedRooms.length > 0 && (
              <span className="ml-1.5 bg-[#9ca3af] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{archivedRooms.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Rooms grid */}
      {loading ? (
        <div className="py-10 text-center text-[#9ca3af] text-[13px]">Yuklanmoqda...</div>
      ) : displayRooms.length === 0 ? (
        <div className="py-10 text-center text-[#9ca3af] text-[13px]">
          {isArchiveTab ? 'Arxivda xonalar yo\'q' : 'Xonalar mavjud emas'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {displayRooms.map((room) => (
            <div key={room.id} className={`border rounded-[10px] p-[14px_14px_12px_14px] ${isArchiveTab ? 'bg-[#f9fafb] border-[#e5e7eb]' : 'bg-[#fafafa] border-[#f1f1f5]'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="m-0 mb-1 font-semibold text-[13px] text-[#1a1a2e]">{room.name}</p>
                  <p className="m-0 text-[12px] text-[#9ca3af]">Sig'imi: {room.capacity}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {isArchiveTab ? (
                    <button onClick={() => handleRestore(room)}
                      className="bg-white border border-[#7c4dff] rounded-[6px] px-2 py-1 cursor-pointer text-[#7c4dff] text-[11px] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:bg-[#f0ebff]">
                      Tiklash
                    </button>
                  ) : (
                    <>
                      <button onClick={() => confirmDelete(room)}
                        className="bg-white border-none rounded-[6px] p-1 cursor-pointer text-[#ef5350] flex shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                        <DeleteOutlineOutlined style={{ fontSize: '14px' }} />
                      </button>
                      <button onClick={() => openEdit(room)}
                        className="bg-white border-none rounded-[6px] p-1 cursor-pointer text-[#7c4dff] flex shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                        <EditOutlined style={{ fontSize: '14px' }} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};



const Management = () => {
  const [activeItem, setActiveItem] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const context = useOutletContext();
  const isDesktopSidebarOpen = context ? context.isDesktopSidebarOpen : true;

  return (
    <div className="relative">

      {/* Fixed full-height sliding panel */}
      <div className={`fixed top-0 h-screen overflow-hidden transition-all duration-350 ease-[cubic-bezier(0.4,0,0.2,1)] z-[1000] rounded-r-3xl 
        ${panelOpen ? 'w-[220px] shadow-[4px_0_24px_rgba(124,77,255,0.10)]' : 'w-0 shadow-none'}
        ${isDesktopSidebarOpen ? 'lg:left-[256px]' : 'lg:left-[80px]'} left-0`}
      >
        <div className="w-[220px] h-full bg-white flex flex-col">
          {/* Panel header */}
          <div className="flex items-center justify-between p-[20px_16px_14px_16px] border-b border-[#f1f1f5]">
            <span className="font-bold text-[15px] text-[#1a1a2e]">Menu</span>
            <button
              onClick={() => setPanelOpen(false)}
              className="w-[28px] h-[28px] rounded-[8px] border-none bg-[#f5f5fb] cursor-pointer flex items-center justify-center text-[#7c4dff] shrink-0 transition-colors duration-200 hover:bg-[#ede9ff]"
            >
              <ChevronLeftOutlined fontSize="small" style={{ transform: panelOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 350ms cubic-bezier(0.4,0,0.2,1)' }} />
            </button>
          </div>
          {/* Menu items */}
          <nav className="p-2.5 flex-1 overflow-y-auto">
            {menuItems.map((item, idx) => (
              <button key={idx} onClick={() => { setActiveItem(idx); setPanelOpen(false); }} 
                className={`flex items-center gap-2.5 w-full p-[10px_12px] rounded-[10px] border-none cursor-pointer font-medium text-[13.5px] text-left mb-0.5 transition-all duration-180 whitespace-nowrap ${activeItem === idx ? 'bg-[#ede9ff] text-[#7c4dff] font-semibold' : 'bg-transparent text-[#6b7280] hover:bg-[#f5f5fb] hover:text-[#7c4dff]'}`}>
                <span className={`flex items-center ${activeItem === idx ? 'text-[#7c4dff]' : 'text-[#9ca3af]'}`}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Floating reopen button — visible only when panel is closed */}
      <button
        onClick={() => setPanelOpen(true)}
        className={`fixed top-[72px] z-[1001] w-[28px] h-[28px] rounded-r-[8px] border-none bg-white shadow-[2px_0_8px_rgba(124,77,255,0.15)] cursor-pointer flex items-center justify-center text-[#7c4dff] transition-all duration-350 hover:bg-[#ede9ff] ${panelOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${isDesktopSidebarOpen ? 'lg:left-[256px]' : 'lg:left-[80px]'} left-0`}
      >
        <ChevronRightOutlined fontSize="small" />
      </button>

      {/* Main content — shifts right when panel is open */}
      <div className={`transition-all duration-350 ease-[cubic-bezier(0.4,0,0.2,1)] py-1 ${panelOpen ? 'lg:ml-[220px]' : 'ml-0'}`}>
        {activeItem === null ? (
          <Dashboard />
        ) : (
          <>
            <h1 className="text-[24px] font-bold text-[#1a1a2e] m-0 mb-1.5">Boshqarish</h1>
            <p className="text-[13.5px] text-[#6b7280] m-0 mb-5 leading-[1.6]">
              Ushbu sahifada siz kurslar va xonalarni boshqarish imkoniyatiga ega bo'lasiz. Har bir bo'limda qidiruv, tahrirlash va o'chirish imkoniyati bor.
            </p>

            {/* Horizontal tabs — panel bilan sinxron */}
            <div className="flex border-b-2 border-[#f1f1f5] mb-5 overflow-x-auto">
              {menuItems.map((item, i) => (
                <button key={i} onClick={() => setActiveItem(i)} className={`p-[10px_16px] border-none bg-transparent cursor-pointer text-[13.5px] transition-all duration-180 mb-[-2px] whitespace-nowrap ${activeItem === i ? 'font-semibold text-[#7c4dff] border-b-2 border-[#7c4dff]' : 'font-normal text-[#6b7280] border-b-2 border-transparent'}`}>
                  {item.label}
                </button>
              ))}
            </div>

            {activeItem === 0 ? (
              <KurslarContent />
            ) : activeItem === 1 ? (
              <XonalarContent />
            ) : (
              <div className="bg-white rounded-[16px] p-8 shadow-[0_1px_8px_rgba(0,0,0,0.06)] text-[#9ca3af] text-center text-[14px]">
                {menuItems[activeItem].label} bo'limi tez orada qo'shiladi.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Management;
