export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#09080f] text-white">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.06] bg-[#09080f]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">Meridian</span>
          <div className="hidden sm:flex items-center gap-8">
            <a href="#features" className="text-sm text-white/45 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-white/45 hover:text-white transition-colors">How it works</a>
          </div>
          <a href="/login" className="text-sm bg-white text-black px-4 py-1.5 rounded-lg font-medium hover:bg-white/90 transition-colors">
            Get started
          </a>
        </div>
      </nav>

      {/* Hero — headline + CTAs, then full-width proof below */}
      <section className="pt-36 pb-0 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <h1 className="text-5xl lg:text-[3.6rem] font-bold tracking-tight leading-[1.06] mb-6">
              Every decision your team makes in a meeting, in one searchable place.
            </h1>
            <p className="text-white/55 text-lg leading-relaxed mb-10">
              Meridian connects to Zoom, Google Meet and Slack and extracts decisions, action items and meeting health automatically. No notes to write.
            </p>
            <div className="flex items-center gap-4">
              <a href="/login" className="bg-white text-black hover:bg-white/90 transition-colors px-5 py-2.5 rounded-lg text-sm font-medium">
                Get started
              </a>
              <a href="#how-it-works" className="text-sm text-white/45 hover:text-white transition-colors">
                See how it works →
              </a>
            </div>
          </div>

          {/* Full-width product mockup — proof immediately below headline */}
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#09080f] to-transparent z-10 pointer-events-none" />
            <ProductMockup />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-16 max-w-sm leading-snug">
            Three things your current setup doesn&apos;t do.
          </h2>

          <div className="divide-y divide-white/[0.06]">
            {[
              {
                label: "Decision Log",
                headline: "Every decision, with the reasoning behind it.",
                body: "Each call is transcribed and analyzed. Decisions are extracted with full context: who was in the room, what alternatives were considered, and why the team landed where it did. Searchable across your entire history.",
                tags: ["AI-extracted", "Full context", "Searchable"],
              },
              {
                label: "Meeting Health",
                headline: "Spot patterns before they become problems.",
                body: "Efficiency score per meeting, talk time per person, and recurring topics that keep coming up without resolution. All surfaced automatically after each call.",
                tags: ["Efficiency score", "Talk time", "Recurring topics"],
              },
              {
                label: "Pre-Meeting Brief",
                headline: "Walk into every meeting knowing what's still open.",
                body: "30 minutes before each call, Meridian surfaces what's unresolved from last time, relevant past decisions, and open action items that still need an owner.",
                tags: ["Auto-generated", "Open items", "Past decisions"],
              },
            ].map((f) => (
              <div key={f.label} className="grid lg:grid-cols-[220px_1fr] gap-8 py-10">
                <div>
                  <span className="text-xs text-white/40 font-medium uppercase tracking-widest">{f.label}</span>
                  <p className="text-base font-semibold mt-2 leading-snug">{f.headline}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm leading-relaxed mb-5">{f.body}</p>
                  <div className="flex flex-wrap gap-2">
                    {f.tags.map((t) => (
                      <span key={t} className="text-xs text-white/35 border border-white/[0.1] px-3 py-1 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — alternating left/right per step */}
      <section id="how-it-works" className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-16">Connect once. It runs itself.</h2>

          <div className="space-y-6">
            {[
              {
                n: "01",
                title: "Connect your meetings",
                body: "Link your Zoom or Google Meet account via OAuth. Takes about 90 seconds. Meridian is notified automatically when any meeting ends and posts summaries to Slack.",
                flip: false,
                detail: (
                  <div className="bg-[#120f1e] border border-white/[0.07] rounded-2xl p-6 space-y-3">
                    <p className="text-xs text-white/35 uppercase tracking-widest">Supported platforms</p>
                    <div className="space-y-2">
                      {["Zoom", "Google Meet", "Slack"].map((p) => (
                        <div key={p} className="flex items-center gap-3 text-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <span className="text-white/70">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                n: "02",
                title: "Every call is processed automatically",
                body: "Transcripts are pulled and analyzed. Decisions, action items, and health signals are extracted within minutes of your call ending.",
                flip: true,
                detail: (
                  <div className="bg-[#120f1e] border border-white/[0.07] rounded-2xl p-6">
                    <p className="text-xs text-white/35 uppercase tracking-widest mb-3">Extracted from each call</p>
                    <div className="space-y-2">
                      {[
                        { label: "Decisions made", val: "with full context" },
                        { label: "Action items", val: "owner + due date" },
                        { label: "Efficiency score", val: "0-100" },
                        { label: "Talk time", val: "per participant" },
                      ].map((r) => (
                        <div key={r.label} className="flex items-center justify-between text-sm">
                          <span className="text-white/60">{r.label}</span>
                          <span className="text-white/30 text-xs">{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                n: "03",
                title: "Your team builds on what it knows",
                body: "Browse the decision log, check open action items, and get a brief before your next call. No manual work, ever.",
                flip: false,
                detail: (
                  <div className="bg-[#120f1e] border border-white/[0.07] rounded-2xl p-6">
                    <p className="text-xs text-white/40 font-medium uppercase tracking-widest mb-2">Pre-meeting brief</p>
                    <p className="text-sm text-white/70 leading-relaxed">
                      Sent 30 minutes before each call with open items, past decisions, and suggested topics.
                    </p>
                  </div>
                ),
              },
            ].map((step) => (
              <div
                key={step.n}
                className={`grid lg:grid-cols-2 gap-8 items-center border border-white/[0.07] rounded-2xl p-8 ${step.flip ? "lg:[direction:rtl]" : ""}`}
              >
                <div className={step.flip ? "lg:[direction:ltr]" : ""}>
                  <span className="text-3xl font-bold text-white/10 block mb-4">{step.n}</span>
                  <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{step.body}</p>
                </div>
                <div className={step.flip ? "lg:[direction:ltr]" : ""}>
                  {step.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Works with */}
      <section className="py-14 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-x-10 gap-y-3">
          <span className="text-xs text-white/25 uppercase tracking-widest">Works with</span>
          {["Zoom", "Google Meet", "Google Calendar", "Slack"].map((t) => (
            <span key={t} className="text-sm text-white/40 font-medium">{t}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-2xl">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-6">
            Your team&apos;s decisions deserve better than memory.
          </h2>
          <p className="text-white/40 text-base mb-10">Free to use. No credit card required.</p>
          <a href="/login" className="inline-block bg-white text-black px-7 py-3 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors">
            Get started
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-7 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-sm text-white/30">Meridian</span>
          <span className="text-xs text-white/20">Team memory and meeting intelligence</span>
        </div>
      </footer>
    </main>
  );
}

function ProductMockup() {
  return (
    <div className="bg-[#120f1e] border border-white/[0.09] rounded-t-2xl overflow-hidden shadow-[0_-8px_60px_rgba(0,0,0,0.5)]">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
        <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
        <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
        <span className="text-[11px] text-white/20 ml-2 font-[family-name:var(--font-geist-mono)]">meridian / meetings</span>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-44 shrink-0 border-r border-white/[0.05] p-3 space-y-0.5 hidden md:block">
          {["Dashboard", "Meetings", "Decisions", "Action Items", "Settings"].map((item, i) => (
            <div
              key={item}
              className={`px-2 py-1.5 rounded-lg text-[12px] ${i === 1 ? "bg-white/[0.06] text-white" : "text-white/35"}`}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Meetings list */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Recent Meetings</p>
              <div className="space-y-1.5">
                {[
                  { score: 87, title: "Q4 Planning", meta: "Nov 18 · 52m", scoreClass: "text-emerald-400 bg-emerald-500/10", decisions: 4 },
                  { score: 61, title: "Engineering Sync", meta: "Nov 15 · 30m", scoreClass: "text-amber-400 bg-amber-500/10", decisions: 2 },
                  { score: 94, title: "Product Review", meta: "Nov 12 · 45m", scoreClass: "text-emerald-400 bg-emerald-500/10", decisions: 6 },
                ].map((row) => (
                  <div key={row.title} className="flex items-center gap-2.5 bg-[#120f1e] rounded-xl px-3 py-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold shrink-0 ${row.scoreClass}`}>
                      {row.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-white truncate">{row.title}</p>
                      <p className="text-[10px] text-white/35">{row.meta}</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 shrink-0">Processed</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decisions list */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Recent Decisions</p>
              <div className="space-y-1.5">
                {[
                  { text: "Migrate auth service to Supabase by end of Q4.", from: "Q4 Planning" },
                  { text: "Ship mobile app feature freeze November 29.", from: "Product Review" },
                  { text: "Move standup to 9:30am starting next week.", from: "Engineering Sync" },
                ].map((d) => (
                  <div key={d.text} className="bg-[#120f1e] rounded-xl px-3 py-2.5">
                    <p className="text-[12px] text-white/80 leading-snug line-clamp-2">{d.text}</p>
                    <p className="text-[10px] text-white/30 mt-1">{d.from}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
