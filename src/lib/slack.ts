export async function postMeetingSummary({
  botToken,
  channelId,
  meetingId,
  title,
  startedAt,
  decisions,
  actionItems,
  efficiencyScore,
  appUrl,
}: {
  botToken: string;
  channelId: string;
  meetingId: string;
  title: string | null;
  startedAt: string | null;
  decisions: { summary: string }[];
  actionItems: { description: string; owner_name: string | null }[];
  efficiencyScore: number | null;
  appUrl: string;
}) {
  const meetingTitle = title ?? "Untitled meeting";
  const date = startedAt
    ? new Date(startedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : "";

  const blocks: object[] = [
    {
      type: "header",
      text: { type: "plain_text", text: meetingTitle },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: [
            date,
            efficiencyScore != null ? `Efficiency *${efficiencyScore}/100*` : null,
          ]
            .filter(Boolean)
            .join("  ·  "),
        },
      ],
    },
  ];

  if (decisions.length > 0) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Decisions (${decisions.length})*\n${decisions
          .slice(0, 5)
          .map((d) => `• ${d.summary}`)
          .join("\n")}${decisions.length > 5 ? `\n_...and ${decisions.length - 5} more_` : ""}`,
      },
    });
  }

  if (actionItems.length > 0) {
    if (decisions.length === 0) blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Action Items (${actionItems.length})*\n${actionItems
          .slice(0, 5)
          .map((a) => `• ${a.owner_name ? `${a.owner_name}: ` : ""}${a.description}`)
          .join("\n")}${actionItems.length > 5 ? `\n_...and ${actionItems.length - 5} more_` : ""}`,
      },
    });
  }

  blocks.push({ type: "divider" });
  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: { type: "plain_text", text: "View meeting" },
        url: `${appUrl}/dashboard/meetings/${meetingId}`,
      },
    ],
  });

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${botToken}`,
    },
    body: JSON.stringify({
      channel: channelId,
      text: `Meeting summary: ${meetingTitle}`,
      blocks,
    }),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
  return data;
}

export async function listSlackChannels(botToken: string): Promise<{ id: string; name: string; is_private: boolean }[]> {
  const res = await fetch(
    "https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200&exclude_archived=true",
    { headers: { Authorization: `Bearer ${botToken}` } }
  );
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
  return (data.channels as { id: string; name: string; is_private: boolean }[]).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
