// 진입점 · 라우팅 · 전역 부트스트랩

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import YearView from '@/components/views/YearView';
import MonthView from '@/components/views/MonthView';
import WeekView from '@/components/views/WeekView';
import DayView from '@/components/views/DayView';
import TenMinPlanner from '@/components/views/TenMinPlanner';
import MandalaView from '@/components/views/MandalaView';
import DiaryView from '@/components/views/DiaryView';
import LoginPage from '@/components/auth/LoginPage';
import SignupPage from '@/components/auth/SignupPage';
import Settings from '@/components/shared/Settings';
import TabBar from '@/components/shared/TabBar';
import FAB from '@/components/shared/FAB';
import AIInputSheet from '@/components/ai/AIInputSheet';
import MergeOnLogin from '@/components/auth/MergeOnLogin';
import { useAuthSubscription } from '@/hooks/useAuth';
import { useThemeApply } from '@/hooks/useTheme';

function AppShell() {
  const location = useLocation();
  const [aiOpen, setAiOpen] = useState(false);
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <>
      <MergeOnLogin />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/day" replace />} />
          <Route path="/year" element={<YearView />} />
          <Route path="/month" element={<MonthView />} />
          <Route path="/week" element={<WeekView />} />
          <Route path="/day" element={<DayView />} />
          <Route path="/tenmin" element={<TenMinPlanner />} />
          <Route path="/mandala" element={<MandalaView />} />
          <Route path="/diary" element={<DiaryView />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/day" replace />} />
        </Routes>
      </main>
      {!isAuthRoute && (
        <>
          <FAB onClick={() => setAiOpen(true)} />
          <TabBar />
          <AIInputSheet open={aiOpen} onClose={() => setAiOpen(false)} />
        </>
      )}
    </>
  );
}

export default function App() {
  useAuthSubscription();
  useThemeApply();

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
