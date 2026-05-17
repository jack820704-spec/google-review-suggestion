// Shared owner-voice prompts for every AI reply generator in the app.
//
// One source of truth so /api/generate-reply, the Places auto-sync pipeline
// (lib/places-sync.js → ingestReview), and the inbound email parser all
// speak with the same Western, casual-but-genuine restaurant owner voice.
//
// Three styles are exposed:
//   - warm:         most casual, friend who happens to own the place
//   - professional: still genuine, slightly more polished (fine-dining brand voice)
//   - brief:        2–3 short sentences, punchy and confident
//
// On top of that, profile.ai_preferences (set in Settings → AI Reply
// Preferences) layers in restaurant-specific tuning: house style, three
// tone sliders, owner name sign-off, brand voice paragraph, banned /
// required words (Pro), and length target (Pro).

const LANG_MAP = {
  en: "English",
  zh: "Traditional Chinese",
  vi: "Vietnamese",
  fr: "French",
  es: "Spanish",
  ja: "Japanese",
};

export const STYLES = ["warm", "professional", "brief"];

export const STYLE_NOTES = {
  warm:
    "Warm & Personal style — sound like a friend who happens to own the place. Most casual. A little playful is welcome.",
  professional:
    "Professional & Gracious style — still genuine and warmly human, just slightly more polished and composed. Good for a fine-dining brand voice. Never corporate.",
  brief:
    "Brief & Direct style — wrap it up in 2–3 short sentences. Punchy, confident, no filler.",
};

// Per-restaurant-style note. Layered on top of the per-reply style above.
const RESTAURANT_STYLE_NOTES = {
  "Fine Dining":
    "House style: elegant and formal — refined vocabulary, composed tone, never stuffy. Treat each reply like correspondence from a maître d'.",
  "Casual Dining":
    "House style: warm and approachable — relaxed everyday voice, like chatting across the counter.",
  "Fast Casual":
    "House style: short and direct — punchy, friendly, no fluff. Get in, thank them, get out.",
  "Izakaya / Asian Fusion":
    "House style: lively and personable — a little playful, real personality, not corporate. Borrow the energy of a busy izakaya owner.",
  "Café & Brunch":
    "House style: warm and a bit literary — cosy, light, neighbourhood-café energy. Mention things that evoke a sense of place when natural.",
};

// Tone sliders are stored 0–100; describe the position in plain English
// so the model has a clear directive rather than a number.
function describeSlider(value, lowLabel, midLabel, highLabel) {
  const v = typeof value === "number" ? value : 50;
  if (v <= 25) return `strongly ${lowLabel}`;
  if (v <= 45) return `lean ${lowLabel}`;
  if (v <= 55) return midLabel;
  if (v <= 75) return `lean ${highLabel}`;
  return `strongly ${highLabel}`;
}

// Map a target length preference to a word range.
const LENGTH_TARGETS = {
  short: { min: 30, max: 50, label: "30–50 words" },
  medium: { min: 50, max: 80, label: "50–80 words" },
  long: { min: 80, max: 120, label: "80–120 words" },
};

