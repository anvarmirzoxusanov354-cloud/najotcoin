import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  KeyboardArrowLeftOutlined, BarChartOutlined, CloseOutlined,
  MoreVertOutlined, PersonOutlined, AccessTimeOutlined,
  CheckCircleOutlined, AddOutlined,
} from '@mui/icons-material';

const BASE = 'https://najot-edu.softwareengineer.uz/api/v1';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(str) {
  if (!str) return '';
  try {
    var d = new Date(str);
    if (isNaN(d)) return str;
    return String(d.getDate()).padStart(2,'0') + ' ' + MONTH_NAMES[d.getMonth()] + ', ' + d.getFullYear();
  } catch(e) { return str; }
}

function fmtDateTime(str) {
  if (!str) return '';
  try {
    var d = new Date(str);
    if (isNaN(d)) return str;
    return fmtDate(str) + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  } catch(e) { return str; }
}

function generateLessonDates(group) {
  if (!group) return [];

  // start_date: faqat real start_date ishlatamiz, created_at ga fallback qilmaymiz
  var startDateStr = group.start_date || group.startDate || null;
  if (!startDateStr) return [];

  var weekDayMap = { MONDAY:1, TUESDAY:2, WEDNESDAY:3, THURSDAY:4, FRIDAY:5, SATURDAY:6, SUNDAY:0 };
  var rawDays = group.week_day || group.week_days || group.weekDay || group.weekdays || group.days || null;
  var weekDays = [];

  if (rawDays) {
    // Array yoki string bo'lishi mumkin: ["MONDAY"] yoki "MONDAY,WEDNESDAY" yoki "MONDAY WEDNESDAY"
    var arr = Array.isArray(rawDays) ? rawDays : String(rawDays).replace(/\s+/g, ',').split(',');
    arr.forEach(function(d) {
      var t = String(d).trim().toUpperCase();
      if (weekDayMap[t] !== undefined) weekDays.push(weekDayMap[t]);
    });
  }

  // Hafta kunlari topilmasa — sanalar ko'rsatmaymiz (noto'g'ri default qo'ymaymiz)
  if (weekDays.length === 0) return [];

  var duration = group.duration_month || group.duration || 6;
  var startDate = new Date(startDateStr);
  if (isNaN(startDate)) return [];

  var endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + Number(duration));

  var today = new Date(); today.setHours(23,59,59,999);
  var dates = [], cur = new Date(startDate);

  while (cur <= endDate) {
    if (weekDays.indexOf(cur.getDay()) !== -1) {
      dates.push({ date: new Date(cur), passed: cur <= today });
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function groupByLearningMonth(dates, startDate) {
  if (!dates || !dates.length) return [];
  var start = new Date(startDate);
  var groups = [];
  dates.forEach(function(item) {
    var diffDays = Math.floor((item.date - start) / (1000*60*60*24));
    var monthIdx = Math.floor(diffDays / 30);
    if (!groups[monthIdx]) groups[monthIdx] = { monthNum: monthIdx + 1, dates: [] };
    groups[monthIdx].dates.push(item);
  });
  return groups.filter(Boolean);
}

function ScheduleTable({ schedules, teacherName, group, students }) {
  var [showAll, setShowAll] = useState(false);
  var [selectedDate, setSelectedDate] = useState(null);
  var [attendanceData, setAttendanceData] = useState({});
  var [topic, setTopic] = useState('');
  var [desc, setDesc] = useState('');
  var [saving, setSaving] = useState(false);
  var [saveMsg, setSaveMsg] = useState('');
  var [lessonStatus, setLessonStatus] = useState("Dars o'tilgan");
  var allDates = generateLessonDates(group);
  var startDateStr = group && (group.start_date || group.startDate);
  var monthGroups = startDateStr ? groupByLearningMonth(allDates, startDateStr) : [];
  var today = new Date();
  var currentMonthGroupIdx = -1;
  monthGroups.forEach(function(mg, idx) {
    if (mg.dates.some(function(d) { return d.date.getMonth() === today.getMonth() && d.date.getFullYear() === today.getFullYear(); })) {
      currentMonthGroupIdx = idx;
    }
  });
  var visibleGroups = showAll ? monthGroups : (monthGroups.length > 0 ? [monthGroups[0]] : []);
  var rows = [];
  if (schedules && schedules.length > 0) {
    rows = schedules;
  } else if (teacherName && teacherName !== "Noma'lum") {
    var roomName = group && group.room ? (typeof group.room === 'object' ? (group.room.name || '') : group.room) : '';
    rows = [{
      _synthetic: true,
      teacher_name: teacherName,
      days: group && (group.week_days || group.days) ? (Array.isArray(group.week_days || group.days) ? (group.week_days || group.days).join(', ') : (group.week_days || group.days)) : 'Du/Se/Ch/Pa/Ju',
      start_time: group && group.start_time ? group.start_time : '09:30',
      end_time: group && group.end_time ? group.end_time : '12:30',
      start_date: startDateStr ? fmtDate(startDateStr) : '',
      end_date: '',
      room_name: roomName,
    }];
  }

  function handleDateClick(dateStr) {
    if (selectedDate === dateStr) { setSelectedDate(null); return; }
    setSelectedDate(dateStr);
    setSaveMsg(''); setTopic(''); setDesc('');
    setLessonStatus("Dars o'tilgan");
    var init = {};
    (students || []).forEach(function(s) { init[s.id] = false; });
    setAttendanceData(init);
  }

  function fmtDisplayDate(ds) {
    if (!ds) return '';
    try {
      var d = new Date(ds + 'T00:00:00');
      var months = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
      return d.getFullYear() + ' ' + months[d.getMonth()] + ' ' + String(d.getDate()).padStart(2,'0');
    } catch(e) { return ds; }
  }

  async function handleSave() {
    setSaving(true); setSaveMsg('');
    var token = localStorage.getItem('accessToken');
    var h = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
    var gid = group && group.id;
    try {
      // POST /api/v1/groups/{groupId}/lesson
      await fetch(BASE + '/groups/' + gid + '/lesson', {
        method: 'POST', headers: h,
        body: JSON.stringify({ group_id: Number(gid), topic: topic.trim() || 'Dars', description: desc.trim() || topic.trim() || 'Dars' }),
      });
      // POST /api/v1/attendance for each student
      await Promise.allSettled(
        (students || []).map(function(s) {
          return fetch(BASE + '/attendance', {
            method: 'POST', headers: h,
            body: JSON.stringify({ group_id: Number(gid), student_id: s.id, isPresent: attendanceData[s.id] === true }),
          });
        })
      );
      setSaveMsg("Saqlandi!");
    } catch(e) {
      setSaveMsg("Xatolik!");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', padding:24 }}>
      <h2 style={{ fontSize:16, fontWeight:700, color:'#1a1a2e', marginBottom:16, marginTop:0 }}>Dars jadvali</h2>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, marginBottom:16 }}>
        <tbody>
          {rows.length > 0 ? rows.map(function(s, i) {
            return (
              <tr key={i} style={{ borderBottom:'1px solid #f1f5f9' }}
                onMouseEnter={function(e){ e.currentTarget.style.background='#f9fafb'; }}
                onMouseLeave={function(e){ e.currentTarget.style.background='transparent'; }}>
                <td style={{ padding:'14px 12px 14px 0', minWidth:160 }}><span style={{ color:'#3b7cf7', fontWeight:600 }}>{s.teacher_name || s.teacher || teacherName}</span></td>
                <td style={{ padding:'14px 12px', color:'#4b5563', fontWeight:500, minWidth:120 }}>{s.days || s.week_days || 'Du/Se/Ch/Pa/Ju'}</td>
                <td style={{ padding:'14px 12px', color:'#4b5563', fontWeight:500, minWidth:160 }}>{(s.start_time || '09:30') + ' dan - ' + (s.end_time || '12:30') + ' gacha'}</td>
                <td style={{ padding:'14px 12px', color:'#4b5563', fontWeight:500, minWidth:200 }}>
                  {s.start_date && s.end_date ? (s._synthetic ? s.start_date : fmtDate(s.start_date)) + ' - ' + (s._synthetic ? s.end_date : fmtDate(s.end_date)) : (s.start_date ? (s._synthetic ? s.start_date : fmtDate(s.start_date)) : '')}
                </td>
                <td style={{ padding:'14px 0 14px 12px', color:'#4b5563', fontWeight:500, textAlign:'right' }}>{s.room_name || s.room || ''}</td>
              </tr>
            );
          }) : (
            <tr><td colSpan={5} style={{ padding:'24px 0', color:'#9ca3af', textAlign:'center' }}>Dars jadvali hali qo'shilmagan</td></tr>
          )}
        </tbody>
      </table>
      {visibleGroups.length > 0 && visibleGroups.map(function(mg, gIdx) {
        var isCur = (mg.monthNum - 1) === currentMonthGroupIdx;
        return (
          <div key={gIdx} style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <span style={{ fontSize:15, fontWeight:700, color:'#1a1a2e' }}>{mg.monthNum}-o'quv oyi</span>
              {isCur && <span style={{ fontSize:11, fontWeight:600, padding:'2px 10px', borderRadius:20, background:'#dcfce7', color:'#16a34a', border:'1px solid #bbf7d0' }}>Joriy oy</span>}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
              {mg.dates.map(function(item, dIdx) {
                var d = item.date;
                var isToday = d.toDateString() === new Date().toDateString();
                var isFuture = !item.passed;
                var ds = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
                var canClick = item.passed;
                var isSelected = selectedDate === ds;
                return (
                  <div key={dIdx}
                    onClick={canClick ? function(){ handleDateClick(ds); } : undefined}
                    style={{
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                      width:52, height:58, borderRadius:10, fontSize:11.5, fontWeight:700, userSelect:'none',
                      cursor: canClick ? 'pointer' : 'default',
                      border: isSelected ? '2px solid #7c4dff' : (isToday ? '2px solid #7c4dff' : (item.passed ? '1px solid #cbd5e1' : '1px solid #e5e7eb')),
                      background: isSelected ? '#7c4dff' : (isToday ? '#7c4dff' : (item.passed ? '#e2e8f0' : 'white')),
                      color: (isSelected || isToday) ? 'white' : (item.passed ? '#475569' : '#9ca3af'),
                      opacity: isFuture ? 0.5 : 1,
                      transition: 'all 0.15s',
                    }}>
                    <span style={{ fontSize:10.5, marginBottom:2 }}>{MONTH_NAMES[d.getMonth()]}</span>
                    <span style={{ fontSize:14 }}>{d.getDate()}</span>
                  </div>
                );
              })}
            </div>

            {/* Inline davomat paneli */}
            {selectedDate && mg.dates.some(function(item) {
              var d = item.date;
              var ds = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
              return ds === selectedDate;
            }) && (
              <div style={{ border:'1.5px solid #e5e7eb', borderRadius:12, overflow:'hidden', background:'white', marginTop:8 }}>
                {/* Teacher + sana + holat */}
                <div style={{ padding:'14px 20px', borderBottom:'1px solid #f1f1f5', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:38, height:38, borderRadius:'50%', background:'#ede9ff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:'#7c4dff', flexShrink:0 }}>
                      {teacherName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize:13.5, fontWeight:700, color:'#1a1a2e' }}>{teacherName}</div>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>Teacher</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
                    <div>
                      <div style={{ fontSize:10, color:'#9ca3af', fontWeight:500, marginBottom:2 }}>DARS KUNI</div>
                      <div style={{ fontSize:12.5, fontWeight:700, color:'#1a1a2e' }}>{fmtDisplayDate(selectedDate)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:10, color:'#9ca3af', fontWeight:500, marginBottom:2 }}>HOLAT</div>
                      <button onClick={function(){ setLessonStatus(function(p){ return p === "Dars o'tilgan" ? "Dars bo'lmagan" : "Dars o'tilgan"; }); }}
                        style={{ fontSize:12.5, fontWeight:700, cursor:'pointer', color: lessonStatus === "Dars o'tilgan" ? '#16a34a' : '#ef4444', background:'none', border:'none', padding:0 }}>
                        {lessonStatus}
                      </button>
                    </div>
                    <button onClick={function(){ setSelectedDate(null); setSaveMsg(''); }}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18 }}>×</button>
                  </div>
                </div>

                {/* Mavzu va tavsif */}
                <div style={{ padding:'14px 20px', borderBottom:'1px solid #f1f1f5' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1a1a2e', marginBottom:10 }}>Yo'qlama va mavzu kiritish</div>
                  <div style={{ display:'flex', gap:16, marginBottom:10 }}>
                    {[{v:'plan',l:"O'quv reja bo'yicha"},{v:'other',l:'Boshqa'}].map(function(o){
                      return (
                        <label key={o.v} style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontSize:12.5 }}>
                          <input type="radio" checked={o.v==='other'} readOnly style={{ accentColor:'#7c4dff', width:13, height:13 }} />
                          <span style={{ color: o.v==='other' ? '#7c4dff' : '#6b7280', fontWeight: o.v==='other' ? 600 : 400 }}>{o.l}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div style={{ marginBottom:8 }}>
                    <div style={{ fontSize:11.5, fontWeight:600, color:'#ef4444', marginBottom:4 }}>* Mavzu</div>
                    <input type="text" placeholder="Mavzuni kiriting..." value={topic} onChange={function(e){ setTopic(e.target.value); }}
                      style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:12.5, outline:'none', boxSizing:'border-box' }} />
                  </div>
                  <div>
                    <div style={{ fontSize:11.5, fontWeight:600, color:'#6b7280', marginBottom:4 }}>Tavsif (ixtiyoriy)</div>
                    <textarea placeholder="Dars haqida qo'shimcha ma'lumot..." value={desc} onChange={function(e){ setDesc(e.target.value); }}
                      rows={3} style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:12.5, outline:'none', resize:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
                  </div>
                </div>

                {/* Talabalar jadval */}
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f9fafb', borderBottom:'1px solid #f1f1f5' }}>
                      <th style={{ padding:'10px 20px', textAlign:'left', fontWeight:600, color:'#9ca3af', fontSize:11.5, width:40 }}>#</th>
                      <th style={{ padding:'10px 16px', textAlign:'left', fontWeight:600, color:'#7c4dff', fontSize:11.5 }}>O'quvchi ismi</th>
                      <th style={{ padding:'10px 20px', textAlign:'right', fontWeight:600, color:'#374151', fontSize:11.5 }}>Keldi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!students || students.length === 0 ? (
                      <tr><td colSpan={3} style={{ padding:'20px', textAlign:'center', color:'#9ca3af', fontSize:12.5 }}>Talabalar yo'q</td></tr>
                    ) : students.map(function(s, idx) {
                      var name = s.full_name || ((s.first_name||'') + ' ' + (s.last_name||'')).trim() || s.name || "Noma'lum";
                      var isPresent = attendanceData[s.id] === true;
                      return (
                        <tr key={s.id || idx} style={{ borderBottom:'1px solid #f5f5f7', background:'white' }}
                          onMouseEnter={function(e){ e.currentTarget.style.background='#fafafa'; }}
                          onMouseLeave={function(e){ e.currentTarget.style.background='white'; }}>
                          <td style={{ padding:'11px 20px', color:'#9ca3af', fontWeight:500 }}>{idx+1}</td>
                          <td style={{ padding:'11px 16px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{ width:30, height:30, borderRadius:'50%', background:'#ede9ff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, color:'#7c4dff', flexShrink:0 }}>
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontWeight:600, color:'#1a1a2e', fontSize:13 }}>{name}</span>
                            </div>
                          </td>
                          <td style={{ padding:'11px 20px', textAlign:'right' }}>
                            <div onClick={function(){ setAttendanceData(function(p){ var n = Object.assign({}, p); n[s.id] = !n[s.id]; return n; }); }}
                              style={{ display:'inline-flex', width:42, height:23, borderRadius:12, cursor:'pointer', background: isPresent ? '#7c4dff' : '#d1d5db', position:'relative', transition:'background 0.2s' }}>
                              <div style={{ position:'absolute', top:2, left: isPresent ? 20 : 2, width:19, height:19, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Footer */}
                <div style={{ padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:12, background:'#f9fafb', borderTop:'1px solid #f1f1f5' }}>
                  {saveMsg && <span style={{ fontSize:12.5, fontWeight:600, color: saveMsg.includes('xato') ? '#ef4444' : '#16a34a' }}>{saveMsg}</span>}
                  <button onClick={function(){ setSelectedDate(null); setSaveMsg(''); }}
                    style={{ padding:'8px 20px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'white', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                    Bekor qilish
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    style={{ padding:'8px 24px', borderRadius:8, border:'none', background: saving ? '#9ca3af' : '#7c4dff', color:'white', fontSize:13, fontWeight:600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                    {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {monthGroups.length > 1 && (
        <div style={{ display:'flex', justifyContent:'center', marginTop:8 }}>
          <button onClick={function(){ setShowAll(function(v){ return !v; }); }}
            style={{ padding:'9px 28px', background:'white', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, fontWeight:600, color:'#4b5563', cursor:'pointer' }}>
            {showAll ? 'Hammasini yopish' : "Barchasini ko'rish"}
          </button>
        </div>
      )}
    </div>
  );
}

var TABS = ["Ma'lumotlar", 'Guruh darsliklari', 'Akademik davomati'];

export default function GroupDetail() {
  var navigate = useNavigate();
  var { id } = useParams();
  var [activeTab, setActiveTab] = useState("Ma'lumotlar");
  var [activeSubTab, setActiveSubTab] = useState('Uyga vazifa');
  var [group, setGroup] = useState(null);
  var [students, setStudents] = useState([]);
  var [homeworks, setHomeworks] = useState([]);
  var [homeworksLoading, setHomeworksLoading] = useState(false);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [attendance, setAttendance] = useState([]);
  var [attendanceLoading, setAttendanceLoading] = useState(false);
  var [videos, setVideos] = useState([]);
  var [videosLoading, setVideosLoading] = useState(false);
  var [videoUploadOpen, setVideoUploadOpen] = useState(false);
  var [exams, setExams] = useState([]);
  var [examsLoading, setExamsLoading] = useState(false);

  useEffect(function() {
    var token = localStorage.getItem('accessToken');
    if (!token) { setError('Token topilmadi'); setLoading(false); return; }
    var headers = { Authorization: 'Bearer ' + token };

    // Group detail — Swagger: GET /api/v1/groups/{groupId}
    Promise.allSettled([
      fetch(BASE + '/groups/' + id, { headers }),
      fetch(BASE + '/groups/one/' + id, { headers }),
    ]).then(function(results) {
      var promises = [];
      var found = null;
      results.forEach(function(r) {
        if (r.status === 'fulfilled' && r.value.ok) {
          promises.push(r.value.json().then(function(d) {
            if (!found && d) {
              found = (d.data && typeof d.data === 'object' && !Array.isArray(d.data)) ? d.data : d;
            }
          }));
        }
      });
      return Promise.all(promises).then(function() { return found; });
    }).then(function(data) {
      if (data) {
        setGroup(data);
        // teachers bo'sh bo'lsa — GET /api/v1/teachers dan qidiramiz
        if (!data.teachers || data.teachers.length === 0) {
          fetch(BASE + '/teachers', { headers })
            .then(function(r) { return r.ok ? r.json() : null; })
            .then(function(tData) {
              if (!tData) return;
              var list = Array.isArray(tData) ? tData : (tData.data || tData.teachers || []);
              var matched = list.filter(function(t) {
                if (!t.groups) return false;
                return t.groups.some(function(g) {
                  return String(typeof g === 'object' ? g.id : g) === String(id);
                });
              });
              if (matched.length > 0) {
                setGroup(function(prev) { return prev ? Object.assign({}, prev, { teachers: matched }) : prev; });
              }
            }).catch(function() {});
        }
      } else {
        setError('Guruh topilmadi');
      }
      setLoading(false);
    }).catch(function(e) { setError('Xatolik: ' + e.message); setLoading(false); });

    // Students
    fetch(BASE + '/groups/one/students/' + id, { headers })
      .then(function(r) { return r.ok ? r.json() : []; })
      .then(function(data) {
        if (Array.isArray(data)) setStudents(data);
        else if (data && data.students) setStudents(data.students);
      }).catch(function() {});

    // Schedules
    fetch(BASE + '/groups/' + id + '/schedules', { headers })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (!data) return;
        var list = Array.isArray(data) ? data : (data.data || data.schedules || []);
        if (list.length > 0) setGroup(function(p) { return p ? { ...p, schedules: list } : p; });
      }).catch(function() {});

    // Homeworks
    setHomeworksLoading(true);
    fetch(BASE + '/homework/' + id, { headers })
      .then(function(r) { return r.ok ? r.json() : []; })
      .then(function(data) {
        setHomeworks(Array.isArray(data) ? data : (data.data || data.homeworks || []));
        setHomeworksLoading(false);
      }).catch(function() { setHomeworksLoading(false); });

    // Attendance — Swagger: GET /api/v1/attendance/all
    setAttendanceLoading(true);
    fetch(BASE + '/attendance/all', { headers })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (data) {
          var all = Array.isArray(data) ? data : (data.data || data.attendance || data.items || []);
          var filtered = all.filter(function(a) {
            return String(a.group_id) === String(id) || (a.group && String(a.group.id) === String(id));
          });
          setAttendance(filtered.length > 0 ? filtered : []);
        }
        setAttendanceLoading(false);
      }).catch(function() { setAttendanceLoading(false); });

    // Files (Videolar) — Swagger: GET /api/v1/files/{groupId}
    setVideosLoading(true);
    fetch(BASE + '/files/' + id, { headers })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (data) setVideos(Array.isArray(data) ? data : (data.data || data.files || data.items || []));
        setVideosLoading(false);
      }).catch(function() { setVideosLoading(false); });

    // Exams — Homework dan olinadi (exam endpoint yo'q)
    // Homeworks already fetched above, use them for exams tab too
    setExams([]);
    setExamsLoading(false);

  }, [id]);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:300 }}>
      <p style={{ color:'#6b7280', fontSize:14 }}>Yuklanmoqda...</p>
    </div>
  );

  if (error || !group) return (
    <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', minHeight:300, gap:12 }}>
      <p style={{ color:'#ef4444', fontSize:14 }}>{error || 'Guruh topilmadi'}</p>
      <button onClick={function() { navigate('/classes'); }}
        style={{ padding:'8px 16px', background:'#7c4dff', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:13 }}>
        Orqaga qaytish
      </button>
    </div>
  );

  var groupName = group.name || group.group_name || 'Guruh';
  var isActive = group.is_active !== false;
  var teacherName = "Noma'lum";
  if (group.teachers && group.teachers.length > 0) {
    teacherName = group.teachers[0].full_name || group.teachers[0].name || "Noma'lum";
  }
  var courseName = '-';
  if (group.course && typeof group.course === 'object') courseName = group.course.name || '-';
  else if (group.course_name) courseName = group.course_name;
  else if (typeof group.course === 'string') courseName = group.course;
  var maxStudents = group.max_student || group.max_students || 20;
  var currentStudents = students.length || (group.students ? group.students.length : 0);
  var totalLessons = group.total_lessons || 20;
  var duration = group.duration || group.duration_month || 6;
  var schedules = group.schedules || [];

  var paramsList = [
    { label: 'Kurs:', value: String(courseName) },
    { label: "O'rta yosh:", value: String(group.average_age || 21) },
    { label: "O'quvchilar sig'imi:", value: String(maxStudents) },
    { label: "Mavjud o'quvchilar:", value: String(currentStudents) },
    { label: "O'quv oyidagi darslar soni:", value: String(totalLessons) },
    { label: 'Kurs davomiyligi (oy):', value: String(duration) },
    { label: 'Jami darslar soni:', value: String(totalLessons) },
  ];

  return (
    <div style={{ minHeight:'100%', background:'#f1f5f9' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={function(){ navigate('/classes'); }}
            style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:'none', background:'transparent', cursor:'pointer', color:'#1a1a2e' }}>
            <KeyboardArrowLeftOutlined style={{ fontSize:22 }} />
          </button>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1a1a2e' }}>{groupName}</h1>
          <span style={{ padding:'3px 10px', borderRadius:6, background: isActive ? '#dcfce7' : '#fee2e2', color: isActive ? '#16a34a' : '#ef4444', fontSize:12, fontWeight:700 }}>
            {isActive ? 'Aktiv' : 'Arxiv'}
          </span>
        </div>
        <button style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', background:'white', border:'1px solid #e5e7eb', borderRadius:10, fontSize:13, fontWeight:600, color:'#374151', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <BarChartOutlined style={{ fontSize:18, color:'#6b7280' }} />
          Statistika
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid #e5e7eb', marginBottom:24 }}>
        {TABS.map(function(tab) {
          var active = activeTab === tab;
          return (
            <button key={tab} onClick={function(){ setActiveTab(tab); }}
              style={{ marginRight:32, paddingBottom:14, background:'transparent', border:'none', borderBottom: active ? '2.5px solid #7c4dff' : '2.5px solid transparent', fontSize:14.5, fontWeight:600, cursor:'pointer', color: active ? '#7c4dff' : '#6b7280', outline:'none' }}>
              {tab}
            </button>
          );
        })}
      </div>

      {/* ── Ma'lumotlar tab ── */}
      {activeTab === "Ma'lumotlar" && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:20, marginBottom:20 }}>
            {/* Guruh mentorlari */}
            <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', overflow:'hidden' }}>
              <div style={{ background:'#3b7cf7', padding:'13px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ color:'white', fontWeight:700, fontSize:14 }}>Guruh mentorlari</span>
                <CloseOutlined style={{ fontSize:17, color:'rgba(255,255,255,0.75)', cursor:'pointer' }} />
              </div>
              <div style={{ padding:24, display:'flex', gap:20, flexWrap:'wrap' }}>
                {group.teachers && group.teachers.length > 0 ? group.teachers.map(function(t, i) {
                  var name = t.full_name || t.name || "O'qituvchi";
                  return (
                    <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                      <div style={{ width:62, height:62, borderRadius:'50%', overflow:'hidden', border:'2px solid #e5e7eb', marginBottom:8 }}>
                        <img src={'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=1a1a2e&color=fff&size=128'} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      </div>
                      <span style={{ color:'#10b981', fontWeight:700, fontSize:12, marginBottom:2 }}>Teacher</span>
                      <span style={{ color:'#1a1a2e', fontWeight:700, fontSize:13.5 }}>{name}</span>
                    </div>
                  );
                }) : (
                  <p style={{ color:'#9ca3af', fontSize:13 }}>O'qituvchi biriktirilmagan</p>
                )}
              </div>
            </div>
            {/* Parametrlar */}
            <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', overflow:'hidden' }}>
              <div style={{ background:'#3b7cf7', padding:'13px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ color:'white', fontWeight:700, fontSize:14 }}>Parametrlar</span>
                <CloseOutlined style={{ fontSize:17, color:'rgba(255,255,255,0.75)', cursor:'pointer' }} />
              </div>
              <div style={{ padding:20 }}>
                {paramsList.map(function(p, i) {
                  return (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', fontSize:13.5, borderBottom: i < paramsList.length-1 ? '1px solid #f3f4f6' : 'none' }}>
                      <span style={{ color:'#6b7280', fontWeight:500 }}>{p.label}</span>
                      <span style={{ color:'#1a1a2e', fontWeight:700 }}>{p.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <ScheduleTable schedules={schedules} teacherName={teacherName} group={group} students={students} />
        </div>
      )}

      {/* ── Guruh darsliklari tab ── */}
      {activeTab === 'Guruh darsliklari' && (
        <div>
          {/* SubTab header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'#1a1a2e' }}>Guruh darsliklari</h2>
              <div style={{ display:'flex', gap:0, background:'#f3f4f6', borderRadius:8, padding:3 }}>
                {['Uyga vazifa','Videolar','Imtihonlar','Jurnal'].map(function(st) {
                  var isAct = activeSubTab === st;
                  return (
                    <button key={st} onClick={function(){ setActiveSubTab(st); }}
                      style={{ padding:'7px 16px', borderRadius:6, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', background: isAct ? '#1a1a2e' : 'transparent', color: isAct ? 'white' : '#6b7280', transition:'all 0.2s' }}>
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
            {activeSubTab === 'Uyga vazifa' && (
              <button onClick={function(){ navigate('/classes/'+id+'/homework/create'); }}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 20px', background:'#16a34a', border:'none', borderRadius:10, fontSize:13, fontWeight:600, color:'white', cursor:'pointer' }}>
                <AddOutlined style={{ fontSize:18 }} /> Qo'shish
              </button>
            )}
            {activeSubTab === 'Videolar' && (
              <button onClick={function(){ setVideoUploadOpen(true); }}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 20px', background:'#16a34a', border:'none', borderRadius:10, fontSize:13, fontWeight:600, color:'white', cursor:'pointer' }}>
                <AddOutlined style={{ fontSize:18 }} /> Qo'shish
              </button>
            )}
            {activeSubTab === 'Imtihonlar' && (
              <button onClick={function(){ navigate('/classes/'+id+'/homework/create'); }}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 20px', background:'#16a34a', border:'none', borderRadius:10, fontSize:13, fontWeight:600, color:'white', cursor:'pointer' }}>
                <AddOutlined style={{ fontSize:18 }} /> Yangi imtihon
              </button>
            )}
          </div>

          {/* ── Uyga vazifa ── */}
          {activeSubTab === 'Uyga vazifa' && (
            <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid #f1f1f5' }}>
                    <th style={{ padding:'14px 20px', textAlign:'left', fontWeight:600, color:'#9ca3af', fontSize:12.5, width:50 }}>#</th>
                    <th style={{ padding:'14px 16px', textAlign:'left', fontWeight:600, color:'#7c4dff', fontSize:12.5 }}>Mavzu</th>
                    <th style={{ padding:'14px 16px', textAlign:'center', width:60 }}><PersonOutlined style={{ fontSize:17, color:'#9ca3af' }} /></th>
                    <th style={{ padding:'14px 16px', textAlign:'center', width:60 }}><AccessTimeOutlined style={{ fontSize:17, color:'#f59e0b' }} /></th>
                    <th style={{ padding:'14px 16px', textAlign:'center', width:60 }}><CheckCircleOutlined style={{ fontSize:17, color:'#16a34a' }} /></th>
                    <th style={{ padding:'14px 16px', textAlign:'left', fontWeight:600, color:'#6b7280', fontSize:12.5 }}>Berilgan vaqt</th>
                    <th style={{ padding:'14px 16px', textAlign:'left', fontWeight:600, color:'#6b7280', fontSize:12.5 }}>Tugash vaqti</th>
                    <th style={{ padding:'14px 16px', textAlign:'left', fontWeight:600, color:'#6b7280', fontSize:12.5 }}>Dars sanasi</th>
                    <th style={{ padding:'14px 16px', width:40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {homeworksLoading ? (
                    <tr><td colSpan={9} style={{ padding:40, textAlign:'center', color:'#9ca3af' }}>Yuklanmoqda...</td></tr>
                  ) : homeworks.length > 0 ? homeworks.map(function(hw, idx) {
                    return (
                      <tr key={hw.id || idx} style={{ borderBottom:'1px solid #f5f5f7' }}
                        onMouseEnter={function(e){ e.currentTarget.style.background='#fafafa'; }}
                        onMouseLeave={function(e){ e.currentTarget.style.background='white'; }}>
                        <td style={{ padding:'16px 20px', color:'#6b7280', fontWeight:500 }}>{idx+1}</td>
                        <td style={{ padding:'16px 16px', color:'#1a1a2e', fontWeight:600 }}>{hw.title||hw.name||hw.topic||'Nomsiz'}</td>
                        <td style={{ padding:'16px 16px', textAlign:'center', color:'#374151', fontWeight:600 }}>{hw.students_count||0}</td>
                        <td style={{ padding:'16px 16px', textAlign:'center', color:'#374151', fontWeight:600 }}>{hw.pending_count||0}</td>
                        <td style={{ padding:'16px 16px', textAlign:'center', color:'#374151', fontWeight:600 }}>{hw.checked_count||0}</td>
                        <td style={{ padding:'16px 16px', color:'#4b5563', fontWeight:500 }}>{fmtDateTime(hw.created_at||hw.createdAt)}</td>
                        <td style={{ padding:'16px 16px', color:'#4b5563', fontWeight:500 }}>{fmtDateTime(hw.deadline||hw.end_date)}</td>
                        <td style={{ padding:'16px 16px', color:'#4b5563', fontWeight:500 }}>{fmtDate(hw.lesson_date||hw.lessonDate||hw.date)}</td>
                        <td style={{ padding:'16px 16px', textAlign:'center' }}><MoreVertOutlined style={{ fontSize:18, color:'#9ca3af', cursor:'pointer' }} /></td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={9} style={{ padding:40, textAlign:'center', color:'#9ca3af', fontSize:13 }}>Hali uyga vazifalar qo'shilmagan</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Videolar ── */}
          {activeSubTab === 'Videolar' && (
            <div>
              {videoUploadOpen && (
                <div style={{ position:'fixed', inset:0, zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
                  <div onClick={function(){ setVideoUploadOpen(false); }} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)' }} />
                  <div style={{ position:'relative', background:'white', borderRadius:16, boxShadow:'0 10px 40px rgba(0,0,0,0.18)', width:'100%', maxWidth:520, overflow:'hidden', zIndex:1 }}>
                    <div style={{ padding:'24px 24px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#1a1a2e' }}>Qo'shish</h2>
                      <button onClick={function(){ setVideoUploadOpen(false); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:22, lineHeight:1 }}>×</button>
                    </div>
                    <div style={{ padding:'0 24px 24px' }}>
                      {/* Lesson topic input */}
                      <div style={{ marginBottom:12 }}>
                        <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Dars mavzusi (majburiy)</label>
                        <input
                          id="video-lesson-topic"
                          type="text"
                          placeholder="Masalan: Node.js, HTML, CSS..."
                          style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box' }}
                          onFocus={function(e){ e.target.style.borderColor='#7c4dff'; }}
                          onBlur={function(e){ e.target.style.borderColor='#e5e7eb'; }}
                        />
                      </div>
                      <label style={{ display:'block', cursor:'pointer' }}>
                        <div style={{ border:'2px dashed #10b981', borderRadius:12, padding:'36px 20px', textAlign:'center', background:'#f0fdf4' }}>
                          <div style={{ width:44, height:44, border:'2px solid #10b981', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:22, color:'#10b981' }}>+</div>
                          <p style={{ margin:'0 0 6px', fontSize:14, fontWeight:600, color:'#1a1a2e' }}>Videofaylni yuklash uchun ushbu hudud ustiga bosing yoki faylni shu yerga olib keling</p>
                          <p style={{ margin:0, fontSize:12, color:'#6b7280' }}>Videofayl .mp4, .webm, .mpeg, .avi, .mkv, .m4v, .ogm, .mov formatlaridan birida bo'lishi kerak</p>
                        </div>
                        <input type="file" accept="video/*,.mp4,.webm,.mpeg,.avi,.mkv,.m4v,.ogm,.mov" style={{ display:'none' }} onChange={function(e) {
                          var file = e.target.files && e.target.files[0]; if (!file) return;
                          var topicInput = document.getElementById('video-lesson-topic');
                          var topic = topicInput ? topicInput.value.trim() : '';
                          if (!topic) { alert("Iltimos, dars mavzusini kiriting!"); return; }
                          var token = localStorage.getItem('accessToken');
                          var headers2 = { Authorization: 'Bearer ' + token };

                          // 1. Lesson yaratish: POST /api/v1/groups/{groupId}/lesson
                          fetch(BASE + '/groups/' + id + '/lesson', {
                            method: 'POST',
                            headers: { ...headers2, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ group_id: Number(id), topic: topic, description: topic }),
                          })
                          .then(function(r) {
                            if (!r.ok) throw new Error('Lesson yaratishda xatolik: ' + r.status);
                            return r.json();
                          })
                          .then(function(lessonData) {
                            // Barcha nested formatlarni tekshiramiz
                            var lessonId = null;
                            if (lessonData) {
                              var str = JSON.stringify(lessonData);
                              var match = str.match(/"id"\s*:\s*(\d+)/);
                              if (match) lessonId = parseInt(match[1]);
                            }
                            if (!lessonId) { alert("Lesson ID topilmadi! Server javobi: " + JSON.stringify(lessonData)); return; }

                            // 2. Fayl yuklash: POST /api/v1/files/group/{grupId}/upload?lessonId=X
                            // Swagger: "grupId" (typo bilan) — shunaqa endpoint
                            var fd = new FormData();
                            fd.append('file', file);
                            return fetch(BASE + '/files/group/' + id + '/upload?lessonId=' + lessonId, {
                              method: 'POST',
                              headers: headers2,
                              body: fd,
                            })
                            .then(function(r) {
                              if (!r.ok) return r.text().then(function(t) { throw new Error('Fayl yuklashda xatolik ' + r.status + ': ' + t); });
                              return r.json();
                            })
                            .then(function(data) {
                              if (data) {
                                var fileObj = data.data || data;
                                setVideos(function(p) { return [fileObj, ...p]; });
                              }
                              // Ro'yxatni qayta yuklaymiz
                              fetch(BASE + '/files/' + id, { headers: headers2 })
                                .then(function(r) { return r.ok ? r.json() : null; })
                                .then(function(d) {
                                  if (d) setVideos(Array.isArray(d) ? d : (d.data || d.files || d.items || []));
                                }).catch(function(){});
                              setVideoUploadOpen(false);
                            });
                          })
                          .catch(function(err) {
                            alert('Xatolik: ' + err.message);
                            setVideoUploadOpen(false);
                          });
                        }} />
                      </label>
                      <div style={{ marginTop:14, textAlign:'right' }}>
                        <button onClick={function(){ setVideoUploadOpen(false); }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>Bekor qilish</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid #f1f1f5' }}>
                      {['#','Video nomi','Dars nomi','Status','Dars sanasi','Hajmi',"Qo'shilgan vaqt",''].map(function(h,i){
                        return <th key={i} style={{ padding:'14px '+(i===0?'20px':'16px'), textAlign:'left', fontWeight:600, color:i===0?'#9ca3af':'#374151', fontSize:12, width:i===0?50:i===7?40:'auto' }}>{h}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {videosLoading ? (
                      <tr><td colSpan={8} style={{ padding:40, textAlign:'center', color:'#9ca3af' }}>Yuklanmoqda...</td></tr>
                    ) : videos.length > 0 ? videos.map(function(v, idx) {
                      var isReady = !v.status || v.status==='ready' || v.status==='completed';
                      var size = v.size ? (v.size>1048576 ? (v.size/1048576).toFixed(2)+' MB' : (v.size/1024).toFixed(0)+' KB') : '—';
                      return (
                        <tr key={v.id||idx} style={{ borderBottom:'1px solid #f5f5f7' }}
                          onMouseEnter={function(e){ e.currentTarget.style.background='#fafafa'; }}
                          onMouseLeave={function(e){ e.currentTarget.style.background='white'; }}>
                          <td style={{ padding:'14px 20px', color:'#9ca3af', fontWeight:500 }}>{idx+1}</td>
                          <td style={{ padding:'14px 16px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{ width:28,height:28,borderRadius:'50%',background:'#ede9ff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                                <span style={{ fontSize:12, color:'#7c4dff' }}>▶</span>
                              </div>
                              <span style={{ color:'#1a1a2e', fontWeight:600 }}>{v.title||v.name||v.filename||v.original_name||'Nomsiz'}</span>
                            </div>
                          </td>
                          <td style={{ padding:'14px 16px', color:'#4b5563', fontWeight:500 }}>{v.lesson?(v.lesson.title||v.lesson.name||v.lesson.topic||''):(v.lesson_name||v.topic||'—')}</td>
                          <td style={{ padding:'14px 16px' }}>
                            <span style={{ padding:'3px 12px',borderRadius:20,fontSize:12,fontWeight:700, background:isReady?'#dcfce7':'#f3f4f6', color:isReady?'#16a34a':'#6b7280' }}>
                              {isReady?'Tayyor':(v.status||'—')}
                            </span>
                          </td>
                          <td style={{ padding:'14px 16px', color:'#4b5563', fontWeight:500 }}>{fmtDate(v.lesson_date||v.date)||'—'}</td>
                          <td style={{ padding:'14px 16px', color:'#4b5563', fontWeight:500 }}>{size}</td>
                          <td style={{ padding:'14px 16px', color:'#4b5563', fontWeight:500 }}>{fmtDate(v.created_at||v.createdAt)||'—'}</td>
                          <td style={{ padding:'14px 16px', textAlign:'center' }}><MoreVertOutlined style={{ fontSize:18,color:'#9ca3af',cursor:'pointer' }} /></td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={8} style={{ padding:48, textAlign:'center', color:'#9ca3af', fontSize:13 }}>Hali videolar qo'shilmagan</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Imtihonlar ── */}
          {activeSubTab === 'Imtihonlar' && (
            <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid #f1f1f5' }}>
                    <th style={{ padding:'14px 20px', textAlign:'left', fontWeight:600, color:'#9ca3af', fontSize:12, width:50 }}>#</th>
                    <th style={{ padding:'14px 16px', textAlign:'left', fontWeight:600, color:'#374151', fontSize:12 }}>Mavzu</th>
                    <th style={{ padding:'14px 16px', textAlign:'center', fontWeight:600, color:'#9ca3af', fontSize:12, width:60 }}><PersonOutlined style={{ fontSize:15 }} /></th>
                    <th style={{ padding:'14px 16px', textAlign:'center', fontWeight:600, color:'#ef4444', fontSize:14, width:60 }}>✕</th>
                    <th style={{ padding:'14px 16px', textAlign:'left', fontWeight:600, color:'#374151', fontSize:12 }}>Status</th>
                    <th style={{ padding:'14px 16px', textAlign:'left', fontWeight:600, color:'#374151', fontSize:12 }}>Dars vaqti</th>
                    <th style={{ padding:'14px 16px', textAlign:'left', fontWeight:600, color:'#374151', fontSize:12 }}>Berilgan vaqt</th>
                    <th style={{ padding:'14px 16px', textAlign:'left', fontWeight:600, color:'#374151', fontSize:12 }}>E'lon qilingan vaqt</th>
                    <th style={{ padding:'14px 16px', width:40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {examsLoading ? (
                    <tr><td colSpan={9} style={{ padding:40, textAlign:'center', color:'#9ca3af' }}>Yuklanmoqda...</td></tr>
                  ) : exams.length > 0 ? exams.map(function(ex, idx) {
                    var rawSt = (ex.status||'active').toLowerCase();
                    var isAct = rawSt==='active'||rawSt==='faol'||rawSt==='published';
                    return (
                      <tr key={ex.id||idx} style={{ borderBottom:'1px solid #f5f5f7', cursor:'pointer' }}
                        onClick={function(){ navigate('/classes/'+id+'/exam/'+ex.id); }}
                        onMouseEnter={function(e){ e.currentTarget.style.background='#fafafa'; }}
                        onMouseLeave={function(e){ e.currentTarget.style.background='white'; }}>
                        <td style={{ padding:'16px 20px', color:'#9ca3af', fontWeight:500 }}>{idx+1}</td>
                        <td style={{ padding:'16px 16px', color:'#3b7cf7', fontWeight:600 }}>{ex.title||ex.name||ex.topic||'Nomsiz'}</td>
                        <td style={{ padding:'16px 16px', textAlign:'center', color:'#374151', fontWeight:600 }}>{ex.students_count||ex.total_students||0}</td>
                        <td style={{ padding:'16px 16px', textAlign:'center', color:'#ef4444', fontWeight:600 }}>{ex.missed_count||ex.not_submitted||0}</td>
                        <td style={{ padding:'16px 16px' }}>
                          <span style={{ padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700, border: isAct?'1.5px solid #16a34a':'1.5px solid #9ca3af', color: isAct?'#16a34a':'#9ca3af', background:'transparent' }}>
                            {isAct?'Faol':rawSt==='draft'?'Qoralama':rawSt}
                          </span>
                        </td>
                        <td style={{ padding:'16px 16px', color:'#4b5563', fontWeight:500 }}>{fmtDateTime(ex.lesson_date||ex.start_date)||'—'}</td>
                        <td style={{ padding:'16px 16px', color:'#4b5563', fontWeight:500 }}>{fmtDateTime(ex.deadline||ex.end_date)||'—'}</td>
                        <td style={{ padding:'16px 16px', color:'#4b5563', fontWeight:500 }}>{fmtDateTime(ex.published_at||ex.created_at||ex.createdAt)||'—'}</td>
                        <td style={{ padding:'16px 16px', textAlign:'center' }}><MoreVertOutlined style={{ fontSize:18,color:'#9ca3af',cursor:'pointer' }} /></td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={9} style={{ padding:48, textAlign:'center', color:'#9ca3af', fontSize:13 }}>Hali imtihonlar qo'shilmagan</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Jurnal ── */}
          {activeSubTab === 'Jurnal' && (
            <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', padding:48, textAlign:'center', color:'#9ca3af', fontSize:13 }}>
              Jurnal ma'lumotlari mavjud emas
            </div>
          )}
        </div>
      )}

      {/* ── Akademik davomati tab ── */}
      {activeTab === 'Akademik davomati' && (
        <div>
          <div style={{ marginBottom:20 }}>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'#1a1a2e' }}>Akademik davomati</h2>
          </div>
          <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', overflow:'hidden' }}>
            {attendanceLoading ? (
              <div style={{ padding:48, textAlign:'center', color:'#9ca3af', fontSize:13 }}>Yuklanmoqda...</div>
            ) : attendance.length > 0 ? (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid #f1f1f5' }}>
                    <th style={{ padding:'13px 20px', textAlign:'left', fontWeight:600, color:'#9ca3af', fontSize:12, width:40 }}>#</th>
                    <th style={{ padding:'13px 16px', textAlign:'left', fontWeight:600, color:'#374151', fontSize:12 }}>Talaba</th>
                    <th style={{ padding:'13px 16px', textAlign:'left', fontWeight:600, color:'#374151', fontSize:12 }}>Sana</th>
                    <th style={{ padding:'13px 16px', textAlign:'center', fontWeight:600, color:'#374151', fontSize:12 }}>Holat</th>
                    <th style={{ padding:'13px 16px', textAlign:'left', fontWeight:600, color:'#374151', fontSize:12 }}>Izoh</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(function(a, idx) {
                    var sName = a.student ? (a.student.full_name||((a.student.first_name||'')+' '+(a.student.last_name||'')).trim()||a.student.name||"Noma'lum") : (a.student_name||a.name||"Noma'lum");
                    var status = a.status || a.is_present;
                    var isPresent = status===true||status==='present'||status==='PRESENT'||status===1;
                    var isAbsent = status===false||status==='absent'||status==='ABSENT'||status===0;
                    return (
                      <tr key={a.id||idx} style={{ borderBottom:'1px solid #f5f5f7' }}
                        onMouseEnter={function(e){ e.currentTarget.style.background='#fafafa'; }}
                        onMouseLeave={function(e){ e.currentTarget.style.background='white'; }}>
                        <td style={{ padding:'14px 20px', color:'#9ca3af', fontWeight:500 }}>{idx+1}</td>
                        <td style={{ padding:'14px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:32,height:32,borderRadius:'50%',background:'#ede9ff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,color:'#7c4dff',flexShrink:0 }}>
                              {sName.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight:600, color:'#1a1a2e' }}>{sName}</span>
                          </div>
                        </td>
                        <td style={{ padding:'14px 16px', color:'#4b5563', fontWeight:500 }}>{fmtDate(a.date||a.lesson_date||a.created_at)}</td>
                        <td style={{ padding:'14px 16px', textAlign:'center' }}>
                          <span style={{ padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:700, background: isPresent?'#dcfce7':isAbsent?'#fee2e2':'#f3f4f6', color: isPresent?'#16a34a':isAbsent?'#ef4444':'#6b7280' }}>
                            {isPresent?'Keldi':isAbsent?'Kelmadi':String(status||'—')}
                          </span>
                        </td>
                        <td style={{ padding:'14px 16px', color:'#9ca3af', fontSize:12.5 }}>{a.comment||a.reason||a.note||'—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ padding:'56px 32px', textAlign:'center' }}>
                <div style={{ width:56,height:56,borderRadius:16,background:'#ede9ff',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
                  <CheckCircleOutlined style={{ fontSize:28, color:'#7c4dff' }} />
                </div>
                <p style={{ margin:'0 0 6px', fontSize:15, fontWeight:700, color:'#1a1a2e' }}>Davomat ma'lumotlari yo'q</p>
                <p style={{ margin:0, fontSize:13, color:'#9ca3af' }}>Hali bu guruh uchun davomat kiritilmagan</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
