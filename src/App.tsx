import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminFamilies from "./pages/admin/AdminFamilies";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminReports from "./pages/admin/AdminReports";
import AdminRequests from "./pages/admin/AdminRequests";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import EntryLayout from "./components/EntryLayout";
import EntrySearchFamily from "./pages/entry/EntrySearchFamily";
import EntryPayments from "./pages/entry/EntryPayments";
import EntryMemberRequest from "./pages/entry/EntryMemberRequest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login/:role" element={<Login />} />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="families" element={<AdminFamilies />} />
              <Route path="members" element={<AdminMembers />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="requests" element={<AdminRequests />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route
              path="/dashboard/entry"
              element={
                <ProtectedRoute allowedRole="entry">
                  <EntryDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
