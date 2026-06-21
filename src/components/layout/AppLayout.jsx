import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}