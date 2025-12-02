import './App.css';
import { Route, Routes } from 'react-router-dom';
import MainForm from './pages/MainForm.jsx';
import Complete from './pages/Complete.jsx';
import Login from './pages/auth/login/Login.jsx';
import Admin from './pages/Admin.jsx';
import RequiredAuth from './components/common/RequiredAuth.jsx';
import ModifyInfo from './components/tree/ModifyInfo.jsx';

function App() {
  return (
    <Routes>
      <Route path={'/'} element={<MainForm />} />
      <Route path={'/complete'} element={<Complete />} />
      <Route
        path={'/admin'}
        element={
          <RequiredAuth>
            <Admin />
          </RequiredAuth>
        }
      />
      <Route path={'/login'} element={<Login />} />
      <Route path={'/modifyInfo/:id'} element={<ModifyInfo />} />
    </Routes>
  );
}

export default App;
