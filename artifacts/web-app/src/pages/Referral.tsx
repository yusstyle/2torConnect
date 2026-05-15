import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/auth";
import { Gift, Copy, CheckCircle2, Users, Loader2, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

export default function ReferralPage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [data, setData] = useState<{ code: string; referralCount: number; referralLink: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [claimCode, setClaimCode] = useState("");
  const [claiming, setClaiming] = useState(false);

  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const role = user?.role === "tutor" ? "tutor" : user?.role === "investor" ? "investor" : "student";

  useEffect(() => {
    fetch(`${API}/referrals/my-code`, { headers })
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Referral link copied to clipboard." });
  };

  const claim = async () => {
    if (!claimCode.trim()) return;
    setClaiming(true);
    try {
      const r = await fetch(`${API}/referrals/claim`, {
        method: "POST", headers,
        body: JSON.stringify({ code: claimCode.toUpperCase() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      toast({ title: "Referral applied! 🎉", description: d.message });
      setClaimCode("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally { setClaiming(false); }
  };

  return (
    <DashboardLayout role={role} title="Refer & Earn">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-8 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-primary/10 pointer-events-none" />
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent/30 to-primary/30 border border-white/10 flex items-center justify-center mb-4">
              <Gift className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Refer Friends, Earn Cash</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Invite friends to 2torConnect. You earn <strong className="text-white">₦500</strong> for every successful referral, and your friend gets a <strong className="text-white">₦200</strong> welcome bonus.
            </p>
          </div>
        </motion.div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: "1", title: "Share your link", desc: "Copy your unique referral link below" },
            { step: "2", title: "Friend signs up", desc: "They register and enter your code" },
            { step: "3", title: "Both earn!", desc: "You get ₦500, they get ₦200" },
          ].map(({ step, title, desc }) => (
            <div key={step} className="glass-panel rounded-2xl p-4 text-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">{step}</div>
              <p className="text-white font-semibold text-sm mb-1">{title}</p>
              <p className="text-muted-foreground text-xs">{desc}</p>
            </div>
          ))}
        </div>

        {/* Referral code + link */}
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
        ) : data ? (
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-white font-bold">Your Referral Code</h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{data.referralCount} referral{data.referralCount !== 1 ? "s" : ""}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-black/40 rounded-xl p-4 border border-white/10">
              <code className="text-accent font-mono text-2xl font-bold flex-1 tracking-widest">{data.code}</code>
              <button
                onClick={() => copy(data.code)}
                className="p-2 rounded-lg hover:bg-white/10 transition-all text-muted-foreground hover:text-white"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <div>
              <label className="text-sm text-white/70 block mb-1.5">Share Link</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={data.referralLink}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-muted-foreground text-sm focus:outline-none"
                />
                <button
                  onClick={() => copy(data.referralLink)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 whitespace-nowrap flex items-center gap-2"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                <p className="text-green-400 font-bold text-2xl">₦500</p>
                <p className="text-muted-foreground text-xs mt-1">Per successful referral</p>
              </div>
              <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-center">
                <p className="text-accent font-bold text-2xl">{data.referralCount}</p>
                <p className="text-muted-foreground text-xs mt-1">Total referrals made</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Claim a referral code */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-white font-bold mb-1">Have a referral code?</h3>
          <p className="text-muted-foreground text-sm mb-4">Enter a friend's code to get your ₦200 welcome bonus</p>
          <div className="flex gap-3">
            <input
              value={claimCode}
              onChange={e => setClaimCode(e.target.value.toUpperCase())}
              placeholder="e.g. ADAEZE12"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-muted-foreground focus:border-accent focus:outline-none font-mono text-lg tracking-widest"
              maxLength={12}
            />
            <button
              onClick={claim}
              disabled={!claimCode.trim() || claiming}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
              Claim
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
