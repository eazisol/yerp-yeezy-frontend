import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "./components/common/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import ProductFormPage from "./pages/ProductFormPage";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import PurchaseOrders from "./pages/PurchaseOrders";
import PODetail from "./pages/PODetail";
import POFormPage from "./pages/POFormPage";
import POPreview from "./pages/POPreview";
import GRN from "./pages/GRN";
import GRNDetail from "./pages/GRNDetail";
import GRNFormPage from "./pages/GRNFormPage";
import VendorAcceptPO from "./pages/VendorAcceptPO";
import Inventory from "./pages/Inventory";
import Vendors from "./pages/Vendors";
import VendorDetail from "./pages/VendorDetail";
import Warehouses from "./pages/Warehouses";
import WarehouseDetail from "./pages/WarehouseDetail";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Roles from "./pages/Roles";
import RolePermissions from "./pages/RolePermissions";
import KPI from "./pages/KPI";
import Reports from "./pages/Reports";
import StockAlerts from "./pages/StockAlerts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/vendor/accept-po" element={<VendorAcceptPO />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/new" element={<ProductFormPage />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/products/:id/edit" element={<ProductFormPage />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/purchase-orders/new" element={<POFormPage />} />
              <Route path="/purchase-orders/:id" element={<PODetail />} />
              <Route path="/purchase-orders/:id/edit" element={<POFormPage />} />
              <Route path="/po/preview/:id" element={<POPreview />} />
              <Route path="/grn" element={<GRN />} />
              <Route path="/grn/new" element={<GRNFormPage />} />
              <Route path="/grn/:id" element={<GRNDetail />} />
              <Route path="/grn/:id/edit" element={<GRNFormPage />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/vendors/:id" element={<VendorDetail />} />
              <Route path="/warehouses" element={<Warehouses />} />
              <Route path="/warehouses/:id" element={<WarehouseDetail />} />
              <Route path="/users" element={<Users />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/roles/:id/permissions" element={<RolePermissions />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/kpi" element={<KPI />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/stock-alerts" element={<StockAlerts />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
