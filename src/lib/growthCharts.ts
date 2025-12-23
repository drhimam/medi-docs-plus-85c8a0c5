import { differenceInMonths, differenceInYears } from "date-fns";

// WHO/CDC Growth Chart Data (simplified LMS values for key percentiles)
// Based on WHO Child Growth Standards and CDC Growth Charts
// These are approximated values for common percentiles (3rd, 10th, 25th, 50th, 75th, 90th, 97th)

interface GrowthDataPoint {
  ageMonths: number;
  L: number; // Box-Cox power
  M: number; // Median
  S: number; // Coefficient of variation
}

interface GrowthChartData {
  male: GrowthDataPoint[];
  female: GrowthDataPoint[];
}

// WHO Weight-for-age data (0-24 months) in kg
const WHO_WEIGHT_FOR_AGE: GrowthChartData = {
  male: [
    { ageMonths: 0, L: 0.3487, M: 3.3464, S: 0.14602 },
    { ageMonths: 1, L: 0.2297, M: 4.4709, S: 0.13395 },
    { ageMonths: 2, L: 0.197, M: 5.5675, S: 0.12385 },
    { ageMonths: 3, L: 0.1738, M: 6.3762, S: 0.11727 },
    { ageMonths: 4, L: 0.1553, M: 7.0023, S: 0.11316 },
    { ageMonths: 6, L: 0.1257, M: 7.934, S: 0.10764 },
    { ageMonths: 9, L: 0.0961, M: 9.0246, S: 0.10365 },
    { ageMonths: 12, L: 0.0648, M: 9.6479, S: 0.10142 },
    { ageMonths: 18, L: -0.0007, M: 10.8478, S: 0.10006 },
    { ageMonths: 24, L: -0.0633, M: 12.1515, S: 0.1009 },
  ],
  female: [
    { ageMonths: 0, L: 0.3809, M: 3.2322, S: 0.14171 },
    { ageMonths: 1, L: 0.1714, M: 4.1873, S: 0.13724 },
    { ageMonths: 2, L: 0.0962, M: 5.1282, S: 0.12897 },
    { ageMonths: 3, L: 0.0402, M: 5.8458, S: 0.12378 },
    { ageMonths: 4, L: -0.005, M: 6.4237, S: 0.11978 },
    { ageMonths: 6, L: -0.0744, M: 7.2927, S: 0.11423 },
    { ageMonths: 9, L: -0.1493, M: 8.2985, S: 0.10922 },
    { ageMonths: 12, L: -0.2149, M: 8.9501, S: 0.10649 },
    { ageMonths: 18, L: -0.3068, M: 10.1863, S: 0.10462 },
    { ageMonths: 24, L: -0.3687, M: 11.5137, S: 0.10564 },
  ],
};

// WHO Length/Height-for-age data (0-24 months) in cm
const WHO_HEIGHT_FOR_AGE: GrowthChartData = {
  male: [
    { ageMonths: 0, L: 1, M: 49.8842, S: 0.03795 },
    { ageMonths: 1, L: 1, M: 54.7244, S: 0.03557 },
    { ageMonths: 2, L: 1, M: 58.4249, S: 0.03424 },
    { ageMonths: 3, L: 1, M: 61.4292, S: 0.03328 },
    { ageMonths: 4, L: 1, M: 63.886, S: 0.03257 },
    { ageMonths: 6, L: 1, M: 67.6236, S: 0.03169 },
    { ageMonths: 9, L: 1, M: 72.0888, S: 0.03086 },
    { ageMonths: 12, L: 1, M: 75.7488, S: 0.03022 },
    { ageMonths: 18, L: 1, M: 82.2534, S: 0.02955 },
    { ageMonths: 24, L: 1, M: 87.8161, S: 0.02899 },
  ],
  female: [
    { ageMonths: 0, L: 1, M: 49.1477, S: 0.0379 },
    { ageMonths: 1, L: 1, M: 53.6872, S: 0.03611 },
    { ageMonths: 2, L: 1, M: 57.0673, S: 0.03514 },
    { ageMonths: 3, L: 1, M: 59.8029, S: 0.0344 },
    { ageMonths: 4, L: 1, M: 62.0899, S: 0.03386 },
    { ageMonths: 6, L: 1, M: 65.7311, S: 0.0332 },
    { ageMonths: 9, L: 1, M: 70.1435, S: 0.03254 },
    { ageMonths: 12, L: 1, M: 73.9516, S: 0.032 },
    { ageMonths: 18, L: 1, M: 80.7128, S: 0.03136 },
    { ageMonths: 24, L: 1, M: 86.4153, S: 0.03088 },
  ],
};

