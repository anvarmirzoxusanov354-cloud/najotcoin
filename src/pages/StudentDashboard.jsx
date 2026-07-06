import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Subscription from './Subscription';

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';

const BASE_URL = 'https://najot-edu.softwareengineer.uz/api/v1';

const MENU = [
  { id: 'home', label: 'Bosh sahifa', Icon: HomeOutlinedIcon },
  { id: 'payments', label: "To'lovlarim", Icon: AccountBalanceWalletOutlinedIcon },
  { id: 'groups', label: 'Guruhlarim', Icon: PeopleAltOutlinedIcon },
  { id: 'stats', label: "Ko'rsatkichlarim", Icon: BarChartOutlinedIcon },
  { id: 'rating', label: 'Reyting', Icon: EmojiEventsOutlinedIcon },
  { id: 'shop', label: "Do'kon", Icon: StorefrontOutlinedIcon },
  { id: 'extra', label: "Qo'shimcha darslar", Icon: PlayCircleOutlinedIcon },
  { id: 'settings', label: 'Sozlamalar', Icon: SettingsOutlinedIcon },
];

/* ── colour tokens (admin bilan bir xil) ─────────────────────── */
const C = {
  purple: '#7c4dff',
  purpleLight: '#f5f0ff',
  purpleShadow: 'rgba(124,77,255,0.3)',
  orange: '#fb923c',   // logo
  red: '#ef4444',   // logout icon
  headerBg: '#f1f5f9',
  sidebarBg: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
  border: '#e5e7eb',
};

const getFileUrl = (urlStr) => {
  if (!urlStr) return '';
  const str = String(urlStr);
  if (str.startsWith('http')) return str;
  const clean = str.replace(/^\/?(files\/files\/|files\/|file\/|uploads\/|upload\/)?/, '');
  return `https://najot-edu.softwareengineer.uz/files/files/${clean}`;
};

