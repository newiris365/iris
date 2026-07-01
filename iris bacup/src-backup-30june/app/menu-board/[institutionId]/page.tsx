"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  UtensilsCrossed, Sparkles, Leaf, Flame, ShieldAlert, 
  TrendingUp, Clock, Info, ShoppingBag
} from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface MenuItem {
  id: string;
  item_name: string;
  category: string;
  price: number;
  is_veg: boolean;
  calories: number;
  prep_time_mins: number;
  description: string;
  is_available: boolean;
}

const MOCK_MENU: MenuItem[] = [
  { id: '1', item_name: 'Traditional Rajasthani Thali', category: 'Meals', price: 160, is_veg: true, calories: 750, prep_time_mins: 15, description: 'Dal, Baati, Churma, Gatte ki Sabzi, Panchmel Dal, served with garlic chutney and buttermilk', is_available: true },
  { id: '2', item_name: 'Paneer Tikka Roll', category: 'Snacks', price: 120, is_veg: true, calories: 380, prep_time_mins: 10, description: 'Grilled paneer wrapped in rumali roti with fresh mint chutney', is_available: true },
  { id: '3', item_name: 'Pyaz Kachori (2pc)', category: 'Snacks', price: 40, is_veg: true, calories: 290, prep_time_mins: 4, description: 'Crispy deep-fried pastry filled with spicy onion mixture', is_available: true },
  { id: '4', item_name: 'Masala Dosa', category: 'Meals', price: 80, is_veg: true, calories: 350, prep_time_mins: 12, description: 'Crispy rice crepe with spiced potato filling, served with sambar & chutney', is_available: true },
  { id: '5', item_name: 'Mango Lassi', category: 'Beverages', price: 50, is_veg: true, calories: 200, prep_time_mins: 3, description: 'Creamy sweet yogurt drink blended with fresh mango pulp', is_available: true },
  { id: '6', item_name: 'Cold Coffee with Ice Cream', category: 'Beverages', price: 70, is_veg: true, calories: 280, prep_time_mins: 5, description: 'Chilled coffee blended with creamy vanilla ice cream', is_available: true },
  { id: '7', item_name: 'Butter Chicken Biryani', category: 'Meals', price: 190, is_veg: false, calories: 680, prep_time_mins: 20, description: 'Aromatic basmati rice cooked with tender spiced butter chicken pieces', is_available: true },
  { id: '8', item_name: 'Moong Dal Halwa', category: 'Desserts', price: 60, is_veg: true, calories: 320, prep_time_mins: 3, description: 'Rich Rajasthani dessert made with lentils, ghee, and dry fruits', is_available: true }
];

const PROMOTIONS = [
  { title: "TODAY'S SPECIAL", dish: "Rajasthani Thali", desc: "Dal Baati Churma, Gatte ki Sabzi & Chach", price: "₹160", badge: "Chef's Special" },
  { title: "HAPPY HOURS (4-6 PM)", dish: "Pyaz Kachori + Chai Combo", desc: "Get authentic spicy pyaz kachori with hot cutting chai", price: "₹45", badge: "Save 20%" },
  { title: "AI RECOMMENDATION", dish: "Mango Lassi & Paneer Roll", desc: "Perfect high-protein post-workout combo", price: "₹155", badge: "Gym Choice" }
];

