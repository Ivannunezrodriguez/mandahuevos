import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { NewOrder } from './pages/NewOrder';
import { History } from './pages/History';
import { Blog } from './pages/Blog';
import { Profile } from './pages/Profile';
import { Contact } from './pages/Contact';
import { Legal } from './pages/Legal';
import { AdminDashboard } from './pages/AdminDashboard';

function App() {
  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      const isDayTime = hour >= 7 && hour < 19;

      if (isDayTime) {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
    };

    updateTheme();
    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="new-order" element={<NewOrder />} />
          <Route path="history" element={<History />} />
          <Route path="blog" element={<Blog />} />
          <Route path="profile" element={<Profile />} />
          <Route path="contact" element={<Contact />} />
          <Route path="legal" element={<Legal />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
