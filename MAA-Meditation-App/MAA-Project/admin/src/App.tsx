/**
 * File: App.tsx
 *
 * Description: Root application component with React Router configuration. Defines all admin
 * routes with authentication protection.
 *
 * Author: Navnit(Ninjacode911)
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));
const CoursesPage = lazy(() => import('./pages/CoursesPage').then(m => ({ default: m.CoursesPage })));
const LessonsPage = lazy(() => import('./pages/LessonsPage').then(m => ({ default: m.LessonsPage })));
const ContentPage = lazy(() => import('./pages/ContentPage').then(m => ({ default: m.ContentPage })));
const EventsPage = lazy(() => import('./pages/EventsPage').then(m => ({ default: m.EventsPage })));
const QuotesPage = lazy(() => import('./pages/QuotesPage').then(m => ({ default: m.QuotesPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage').then(m => ({ default: m.SubscriptionsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div></div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/lessons" element={<LessonsPage />} />
              <Route path="/content" element={<ContentPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/quotes" element={<QuotesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
