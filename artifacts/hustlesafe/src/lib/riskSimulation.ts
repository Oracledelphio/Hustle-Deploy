export interface DailyGdsForecast {
  zone: string;
  daily_forecast: Record<string, number>;
}

export const baselineGdsData: DailyGdsForecast[] = [
  {
    "zone": "koramangala",
    "daily_forecast": { "2026-04-16": 18, "2026-04-17": 17, "2026-04-18": 23, "2026-04-19": 19, "2026-04-20": 16, "2026-04-21": 14, "2026-04-22": 16, "2026-04-23": 15, "2026-04-24": 21, "2026-04-25": 30, "2026-04-26": 24, "2026-04-27": 23, "2026-04-28": 20, "2026-04-29": 23, "2026-04-30": 19, "2026-05-01": 24 }
  },
  {
    "zone": "indiranagar",
    "daily_forecast": { "2026-04-16": 16, "2026-04-17": 19, "2026-04-18": 21, "2026-04-19": 21, "2026-04-20": 15, "2026-04-21": 16, "2026-04-22": 14, "2026-04-23": 16, "2026-04-24": 23, "2026-04-25": 28, "2026-04-26": 26, "2026-04-27": 21, "2026-04-28": 22, "2026-04-29": 20, "2026-04-30": 17, "2026-05-01": 26 }
  },
  {
    "zone": "whitefield",
    "daily_forecast": { "2026-04-16": 17, "2026-04-17": 18, "2026-04-18": 20, "2026-04-19": 22, "2026-04-20": 14, "2026-04-21": 15, "2026-04-22": 17, "2026-04-23": 14, "2026-04-24": 24, "2026-04-25": 31, "2026-04-26": 25, "2026-04-27": 22, "2026-04-28": 21, "2026-04-29": 24, "2026-04-30": 20, "2026-05-01": 23 }
  },
  {
    "zone": "electronic_city",
    "daily_forecast": { "2026-04-16": 15, "2026-04-17": 17, "2026-04-18": 24, "2026-04-19": 18, "2026-04-20": 16, "2026-04-21": 13, "2026-04-22": 15, "2026-04-23": 17, "2026-04-24": 20, "2026-04-25": 27, "2026-04-26": 26, "2026-04-27": 20, "2026-04-28": 23, "2026-04-29": 21, "2026-04-30": 18, "2026-05-01": 27 }
  },
  {
    "zone": "hsr_layout",
    "daily_forecast": { "2026-04-16": 19, "2026-04-17": 16, "2026-04-18": 22, "2026-04-19": 20, "2026-04-20": 17, "2026-04-21": 15, "2026-04-22": 14, "2026-04-23": 16, "2026-04-24": 22, "2026-04-25": 30, "2026-04-26": 23, "2026-04-27": 24, "2026-04-28": 19, "2026-04-29": 22, "2026-04-30": 20, "2026-05-01": 25 }
  },
  {
    "zone": "btm_layout",
    "daily_forecast": { "2026-04-16": 16, "2026-04-17": 20, "2026-04-18": 21, "2026-04-19": 19, "2026-04-20": 14, "2026-04-21": 16, "2026-04-22": 15, "2026-04-23": 14, "2026-04-24": 23, "2026-04-25": 28, "2026-04-26": 27, "2026-04-27": 21, "2026-04-28": 22, "2026-04-29": 20, "2026-04-30": 17, "2026-05-01": 24 }
  },
  {
    "zone": "marathahalli",
    "daily_forecast": { "2026-04-16": 18, "2026-04-17": 17, "2026-04-18": 23, "2026-04-19": 21, "2026-04-20": 15, "2026-04-21": 14, "2026-04-22": 16, "2026-04-23": 15, "2026-04-24": 24, "2026-04-25": 31, "2026-04-26": 24, "2026-04-27": 22, "2026-04-28": 20, "2026-04-29": 23, "2026-04-30": 19, "2026-05-01": 26 }
  },
  {
    "zone": "jayanagar",
    "daily_forecast": { "2026-04-16": 17, "2026-04-17": 18, "2026-04-18": 20, "2026-04-19": 19, "2026-04-20": 16, "2026-04-21": 15, "2026-04-22": 14, "2026-04-23": 16, "2026-04-24": 21, "2026-04-25": 29, "2026-04-26": 25, "2026-04-27": 23, "2026-04-28": 21, "2026-04-29": 22, "2026-04-30": 18, "2026-05-01": 24 }
  }
];

const ZONE_BASELINE_PREMIUMS: Record<string, number> = {
  koramangala: 450,
  indiranagar: 420,
  whitefield: 395,
  electronic_city: 380,
  hsr_layout: 410,
  btm_layout: 390,
  marathahalli: 405,
  jayanagar: 385,
};

function getIsoWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

export function calculateDailyRisk(zoneId: string, dateStr: string): number {
  const zoneData = baselineGdsData.find(z => z.zone === zoneId) || baselineGdsData[0];
  
  if (zoneData.daily_forecast[dateStr]) {
    return zoneData.daily_forecast[dateStr];
  }
  
  // Fallback to nearest date if strictly out of exact bounds, or just take an average 
  // For the demo scope, returning the 2026-04-16 base is a fine fallback.
  return zoneData.daily_forecast["2026-04-16"] || 18;
}

export function generateHourlyRiskVariance(dailyBaseScore: number): number[] {
  const multipliers = [
    // 0-5
    0.58, 0.54, 0.52, 0.50, 0.49, 0.56,
    // 6-11
    0.72, 0.88, 1.02, 1.14, 1.08, 0.97,
    // 12-17
    0.93, 0.96, 1.01, 1.08, 1.15, 1.23,
    // 18-23
    1.28, 1.17, 0.99, 0.89, 0.78, 0.68
  ];

  return multipliers.map((multiplier, hour) => {
    // Add deterministic noise: noise = ((((dailyBaseScore * 13) + (hour * 7)) % 9) - 4) * 0.01
    const noise = ((((dailyBaseScore * 13) + (hour * 7)) % 9) - 4) * 0.01;
    let finalScore = Math.round(dailyBaseScore * (multiplier + noise));
    
    // clamp between 5 and 98 mapped bounds
    return Math.max(5, Math.min(98, finalScore));
  });
}

export function calculateRotationalPremium(zoneId: string, inputDate?: Date) {
  const refDate = inputDate || new Date();
  const baseline = ZONE_BASELINE_PREMIUMS[zoneId] || 400; // default 400
  const weekIndex = getIsoWeek(refDate) % 3;
  
  let multiplier = 1.0;
  if (weekIndex === 1) multiplier = 1.08;
  else if (weekIndex === 2) multiplier = 0.96;
  
  const premium = Math.round(baseline * multiplier);
  
  return {
    baseline,
    multiplier,
    premium,
    weekIndex
  };
}
