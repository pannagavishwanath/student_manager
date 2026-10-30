const links = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'tasks', label: 'My Tasks', icon: '✅' },
  { id: 'planner', label: 'Planner', icon: '📅' },
  { id: 'materials', label: 'Materials', icon: '📚' },
];

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">🎓 <span>Task Manager</span></div>
      <nav className="nav">
        {links.map((link) => (
          <button
            key={link.id}
            className={`nav-link ${currentPage === link.id ? 'active' : ''}`}
            onClick={() => onNavigate(link.id)}
          >
            <span className="nav-icon">{link.icon}</span>
            <span className="nav-label">{link.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        Demo mode
        <br />
        Sample data, not saved
      </div>
    </aside>
  );
}
