import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { AdminProvider, useAdmin } from "@/contexts/AdminContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { FloatingMenu } from "@/components/FloatingMenu";
import { LoadingFallback } from "@/components/LoadingFallback";
import { AuthRedirectHandler } from "@/components/AuthRedirectHandler";
import { ScrollToTop } from "@/components/ScrollToTop";

// Lazy load all pages
const Home = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));
const BlogRedirect = lazy(() => import("./components/BlogRedirect").then(m => ({ default: m.BlogRedirect })));
const Browse = lazy(() => import("./pages/Browse").then(m => ({ default: m.Browse })));
const PropertyDetails = lazy(() => import("./pages/PropertyDetails").then(m => ({ default: m.PropertyDetails })));
const SellerProperties = lazy(() => import("./pages/SellerProperties").then(m => ({ default: m.SellerProperties })));
const EditListing = lazy(() => import("./pages/EditListing").then(m => ({ default: m.EditListing })));
const Login = lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));
const Signup = lazy(() => import("./pages/Signup").then(m => ({ default: m.Signup })));
const DashboardLayout = lazy(() => import("./components/dashboard/DashboardLayout").then(m => ({ default: m.DashboardLayout })));
const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome").then(m => ({ default: m.DashboardHome })));
const Settings = lazy(() => import("./pages/dashboard/Settings").then(m => ({ default: m.Settings })));
const Verification = lazy(() => import("./pages/dashboard/Verification").then(m => ({ default: m.Verification })));
const MyListings = lazy(() => import("./pages/MyListings").then(m => ({ default: m.MyListings })));
const SavedProperties = lazy(() => import("./pages/dashboard/SavedProperties").then(m => ({ default: m.SavedProperties })));
const OffersNegotiations = lazy(() => import("./pages/dashboard/OffersNegotiations").then(m => ({ default: m.OffersNegotiations })));
const Transactions = lazy(() => import("./pages/dashboard/Transactions").then(m => ({ default: m.Transactions })));
const Promotions = lazy(() => import("./pages/dashboard/Promotions").then(m => ({ default: m.Promotions })));
const Notifications = lazy(() => import("./pages/dashboard/Notifications").then(m => ({ default: m.Notifications })));
const Messages = lazy(() => import("./pages/dashboard/Messages").then(m => ({ default: m.Messages })));
const HelpSupport = lazy(() => import("./pages/dashboard/HelpSupport").then(m => ({ default: m.HelpSupport })));
const HowItWorks = lazy(() => import("./pages/HowItWorks").then(m => ({ default: m.HowItWorks })));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword").then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("./pages/ResetPassword").then(m => ({ default: m.ResetPassword })));
const VerifiedUser = lazy(() => import("./pages/VerifiedUser").then(m => ({ default: m.VerifiedUser })));
const ChatWithSeller = lazy(() => import("./pages/ChatWithSeller").then(m => ({ default: m.ChatWithSeller })));
const StartPayment = lazy(() => import("./pages/StartPayment").then(m => ({ default: m.StartPayment })));
const StartEscrow = lazy(() => import("./pages/StartEscrow").then(m => ({ default: m.StartEscrow })));
const UploadDocuments = lazy(() => import("./pages/UploadDocuments").then(m => ({ default: m.UploadDocuments })));
const UploadListing = lazy(() => import("./pages/UploadListing").then(m => ({ default: m.UploadListing })));
const PromoteProperty = lazy(() => import("./pages/PromoteProperty").then(m => ({ default: m.PromoteProperty })));

const PaymentConfirmation = lazy(() => import("./pages/PaymentConfirmation").then(m => ({ default: m.PaymentConfirmation })));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicy })));
const Disclaimer = lazy(() => import("./pages/Disclaimer").then(m => ({ default: m.Disclaimer })));
const AboutUs = lazy(() => import("./pages/AboutUs").then(m => ({ default: m.AboutUs })));
const OurVision = lazy(() => import("./pages/OurVision").then(m => ({ default: m.OurVision })));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions").then(m => ({ default: m.TermsAndConditions })));
const FAQ = lazy(() => import("./pages/FAQ").then(m => ({ default: m.FAQ })));

