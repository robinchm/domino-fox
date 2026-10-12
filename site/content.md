<!-- Source of truth for https://robinchm.com/domino-fox/.
     Edit this file, then build with: node site/build.mjs -->

# domino-fox

domino-fox is a Firefox extension that puts an LLM agent in the browser
sidebar. You chat; it reads and manipulates the page in the current tab —
extracting what you need and acting where you point it.

You bring your own API keys: requests go straight from your browser to the
provider you configured. Everything stays local — no telemetry, no accounts,
no server in the middle.

## What it can do

- **Read and act on the page.** The agent works through a toolbox that can
  inspect the DOM, extract structured content, and perform actions in the
  current tab.
- **Drop to JavaScript when tools aren't enough.** `evaluate_js` runs code
  in the page for the odd cases the built-in tools don't cover.
- **Userscripts and workflows.** Beyond one-off chats, the LLM can author
  reusable userscripts and multi-tab workflow programs — written by you, by
  the agent, or by both together.
- **Scripts as tools.** Registered workflows become agent tools
  (script-as-tool), so your own automations are callable mid-conversation
  like any built-in capability.
- **Bookmarks, history, downloads.** Integration with browser data is
  available; each class of data sits behind an explicit opt-in gate.
- **Sync across devices.** Scripts and settings follow you via the sync
  server — small, and self-hostable.
- **A marketplace for scripts.** Share and install userscripts and
  workflows through the market server, also self-hostable.

## Install

1. Download the signed extension:
   [domino-fox {{LATEST_VERSION}}]({{LATEST_LINK}}).
2. Open the `.xpi` in Firefox — drag it onto `about:addons`, or use
   File → Open File. Firefox verifies the Mozilla signature before
   installing.
3. Open the sidebar (`Ctrl+B`, or ☰ → Sidebar), then add your API key in
   the settings panel.

Older releases are listed on the [downloads page](download/).

## Self-hosting

The extension's sync and market clients default to the public endpoints,
`https://robinchm.com/domino-fox/sync` and
`https://robinchm.com/domino-fox/market`. Both services are small and can
be self-hosted — point the extension at your own instance in its settings.
