import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  if (!params.symbol) return NextResponse.json({}, { status: 422 });
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${params.symbol.toUpperCase()}`,
    { next: { revalidate: 60 } }
  );
  if (res.ok) {
    const data = await res.json();
    return NextResponse.json(data);
  } else {
    console.log(await res.text());
    return NextResponse.json({}, { status: res.status });
  }
}