// WHO Head Circumference-for-age data (0-24 months) in cm
const WHO_HEAD_CIRCUMFERENCE: GrowthChartData = {
  male: [
    { ageMonths: 0, L: 1, M: 34.4618, S: 0.03686 },
    { ageMonths: 1, L: 1, M: 37.2759, S: 0.03133 },
    { ageMonths: 2, L: 1, M: 39.1285, S: 0.02997 },
    { ageMonths: 3, L: 1, M: 40.5135, S: 0.02918 },
    { ageMonths: 4, L: 1, M: 41.6317, S: 0.02868 },
    { ageMonths: 6, L: 1, M: 43.3306, S: 0.02807 },
    { ageMonths: 9, L: 1, M: 45.1899, S: 0.02746 },
    { ageMonths: 12, L: 1, M: 46.4866, S: 0.02708 },
    { ageMonths: 18, L: 1, M: 48.0193, S: 0.0267 },
    { ageMonths: 24, L: 1, M: 48.9458, S: 0.02658 },
  ],
  female: [
    { ageMonths: 0, L: 1, M: 33.8787, S: 0.03496 },
    { ageMonths: 1, L: 1, M: 36.5463, S: 0.03149 },
    { ageMonths: 2, L: 1, M: 38.2521, S: 0.03013 },
    { ageMonths: 3, L: 1, M: 39.5328, S: 0.02941 },
    { ageMonths: 4, L: 1, M: 40.5817, S: 0.02895 },
    { ageMonths: 6, L: 1, M: 42.1852, S: 0.02838 },
    { ageMonths: 9, L: 1, M: 43.9892, S: 0.02791 },
    { ageMonths: 12, L: 1, M: 45.2459, S: 0.02766 },
    { ageMonths: 18, L: 1, M: 46.7593, S: 0.02744 },
    { ageMonths: 24, L: 1, M: 47.6874, S: 0.02743 },
  ],
};

// CDC BMI-for-age data (2-20 years) percentiles
const CDC_BMI_FOR_AGE: GrowthChartData = {
  male: [
    { ageMonths: 24, L: -1.6318, M: 16.0211, S: 0.08196 },
    { ageMonths: 36, L: -1.4697, M: 15.5608, S: 0.07909 },
    { ageMonths: 48, L: -1.1873, M: 15.3009, S: 0.0806 },
    { ageMonths: 60, L: -0.8553, M: 15.2078, S: 0.08527 },
    { ageMonths: 72, L: -0.5305, M: 15.2765, S: 0.09171 },
    { ageMonths: 96, L: 0.0127, M: 15.7519, S: 0.10683 },
    { ageMonths: 120, L: 0.417, M: 16.6127, S: 0.12204 },
    { ageMonths: 144, L: 0.6949, M: 17.8353, S: 0.13541 },
    { ageMonths: 168, L: 0.8756, M: 19.3091, S: 0.14576 },
    { ageMonths: 192, L: 0.9827, M: 20.8962, S: 0.15261 },
    { ageMonths: 216, L: 1.035, M: 22.4515, S: 0.15603 },
    { ageMonths: 240, L: 1.0503, M: 23.8414, S: 0.15618 },
  ],
  female: [
    { ageMonths: 24, L: -0.5809, M: 15.7061, S: 0.08746 },
    { ageMonths: 36, L: -0.7477, M: 15.3254, S: 0.08483 },
    { ageMonths: 48, L: -0.8198, M: 15.1299, S: 0.08523 },
    { ageMonths: 60, L: -0.8178, M: 15.0874, S: 0.08858 },
    { ageMonths: 72, L: -0.7554, M: 15.1965, S: 0.09433 },
    { ageMonths: 96, L: -0.5391, M: 15.7481, S: 0.1076 },
    { ageMonths: 120, L: -0.2664, M: 16.7049, S: 0.12139 },
    { ageMonths: 144, L: 0.0124, M: 17.9653, S: 0.13244 },
    { ageMonths: 168, L: 0.2582, M: 19.3728, S: 0.13955 },
    { ageMonths: 192, L: 0.4506, M: 20.7134, S: 0.14292 },
    { ageMonths: 216, L: 0.5846, M: 21.8414, S: 0.14328 },
    { ageMonths: 240, L: 0.6683, M: 22.7068, S: 0.14157 },
  ],
};

