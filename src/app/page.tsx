import { ArrowRight, Brain, BarChart3, CalendarClock, CheckCircle2, Zap, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">Meridian</span>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-white/50 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-white/50 hover:text-white transition-colors">How it works</a>
            <a href="/login" className="text-sm bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-white/90 transition-colors">
              Get started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/60 mb-8">
            <Zap size={13} className="text-violet-400" />
            Automated for Zoom and Google Meet
          </div>
          <h1 className="text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Your team has great meetings.
            <br />
            <span className="text-white/30">Nobody remembers them.</span>
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Meridian automatically captures decisions, tracks action items, and surfaces meeting health analytics — so your team builds on what it knows instead of repeating what it forgot.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="/login" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 transition-colors px-6 py-3 rounded-full font-medium text-sm">
              Start for free <ArrowRight size={16} />
            </a>
            <a href="#how-it-works" className="text-sm text-white/40 hover:text-white/70 transition-colors px-6 py-3">
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: "73%", label: "of decisions made in meetings are re-litigated within 2 weeks" },
            { value: "31 hrs", label: "per week lost by managers to unproductive meetings" },
            { value: "0", label: "tools track what was actually decided and by whom" },
          ].map((stat) => (
            <div key={stat.value}>
              <div className="text-3xl font-bold text-violet-400 mb-2">{stat.value}</div>
              <div className="text-sm text-white/40 leading-snug">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Everything your team forgets. Remembered.</h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">Three problems. One platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Brain size={22} className="text-violet-400" />,
                title: "Decision Log",
                description: "Every decision logged with full context — who was in the room, what alternatives were considered, and why. Searchable across your entire company history.",
                bullets: ["AI-extracted from transcripts", "Searchable decision history", "Decision threads across meetings"],
              },
              {
                icon: <BarChart3 size={22} className="text-violet-400" />,
                title: "Meeting Health",
                description: "Understand your team's meeting patterns before they become problems. Spot decision debt, unbalanced participation, and runaway recurring meetings.",
                bullets: ["Talk time distribution", "Recurring topic detection", "Efficiency scoring per meeting"],
              },
              {
                icon: <CalendarClock size={22} className="text-violet-400" />,
                title: "Pre-Meeting Brief",
                description: "30 minutes before every meeting, Meridian surfaces what's unresolved, what was decided last time, and what still needs an owner.",
                bullets: ["Auto-generated context brief", "Open action item rollup", "Relevant past decisions surfaced"],
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-7 hover:border-white/15 transition-colors">
                <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed mb-5">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-white/50">
                      <CheckCircle2 size={13} className="text-violet-400 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-28 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Set up once. Works forever.</h2>
            <p className="text-white/40 text-lg">No bots to invite. No notes to upload. Just connect and go.</p>
          </div>

          <div className="space-y-4">
            {[
              { step: "01", title: "Connect your calendar and meetings", body: "Link your Zoom or Google Meet account via OAuth. Meridian gets notified automatically when any meeting ends." },
              { step: "02", title: "We process every meeting instantly", body: "Transcripts are pulled, AI extracts decisions and action items, and health signals are computed — all within minutes of your call ending." },
              { step: "03", title: "Your team builds on what it knows", body: "Browse the decision log, check team analytics, and get a pre-meeting brief before your next call. No manual work required." },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 bg-white/[0.02] border border-white/5 rounded-2xl p-7">
                <span className="text-4xl font-bold text-white/10 shrink-0 w-12">{item.step}</span>
                <div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/30 text-sm uppercase tracking-widest mb-8">Works with your existing stack</p>
          <div className="flex items-center justify-center gap-10 flex-wrap">
            {["Zoom", "Google Meet", "Google Calendar", "Slack (soon)", "Jira (soon)"].map((tool) => (
              <span key={tool} className="text-white/40 text-sm font-medium">{tool}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-sm text-white/40 mb-6">
            <Shield size={14} className="text-violet-400" />
            Free to use. No credit card required.
          </div>
          <h2 className="text-5xl font-bold tracking-tight mb-6">
            Stop losing decisions to memory.
          </h2>
          <p className="text-white/40 text-lg mb-10">
            Join teams using Meridian to build institutional knowledge from every meeting.
          </p>
          <a href="/login" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 transition-colors px-8 py-4 rounded-full font-medium">
            Get started free <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-white/30 text-sm">Meridian</span>
          <span className="text-white/20 text-sm">Team memory and meeting intelligence</span>
        </div>
      </footer>
    </main>
  );
}
