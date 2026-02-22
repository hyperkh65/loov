import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Navbar() {
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            borderBottom: '1px solid rgba(0,0,0,0.03)',
            background: 'rgba(248, 247, 242, 0.7)',
            backdropFilter: 'blur(20px)',
            zIndex: 100
        }}>
            <div className="container flex items-center justify-between" style={{ height: '80px' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 36, height: 36, background: 'var(--primary)',
                        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(164,198,57,0.3)'
                    }}>
                        <span style={{ color: '#fff', fontSize: '18px', fontWeight: 900 }}>L</span>
                    </div>
                    <span style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'Outfit', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>LOOV</span>
                </Link>
                <div style={{ display: 'flex', gap: '40px', fontSize: '15px', fontWeight: 600 }}>
                    <NavLink to="/" current={currentPath}>Home</NavLink>
                    <NavLink to="/market" current={currentPath}>Market Intelligence</NavLink>
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
            color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
            transition: 'all 0.3s ease'
        }}>
            {children}
            {isActive && (
                <motion.div
                    layoutId="underline"
                    style={{
                        position: 'absolute', bottom: '-4px', left: 0, right: 0, height: 3,
                        background: 'var(--primary)', borderRadius: '100px'
                    }}
                />
            )}
        </Link>
    );
}
