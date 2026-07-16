import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <header
      id="home"
      className="relative overflow-hidden text-white sm:min-h-[610px]"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(4,33,20,0.94), rgba(4,33,20,0.68) 48%, rgba(4,33,20,0.16)), url('/hero.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-center gap-8 pb-10 pt-[74px] sm:min-h-[610px] lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-[54px] lg:pt-16">
        <div>
          <p className="mb-[18px] inline-flex items-center gap-2.5 text-[0.88rem] font-black uppercase text-lime before:h-[3px] before:w-9 before:rounded-full before:bg-gold before:content-['']">
            Welcome Back
          </p>
          <h1 className="mb-[18px] max-w-[760px] text-[clamp(3.2rem,9vw,6.6rem)] uppercase leading-[0.88] tracking-normal">
            Maneri Premier League
          </h1>
          <p className="max-w-[740px] text-[1.08rem] text-white/80">
            A structured local cricket league built for disciplined competition, fair play,
            organized match management, and the next generation of Maneri cricket talent.
          </p>
          <div className="mt-7 flex flex-wrap gap-3.5">
            <Button as="a" href="#teams">
              View Teams
            </Button>
            <Button as="a" href="#management" variant="secondary">
              Meet Management
            </Button>
          </div>
        </div>
        <aside
          className="mb-3 self-auto rounded-lg bg-white/90 p-[22px] text-ink shadow-panel lg:self-end"
          aria-label="League summary"
        >
          <strong className="block text-[2rem] leading-none text-green">19 Nov 2025</strong>
          <span className="block font-bold text-muted">Officially established to raise local cricket standards</span>
        </aside>
      </div>
    </header>
  );
}
