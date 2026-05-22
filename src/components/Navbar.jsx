import { NavLink } from 'react-router-dom';
import './Navbar.css';

/**
 * 导航栏组件
 * 页面顶部导航，包含四个入口：今日聚焦 / 全部任务 / 历史记录 / 周回顾 / 时间统计
 */
function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">📋</span>
        <span className="brand-text">我的待办</span>
      </div>
      <div className="navbar-links">
        <NavLink
          to="/today"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          今日聚焦
        </NavLink>
        <NavLink
          to="/all-tasks"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          全部任务
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          历史记录
        </NavLink>
        <NavLink
          to="/week-review"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          周回顾
        </NavLink>
        <NavLink
          to="/time-stats"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          ⏱️ 时间统计
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;