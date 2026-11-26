import {
  CookingPot,
  CupSoda,
  Zap,
  Package2,
  Sandwich,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { DepartmentSlug } from "@/lib/departments";

/**
 * One icon per department, shared between the homepage's category tiles and
 * ProductImage's no-photo fallback. Lives here rather than in departments.ts,
 * which stays pure data — see the note at the top of that module.
 */
export const DEPARTMENT_ICONS: Record<DepartmentSlug, LucideIcon> = {
  cookware: CookingPot,
  "drinkware-bottles": CupSoda,
  "kitchen-appliances": Zap,
  "storage-serveware": Package2,
  "lunch-boxes": Sandwich,
  "home-personal-care": Sparkles,
};
