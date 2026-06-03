import React, { useState } from 'react';
import { CloseOutlined } from '@mui/icons-material';

const AddHomeworkModal = ({ isOpen, onClose, groupId }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const subjects = [
    'Matematika',
    'Rus tili',
    'O\'zbek tili',
    'Ingliz tili',
    'Tarix',
    'Geografiya',
    'Biologiya',
    'Kimyo',
    'Fizika',
  ];

  const handleSave = async () => {
    if (!subject.trim() || !description.trim()) {
      alert('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://najot-edu.softwareengineer.uz/api/v1/homework', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: groupId,
          title: subject,
          content: description,
          description: description,
        }),
      });

      if (response.ok) {
        setSubject('');
        setDescription('');
        onClose();
        // Refresh page or update list
        window.location.reload();
      } else {
        alert('Xatolik yuz berdi');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.15)] max-w-[600px] w-full overflow-hidden">
        {/* ── Modal Header ── */}
        <div className="px-6 py-6 flex items-center justify-between border-b border-[#e5e7eb]">
          <div>
            <h2 className="m-0 text-[20px] font-bold text-[#1a1a2e] mb-2">Yangi uyga vazifa yaratish</h2>
            <p className="m-0 text-[13px] text-[#6b7280]">Talabalar uchun yangi uyga vazifa qo'shing</p>
          </div>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-[#9ca3af] hover:text-[#1a1a2e] transition-colors flex items-center justify-center p-2"
          >
            <CloseOutlined style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* ── Form Content ── */}
        <div className="px-6 py-6">
          {/* Subject Field */}
          <div className="mb-6">
            <label className="block text-[13px] font-semibold text-[#1a1a2e] mb-2">
              <span className="text-[#ef4444]">*</span> Mavzu
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-[10px] text-[13px] text-[#1a1a2e] focus:outline-none focus:border-[#7c4dff] focus:bg-white transition-colors"
            >
              <option value="">Mavzuni tanlang</option>
              {subjects.map((subj, idx) => (
                <option key={idx} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* Description Field */}
          <div className="mb-6">
            <label className="block text-[13px] font-semibold text-[#1a1a2e] mb-2">
              <span className="text-[#ef4444]">*</span> Izoh
            </label>
            <div className="border border-[#e5e7eb] rounded-[10px] overflow-hidden">
              {/* Toolbar */}
              <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-4 py-3 flex gap-1 items-center flex-wrap">
                <button
                  type="button"
                  className="px-2 py-1 hover:bg-[#e5e7eb] rounded text-[13px] font-semibold text-[#1a1a2e]"
                  title="Bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  className="px-2 py-1 hover:bg-[#e5e7eb] rounded text-[13px] italic text-[#1a1a2e]"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  className="px-2 py-1 hover:bg-[#e5e7eb] rounded text-[13px] underline text-[#1a1a2e]"
                  title="Underline"
                >
                  U
                </button>
                <div className="w-px h-6 bg-[#d1d5db] mx-1"></div>
                <button
                  type="button"
                  className="px-2 py-1 hover:bg-[#e5e7eb] rounded text-[13px] text-[#1a1a2e]"
                  title="List"
                >
                  ⊡ List
                </button>
              </div>
              {/* Textarea */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Vazifa haqida batafsil yozing..."
                className="w-full px-4 py-3 min-h-[200px] text-[13px] text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none resize-none"
              />
            </div>
            <p className="mt-2 text-[12px] text-[#9ca3af]">Vazifa tavsifi {description.length} ta belgi</p>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="px-6 py-4 flex gap-3 justify-end bg-[#f9fafb] border-t border-[#e5e7eb]">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 rounded-[10px] border border-[#d1d5db] bg-white text-[#1a1a2e] font-semibold text-[13px] hover:bg-[#f3f4f6] transition-colors cursor-pointer disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !subject.trim() || !description.trim()}
            className="px-6 py-2 rounded-[10px] bg-gradient-to-r from-[#7c4dff] to-[#5b7fff] text-white font-semibold text-[13px] hover:shadow-md transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saqlanmoqda...' : 'E\'lon qilish'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddHomeworkModal;
