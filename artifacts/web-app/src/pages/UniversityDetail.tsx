import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import {
  ArrowLeft, MapPin, ExternalLink, GraduationCap, Loader2,
  Globe, Info, Trophy, Star, Users, BookOpen, Navigation
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface UniInfo {
  name: string;
  description: string | null;
  image: string | null;
  wikiUrl: string | null;
  coordinates: { lat: number; lon: number } | null;
  displayAddress: string | null;
  address: Record<string, string> | null;
}

interface Performer {
  userId: number; name: string; email: string; avatarUrl?: string | null;
  sessionCount: number; subjects?: string[] | null;
}

export default function UniversityDetailPage() {
  const { user, token } = useAuthStore();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/university/:name");
  const uniName = decodeURIComponent(params?.name ?? "");
  const role = user?.role === "investor" ? "investor" : user?.role === "student" ? "student" : "tutor";

  const { data: info, isLoading: loadingInfo } = useQuery({
    queryKey: ["uni-info", uniName],
    queryFn: async (): Promise<UniInfo> => {
      const res = await fetch(`${BASE}/api/universities/info?name=${encodeURIComponent(uniName)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!uniName,
    staleTime: 5 * 60_000,
  });

  const { data: performers, isLoading: loadingPerformers } = useQuery({
    queryKey: ["top-performers", uniName],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/universities/top-performers/${encodeURIComponent(uniName)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ university: string; topStudents: Performer[]; topTutors: Performer[] }>;
    },
    enabled: !!uniName,
    staleTime: 30_000,
  });

  const backHref = role === "investor" ? "/investor/universities"
    : role === "student" ? "/student/dashboard"
    : "/tutor/dashboard";

  const coords = info?.coordinates;

  /* Build the OpenStreetMap embed URL */
  const mapEmbedUrl = coords
    ? (() => {
        const delta = 0.012;
        const bbox = `${coords.lon - delta},${coords.lat - delta},${coords.lon + delta},${coords.lat + delta}`;
        return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lon}`;
      })()
    : null;

  const mapsOpenUrl = coords
    ? `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}&zoom=16`
    : null;

  return (
    <DashboardLayout role={role} title={uniName || "University"}>
      <div className="space-y-6">

        {/* Back */}
        <button onClick={() => setLocation(backHref)}
          className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {loadingInfo ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-muted-foreground text-sm">Loading campus information…</p>
          </div>
        ) : (
          <>
            {/* Campus Photo Hero */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl overflow-hidden relative bg-gradient-to-br from-primary/20 to-accent/10 border border-white/10"
              style={{ aspectRatio: "16/7" }}>
              {info?.image ? (
                <img src={info.image} alt={uniName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <GraduationCap className="w-16 h-16 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">No campus photo available</p>
                </div>
              )}
              {/* Name overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6">
                <h1 className="text-white font-bold text-2xl drop-shadow-xl">{uniName}</h1>
                {info?.address && (
                  <div className="flex items-center gap-1.5 mt-1 text-white/70 text-sm">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {[info.address.city || info.address.county || info.address.state, info.address.country].filter(Boolean).join(", ")}
                  </div>
                )}
              </div>
              {info?.wikiUrl && (
                <a href={info.wikiUrl} target="_blank" rel="noreferrer"
                  className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur text-white/80 text-xs font-medium hover:bg-black/70 transition-all">
                  <Globe className="w-3.5 h-3.5" /> Wikipedia
                </a>
              )}
            </motion.div>

            {/* Description */}
            {info?.description && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="glass-panel rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-accent" />
                  <h3 className="text-white font-bold">About {uniName}</h3>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{info.description}</p>
              </motion.div>
            )}

            {/* Interactive Map — OpenStreetMap native iframe */}
            {mapEmbedUrl ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass-panel rounded-3xl overflow-hidden border border-white/10">
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                    <Navigation className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">Campus Location</h3>
                    {info?.displayAddress && (
                      <p className="text-muted-foreground text-xs truncate max-w-xs">{info.displayAddress}</p>
                    )}
                  </div>
                  <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="hidden sm:block">
                      {coords!.lat.toFixed(5)}°, {coords!.lon.toFixed(5)}°
                    </span>
                    {mapsOpenUrl && (
                      <a href={mapsOpenUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-accent hover:underline font-medium">
                        <ExternalLink className="w-3 h-3" /> Open in Maps
                      </a>
                    )}
                  </div>
                </div>

                {/* Map iframe */}
                <div className="relative" style={{ height: "420px" }}>
                  <iframe
                    title={`Map of ${uniName}`}
                    src={mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: "none", display: "block" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 text-accent shrink-0" />
                  <span>Map data © <a href="https://openstreetmap.org" target="_blank" rel="noreferrer" className="text-accent hover:underline">OpenStreetMap</a> contributors</span>
                </div>
              </motion.div>
            ) : !loadingInfo && (
              <div className="glass-panel rounded-2xl p-6 text-center">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Campus location could not be found on the map</p>
              </div>
            )}

            {/* Top Performers — for sponsors only */}
            {role === "investor" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-white font-bold text-lg">Top Performers</h3>
                </div>

                {loadingPerformers ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[1,2,3,4].map(i => <div key={i} className="glass-panel rounded-xl h-20 animate-pulse bg-white/5" />)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(performers?.topStudents ?? []).length > 0 && (
                      <div>
                        <p className="text-accent font-semibold text-sm mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" /> Top Students
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(performers?.topStudents ?? []).map((p, i) => (
                            <PerformerCard key={p.userId} performer={p} rank={i+1} color="from-accent to-primary" />
                          ))}
                        </div>
                      </div>
                    )}
                    {(performers?.topTutors ?? []).length > 0 && (
                      <div>
                        <p className="text-primary font-semibold text-sm mb-3 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" /> Top Tutors
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(performers?.topTutors ?? []).map((p, i) => (
                            <PerformerCard key={p.userId} performer={p} rank={i+1} color="from-primary to-purple-500" />
                          ))}
                        </div>
                      </div>
                    )}
                    {(performers?.topStudents ?? []).length === 0 && (performers?.topTutors ?? []).length === 0 && (
                      <div className="glass-panel rounded-2xl p-8 text-center">
                        <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-white font-bold mb-1">No members yet</p>
                        <p className="text-muted-foreground text-sm">Students and tutors who register from this university will appear here.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Sponsor CTA */}
                <div className="glass-panel rounded-2xl p-6 border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 mt-5">
                  <h3 className="text-white font-bold text-lg mb-2">Sponsor {uniName}?</h3>
                  <p className="text-white/60 text-sm mb-4">Your contribution is distributed automatically to the top active students and tutors.</p>
                  <button
                    onClick={() => alert("Payment integration coming soon — contact us to sponsor directly.")}
                    className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-400 hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2">
                    <Star className="w-5 h-5" /> Sponsor This University
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function PerformerCard({ performer, rank, color }: { performer: Performer; rank: number; color: string }) {
  return (
    <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
      <div className="relative shrink-0">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${color} flex items-center justify-center font-bold text-white text-sm overflow-hidden`}>
          {performer.avatarUrl
            ? <img src={performer.avatarUrl} alt={performer.name} className="w-full h-full object-cover" />
            : performer.name.charAt(0).toUpperCase()}
        </div>
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-[9px] font-bold text-black">#{rank}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">{performer.name}</p>
        <p className="text-muted-foreground text-xs truncate">{performer.email}</p>
        {performer.subjects && performer.subjects.length > 0 && (
          <div className="flex gap-1 mt-1">
            {performer.subjects.slice(0,2).map(s => (
              <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">{s}</span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-yellow-400 font-bold text-sm">{performer.sessionCount}</p>
        <p className="text-muted-foreground text-[10px]">sessions</p>
      </div>
    </div>
  );
}
