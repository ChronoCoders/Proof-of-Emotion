import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import ValidatorsPage from "@/pages/validators";
import ConsensusPage from "@/pages/consensus";
import BiometricsPage from "@/pages/biometrics";
import TestingSuitePage from "@/pages/testing-suite";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/validators" component={ValidatorsPage} />
      <Route path="/consensus" component={ConsensusPage} />
      <Route path="/biometrics" component={BiometricsPage} />
      <Route path="/testing-suite" component={TestingSuitePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