// Helper function to interpolate between data points
function interpolateDataPoint(data: GrowthDataPoint[], ageMonths: number): GrowthDataPoint | null {
  if (data.length === 0) return null;
  
  // Find surrounding data points
  let lower = data[0];
  let upper = data[data.length - 1];
  
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i].ageMonths <= ageMonths && data[i + 1].ageMonths >= ageMonths) {
      lower = data[i];
      upper = data[i + 1];
      break;
    }
  }
  
  // If exact match
  if (lower.ageMonths === ageMonths) return lower;
  if (upper.ageMonths === ageMonths) return upper;
  
  // Handle out of range
  if (ageMonths < data[0].ageMonths) return data[0];
  if (ageMonths > data[data.length - 1].ageMonths) return data[data.length - 1];
  
  // Linear interpolation
  const ratio = (ageMonths - lower.ageMonths) / (upper.ageMonths - lower.ageMonths);
  return {
    ageMonths,
    L: lower.L + ratio * (upper.L - lower.L),
    M: lower.M + ratio * (upper.M - lower.M),
    S: lower.S + ratio * (upper.S - lower.S),
  };
}

// Calculate Z-score using LMS method
function calculateZScore(value: number, L: number, M: number, S: number): number {
  if (L === 0) {
    return Math.log(value / M) / S;
  }
  return (Math.pow(value / M, L) - 1) / (L * S);
}

// Convert Z-score to percentile
function zScoreToPercentile(zScore: number): number {
  // Using error function approximation for normal CDF
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = zScore < 0 ? -1 : 1;
  const x = Math.abs(zScore) / Math.sqrt(2);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  const percentile = 0.5 * (1.0 + sign * y) * 100;
  return Math.round(percentile * 10) / 10;
}

export interface GrowthPercentileResult {
  percentile: number;
  zScore: number;
  interpretation: string;
  category: "low" | "normal" | "high" | "unknown";
}

function interpretPercentile(percentile: number, metric: string): { interpretation: string; category: "low" | "normal" | "high" } {
  if (percentile < 3) {
    return { interpretation: `${metric} is below 3rd percentile (very low)`, category: "low" };
  } else if (percentile < 5) {
    return { interpretation: `${metric} is between 3rd-5th percentile (low)`, category: "low" };
  } else if (percentile < 10) {
    return { interpretation: `${metric} is between 5th-10th percentile (below average)`, category: "low" };
  } else if (percentile <= 90) {
    return { interpretation: `${metric} is between 10th-90th percentile (normal)`, category: "normal" };
  } else if (percentile <= 95) {
    return { interpretation: `${metric} is between 90th-95th percentile (above average)`, category: "high" };
  } else if (percentile <= 97) {
    return { interpretation: `${metric} is between 95th-97th percentile (high)`, category: "high" };
  } else {
    return { interpretation: `${metric} is above 97th percentile (very high)`, category: "high" };
  }
}

export function calculateWeightPercentile(
  weightKg: number,
  dateOfBirth: string,
  gender: "male" | "female"
): GrowthPercentileResult {
  const ageMonths = differenceInMonths(new Date(), new Date(dateOfBirth));
  
  // Only valid for 0-24 months with WHO data
  if (ageMonths > 24 || ageMonths < 0) {
    return {
      percentile: 0,
      zScore: 0,
      interpretation: "Weight percentile is only available for children 0-24 months",
      category: "unknown",
    };
  }
  
  const data = WHO_WEIGHT_FOR_AGE[gender];
  const dataPoint = interpolateDataPoint(data, ageMonths);
  
  if (!dataPoint) {
    return {
      percentile: 0,
      zScore: 0,
      interpretation: "Unable to calculate percentile",
      category: "unknown",
    };
  }
  
  const zScore = calculateZScore(weightKg, dataPoint.L, dataPoint.M, dataPoint.S);
  const percentile = zScoreToPercentile(zScore);
  const { interpretation, category } = interpretPercentile(percentile, "Weight-for-age");
  
  return {
    percentile,
    zScore: Math.round(zScore * 100) / 100,
    interpretation,
    category,
  };
}

