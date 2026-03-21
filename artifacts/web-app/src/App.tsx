import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import LandingPage from "@/pages/Landing";
import LoginPage from "@/pages/auth/Login";
import RegisterChoicePage from "@/pages/auth/Register";
import RegisterStudentPage from "@/pages/auth/RegisterStudent";
import RegisterTutorPage from "@/pages/auth/RegisterTutor";

import StudentDashboard from "@/pages/student/Dashboard";
import FindTutorPage from "@/pages/student/FindTutor";
import StudentSessionsPage from "@/pages/student/Sessions";
import StudentMaterialsPage from "@/pages/student/Materials";

import TutorDashboardPage from "@/pages/tutor/Dashboard";
import TutorSessionsPage from "@/pages/tutor/Sessions";
import TutorEarningsPage from "@/pages/tutor/Earnings";
import TutorAvailabilityPage from "@/pages/tutor/Availability";
import TutorMaterialsPage from "@/pages/tutor/Materials";

import MessagesPage from "@/pages/Messages";
import VideoRoom from "@/pages/session/VideoRoom";

import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsersPage from "@/pages/admin/Users";
import AdminTransactionsPage from "@/pages/admin/Transactions";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="glass-panel p-10 rounded-3xl text-center max-w-lg">
        <h1 className="text-5xl font-bold text-white mb-4">404</h1>
        <p className="text-muted-foreground mb-8">This page doesn't exist.</p>
        <a href="/" className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 transition-all">
          Go Home
        </a>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterChoicePage} />
      <Route path="/register/student" component={RegisterStudentPage} />
      <Route path="/register/tutor" component={RegisterTutorPage} />

      <Route path="/student/dashboard" component={StudentDashboard} />
      <Route path="/student/find-tutor" component={FindTutorPage} />
      <Route path="/student/sessions" component={StudentSessionsPage} />
      <Route path="/student/materials" component={StudentMaterialsPage} />

      <Route path="/tutor/dashboard" component={TutorDashboardPage} />
      <Route path="/tutor/sessions" component={TutorSessionsPage} />
      <Route path="/tutor/earnings" component={TutorEarningsPage} />
      <Route path="/tutor/availability" component={TutorAvailabilityPage} />
      <Route path="/tutor/materials" component={TutorMaterialsPage} />

      <Route path="/messages" component={MessagesPage} />
      <Route path="/session/:id" component={VideoRoom} />

      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsersPage} />
      <Route path="/admin/transactions" component={AdminTransactionsPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
