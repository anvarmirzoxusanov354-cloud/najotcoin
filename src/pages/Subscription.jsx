import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowBackOutlined,
  CheckCircleOutlined,
  StarOutlined,
  DiamondOutlined,
  WorkspacePremiumOutlined,
  BoltOutlined,
} from '@mui/icons-material';

const plans = [
  {
    key: 'standart',
    name: 'Standart',
    price: "150,000",
    icon: <StarOutlined className="text-[32px]" />,
    color: '#6b7280',
    bg: '#f9fafb',
    border: '#e5e7eb',
    btnBg: '#6b7280',
    features: [
      '1 ta filial',
      '50 tagacha talaba',
      'Kurslar boshqaruvi',
      'Hodimlar boshqaruvi',
      'Asosiy hisobotlar',
      "Email qo'llab-quvvatlash",
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: "500,000",
    icon: <WorkspacePremiumOutlined className="text-[32px]" />,
    color: '#7c4dff',
    bg: '#f5f0ff',
    border: '#c4b5fd',
    btnBg: '#7c4dff',
    popular: true,
    features: [
      '3 tagacha filial',
      '200 tagacha talaba',
      'Kurslar boshqaruvi',
      'Hodimlar va rollar',
      'Kengaytirilgan hisobotlar',
      'SMS xabar yuborish',
      "Ustuvor qo'llab-quvvatlash",
    ],
  },
  {
    key: 'vip',
    name: 'VIP',
    price: "1,000,000",
    icon: <DiamondOutlined className="text-[32px]" />,
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fcd34d',
    btnBg: '#f59e0b',
    features: [
      'Cheksiz filiallar',
      'Cheksiz talabalar',
      'Barcha Premium imkoniyatlar',
      'Xonalar boshqaruvi',
      'Telegram bot integratsiyasi',
      'Tekshiruv tizimi',
      'FAQ boshqaruvi',
      'Shaxsiy menejer',
      "24/7 qo'llab-quvvatlash",
    ],
  },
];

const Subscription = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-0">
      {/* Header */}
      <div className="bg-white border-b border-[#f1f1f5] p-[16px_32px] flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-[10px] border-none bg-[#f5f5fb] cursor-pointer flex items-center justify-center text-[#7c4dff] transition-colors duration-200 hover:bg-[#ede9ff]"
        >
          <ArrowBackOutlined fontSize="small" />
        </button>
        <div>
          <h1 className="m-0 text-[20px] font-bold text-[#1a1a2e]">Obuna rejalarini tanlang</h1>
          <p className="m-0 text-[13px] text-[#9ca3af]">O'zingizga mos tarifni tanlang va imkoniyatlardan foydalaning</p>
        </div>
      </div>

      {/* Plans */}
      <div className="p-[40px_32px] max-w-[1000px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.key}
              onClick={() => setSelected(plan.key)}
              className={`rounded-[20px] p-[28px_24px] cursor-pointer relative transition-all duration-200 shadow-[0_1px_6px_rgba(0,0,0,0.05)] ${selected === plan.key ? 'translate-y-[-4px]' : 'translate-y-0'}`}
              style={{
                background: plan.bg,
                border: `2px solid ${selected === plan.key ? plan.color : plan.border}`,
                boxShadow: selected === plan.key ? `0 4px 20px ${plan.color}33` : undefined,
              }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 bg-[#7c4dff] text-white text-[11px] font-bold p-[4px_14px] rounded-[20px] whitespace-nowrap">
                  <BoltOutlined style={{ fontSize: '12px', verticalAlign: 'middle' }} /> Mashhur
                </div>
              )}

              {/* Icon */}
              <div className="mb-3.5" style={{ color: plan.color }}>{plan.icon}</div>

              {/* Name */}
              <h2 className="m-0 mb-1 text-[20px] font-bold text-[#1a1a2e]">{plan.name}</h2>

              {/* Price */}
              <div className="mb-5">
                <span className="text-[28px] font-extrabold" style={{ color: plan.color }}>{plan.price}</span>
                <span className="text-[13px] text-[#9ca3af] ml-1">so'm/oy</span>
              </div>

              {/* Features */}
              <ul className="list-none p-0 m-0 mb-6 flex flex-col gap-2.5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[13px] text-[#374151]">
                    <CheckCircleOutlined style={{ fontSize: '16px', color: plan.color }} className="shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                className={`w-full p-3 rounded-[12px] font-bold text-[14px] cursor-pointer border-2 transition-all duration-200`}
                style={{
                  background: selected === plan.key ? plan.btnBg : '#fff',
                  color: selected === plan.key ? '#fff' : plan.color,
                  borderColor: plan.color,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = plan.btnBg; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => {
                  if (selected !== plan.key) {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = plan.color;
                  }
                }}
                onClick={e => { e.stopPropagation(); setSelected(plan.key); }}
              >
                {selected === plan.key ? '✓ Tanlandi' : "Tanlash"}
              </button>
            </div>
          ))}
        </div>

        {/* Confirm button */}
        {selected && (
          <div className="text-center mt-8">
            <button className="bg-[#7c4dff] text-white border-none rounded-[14px] p-[14px_48px] text-[15px] font-bold cursor-pointer shadow-[0_4px_16px_rgba(124,77,255,0.3)] transition-opacity duration-200 hover:opacity-90"
            >
              <BoltOutlined style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Obunani faollashtirish
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;
