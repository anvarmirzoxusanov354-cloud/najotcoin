import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KeyboardArrowLeftOutlined } from '@mui/icons-material';

const BASE = 'https://najot-edu.softwareengineer.uz/api/v1';

const CreateExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!subject.trim()) {
      setError("Iltimos, mavzuni tanlang");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      let deadlineISO = null;
      if (deadlineDate && deadlineTime) {
        deadlineISO = new Date(`${deadlineDate}T${deadlineTime}`).toISOString();
      } else if (deadlineDate) {
        deadlineISO = new Date(`${deadlineDate}T23:59:00`).toISOString();
      }

      const body = {
        group_id: Number(id),
        title: subject,
        description: description || subject,
      };
      if (deadlineISO) body.deadline = deadlineISO;

      const res = await fetch(`${BASE}/exam`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        navigate(`/classes/${id}`);
      } else {
        try {
          const err = await res.json();
          const msg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || `Server xatosi: ${res.status}`);
          setError(msg);
        } catch {
          setError(`Server xatosi: ${res.status}`);
        }
      }
    } catch {
      setError("Server bilan ulanishda xatolik.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-6 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pb-5 border-b border-[#e5e7eb]">
        <button
          onClick={() => navigate(`/classes/${id}`)}
          className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-transparent border-none cursor-pointer text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
        >
          <KeyboardArrowLeftOutlined style={{ fontSize: 24 }} />
        </button>
        <h1 className="m-0 text-[22px] font-bold text-[#1a1a2e]">Imtihon yaratish</h1>
      </div>

      {/* Info banner */}
      <div className="mb-6 max-w-[820px] flex items-start gap-3 px-4 py-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5" style={{ color: '#3b82f6' }}>
          <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="1.8"/>
          <path d="M12 8v4m0 4h.01" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <p className="m-0 text-[13px] text-[#1d4ed8] font-medium">
          Oxirgi 7 kundagi uyga vazifa berilmagan mavzularni tanlay olasiz!
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 max-w-[820px] px-4 py-3 bg-[#fee2e2] border border-[#fecaca] rounded-[8px] text-[#dc2626] text-[13px] font-medium">
          {error}
        </div>
      )}

      <div className="max-w-[820px]">

        {/* Mavzu */}
        <div className="mb-7">
          <label className="block text-[13.5px] font-semibold text-[#1a1a2e] mb-2">
            <span className="text-[#ef4444] mr-0.5">*</span>Mavzu
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Mavzulardan birini tanlang"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-4 py-3 bg-white border-[1.5px] border-[#e5e7eb] rounded-[10px] text-[13.5px] text-[#1a1a2e] outline-none focus:border-[#7c4dff] transition-colors pr-10"
            />
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#9ca3af]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Izoh */}
        <div className="mb-7">
          <label className="block text-[13.5px] font-semibold text-[#1a1a2e] mb-2">
            <span className="text-[#ef4444] mr-0.5">*</span>Izoh
          </label>
          <div className="border-[1.5px] border-[#e5e7eb] rounded-[10px] overflow-hidden focus-within:border-[#7c4dff] transition-colors">
            {/* Toolbar */}
            <div className="flex items-center flex-wrap gap-0.5 px-3 py-2 bg-[#f9fafb] border-b border-[#e5e7eb]">
              {[
                { label: 'H1', title: 'Heading 1' }, { label: 'H2', title: 'Heading 2' },
              ].map(b => (
                <button key={b.label} type="button" title={b.title}
                  className="px-[9px] py-[5px] rounded-[5px] text-[13px] text-[#374151] bg-transparent border-none cursor-pointer hover:bg-[#e5e7eb] font-semibold">
                  {b.label}
                </button>
              ))}
              <div className="w-px h-5 bg-[#e5e7eb] mx-1 self-center" />
              <select className="text-[13px] text-[#374151] bg-transparent border-none outline-none cursor-pointer py-1 pr-5 pl-1 appearance-none">
                <option>Sans Serif</option><option>Monospace</option>
              </select>
              <select className="text-[13px] text-[#374151] bg-transparent border-none outline-none cursor-pointer py-1 pr-5 pl-1 appearance-none ml-1">
                <option>Normal</option><option>Bold</option>
              </select>
              <div className="w-px h-5 bg-[#e5e7eb] mx-1 self-center" />
              {[
                { label: <strong>B</strong>, title: 'Bold' },
                { label: <em>I</em>, title: 'Italic' },
                { label: <span className="underline">U</span>, title: 'Underline' },
                { label: <del>S</del>, title: 'Strike' },
              ].map((b, i) => (
                <button key={i} type="button" title={b.title}
                  className="px-[9px] py-[5px] rounded-[5px] text-[13px] text-[#374151] bg-transparent border-none cursor-pointer hover:bg-[#e5e7eb]">
                  {b.label}
                </button>
              ))}
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Imtihon haqida batafsil ma'lumot kiriting..."
              rows={9}
              className="w-full px-4 py-4 text-[13.5px] text-[#1a1a2e] placeholder-[#9ca3af] border-none outline-none resize-none font-inherit bg-white"
            />
          </div>
        </div>

        {/* Fayl yuklash */}
        <div className="mb-7 border-[1.5px] border-[#e5e7eb] rounded-[10px] py-4 px-5 text-center text-[13.5px] text-[#6b7280] cursor-pointer hover:border-[#7c4dff] transition-colors bg-white">
          Yuklash
        </div>

        {/* Tugash sanasi va vaqti */}
        <div className="flex gap-5 mb-8">
          <div className="flex-1">
            <label className="block text-[13.5px] font-semibold text-[#1a1a2e] mb-2">
              <span className="text-[#ef4444] mr-0.5">*</span>Tugash sanasi
            </label>
            <input
              type="date"
              value={deadlineDate}
              onChange={e => setDeadlineDate(e.target.value)}
              className="w-full px-4 py-3 bg-white border-[1.5px] border-[#e5e7eb] rounded-[10px] text-[13.5px] text-[#1a1a2e] outline-none focus:border-[#7c4dff] transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[13.5px] font-semibold text-[#1a1a2e] mb-2">
              <span className="text-[#ef4444] mr-0.5">*</span>Tugash vaqti
            </label>
            <input
              type="time"
              value={deadlineTime}
              onChange={e => setDeadlineTime(e.target.value)}
              className="w-full px-4 py-3 bg-white border-[1.5px] border-[#e5e7eb] rounded-[10px] text-[13.5px] text-[#1a1a2e] outline-none focus:border-[#7c4dff] transition-colors"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-[#e5e7eb]">
          <button
            onClick={() => navigate(`/classes/${id}`)}
            disabled={loading}
            className="px-6 py-[10px] rounded-[10px] border-[1.5px] border-[#d1d5db] bg-white text-[#374151] text-[13.5px] font-semibold cursor-pointer hover:bg-[#f3f4f6] transition-colors disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !subject.trim()}
            className={`px-6 py-[10px] rounded-[10px] border-none text-white text-[13.5px] font-semibold transition-all ${!loading && subject.trim() ? 'bg-[#7c4dff] cursor-pointer hover:opacity-90' : 'bg-[#9ca3af] cursor-not-allowed'}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Saqlanmoqda...
              </span>
            ) : "E'lon qilish"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateExam;
