import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import ParallaxBackground from './components/ParallaxBackground';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ToastHost from './components/ToastHost';
import ParticleBurstLayer from './components/ParticleBurst';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';
import FeeStructures from './pages/FeeStructures';
import Receipts from './pages/Receipts';
import Settings from './pages/Settings';
import api from './api/client';
import { useAppStore } from './store/appStore';

export default function App() {
  const schools = useAppStore((s) => s.schools);
  const setSchools = useAppStore((s) => s.setSchools);
  const activeSchoolId = useAppStore((s) => s.activeSchoolId);
  const setActiveSchool = useAppStore((s) => s.setActiveSchool);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.schools.list();
        setSchools(list);
        if (list.length && !activeSchoolId) setActiveSchool(list[0].id);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <ParallaxBackground />
        <div className="text-slate-400 text-sm shimmer-text font-display">Loading EduLedger 3D…</div>
      </div>
    );
  }

  if (!schools.length) {
    return (
      <div className="h-screen w-screen relative">
        <ParallaxBackground />
        <Onboarding />
        <ToastHost />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative flex">
      <ParallaxBackground />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/fee-structures" element={<FeeStructures />} />
            <Route path="/receipts" element={<Receipts />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
      <ToastHost />
      <ParticleBurstLayer />
    </div>
  );
}
