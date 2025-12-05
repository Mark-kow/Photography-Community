import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Search from './pages/Search';
import WorkDetail from './pages/WorkDetail';
import CreateWork from './pages/CreateWork';
import EditWork from './pages/EditWork';
import Profile from './pages/Profile';
import Locations from './pages/Locations';
import LocationDetail from './pages/LocationDetail';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import TipDetail from './pages/TipDetail';
import Equipments from './pages/Equipments';
import EquipmentDetail from './pages/EquipmentDetail';
import MyEquipments from './pages/MyEquipments';
import MarketPlace from './pages/MarketPlace';
import CreateMarketItem from './pages/CreateMarketItem';
import Activities from './pages/Activities';
import ActivityDetail from './pages/ActivityDetail';
import CreateActivity from './pages/CreateActivity';
import MyActivities from './pages/MyActivities';
import Challenges from './pages/Challenges';
import ChallengeDetail from './pages/ChallengeDetail';
import MyChallenges from './pages/MyChallenges';
import AIAssistant from './pages/AIAssistant';
import EquipmentAdvisor from './pages/EquipmentAdvisor';
import EquipmentCompare from './pages/EquipmentCompare';
import Admin from './pages/Admin';
import './App.css';

// 私有路由保护
const PrivateRoute = ({ children }) => {
  const { accessToken } = useUserStore();
  return accessToken ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={
          <PrivateRoute>
            <Admin />
          </PrivateRoute>
        } />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="work/:id" element={<WorkDetail />} />
          <Route 
            path="work/:id/edit" 
            element={
              <PrivateRoute>
                <EditWork />
              </PrivateRoute>
            } 
          />
          <Route path="profile/:id" element={<Profile />} />
          <Route path="locations" element={<Locations />} />
          <Route path="location/:id" element={<LocationDetail />} />
          <Route path="courses" element={<Courses />} />
          <Route path="course/:id" element={<CourseDetail />} />
          <Route path="tip/:id" element={<TipDetail />} />
          <Route path="equipments" element={<Equipments />} />
          <Route path="equipment/:type/:id" element={<EquipmentDetail />} />
          <Route 
            path="my-equipments" 
            element={
              <PrivateRoute>
                <MyEquipments />
              </PrivateRoute>
            } 
          />
          <Route path="market" element={<MarketPlace />} />
          <Route 
            path="market/create" 
            element={
              <PrivateRoute>
                <CreateMarketItem />
              </PrivateRoute>
            } 
          />
          <Route path="activities" element={<Activities />} />
          <Route path="activity/:id" element={<ActivityDetail />} />
          <Route 
            path="activities/create" 
            element={
              <PrivateRoute>
                <CreateActivity />
              </PrivateRoute>
            } 
          />
          <Route 
            path="my-activities" 
            element={
              <PrivateRoute>
                <MyActivities />
              </PrivateRoute>
            } 
          />
          <Route path="challenges" element={<Challenges />} />
          <Route path="challenge/:id" element={<ChallengeDetail />} />
          <Route 
            path="my-challenges" 
            element={
              <PrivateRoute>
                <MyChallenges />
              </PrivateRoute>
            } 
          />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="equipment-advisor" element={<EquipmentAdvisor />} />
          <Route path="equipment-compare" element={<EquipmentCompare />} />
          <Route 
            path="create" 
            element={
              <PrivateRoute>
                <CreateWork />
              </PrivateRoute>
            } 
          />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
