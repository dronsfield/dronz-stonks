"use client";

import Button from "@/components/Button";
import Input from "@/components/Input";
import Image from "next/image";
import { styled } from "styled-components";
import React from "react";

const dollar = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const Container = styled.div`
  margin: 1em auto;
  width: 100%;
  max-width: 400px;
  padding: 1em;
`;

const formConfig = [
  { id: "stock", label: "Stock symbol or price ($)" },
  { id: "rsu", label: "RSUs (per month)" },
  { id: "eso", label: "ESOs (per month)" },
  { id: "strikePrice", label: "Strike price ($)" },
  // { id: "currency", label: "Currency (symbol)" },
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
    const { stock } = values;
    if (!isNaN(Number(stock))) {
      setStockValue(Number(stock));
      setIsLoading(false);
      return;
    }
    fetch(`/stock/${stock}`)
      .then(async (resp) => {
        try {
          if (resp.ok) {
            const json = await resp.json();
            const price = json.chart.result[0].meta.regularMarketPrice;
            if (price && typeof price === "number") {
              setStockValue(price);
            } else {
              throw new Error("couldn't get market price");
            }
          } else {
            throw new Error("resp not ok");
          }
        } catch (err) {
          console.error(err);
          setAsyncError(`Failed to fetch stock "${stock}`);
        }
      })
      .then(() => {
        setIsLoading(false);
      });
  }, []);

  const outputs = React.useMemo(() => {
    if (!isLoading) {
      const { rsu, eso, strikePrice } = values;

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

      const rsuValuePerMonth = Number(rsu || 0) * stockValue;
      const esoValuePerMonth =
        Number(eso || 0) * (stockValue - Number(strikePrice || 0));
      const perMonth = rsuValuePerMonth + esoValuePerMonth;
      const perYear = 12 * perMonth;
      return { perMonth, perYear };
    }
  }, [values, isLoading, stockValue]);

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
          <Button type="submit" children="Submit" />
        </form>
        <div style={{ height: "4em" }} />
        {isLoading ? (
          <div>Loading...</div>
        ) : asyncError ? (
          <div style={{ color: "red" }}>{asyncError}</div>
        ) : (
          <div style={{ fontSize: "1.5em" }}>
            <div>Stock value: ${stockValue}</div>
            <br />
            <div>
              Per month:{" "}
              {outputs?.perMonth !== undefined
                ? dollar.format(outputs.perMonth)
                : "?"}
            </div>
            <div>
              Per year:{" "}
              {outputs?.perYear !== undefined
                ? dollar.format(outputs.perYear)
                : "?"}
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
