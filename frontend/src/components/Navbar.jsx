
import { NavLink } from 'react-router-dom'
import { Aperture, BookOpen, SlidersHorizontal, ChartNoAxesColumn } from 'lucide-react'

const links = [
  { to: '/', label: 'Explore', icon: BookOpen },
  { to: '/studio', label: 'Studio', icon: SlidersHorizontal },
  { to: '/analysis', label: 'Analysis', icon: ChartNoAxesColumn },
]

export default function Navbar() {
  return (
    <header className="navbar glass">
      <NavLink to="/" className="brand">
        <div className="brand-logo">
          <Aperture size={25} strokeWidth={1.8} />
        </div>
        <div>
          <div className="brand-name">PixelLab</div>
          <div className="brand-caption">IMAGE ENHANCEMENT STUDIO</div>
        </div>
      </NavLink>

      <nav className="nav-links" aria-label="Main navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <span className="nav-version">PIXELLAB / 2.0</span>
    </header>
  )
}