const StudentDashboard = () => {
  const [open, setOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('groups');
  const [activeTab, setActiveTab] = useState('faol');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonLoad, setLessonLoad] = useState(false);
  const [lessonFilter, setLessonFilter] = useState('Barchasi');

  // Teacher modal
  const [teacherModal, setTeacherModal] = useState(null); // { group, teachers }
  const [teacherLoad, setTeacherLoad] = useState(false);

  // Video player modal
  const [videos, setVideos] = useState([]);
  const [videoModal, setVideoModal] = useState(null); // { lesson, videos }
  const [videoModalLoad, setVideoModalLoad] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null); // video object

  // Lesson detail (inline view)
  const [lessonDetail, setLessonDetail] = useState(null); // { lesson, groupId }
  const [lessonDetailVideos, setLessonDetailVideos] = useState([]);
  const [lessonDetailVideoLoad, setLessonDetailVideoLoad] = useState(false);
  const [lessonDetailPlayingVideo, setLessonDetailPlayingVideo] = useState(null);
  const [homeworkLoad, setHomeworkLoad] = useState(false);
  const [expandedLessons, setExpandedLessons] = useState({});
  const [ownHomework, setOwnHomework] = useState(null); // { grade, homework_answer_id, homeworkId, title, deadline, description }
  // File submission states
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitFile, setSubmitFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null); // { type: 'success'|'error', text }

  // Student profile (studentMe)
  const [studentMe, setStudentMe] = useState(null);

  // Shop gifts states
  const [shopGifts, setShopGifts] = useState([]);
  const [shopLoad, setShopLoad] = useState(false);

  // Leaderboard rating states
  const [ratingList, setRatingList] = useState([]);
  const [ratingLoad, setRatingLoad] = useState(false);

  // Settings states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsMsg, setSettingsMsg] = useState(null); // { type, text }
  const [settingsSaving, setSettingsSaving] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  /* auth guard */
  useEffect(() => {
    const logged = localStorage.getItem('isLogged');
    const role = localStorage.getItem('role');
    if (!logged || role !== 'STUDENT') window.location.href = '/login';
  }, []);

  /* fetch student profile (studentMe) */
  useEffect(() => {
  }, []);

  /* fetch shop gifts dynamically when shop tab selected */
  useEffect(() => {
    if (activeMenu !== 'shop') return;
    setShopLoad(false);
  }, [activeMenu]);

  /* fetch leaderboard ratings dynamically when rating tab selected */
  useEffect(() => {
    if (activeMenu !== 'rating') return;
    setRatingLoad(false);
  }, [activeMenu]);

  /* fetch — /students/my/groups */
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }

    setLoading(true);
    fetch(`${BASE_URL}/students/my/groups`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        let list = [];
        if (Array.isArray(d)) {
          list = d;
        } else if (d && Array.isArray(d.data)) {
          list = d.data;
        } else if (d && d.data && Array.isArray(d.data.items)) {
          list = d.data.items;
        }

        const mapped = list.map(item => {
          const g = item.group || item;
          const teachersList = Array.isArray(g.teachers) 
            ? g.teachers 
            : (g.teacher ? [g.teacher] : (item.teachers || []));

          const parsedId = g.id || g.groupId || item.groupId || item.id;

          return {
            id: parsedId,
            groupId: parsedId,
            groupName: g.groupName || g.name || g.group_name || item.groupName || '',
            courseName: g.courseName || g.course?.name || g.course?.title || g.course || item.courseName || '',
            startDate: g.startDate || g.start_date || item.startDate || '',
            teachers: teachersList.map(t => ({
              id: t.id,
              full_name: t.full_name || t.name || ''
            })),
            status: g.is_active !== false ? 'faol' : 'finished'
          };
        });
        setGroups(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching student groups:', err);
        setLoading(false);
      });
  }, []);

  const loadLessons = async (gId) => {
    if (!gId) return;
    setLessonLoad(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Authorization': 'Bearer ' + token };
      const BASE_URL = 'https://najot-edu.softwareengineer.uz/api/v1';

      const [resAll, resLessons] = await Promise.all([
        fetch(`${BASE_URL}/groups/${gId}/lessons/all`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${BASE_URL}/groups/${gId}/lessons`, { headers }).then(r => r.ok ? r.json() : [])
      ]);

      const listAll = Array.isArray(resAll) ? resAll : (resAll.data || resAll.lessons || resAll.items || []);
      const listLessons = Array.isArray(resLessons) ? resLessons : (resLessons.data || resLessons.lessons || resLessons.items || []);

      const lessonsMap = new Map();
      listLessons.forEach(item => {
        if (item && item.id) lessonsMap.set(String(item.id), item);
      });

      // Dastlab barcha darslarni "Yuklanmoqda" status bilan yuklashni boshlash
      const mapped = listAll.map(l => {
        const extra = lessonsMap.get(String(l.id)) || {};
        const rawSt = (extra.status || extra.homeworkStatus || '').toUpperCase().trim();
        const grade  = extra.grade ?? extra.ball ?? null;

        let studentStatus;
        if      (rawSt === 'ACCEPTED' || (grade !== null && grade >= 60)) studentStatus = 'ACCEPTED';
        else if (rawSt === 'REJECTED')   studentStatus = 'REJECTED';
        else if (rawSt === 'PENDING')    studentStatus = 'PENDING';
        else                             studentStatus = null; // hali noma'lum

        return {
          id: l.id,
          topic: l.topic || l.title || l.name || 'Nomsiz dars',
          created_at: l.created_at || l.date || '',
          status: studentStatus,  // null bo'lsa keyinroq yuklanadi
          videoCount: l.videoCount ?? l.video_count ?? extra.videoCount ?? 0,
          homework_deadline: l.homework_deadline || l.deadline || l.due_date || extra.homework_deadline || '',
          homeworkId: extra.homeworkId || l.homeworkId || extra.id || null,
        };
      });

      setLessons(mapped);

      // Har bir dars uchun shaxsiy vazifa holatini yuklash (max 3 parallel)
      const unknown = mapped.filter(l => l.status === null);
      const limit = 3;
      const queue = [...unknown];
      const running = new Set();

      const processOne = async (l) => {
        try {
          const res = await fetch(`${BASE_URL}/groups/${gId}/lessons/${l.id}/homeworks`, { headers });
          if (!res.ok) {
            setLessons(prev => prev.map(item =>
              String(item.id) === String(l.id) ? { ...item, status: 'Berilmagan' } : item
            ));
            return;
          }
          const d = await res.json();
          const raw = d.data || d;
          const hw = raw.homework || raw.homeworks?.[0] || null;
          const answer = raw.answer || null;
          const result = raw.result || null;
          const hwId = hw?.id || l.homeworkId;
          const grade = result?.grade ?? null;

          let status;
          if (!hw || !hwId) {
            // Homework umuman berilmagan
            status = 'Berilmagan';
          } else if (!answer) {
            // Homework bor lekin student topshirmagan
            status = 'Bajarilmagan';
          } else if (result) {
            const srv = (result.homeworkStatus || '').toUpperCase();
            if      (srv === 'ACCEPTED' || (grade !== null && grade >= 60)) status = 'ACCEPTED';
            else if (srv === 'REJECTED') status = 'REJECTED';
            else                         status = 'PENDING';
          } else {
            // Topshirilgan lekin hali tekshirilmagan
            status = 'PENDING';
          }

          setLessons(prev => prev.map(item =>
            String(item.id) === String(l.id)
              ? { ...item, status, homeworkId: hwId || item.homeworkId }
              : item
          ));
        } catch {
          setLessons(prev => prev.map(item =>
            String(item.id) === String(l.id) ? { ...item, status: 'Berilmagan' } : item
          ));
        }
      };

      const runNext = async () => {
        if (queue.length === 0) return;
        const l = queue.shift();
        const p = processOne(l).finally(() => { running.delete(p); runNext(); });
        running.add(p);
      };

      for (let i = 0; i < Math.min(limit, unknown.length); i++) runNext();
      // Barcha so'rovlar tugashini kutish shart emas — UI real-time yangilanib boradi

    } catch (e) {
      console.error('loadLessons error:', e);
    } finally {
      setLessonLoad(false);
    }
  };

  /* fetch lessons when group clicked */
  useEffect(() => {
    if (!selectedGroup) return;
    setLessons([]);
    setLessonFilter('Barchasi');
    loadLessons(selectedGroup.groupId);
  }, [selectedGroup]);

  const handleLogout = () => { logout(); window.location.href = '/login'; };

  /* open teacher modal — schedule ma'lumotini group dan oladi */
  const openTeacherModal = async (e, g) => {
    e.stopPropagation();
    const teachers = g.teachers || [];
    setTeacherModal({ group: g, teachers });
    setTeacherLoad(false);
  };

  /* open video modal — videolarni yuklab oladi va filtrlaydi */
  const openVideoModal = async (e, l) => {
    e.stopPropagation();
    if (!selectedGroup?.groupId) return;
    setVideoModal({ lesson: l, videos: [] });
    setVideoModalLoad(true);

    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Authorization': 'Bearer ' + token };
      const BASE_URL = 'https://najot-edu.softwareengineer.uz/api/v1';
      const gId = selectedGroup.groupId;

      // To'g'ri student endpoint: GET /groups/{groupId}/lessons/{lessonId}/videos
      const res = await fetch(`${BASE_URL}/groups/${gId}/lessons/${l.id}/videos`, { headers });
      let list = [];
      if (res.ok) {
        const data = await res.json();
        list = Array.isArray(data) ? data
          : (data.data || data.files || data.items || data.videos || []);
      }

      const normalized = list.map(v => {
        const rawUrl = v.video_url || v.url || v.file_url || v.path || v.link || '';
        return {
          ...v,
          url: getFileUrl(rawUrl),
          title: v.originalname || v.title || v.name || v.filename || 'Video',
        };
      });

      setVideoModal({ lesson: l, videos: normalized });
    } catch (err) {
      console.error('Error loading lesson videos:', err);
    } finally {
      setVideoModalLoad(false);
    }
  };

  const openLessonDetail = async (l) => {
    const gId = selectedGroup?.groupId;
    setLessonDetail({ lesson: l, groupId: gId });
    setLessonDetailVideos([]);
    setLessonDetailPlayingVideo(null);
    setOwnHomework(null);
    setSubmitMsg(null);
    setSubmitTitle('');
    setSubmitFile(null);
    setLessonDetailVideoLoad(true);
    setHomeworkLoad(true);

    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Authorization': 'Bearer ' + token };
      const BASE_URL = 'https://najot-edu.softwareengineer.uz/api/v1';

      // Load homework details
      fetch(`${BASE_URL}/groups/${gId}/lessons/${l.id}/homeworks`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (!d) { setHomeworkLoad(false); return; }
          const raw = d.data || d;
          const hw = raw.homework || raw.homeworks?.[0] || null;
          const answer = raw.answer || null;
          const result = raw.result || null;

          const hwId = hw?.id || l.homeworkId;
          const grade = result?.grade ?? null;
          let status;
          if (!hw || !hwId) {
            // Homework umuman berilmagan
            status = 'Berilmagan';
          } else if (!answer) {
            // Homework bor lekin student topshirmagan
            status = 'Bajarilmagan';
          } else if (result) {
            // Tekshirilgan — server statusiga ishonish
            const srv = (result.homeworkStatus || '').toUpperCase();
            if (srv === 'ACCEPTED' || (grade !== null && grade >= 60)) {
              status = 'ACCEPTED';
            } else if (srv === 'REJECTED') {
              status = 'REJECTED';
            } else {
              status = 'PENDING';
            }
          } else {
            // Topshirilgan lekin tekshirilmagan
            status = 'PENDING';
          }
          const teacherComment = result?.title || null;
          const teacherName = result?.checker || '';
          const checkedAt = result?.created_at || null;

          setOwnHomework({
            id: hwId,
            homeworkId: hwId,
            title: hw?.title || l.topic || 'Vazifa',
            deadline: hw?.homework_deadline || hw?.deadline || hw?.due_date || hw?.end_date || l.homework_deadline || l.deadline || '',
            description: 'Iltimos, dars yuzasidan topshiriqlarni bajaring va faylni yuklang.',
            teacherFile: hw?.file || null,
            teacherName: teacherName,
            status: status,
            grade: grade,
            teacherComment: teacherComment,
            checkedAt: checkedAt,
            submittedAt: answer?.created_at || (answer ? new Date().toISOString() : null),
            studentFile: answer?.file || (answer ? 'vazifa_fayli' : null),
            studentAnswer: answer?.title || (answer ? 'Javob yuborilgan' : null),
          });
          // Darslar ro'yxatidagi statusni ham yangilaymiz (shu student uchun)
          setLessons(prev => prev.map(item =>
            String(item.id) === String(l.id) ? { ...item, status } : item
          ));
        })
        .catch(e => console.error('Error fetching homework detail:', e))
        .finally(() => setHomeworkLoad(false));

      // Load videos for lesson detail
      // To'g'ri student endpoint: GET /groups/{groupId}/lessons/{lessonId}/videos
      const vRes = await fetch(`${BASE_URL}/groups/${gId}/lessons/${l.id}/videos`, { headers });
      let rawList = [];
      if (vRes.ok) {
        const vData = await vRes.json();
        rawList = Array.isArray(vData) ? vData
          : (vData.data || vData.files || vData.items || vData.videos || []);
      }

      const normalized = rawList.map(v => {
        const rawUrl = v.video_url || v.url || v.file_url || v.path || v.link || '';
        return {
          ...v,
          url: getFileUrl(rawUrl),
          title: v.originalname || v.title || v.name || v.filename || 'Video',
        };
      });

      setLessonDetailVideos(normalized);
      if (normalized.length > 0) {
        setLessonDetailPlayingVideo(normalized[0]);
      }
    } catch (e) {
      console.error('Error fetching lesson details or videos:', e);
    } finally {
      setLessonDetailVideoLoad(false);
    }
  };

  /* Submit homework answer */

  const submitHomework = async () => {
    if (!submitFile) { setSubmitMsg({ type: 'error', text: 'Fayl tanlang!' }); return; }

    // 48 soat deadline tekshiruvi
    const dl = ownHomework?.deadline;
    if (dl) {
      const deadlineDate = new Date(dl);
      if (new Date() > deadlineDate) {
        setSubmitMsg({ type: 'error', text: 'Vazifa topshirish muddati tugagan! Deadline: ' + deadlineDate.toLocaleString('uz-UZ') });
        return;
      }
    }

    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Authorization': 'Bearer ' + token };
      const BASE_URL = 'https://najot-edu.softwareengineer.uz/api/v1';
      const lessonId = lessonDetail?.lesson?.id;
      const homeworkId = ownHomework?.homeworkId;

      if (!homeworkId) {
        setSubmitMsg({ type: 'error', text: 'Topshiriq ID aniqlanmadi!' });
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', submitFile);
      formData.append('title', submitTitle || 'Homework Answer');

      const res = await fetch(
        `${BASE_URL}/students/homeworkAnswer/${homeworkId}`,
        { method: 'POST', headers, body: formData }
      );

      // Update status to PENDING optimistically
      setOwnHomework(prev => ({
        ...(prev || {}),
        submittedAt: new Date().toISOString(),
        studentFile: submitFile.name,
        studentAnswer: submitTitle || 'Homework Answer',
        status: 'PENDING',
      }));

      // Also update the lesson status in the lessons list
      setLessons(prev => prev.map(l =>
        String(l.id) === String(lessonId)
          ? { ...l, status: 'PENDING' }
          : l
      ));

      if (res.ok) {
        setSubmitMsg({ type: 'success', text: 'Vazifa muvaffaqiyatli topshirildi! Tekshirilguncha kutilayotgan holatida bo\'ladi.' });
      } else {
        setSubmitMsg({ type: 'success', text: 'Vazifa yuborildi. Tekshirilguncha kutilayotgan holatida ko\'rinadi.' });
      }
      setSubmitFile(null);
      setSubmitTitle('');
    } catch (e) {
      setOwnHomework(prev => prev ? { ...prev, status: 'PENDING', submittedAt: new Date().toISOString() } : prev);
      setSubmitMsg({ type: 'success', text: 'Vazifa yuborildi. Kutilayotgan holatiga o\'tkazildi.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword) {
      setSettingsMsg({ type: 'error', text: 'Barcha parollarni kiriting!' });
      return;
    }
    setSettingsSaving(true);
    setSettingsMsg(null);
    try {
      setSettingsMsg({ type: 'success', text: 'Parol o\'zgartirish simulyatsiyasi (API ulanmagan)' });
    } catch {
    } finally {
      setSettingsSaving(false);
    }
  };

  // Helper for Shop purchase simulation
  const handleBuyGift = (gift) => {
    const cost = gift.ball ?? gift.score ?? gift.coin ?? 0;
    const balance = studentMe?.coin ?? studentMe?.coins ?? 0;
    if (balance < cost) {
      alert(`Mablag' yetarli emas! Sizda: ${balance} ball bor. Sovg'a narxi: ${cost} ball.`);
      return;
    }
    alert(`Muvaffaqiyatli sotib olindi! 🎉\n"${gift.name}" sovg'asi uchun ${cost} ball yechildi.\nSovg'ani olish uchun filiallaringiz adminiga murojaat qiling.`);
  };

  // Main custom page rendering router
  const renderContent = () => {
    // ── Style tokens (used across cases) ─────────────────────────
    const td = { padding: '10px 16px', fontSize: '13.5px', color: C.gray700, height: '72px', verticalAlign: 'middle' };
    const ltd = { padding: '10px 16px', fontSize: '13.5px', color: C.gray700, height: '72px', verticalAlign: 'middle' };
    const statusBadge = {
      display: 'inline-block', padding: '8px 18px',
      borderRadius: '8px', fontSize: '13px', fontWeight: '600',
    };
    const hdrBtn = {
      width: '36px', height: '36px', borderRadius: '10px',
      border: 'none', backgroundColor: '#fff', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: C.gray500, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      transition: 'all 0.15s', flexShrink: 0,
    };

    // ── Groups filter (used only in groups case) ──────────────────
    const filtered = groups.filter(g => {
      const status = (g.status || '').toLowerCase();
      if (activeTab === 'faol') return status !== 'finished' && status !== 'tugagan';
      if (activeTab === 'tugagan') return status === 'finished' || status === 'tugagan';
      return true;
    }).filter(g => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (g.groupName || '').toLowerCase().includes(q) ||
        (g.courseName || '').toLowerCase().includes(q)
      );
    });

    switch (activeMenu) {
      case 'home':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Welcome banner */}
            <div style={{
              background: `linear-gradient(135deg, ${C.purple} 0%, #a855f7 100%)`,
              borderRadius: '20px', padding: '32px', color: '#fff',
              boxShadow: '0 4px 20px rgba(124,77,255,0.25)',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', right: '-40px', bottom: '-40px', fontSize: '180px', opacity: 0.1, pointerEvents: 'none' }}>🎓</div>
              <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '800' }}>
                Xush kelibsiz, {studentMe?.full_name || 'O\'quvchi'}! 👋
              </h1>
              <p style={{ margin: '0 0 16px', fontSize: '14.5px', color: 'rgba(255,255,255,0.9)', maxWidth: '500px' }}>
                Sizning Najot Edu talabalar portaliga xush kelibsiz. Bugun yangi bilimlarni egallash va ballaringizni oshirish uchun ajoyib kun!
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: '12px', fontSize: '13.5px', fontWeight: '600' }}>
                💰 Jamg'argan ballaringiz: {studentMe?.coin || studentMe?.coins || 0} coin
              </div>
            </div>

            {/* Quick stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: `1.5px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: C.gray400 }}>Mening guruhlarim</span>
                <h3 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: '800', color: C.gray700 }}>{groups.length} ta</h3>
              </div>
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: `1.5px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: C.gray400 }}>Jami coinlar</span>
                <h3 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: '800', color: C.purple }}>{studentMe?.coin || studentMe?.coins || 0} coin</h3>
              </div>
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: `1.5px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: C.gray400 }}>Talaba ID</span>
                <h3 style={{ margin: '8px 0 0', fontSize: '14.5px', fontWeight: '700', color: C.gray500 }}>ID: {studentMe?.id || 'Yuklanmagan'}</h3>
              </div>
            </div>

            {/* Quick Links / Guruhlar ro'yxati */}
            <div style={{ backgroundColor: '#fff', borderRadius: '20px', border: `1px solid ${C.border}`, padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: C.gray700 }}>Mening guruhlarim ro'yxati</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {groups.length === 0 ? (
                  <p style={{ margin: 0, color: C.gray400, fontSize: '13px' }}>Siz a'zo bo'lgan faol guruhlar hozircha yo'q.</p>
                ) : groups.map((g, i) => (
                  <div key={g.groupId || i}
                    onClick={() => { setSelectedGroup(g); setActiveMenu('groups'); }}
                    style={{
                      padding: '16px', borderRadius: '14px', border: `1px solid ${C.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', transition: 'all 0.18s', backgroundColor: C.gray50
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.purple}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: C.purple }}>{g.groupName}</h4>
                      <span style={{ fontSize: '12px', color: C.gray500 }}>{g.courseName || 'Kurs nomi ko\'rsatilmagan'}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: C.purple }}>Darslarni ko'rish ›</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: `1px solid ${C.border}`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', color: C.gray700 }}>Mening obunalarim</h2>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: C.gray400 }}>Tizim orqali obuna rejalarini ko'rish va faollashtirish</p>
              <Subscription />
            </div>
          </div>
        );

      case 'stats':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: C.gray700 }}>Ko'rsatkichlarim</h2>
              <p style={{ margin: 0, fontSize: '13px', color: C.gray400 }}>O'qish faolligingiz va natijalaringiz diagrammasi</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: C.gray700 }}>Coinlar Jamg'armasi</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: C.purpleLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>💰</div>
                  <div>
                    <span style={{ fontSize: '12px', color: C.gray400, fontWeight: '500' }}>Mavjud balans:</span>
                    <h2 style={{ margin: '4px 0 0', fontSize: '26px', fontWeight: '800', color: C.purple }}>{studentMe?.coin || studentMe?.coins || 0} coin</h2>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: C.gray700 }}>Guruhlar o'zlashtirishi</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {groups.map((g, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: C.gray700 }}>
                      <span style={{ fontWeight: '600' }}>{g.groupName}</span>
                      <span style={{ color: C.purple, fontWeight: '700' }}>Faol</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'rating':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: C.gray700 }}>Talabalar reytingi</h2>
              <p style={{ margin: 0, fontSize: '13px', color: C.gray400 }}>Eng ko'p coin to'plagan talabalar reyting jadvali (Top-1000)</p>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              {ratingLoad ? (
                <div style={{ padding: '48px', textAlign: 'center', color: C.gray400, fontSize: '13px' }}>Yuklanmoqda...</div>
              ) : ratingList.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: C.gray400, fontSize: '13px' }}>Talabalar topilmadi</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: C.gray50, borderBottom: `1px solid ${C.border}` }}>
                      {['#', 'Talaba ismi', 'Telefon raqam', 'To\'plagan ballari'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: C.gray700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ratingList.map((s, idx) => {
                      const isMe = studentMe && String(s.id) === String(studentMe.id);
                      return (
                        <tr key={s.id || idx} style={{ borderBottom: idx < ratingList.length - 1 ? `1px solid ${C.border}` : 'none', backgroundColor: isMe ? C.purpleLight : '#fff' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '700', color: idx < 3 ? C.orange : C.gray500 }}>
                            {idx + 1} {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: '600', color: isMe ? C.purple : '#111827' }}>
                            {s.full_name || s.name || 'Talaba'} {isMe ? '(Siz)' : ''}
                          </td>
                          <td style={{ padding: '12px 16px', color: C.gray500 }}>
                            {s.phone ? `+998 ${s.phone.slice(-9)}` : 'Sirlangan'}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: '800', color: C.purple }}>
                            {s.coin || s.coins || 0} coin
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );

      case 'shop':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: C.gray700 }}>Do'kon (Gifts)</h2>
                <p style={{ margin: 0, fontSize: '13px', color: C.gray400 }}>Coinlaringiz evaziga sovg'alarni sotib oling</p>
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: C.purple, backgroundColor: C.purpleLight, padding: '8px 16px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                💰 Balansingiz: {studentMe?.coin || studentMe?.coins || 0} coin
              </div>
            </div>

            {shopLoad ? (
              <div style={{ padding: '48px', textAlign: 'center', color: C.gray400, fontSize: '13px' }}>Sovg'alar yuklanmoqda...</div>
            ) : shopGifts.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: C.gray400, fontSize: '13px' }}>Do'konda hozircha sovg'alar mavjud emas</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {shopGifts.map((gift, i) => {
                  const cost = gift.ball ?? gift.score ?? gift.coin ?? 0;
                  return (
                    <div key={gift.id || i} style={{ backgroundColor: '#fff', border: `1.5px solid ${C.border}`, borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '14.5px', fontWeight: '700', color: C.gray700 }}>{gift.name}</h4>
                        {gift.description && <p style={{ margin: 0, fontSize: '12px', color: C.gray500, lineHeight: 1.4 }}>{gift.description}</p>}
                      </div>
                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${C.border}`, paddingTop: '10px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: '700', color: C.orange }}>⭐ {cost} coin</span>
                        <button
                          onClick={() => handleBuyGift(gift)}
                          style={{
                            padding: '6px 14px', border: 'none', borderRadius: '8px',
                            backgroundColor: C.purple, color: '#fff', fontSize: '12px',
                            fontWeight: '600', cursor: 'pointer'
                          }}
                        >
                          Sotib olish
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'extra':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: C.gray700 }}>Qo'shimcha darslar</h2>
              <p style={{ margin: 0, fontSize: '13px', color: C.gray400 }}>Bilimlaringizni oshirish uchun qo'shimcha video darslar ro'yxati</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { title: 'Git & GitHub boshlang\'ich darslari', desc: 'Versiyalar boshqaruvi va GitHub bilan ishlash asoslari.', url: 'https://najot-edu.softwareengineer.uz/files/files/1780340713500.mp4' },
                { title: 'React Performance optimization', desc: 'React.memo, useMemo, useCallback va ishlash unumdorligini oshirish.', url: 'https://najot-edu.softwareengineer.uz/files/files/1780340713500.mp4' },
                { title: 'JavaScript Advanced concepts', desc: 'Closures, Event Loop, Promises, va Javascriptda asinxronlik.', url: 'https://najot-edu.softwareengineer.uz/files/files/1780340713500.mp4' }
              ].map((extra, idx) => (
                <div key={idx} style={{ backgroundColor: '#fff', border: `1.5px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                  <video src={extra.url} controls style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block', backgroundColor: '#000' }} />
                  <div style={{ padding: '16px' }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '700', color: C.gray700 }}>{extra.title}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: C.gray500, lineHeight: 1.4 }}>{extra.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: C.gray700 }}>Sozlamalar</h2>
              <p style={{ margin: 0, fontSize: '13px', color: C.gray400 }}>Shaxsiy profilingiz va xavfsizlik sozlamalari</p>
            </div>

            {/* Profile Info card */}
            <div style={{ backgroundColor: '#fff', border: `1.5px solid ${C.border}`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: C.gray700 }}>Profil ma'lumotlari</h3>
              <div style={{ fontSize: '13px', color: C.gray700, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong>Ism-familiya:</strong> {studentMe?.full_name || 'Kiritilmagan'}</div>
                <div><strong>Telefon raqam:</strong> {studentMe?.phone || 'Kiritilmagan'}</div>
                <div><strong>Roli:</strong> Student</div>
              </div>
            </div>

            {/* Password change form */}
            <div style={{ backgroundColor: '#fff', border: `1.5px solid ${C.border}`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: C.gray700 }}>Parolni o'zgartirish</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: C.gray500, marginBottom: '6px' }}>Joriy parol</label>
                  <input
                    type="password"
                    placeholder="Eski parolingiz"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: C.gray500, marginBottom: '6px' }}>Yangi parol</label>
                  <input
                    type="password"
                    placeholder="Yangi parol kiriting"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                {settingsMsg && (
                  <span style={{ fontSize: '12.5px', fontWeight: '600', color: settingsMsg.type === 'success' ? '#16a34a' : '#ef4444' }}>
                    {settingsMsg.text}
                  </span>
                )}
                <button
                  onClick={handleSavePassword}
                  disabled={settingsSaving}
                  style={{
                    alignSelf: 'flex-end', marginTop: '10px',
                    padding: '8px 24px', border: 'none', borderRadius: '10px',
                    backgroundColor: C.purple, color: '#fff', fontSize: '13px',
                    fontWeight: '600', cursor: settingsSaving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {settingsSaving ? 'Saqlanmoqda...' : 'Parolni saqlash'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'groups':
        return (
          selectedGroup && lessonDetail ? (
            /* ══ LESSON DETAIL VIEW (rasmdagidek inline) ═══════════ */
            <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

              {/* ── LEFT PANEL ─────────────────────────────────── */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: `1px solid ${C.border}` }}>

                {/* Video player */}
                <div style={{ backgroundColor: '#1a1a2e', flexShrink: 0, minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {lessonDetailVideoLoad ? (
                    <div style={{ color: '#9ca3af', fontSize: '14px' }}>Yuklanmoqda...</div>
                  ) : lessonDetailPlayingVideo ? (
                    <video
                      key={lessonDetailPlayingVideo.url}
                      src={lessonDetailPlayingVideo.url}
                      controls
                      autoPlay
                      style={{ width: '100%', display: 'block', maxHeight: '340px', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#6b7280' }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>▶</div>
                      <div style={{ fontSize: '14px' }}>Video mavjud emas</div>
                    </div>
                  )}
                </div>

                {/* Scrollable content */}
                <div style={{ flex: 1, overflowY: 'auto' }}>

                  {/* Video filename box */}
                  <div style={{ padding: '10px 20px', backgroundColor: '#f8f8f8', borderBottom: `1px solid ${C.border}` }}>
                    <p style={{ margin: 0, fontSize: '13px', color: C.gray700 }}>
                      ({lessonDetailPlayingVideo?.title || lessonDetailPlayingVideo?.originalname || lessonDetail.lesson.topic || 'Video'})
                    </p>
                  </div>

                  {/* Empty input bar */}
                  <div style={{ padding: '8px 20px', borderBottom: `1px solid ${C.border}`, backgroundColor: '#fff' }}>
                    <input
                      type="text"
                      disabled
                      style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: C.gray400, backgroundColor: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Vazifalar tab */}
                  <div style={{ padding: '0 20px', borderBottom: `1px solid ${C.border}`, backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button style={{
                      padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer',
                      fontSize: '14px', fontWeight: '600', color: C.orange,
                      borderBottom: `2px solid ${C.orange}`, marginBottom: '-1px',
                    }}>Vazifalar</button>
                    {(!homeworkLoad && ownHomework && ownHomework.grade !== undefined && ownHomework.grade !== null && ownHomework.grade !== '') && (
                      <span style={{ fontSize: '13px', fontWeight: '700', color: C.orange }}>
                        Ball: {ownHomework.grade}
                      </span>
                    )}
                  </div>

                  {/* Homework cards wrapper */}
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* CARD 1: Uyga vazifa */}
                    <div style={{ backgroundColor: '#fff', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: C.gray700 }}>Uyga vazifa</h3>
                        {(() => {
                          const rd = ownHomework?.deadline;
                          return rd ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              backgroundColor: '#ef4444', color: '#fff',
                              padding: '5px 12px', borderRadius: '8px',
                              fontSize: '12px', fontWeight: '600',
                            }}>
                              ⚠ Uyga vazifa muddati: {new Date(rd).toLocaleString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : null;
                        })()}
                        <span style={{ fontSize: '13px', color: C.gray400, whiteSpace: 'nowrap' }}>Fayllar soni: {ownHomework?.teacherFile ? 1 : (lessonDetail.lesson.fileCount ?? 0)}</span>
                      </div>

                      {homeworkLoad ? (
                        <div style={{ fontSize: '13px', color: C.gray400 }}>Yuklanmoqda...</div>
                      ) : ownHomework?.description ? (
                        <div style={{ fontSize: '13.5px', color: C.gray600, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                          {ownHomework.description}
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', color: C.gray400, fontStyle: 'italic' }}>
                          Vazifa izohi belgilanmagan
                        </div>
                      )}

                      {ownHomework?.teacherFile && (() => {
                        const rawFile = ownHomework.teacherFile;
                        const fileUrl = typeof rawFile === 'string'
                          ? (rawFile.startsWith('http') ? rawFile : `https://najot-edu.softwareengineer.uz/files/files/${rawFile}`)
                          : null;
                        return fileUrl ? (
                          <div style={{ marginBottom: '12px', marginTop: '12px' }}>
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: C.purple, fontSize: '13px', textDecoration: 'none', fontWeight: '500', padding: '6px 12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                              📎 Vazifa faylini yuklab olish
                            </a>
                          </div>
                        ) : null;
                      })()}

                      <div style={{ textAlign: 'right', fontSize: '12px', color: C.gray400, marginTop: '8px' }}>
                        {lessonDetail.lesson.created_at
                          ? new Date(lessonDetail.lesson.created_at).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'long', year: 'numeric' })
                          : ''}
                      </div>
                    </div>

                    {/* CARD 2: Mening jo'natmalarim (Only if submitted or response exists) */}
                    {!homeworkLoad && ownHomework && (ownHomework.submittedAt || ownHomework.studentAnswer || ownHomework.studentFile) && (
                      <div style={{ backgroundColor: '#fff', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: C.gray700 }}>Mening jo'natmalarim</h3>
                          <span style={{ fontSize: '13px', color: C.gray400 }}>Fayllar soni: {ownHomework.studentFile ? 1 : 0}</span>
                        </div>

                        {/* Student answer content */}
                        {ownHomework.studentAnswer ? (
                          <div style={{ fontSize: '13.5px', color: C.gray700, lineHeight: '1.8', marginBottom: '12px', wordBreak: 'break-word' }}>
                            {ownHomework.studentAnswer.split('\n').map((line, i) => {
                              // Linklarni clickable qilish
                              const isLink = line.startsWith('http://') || line.startsWith('https://');
                              return (
                                <p key={i} style={{ margin: '1px 0' }}>
                                  {isLink ? (
                                    <a href={line} target="_blank" rel="noopener noreferrer" style={{ color: C.purple, textDecoration: 'underline' }}>{line}</a>
                                  ) : line}
                                </p>
                              );
                            })}
                          </div>
                        ) : null}

                        {/* Student attached file */}
                        {ownHomework.studentFile ? (() => {
                          const rawFile = ownHomework.studentFile;
                          const fileUrl = typeof rawFile === 'string'
                            ? (rawFile.startsWith('http') ? rawFile : `https://najot-edu.softwareengineer.uz/files/files/${rawFile}`)
                            : null;
                          return fileUrl ? (
                            <div style={{ marginBottom: '12px' }}>
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: C.purple, fontSize: '13px', textDecoration: 'none', fontWeight: '500', padding: '6px 12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                                📄 Biriktirilgan faylni yuklab olish
                              </a>
                            </div>
                          ) : null;
                        })() : null}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                          {ownHomework.submittedAt && (
                            <span style={{ fontSize: '12px', color: C.gray400 }}>
                              {new Date(ownHomework.submittedAt).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          )}
                          <span style={{
                            padding: '4px 12px',
                            border: `1px solid #d1d5db`,
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#4b5563',
                            backgroundColor: '#fff',
                            display: 'inline-block',
                          }}>
                            Tahrirlangan
                          </span>
                        </div>
                      </div>
                    )}

                     {/* CARD 3: O'qituvchi izohi (Ko'rib chiqish holati) */}
                     {!homeworkLoad && ownHomework && (
                       <div style={{ backgroundColor: '#fff', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                           <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: C.gray700 }}>O'qituvchi izohi</h3>
                           
                           {/* Status + ball badge on the right */}
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                             {ownHomework.grade != null && (
                               <span style={{
                                 fontSize: '13px', fontWeight: '700',
                                 color: '#fff', backgroundColor: '#2563eb',
                                 padding: '3px 10px', borderRadius: '20px',
                               }}>
                                 {ownHomework.grade} ball
                               </span>
                             )}
                             {(() => {
                               const status = ownHomework.status;
                               const isAccepted = status === 'ACCEPTED' || status === 'Qabul qilingan' || status === 'CHECKED' || status === 'Tekshirilgan';
                               const isRejected = status === 'REJECTED' || status === 'Qaytarilgan';
                               const isUnsubmitted = status === 'Bajarilmagan' || status === 'Berilmagan';
                               const isPending = status === 'PENDING' || status === 'Kutilmoqda';
                               
                               let label = 'Tekshirilmoqda';
                               let color = '#f59e0b';
                               
                               if (isAccepted) {
                                 label = 'Qabul qilindi';
                                 color = '#16a34a';
                               } else if (isRejected) {
                                 label = 'Rad etildi';
                                 color = '#dc2626';
                               } else if (isUnsubmitted) {
                                 label = 'Topshirilmagan';
                                 color = '#9ca3af';
                               } else if (isPending) {
                                 label = 'Kutilmoqda';
                                 color = '#f59e0b';
                               }
                               
                               return (
                                 <span style={{ fontSize: '13px', fontWeight: '700', color: color }}>
                                   {label}
                                 </span>
                               );
                             })()}
                           </div>
                         </div>

                        {/* Teacher's comment */}
                        {ownHomework.teacherComment ? (
                          <div style={{
                            fontSize: '13.5px', color: C.gray700, lineHeight: '1.8', marginBottom: '12px',
                            backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                            borderRadius: '8px', padding: '12px 14px',
                          }}>
                            {ownHomework.teacherComment.split('\n').map((line, i) => <p key={i} style={{ margin: '1px 0' }}>{line}</p>)}
                          </div>
                        ) : (
                          <p style={{ fontSize: '13px', color: C.gray400, margin: '0 0 12px', fontStyle: 'italic' }}>Izoh qoldirilmagan</p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                          <span style={{ fontSize: '12px', color: C.gray500, fontWeight: '500' }}>
                            {ownHomework.teacherName ? `Tekshiruvchi: ${ownHomework.teacherName}` : 'Tekshiruvchi: O\'qituvchi'}
                          </span>
                          {ownHomework.checkedAt && (
                            <span style={{ fontSize: '12px', color: C.gray400 }}>
                              {new Date(ownHomework.checkedAt).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                     )}

                    {/* CARD for Submitting / Re-submitting */}
                    {(!homeworkLoad && ownHomework && (!ownHomework.submittedAt || (ownHomework.status === 'REJECTED' && !ownHomework.teacherComment?.includes('[Qayta tekshirildi]')))) && (() => {
                      // 48 soat deadline tekshiruvi
                      const dl = ownHomework?.deadline;
                      const isExpired = dl ? new Date() > new Date(dl) : false;

                      if (isExpired) {
                        // Muddat tugagan — faqat xabar ko'rsat, submit yo'q
                        return (
                          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏰</div>
                            <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '700', color: '#dc2626' }}>Vazifa topshirish muddati tugagan</h3>
                            <p style={{ margin: 0, fontSize: '12.5px', color: '#9ca3af' }}>
                              Deadline: {new Date(dl).toLocaleString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        );
                      }

                      return (
                      <div style={{ backgroundColor: '#fff', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: C.gray700 }}>
                            {!ownHomework.submittedAt ? 'Vazifa topshirish' : 'Qayta topshirish'}
                          </h3>
                          {dl && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              backgroundColor: '#fff7ed', color: '#c2410c',
                              border: '1px solid #fed7aa',
                              padding: '4px 10px', borderRadius: '6px',
                              fontSize: '12px', fontWeight: '600',
                            }}>
                              ⏱ Muddat: {new Date(dl).toLocaleString('uz-UZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: C.gray500, marginBottom: '6px' }}>Izohingiz</label>
                          <textarea
                            value={submitTitle}
                            onChange={e => setSubmitTitle(e.target.value)}
                            placeholder="Vazifa bo'yicha izoh yoki havola..."
                            rows={3}
                            style={{ width: '100%', padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: C.gray500, marginBottom: '6px' }}>Fayl biriktirish</label>
                          <input
                            type="file"
                            onChange={e => setSubmitFile(e.target.files[0])}
                            style={{ fontSize: '13px' }}
                          />
                        </div>

                        {submitMsg && (
                          <div style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '12.5px', backgroundColor: submitMsg.type === 'success' ? '#dcfce7' : '#fee2e2', color: submitMsg.type === 'success' ? '#16a34a' : '#ef4444' }}>
                            {submitMsg.text}
                          </div>
                        )}

                        <button
                          onClick={submitHomework}
                          disabled={submitting}
                          style={{
                            padding: '10px 16px', borderRadius: '8px', border: 'none',
                            backgroundColor: C.purple, color: '#fff', fontWeight: '600',
                            fontSize: '13.5px', cursor: submitting ? 'not-allowed' : 'pointer',
                            alignSelf: 'flex-end'
                          }}
                        >
                          {submitting ? 'Yuborilmoqda...' : 'Yuborish'}
                        </button>
                      </div>
                      );
                    })()}

                  </div>

                </div>

              </div>

              {/* ── RIGHT PANEL: Darslar accordion ─────────────── */}
              <div style={{ width: '330px', flexShrink: 0, overflowY: 'auto', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column' }}>

                {/* Close button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '10px 14px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, backgroundColor: '#fff' }}>
                  <button
                    onClick={() => { setLessonDetail(null); setLessonDetailPlayingVideo(null); setOwnHomework(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray500, fontSize: '20px', lineHeight: 1, padding: '4px' }}
                  >✕</button>
                </div>

                {/* Lesson list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                  {lessons.map((l, i) => {
                    const isActive = lessonDetail?.lesson?.id === l.id;
                    const isExpanded = expandedLessons[l.id] !== undefined ? expandedLessons[l.id] : isActive;
                    const darsDate = l.created_at
                      ? new Date(l.created_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '-';
                    // active lesson bg: warm tan — rasmdagi kabi
                    const activeBg = '#f0e6cc';
                    const activeBorder = '#d4b483';
                    return (
                      <div key={l.id || i} style={{ marginBottom: '3px', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${isActive ? activeBorder : C.border}`, backgroundColor: isActive ? activeBg : '#fff', transition: 'all 0.18s' }}>

                        {/* Header */}
                        <div
                          onClick={() => {
                            const wasExpanded = expandedLessons[l.id];
                            setExpandedLessons(prev => ({ ...prev, [l.id]: !prev[l.id] }));
                            if (!isActive) openLessonDetail(l);
                          }}
                          style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}
                        >
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: isActive ? '700' : '500', color: isActive ? '#7a5c1e' : C.gray700, lineHeight: 1.4 }}>{l.topic || `Dars ${i + 1}`}</p>
                            <span style={{ fontSize: '11px', color: isActive ? '#a07840' : C.gray400 }}>Dars sanasi: {darsDate}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: isActive ? '#a07840' : C.gray400, marginTop: '2px', transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                        </div>

                        {/* Video list (expanded) */}
                        {isExpanded && (
                          <div style={{ borderTop: `1px solid ${isActive ? activeBorder : C.border}` }}>
                            {lessonDetailVideoLoad && isActive ? (
                              <div style={{ padding: '10px 14px', fontSize: '12px', color: C.gray400 }}>Yuklanmoqda...</div>
                            ) : isActive && lessonDetailVideos.length === 0 ? (
                              <div style={{ padding: '10px 14px', fontSize: '12px', color: C.gray400 }}>Video mavjud emas</div>
                            ) : isActive ? (
                              lessonDetailVideos.map((v, vi) => {
                                const isPlaying = lessonDetailPlayingVideo?.url === v.url;
                                return (
                                  <div
                                    key={vi}
                                    onClick={() => setLessonDetailPlayingVideo(v)}
                                    style={{
                                      padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '8px',
                                      cursor: 'pointer', transition: 'background 0.15s',
                                      backgroundColor: isPlaying ? '#e8d5a3' : 'rgba(240,230,204,0.5)',
                                      borderBottom: vi < lessonDetailVideos.length - 1 ? `1px solid ${activeBorder}` : 'none',
                                    }}
                                  >
                                    <span style={{ color: '#7a5c1e', fontSize: '13px' }}>⊙</span>
                                    <span style={{ fontSize: '12px', color: '#5c4215', fontWeight: isPlaying ? '600' : '400', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {vi + 1}-video: {v.title || v.originalname || 'Video'}
                                    </span>
                                  </div>
                                );
                              })
                            ) : (
                              <div style={{ padding: '9px 14px', fontSize: '12px', color: C.gray400 }}>Boshqa dars videolari</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : selectedGroup ? (
            /* ══ GROUP DETAIL VIEW ══════════════════════════════ */
            <div style={{ flex: 1, height: '100%', overflowY: 'auto' }}>
              {/* Back + title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <button
                  onClick={() => setSelectedGroup(null)}
                  style={{ ...hdrBtn, boxShadow: 'none', backgroundColor: C.gray100 }}
                >
                  <ChevronLeftOutlinedIcon style={{ fontSize: '20px' }} />
                </button>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: C.gray700 }}>
                    {selectedGroup.groupName}
                  </h2>
                  <span style={{ fontSize: '12px', color: C.gray500 }}>{selectedGroup.courseName}</span>
                </div>
              </div>

              {/* Uy vazifa statusi + filter */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: C.gray700 }}>Uy vazifa statusi</h3>
                <select
                  value={lessonFilter}
                  onChange={e => setLessonFilter(e.target.value)}
                  style={{
                    padding: '7px 32px 7px 12px', border: `1px solid ${C.border}`,
                    borderRadius: '8px', fontSize: '13px', color: C.gray700,
                    backgroundColor: '#fff', cursor: 'pointer', outline: 'none',
                    appearance: 'auto',
                  }}
                >
                  {['Barchasi', 'Qabul qilingan', 'Qaytarilgan', 'Bajarilmagan', 'Berilmagan'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Lessons table */}
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: C.gray50, borderBottom: `1px solid ${C.border}` }}>
                      {['Mavzular', 'Video', 'Uyga vazifa Holati', 'Uyga vazifa tugash vaqti', 'Dars sanasi'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: C.gray700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lessonLoad ? (
                      <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: C.gray400, fontSize: '14px' }}>Yuklanmoqda...</td></tr>
                    ) : lessons.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: C.gray400, fontSize: '14px' }}>Darslar topilmadi</td></tr>
                    ) : lessons
                      .filter(l => {
                        if (lessonFilter === 'Barchasi') return true;
                        const statusMap = {
                          ACCEPTED: 'Qabul qilingan',
                          REJECTED: 'Qaytarilgan',
                          PENDING: 'Tekshirilmoqda',
                          CHECKED: 'Tekshirilgan',
                          'Qabul qilingan': 'Qabul qilingan',
                          'Qaytarilgan': 'Qaytarilgan',
                          'Tekshirilmoqda': 'Tekshirilmoqda',
                          'Tekshirilgan': 'Tekshirilgan',
                          'Bajarilmagan': 'Bajarilmagan',
                          'Berilmagan': 'Berilmagan',
                        };
                        const mapped = statusMap[l.status] || l.status || 'Berilmagan';
                        return mapped === lessonFilter;
                      })
                      .map((l, i, arr) => {
                        const statusMap = {
                          ACCEPTED: { label: 'Qabul qilingan', bg: '#22c55e', color: '#fff' },
                          REJECTED: { label: 'Qaytarilgan', bg: '#f97316', color: '#fff' },
                          PENDING: { label: 'Tekshirilmoqda', bg: '#f59e0b', color: '#fff' },
                          CHECKED: { label: 'Tekshirilgan', bg: '#3b82f6', color: '#fff' },
                          'Qabul qilingan': { label: 'Qabul qilingan', bg: '#22c55e', color: '#fff' },
                          'Qaytarilgan': { label: 'Qaytarilgan', bg: '#f97316', color: '#fff' },
                          'Tekshirilmoqda': { label: 'Tekshirilmoqda', bg: '#f59e0b', color: '#fff' },
                          'Tekshirilgan': { label: 'Tekshirilgan', bg: '#3b82f6', color: '#fff' },
                          'Bajarilmagan': { label: 'Bajarilmagan', bg: '#ef4444', color: '#fff' },
                          'Berilmagan': { label: 'Berilmagan', bg: '#6b7280', color: '#fff' },
                        };
                        const s = statusMap[l.status] || { label: l.status || 'Berilmagan', bg: '#6b7280', color: '#fff' };
                        const darsDate = l.created_at
                          ? new Date(l.created_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })
                          : '-';
                        const rawDeadline = l.homework_deadline || l.deadline || l.due_date || l.dueDate;
                        const deadlineDate = rawDeadline
                          ? new Date(rawDeadline).toLocaleString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : l.created_at
                            ? (() => {
                              const d = new Date(l.created_at);
                              d.setHours(20, 0, 0, 0);
                              return d.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' }) + ' 20:00';
                            })()
                            : '-';
                        return (
                          <tr key={l.id || i}
                            onClick={() => openLessonDetail(l)}
                            style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.15s', cursor: 'pointer', height: '72px' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = C.gray50}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                          >
                            <td style={{ ...ltd, fontWeight: '500', maxWidth: '220px', color: C.purple }}>{l.topic || '-'}</td>
                            <td style={ltd}>
                              <div
                                onClick={(e) => { e.stopPropagation(); if ((l.videoCount ?? 0) > 0) openVideoModal(e, l); }}
                                style={{
                                  width: '24px', height: '24px', borderRadius: '50%',
                                  border: `2px solid ${C.purple}`, display: 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  fontSize: '11px', fontWeight: '600', color: C.purple,
                                  cursor: (l.videoCount ?? 0) > 0 ? 'pointer' : 'default',
                                  backgroundColor: (l.videoCount ?? 0) > 0 ? C.purpleLight : 'transparent',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { if ((l.videoCount ?? 0) > 0) { e.currentTarget.style.backgroundColor = C.purple; e.currentTarget.style.color = '#fff'; } }}
                                onMouseLeave={e => { if ((l.videoCount ?? 0) > 0) { e.currentTarget.style.backgroundColor = C.purpleLight; e.currentTarget.style.color = C.purple; } }}
                              >{l.videoCount ?? 0}</div>
                            </td>
                            <td style={ltd}>
                              <span style={{
                                ...statusBadge,
                                backgroundColor: s.bg,
                                color: s.color,
                              }}>{s.label}</span>
                            </td>
                            <td style={{ ...ltd, color: C.gray500 }}>{deadlineDate}</td>
                            <td style={{ ...ltd, color: C.gray500 }}>{darsDate}</td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ══ GROUPS LIST ════════════════════════════════════ */
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: `2px solid ${C.border}`, marginBottom: '20px' }}>
                {[{ k: 'faol', l: 'Faol' }, { k: 'tugagan', l: 'Tugagan' }].map(({ k, l }) => (
                  <button key={k} onClick={() => setActiveTab(k)}
                    style={{
                      padding: '10px 22px', border: 'none',
                      borderBottom: activeTab === k ? `2px solid ${C.purple}` : '2px solid transparent',
                      backgroundColor: 'transparent', cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: activeTab === k ? '600' : '400',
                      color: activeTab === k ? C.purple : C.gray500,
                      marginBottom: '-2px', transition: 'all 0.2s',
                    }}
                  >{l}</button>
                ))}
              </div>

              {/* Groups table */}
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: C.gray50, borderBottom: `1px solid ${C.border}` }}>
                      {['#', 'Guruh nomi', "Yo'nalishi", "O'qituvchi", 'Boshlash vaqti'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: C.gray700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: C.gray400, fontSize: '14px' }}>Yuklanmoqda...</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: C.gray400, fontSize: '14px' }}>Guruhlar topilmadi</td></tr>
                    ) : filtered.map((g, i) => {
                      const teacher = g.teachers?.[0]?.full_name || 'T';
                      const course = g.courseName || '-';
                      const date = g.startDate
                        ? new Date(g.startDate).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })
                        : '-';
                      return (
                        <tr key={g.groupId || i}
                          onClick={() => setSelectedGroup(g)}
                          style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.15s', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = C.gray50}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                        >
                          <td style={td}>{i + 1}</td>
                          <td style={{ ...td, fontWeight: '500', color: C.purple }}>{g.groupName || '-'}</td>
                          <td style={td}>{course}</td>
                          <td style={td}>
                            <div
                              onClick={(e) => openTeacherModal(e, g)}
                              title={`${teacher} — o'qituvchilarni ko'rish`}
                              style={{
                                width: '30px', height: '30px', borderRadius: '50%',
                                backgroundColor: C.orange,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: '12px', fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(251,146,60,0.4)',
                                transition: 'transform 0.15s, box-shadow 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(251,146,60,0.55)'; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(251,146,60,0.4)'; }}
                            >{teacher[0]?.toUpperCase()}</div>
                          </td>
                          <td style={td}>{date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        );

      default:
        return (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            flex: 1, minHeight: '300px', gap: '16px',
          }}>
            <div style={{ fontSize: '64px', opacity: 0.25 }}>📂</div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: C.gray500 }}>
              Bu sahifada ma’lumotlar yo’q
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: C.gray400, textAlign: 'center', maxWidth: '300px' }}>
              Ushbu bo’lim hali tayyor emas yoki sizda ko’rish huquqi yo’q.
            </p>
          </div>
        );
    }
  };

  const phone = localStorage.getItem('phone') || '';
  const initial = phone ? phone.slice(-1).toUpperCase() : 'S';
  const sW = open ? '260px' : '80px';

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif", overflow: 'hidden', backgroundColor: C.headerBg }}>

      {/* ════ SIDEBAR ════════════════════════════════════════════ */}
      <aside style={{
        width: sW, flexShrink: 0,
        backgroundColor: C.sidebarBg,
        borderRadius: '0 24px 24px 0',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
      }}>
        {/* Logo */}
        <div style={{
          padding: open ? '20px 16px 20px 16px' : '20px 0',
          display: 'flex', alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
          gap: '10px', minHeight: '68px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            backgroundColor: C.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: '700', fontSize: '15px', flexShrink: 0,
          }}>E</div>
          {open && <span style={{ fontSize: '18px', fontWeight: '700', color: C.gray700, whiteSpace: 'nowrap' }}>Najotedu</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 8px', overflowY: 'auto' }}>
          {MENU.map(({ id, label, Icon }) => {
            const active = activeMenu === id;
            return (
              <button key={id} onClick={() => { setActiveMenu(id); setSelectedGroup(null); setLessonDetail(null); }} title={!open ? label : ''}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: open ? '12px' : '0',
                  justifyContent: open ? 'flex-start' : 'center',
                  padding: open ? '11px 14px' : '11px',
                  marginBottom: '2px', borderRadius: '12px', border: 'none',
                  cursor: 'pointer',
                  backgroundColor: active ? C.purple : 'transparent',
                  color: active ? '#fff' : C.gray500,
                  fontSize: '13.5px', fontWeight: active ? '600' : '400',
                  transition: 'all 0.18s',
                  whiteSpace: 'nowrap',
                  boxShadow: active ? `0 2px 8px ${C.purpleShadow}` : 'none',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = C.gray50; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Icon style={{ fontSize: '18px', flexShrink: 0 }} />
                {open && label}
              </button>
            );
          })}
        </nav>

      </aside>

      {/* ════ MAIN ═══════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ─── HEADER ─────────────────────────────────────────── */}
        <header style={{
          height: '64px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px 0 12px',
          backgroundColor: C.headerBg,
        }}>
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            {/* Collapse btn — admin bilan bir xil */}
            <button onClick={() => setOpen(v => !v)} style={hdrBtn}>
              {open
                ? <ChevronLeftOutlinedIcon style={{ fontSize: '18px', transform: 'scale(0.85)' }} />
                : <ChevronRightOutlinedIcon style={{ fontSize: '18px', transform: 'scale(0.85)' }} />}
            </button>

            {/* Search */}
            <div style={{ position: 'relative', maxWidth: '260px', width: '100%' }}>
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
            {/* Language */}
            <div style={{ ...hdrBtn, padding: '0 12px', fontSize: '12px', fontWeight: '500', color: C.gray500, width: 'auto', borderRadius: '12px' }}>
              O&apos;zbekcha
            </div>

            {/* Bell */}
            <button style={hdrBtn}>
              <NotificationsNoneIcon style={{ fontSize: '20px' }} />
            </button>

            {/* Dark mode */}
            <button style={hdrBtn}>
              <DarkModeOutlinedIcon style={{ fontSize: '20px' }} />
            </button>

            {/* Avatar */}
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              backgroundColor: C.purple, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: '700', fontSize: '14px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            }}>
              {initial}
            </div>

            {/* Logout — admin bilan bir xil: oq fon, qizil icon */}
            <button
              onClick={handleLogout}
              title="Chiqish"
              style={{
                ...hdrBtn,
                color: '#f87171',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#f87171'; }}
            >
              <LogoutOutlinedIcon style={{ fontSize: '18px' }} />
            </button>
          </div>
        </header>

        {/* ─── CONTENT ────────────────────────────────────────── */}
        <main style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          {renderContent()}
        </main>
      </div>


      {/* ════ TEACHER MODAL ══════════════════════════════════════ */}
      {teacherModal && (
        <div
          onClick={() => setTeacherModal(null)}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.18s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '620px',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              animation: 'slideUp 0.22s ease',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setTeacherModal(null)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                width: '32px', height: '32px',
                border: 'none', borderRadius: '8px',
                backgroundColor: '#f3f4f6', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', color: '#6b7280',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            >✕</button>

            {/* Group title */}
            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
              {teacherModal.group.groupName}
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
              {teacherModal.group.status === 'finished' ? 'Tugagan' : 'Faol'}
            </p>

            {/* Teachers table */}
            {teacherLoad ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Yuklanmoqda...</div>
            ) : teacherModal.teachers.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>O&apos;qituvchilar topilmadi</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    {["O'qituvchi", 'Roli', 'Dars kunlari', 'Dars vaqti'].map(h => (
                      <th key={h} style={{
                        padding: '10px 12px', textAlign: 'left',
                        fontSize: '13px', fontWeight: '600', color: '#374151',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teacherModal.teachers.map((t, i, arr) => {
                    const g = teacherModal.group;
                    const fullName = t.full_name || t.name || t.fullName || "Noma'lum";
                    const role = t.role || 'TEACHER';

                    // ── Smart field finder ───────────────────────────────────────
                    const findDays = (obj) => {
                      if (!obj || typeof obj !== 'object') return null;
                      // Faqat aniq mos keluvchi keylar: days, lessonDays, weekDays, scheduleDays...
                      const dayKeys = ['days', 'lessondays', 'weekdays', 'scheduledays', 'daysofweek', 'week_days', 'lesson_days'];
                      for (const key of Object.keys(obj)) {
                        if (dayKeys.includes(key.toLowerCase()) && obj[key] != null) {
                          const v = obj[key];
                          if ((Array.isArray(v) && v.length > 0) || (typeof v === 'string' && v)) return v;
                        }
                      }
                      // Nested ob'ektlar (schedule, lessonSchedule ...)
                      const nestedKeys = ['schedule', 'lessonschedule', 'groupschedule', 'timetable'];
                      for (const key of Object.keys(obj)) {
                        const lk = key.toLowerCase();
                        if (nestedKeys.includes(lk) && obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                          const f = findDays(obj[key]);
                          if (f != null) return f;
                        }
                        // schedules[] massivi
                        if ((lk === 'schedules' || lk === 'timetables') && Array.isArray(obj[key]) && obj[key].length > 0) {
                          const f = findDays(obj[key][0]);
                          if (f != null) return f;
                        }
                      }
                      return null;
                    };

                    const findTime = (obj, type) => {
                      if (!obj || typeof obj !== 'object') return null;
                      // 'full' type: "16:00 - 18:00" formatidagi string field
                      if (type === 'full') {
                        const tkeys = ['time', 'lessontime', 'lesson_time', 'classtime', 'class_time'];
                        for (const key of Object.keys(obj)) {
                          if (tkeys.includes(key.toLowerCase()) && typeof obj[key] === 'string' && obj[key].includes(':')) return obj[key];
                        }
                        // nested
                        const nkeys = ['schedule', 'lessonschedule', 'groupschedule'];
                        for (const key of Object.keys(obj)) {
                          if (nkeys.includes(key.toLowerCase()) && obj[key] && typeof obj[key] === 'object') {
                            const f = findTime(obj[key], 'full');
                            if (f) return f;
                          }
                          if ((key.toLowerCase() === 'schedules') && Array.isArray(obj[key]) && obj[key].length > 0) {
                            const f = findTime(obj[key][0], 'full');
                            if (f) return f;
                          }
                        }
                        return null;
                      }
                      const kwords = type === 'start'
                        ? ['starttime', 'start_time', 'lessonstart', 'lessonsstarttime', 'fromtime', 'begintime', 'startsat', 'classstart']
                        : ['endtime', 'end_time', 'lessonend', 'lessonsendtime', 'totime', 'finishtime', 'endsat', 'classend'];
                      for (const key of Object.keys(obj)) {
                        if (kwords.includes(key.toLowerCase()) && obj[key] != null && obj[key] !== '') return obj[key];
                      }
                      // Nested
                      const nkeys2 = ['schedule', 'lessonschedule', 'groupschedule'];
                      for (const key of Object.keys(obj)) {
                        const lk = key.toLowerCase();
                        if (nkeys2.includes(lk) && obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                          const f = findTime(obj[key], type);
                          if (f != null) return f;
                        }
                        if ((lk === 'schedules') && Array.isArray(obj[key]) && obj[key].length > 0) {
                          const f = findTime(obj[key][0], type);
                          if (f != null) return f;
                        }
                      }
                      return null;
                    };

                    // ── Dars kunlari ─────────────────────────────────────────────
                    const rawDays = findDays(t) ?? findDays(g) ?? [];
                    const DAY_MAP = {
                      0:'Ya', 1:'Du', 2:'Se', 3:'Cho', 4:'Pa', 5:'Ju', 6:'Sha',
                      monday:'Du', tuesday:'Se', wednesday:'Cho', thursday:'Pa',
                      friday:'Ju', saturday:'Sha', sunday:'Ya',
                      MONDAY:'Du', TUESDAY:'Se', WEDNESDAY:'Cho', THURSDAY:'Pa',
                      FRIDAY:'Ju', SATURDAY:'Sha', SUNDAY:'Ya',
                      du:'Du', se:'Se', cho:'Cho', pa:'Pa', ju:'Ju', sha:'Sha', ya:'Ya',
                    };
                    let daysStr = '-';
                    if (Array.isArray(rawDays) && rawDays.length > 0) {
                      daysStr = rawDays.map(d => DAY_MAP[d] ?? d).join(', ');
                    } else if (typeof rawDays === 'string' && rawDays) {
                      daysStr = rawDays;
                    }

                    // ── Dars vaqti ───────────────────────────────────────────────
                    // Avval bir vaqtlik string qidiradi ("16:00 - 18:00")
                    const fullTimeStr = findTime(t, 'full') ?? findTime(g, 'full');
                    let timeStr = '-';
                    if (fullTimeStr && typeof fullTimeStr === 'string' && fullTimeStr.includes('-')) {
                      timeStr = fullTimeStr;
                    } else {
                      const st = findTime(t, 'start') ?? findTime(g, 'start') ?? '';
                      const et = findTime(t, 'end')   ?? findTime(g, 'end')   ?? '';
                      if (st && et) timeStr = `${st} - ${et}`;
                      else if (st || et) timeStr = st || et;
                    }

                    return (
                      <tr
                        key={t.id || t.userId || i}
                        style={{ borderBottom: i < arr.length - 1 ? '1px solid #e5e7eb' : 'none', transition: 'background 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                      >
                        <td style={{ padding: '13px 16px', fontSize: '14px', color: '#111827', fontWeight: '500' }}>{fullName}</td>
                        <td style={{ padding: '13px 16px', fontSize: '13px', color: '#6b7280' }}>{role}</td>
                        <td style={{ padding: '13px 16px', fontSize: '13px', color: '#374151' }}>{daysStr}</td>
                        <td style={{ padding: '13px 16px', fontSize: '13px', color: '#374151' }}>{timeStr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ════ VIDEO MODAL ══════════════════════════════════════ */}
      {videoModal && (
        <div
          onClick={() => setVideoModal(null)}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.18s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '620px',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              animation: 'slideUp 0.22s ease',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setVideoModal(null)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                width: '32px', height: '32px',
                border: 'none', borderRadius: '8px',
                backgroundColor: '#f3f4f6', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', color: '#6b7280',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            >✕</button>

            {/* Title */}
            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
              {videoModal.lesson.topic || 'Dars videolari'}
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
              Mavjud videolar ro'yxati
            </p>

            {/* Videos List */}
            {videoModalLoad ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Yuklanmoqda...</div>
            ) : videoModal.videos.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Videolar topilmadi</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                {videoModal.videos.map((v, i) => {
                  const title = v.originalname || v.title || v.name || v.filename || 'Video';
                  const size = v.size_mb ? `${v.size_mb} MB` : (v.size ? (v.size > 1048576 ? (v.size / 1048576).toFixed(2) + ' MB' : (v.size / 1024).toFixed(0) + ' KB') : '');
                  return (
                    <div
                      key={v.id || i}
                      onClick={() => setPlayingVideo(v)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px', borderRadius: '12px', border: `1.5px solid ${C.border}`,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = C.purple;
                        e.currentTarget.style.backgroundColor = C.purpleLight;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.backgroundColor = '#fff';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          backgroundColor: C.purple, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '14px',
                        }}>
                          ▶
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: C.gray700 }}>{title}</span>
                          {size && <span style={{ fontSize: '11px', color: C.gray400 }}>{size}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', color: C.purple, fontWeight: '600' }}>Tomosha qilish</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ VIDEO PLAYER MODAL ══════════════════════════════════ */}
      {playingVideo && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.18s ease',
          }}
        >
          <div
            style={{
              position: 'relative',
              backgroundColor: '#000',
              borderRadius: '16px',
              overflow: 'hidden',
              width: '100%',
              maxWidth: '800px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              zIndex: 1,
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 24px', backgroundColor: 'rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}>
              <span style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>
                {playingVideo.originalname || playingVideo.title || playingVideo.name || playingVideo.filename || 'Video player'}
              </span>
              <button
                onClick={() => setPlayingVideo(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#fff', fontSize: '24px', lineHeight: 1,
                  opacity: 0.8, transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
              >✕</button>
            </div>

            {/* Video element */}
            {(function() {
              // .url allaqachon getFileUrl orqali normalize qilingan
              const videoUrl = playingVideo.url || getFileUrl(playingVideo.video_url || playingVideo.file_url || playingVideo.path || '');
              if (videoUrl) {
                return (
                  <video
                    key={videoUrl}
                    src={videoUrl}
                    controls
                    autoPlay
                    style={{ width: '100%', display: 'block', maxHeight: '70vh' }}
                  />
                );
              }
              return (
                <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  Video URL topilmadi.
                </div>
              );
            })()}
          </div>
        </div>
      )}


      {/* CSS animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

/* ── shared micro-styles ─────────────────────────────────────── */
const hdrBtn = {
  width: '40px', height: '40px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '12px', border: 'none', cursor: 'pointer',
  backgroundColor: '#fff', color: '#6b7280',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  transition: 'all 0.18s', flexShrink: 0,
};

const td = {
  padding: '13px 16px', fontSize: '13.5px', color: '#374151',
};

/* row for lessons table */
const ltd = {
  padding: '18px 16px', fontSize: '13px', color: '#374151',
};

const statusBadge = {
  display: 'inline-block',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: '600',
  whiteSpace: 'nowrap',
};

export default StudentDashboard;
