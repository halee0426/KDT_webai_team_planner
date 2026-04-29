// 진입점 · 라우팅 · 전역 부트스트랩
// 담당: A

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import YearView from '@/components/views/YearView';
import MonthView from '@/components/views/MonthView';
import WeekView from '@/components/views/WeekView';
import DayView from '@/components/views/DayView';
import TenMinPlanner from '@/components/views/TenMinPlanner';
import MandalaView from '@/components/views/MandalaView';
import DiaryView from '@/components/views/DiaryView';
import LoginPage from '@/components/auth/LoginPage';
import SignupPage from '@/components/auth/SignupPage';
import TabBar from '@/components/shared/TabBar';
import MergeOnLogin from '@/components/auth/MergeOnLogin';
import { useAuthSubscription } from '@/hooks/useAuth';
import { useThemeApply } from '@/hooks/useTheme';

export default function App() {
  useAuthSubscription();
  useThemeApply();

  return (
    <BrowserRouter>
      <MergeOnLogin />
      <main style={{ paddingBottom: 64 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/day" replace />} />
          <Route path="/year" element={<YearView />} />
          <Route path="/month" element={<MonthView />} />
          <Route path="/week" element={<WeekView />} />
          <Route path="/day" element={<DayView />} />
          <Route path="/tenmin" element={<TenMinPlanner />} />
          <Route path="/mandala" element={<MandalaView />} />
          <Route path="/diary" element={<DiaryView />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/day" replace />} />
        </Routes>
      </main>
      <TabBar />
    </BrowserRouter>
  );
}
