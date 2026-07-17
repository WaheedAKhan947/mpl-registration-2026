import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <header
      id="home"
      className="relative overflow-hidden text-white sm:min-h-[610px]"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(6,15,34,0.94), rgba(6,15,34,0.72) 48%, rgba(6,15,34,0.22)), url('/hero.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-center gap-8 pb-10 pt-[74px] sm:min-h-[610px] lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-[54px] lg:pt-16">
        <div>
          {/* <p
            className="mb-[18px] inline-flex origin-left animate-fade-up items-center gap-2.5 text-[0.88rem] font-black uppercase text-gold opacity-0 before:h-[3px] before:w-9 before:rounded-full before:bg-gold before:content-['']"
            style={{ animationDelay: "0ms" }}
          >
            Welcome Back
          </p> */}
          <h1
            className="mb-[18px] max-w-[760px] animate-fade-up text-[clamp(3.2rem,9vw,6.6rem)] uppercase leading-[0.88] tracking-normal opacity-0"
            style={{ animationDelay: "120ms" }}
          >
            Maneri Premier League
          </h1>
          <p
            className="max-w-[740px] animate-fade-up text-[1.08rem] text-white/80 opacity-0"
            style={{ animationDelay: "240ms" }}
          >
            A structured local cricket league built for disciplined competition, fair play,
            organized match management, and the next generation of Maneri cricket talent.
          </p>
          <div
            className="mt-7 flex animate-fade-up flex-wrap gap-3.5 opacity-0"
            style={{ animationDelay: "360ms" }}
          >
            <Button as="a" href="#teams" variant="gold">
              View Teams
            </Button>
            <Button as="a" href="#management" variant="secondary">
              Meet Management
            </Button>
          </div>
        </div>
        <aside
          className="mb-3 self-auto animate-fade-up rounded-lg border border-gold/30 bg-white/90 p-[22px] text-ink opacity-0 shadow-panel-navy lg:self-end"
          aria-label="League summary"
          style={{ animationDelay: "480ms" }}
        >
          <strong className="block text-[2rem] leading-none text-navy-dark">19 Nov 2025</strong>
          <span className="block font-bold text-muted">Officially established to raise local cricket standards</span>
        </aside>
      </div>
    </header>
  );
}
