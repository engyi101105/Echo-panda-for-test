import { NavLink } from "react-router-dom";
import {
  FaChartLine,
  FaShieldAlt,
  FaUsers,
  FaRegHeart,
  FaMusic,
  FaCompactDisc,
  FaTags,
  FaListUl,
  FaCog,
  FaBookmark,
} from "react-icons/fa";

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const menus: MenuItem[] = [
  { name: "Dashboard", path: "/admin/dashboard", icon: <FaChartLine /> },
  { name: "Admins", path: "/admin/admins", icon: <FaShieldAlt /> },
  { name: "Users", path: "/admin/users", icon: <FaUsers /> },
  { name: "Favorites", path: "/admin/favorites", icon: <FaRegHeart /> },
  { name: "Artists", path: "/admin/artists", icon: <FaMusic /> },
  { name: "Songs", path: "/admin/songs", icon: <FaCompactDisc /> },
  { name: "Categories", path: "/admin/categories", icon: <FaTags /> },
  { name: "Albums", path: "/admin/albums", icon: <FaListUl /> },
  { name: "Tags", path: "/admin/tags", icon: <FaBookmark /> },
  { name: "Settings", path: "/admin/settings", icon: <FaCog /> },
];

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 via-purple-900 to-slate-950 text-white border-r border-purple-500/20 h-full flex flex-col">
      {/* Sidebar Header - Logo Section (matching topbar height) */}
      <div className="flex items-center px-6 py-4 border-b border-purple-500/30 h-21">
        {/* Logo */}
        <NavLink
          to="/"
          className="flex items-center gap-3 text-2xl font-bold"
        >
          <img
            src="/logo.png"
            alt="Echo Panda Logo"
            className="h-10 w-auto"
          />

          {/* Text */}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200">
            Echo Panda
          </span>
        </NavLink>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                  : "text-slate-300 hover:bg-purple-500/10 hover:text-purple-300"
              }`
            }
          >
            <span className={`text-lg transition-transform group-hover:scale-110`}>
              {menu.icon}
            </span>
            <span className="font-medium">{menu.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-purple-500/30 bg-slate-950/50">
        <div className="text-xs text-slate-400 text-center">
          <p className="text-purple-400 font-semibold">Echo Panda</p>
          <p>Admin Panel Management</p>
        </div>
      </div>
    </aside>
  );
}
