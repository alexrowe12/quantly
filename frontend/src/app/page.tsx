import ScrollableStockChart from "@/components/ScrollableStockChart";

export default function Home() {
  return (
    <div className="w-screen h-screen" style={{ backgroundColor: 'rgb(31, 31, 31)' }}>
      <ScrollableStockChart />
    </div>
  );
}
