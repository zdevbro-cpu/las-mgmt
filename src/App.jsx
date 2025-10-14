import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HeroPage from './components/HeroPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import DashboardPage from './components/DashboardPage';
import WorkDiaryPage from './components/WorkDiaryPage';
import SalesPage from './components/SalesPage';
import AdminPage from './components/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HeroPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/work-diary" element={<WorkDiaryPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}