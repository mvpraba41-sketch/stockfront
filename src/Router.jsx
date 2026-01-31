import { Routes, Route } from 'react-router-dom';
import Login from './Admin/Login/Login';
import Inventory from './Admin/Inventory/Inventory';
import List from './Admin/List/List';
import { ProtectedRoute, AdminOnlyRoute } from './ProtectedRoute';
import Godown from './Admin/Godown/Godown';
import ViewStock from './Admin/Godown/ViewStock';
import GodownDetail from './Admin/Godown/GodownDetail';
import Analysis from './Admin/Analysis/Analysis';
import Search from './Admin/Search/Search';
import GodownAnalytics from './Admin/Godownanalytics/GodownAnalytics';
import Profile from './Admin/Login/Profile';
import Booking from './Admin/Booking/Booking';
import AllBookings from './Admin/Booking/Allbookings';
import Ledger from './Admin/Ledger/Ledger'
import Admin from './Admin/Ledger/Admin'
import Dispatch from './Admin/Ledger/Dispatchs'
import Pendingpayments from './Admin/Ledger/Pendingpayments'
import Delivery from './Admin/Delivery/Delivery';
import Inventoryt from './Admin/Tax/Inventoryt';
import CompanyDetails from './Admin/Tax/CompanyDetails';
import ViewCompanyDetails from './Admin/Tax/ViewCompanyDetails';
import Billing from './Admin/Tax/Billing';
import AllBillings from './Admin/Tax/Allbillings';

const AllRoutes = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />

      {/* Any logged-in user */}
      <Route element={<ProtectedRoute />}>
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/listing" element={<List />} />
        <Route path="/godown" element={<Godown />} />
        <Route path="/viewstock" element={<ViewStock />} />
        <Route path="/view-stocks/:godownId" element={<GodownDetail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/delivery" element={<Delivery />} />
      </Route>

      {/* Admin only */}
      <Route element={<AdminOnlyRoute />}>
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/analytics" element={<GodownAnalytics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/book" element={<Booking />} />
        <Route path="/allbookings" element={<AllBookings />} />
        <Route path="/ledger" element={<Ledger />} />
        <Route path="/adm" element={<Admin />} />
        <Route path="/payments" element={<Pendingpayments />} />
        <Route path="/dispatch" element={<Dispatch />} />
        <Route path="/taxinventory" element={<Inventoryt />} />
        <Route path="/createcompany" element={<CompanyDetails />} />
        <Route path="/viewcompany" element={<ViewCompanyDetails />} />
        <Route path="/taxbills" element={<Billing />} />
        <Route path="/allbills" element={<AllBillings />} />
      </Route>
    </Routes>
  );
};

export default AllRoutes;