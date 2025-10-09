import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Home } from "./pages/Home";
import { Browse } from "./pages/Browse";
import { PropertyDetails } from "./pages/PropertyDetails";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { HowItWorks } from "./pages/HowItWorks";
import { ForgotPassword } from "./pages/ForgotPassword";
import { VerifiedUser } from "./pages/VerifiedUser";
import { ThreeDTour } from "./pages/ThreeDTour";
import { ChatWithSeller } from "./pages/ChatWithSeller";
import { StartEscrow } from "./pages/StartEscrow";
import { UploadDocuments } from "./pages/UploadDocuments";
import { UploadListing } from "./pages/UploadListing";
import { Contact } from "./pages/Contact";
import { MyListings } from "./pages/MyListings";
import { MyEscrow } from "./pages/MyEscrow";
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
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/3d-tour/:id" element={<ThreeDTour />} />
              <Route path="/chat/:id" element={<ChatWithSeller />} />
              <Route path="/start-escrow/:id" element={<StartEscrow />} />
              <Route path="/upload-documents/:id" element={<UploadDocuments />} />
              <Route path="/upload-listing" element={<UploadListing />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="/my-escrow" element={<MyEscrow />} />
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
