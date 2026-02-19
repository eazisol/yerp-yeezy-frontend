import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { POPdfUploadProvider } from "@/contexts/POPdfUploadContext";
import Layout from "./components/common/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import PermissionRoute from "./components/common/PermissionRoute";
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
import OrderProjections from "./pages/OrderProjections";
import StockAlerts from "./pages/StockAlerts";
import MissingVariantSkus from "./pages/MissingVariantSkus";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <POPdfUploadProvider>
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

              {/* Products */}
              <Route
                path="/products"
                element={
                  <PermissionRoute menuCode="PRODUCTS">
                    <Products />
                  </PermissionRoute>
                }
              />
              <Route
                path="/products/new"
                element={
                  <PermissionRoute menuCode="PRODUCTS">
                    <ProductFormPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/products/:id"
                element={
                  <PermissionRoute menuCode="PRODUCTS">
                    <ProductDetail />
                  </PermissionRoute>
                }
              />
              <Route
                path="/products/:id/edit"
                element={
                  <PermissionRoute menuCode="PRODUCTS">
                    <ProductFormPage />
                  </PermissionRoute>
                }
              />

              {/* Orders */}
              <Route
                path="/orders"
                element={
                  <PermissionRoute menuCode="ORDERS">
                    <Orders />
                  </PermissionRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <PermissionRoute menuCode="ORDERS">
                    <OrderDetail />
                  </PermissionRoute>
                }
              />

              {/* Customers */}
              <Route
                path="/customers"
                element={
                  <PermissionRoute menuCode="CUSTOMERS">
                    <Customers />
                  </PermissionRoute>
                }
              />
              <Route
                path="/customers/:id"
                element={
                  <PermissionRoute menuCode="CUSTOMERS">
                    <CustomerDetail />
                  </PermissionRoute>
                }
              />

              {/* Purchase Orders */}
              <Route
                path="/purchase-orders"
                element={
                  <PermissionRoute menuCode="PURCHASE_ORDERS">
                    <PurchaseOrders />
                  </PermissionRoute>
                }
              />
              <Route
                path="/purchase-orders/new"
                element={
                  <PermissionRoute menuCode="PURCHASE_ORDERS">
                    <POFormPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/purchase-orders/:id"
                element={
                  <PermissionRoute menuCode="PURCHASE_ORDERS">
                    <PODetail />
                  </PermissionRoute>
                }
              />
              <Route
                path="/purchase-orders/:id/edit"
                element={
                  <PermissionRoute menuCode="PURCHASE_ORDERS">
                    <POFormPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/po/preview/:id"
                element={
                  <PermissionRoute menuCode="PURCHASE_ORDERS">
                    <POPreview />
                  </PermissionRoute>
                }
              />

              {/* GRN */}
              <Route
                path="/grn"
                element={
                  <PermissionRoute menuCode="GRN">
                    <GRN />
                  </PermissionRoute>
                }
              />
              <Route
                path="/grn/new"
                element={
                  <PermissionRoute menuCode="GRN">
                    <GRNFormPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/grn/:id"
                element={
                  <PermissionRoute menuCode="GRN">
                    <GRNDetail />
                  </PermissionRoute>
                }
              />
              <Route
                path="/grn/:id/edit"
                element={
                  <PermissionRoute menuCode="GRN">
                    <GRNFormPage />
                  </PermissionRoute>
                }
              />

              {/* Inventory */}
              <Route
                path="/inventory"
                element={
                  <PermissionRoute menuCode="INVENTORY">
                    <Inventory />
                  </PermissionRoute>
                }
              />

              {/* Vendors */}
              <Route
                path="/vendors"
                element={
                  <PermissionRoute menuCode="VENDORS">
                    <Vendors />
                  </PermissionRoute>
                }
              />
              <Route
                path="/vendors/:id"
                element={
                  <PermissionRoute menuCode="VENDORS">
                    <VendorDetail />
                  </PermissionRoute>
                }
              />

              {/* Warehouses */}
              <Route
                path="/warehouses"
                element={
                  <PermissionRoute menuCode="WAREHOUSES">
                    <Warehouses />
                  </PermissionRoute>
                }
              />
              <Route
                path="/warehouses/:id"
                element={
                  <PermissionRoute menuCode="WAREHOUSES">
                    <WarehouseDetail />
                  </PermissionRoute>
                }
              />

              {/* Users / Roles / Settings / KPI / Reports / Alerts */}
              <Route path="/users" element={<Users />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/roles/:id/permissions" element={<RolePermissions />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/kpi" element={<KPI />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/order-projections" element={<OrderProjections />} />
              <Route path="/stock-alerts" element={<StockAlerts />} />
              <Route path="/missing-variant-skus" element={<MissingVariantSkus />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </POPdfUploadProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
