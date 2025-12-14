import './App.css';
import { Route, Routes } from 'react-router-dom';
import MainForm from './pages/MainForm.jsx';
import Complete from './pages/Complete.jsx';
import Login from './pages/auth/login/Login.jsx';
import Admin from './pages/Admin.jsx';
import RequiredAuth from './components/common/RequiredAuth.jsx';
import ModifyInfo from './components/tree/ModifyInfo.jsx';
import AdminHome from './pages/admin/AdminHome.jsx';
import RequiresAuth from './components/common/RequiredAuth.jsx';
import AdminLeaderTree from './pages/admin/AdminLeaderTree.jsx';

function App() {
  return (
    <Routes>
      <Route path={'/'} element={<MainForm />} />
      <Route path={'/complete'} element={<Complete />} />
      <Route element={<RequiresAuth />}>
        <Route path='/admin' element={<Admin />} />
        <Route path='/admin/home' element={<AdminHome />} />
        <Route path='/admin/leader/:leaderId' element={<AdminLeaderTree />} />
      </Route>
      <Route path={'/login'} element={<Login />} />
      <Route path={'/modifyInfo/:id'} element={<ModifyInfo />} />
    </Routes>
  );
}

export default App;
