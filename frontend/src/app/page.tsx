import ScrollableStockChart from "@/components/ScrollableStockChart";
import StrategyPanel from "@/components/StrategyPanel";

export default function Home() {
  return (
    <div className="w-screen h-screen flex flex-col" style={{ backgroundColor: '#1F1F1F' }}>
      {/* Top Menu Bar */}
      <div 
        className="w-full flex items-center justify-between px-2"
        style={{ 
          backgroundColor: '#2A2A2A',
          height: '5vh'
        }}
      >
        <span 
          className="text-xl font-semibold ml-1"
          style={{ color: '#F9FAFB' }}
        >
          Quantly
        </span>
        
        {/* Right side icons */}
        <div className="flex items-center gap-3 mr-2">
          <img 
            src="/help.png" 
            alt="Help" 
            className="w-6 h-6"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <img 
            src="/settings.png" 
            alt="Settings" 
            className="w-6 h-6"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <img 
            src="/user.png" 
            alt="User" 
            className="w-6 h-6"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Panel - 30% width */}
        <div className="w-[30%]" style={{ backgroundColor: '#1F1F1F' }}>
          <StrategyPanel />
        </div>
        
        {/* Chart Container - 70% width */}
        <div className="w-[70%]">
          <ScrollableStockChart />
        </div>
      </div>
    </div>
  );
}
