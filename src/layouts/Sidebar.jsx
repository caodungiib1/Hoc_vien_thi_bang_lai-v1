import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getStudents } from '../services/studentService';
import { getDocumentRecords } from '../services/documentService';
import { getTasks } from '../services/taskService';
import { canAccessModule } from '../services/permissionService';

const menuItems = [
  {
    moduleKey: 'dashboard',
    title: 'Tổng quan',
    path: '/',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  },
  {
    moduleKey: 'students',
    title: 'Học viên',
    path: '/students',
    badgeKey: 'students',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  },
  {
    moduleKey: 'classes',
    title: 'Lớp học',
    path: '/classes',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253',
  },
  {
    moduleKey: 'exams',
    title: 'Lịch thi',
    path: '/exams',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    moduleKey: 'fees',
    title: 'Học phí',
    path: '/fees',
    badgeKey: 'debtors',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    moduleKey: 'documents',
    title: 'Hồ sơ',
    path: '/documents',
    badgeKey: 'missingDocs',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    moduleKey: 'reports',
    title: 'Kết quả KD',
    path: '/reports',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    moduleKey: 'referrers',
    title: 'Người giới thiệu',
    path: '/referrers',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    moduleKey: 'notifications',
    title: 'BOT thông báo',
    path: '/notifications',
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  },
  {
    moduleKey: 'settings',
    title: 'Cài đặt',
    path: '/settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  },
  {
    moduleKey: 'admin',
    title: 'Admin',
    path: '/admin',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    moduleKey: 'tasks',
    title: 'Nhắc việc',
    path: '/tasks',
    badgeKey: 'pendingTasks',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  },
];

const Sidebar = ({ isCollapsed, currentUser }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [badges, setBadges] = useState({
    students: 0,
    debtors: 0,
    missingDocs: 0,
    pendingTasks: 0,
  });

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getStudents(),
      getDocumentRecords(),
      getTasks ? getTasks() : Promise.resolve([]),
    ]).then(([students, docRecords, tasks]) => {
      if (!mounted) return;

      const debtors = students.filter((student) => student.debt && student.debt !== '0').length;
      const missingDocs = docRecords.filter((record) => record.missingCount > 0).length;
      const pendingTasks = Array.isArray(tasks)
        ? tasks.filter((task) => task.status !== 'done' && task.status !== 'Hoàn thành').length
        : 0;

      setBadges({
        students: students.length,
        debtors: debtors || 0,
        missingDocs: missingDocs || 0,
        pendingTasks,
      });
    }).catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="sidebar" aria-label={isCollapsed ? 'Menu đang thu gọn' : 'Menu điều hướng'}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 10v7a2 2 0 002 2h10a2 2 0 002-2v-7M12 1v6M9 4l3-3 3 3" />
          </svg>
        </div>
        <div className="sidebar-title">
          <span>QLHV Lái Xe</span>
          <span className="sidebar-subtitle">Quản lý học viên</span>
        </div>
      </div>

      <div className="sidebar-menu">
        {menuItems
          .filter((item) => canAccessModule(currentUser, item.moduleKey))
          .map((item) => {
            const isActive = item.path === '/'
              ? currentPath === '/'
              : currentPath === item.path || currentPath.startsWith(`${item.path}/`);

            const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

            return (
              <Link key={item.path} to={item.path} className={`menu-item ${isActive ? 'active' : ''}`}>
                <div className="menu-item-left">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon} />
                  </svg>
                  <span>{item.title}</span>
                </div>

                {badgeCount > 0 && (
                  <span className="menu-badge">{badgeCount > 99 ? '99+' : badgeCount}</span>
                )}
              </Link>
            );
          })}
      </div>
    </div>
  );
};

export default Sidebar;
