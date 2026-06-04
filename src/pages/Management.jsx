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

  // GET /api/v1/courses
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    fetch(`${BASE_URL}/courses`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.courses)) list = data.courses;
        const idx_map = ['#e8f0fe','#fce8f3','#fff3e0','#e8f5e9','#e8f0fe','#fce8f3'];
        const brd_map = ['#c5d7fb','#f5c6e4','#ffe0b2','#c8e6c9','#c5d7fb','#f5c6e4'];
        const mapped = list.map((c, i) => ({
          id: c.id,
          title: c.name || c.title || '',
          desc: c.description || "Kurs haqida ma'lumot mavjud emas.",
          duration: c.duration_hours ? `${c.duration_hours} soat` : '90 min',
          period: c.duration_month ? `${c.duration_month} oy` : '3 oy',
          price: c.price ? `${Number(c.price).toLocaleString()} so'm` : '0 so\'m',
          bg: idx_map[i % idx_map.length],
          border: brd_map[i % brd_map.length],
        }));
        setCourses(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
  const handleDelete = async (id) => {
    const token = localStorage.getItem('accessToken');
    try {
      await fetch(`${BASE_URL}/courses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch { setCourses(prev => prev.filter(c => c.id !== id)); }
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
                <button onClick={() => handleDelete(card.id)} className="bg-white/85 border-none rounded-[6px] p-1 cursor-pointer text-[#ef5350] flex transition-colors hover:bg-white">
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
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);

  const BASE_URL = 'https://najot-edu.softwareengineer.uz/api/v1';

  // GET /api/v1/rooms
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    fetch(`${BASE_URL}/rooms`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.rooms)) list = data.rooms;
        setRooms(list.map(r => ({ id: r.id, name: r.name || '', capacity: r.capacity || 0 })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const openAdd = () => { setEditId(null); setForm({ nomi: '', sigimi: '' }); setDrawerOpen(true); };

  const openEdit = (room) => {
    setEditId(room.id);
    setForm({ nomi: room.name, sigimi: String(room.capacity) });
    setDrawerOpen(true);
  };

  // DELETE /api/v1/rooms/{id}
  const handleDelete = async (id) => {
    const token = localStorage.getItem('accessToken');
    try {
      await fetch(`${BASE_URL}/rooms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(prev => prev.filter(r => r.id !== id));
    } catch { setRooms(prev => prev.filter(r => r.id !== id)); }
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

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-white rounded-[16px] p-5 shadow-[0_1px_8px_rgba(0,0,0,0.06)] relative">

      {/* Right-side drawer overlay */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-[1100] bg-black/18" />
      )}

      {/* Drawer panel — slides from right */}
      <div className={`fixed top-0 right-0 h-screen w-full sm:w-[360px] bg-white z-[1200] flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.10)] transition-transform duration-350 ease-[cubic-bezier(0.4,0,0.2,1)] ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Drawer header */}
        <div className="flex items-center gap-2.5 p-[20px_20px_16px_16px] border-b border-[#f1f1f5]">
          <button onClick={() => setDrawerOpen(prev => !prev)}
            className="w-[30px] h-[30px] rounded-[8px] border-none bg-[#f5f5fb] cursor-pointer flex items-center justify-center text-[#7c4dff] shrink-0 transition-colors duration-200 hover:bg-[#ede9ff]">
            <ChevronLeftOutlined fontSize="small" style={{ transform: drawerOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 350ms cubic-bezier(0.4,0,0.2,1)' }} />
          </button>
          <span className="font-bold text-[16px] text-[#1a1a2e]">
            {editId !== null ? "Xonani tahrirlash" : "Xonani qo'shish"}
          </span>
        </div>

        {/* Drawer form */}
        <div className="flex-1 p-[24px_20px] overflow-y-auto">
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#374151] mb-2">
              Nomi <span className="text-[#ef5350]">*</span>
            </label>
            <input
              type="text"
              placeholder="Xona nomi"
              value={form.nomi}
              onChange={e => setForm({ ...form, nomi: e.target.value })}
              className="w-full p-[10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] text-[#1a1a2e] outline-none box-border transition-colors duration-200 focus:border-[#7c4dff]"
            />
          </div>
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#374151] mb-2">
              Sig'imi <span className="text-[#ef5350]">*</span>
            </label>
            <input
              type="number"
              placeholder="Masalan: 20"
              value={form.sigimi}
              onChange={e => setForm({ ...form, sigimi: e.target.value })}
              className="w-full p-[10px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] text-[#1a1a2e] outline-none box-border transition-colors duration-200 focus:border-[#7c4dff]"
            />
          </div>
        </div>

        {/* Drawer footer */}
        <div className="p-[16px_20px] border-t border-[#f1f1f5] flex gap-2.5 justify-end">
          <button onClick={() => { setDrawerOpen(false); setForm({ nomi: '', sigimi: '' }); }}
            className="p-[10px_20px] rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-white text-[#6b7280] text-[13.5px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#f5f5fb]">
            Bekor qilish
          </button>
          <button
            onClick={handleSave}
            className="p-[10px_24px] rounded-[10px] border-none bg-[#7c4dff] text-white text-[13.5px] font-semibold cursor-pointer transition-opacity duration-200 hover:opacity-90">
            Saqlash
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[15px] text-[#1a1a2e]">Xonalar</span>
          <button className="bg-none border-none cursor-pointer text-[#9ca3af] flex items-center p-0.5">
            <RefreshOutlined style={{ fontSize: '16px' }} />
          </button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[220px]">
            <SearchOutlined className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[18px]" />
            <input placeholder="Search" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full p-[8px_14px_8px_34px] rounded-[8px] border-[1.5px] border-[#e5e7eb] text-[13px] outline-none bg-white focus:border-[#7c4dff]" />
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 bg-[#7c4dff] text-white border-none rounded-[10px] p-[8px_16px] text-[13px] font-semibold cursor-pointer hover:opacity-90 whitespace-nowrap">
            <AddOutlined fontSize="small" /> Xonani qo'shish
          </button>
        </div>
      </div>

      {/* Filial tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {xonalarFilialTabs.map((tab, i) => (
          <button key={i} onClick={() => setActiveFilial(i)} className={`p-[6px_14px] border-none rounded-[8px] cursor-pointer text-[12.5px] transition-all duration-150 ${activeFilial === i ? 'font-semibold bg-[#f0ebff] text-[#7c4dff]' : 'font-normal bg-[#f5f5fb] text-[#6b7280]'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Rooms grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {filteredRooms.map((room) => (
          <div key={room.id} className="bg-[#fafafa] border border-[#f1f1f5] rounded-[10px] p-[14px_14px_12px_14px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="m-0 mb-1 font-semibold text-[13px] text-[#1a1a2e]">{room.name}</p>
                <p className="m-0 text-[12px] text-[#9ca3af]">Sig'imi: {room.capacity}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => handleDelete(room.id)} className="bg-white border-none rounded-[6px] p-1 cursor-pointer text-[#ef5350] flex shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                  <DeleteOutlineOutlined style={{ fontSize: '14px' }} />
                </button>
                <button onClick={() => openEdit(room)} className="bg-white border-none rounded-[6px] p-1 cursor-pointer text-[#7c4dff] flex shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                  <EditOutlined style={{ fontSize: '14px' }} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
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
