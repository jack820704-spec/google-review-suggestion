export const PLANS = {
  free_trial: {
    name: "Free Trial",
    price: 0,
    reply_limit: 5,
    history_days: 7,
    features: {
      auto_sync: false, keyword_trends: false, custom_keywords: false,
      multi_language: false, crisis_alerts: false, weekly_report: false,
      monthly_pdf: false, reply_templates: false, rating_goals: false,
      ai_style_learning: false, competitor_tracking: false,
      reply_tracking: false, custom_tone: false, priority_support: false, api_access: false,
    },
  },
  starter: {
    name: "Starter",
    price: 39,
    reply_limit: 30,
    history_days: 30,
    features: {
      auto_sync: false, keyword_trends: false, custom_keywords: false,
      multi_language: false, crisis_alerts: false, weekly_report: false,
      monthly_pdf: false, reply_templates: false, rating_goals: false,
      ai_style_learning: false, competitor_tracking: false,
      reply_tracking: false, custom_tone: false, priority_support: false, api_access: false,
    },
  },
  growth: {
    name: "Growth",
    price: 99,
    reply_limit: 150,
    history_days: 365,
    features: {
      auto_sync: true, keyword_trends: true, custom_keywords: true,
      multi_language: true, crisis_alerts: true, weekly_report: true,
      monthly_pdf: true, reply_templates: true, rating_goals: true,
      ai_style_learning: false, competitor_tracking: false,
      reply_tracking: false, custom_tone: false, priority_support: false, api_access: false,
    },
  },
  pro: {
    name: "Pro",
    price: 199,
    reply_limit: Infinity,
    history_days: Infinity,
    features: {
      auto_sync: true, keyword_trends: true, custom_keywords: true,
      multi_language: true, crisis_alerts: true, weekly_report: true,
      monthly_pdf: true, reply_templates: true, rating_goals: true,
      ai_style_learning: true, competitor_tracking: true,
      reply_tracking: true, custom_tone: true, priority_support: true, api_access: true,
    },
  },
};

export function getPlan(key) {
  return PLANS[key] || PLANS.free_trial;
}

export function canUseFeature(planKey, feature) {
  return getPlan(planKey).features[feature] || false;
}

export function isOverLimit(planKey, used) {
  const { reply_limit } = getPlan(planKey);
  return reply_limit !== Infinity && used >= reply_limit;
}

export function usagePercent(planKey, used) {
  const { reply_limit } = getPlan(planKey);
  if (reply_limit === Infinity) return 0;
  return Math.min(100, Math.round((used / reply_limit) * 100));
}
