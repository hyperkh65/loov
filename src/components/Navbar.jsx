import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Navbar() {
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(9, 9, 11, 0.6)',
            backdropFilter: 'blur(12px)',
            zIndex: 100
        }}>
            <div className="container flex items-center justify-between" style={{ height: '70px' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 32, height: 32, background: 'var(--primary)',
                        borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="12" y1="8" x2="12" y2="16"></line>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                    </div>
                    <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'Outfit' }}>LOOV</span>
                </Link>
                <div style={{ display: 'flex', gap: '32px', fontSize: '14px', fontWeight: 500 }}>
                    <NavLink to="/" current={currentPath}>Home</NavLink>
                    <NavLink to="/market" current={currentPath}>Market Analysis</NavLink>
                    <NavLink to="/board" current={currentPath}>Community</NavLink>
                </div>
            </div>
        </nav>
    );
}

function NavLink({ to, children, current }) {
    const isActive = current === to;
    return (
        <Link to={to} style={{ position: 'relative', color: isActive ? '#fff' : '#a1a1aa', transition: 'color 0.2s' }}>
            {children}
            {isActive && (
                <motion.div
                    layoutId="underline"
                    style={{ position: 'absolute', bottom: '-26px', left: 0, right: 0, height: 2, background: 'var(--primary)', borderRadius: '2px' }}
                />
            )}
        </Link>
    );
}
