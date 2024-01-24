export function calculate(input: {
  stockValue: number;
  rsu: number;
  eso: number;
  strikePrice: number;
  currencyValue: number;
}) {
  const { stockValue, rsu, eso, strikePrice, currencyValue } = input;

  const rsuValuePerMonth = currencyValue * rsu * stockValue;
  const esoValuePerMonth = Math.max(
    currencyValue * eso * (stockValue - strikePrice),
    0
  );
  const perMonth = rsuValuePerMonth + esoValuePerMonth;

  const rsuValuePerYear = 12 * rsuValuePerMonth;
  const esoValuePerYear = 12 * esoValuePerMonth;
  const perYear = 12 * perMonth;

  return {
    rsuValuePerMonth,
    esoValuePerMonth,
    perMonth,
    rsuValuePerYear,
    esoValuePerYear,
    perYear,
  };
}
