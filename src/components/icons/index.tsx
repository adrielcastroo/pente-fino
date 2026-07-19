/**
 * Icon compatibility layer — Phosphor (duotone) with a Lucide-compatible API.
 *
 * Why: the Estoque module was using `lucide-react`, whose icons look generic
 * against a professional ERP surface. Phosphor duotone gives us premium,
 * SaaS-grade iconography (Notion/Linear feel) without introducing a paid
 * license (MIT).
 *
 * How: this file exports icons under their **Lucide names** so the rest of
 * the codebase can migrate with a pure import path swap
 * (`lucide-react` → `@/components/icons`). Each exported icon is a thin
 * wrapper that:
 *   1. Defaults `weight="duotone"`.
 *   2. Maps `fill="currentColor"` (Lucide's active-state pattern used in
 *      BottomTabBar / NavRail) to `weight="fill"`.
 *   3. Silently drops Lucide-only props (`strokeWidth`, `fillOpacity`,
 *      `absoluteStrokeWidth`) so existing call sites keep compiling.
 *
 * Do NOT add hard-coded colors here — every icon inherits `currentColor` so
 * semantic tokens (`text-primary`, `text-muted-foreground`) keep working.
 */
import { forwardRef, type SVGProps, type ComponentType, type ForwardRefExoticComponent, type RefAttributes } from "react";
import type { Icon as PhosphorIcon, IconWeight } from "@phosphor-icons/react";
import {
  Activity,
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowsLeftRight,
  ArrowUp,
  ArrowsDownUp,
  ArrowUpRight,
  ChartBar,
  Barcode as PhBarcode,
  Bell,
  Cube,
  Package as PhPackage,
  Calendar,
  CalendarDots,
  CalendarBlank,
  Camera,
  Check,
  CheckCircle,
  CaretRight,
  ClipboardText,
  Clock,
  Copy,
  CurrencyDollar,
  DownloadSimple,
  ArrowSquareOut,
  Eye,
  FileArrowDown,
  FileXls,
  FileText,
  FileX,
  FolderOpen,
  GridFour,
  Hash,
  ClockCounterClockwise,
  HouseSimple,
  Info,
  Key,
  Stack,
  StackSimple,
  SquaresFour,
  ListChecks,
  CircleNotch,
  Lock,
  SignOut,
  MapPin,
  CornersOut,
  ChatCircleText,
  CornersIn,
  Minus,
  DotsThree,
  DotsThreeVertical,
  Palette,
  PencilSimple,
  PlayCircle,
  Plus,
  QrCode,
  ArrowsClockwise,
  ArrowCounterClockwise,
  Ruler,
  Scales,
  Scan,
  MagnifyingGlass,
  GearSix,
  Sliders,
  ShieldWarning,
  ShieldCheck,
  TShirt,
  Sparkle,
  Table,
  Trash,
  TreeEvergreen,
  TrendDown,
  TrendUp,
  Truck,
  LockOpen,
  UploadSimple,
  User,
  Users,
  MagicWand,
  Warehouse,
  X,
  XCircle,
  Lightning,
  WarningCircle,
  Warning,
} from "@phosphor-icons/react";

/** Lucide-compatible prop surface used across the codebase. */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  size?: number | string;
  color?: string;
  weight?: IconWeight;
  /** Lucide-only: silently ignored (Phosphor uses `weight`). */
  strokeWidth?: number | string;
  /** Lucide active-state pattern: `fill="currentColor"` → weight="fill". */
  fill?: string;
  /** Lucide-only: silently ignored. */
  fillOpacity?: number | string;
  /** Lucide-only: silently ignored. */
  absoluteStrokeWidth?: boolean;
}

/** Public alias so `import type { LucideIcon }` keeps compiling. */
export type LucideIcon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;

/**
 * Wrap a Phosphor icon so it accepts Lucide-style props. The active-state
 * trick (`fill="currentColor"`) is translated to Phosphor's `weight="fill"`
 * — this preserves the existing filled-when-active pattern used by
 * BottomTabBar and NavRail without changing those files' logic.
 */
function wrap(Icon: PhosphorIcon, defaultWeight: IconWeight = "duotone"): LucideIcon {
  const Wrapped = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
    const {
      strokeWidth: _sw,
      fillOpacity: _fo,
      absoluteStrokeWidth: _asw,
      fill,
      weight,
      size,
      color,
      className,
      ...rest
    } = props;
    // Active-state translation: Lucide callers pass fill="currentColor" to
    // indicate "on" — map that to Phosphor's fill weight.
    const effectiveWeight: IconWeight =
      weight ?? (fill && fill !== "none" ? "fill" : defaultWeight);
    return (
      <Icon
        ref={ref}
        size={size}
        color={color}
        weight={effectiveWeight}
        className={className}
        {...rest}
      />
    );
  });
  Wrapped.displayName = `Icon(${Icon.displayName ?? "Phosphor"})`;
  return Wrapped;
}

// ── Lucide-named exports ────────────────────────────────────────────────
// Keep names identical to lucide-react so imports migrate 1:1.

