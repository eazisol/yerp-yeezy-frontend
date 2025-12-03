import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "./components/common/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import PurchaseOrders from "./pages/PurchaseOrders";
import PODetail from "./pages/PODetail";
import GRN from "./pages/GRN";
import GRNDetail from "./pages/GRNDetail";
import Inventory from "./pages/Inventory";
import Vendors from "./pages/Vendors";
import VendorDetail from "./pages/VendorDetail";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Roles from "./pages/Roles";
import RolePermissions from "./pages/RolePermissions";
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
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/purchase-orders/:id" element={<PODetail />} />
              <Route path="/grn" element={<GRN />} />
              <Route path="/grn/:id" element={<GRNDetail />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/vendors/:id" element={<VendorDetail />} />
              <Route path="/users" element={<Users />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/roles/:id/permissions" element={<RolePermissions />} />
              <Route path="/settings" element={<Settings />} />
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
