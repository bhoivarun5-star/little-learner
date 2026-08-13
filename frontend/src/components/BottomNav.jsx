import { NavLink, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/child/home', icon: '🏠', label: 'Home' },
  { path: '/child/learn', icon: '📚', label: 'Learn' },
  { path: '/child/games', icon: '🎮', label: 'Games' },
  { path: '/child/progress', icon: '⭐', label: 'Stars' },
]

export default function BottomNav() {
  const location = useLocation()
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          aria-label={item.label}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
