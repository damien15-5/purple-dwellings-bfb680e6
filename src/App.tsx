import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { FloatingAIButton } from "@/components/FloatingAIButton";
import { Home } from "./pages/Home";
import { BlogRedirect } from "./components/BlogRedirect";
import { Browse } from "./pages/Browse";
import { PropertyDetails } from "./pages/PropertyDetails";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { HowItWorks } from "./pages/HowItWorks";
import { ForgotPassword } from "./pages/ForgotPassword";
import { VerifiedUser } from "./pages/VerifiedUser";

import { ChatWithSeller } from "./pages/ChatWithSeller";
import { StartEscrow } from "./pages/StartEscrow";
import { UploadDocuments } from "./pages/UploadDocuments";
import { UploadListing } from "./pages/UploadListing";
import { Contact } from "./pages/Contact";
import { MyListings } from "./pages/MyListings";
import { MyEscrow } from "./pages/MyEscrow";
import { PaymentConfirmation } from "./pages/PaymentConfirmation";
import { MyEscrows } from "./pages/MyEscrows";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { Disclaimer } from "./pages/Disclaimer";
import { AboutUs } from "./pages/AboutUs";
import { OurVision } from "./pages/OurVision";
import { TermsAndConditions } from "./pages/TermsAndConditions";
import { FAQ } from "./pages/FAQ";
import { MyChats } from "./pages/MyChats";
import { AccountSettings } from "./pages/AccountSettings";
import { Support } from "./pages/Support";
import { CustomerServiceDashboard } from "./pages/CustomerServiceDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Navigation />
          <FloatingAIButton />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/property/:id" element={<PropertyDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verified" element={<VerifiedUser />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/favorites" element={<Browse />} />
              <Route path="/dashboard/chats" element={<MyChats />} />
              <Route path="/dashboard/escrow" element={<MyEscrow />} />
              <Route path="/dashboard/listings" element={<MyListings />} />
              <Route path="/dashboard/settings" element={<AccountSettings />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/chat/:id" element={<ChatWithSeller />} />
              <Route path="/start-escrow/:id" element={<StartEscrow />} />
              <Route path="/upload-documents/:id" element={<UploadDocuments />} />
              <Route path="/upload-listing" element={<UploadListing />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="/my-escrow" element={<MyEscrow />} />
              <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
              <Route path="/dashboard/escrows" element={<MyEscrows />} />
              <Route path="/my-chats" element={<MyChats />} />
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
