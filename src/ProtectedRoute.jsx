import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
  const username = localStorage.getItem('username');
  return username ? <Outlet /> : <Navigate to="/" replace />;
};

export const AdminOnlyRoute = () => {
  const username = localStorage.getItem('username');
  const userType = localStorage.getItem('userType');

  if (!username) return <Navigate to="/" replace />;
  if (userType !== 'admin') return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};