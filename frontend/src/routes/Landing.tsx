import { useDocumentTitle } from "../lib/useDocumentTitle";
import LandingHero from "../components/landing/LandingHero";
import TravelTicker from "../components/landing/TravelTicker";
import StatStrip from "../components/landing/StatStrip";
import HowItWorks from "../components/landing/HowItWorks";
import AgentCards from "../components/landing/AgentCards";
import WhatYouGet from "../components/landing/WhatYouGet";
import FeaturedDestinations from "../components/landing/FeaturedDestinations";
import InteractiveRouteMap from "../components/landing/InteractiveRouteMap";
import TravelFaq from "../components/landing/TravelFaq";

/**
 * Editorial Landing Page (FOUND-04, LAND-01..LAND-06).
 *
 * Enhanced luxury travel experience:
 * - Clear AI travel planning value with primary and secondary CTAs (LAND-01)
 * - Honest 5–15 minute planning expectation and truthful metrics (LAND-02)
 * - Accurate multi-agent specialist architecture (LAND-03)
 * - Transparent explanation of deliverables with an explicit example structure (LAND-04)
 * - Custom brand logo and display serif typography (LAND-06)
 * - Curated journeys, interactive route topology, and concierge FAQ
 */
export default function Landing() {
  useDocumentTitle(
    "Waynora",
    "AI trip planning — tell us where you want to go",
    {
      skipTitleSuffix: true,
    },
  );

  return (
    <div className="flex flex-col bg-canvas text-ink">
      <LandingHero />
      <TravelTicker />
      <StatStrip />
      <HowItWorks />
      <AgentCards />
      <WhatYouGet />
      <FeaturedDestinations />
      <InteractiveRouteMap />
      <TravelFaq />
    </div>
  );
}
