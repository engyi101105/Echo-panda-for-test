import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaCompactDisc,
  FaMusic, 
  FaListUl,
  FaChartBar,
  FaChartLine,
  FaSpinner,
} from "react-icons/fa";
import { supabase } from "../../backend/supabaseClient";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useDataCache } from "../../contexts/DataCacheContext";


interface StatCard {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

interface Activity {
  id: number;
  type: "user" | "song" | "artist";
  title: string;
  description: string;
  timestamp: string;
  avatar?: string;
}

interface ChartData {
  month: string;
  songs: number;
  users: number;
}

export default function Dashboard() {
  const { getCachedData } = useDataCache();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getCachedData('admin_dashboard', async () => {
          console.log('🔄 [Admin Dashboard] Fetching statistics...');

          // Fetch counts from Supabase
          const [songsResult, artistsResult, playlistsResult] = await Promise.all([
            supabase.from('songs').select('id', { count: 'exact', head: true }),
            supabase.from('artists').select('id', { count: 'exact', head: true }),
            supabase.from('playlists').select('id', { count: 'exact', head: true }),
          ]);

          // Fetch users from Firebase Firestore and group by creation month
          let usersCount = 0;
          let userMonthCounts = new Map<string, number>();
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          // Initialize all months with 0
          months.forEach(month => userMonthCounts.set(month, 0));
          try {
            const db = getFirestore();
            const usersSnapshot = await getDocs(collection(db, 'users'));
            usersCount = usersSnapshot.size;
            usersSnapshot.forEach((doc) => {
              const data = doc.data();
              // Try to get creation date from known fields
              let createdAt = data.createdAt || data.created_at || data.created || data.timestamp;
              if (createdAt && createdAt.toDate) {
                // Firestore Timestamp object
                createdAt = createdAt.toDate();
              } else if (typeof createdAt === 'string' || typeof createdAt === 'number') {
                createdAt = new Date(createdAt);
              } else {
                createdAt = null;
              }
              if (createdAt instanceof Date && !isNaN(createdAt.getTime())) {
                const month = months[createdAt.getMonth()];
                userMonthCounts.set(month, (userMonthCounts.get(month) || 0) + 1);
              }
            });
          } catch (error) {
            console.warn('Failed to fetch users from Firestore:', error);
          }

          const stats: StatCard[] = [
            { title: "Total Users", value: usersCount, icon: <FaUsers />, color: "from-blue-500 to-cyan-500" },
            { title: "Total Songs", value: songsResult.count || 0, icon: <FaCompactDisc />, color: "from-purple-500 to-pink-500" },
            { title: "Total Artists", value: artistsResult.count || 0, icon: <FaMusic />, color: "from-green-500 to-emerald-500" },
            { title: "Total Playlists", value: playlistsResult.count || 0, icon: <FaListUl />, color: "from-orange-500 to-red-500" },
          ];

          // Fetch monthly song creation data for chart
          const { data: songsByMonth } = await supabase
            .from('songs')
            .select('created_at')
            .order('created_at', { ascending: true });

          // Group songs by month
          const songMonthCounts = new Map<string, number>();
          months.forEach(month => songMonthCounts.set(month, 0));
          (songsByMonth || []).forEach((song: any) => {
            const date = new Date(song.created_at);
            const month = months[date.getMonth()];
            songMonthCounts.set(month, (songMonthCounts.get(month) || 0) + 1);
          });

          // Calculate cumulative user growth per month
          let cumulativeUsers = 0;
          const chartData: ChartData[] = months.map(month => {
            cumulativeUsers += userMonthCounts.get(month) || 0;
            return {
              month,
              songs: songMonthCounts.get(month) || 0,
              users: cumulativeUsers,
            };
          });

          console.log('📊 [Admin Dashboard] Stats loaded:', stats.map(s => `${s.title}: ${s.value}`).join(', '));
          return { stats, chartData };
        });

        setStats(data.stats);
        setChartData(data.chartData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const maxSongs = chartData.length ? Math.max(...chartData.map((d) => d.songs)) : 0;
  const maxUsers = chartData.length ? Math.max(...chartData.map((d) => d.users)) : 0;

  const userChartPoints = chartData
    .map((d, i) => `${(i * (560 / chartData.length)) + 30},${350 - (d.users / (maxUsers || 1)) * 250}`)
    .join(" ");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
        <div className="flex items-center justify-center h-96">
          <FaSpinner className="text-purple-400 text-4xl animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-slate-400 mt-2">Platform overview — quick summary of key metrics</p>
        </div>

      {/* Dynamic Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.title} className="bg-slate-800/60 shadow-lg rounded-xl p-8 flex items-center justify-between gap-4 hover:scale-[1.01] transition-transform">
              <div>
                <p className="text-slate-400 text-sm font-medium">{s.title}</p>
                <h3 className="text-3xl font-extrabold text-white mt-2">{s.value.toLocaleString()}</h3>
              </div>
              <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-2xl`}>{s.icon}</div>
            </div>
          ))}
        </div>

      {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/60 shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FaChartBar className="text-purple-400" />Songs Added Per Month</h2>
          <div className="flex items-end justify-between h-56 gap-2">
            {chartData.map((d, i) => {
              const height = maxSongs ? (d.songs / maxSongs) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-purple-500 to-pink-500 transition-all" style={{ height: `${Math.max(height, 6)}%` }} />
                  <span className="text-xs text-slate-400">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

          <div className="bg-slate-800/60 shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FaChartLine className="text-cyan-400" />User Growth</h2>
          <svg width="100%" height="260" className="mt-2">
            <defs>
              <linearGradient id="gline" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <polyline points={userChartPoints} fill="none" stroke="#06b6d4" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        </div>
      </div>
    </div>
  );
}
