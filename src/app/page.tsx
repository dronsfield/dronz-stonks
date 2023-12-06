"use client";

import Button from "@/components/Button";
import Input from "@/components/Input";
import { styled } from "styled-components";
import React from "react";
import { Label } from "@/components/Label";

const Container = styled.div`
  margin: 1em auto;
  width: 100%;
  max-width: 400px;
  padding: 1em;
`;

const OutputValue = styled.div`
  font-size: 1.5em;
`;

const OutputDetail = styled.div`
  font-size: 0.8em;
  opacity: 0.66;
  margin-top: 0.1em;
`;

const formConfig = [
  { id: "stock", label: "Stock symbol or price ($)" },
  { id: "rsu", label: "RSUs (per month)" },
  { id: "eso", label: "ESOs (per month)" },
  { id: "strikePrice", label: "Strike price ($)" },
  { id: "currency", label: "Currency (symbol)" },
] as const;
type InputId = (typeof formConfig)[number]["id"];

export default function Home() {
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    const formData = new FormData(evt.target as HTMLFormElement);
    const query = new URLSearchParams();
    formConfig.forEach((config) => {
      query.append(config.id, String(formData.get(config.id)) || "");
    });
    window.location.assign("/?" + query.toString());
  };

  const values = React.useMemo(() => {
    const values: Partial<Record<InputId, string>> = {};
    if (typeof window === "undefined") return values;
    const query = new URLSearchParams(window.location.search);
    formConfig.forEach((config) => {
      values[config.id] = query.get(config.id) || "";
    });
    return values;
  }, []);

  const [stockValue, setStockValue] = React.useState<number>(0);
  const [currencyValue, setCurrencyValue] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [asyncError, setAsyncError] = React.useState<string>("");

  React.useEffect(() => {
    const { stock, currency } = values;

    const getStockValue = new Promise<number>((resolve, reject) => {
      if (!isNaN(Number(stock))) return resolve(Number(stock));

      fetch(`/stock/${stock}`)
        .then(async (resp) => {
          if (resp.ok) {
            const json = await resp.json();
            const price = json.chart.result[0].meta.regularMarketPrice;
            if (json.chart.result[0].meta.currency !== "USD") {
              return reject("Non USD stocks are not supported yet");
            }
            if (price && typeof price === "number") {
              return resolve(price);
            } else {
              return reject("Unexpected response from stock API");
            }
          } else {
            return reject("Invalid stock symbol");
          }
        })
        .catch((err) => {
          console.error(err);
          return reject(`Unexpected error calling stock API`);
        });
    });

    const getCurrencyValue = new Promise<number>((resolve, reject) => {
      if (!currency) return resolve(1);
      const curr = currency!.toLowerCase();
      if (curr === "usd") return resolve(1);
      fetch(
        `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd/${curr}.json`
      )
        .then(async (resp) => {
          if (resp.ok) {
            const json = await resp.json();
            const conversion = json[curr];
            if (conversion && typeof conversion === "number") {
              return resolve(conversion);
            } else {
              return reject("Unexpected response from currency API");
            }
          } else {
            return reject("Invalid currency");
          }
        })
        .catch((err) => {
          console.error(err);
          return reject(`Unexpected error calling currency API`);
        });
    });

    Promise.all([getStockValue, getCurrencyValue])
      .then(([stockValue, currencyValue]) => {
        setStockValue(stockValue);
        setCurrencyValue(currencyValue);
      })
      .catch((err) => {
        setAsyncError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const outputs = React.useMemo(() => {
    if (!isLoading && !asyncError) {
      const { rsu, eso, strikePrice, currency } = values;

      if (rsu && isNaN(Number(rsu))) {
        setAsyncError("Invalid RSUs value, please enter number");
        return;
      }
      if (eso && isNaN(Number(eso))) {
        setAsyncError("Invalid ESOs value, please enter number");
        return;
      }
      if (strikePrice && isNaN(Number(strikePrice))) {
        setAsyncError("Invalid strike price value, please enter number");
        return;
      }
      if (eso && !strikePrice) {
        setAsyncError("If you have ESOs you must enter a strike price");
        return;
      }

      const rsuValuePerMonth = currencyValue * Number(rsu || 0) * stockValue;
      const esoValuePerMonth =
        currencyValue *
        Number(eso || 0) *
        (stockValue - Number(strikePrice || 0));
      const perMonth = rsuValuePerMonth + esoValuePerMonth;

      const rsuValuePerYear = 12 * rsuValuePerMonth;
      const esoValuePerYear = 12 * esoValuePerMonth;
      const perYear = 12 * perMonth;

      const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency ? currency.toUpperCase() : "USD",
      });

      return {
        rsuValuePerMonth,
        esoValuePerMonth,
        perMonth,
        rsuValuePerYear,
        esoValuePerYear,
        perYear,
        formatter,
      };
    }
  }, [values, isLoading, stockValue, currencyValue]);

  return (
    <main>
      <Container>
        <form onSubmit={handleSubmit}>
          {formConfig.map((config) => {
            return (
              <Input
                {...config}
                key={config.id}
                defaultValue={values[config.id]}
              />
            );
          })}
          <div style={{ height: "0.5em" }} />
          <Button type="submit" children="Submit" />
        </form>
        <div style={{ height: "2em" }} />
        {isLoading ? (
          <div>Loading...</div>
        ) : !outputs ? (
          <div style={{ color: "red" }}>
            {asyncError || "Unexpected error calculating outputs"}
          </div>
        ) : (
          <div>
            <Label>Stock value</Label>
            <OutputValue>${stockValue}</OutputValue>
            <br />
            <Label>Per year</Label>
            <OutputValue>
              {outputs.formatter.format(outputs.perYear)}
            </OutputValue>
            <OutputDetail>
              {outputs.formatter.format(outputs.rsuValuePerYear) +
                " + " +
                outputs.formatter.format(outputs.esoValuePerYear)}
            </OutputDetail>
            <br />
            <Label>Per month</Label>
            <OutputValue>
              {outputs.formatter.format(outputs.perMonth)}
            </OutputValue>
            <OutputDetail>
              {outputs.formatter.format(outputs.rsuValuePerMonth) +
                " + " +
                outputs.formatter.format(outputs.esoValuePerMonth)}
            </OutputDetail>
          </div>
        )}
      </Container>
    </main>
  );
}
