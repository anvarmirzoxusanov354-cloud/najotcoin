import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GroupDetail from './GroupDetail';
import HomeworkDetail from './HomeworkDetail';
import CreateHomework from './CreateHomework';
import ExamSubmission from './ExamSubmission';

import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';

const BASE_URL = 'https://najot-edu.softwareengineer.uz/api/v1';
const BASE_STATIC = 'https://najot-edu.softwareengineer.uz';

function getPhotoUrl(photo) {
  if (!photo) return null;
  const p = String(photo);
  if (p.startsWith('http')) return p;
  // Oldidagi /files/ yoki files/ files/files/ qismlarini olib tashlash
  const clean = p.replace(/^\/?(files\/files\/|files\/|file\/)?/, '');
  return `${BASE_STATIC}/files/${clean}`;
}

/* ── Colour tokens ─────────────────────────────────────── */
const C = {
  purple: '#7c4dff',
  purpleLight: '#f5f0ff',
  purpleShadow: 'rgba(124,77,255,0.3)',
  orange: '#fb923c',
  green: '#22c55e',
  headerBg: '#f1f5f9',
  sidebarBg: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
  border: '#e5e7eb',
};

const TeacherDashboard = () => {
  const [activeMenu, setActiveMenu] = useState('groups');
  const [activeTab, setActiveTab] = useState('groups');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [guruhlarOpen, setGuruhlarOpen] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [errorLogs, setErrorLogs] = useState([]); // Xatolarni ekranda ko'rsatish uchun
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [homeworkDetailKey, setHomeworkDetailKey] = useState(0);
  const [homeworkInitialTab, setHomeworkInitialTab] = useState('PENDING');
  const [isCreatingHomework, setIsCreatingHomework] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  /* Global error catcher */
  useEffect(() => {
    const handleError = (msg, url, line) => {
      setErrorLogs(prev => [...prev, `Xato: ${msg} (${line}-qator)`]);
      return false;
    };
    window.onerror = handleError;
    return () => { window.onerror = null; };
  }, []);

  /* auth guard */
  useEffect(() => {
    const logged = localStorage.getItem('isLogged');
    const role = localStorage.getItem('role');
    if (!logged || role !== 'TEACHER') window.location.href = '/login';
  }, []);


  const fetchGroups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${BASE_URL}/teachers/my/groups`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const resData = await response.json();
        let list = [];
        if (Array.isArray(resData)) {
          list = resData;
        } else if (resData) {
          if (Array.isArray(resData.data)) {
            list = resData.data;
          } else if (resData.data && Array.isArray(resData.data.items)) {
            list = resData.data.items;
          } else if (Array.isArray(resData.items)) {
            list = resData.items;
          } else if (Array.isArray(resData.groups)) {
            list = resData.groups;
          }
        }
        setGroups(list);
      } else {
        console.error('Failed to fetch groups:', response.status);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${BASE_URL}/teachers/my/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const resData = await response.json();
        setTeacherProfile(resData && resData.data ? resData.data : resData);
      }
    } catch (err) {
      console.error('Error fetching teacher profile:', err);
    }
  };

  /* ═══════ DATA FETCHING ═══════════════════════════════════ */
  useEffect(() => {
    fetchGroups();
    fetchProfile();
  }, []);





  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const phone = localStorage.getItem('phone') || '';
  const initial = teacherProfile?.full_name?.[0]?.toUpperCase() || phone.slice(-1).toUpperCase() || 'T';

  /* filtered groups —
     /teachers/my/groups o'zi faqat shu teacherning guruhlarini qaytaradi,
     shuning uchun 'groups' tabda status bo'yicha filtrlash kerak emas. */
  const ARCHIVED_STATUSES = ['finished', 'tugagan', 'archived', 'inactive'];
  const PENDING_STATUSES  = ['pending', 'upcoming', 'yigilayotgan'];

  const filteredGroups = groups.filter(g => {
    if (activeTab === 'arxiv')        return ARCHIVED_STATUSES.includes((g.status || '').toLowerCase());
    if (activeTab === 'yigilayotgan') return PENDING_STATUSES.includes((g.status || '').toLowerCase());
    // 'groups' tab — barcha guruhlarni ko'rsat (endpoint o'zi filtrlaydi)
    return true;
  }).filter(g => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (g.name || g.groupName || g.group_name || g.title || '').toLowerCase().includes(q) ||
      (g.course?.name || g.courseName || g.course_name || '').toLowerCase().includes(q)
    );
  });

  /* styles */
  const hdrBtn = {
    width: '36px', height: '36px', borderRadius: '10px',
    border: 'none', backgroundColor: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: C.gray500, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    transition: 'all 0.15s', flexShrink: 0,
  };

  const tdStyle = {
    padding: '0 16px', fontSize: '13.5px', color: C.gray700,
    height: '72px', verticalAlign: 'middle',
  };

  const formatSchedule = (g) => {
    // Turli field nomlarini qabul qilish
    const time = g.start_time || g.startTime || g.time || g.lesson_time || '';
    const days = g.week_day || g.days || g.schedule_days || g.scheduleDays || g.week_days || g.weekDays || [];
    const dayMap = {
      monday: 'Du', tuesday: 'Se', wednesday: 'Chor',
      thursday: 'Pay', friday: 'Ju', saturday: 'Shan', sunday: 'Yak',
      // Qisqartmalar ham bo'lishi mumkin
      mon: 'Du', tue: 'Se', wed: 'Chor', thu: 'Pay', fri: 'Ju', sat: 'Shan', sun: 'Yak',
    };
    const dayStr = Array.isArray(days) && days.length > 0
      ? days.map(d => dayMap[String(d).toLowerCase()] || d).join(', ')
      : '';
    return { time, dayStr };
  };

  /* ── Sidebar active check ── */
  const isGroupsActive = activeMenu === 'groups' && activeTab === 'groups';
  const isYigilayotganActive = activeMenu === 'groups' && activeTab === 'yigilayotgan';
  const isProfileActive = activeMenu === 'profile';

  const sidebarBtn = (isActive) => ({
    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 12px', border: 'none',
    backgroundColor: isActive ? C.purple : 'transparent',
    color: isActive ? '#fff' : C.gray500,
    borderRadius: '10px', cursor: 'pointer',
    fontSize: '13.5px', fontWeight: isActive ? '600' : '400',
    transition: 'all 0.18s',
    boxShadow: isActive ? `0 2px 8px ${C.purpleShadow}` : 'none',
    textAlign: 'left',
  });

  const renderGroups = () => (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: `2px solid ${C.border}`, marginBottom: '20px', gap: '4px' }}>
        {[
          { k: 'groups', l: 'Guruhlar' },
          { k: 'arxiv', l: 'Arxiv', icon: <ArchiveOutlinedIcon style={{ fontSize: '15px' }} /> },
        ].map(({ k, l, icon }) => (
          <button key={k} onClick={() => setActiveTab(k)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', border: 'none',
              borderBottom: activeTab === k ? `2px solid ${C.purple}` : '2px solid transparent',
              backgroundColor: 'transparent', cursor: 'pointer',
              fontSize: '14px', fontWeight: activeTab === k ? '600' : '400',
              color: activeTab === k ? C.purple : C.gray500,
              marginBottom: '-2px', transition: 'all 0.2s',
            }}
          >
            {icon}{l}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: C.gray50, borderBottom: `1px solid ${C.border}` }}>
              {['Status', 'Guruh nomi', 'Kurs', 'Davomiyligi', 'Dars vaqti', 'Xona', "O'qituvchi", 'Talabalar'].map((h, i) => (
                <th key={i} style={{ padding: '13px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: C.gray700, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
              <th style={{ padding: '13px 16px', textAlign: 'center', width: '40px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); fetchGroups(); }}
                  title="Yangilash"
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: C.gray500,
                    padding: 0,
                    transition: 'color 0.2s',
                    outline: 'none'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = C.purple}
                  onMouseLeave={e => e.currentTarget.style.color = C.gray500}
                >
                  <RefreshIcon style={{ fontSize: '18px' }} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: '56px', textAlign: 'center', color: C.gray400, fontSize: '14px' }}>Yuklanmoqda...</td></tr>
            ) : filteredGroups.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '56px', textAlign: 'center', color: C.gray400, fontSize: '14px' }}>Guruhlar topilmadi</td></tr>
            ) : filteredGroups.map((g, i) => {
              const isActive = g.is_active !== false
                && !['finished', 'tugagan', 'archived', 'inactive'].includes((g.status || '').toLowerCase());
              const groupName = g.name || g.groupName || g.group_name || g.title || '-';
              const courseName = g.course
                ? (typeof g.course === 'object' ? g.course.name : g.course)
                : (g.courseName || g.course_name || '-');
              const durationRaw = g.duration || g.duration_month || g.months || g.course?.duration_month || g.course?.duration || 6;
              const duration = `${durationRaw} oy`;
              const room = g.room
                ? (typeof g.room === 'object' ? g.room.name : g.room)
                : (g.roomName || g.room_name || '-');
              const teacherName = (g.teachers && g.teachers.length > 0)
                ? (g.teachers[0].full_name || g.teachers[0].name || '-')
                : (g.teacher?.full_name || g.teacher?.name || g.teacherName || teacherProfile?.full_name || '-');
              const studentCount = g.students_count ?? g.student_count ?? g.studentsCount
                ?? g.students_count ?? (g.students ? g.students.length : 0);
              const { time, dayStr } = formatSchedule(g);

              return (
                <tr key={g.id || i}
                  onClick={() => setSelectedGroupId(g.id)}
                  style={{ borderBottom: i < filteredGroups.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.15s', height: '72px', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = C.gray50}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                >
                  {/* Status toggle */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div 
                        onClick={(e) => { e.stopPropagation(); }}
                        style={{
                          width: '44px', height: '24px', borderRadius: '12px',
                          backgroundColor: isActive ? C.purple : C.gray400,
                          position: 'relative', flexShrink: 0, transition: 'background 0.2s',
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: '3px',
                          left: isActive ? '23px' : '3px',
                          width: '18px', height: '18px', borderRadius: '50%',
                          backgroundColor: '#fff', transition: 'left 0.2s',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        letterSpacing: '0.5px',
                        color: isActive ? '#22c55e' : C.gray400,
                        backgroundColor: isActive ? '#f0fdf4' : C.gray100,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        display: 'inline-block',
                      }}>
                        {isActive ? 'FAOL' : 'ARXIV'}
                      </span>
                    </div>
                  </td>

                  {/* Group name */}
                  <td style={{ ...tdStyle, fontWeight: '600', color: '#111827' }}>{groupName}</td>

                  {/* Course */}
                  <td style={tdStyle}>
                    <span style={{
                      backgroundColor: '#f5f0ff', // C.purpleLight
                      color: C.purple,
                      fontWeight: '600',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      display: 'inline-block'
                    }}>{courseName}</span>
                  </td>

                  {/* Duration */}
                  <td style={{ ...tdStyle, color: C.gray500 }}>{duration}</td>

                  {/* Schedule */}
                  <td style={tdStyle}>
                    {time ? (
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>{time}</div>
                        {dayStr && <div style={{ fontSize: '11.5px', color: C.gray500, marginTop: '2px' }}>{dayStr}</div>}
                      </div>
                    ) : <span style={{ color: C.gray400 }}>—</span>}
                  </td>

                  {/* Room */}
                  <td style={{ ...tdStyle, color: C.gray500 }}>{room}</td>

                  {/* Teacher */}
                  <td style={{ ...tdStyle, color: C.gray500 }}>{teacherName}</td>

                  {/* Students */}
                  <td style={{ ...tdStyle, fontWeight: '700', fontSize: '15px', color: '#111827' }}>{studentCount}</td>

                  {/* Actions */}
                  <td style={{ ...tdStyle, width: '40px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: C.gray400, transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.gray100; e.currentTarget.style.color = C.gray700; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.gray400; }}
                    >
                      <MoreVertIcon style={{ fontSize: '18px' }} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProfile = () => {
    const photoUrl = getPhotoUrl(teacherProfile?.photo);
    const formatDate = (dateStr) => {
      if (!dateStr) return '—';
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch { return dateStr; }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Sarlavha */}
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: '800', color: '#1a1a2e' }}>Profil</h2>
        </div>

        {/* Profil Layout (Chap va O'ng Kartochkalar) */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* 1. Chap Tomondagi Kichik Karta */}
          <div style={{
            width: '220px', backgroundColor: '#fff', borderRadius: '24px',
            overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column',
            alignItems: 'center', paddingBottom: '24px'
          }}>
            {/* Yashil Ustki qism */}
            <div style={{
              width: '100%', height: '110px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              position: 'relative', marginBottom: '55px'
            }}>
              {/* Yumaloq Avatar */}
              <div style={{
                position: 'absolute', bottom: '-45px', left: '50%',
                transform: 'translateX(-50%)', width: '90px', height: '90px',
                borderRadius: '50%', border: '4px solid #fff', backgroundColor: '#eef2f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                {photoUrl ? (
                  <img src={photoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectCover: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <span style={{ fontSize: '32px', fontWeight: '700', color: C.purple }}>{initial}</span>
                )}
              </div>
            </div>

            {/* Ism va Rol */}
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: '#1a1a2e', textAlign: 'center', padding: '0 12px' }}>
              {teacherProfile?.full_name || 'O\'qituvchi'}
            </h3>
            <span style={{ fontSize: '13px', color: C.gray500, fontWeight: '500' }}>O'qituvchi</span>
          </div>

          {/* 2. O'ng Tomondagi Asosiy Karta */}
          <div style={{
            flex: 1, minWidth: '320px', backgroundColor: '#fff', borderRadius: '24px',
            padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '24px'
          }}>
            
            {/* Shaxsiy Ma'lumotlar Bo'limi */}
            <div>
              <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#1a1a2e' }}>
                Shaxsy ma'lumotlar
              </h4>
              
              {/* Grid malumotlar */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px', paddingBottom: '20px', borderBottom: `1.5px solid ${C.border}`
              }}>
                {/* Email */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EmailOutlinedIcon style={{ fontSize: '18px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: C.gray400, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</div>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1a1a2e', marginTop: '2px' }}>{teacherProfile?.email || '—'}</div>
                  </div>
                </div>

                {/* Telefon */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LocalPhoneOutlinedIcon style={{ fontSize: '18px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: C.gray400, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Telefon raqam</div>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1a1a2e', marginTop: '2px' }}>{teacherProfile?.phone ? `+${teacherProfile.phone}` : '—'}</div>
                  </div>
                </div>

                {/* Manzil */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LocationOnOutlinedIcon style={{ fontSize: '18px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: C.gray400, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Manzil</div>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1a1a2e', marginTop: '2px' }}>{teacherProfile?.address || 'Tashkent'}</div>
                  </div>
                </div>

                {/* Ro'yxatdan o'tgan sana */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CalendarTodayOutlinedIcon style={{ fontSize: '17px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: C.gray400, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ro'yxatdan o'tgan sana</div>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1a1a2e', marginTop: '2px' }}>{formatDate(teacherProfile?.created_at)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guruhlar Bo'limi */}
            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#1a1a2e' }}>
                Guruhlar
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {groups.length > 0 ? (
                  groups.map((g, idx) => {
                    const gName = g.name || g.groupName || g.group_name || 'Guruh';
                    return (
                      <div key={g.id || idx} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        backgroundColor: '#ecfdf5', color: '#059669', padding: '6px 14px',
                        borderRadius: '20px', fontSize: '12.5px', fontWeight: '700'
                      }}>
                        <SchoolOutlinedIcon style={{ fontSize: '15px' }} />
                        {gName}
                      </div>
                    );
                  })
                ) : (
                  <span style={{ fontSize: '13px', color: C.gray400 }}>Guruhlar mavjud emas</span>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif", overflow: 'hidden', backgroundColor: C.headerBg }}>

      {/* ════ SIDEBAR ════════════════════════════════════════════ */}
      <aside style={{
        width: '240px', flexShrink: 0,
        backgroundColor: C.sidebarBg,
        borderRadius: '0 24px 24px 0',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '8px', minHeight: '68px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            backgroundColor: C.purple,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: '800', fontSize: '14px', flexShrink: 0,
          }}>N</div>
          <span style={{ fontSize: '17px', fontWeight: '800', color: C.gray700 }}>
            Najot<span style={{ color: C.purple }}>Edu</span>
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 12px', overflowY: 'auto' }}>

          {/* Guruhlar section */}
          <div style={{ marginBottom: '4px' }}>
            <button
              onClick={() => setGuruhlarOpen(v => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', border: 'none', backgroundColor: 'transparent',
                cursor: 'pointer', borderRadius: '10px',
                fontSize: '13px', fontWeight: '600', color: C.gray500,
                transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = C.gray50}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PeopleAltOutlinedIcon style={{ fontSize: '17px' }} />
                Guruhlar
              </div>
              <KeyboardArrowDownIcon style={{
                fontSize: '18px', transition: 'transform 0.2s',
                transform: guruhlarOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }} />
            </button>

            {guruhlarOpen && (
              <div style={{ paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                <button
                  onClick={() => { setActiveMenu('groups'); setActiveTab('groups'); setSelectedGroupId(null); setSelectedHomeworkId(null); setSelectedSubmissionId(null); setIsCreatingHomework(false); }}
                  style={sidebarBtn(isGroupsActive)}
                  onMouseEnter={e => { if (!isGroupsActive) e.currentTarget.style.backgroundColor = C.gray50; }}
                  onMouseLeave={e => { if (!isGroupsActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  Guruhlar
                </button>
                <button
                  onClick={() => { setActiveMenu('groups'); setActiveTab('yigilayotgan'); setSelectedGroupId(null); setSelectedHomeworkId(null); setSelectedSubmissionId(null); setIsCreatingHomework(false); }}
                  style={sidebarBtn(isYigilayotganActive)}
                  onMouseEnter={e => { if (!isYigilayotganActive) e.currentTarget.style.backgroundColor = C.gray50; }}
                  onMouseLeave={e => { if (!isYigilayotganActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  Yig&apos;ilayotgan guruhlar
                </button>
              </div>
            )}
          </div>

          {/* Profil */}
          <button
            onClick={() => { setActiveMenu('profile'); setSelectedGroupId(null); setSelectedHomeworkId(null); setSelectedSubmissionId(null); setIsCreatingHomework(false); }}
            style={sidebarBtn(isProfileActive)}
            onMouseEnter={e => { if (!isProfileActive) e.currentTarget.style.backgroundColor = C.gray50; }}
            onMouseLeave={e => { if (!isProfileActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <PersonOutlinedIcon style={{ fontSize: '17px' }} />
            Profil
          </button>

        </nav>
      </aside>

      {/* ════ MAIN ═══════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ─── HEADER ─────────────────────────────────────────── */}
        <header style={{
          height: '64px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px 0 16px',
          backgroundColor: C.headerBg,
        }}>
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* + Qo'shish */}
            <button style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', border: 'none', borderRadius: '12px',
              backgroundColor: C.purple, color: '#fff', cursor: 'pointer',
              fontSize: '13.5px', fontWeight: '600',
              boxShadow: `0 2px 8px ${C.purpleShadow}`,
              transition: 'all 0.18s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <AddIcon style={{ fontSize: '18px' }} />
              Qo&apos;shish
              <ExpandMoreIcon style={{ fontSize: '16px' }} />
            </button>

            {/* Search */}
            <div style={{ position: 'relative', width: '260px' }}>
              <SearchIcon style={{
                position: 'absolute', left: '12px', top: '50%',
                transform: 'translateY(-50%)', color: C.gray400, fontSize: '18px',
              }} />
              <input
                type="text" placeholder="Qidirish..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px 8px 38px',
                  border: 'none', borderRadius: '12px', fontSize: '13px',
                  outline: 'none', backgroundColor: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  color: C.gray700, boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ ...hdrBtn, padding: '0 12px', fontSize: '12px', fontWeight: '500', color: C.gray500, width: 'auto', borderRadius: '12px' }}>
              O&apos;zbekcha
            </div>
            <button style={hdrBtn}>
              <NotificationsNoneIcon style={{ fontSize: '20px' }} />
            </button>
            <button style={hdrBtn}>
              <DarkModeOutlinedIcon style={{ fontSize: '20px' }} />
            </button>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              backgroundColor: C.purple,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: '700', fontSize: '14px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            }}>
              {initial}
            </div>
            {/* Chiqish tugmasi */}
            <button
              onClick={handleLogout}
              title="Chiqish"
              style={{ ...hdrBtn, color: '#f87171' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#f87171'; }}
            >
              <LogoutOutlinedIcon style={{ fontSize: '18px' }} />
            </button>
          </div>
        </header>

        {/* ─── CONTENT ────────────────────────────────────────── */}
        <main style={{ flex: 1, padding: (selectedGroupId || selectedHomeworkId || isCreatingHomework || selectedSubmissionId) ? '0 24px 24px 24px' : '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {selectedSubmissionId ? (
            <ExamSubmission
              groupId={selectedGroupId}
              homeworkId={selectedHomeworkId}
              submissionId={selectedSubmissionId}
              studentName={selectedStudentName}
              onBack={() => {
                setSelectedSubmissionId(null);
                setSelectedStudentName('');
              }}
              onSuccess={(resultTab) => {
                setSelectedSubmissionId(null);
                setSelectedStudentName('');
                setHomeworkInitialTab(resultTab || 'PENDING');
                setHomeworkDetailKey(prev => prev + 1);
              }}
            />
          ) : isCreatingHomework ? (
            <CreateHomework 
              groupId={selectedGroupId}
              onSuccess={() => setIsCreatingHomework(false)}
              onBack={() => setIsCreatingHomework(false)}
            />
          ) : selectedHomeworkId ? (
            <HomeworkDetail 
              key={homeworkDetailKey}
              groupId={selectedGroupId} 
              homeworkId={selectedHomeworkId} 
              group={groups.find(g => g.id === selectedGroupId)}
              initialTab={homeworkInitialTab}
              onBack={() => setSelectedHomeworkId(null)} 
              onSubmissionClick={(subId, name) => {
                setSelectedSubmissionId(subId);
                setSelectedStudentName(name || '');
              }}
            />
          ) : selectedGroupId ? (
            <GroupDetail 
              id={selectedGroupId} 
              group={groups.find(g => g.id === selectedGroupId)}
              teacherProfile={teacherProfile}
              onBack={() => setSelectedGroupId(null)}
              onHomeworkClick={(hwId) => setSelectedHomeworkId(hwId)}
              onHomeworkCreate={() => setIsCreatingHomework(true)}
            />
          ) : (
            <>
              {activeMenu === 'groups' && (
                <>
                  <h2 style={{ margin: '0 0 20px', fontSize: '22px', fontWeight: '700', color: C.gray700 }}>Guruhlar</h2>
                  {renderGroups()}
                </>
              )}
              {activeMenu === 'profile' && renderProfile()}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
