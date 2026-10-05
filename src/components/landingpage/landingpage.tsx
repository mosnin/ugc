import Header from "./header";
import HeroSection from "./herosection";
import FeaturesBlock from "./feature-block";
import Faq from "./faq";
import Footer from "./footer";
import CallToAction from "./ctasection";
import Testimonial from "./testimonial";
import Pricing from "./pricing";
import Container from "./container";
import { GeistSans } from "geist/font/sans";

const LandingPage = () => {
  return (
    <div
      className={`${GeistSans.className} min-h-screen bg-white dark:bg-black`}
    >
      <Header />
      <Container>
        <HeroSection />
        <FeaturesBlock />
        <Pricing />
        <Testimonial />
        <Faq />
        <CallToAction />
        <Footer />
      </Container>
    </div>
  );
};

export default LandingPage;
