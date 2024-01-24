import { calculate } from "@/lib/calculate";
import React from "react";
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryStack,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory";

interface ChartProps {
  stockValue: number;
  rsu: number;
  eso: number;
  strikePrice: number;
  currencyValue: number;
  currency?: string;
}

let Chart: React.FC<ChartProps> = (props) => {
  const { stockValue, rsu, eso, strikePrice, currencyValue, currency } = props;

  const chartData = (() => {
    const minSV = Math.floor((0.5 * stockValue) / 10) * 10;
    const maxSV = Math.ceil((1.5 * stockValue) / 10) * 10;

    const interval = 5;
    const range = Array.from(
      { length: (maxSV - minSV) / interval + 1 },
      (_, index) => minSV + interval * index
    );

    const bothData = range.map((sv) => {
      const { rsuValuePerYear, esoValuePerYear, perYear } = calculate({
        stockValue: sv,
        rsu,
        eso,
        strikePrice,
        currencyValue,
      });
      return {
        rsu: rsuValuePerYear,
        eso: esoValuePerYear,
        stockValue: sv,
        total: perYear,
      };
    });

    const rsuData = bothData.map(({ rsu, stockValue }) => ({
      x: stockValue,
      y: rsu,
    }));
    const esoData = bothData.map(({ eso, stockValue }) => ({
      x: stockValue,
      y: eso,
    }));
    const totalData = bothData.map(({ total, stockValue }) => ({
      x: stockValue,
      y: total,
    }));

    return { rsuData, esoData, totalData, minSV, maxSV };
  })();

  const yFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ? currency.toUpperCase() : "USD",
    maximumFractionDigits: 0,
  });

  const xFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return (
    <VictoryChart
      padding={{ top: 50, bottom: 50, left: 50, right: 0 }}
      height={400}
      containerComponent={<VictoryVoronoiContainer />}
    >
      <VictoryStack colorScale={["#ebebeb", "#f2f2f2"]}>
        <VictoryArea data={chartData.rsuData} />
        <VictoryArea data={chartData.esoData} />
      </VictoryStack>
      <VictoryArea
        data={chartData.totalData}
        style={{ data: { fill: "transparent" } }}
        labelComponent={<VictoryTooltip renderInPortal={true} dy={0} />}
        labels={({ datum }: any) => {
          return [
            xFormatter.format(datum.x),
            "->",
            yFormatter.format(0.001 * datum.y) + "k",
          ].join(" ");
        }}
      />

      <VictoryAxis
        tickFormat={(x) => xFormatter.format(x)}
        style={{ grid: { stroke: "#ddd" } }}
      />
      <VictoryAxis
        dependentAxis
        tickFormat={(y) => yFormatter.format(0.001 * y) + "k"}
        style={{ grid: { stroke: "#ddd" } }}
      />
    </VictoryChart>
  );
};

Chart = React.memo(Chart);

export default Chart;