export const IconActivity = wrap(Activity);
// Some Lucide icons don't have exact Phosphor twins; picks below prioritise
// visual/semantic equivalence over literal naming.
export { IconActivity as Activity };
export const AlertCircle = wrap(WarningCircle);
export const AlertTriangle = wrap(Warning);
const _Archive = wrap(Archive);
export { _Archive as Archive };
const _ArrowDown = wrap(ArrowDown);
export { _ArrowDown as ArrowDown };
const _ArrowLeft = wrap(ArrowLeft);
export { _ArrowLeft as ArrowLeft };
const _ArrowRight = wrap(ArrowRight);
export { _ArrowRight as ArrowRight };
export const ArrowRightLeft = wrap(ArrowsLeftRight);
const _ArrowUp = wrap(ArrowUp);
export { _ArrowUp as ArrowUp };
export const ArrowUpDown = wrap(ArrowsDownUp);
const _ArrowUpRight = wrap(ArrowUpRight);
export { _ArrowUpRight as ArrowUpRight };
export const BarChart3 = wrap(ChartBar);
export const Barcode = wrap(PhBarcode);
const _Bell = wrap(Bell);
export { _Bell as Bell };
export const Box = wrap(Cube);
export const Boxes = wrap(StackSimple);
const _Calendar = wrap(Calendar);
export { _Calendar as Calendar };
export const CalendarDays = wrap(CalendarDots);
export const CalendarRange = wrap(CalendarBlank);
const _Camera = wrap(Camera);
export { _Camera as Camera };
const _Check = wrap(Check);
export { _Check as Check };
export const CheckCircle2 = wrap(CheckCircle);
export const ChevronRight = wrap(CaretRight);
export const ClipboardList = wrap(ClipboardText);
const _Clock = wrap(Clock);
export { _Clock as Clock };
const _Copy = wrap(Copy);
export { _Copy as Copy };
export const DollarSign = wrap(CurrencyDollar);
export const Download = wrap(DownloadSimple);
export const ExternalLink = wrap(ArrowSquareOut);
const _Eye = wrap(Eye);
export { _Eye as Eye };
export const FileDown = wrap(FileArrowDown);
export const FileSpreadsheet = wrap(FileXls);
const _FileText = wrap(FileText);
export { _FileText as FileText };
export const FileWarning = wrap(FileX);
const _FolderOpen = wrap(FolderOpen);
export { _FolderOpen as FolderOpen };
export const Grid3X3 = wrap(GridFour);
const _Hash = wrap(Hash);
export { _Hash as Hash };
export const History = wrap(ClockCounterClockwise);
export const Home = wrap(HouseSimple);
const _Info = wrap(Info);
export { _Info as Info };
export const KeyRound = wrap(Key);
export const Layers = wrap(Stack);
export const Layers3 = wrap(Stack);
export const LayoutDashboard = wrap(SquaresFour);
const _ListChecks = wrap(ListChecks);
export { _ListChecks as ListChecks };
export const Loader2 = wrap(CircleNotch, "bold");
const _Lock = wrap(Lock);
export { _Lock as Lock };
export const LogOut = wrap(SignOut);
const _MapPin = wrap(MapPin);
export { _MapPin as MapPin };
export const Maximize2 = wrap(CornersOut);
export const MessageSquare = wrap(ChatCircleText);
export const Minimize2 = wrap(CornersIn);
const _Minus = wrap(Minus);
export { _Minus as Minus };
export const MoreHorizontal = wrap(DotsThree);
export const MoreVertical = wrap(DotsThreeVertical);
export const Package = wrap(PhPackage);
export const PackagePlus = wrap(PhPackage);
export const PackageX = wrap(PhPackage);
const _Palette = wrap(Palette);
export { _Palette as Palette };
export const Pencil = wrap(PencilSimple);
const _PlayCircle = wrap(PlayCircle);
export { _PlayCircle as PlayCircle };
const _Plus = wrap(Plus);
export { _Plus as Plus };
const _QrCode = wrap(QrCode);
export { _QrCode as QrCode };
export const RefreshCw = wrap(ArrowsClockwise);
export const RotateCcw = wrap(ArrowCounterClockwise);
const _Ruler = wrap(Ruler);
export { _Ruler as Ruler };
export const Scale = wrap(Scales);
export const ScanBarcode = wrap(PhBarcode);
export const ScanLine = wrap(Scan);
export const Search = wrap(MagnifyingGlass);
export const Settings = wrap(GearSix);
export const Settings2 = wrap(Sliders);
export const ShieldAlert = wrap(ShieldWarning);
const _ShieldCheck = wrap(ShieldCheck);
export { _ShieldCheck as ShieldCheck };
export const Shirt = wrap(TShirt);
export const Sparkles = wrap(Sparkle);
const _Table = wrap(Table);
export { _Table as Table };
export const Trash2 = wrap(Trash);
export const TreePine = wrap(TreeEvergreen);
export const TrendingDown = wrap(TrendDown);
export const TrendingUp = wrap(TrendUp);
const _Truck = wrap(Truck);
export { _Truck as Truck };
export const Unlock = wrap(LockOpen);
export const Upload = wrap(UploadSimple);
const _User = wrap(User);
export { _User as User };
const _Users = wrap(Users);
export { _Users as Users };
export const Wand2 = wrap(MagicWand);
const _Warehouse = wrap(Warehouse);
export { _Warehouse as Warehouse };
const _X = wrap(X);
export { _X as X };
const _XCircle = wrap(XCircle);
export { _XCircle as XCircle };
export const Zap = wrap(Lightning);
