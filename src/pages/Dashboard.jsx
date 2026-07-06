import { useState, useEffect } from 'react';
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';

const BASE = 'https://najot-edu.softwareengineer.uz/api/v1';

// --- SVG ikonkalar (rasmga mos) ---

const ActiveStudentsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#EEF2FF"/>
    <path d="M16 8C13.79 8 12 9.79 12 12C12 14.21 13.79 16 16 16C18.21 16 20 14.21 20 12C20 9.79 18.21 8 16 8Z" fill="#6366F1"/>
    <path d="M9 22C9 19.24 12.13 17 16 17C19.87 17 23 19.24 23 22" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M21 13L22.5 14.5L25 11" stroke="#6366F1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GroupsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#EEF2FF"/>
    <circle cx="12" cy="13" r="3" fill="#6366F1"/>
    <circle cx="20" cy="13" r="3" fill="#6366F1"/>
    <path d="M6 22C6 19.79 8.69 18 12 18" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M20 18C23.31 18 26 19.79 26 22" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M12 18C12 18 13.5 17 16 17C18.5 17 20 18 20 18" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const PaymentIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#EEF2FF"/>
    <rect x="7" y="10" width="18" height="13" rx="2" stroke="#6366F1" strokeWidth="1.8"/>
    <path d="M7 14H25" stroke="#6366F1" strokeWidth="1.8"/>
    <rect x="10" y="17" width="5" height="2" rx="1" fill="#6366F1"/>
  </svg>
);

const DebtorsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#FFF7ED"/>
    <path d="M16 8L25 22H7L16 8Z" stroke="#F97316" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
    <path d="M16 15V18" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="16" cy="20.5" r="0.8" fill="#F97316"/>
  </svg>
);

const FrozenIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#EFF6FF"/>
    <path d="M16 8V24M16 8L13 11M16 8L19 11M16 24L13 21M16 24L19 21" stroke="#3B82F6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 16H24M8 16L11 13M8 16L11 19M24 16L21 13M24 16L21 19" stroke="#3B82F6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArchivedIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#EEF2FF"/>
    <rect x="7" y="9" width="18" height="4" rx="1.5" stroke="#6366F1" strokeWidth="1.6"/>
    <path d="M8.5 13V22C8.5 22.83 9.17 23.5 10 23.5H22C22.83 23.5 23.5 22.83 23.5 22V13" stroke="#6366F1" strokeWidth="1.6"/>
    <path d="M13.5 17.5H18.5" stroke="#6366F1" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const StatCard = ({ IconComponent, label, value, loading }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 transition-all hover:shadow-md cursor-default">
    <IconComponent />
    <span className="text-[12px] text-gray-500 font-medium text-center leading-tight">{label}</span>
    {loading ? (
      <div className="w-10 h-8 bg-gray-100 rounded animate-pulse" />
    ) : (
      <p className="text-[28px] font-bold text-gray-800 leading-none">{value}</p>
    )}
  </div>
);

const Dashboard = () => {
  const [counts, setCounts] = useState({
    students: null,
    groups: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${BASE}/students?page=1&limit=1`, { headers })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),

      fetch(`${BASE}/groups/all`, { headers })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ]).then(([studentsData, groupsData]) => {
      let studentsCount = 0;
      if (studentsData) {
        if (typeof studentsData.total === 'number') studentsCount = studentsData.total;
        else if (typeof studentsData.count === 'number') studentsCount = studentsData.count;
        else if (Array.isArray(studentsData)) studentsCount = studentsData.length;
        else if (Array.isArray(studentsData.data)) studentsCount = studentsData.data.length;
        else if (studentsData.data && typeof studentsData.data.total === 'number') studentsCount = studentsData.data.total;
        else if (studentsData.data && Array.isArray(studentsData.data.items)) studentsCount = studentsData.data.items.length;
        else if (studentsData.data && typeof studentsData.data.count === 'number') studentsCount = studentsData.data.count;
      }

      let groupsCount = 0;
      if (groupsData) {
        if (Array.isArray(groupsData)) groupsCount = groupsData.length;
        else if (Array.isArray(groupsData.data)) groupsCount = groupsData.data.length;
        else if (Array.isArray(groupsData.groups)) groupsCount = groupsData.groups.length;
        else if (Array.isArray(groupsData.items)) groupsCount = groupsData.items.length;
        else if (typeof groupsData.total === 'number') groupsCount = groupsData.total;
        else if (groupsData.data && Array.isArray(groupsData.data.items)) groupsCount = groupsData.data.items.length;
      }

      setCounts({ students: studentsCount, groups: groupsCount });
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-5">
      {/* Stat kartalar — 6 ta, rasmga mos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          IconComponent={ActiveStudentsIcon}
          label="Faol talabalar"
          value={counts.students ?? 0}
          loading={loading}
        />
        <StatCard
          IconComponent={GroupsIcon}
          label="Guruhlar"
          value={counts.groups ?? 0}
          loading={loading}
        />
        <StatCard
          IconComponent={PaymentIcon}
          label="Joriy oy to'lovlar"
          value={0}
          loading={false}
        />
        <StatCard
          IconComponent={DebtorsIcon}
          label="Qarzdorlar"
          value={104}
          loading={false}
        />
        <StatCard
          IconComponent={FrozenIcon}
          label="Muzlatiganlar"
          value={0}
          loading={false}
        />
        <StatCard
          IconComponent={ArchivedIcon}
          label="Arxivdagilar"
          value={23}
          loading={false}
        />
      </div>

      {/* Accordion bloklari — rasmga mos 3 ta */}
      <div className="flex flex-col gap-3">
        <Accordion
          sx={{
            borderRadius: '12px !important',
            '&:before': { display: 'none' },
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 3, py: 1 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              Joriy oy uchun to'lovlar
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <Typography sx={{ color: '#9ca3af', fontSize: '13px' }}>
              Ma'lumotlar mavjud emas
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          sx={{
            borderRadius: '12px !important',
            '&:before': { display: 'none' },
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 3, py: 1 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              Yillik Foyda
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <Typography sx={{ color: '#9ca3af', fontSize: '13px' }}>
              Ma'lumotlar mavjud emas
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          sx={{
            borderRadius: '12px !important',
            '&:before': { display: 'none' },
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 3, py: 1 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              Dars jadvali
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <Typography sx={{ color: '#9ca3af', fontSize: '13px' }}>
              Ma'lumotlar mavjud emas
            </Typography>
          </AccordionDetails>
        </Accordion>
      </div>
    </div>
  );
};

export default Dashboard;
