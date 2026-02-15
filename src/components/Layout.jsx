
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { isSupabaseConfigured } from '../lib/supabase';
import { AuthService } from '../services/auth.service';
import { SignOut, Egg, Receipt, ShoppingCart, Browsers, User, Phone, Sun, Moon, ShieldCheck } from 'phosphor-react';
import { useState, useEffect } from 'react';

export function Layout() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isDark, setIsDark] = useState(!document.body.classList.contains('light-theme'));

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        if (newIsDark) {
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
        }
    };

    useEffect(() => {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
            navigate('/login');
        } else {
            setUser(currentUser);
        }
    }, [navigate]);

    const handleLogout = () => {
        AuthService.logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{
                padding: '1rem 2rem',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <Egg size={32} weight="fill" color="#fbbf24" />
                    <h1 style={{ fontSize: '1.5rem', margin: 0, background: 'linear-gradient(135deg, #fbbf24, #d97706)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                        mandahuevos.com
                    </h1>
                </Link>

                <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    {user.role === 'admin' && (
                        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent-primary)', fontWeight: 'bold' }}>
                            <ShieldCheck size={20} /> Admin
                        </Link>
                    )}
                    <Link to="/new-order" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary)' }}>
                        <ShoppingCart size={20} /> Pedidos
                    </Link>
                    <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary)' }}>
                        <Receipt size={20} /> Historial
                    </Link>
                    <Link to="/blog" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary)' }}>
                        <Browsers size={20} /> Blog
                    </Link>
                    <Link to="/contact" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary)' }}>
                        <Phone size={20} /> Contacto
                    </Link>

                    <button
                        onClick={toggleTheme}
                        style={{
                            background: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)',
                            padding: '0.5rem',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: '1rem',
                            cursor: 'pointer'
                        }}
                        title={isDark ? "Cambiar a modo día" : "Cambiar a modo noche"}
                    >
                        {isDark ? <Sun size={20} weight="fill" color="#fbbf24" /> : <Moon size={20} weight="fill" color="#475569" />}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1.5rem' }}>
                        <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent-primary)', fontWeight: 600 }}>
                            <User size={20} /> {user.full_name || user.name}
                        </Link>
                        <button onClick={handleLogout} style={{ background: 'transparent', color: 'var(--color-text-muted)' }} title="Cerrar sesión">
                            <SignOut size={24} />
                        </button>
                    </div>
                </nav>
            </header>

            <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <Outlet />
            </main>

            <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', marginTop: 'auto', fontSize: '0.85rem' }}>
                <p>&copy; {new Date().getFullYear()} Mandahuevos S.L. - Calidad que se nota.</p>
                <p style={{ marginTop: '0.5rem' }}>
                    <Link to="/contact" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Aviso Legal</Link> •
                    <Link to="/contact" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', marginLeft: '0.5rem' }}>Política de Privacidad</Link>
                </p>
                {user && user.role === 'admin' && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.6 }}>
                        Estado: {isSupabaseConfigured() ? <span style={{ color: '#10b981' }}>● Conectado a Supabase</span> : <span style={{ color: '#fbbf24' }}>● Modo Local</span>}
                    </div>
                )}
            </footer>
        </div>
    );
}