const Chat = lazy(() => import("./pages/Chat").then(m => ({ default: m.Chat })));
const AccountSettings = lazy(() => import("./pages/AccountSettings").then(m => ({ default: m.AccountSettings })));
const Support = lazy(() => import("./pages/Support").then(m => ({ default: m.Support })));
const CustomerServiceDashboard = lazy(() => import("./pages/CustomerServiceDashboard").then(m => ({ default: m.CustomerServiceDashboard })));
const CustomerServiceChat = lazy(() => import("./pages/CustomerServiceChat"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminListings = lazy(() => import("./pages/admin/AdminListings"));
const AdminVerification = lazy(() => import("./pages/admin/AdminVerification"));
const AdminEscrow = lazy(() => import("./pages/admin/AdminEscrow"));
const AdminOffers = lazy(() => import("./pages/admin/AdminOffers"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminAILogs = lazy(() => import("./pages/admin/AdminAILogs"));
const AdminTickets = lazy(() => import("./pages/admin/AdminTickets"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminManagement = lazy(() => import("./pages/admin/AdminManagement"));

const queryClient = new QueryClient();

// Protected Route for Admin
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAdmin();
  return isAuthenticated ? <>{children}</> : <Navigate to="/damienxavorianezeani" replace />;
};

const App = () => {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Failed to fetch dynamically imported module')) {
        console.warn('Module load failed, reloading page...');
        window.location.reload();
      }
    };
    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <ScrollToTop />
        <AuthRedirectHandler />
        <Routes>
          {/* Dashboard routes - no nav/footer */}
          <Route path="/dashboard" element={<Suspense fallback={<LoadingFallback />}><DashboardLayout /></Suspense>}>
            <Route index element={<Suspense fallback={<LoadingFallback />}><DashboardHome /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<LoadingFallback />}><Settings /></Suspense>} />
            <Route path="verification" element={<Suspense fallback={<LoadingFallback />}><Verification /></Suspense>} />
            <Route path="my-listings" element={<Suspense fallback={<LoadingFallback />}><MyListings /></Suspense>} />
            <Route path="saved" element={<Suspense fallback={<LoadingFallback />}><SavedProperties /></Suspense>} />
            <Route path="offers" element={<Suspense fallback={<LoadingFallback />}><OffersNegotiations /></Suspense>} />
            <Route path="transactions" element={<Suspense fallback={<LoadingFallback />}><Transactions /></Suspense>} />
            <Route path="promotions" element={<Suspense fallback={<LoadingFallback />}><Promotions /></Suspense>} />
            <Route path="notifications" element={<Suspense fallback={<LoadingFallback />}><Notifications /></Suspense>} />
            <Route path="messages" element={<Suspense fallback={<LoadingFallback />}><Messages /></Suspense>} />
            <Route path="help" element={<Suspense fallback={<LoadingFallback />}><HelpSupport /></Suspense>} />
          </Route>
          {/* Redirect old dashboard routes */}
          <Route path="/dashboard/escrow" element={<Navigate to="/dashboard/transactions" replace />} />
          <Route path="/dashboard/escrows" element={<Navigate to="/dashboard/transactions" replace />} />
          <Route path="/dashboard/documents" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard/favorites" element={<Navigate to="/browse" replace />} />
          <Route path="/dashboard/chats" element={<Navigate to="/dashboard/messages" replace />} />

          {/* All other routes - with nav/footer */}
          <Route path="*" element={
            <div className="flex flex-col min-h-screen">
              <Navigation />
              <FloatingMenu />
              <main className="flex-grow">
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/browse" element={<Browse />} />
                    <Route path="/property/:id" element={<PropertyDetails />} />
                    <Route path="/seller/:sellerId" element={<SellerProperties />} />
                    <Route path="/edit-listing/:id" element={<EditListing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verified" element={<VerifiedUser />} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route path="/chat/:propertyId" element={<Chat />} />
                    <Route path="/pay/:id" element={<StartPayment />} />
                    <Route path="/start-escrow/:id" element={<StartEscrow />} />
                    <Route path="/upload-documents/:id" element={<UploadDocuments />} />
                    <Route path="/upload-listing" element={<UploadListing />} />
                    <Route path="/promote-property" element={<PromoteProperty />} />
                    <Route path="/my-listings" element={<MyListings />} />
                    <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
                    <Route path="/my-chats" element={<Navigate to="/dashboard/messages" replace />} />
                    <Route path="/account-settings" element={<AccountSettings />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/disclaimer" element={<Disclaimer />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/vision" element={<OurVision />} />
                    <Route path="/terms" element={<TermsAndConditions />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/blog" element={<BlogRedirect />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/customer-service" element={<CustomerServiceDashboard />} />
                    <Route path="/ai-support" element={<CustomerServiceChat />} />
                    <Route path="/dashboard/listings" element={<MyListings />} />
                    <Route path="/dashboard/settings" element={<AccountSettings />} />
                    
                    {/* Hidden Admin Routes */}
                    <Route path="/damienxavorianezeani" element={<AdminLogin />} />
                    <Route
                      path="/damienxavorianezeani/*"
                      element={
                        <ProtectedAdminRoute>
                          <AdminLayout />
                        </ProtectedAdminRoute>
                      }
                    >
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="listings" element={<AdminListings />} />
                      <Route path="verification" element={<AdminVerification />} />
                      <Route path="escrow" element={<AdminEscrow />} />
                      <Route path="offers" element={<AdminOffers />} />
                      <Route path="messages" element={<AdminMessages />} />
                      <Route path="ai-logs" element={<AdminAILogs />} />
                      <Route path="tickets" element={<AdminTickets />} />
                      <Route path="reports" element={<AdminReports />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="admin-management" element={<AdminManagement />} />
                    </Route>
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
            </div>
          } />
        </Routes>
      </BrowserRouter>
      </AdminProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