export default function DigitalMenuBoard() {
  const params = useParams();
  const institutionId = params.institutionId as string;

  const [menu, setMenu] = useState<MenuItem[]>(MOCK_MENU);
  const [promoIndex, setPromoIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Load backend menu
  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const res = await apiGet('/canteen/menu');
      if (res.success && res.menu?.length > 0) {
        setMenu(res.menu);
      }
    } catch (err) {
      console.log('Using mock signage menu');
    }
  };

  // Rotate Promotions every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex(prev => (prev + 1) % PROMOTIONS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll Menu every 15 seconds
  useEffect(() => {
    const scrollTimer = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 10) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          scrollContainerRef.current.scrollBy({ top: 250, behavior: 'smooth' });
        }
      }
    }, 12000);
    return () => clearInterval(scrollTimer);
  }, []);

  const promo = PROMOTIONS[promoIndex];

  return (
    <main className="fixed inset-0 bg-[#0D0A1A] text-white flex flex-col p-6 overflow-hidden">
      
      {/* ── Signage Header Bar ───────────────────────────────── */}
      <div className="flex justify-between items-center border-b border-[#6C2BD9]/30 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-white uppercase">IRIS 365 Digital Signage</h1>
            <p className="text-xs text-[#A78BFA]/80 font-bold uppercase tracking-widest">Live Campus Menu Kiosk</p>
          </div>
        </div>

        {/* Live Clock / Telemetry */}
        <div className="flex items-center gap-4 bg-[#13102A]/80 border border-white/5 px-4 py-2 rounded-xl">
          <div className="text-right">
            <div className="text-sm font-bold font-mono">Counter 01 Open</div>
            <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Queue: 4 Mins Wait</div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>

      {/* ── Main Workspace: Two Column Landscape ───────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0">
        
        {/* Left Columns (3/5 width): Scrollable Dishes list */}
        <div className="lg:col-span-3 flex flex-col min-h-0 bg-[#13102A]/40 border border-white/5 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-lg font-extrabold uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#A78BFA]" /> Hot Canteen Specialties
            </h2>
            <span className="text-[10px] uppercase font-bold text-[#A78BFA]/60 bg-white/5 px-2.5 py-1 rounded-md">
              Autoscrolling list
            </span>
          </div>

          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto pr-2 space-y-4 scroll-smooth"
            style={{ scrollbarWidth: 'none' }}
          >
            {menu.filter(item => item.is_available).map((dish) => (
              <div 
                key={dish.id} 
                className="glass-panel border border-[#6C2BD9]/15 rounded-2xl p-4 flex justify-between items-center hover:border-[#6C2BD9]/40 transition-all duration-300"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">{dish.item_name}</h3>
                    {dish.is_veg ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" title="Veg" />
                    ) : (
                      <span className="w-2.5 h-2.5 bg-red-500/20 border border-red-500/40 rounded flex items-center justify-center text-[7px] text-red-400 font-bold px-0.5">NV</span>
                    )}
                  </div>
                  <p className="text-xs text-[#C4B5FD]/50 line-clamp-1 leading-relaxed max-w-lg">{dish.description}</p>
                  
                  <div className="flex items-center gap-3 text-[10px] text-[#C4B5FD]/40">
                    <span className="flex items-center gap-0.5"><Flame className="w-3 h-3 text-orange-400" /> {dish.calories} kcal</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3 text-[#A78BFA]" /> {dish.prep_time_mins} min prep</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-2xl font-black text-white font-mono">₹{dish.price}</span>
                  <div className="text-[9px] text-[#A78BFA] font-bold mt-0.5 uppercase tracking-wide">Order @ Counter</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Columns (2/5 width): Live Slideshow, offers, specials */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
          
          {/* Active Promo Showcase (Top) */}
          <div className="flex-1 bg-gradient-to-br from-[#6C2BD9]/45 via-[#13102A] to-[#13102A] border border-[#6C2BD9]/40 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-700">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/10 rounded-full blur-2xl -z-10" />

            <div className="flex justify-between items-start">
              <span className="text-xs font-black bg-[#6C2BD9]/40 border border-[#8B5CF6]/50 px-3 py-1.5 rounded-lg text-white uppercase tracking-wider">
                {promo.title}
              </span>
              <span className="text-[10px] text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-0.5">
                <Sparkles className="w-3 h-3 fill-yellow-400" /> {promo.badge}
              </span>
            </div>

            <div className="my-auto py-4">
              <h3 className="text-3xl font-black text-white leading-tight">{promo.dish}</h3>
              <p className="text-sm text-[#C4B5FD]/75 mt-2 leading-relaxed max-w-sm">{promo.desc}</p>
            </div>

            <div className="flex justify-between items-end border-t border-[#6C2BD9]/20 pt-4">
              <div>
                <span className="text-[9px] text-[#A78BFA]/50 uppercase tracking-widest font-bold">Special Promo Price</span>
                <div className="text-3xl font-black text-white font-mono">{promo.price}</div>
              </div>
              <div className="flex gap-1.5 pb-2">
                {PROMOTIONS.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === promoIndex ? 'bg-[#8B5CF6] w-4' : 'bg-white/10'
                    }`} 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Flash Promo Coupon Board (Bottom) */}
          <div className="bg-[#13102A]/60 border border-white/5 rounded-3xl p-6 flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 flex items-center justify-center shrink-0">
              <Info className="w-6 h-6 text-[#A78BFA]" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#A78BFA]">Digital Wallet Bonus</h4>
              <p className="text-sm text-white mt-1 font-semibold leading-snug">Use code <strong className="text-orange-400 font-mono text-base">WELCOME10</strong> on checkout for instant ₹10 Off orders.</p>
            </div>
          </div>

        </div>

      </div>

    </main>
  );
}