export function calculateHeightPercentile(
  heightCm: number,
  dateOfBirth: string,
  gender: "male" | "female"
): GrowthPercentileResult {
  const ageMonths = differenceInMonths(new Date(), new Date(dateOfBirth));
  
  // Only valid for 0-24 months with WHO data
  if (ageMonths > 24 || ageMonths < 0) {
    return {
      percentile: 0,
      zScore: 0,
      interpretation: "Height percentile is only available for children 0-24 months",
      category: "unknown",
    };
  }
  
  const data = WHO_HEIGHT_FOR_AGE[gender];
  const dataPoint = interpolateDataPoint(data, ageMonths);
  
  if (!dataPoint) {
    return {
      percentile: 0,
      zScore: 0,
      interpretation: "Unable to calculate percentile",
      category: "unknown",
    };
  }
  
  const zScore = calculateZScore(heightCm, dataPoint.L, dataPoint.M, dataPoint.S);
  const percentile = zScoreToPercentile(zScore);
  const { interpretation, category } = interpretPercentile(percentile, "Height/Length-for-age");
  
  return {
    percentile,
    zScore: Math.round(zScore * 100) / 100,
    interpretation,
    category,
  };
}

export function calculateHeadCircumferencePercentile(
  circumferenceCm: number,
  dateOfBirth: string,
  gender: "male" | "female"
): GrowthPercentileResult {
  const ageMonths = differenceInMonths(new Date(), new Date(dateOfBirth));
  
  // Only valid for 0-24 months with WHO data
  if (ageMonths > 24 || ageMonths < 0) {
    return {
      percentile: 0,
      zScore: 0,
      interpretation: "Head circumference percentile is only available for children 0-24 months",
      category: "unknown",
    };
  }
  
  const data = WHO_HEAD_CIRCUMFERENCE[gender];
  const dataPoint = interpolateDataPoint(data, ageMonths);
  
  if (!dataPoint) {
    return {
      percentile: 0,
      zScore: 0,
      interpretation: "Unable to calculate percentile",
      category: "unknown",
    };
  }
  
  const zScore = calculateZScore(circumferenceCm, dataPoint.L, dataPoint.M, dataPoint.S);
  const percentile = zScoreToPercentile(zScore);
  const { interpretation, category } = interpretPercentile(percentile, "Head circumference-for-age");
  
  return {
    percentile,
    zScore: Math.round(zScore * 100) / 100,
    interpretation,
    category,
  };
}

export function calculateBMIPercentile(
  bmi: number,
  dateOfBirth: string,
  gender: "male" | "female"
): GrowthPercentileResult {
  const ageMonths = differenceInMonths(new Date(), new Date(dateOfBirth));
  const ageYears = differenceInYears(new Date(), new Date(dateOfBirth));
  
  // CDC BMI-for-age is valid for 2-20 years
  if (ageYears < 2 || ageYears > 20) {
    return {
      percentile: 0,
      zScore: 0,
      interpretation: "BMI percentile is only available for children 2-20 years",
      category: "unknown",
    };
  }
  
  const data = CDC_BMI_FOR_AGE[gender];
  const dataPoint = interpolateDataPoint(data, ageMonths);
  
  if (!dataPoint) {
    return {
      percentile: 0,
      zScore: 0,
      interpretation: "Unable to calculate percentile",
      category: "unknown",
    };
  }
  
  const zScore = calculateZScore(bmi, dataPoint.L, dataPoint.M, dataPoint.S);
  const percentile = zScoreToPercentile(zScore);
  
  // BMI has special interpretations
  let interpretation: string;
  let category: "low" | "normal" | "high";
  
  if (percentile < 5) {
    interpretation = "Underweight (BMI < 5th percentile)";
    category = "low";
  } else if (percentile < 85) {
    interpretation = "Healthy weight (5th-84th percentile)";
    category = "normal";
  } else if (percentile < 95) {
    interpretation = "Overweight (85th-94th percentile)";
    category = "high";
  } else {
    interpretation = "Obese (≥ 95th percentile)";
    category = "high";
  }
  
  return {
    percentile,
    zScore: Math.round(zScore * 100) / 100,
    interpretation,
    category,
  };
}

export function isPediatricPatient(dateOfBirth?: string): boolean {
  if (!dateOfBirth) return false;
  const ageYears = differenceInYears(new Date(), new Date(dateOfBirth));
  return ageYears < 18;
}

export function getPatientGender(gender?: string): "male" | "female" | null {
  if (!gender) return null;
  const lowerGender = gender.toLowerCase();
  if (lowerGender === "male" || lowerGender === "m") return "male";
  if (lowerGender === "female" || lowerGender === "f") return "female";
  return null;
}
