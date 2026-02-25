import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Navbar() {
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(9, 9, 11, 0.7)',
            backdropFilter: 'blur(16px)',
            zIndex: 100
        }}>
            <div className="container flex items-center justify-between" style={{ height: '70px' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 32, height: 32, background: 'var(--primary)',
                        borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <span style={{ color: '#000', fontSize: '16px', fontWeight: 900 }}>L</span>
                    </div>
                    <span style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'Outfit', color: '#fff' }}>LOOV</span>
                </Link>
                <div style={{ display: 'flex', gap: '32px', fontSize: '14px', fontWeight: 600 }}>
                    <NavLink to="/" current={currentPath}>Home</NavLink>
                    <NavLink to="/market" current={currentPath}>Market Spy</NavLink>
                    <NavLink to="/intel" current={currentPath}>Product Intel</NavLink>
                    <NavLink to="/procurement" current={currentPath}>Procurement</NavLink>
                    <NavLink to="/board" current={currentPath}>Community</NavLink>
                </div>
            </div>
        </nav>
    );
}

function NavLink({ to, children, current }) {
    const isActive = current === to;
    return (
        <Link to={to} style={{
            position: 'relative',
            color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
            transition: 'color 0.3s ease'
        }}>
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