// Build the preference block appended to the base owner-voice system prompt.
// Empty / unset preferences contribute nothing — the default prompt stays clean.
function buildPreferenceBlock(prefs = {}, plan = "free_trial") {
  const lines = [];
  const isPro = plan === "pro";

  if (prefs.restaurant_style && RESTAURANT_STYLE_NOTES[prefs.restaurant_style]) {
    lines.push(`- ${RESTAURANT_STYLE_NOTES[prefs.restaurant_style]}`);
  }

  // Tone sliders — only include if explicitly set (the form defaults to 50).
  const toneBits = [];
  if (typeof prefs.tone_formality === "number") {
    toneBits.push(`formality: ${describeSlider(prefs.tone_formality, "formal", "balanced", "casual")}`);
  }
  if (typeof prefs.tone_warmth === "number") {
    toneBits.push(`warmth: ${describeSlider(prefs.tone_warmth, "reserved", "balanced", "warm")}`);
  }
  if (typeof prefs.tone_detail === "number") {
    toneBits.push(`detail: ${describeSlider(prefs.tone_detail, "brief", "balanced", "detailed")}`);
  }
  if (toneBits.length > 0) {
    lines.push(`- Tone calibration: ${toneBits.join("; ")}.`);
  }

  if (prefs.owner_name && prefs.owner_name.trim()) {
    lines.push(
      `- Sign off the reply with an em-dash, the owner's first name, and "Owner". Example: "— ${prefs.owner_name.trim()}, Owner". Place this on its own final line.`
    );
  }

  if (prefs.brand_voice && prefs.brand_voice.trim()) {
    lines.push(
      `- Brand essence to weave in (do not quote verbatim, just let it shape your voice): "${prefs.brand_voice.trim()}".`
    );
  }

  // Pro-only preferences
  if (isPro) {
    const banned = Array.isArray(prefs.banned_words) ? prefs.banned_words.filter(Boolean) : [];
    if (banned.length > 0) {
      lines.push(`- NEVER use these words or phrases: ${banned.map((w) => `"${w}"`).join(", ")}. Rephrase if needed.`);
    }
    const required = Array.isArray(prefs.required_words) ? prefs.required_words.filter(Boolean) : [];
    if (required.length > 0) {
      lines.push(`- ALWAYS include at least one of these signature phrases naturally: ${required.map((w) => `"${w}"`).join(", ")}.`);
    }
    if (prefs.length_preference && LENGTH_TARGETS[prefs.length_preference]) {
      const t = LENGTH_TARGETS[prefs.length_preference];
      lines.push(`- Target reply length for the Warm and Professional styles: ${t.label}. (Brief & Direct still stays 2–3 sentences regardless.)`);
    }
  }

  if (lines.length === 0) return "";
  // Important: these preferences FINE-TUNE the chosen reply style — they do
  // NOT replace it. The user message carries the active style directive
  // (Warm & Personal / Professional & Gracious / Brief & Direct) and that
  // wins on overall shape (sentence count, casualness, length floor/ceiling).
  // Preferences shape the personality within that shape: a Brief reply for
  // an Izakaya is still brief, just more playful; a Warm reply for Fine
  // Dining is still warm, just more composed.
  return `\n\nOwner-specific fine-tuning (apply WITHIN the active reply style — do NOT use these to change the style itself; the style directive in the user message always wins on length and overall shape):\n${lines.join("\n")}`;
}

export function buildSystemPrompt(profile = {}, langCode = "en") {
  const name = profile.restaurant_name || "your restaurant";
  const type = profile.restaurant_type || "restaurant";
  const location =
    [profile.city, profile.country].filter(Boolean).join(", ") || "your city";
  const language = LANG_MAP[langCode] || "English";

  const base = `You are the owner of ${name}, a ${type} in ${location}. You just finished tonight's service and sat down to read your Google reviews. Write a reply that sounds exactly like a real restaurant owner — warm, genuine, and a little personal.

Rules:
- Start with the reviewer's first name (Hey Sarah! / Thanks Marcus! / Oh wow, James —)
- Sound like a human, not a PR team
- For 5-star reviews: be genuinely excited, mention ONE specific thing they said, invite them back with something personal
- For 4-star reviews: thank them warmly, acknowledge the minor issue briefly, show you care about getting it right
- For 1-2 star reviews: apologize sincerely (no excuses), acknowledge exactly what went wrong, invite them to contact you directly to make it right
- Use casual contractions (we're, you'll, can't, don't)
- Avoid ALL corporate phrases: never say "we apologize for any inconvenience", "thank you for your valuable feedback", "we strive to", "it is our goal"
- Length: 50-80 words max
- End with something warm and human (Can't wait to see you again! / Hope to make it right next time / You made our night reading this)

Write in ${language}.`;

  return base + buildPreferenceBlock(profile.ai_preferences, profile.plan);
}

// Build the user-side message — surfaces the reviewer's name and star rating
// so the model can follow the "Start with the reviewer's first name" rule
// and apply the right tone-by-rating branch.
export function buildUserPrompt(review = {}, styleNote = "") {
  const reviewer = review.reviewer_name || "the guest";
  const stars = review.stars ?? "?";
  return `Review from ${reviewer} (${stars}★): "${review.content || ""}"

${styleNote}`;
}
