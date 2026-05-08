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
import AdminRecommendMissing from './pages/admin/AdminRecommendMissing.jsx';
import Ranking from './pages/admin/Ranking.jsx';
import DirectChildrenRanking from './pages/admin/DirectChildrenRanking.jsx';
import Region from './pages/admin/Region.jsx';
import RightMember from './pages/admin/RightMember.jsx';
import SheetToken from './pages/admin/SheetToken.jsx';
import DeletionLog from './pages/admin/DeletionLog.jsx';
import LeaderSheet from './pages/LeaderSheet.jsx';
import Theminjoo from './pages/Theminjoo.jsx';

function App() {
  return (
      <Routes>
        <Route path={'/'} element={<MainForm />} />
        <Route path={'/complete'} element={<Complete />} />
        <Route path={'/sheet'} element={<LeaderSheet />} />
        <Route path={'/theminjoo'} element={<Theminjoo />} />
        <Route element={<RequiresAuth />}>
          <Route path='/admin' element={<Admin />} />
          <Route path='/admin/home' element={<AdminHome />} />
          <Route
              path='/admin/recommendMissing'
              element={<AdminRecommendMissing />}
          />
          <Route path='/admin/leader/:leaderId' element={<AdminLeaderTree />} />
          <Route path={'/modifyInfo/:id'} element={<ModifyInfo />} />
          <Route path={'/ranking'} element={<Ranking />} />
          <Route path={'/directChildrenRanking'} element={<DirectChildrenRanking />} />
          <Route path={'/region'} element={<Region />} />
          <Route path={'/rightMember'} element={<RightMember />} />
          <Route path={'/admin/sheetToken'} element={<SheetToken />} />
          <Route path={'/admin/deletionLog'} element={<DeletionLog />} />
        </Route>
        <Route path={'/login'} element={<Login />} />
      </Routes>
  );
}

export default App;
