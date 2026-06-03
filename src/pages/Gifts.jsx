import { useState, useEffect } from 'react';
import {
  AddOutlined,
  SearchOutlined,
  DeleteOutlineOutlined,
  EditOutlined,
  CloseOutlined,
  CardGiftcardOutlined,
  EmojiEventsOutlined,
  StarOutlined,
  WorkspacePremiumOutlined,
} from '@mui/icons-material';

const BASE_URL = 'https://najot-edu.softwareengineer.uz/api/v1';

const GIFT_ICONS = [
  { icon: <CardGiftcardOutlined />, bg: '#ede9ff', color: '#7c4dff' },
  { icon: <EmojiEventsOutlined />, bg: '#fff3e0', color: '#f57c00' },
  { icon: <StarOutlined />, bg: '#e8f5e9', color: '#2e7d32' },
  { icon: <WorkspacePremiumOutlined />, bg: '#fce8f3', color: '#c2185b' },
];

const GiftCard = ({ gift, onEdit, onDelete, idx }) => {
  const style = GIFT_ICONS[idx % GIFT_ICONS.length];
  return (
    <div className="bg-white rounded-[16px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-3 hover:shadow-[0_4px_16px_rgba(124,77,255,0.12)] transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div
          className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: style.bg, color: style.color }}
        >
          {style.icon}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(gift)}
            className="w-8 h-8 rounded-[8px] bg-[#f5f5fb] border-none cursor-pointer flex items-center justify-center text-[#7c4dff] hover:bg-[#ede9ff] transition-colors"
          >
            <EditOutlined style={{ fontSize: 16 }} />
          </button>
          <button
            onClick={() => onDelete(gift.id)}
            className="w-8 h-8 rounded-[8px] bg-[#fff5f5] border-none cursor-pointer flex items-center justify-center text-[#ef5350] hover:bg-[#fce8e8] transition-colors"
          >
            <DeleteOutlineOutlined style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      <div>
        <h3 className="m-0 mb-1 text-[15px] font-bold text-[#1a1a2e] leading-tight">{gift.name}</h3>
        {gift.description && (
          <p className="m-0 text-[12.5px] text-[#6b7280] leading-[1.5] line-clamp-2">{gift.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[#f1f1f5]">
        <div className="flex items-center gap-1.5">
          <StarOutlined style={{ fontSize: 15, color: '#f59e0b' }} />
          <span className="text-[13px] font-bold text-[#1a1a2e]">{gift.ball ?? gift.score ?? gift.coin ?? 0}</span>
          <span className="text-[12px] text-[#9ca3af]">ball</span>
        </div>
        {gift.count !== undefined && (
          <span className="text-[12px] text-[#9ca3af]">
            {gift.count} ta mavjud
          </span>
        )}
      </div>
    </div>
  );
};

const Gifts = () => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState({
    name: '',
    description: '',
    ball: '',
    count: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }

    fetch(`${BASE_URL}/gifts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.gifts)) list = data.gifts;
        else if (data && Array.isArray(data.items)) list = data.items;
        else if (data && Array.isArray(data.results)) list = data.results;
        setGifts(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refresh]);

  const resetForm = () => setForm({ name: '', description: '', ball: '', count: '' });

  const openAdd = () => {
    setEditId(null);
    resetForm();
    setDrawerOpen(true);
  };

  const openEdit = (gift) => {
    setEditId(gift.id);
    setForm({
      name: gift.name || '',
      description: gift.description || '',
      ball: String(gift.ball ?? gift.score ?? gift.coin ?? ''),
      count: String(gift.count ?? ''),
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('accessToken');
    try {
      await fetch(`${BASE_URL}/gifts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* ignore */ }
    setGifts(prev => prev.filter(g => g.id !== id));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const body = {
      name: form.name.trim(),
      description: form.description || '',
      ball: parseInt(form.ball) || 0,
      count: parseInt(form.count) || 0,
    };

    if (editId !== null) {
      try {
        const res = await fetch(`${BASE_URL}/gifts/${editId}`, {
          method: 'PATCH', headers, body: JSON.stringify(body),
        });
        if (res.ok) {
          setGifts(prev => prev.map(g => g.id === editId ? { ...g, ...body } : g));
        } else {
          try { const err = await res.json(); alert(err.message || `Xatolik: ${res.status}`); } catch { alert(`Xatolik: ${res.status}`); }
          return;
        }
      } catch { alert('Server bilan ulanishda xatolik!'); return; }
    } else {
      try {
        const res = await fetch(`${BASE_URL}/gifts`, {
          method: 'POST', headers, body: JSON.stringify(body),
        });
        if (res.ok) {
          setRefresh(r => r + 1);
        } else {
          try { const err = await res.json(); alert(err.message || `Xatolik: ${res.status}`); } catch { alert(`Xatolik: ${res.status}`); }
          return;
        }
      } catch { alert('Server bilan ulanishda xatolik!'); return; }
    }

    resetForm();
    setEditId(null);
    setDrawerOpen(false);
  };

  const filtered = gifts.filter(g =>
    (g.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (g.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6 bg-[#f1f5f9] min-h-full flex flex-col">

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div
          onClick={() => { setDrawerOpen(false); resetForm(); }}
          className="fixed inset-0 z-[1100] bg-black/35 backdrop-blur-[2px]"
        />
      )}

      {/* Slide-out Drawer */}
      <div className={`fixed top-0 right-0 h-screen w-full sm:w-[420px] bg-white z-[1200] flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.10)] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Drawer Header */}
        <div className="p-[20px_24px_16px] bg-gradient-to-r from-[#5b7fff] to-[#7c4dff] flex justify-between items-start shrink-0">
          <div>
            <h2 className="m-0 mb-1 text-[17px] font-bold text-white">
              {editId !== null ? "Sovg'ani tahrirlash" : "Sovg'a qo'shish"}
            </h2>
            <p className="m-0 text-[12.5px] text-white/80">
              {editId !== null ? "Sovg'a ma'lumotlarini o'zgartiring." : "Yangi sovg'a qo'shish uchun to'ldiring."}
            </p>
          </div>
          <button
            onClick={() => { setDrawerOpen(false); resetForm(); }}
            className="bg-transparent border-none cursor-pointer text-white hover:text-white/70 flex p-[2px]"
          >
            <CloseOutlined style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Drawer Form */}
        <div className="flex-1 overflow-y-auto p-[20px_24px] space-y-5">
          {/* Nomi */}
          <div>
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">
              Nomi <span className="text-[#ef4444]">*</span>
            </label>
            <input
              type="text"
              placeholder="Sovg'a nomi"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full p-[11px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff] bg-[#f9fafb] text-[#1a1a2e] placeholder-[#9ca3af] transition-all"
            />
          </div>

          {/* Tavsif */}
          <div>
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">Tavsif</label>
            <textarea
              placeholder="Sovg'a haqida qo'shimcha ma'lumot"
              value={form.description}
              rows={3}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full p-[11px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff] bg-[#f9fafb] text-[#1a1a2e] placeholder-[#9ca3af] resize-none font-inherit transition-all"
            />
          </div>

          {/* Ball */}
          <div>
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">
              Ball miqdori <span className="text-[#ef4444]">*</span>
            </label>
            <div className="relative">
              <StarOutlined
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#f59e0b]"
                style={{ fontSize: 18 }}
              />
              <input
                type="number"
                placeholder="Masalan: 100"
                value={form.ball}
                onChange={e => setForm({ ...form, ball: e.target.value })}
                className="w-full p-[11px_14px_11px_38px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff] bg-[#f9fafb] text-[#1a1a2e] placeholder-[#9ca3af] transition-all"
              />
            </div>
          </div>

          {/* Soni */}
          <div>
            <label className="block text-[13px] font-bold text-[#1a1a2e] mb-[8px]">Soni</label>
            <input
              type="number"
              placeholder="Mavjud miqdor"
              value={form.count}
              onChange={e => setForm({ ...form, count: e.target.value })}
              className="w-full p-[11px_14px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13.5px] outline-none box-border focus:border-[#7c4dff] bg-[#f9fafb] text-[#1a1a2e] placeholder-[#9ca3af] transition-all"
            />
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-[16px_24px] border-t border-[#f1f1f5] flex gap-3">
          <button
            onClick={() => { setDrawerOpen(false); resetForm(); }}
            className="flex-1 p-[11px_18px] rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-white text-[#4b5563] text-[13.5px] font-bold cursor-pointer hover:bg-[#f5f5fb] transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 p-[11px_18px] rounded-[10px] border-none text-[13.5px] font-bold transition-colors ${form.name.trim() ? 'bg-[#7c4dff] text-white cursor-pointer hover:opacity-90' : 'bg-[#f3f4f6] text-[#9ca3af] cursor-default'}`}
          >
            Saqlash
          </button>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="m-0 mb-1 text-[22px] font-bold text-[#1a1a2e]">Sovg'alar</h1>
          <p className="m-0 text-[13px] text-[#9ca3af]">
            Ushbu sahifada barcha sovg'alar ro'yxati va ularning ball qiymatlari keltirilgan.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 p-[10px_20px] border-none rounded-[10px] bg-[#7c4dff] text-white text-[13px] font-semibold cursor-pointer whitespace-nowrap hover:opacity-90 shrink-0"
        >
          <AddOutlined fontSize="small" /> Sovg'a qo'shish
        </button>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-[16px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-[14px_18px] mb-5 flex items-center gap-3">
        <div className="relative flex-1 max-w-[320px]">
          <SearchOutlined
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
            style={{ fontSize: 18 }}
          />
          <input
            type="text"
            placeholder="Sovg'a qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full p-[9px_14px_9px_36px] rounded-[10px] border-[1.5px] border-[#e5e7eb] text-[13px] outline-none bg-[#f9fafb] focus:border-[#7c4dff] focus:bg-white transition-all text-[#1a1a2e] placeholder-[#9ca3af]"
          />
        </div>
        <span className="text-[13px] text-[#9ca3af] ml-auto shrink-0">
          Jami: <span className="font-bold text-[#1a1a2e]">{filtered.length}</span> ta
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-[#7c4dff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-[13px] text-[#9ca3af]">Ma'lumotlar yuklanmoqda...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-[20px] bg-[#ede9ff] flex items-center justify-center mb-4">
            <CardGiftcardOutlined style={{ fontSize: 32, color: '#7c4dff' }} />
          </div>
          <h3 className="m-0 mb-2 text-[16px] font-bold text-[#1a1a2e]">
            {search ? "Sovg'a topilmadi" : "Hali sovg'alar qo'shilmagan"}
          </h3>
          <p className="m-0 text-[13px] text-[#9ca3af] text-center max-w-[260px]">
            {search
              ? `"${search}" bo'yicha natija topilmadi`
              : "Yangi sovg'a qo'shish uchun yuqoridagi tugmani bosing"}
          </p>
          {!search && (
            <button
              onClick={openAdd}
              className="mt-5 flex items-center gap-1.5 p-[10px_20px] border-none rounded-[10px] bg-[#7c4dff] text-white text-[13px] font-semibold cursor-pointer hover:opacity-90"
            >
              <AddOutlined fontSize="small" /> Sovg'a qo'shish
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((gift, idx) => (
            <GiftCard
              key={gift.id}
              gift={gift}
              idx={idx}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Gifts;
