import { useEffect, useState } from 'react';
import { MetricCard } from './components/MetricCard';
import { InfestationChart } from './components/InfestationChart';
import { StatusBadge } from './components/StatusBadge';
import { LastUpdated } from './components/LastUpdated';
import { formatNumber } from './lib/utils';
import { aggregateSnapshots, normalizeSnapshots, type AggregatedData } from './lib/snapshots';
import { Bug, AlertOctagon } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<AggregatedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
        if (!scriptUrl) {
          console.warn("VITE_GOOGLE_SCRIPT_URL not found.");
          setLoading(false);
          return;
        }

        const response = await fetch(scriptUrl);
        const jsonResponse = await response.json();

        if (!Array.isArray(jsonResponse)) {
          console.error("Unexpected API response", jsonResponse);
          setLoading(false);
          return;
        }

        const snapshots = normalizeSnapshots(jsonResponse);
        if (snapshots.length === 0) {
          console.warn("No valid snapshots after filtering", jsonResponse.length, "raw rows");
          setLoading(false);
          return;
        }

        const aggregated = aggregateSnapshots(snapshots);
        if (aggregated) {
          setData(aggregated);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="text-2xl font-black font-heading uppercase animate-pulse text-brand-text">Loading Data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg gap-4">
        <div className="text-xl font-bold p-8 bg-brand-card border-4 border-brand-border shadow-[8px_8px_0px_0px_#111111] text-brand-text text-center">
          NO DATA FOUND.<br/>
          <span className="text-sm text-brand-muted mt-2 block">
            Ensure the Google Apps Script Web App is deployed, seeded, and your sheet has no blank rows.
          </span>
        </div>
      </div>
    );
  }

  const bjpTotal = data.latestBJPInsta + data.latestBJPX;
  const cjpTotal = data.latestCJPInsta + data.latestCJPX;

  return (
    <div className="min-h-screen bg-brand-bg p-4 md:p-8 lg:p-12 pb-24 text-brand-text">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b-8 border-brand-border pb-8">
          <div>
            <h1 className="text-6xl md:text-8xl font-black font-heading uppercase tracking-tighter leading-none relative inline-block mb-4">
              Infestation
              <Bug className="absolute -top-6 -right-10 w-12 h-12 text-cjp -rotate-45 drop-shadow-[2px_2px_0px_#111]" />
            </h1>
            <div className="flex items-center gap-4">
              <StatusBadge variant="alert" className="animate-pulse px-4 py-1 text-sm">LIVE</StatusBadge>
            </div>
          </div>
          <LastUpdated timestamp={data.lastScan} />
        </header>

        {/* BLOCKED HANDLE CARD */}
        <div className="bg-brand-text text-brand-bg p-4 border-4 border-brand-border flex items-center gap-4 shadow-[4px_4px_0px_0px_var(--color-stamp)]">
          <AlertOctagon className="w-8 h-8 text-stamp flex-shrink-0" />
          <div>
            <h4 className="font-heading font-black uppercase text-lg tracking-wider">Handle Migration</h4>
            <p className="font-bold text-sm text-brand-bg/80">
              @CJP_2029 blocked at <span className="text-stamp">187.2K</span>. Now tracking{' '}
              <span className="text-cjp">@Cockroachisback</span> (X) and{' '}
              <span className="text-cjp">@cockroachjantaparty</span> (Instagram).
            </p>
          </div>
        </div>

        {/* CORE METRICS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <MetricCard 
            title="Total Combined Followers" 
            value={formatNumber(cjpTotal)} 
            subtitle={`vs BJP: ${formatNumber(bjpTotal)}`}
            accent="cjp"
            className="border-cjp border-l-8"
          />

          <MetricCard 
            title="Instagram Followers" 
            value={formatNumber(data.latestCJPInsta)} 
            subtitle={`vs BJP: ${formatNumber(data.latestBJPInsta)}`}
            accent="cjp"
            className="border-cjp border-l-8"
          />

          <MetricCard 
            title="X/Twitter Followers" 
            value={formatNumber(data.latestCJPX)} 
            subtitle={`vs BJP: ${formatNumber(data.latestBJPX)}`}
            accent="cjp"
            className="border-cjp border-l-8"
          />

        </div>

        {/* CHART */}
        <InfestationChart data={data.chartData} />

      </div>
    </div>
  );
}
