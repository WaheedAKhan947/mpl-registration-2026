import Image from "next/image";
import Link from "next/link";
import { TERMS_META, TERMS_ARTICLES, TERMS_UNDERTAKING } from "@/lib/termsData";

export const metadata = {
  title: "Official Playing Conditions & Tournament Regulations — MPL",
  description: "Official MPL Playing Conditions & Tournament Regulations that every registered player must agree to.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-paper py-10">
      <div className="mx-auto w-[min(900px,calc(100%-32px))]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/#register"
            className="inline-flex items-center gap-2 font-extrabold text-green-dark hover:text-green"
          >
            ← Back to Registration
          </Link>
          <a
            href="/OFFICIALPLAYINGCONDITIONS.docx"
            className="inline-flex items-center gap-2 rounded-lg border border-ink/10 bg-white px-3.5 py-2 text-[0.85rem] font-extrabold text-green-dark shadow-sm hover:-translate-y-0.5 transition"
          >
            Download Original Document
          </a>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-panel sm:p-9">
          <div className="mb-8 flex flex-col items-center gap-3 border-b-2 border-gold/60 pb-7 text-center">
            <Image src="/logo.png" alt="MPL logo" width={56} height={56} />
            <h1 className="font-display text-2xl uppercase tracking-wide text-navy-dark sm:text-3xl">
              {TERMS_META.title}
            </h1>
            <p className="font-bold text-muted">{TERMS_META.issuedBy}</p>
            <p className="max-w-2xl text-[0.95rem] font-semibold text-ink/80">{TERMS_META.intro}</p>
          </div>

          <div className="grid gap-7">
            {TERMS_ARTICLES.map((article) => (
              <section key={article.heading} className="border-b border-ink/10 pb-6 last:border-b-0 last:pb-0">
                <h2 className="mb-2.5 text-[1.05rem] font-black text-green-dark">{article.heading}</h2>

                {article.points ? (
                  <ul className="grid gap-1.5 text-[0.92rem] font-semibold text-ink/85">
                    {article.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}

                {article.subList ? (
                  <div className="mt-2.5">
                    <p className="mb-1.5 text-[0.92rem] font-black text-ink/85">{article.subList.intro}</p>
                    <ul className="grid list-disc gap-1 pl-5 text-[0.92rem] font-semibold text-ink/85">
                      {article.subList.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {article.note ? (
                  <p className="mt-2.5 text-[0.92rem] font-bold italic text-muted">{article.note}</p>
                ) : null}

                {article.levels ? (
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                    {article.levels.map((lvl) => (
                      <div key={lvl.level} className="rounded-lg border border-ink/10 bg-[#fbfbf8] p-3.5">
                        <p className="mb-1 text-[0.85rem] font-black text-brand-red">{lvl.level}</p>
                        <p className="mb-1.5 text-[0.85rem] font-semibold text-ink/80">{lvl.desc}</p>
                        <p className="text-[0.82rem] font-extrabold text-green-dark">Penalty: {lvl.penalty}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {article.penalty ? (
                  <div className="mt-2.5 rounded-lg bg-[#ffe3df] px-3.5 py-2.5">
                    <p className="mb-1 text-[0.82rem] font-black text-brand-red">Penalty</p>
                    <ul className="grid gap-0.5 text-[0.88rem] font-bold text-ink/85">
                      {article.penalty.map((p) => (
                        <li key={p}>• {p}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ))}
          </div>

          <div className="mt-8 rounded-lg border-2 border-gold/60 bg-[#fbfbf8] p-6">
            <h2 className="mb-3 text-[1.05rem] font-black text-navy-dark">{TERMS_UNDERTAKING.intro}</h2>
            <ul className="grid list-disc gap-2.5 pl-5 text-[0.9rem] font-semibold text-ink/85">
              {TERMS_UNDERTAKING.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 font-black text-green-dark">{TERMS_UNDERTAKING.closing}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
