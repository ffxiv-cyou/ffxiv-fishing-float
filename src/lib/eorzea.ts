/** 1 艾欧泽亚日 = 70 现实分钟。 */
const SECOND_PER_EORZEA_DAY = 70 * 60;
const SECOND_PER_EORZEA_HOUR = SECOND_PER_EORZEA_DAY / 24;
const WEATHER_PERIOD_SECONDS = 8 * SECOND_PER_EORZEA_HOUR;
const EORZEA_SECONDS_PER_REAL_SECOND = 1440 / 70;

export interface WeatherRateItem {
  id: number;
  rate: number;
}

/** 现实毫秒 → 当日艾欧泽亚分钟 [0, 1440)。 */
export function eorzeaMinutes(unixMillis: number): number {
  const timeInDay = unixMillis % (SECOND_PER_EORZEA_DAY * 1000);
  const etSeconds = Math.trunc(
    (timeInDay * EORZEA_SECONDS_PER_REAL_SECOND) / 1000,
  );
  return Math.trunc(etSeconds / 60);
}

/** 现实秒 → 天气抽取目标值 [0, 100)；中间量按 int32 回绕（与 Go 实现一致）。 */
export function unixToWeatherTarget(unixSeconds: number): number {
  const bell = Math.trunc(unixSeconds / SECOND_PER_EORZEA_HOUR);
  const increment = ((bell + 8 - (bell % 8)) % 24) | 0;

  const totalDays = Math.trunc(unixSeconds / SECOND_PER_EORZEA_DAY) | 0;

  const calcBase = (totalDays * 0x64 + increment) | 0;
  const step1 = ((calcBase << 0xb) ^ calcBase) | 0;
  const step2 = ((step1 >> 8) ^ step1) | 0;
  return step2 % 0x64;
}

/** 现实秒 → 当前天气 ID。 */
export function weatherAt(
  rates: readonly WeatherRateItem[],
  unixSeconds: number,
): number | null {
  const target = unixToWeatherTarget(unixSeconds);
  let accum = 0;
  for (const item of rates) {
    accum += item.rate;
    if (target < accum) return item.id;
  }
  return null;
}

/** 现实秒 → 上一个天气周期（8 艾欧泽亚小时）的天气 ID。 */
export function prevWeatherAt(
  rates: readonly WeatherRateItem[],
  unixSeconds: number,
): number | null {
  const startOfPeriod =
    Math.trunc(unixSeconds / WEATHER_PERIOD_SECONDS) * WEATHER_PERIOD_SECONDS;
  return weatherAt(rates, startOfPeriod - WEATHER_PERIOD_SECONDS);
}
