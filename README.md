# Everlight v2

A family campaign companion for **The Five Days of Everlight**, November 23–27, 2026. Built with Next.js, Tailwind CSS, Supabase, and Vercel. AI narration is the default Dungeon Master; Justin is also a player and can override the AI from the DM console. There are four human heroes: Justin, Q, Harmony (9), and Taylor (5).

## Run locally

1. Install Node.js 20.9+ and run `npm install`.
2. Copy `.env.example` to `.env.local`. Configure `DM_PASSWORD` and a random `SESSION_SECRET`. Add `OPENAI_API_KEY` for live AI narration; without it, local mode clearly identifies its static narration preview.
3. Leave `EVERLIGHT_LOCAL_MODE=1` to run without production Supabase credentials. State is written to `everlight.local.json` and is for development only.
4. Run `npm run dev`. Open the DM portal on the laptop at `http://localhost:3000` or open it using the laptop's Wi-Fi IPv4 address.
5. For the phone test, connect both devices to the same Wi-Fi. Run `ipconfig`, find the laptop's Wi-Fi IPv4 address, and browse `http://<address>:3000` on the phone. Allow Node.js through Windows Firewall on Private networks if prompted. Create the four one-time QR invites in the DM portal. LAN reachability, browser microphone permission, and phone QR joining must be tested on the actual devices.

DM login is server-side. DM and player sessions use separate HttpOnly, SameSite=Lax cookies, so Justin can keep the DM console and his own player portal open in the same browser. Player APIs return only that player's character, delivered clues, and inventory. Invitation codes are single-use. No password or API key is committed.

## AI Dungeon Master, voice, and override

The player portals accept spoken input with browser speech recognition where supported and provide typed input as a fallback. The AI responds one short scene beat at a time using the server-side OpenAI Responses API, then the browser reads it aloud with speech synthesis. The DM console can preview narration, advance story checkpoints, switch to human override, and submit replacement narration. AI never rolls dice; people roll physical dice and enter the result on the DM dashboard. Voice capture depends on browser support and microphone permissions; phones generally require HTTPS for microphone access, so use typed input during a plain-HTTP LAN test.

The server sends only the active scene and clues already delivered to that player to the AI narrator. It instructs the AI not to reveal unrevealed clues or future scenes, to keep the game age-appropriate, and to treat all rolls as physical.

## Real family week comes first

The 32 household missions are optional ideas, not 32 new chores. Existing plans count and can be approved later, with no app use while the family is busy:

- Monday: groceries/shopping counts as cooperative progress; Friendsgiving is togetherness. Daily reading already planned earns a Gratitude Spark.
- Tuesday: if ASI is confirmed, keep it flexible. Teresa's volunteer bag-packing with food, drinks, and reusable warmers earns the Flame of Giving Back. Approve afterward.
- Wednesday: Frisco/Plano travel takes priority; a recap later advances the story.
- Thursday: Thanksgiving Grand Feast finale can happen before dinner if the family wants. The real meal is never gated by the app.
- Friday: optional epilogue and rewards; the main campaign is complete Thursday.

## Production: GitHub and Vercel

1. Create a private GitHub repository, commit this project, and push it.
2. In Supabase, create a project and run `supabase/migrations/202611220001_everlight.sql` in the SQL editor.
3. In Vercel, import the repository. Set `SESSION_SECRET`, `DM_PASSWORD`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `EVERLIGHT_LOCAL_MODE=0` in Production and Preview. Never prefix the OpenAI or Supabase service-role key with `NEXT_PUBLIC_`.
4. Deploy and visit the HTTPS domain. Log in, create the four player invitations, and share each one privately.

Supabase stores the campaign in a protected JSONB row. Server routes use the service-role key and validate DM/player sessions before reads and writes. The migration enables RLS and denies client roles. Never expose service credentials to browser code.

## How to play

- DM console: approve planned activities and optional missions; deliver clues; track the easel map; manage inventory, gold, spells, Sparks, physical dice checks, HP, turns, and enemies; choose the Thursday reconciliation or battle resolution.
- Players: each hero has a separate saved character and private portal. Players can review delivered clues and rewards, submit optional mission requests, and spend Sparks for a personal hint, reroll token, or protection token.
- Taylor: junior mode uses short read-aloud prompts, large choices, three simple powers, and age-safe tasks with adult supervision.
- Gratitude: Appreciation, Generosity, Togetherness, Thankfulness, and Giving Back. A failed roll never withholds an essential clue. Combat is optional and non-graphic; no permanent character death.

## Verification

`npm test` runs campaign and access-control smoke checks. `npm run build` performs production compilation. A LAN phone check requires the laptop and phone on the same Wi-Fi and must be confirmed on those devices; it cannot be inferred from localhost.


## Character scene art

Use Node.js 22.18 or newer. The four Pip checkpoint illustrations ship with the app. Each hero’s picture uses their last saved choice from an earlier checkpoint when available. It depicts the attempt and leaves the outcome open. When there is no saved choice, the script uses the current scene. The player can keep using an existing scene illustration while an action illustration is being generated.

- Preview the scene prompts without generating images: `npm run scene-art -- --dry-run --day 2 --checkpoint 5`.
- While playing locally, run `npm run scene-art -- --watch` from the project folder. With `OPENAI_API_KEY` set in `.env.local`, it checks the current checkpoint every 30 seconds and generates missing hero images under `.everlight-art`. An image appears on the player's adventure screen when ready.
- Generate ahead for a specific checkpoint with `npm run scene-art -- --day 2 --checkpoint 5`. Cached images are skipped. Each new checkpoint can make up to four paid image requests.
- For a deployed game, apply the private scene-art bucket migration and run `npm run scene-art -- --watch --remote` on a trusted machine with the same Supabase URL and service-role key as the deployed app. The script watches the deployed campaign and uploads to the private bucket, and Vercel serves each image through the authenticated player session. Keep the watcher running during play. The API key and service-role key remain on the trusted machine or server.
