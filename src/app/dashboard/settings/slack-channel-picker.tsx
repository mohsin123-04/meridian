"use client";

import { useEffect, useState, useTransition } from "react";
import { saveSlackChannel } from "./actions";

type Channel = { id: string; name: string; is_private: boolean };

export default function SlackChannelPicker({ savedChannelId }: { savedChannelId?: string }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/integrations/slack/channels")
      .then((r) => r.json())
      .then((data) => {
        setChannels(data.channels ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const channelId = e.target.value;
    if (!channelId) return;
    setSaved(false);
    const fd = new FormData();
    fd.set("channel_id", channelId);
    startTransition(async () => {
      await saveSlackChannel(fd);
      setSaved(true);
    });
  }

  if (loading) {
    return <div className="h-9 bg-white/[0.04] border border-white/[0.07] rounded-lg animate-pulse" />;
  }

  if (!channels.length) {
    return <p className="text-xs text-white/35">No channels found. Make sure the bot is in your workspace.</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <select
        onChange={handleChange}
        defaultValue={savedChannelId ?? ""}
        disabled={isPending}
        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 disabled:opacity-50"
      >
        <option value="" disabled className="bg-[#09080f]">Select a channel...</option>
        {channels.map((c) => (
          <option key={c.id} value={c.id} className="bg-[#09080f]">
            {c.is_private ? "🔒 " : "#"}{c.name}
          </option>
        ))}
      </select>
      {saved && <span className="text-xs text-emerald-400 shrink-0">Saved</span>}
    </div>
  );
}
