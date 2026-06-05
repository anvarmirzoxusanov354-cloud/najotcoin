import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KeyboardArrowLeftOutlined, CloudUploadOutlined } from '@mui/icons-material';

const BASE = 'https://najot-edu.softwareengineer.uz/api/v1';

// Toolbar tugmasi
const ToolBtn = ({ children, title, onClick }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className="px-[9px] py-[5px] rounded-[5px] text-[13px] text-[#374151] bg-transparent border-none cursor-pointer hover:bg-[#e5e7eb] transition-colors leading-none font-medium"
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-[#e5e7eb] mx-1 self-center" />;

const CreateHomework = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const subjects = [
    'HTML', 'CSS', 'JavaScript', 'React', 'Node.js',
    'Python', 'Java', 'SQL', 'Git', 'Algoritmlar',
  ];

  // Textarea ga format qo'shish
  const insertFormat = (before, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = description.slice(start, end);
    const newText =
      description.slice(0, start) + before + selected + after + description.slice(end);
    setDescription(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setUploadedFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) setUploadedFile(e.target.files[0]);
  };

  const handleSave = async () => {
    setError('');
    if (!subject.trim() || !description.trim()) {
      setError("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      // 1-qadam: lesson yaratish
      // Swagger: POST /api/v1/groups/{groupId}/lesson → body: { group_id, topic, description }
      let lessonId = null;

      // Avval bugungi lesson bor-yo'qligini tekshiramiz
      // Swagger: GET /api/v1/groups/{groupId}/lesson?date=YYYY-MM-DD
      try {
        const today = new Date().toISOString().slice(0, 10);
        const lessonRes = await fetch(`${BASE}/groups/${id}/lesson?date=${today}`, { headers });
        if (lessonRes.ok) {
          const lessonData = await lessonRes.json();
          if (lessonData) {
            if (typeof lessonData.id === 'number') lessonId = lessonData.id;
            else if (lessonData.data?.id) lessonId = Number(lessonData.data.id);
            else if (Array.isArray(lessonData) && lessonData[0]?.id) lessonId = Number(lessonData[0].id);
          }
        }
      } catch { /* ignore */ }

      // Lesson topilmadi — yangi yaratamiz
      if (!lessonId) {
        try {
          const r1 = await fetch(`${BASE}/groups/${id}/lesson`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              group_id: Number(id),
              topic: subject.trim(),
              description: description.trim(),
            }),
          });
          if (r1.ok) {
            const d = await r1.json();
            // Barcha mumkin response formatlarini tekshiramiz
            const checkId = (obj) => {
              if (!obj || typeof obj !== 'object') return null;
              if (typeof obj.id === 'number') return obj.id;
              if (typeof obj.id === 'string' && !isNaN(obj.id)) return Number(obj.id);
              for (const key of Object.keys(obj)) {
                if (typeof obj[key] === 'object') {
                  const found = checkId(obj[key]);
                  if (found) return found;
                }
              }
              return null;
            };
            lessonId = checkId(d);
          } else {
            const errText = await r1.text();
            console.error('Lesson create failed:', r1.status, errText);
          }
        } catch (e) {
          console.error('Lesson create error:', e);
        }
      }

      // Fallback: GET /api/v1/lessons/my/group/{groupId} — mavjud lessonlarni olish
      if (!lessonId) {
        try {
          const r2 = await fetch(`${BASE}/lessons/my/group/${id}`, { headers });
          if (r2.ok) {
            const d2 = await r2.json();
            const list = Array.isArray(d2) ? d2 : (d2.data || d2.lessons || d2.items || []);
            if (list.length > 0) {
              // Eng oxirgi lessonni olamiz
              lessonId = list[list.length - 1].id || list[0].id;
            }
          }
        } catch { /* ignore */ }
      }

      if (!lessonId) {
        setError("Dars (lesson) topilmadi. Avval guruh uchun davomat kiritib dars yarating, keyin uyga vazifa bering.");
        setLoading(false);
        return;
      }

      // 2-qadam: Homework yaratish
      // Swagger: POST /api/v1/homework → multipart/form-data: { lesson_id, group_id, title, file? }
      const fd = new FormData();
      fd.append('lesson_id', String(lessonId));
      fd.append('group_id', String(Number(id)));
      fd.append('title', subject.trim());
      if (uploadedFile) fd.append('file', uploadedFile);

      const res = await fetch(`${BASE}/homework`, {
        method: 'POST',
        headers,
        body: fd,
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
      setError("Server bilan ulanishda xatolik. Internetni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-white">
      {/* ── Sarlavha ── */}
      <div className="flex items-center gap-3 mb-8 pb-5 border-b border-[#e5e7eb]">
        <button
          onClick={() => navigate(`/classes/${id}`)}
          className="w-8 h-8 flex items-center justify-center rounded-[8px] bg-transparent border-none cursor-pointer text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
        >
          <KeyboardArrowLeftOutlined style={{ fontSize: 24 }} />
        </button>
        <h1 className="m-0 text-[22px] font-bold text-[#1a1a2e]">
          Yangi uyga vazifa yaratish
        </h1>
      </div>

      {/* ── Xato xabari ── */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-[#fee2e2] border border-[#fecaca] rounded-[8px] text-[#dc2626] text-[13px] font-medium">
          {error}
        </div>
      )}

      <div className="max-w-[820px]">

        {/* ── Mavzu ── */}
        <div className="mb-7">
          <label className="block text-[13.5px] font-semibold text-[#1a1a2e] mb-2">
            <span className="text-[#ef4444] mr-0.5">*</span>Mavzu
          </label>
          <div className="relative">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 bg-white border-[1.5px] border-[#e5e7eb] rounded-[10px] text-[13.5px] text-[#1a1a2e] outline-none appearance-none cursor-pointer focus:border-[#7c4dff] transition-colors"
            >
              <option value="">Mavzulardan birini tanlang</option>
              {subjects.map((s, i) => (
                <option key={i} value={s}>{s}</option>
              ))}
            </select>
            {/* chevron */}
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#9ca3af]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* ── Izoh ── */}
        <div className="mb-7">
          <label className="block text-[13.5px] font-semibold text-[#1a1a2e] mb-2">
            <span className="text-[#ef4444] mr-0.5">*</span>Izoh
          </label>

          {/* Editor box */}
          <div className="border-[1.5px] border-[#e5e7eb] rounded-[10px] overflow-hidden focus-within:border-[#7c4dff] transition-colors">

            {/* Toolbar */}
            <div className="flex items-center flex-wrap gap-0.5 px-3 py-2 bg-[#f9fafb] border-b border-[#e5e7eb]">
              <ToolBtn title="Heading 1" onClick={() => insertFormat('# ')}>H1</ToolBtn>
              <ToolBtn title="Heading 2" onClick={() => insertFormat('## ')}>H2</ToolBtn>
              <Divider />
              <div className="relative">
                <select className="text-[13px] text-[#374151] bg-transparent border-none outline-none cursor-pointer py-1 pr-5 pl-1 appearance-none">
                  <option>Sans Serif</option>
                  <option>Monospace</option>
                </select>
                <svg className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[#9ca3af]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div className="relative ml-1">
                <select className="text-[13px] text-[#374151] bg-transparent border-none outline-none cursor-pointer py-1 pr-5 pl-1 appearance-none">
                  <option>Normal</option>
                  <option>Bold</option>
                  <option>Italic</option>
                </select>
                <svg className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[#9ca3af]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <Divider />
              <ToolBtn title="Bold" onClick={() => insertFormat('**', '**')}><strong>B</strong></ToolBtn>
              <ToolBtn title="Italic" onClick={() => insertFormat('*', '*')}><em>I</em></ToolBtn>
              <ToolBtn title="Underline" onClick={() => insertFormat('<u>', '</u>')}><span className="underline">U</span></ToolBtn>
              <ToolBtn title="Strikethrough" onClick={() => insertFormat('~~', '~~')}><del>S</del></ToolBtn>
              <ToolBtn title="Quote" onClick={() => insertFormat('> ')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21v-4l2-2V7H3V3h6v4H7v8l2 2v4H3zm10 0v-4l2-2V7h-2V3h6v4h-2v8l2 2v4h-6z"/></svg>
              </ToolBtn>
              <ToolBtn title="Code" onClick={() => insertFormat('`', '`')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              </ToolBtn>
              <Divider />
              <ToolBtn title="Bullet list" onClick={() => insertFormat('\n- ')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </ToolBtn>
              <ToolBtn title="Ordered list" onClick={() => insertFormat('\n1. ')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
              </ToolBtn>
              <ToolBtn title="Align left">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
              </ToolBtn>
              <ToolBtn title="Link" onClick={() => insertFormat('[', '](url)')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </ToolBtn>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Vazifa haqida batafsil ma'lumot kiriting..."
              rows={9}
              className="w-full px-4 py-4 text-[13.5px] text-[#1a1a2e] placeholder-[#9ca3af] border-none outline-none resize-none font-inherit bg-white"
            />
          </div>
        </div>

        {/* ── Fayl yuklash ── */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-8 rounded-[12px] border-2 border-dashed py-10 px-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
            dragActive
              ? 'border-[#7c4dff] bg-[#f5f0ff]'
              : 'border-[#d1d5db] bg-transparent hover:border-[#7c4dff] hover:bg-[#fafafa]'
          }`}
        >
          <CloudUploadOutlined
            style={{ fontSize: 36, color: dragActive ? '#7c4dff' : '#9ca3af' }}
          />
          {uploadedFile ? (
            <p className="m-0 text-[13px] font-semibold text-[#7c4dff]">{uploadedFile.name}</p>
          ) : (
            <p className="m-0 text-[13px] text-[#6b7280] font-medium">
              Faylni tanlash yoki shu yerga tashlang
            </p>
          )}
          {!uploadedFile && (
            <p className="m-0 text-[12px] text-[#9ca3af]">
              PNG, JPG, GIF, PDF qabul qilinadi. Maks. 5 MB
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.zip"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* ── Tugmalar ── */}
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
            disabled={loading || !subject.trim() || !description.trim()}
            className={`px-6 py-[10px] rounded-[10px] border-none text-white text-[13.5px] font-semibold transition-all ${
              !loading && subject.trim() && description.trim()
                ? 'bg-[#16a34a] cursor-pointer hover:bg-[#15803d] shadow-[0_2px_8px_rgba(22,163,74,0.25)]'
                : 'bg-[#9ca3af] cursor-not-allowed'
            }`}
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

export default CreateHomework;
