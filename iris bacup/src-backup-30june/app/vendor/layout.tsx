"use client";

import React from 'react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, ClipboardList, UtensilsCrossed, BarChart3, ChefHat,
  ListOrdered, Package, ShieldCheck, TrendingUp, UserCircle
} from 'lucide-react';

const vendorLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
  { label: 'Live Orders (KOT)', href: '/vendor/orders', icon: ClipboardList },
  { label: 'Queue Monitor', href: '/vendor/canteen/queue', icon: ListOrdered },
  { label: 'Menu Management', href: '/vendor/menu', icon: UtensilsCrossed },
  { label: 'Inventory', href: '/vendor/canteen/inventory', icon: Package },
  { label: 'Hygiene Checks', href: '/vendor/canteen/hygiene', icon: ShieldCheck },
  { label: 'Analytics', href: '/vendor/canteen/analytics', icon: TrendingUp },
  { label: 'Daily Sales', href: '/vendor/sales', icon: BarChart3 },
  { label: 'Prep List', href: '/vendor/prep', icon: ChefHat },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Canteen Portal"
      portalBadge="Vendor"
      sidebarLinks={vendorLinks}
      accentColor="#EA580C"
    >
      {children}
    </PortalShell>
  );
}
