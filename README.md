# FXMacroData for AnythingLLM

Connect your FXMacroData subscription to AnythingLLM workspace agents for cross-currency macro research, full available indicator histories and release-calendar analysis. Bring readable data tables and source metadata into your workspace conversations.

**[Subscribe to FXMacroData](https://fxmacrodata.com/subscribe?utm_source=github&utm_medium=referral&utm_campaign=open_source_integrations&utm_content=anythingllm_subscribe)** for access to covered non-USD datasets and full available history.

Evaluate the Skill before subscribing with public USD data and the default USD daily briefing; these requests require no FXMacroData key or account.

The native agent Skill provides all 72 REST/MCP operations and a three-source USD daily briefing, with readable tables and full structured output.

## Install

Build with `npm install` and `npm run build`. Copy the runtime files listed in `HUB_FILES.json` into a folder named `fxmacrodata` under your AnythingLLM `storage/plugins/agent-skills` directory. Restart AnythingLLM, open Agent Skills, and enable FXMacroData Research. The same allowlisted files form the Hub-compatible ZIP; an administrator can import that archive through the native Hub installation flow when it is available there. This package does not assume a Hub listing exists.

Desktop and Docker deployments use their configured storage volume. Keep the files at the root of the Skill folder: `plugin.json` and `handler.js` must sit together. The handler bundles its runtime dependencies, so no npm installation is required inside AnythingLLM's Skill folder.

Ask your workspace agent: “Use FXMacroData to prepare the latest USD macroeconomic briefing and upcoming releases.” The tool defaults to `daily_briefing`; advanced tasks select the named operation and its structured `arguments`. Native registration retains the full operation parameter schemas.

## Connect your subscription

To connect your subscription, supply `FXMD_API_KEY` through your AnythingLLM deployment's secret environment, then set the Skill's authentication setting to `environment`. The setting contains only the word `environment`; never paste a credential there. Missing environment credentials return a clear setup error. The raw key is never stored in the Skill manifest or agent function configuration. Keep the setting at `public` when evaluating with no-key USD access.

The [capability matrix](CAPABILITIES.md) lists the 23 REST operations and 49 MCP tools, including each operation's parameters.

The daily briefing defaults to USD. Availability and access requirements vary by operation; protected data requires your own FXMacroData access. Missing observations and release times remain unavailable. FX quotes are reference data, not execution prices.

Results retain the complete redacted public payload, source dates and metadata. Readable tables show at most 50 rows and 16 columns each; their structured result preserves all rows for further analysis.

[FXMacroData](https://fxmacrodata.com/?utm_source=github&utm_medium=referral&utm_campaign=open_source_integrations&utm_content=anythingllm_readme) | [API documentation](https://fxmacrodata.com/documentation/reference?utm_source=github&utm_medium=referral&utm_campaign=open_source_integrations&utm_content=anythingllm_docs)

## Data and credentials

Requests go only to the canonical FXMacroData API and MCP service. Tool parameters accept only the named operation's public schema; credentials cannot be supplied as model arguments. Credentials remain private to each client and are redacted from returned content, tables and errors. Nothing is sent at import time. Public mode never automatically reads a machine credential.

Website links carry static campaign tags to attribute visits. Data requests and upstream source links are untagged. There are no analytics calls or user identifiers.

Use returned official source links and timestamps when citing data. Distinguish survey consensus, central-bank projections and FXMacroData-generated scenarios. Never infer a future release time from historical cadence.

## Build and test

From this package directory, run `npm install`, `npm test`, `npm run typecheck`, and `npm run build`. `npm run build` writes the bundled `handler.js` and dependency notices. Use `HUB_FILES.json` to assemble the native Skill directory or Hub ZIP described above. Apache-2.0 licensing covers this integration; API access and data reuse remain subject to [FXMacroData terms](https://fxmacrodata.com/terms).
