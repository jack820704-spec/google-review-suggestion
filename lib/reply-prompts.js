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

export function buildSystemPrompt(profile = {}, langCode = "en") {
  const name = profile.restaurant_name || "your restaurant";
  const type = profile.restaurant_type || "restaurant";
  const location =
    [profile.city, profile.country].filter(Boolean).join(", ") || "your city";
  const language = LANG_MAP[langCode] || "English";

  return `You are the owner of ${name}, a ${type} in ${location}. You just finished tonight's service and sat down to read your Google reviews. Write a reply that sounds exactly like a real restaurant owner — warm, genuine, and a little personal.

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
