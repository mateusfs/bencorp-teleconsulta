import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AtendimentoDetalhePage } from './pages/AtendimentoDetalhePage';
import { FilaAtendimentoPage } from './pages/FilaAtendimentoPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/fila" element={<FilaAtendimentoPage />} />
        <Route path="/atendimentos/:id" element={<AtendimentoDetalhePage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
