/**
 * Icon compatibility layer — Tabler Icons (outline, 1.5px stroke) with a
 * Lucide-compatible API.
 *
 * Why: Tabler gives a refined, uniform outline style used by Vercel/Supabase/
 * Linear — much more "professional ERP" than Lucide's default weight and
 * without the duotone/playful feel of Phosphor. MIT-licensed.
 *
 * How: exports icons under their **Lucide names** so the rest of the
 * codebase keeps working with `import { Foo } from "@/components/icons"`.
 * Each wrapper:
 *   1. Defaults `stroke={1.5}` for a refined weight.
 *   2. Maps Lucide's active-state pattern (`fill="currentColor"`) to a
 *      thicker stroke (2.25) since Tabler is outline-only. Combined with
 *      the color/drop-shadow already applied by BottomTabBar/NavRail, the
 *      active state stays visually distinct.
 *   3. Silently drops Lucide-only props so existing call sites compile.
 *
 * Do NOT hard-code colors here — every icon inherits `currentColor` so
 * semantic tokens (`text-primary`, `text-muted-foreground`) keep working.
 */
import { forwardRef, type SVGProps, type ForwardRefExoticComponent, type RefAttributes } from "react";
import {
  IconActivity,
  IconAlertCircle,
  IconAlertTriangle,
  IconArchive,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowsLeftRight,
  IconArrowUp,
  IconArrowsUpDown,
  IconArrowUpRight,
  IconChartBar,
  IconBarcode,
  IconBell,
  IconBox,
  IconStack2,
  IconPackage,
  IconPackageImport,
  IconPackageOff,
  IconCalendar,
  IconCalendarEvent,
  IconCalendarTime,
  IconCamera,
  IconCheck,
  IconCircleCheck,
  IconChevronRight,
  IconChevronLeft,
  IconClipboardList,
  IconClock,
  IconCopy,
  IconCurrencyDollar,
  IconDownload,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconFileDownload,
  IconFileSpreadsheet,
  IconFileText,
  IconFileAlert,
  IconFolderOpen,
  IconGridDots,
  IconHash,
  IconHistory,
  IconHome,
  IconInfoCircle,
  IconKey,
  IconStack,
  IconLayoutDashboard,
  IconListCheck,
  IconLoader2,
  IconLock,
  IconLockOpen,
  IconLogout,
  IconMapPin,
  IconMaximize,
  IconMinimize,
  IconMessage,
  IconMinus,
  IconDots,
  IconDotsVertical,
  IconPalette,
  IconPencil,
  IconPlayerPlay,
  IconPlus,
  IconQrcode,
  IconRefresh,
  IconRotate,
  IconRuler,
  IconScale,
  IconScan,
  IconSearch,
  IconSettings,
  IconAdjustments,
  IconShieldExclamation,
  IconShieldCheck,
  IconShirt,
  IconSparkles,
  IconTable,
  IconTrash,
  IconTree,
  IconTrendingDown,
  IconTrendingUp,
  IconTruck,
  IconUpload,
  IconUser,
  IconUsers,
  IconWand,
  IconBuildingWarehouse,
  IconX,
  IconCircleX,
  IconBolt,
  IconCloud,
  IconCpu,
  IconDatabase,
  IconGitCompare,
  IconDeviceLaptop,
  IconLink,
  IconList,
  IconMail,
  IconMoon,
  IconPower,
  IconDeviceFloppy,
  IconShield,
  IconDeviceMobile,
  IconSun,
  IconWifi,
  IconWifiOff,
  type Icon as TablerIcon,
  type IconProps as TablerIconProps,
} from "@tabler/icons-react";

/** Lucide-compatible prop surface. `stroke` is omitted from SVGProps so we
 *  can widen it to `number | string` matching Lucide's public type. */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref" | "stroke"> {
  size?: number | string;
  color?: string;
  stroke?: number | string;
  strokeWidth?: number | string;
  fill?: string;
  fillOpacity?: number | string;
  absoluteStrokeWidth?: boolean;
}

/** Public alias so `import type { LucideIcon }` keeps compiling. */
export type LucideIcon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;

function wrap(Icon: TablerIcon, defaultStroke: number = 1.5): LucideIcon {
  // Tabler icons are already forwardRef components; we widen the type so
  // React accepts our compat props.
  const IconAny = Icon as unknown as ForwardRefExoticComponent<
    Omit<TablerIconProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  const Wrapped = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
    const {
      strokeWidth,
      stroke,
      fill,
      fillOpacity: _fo,
      absoluteStrokeWidth: _asw,
      size,
      color,
      className,
      ...rest
    } = props;
    const active = fill && fill !== "none";
    const effectiveStroke =
      stroke ?? strokeWidth ?? (active ? 2.25 : defaultStroke);
    return (
      <IconAny
        ref={ref}
        size={size as TablerIconProps["size"]}
        color={color}
        stroke={Number(effectiveStroke)}
        className={className}
        {...(rest as Record<string, unknown>)}
      />
    );
  });
  Wrapped.displayName = `Icon(Tabler)`;
  return Wrapped;
}

// ── Lucide-named exports ────────────────────────────────────────────────
export const Activity = wrap(IconActivity);
export const AlertCircle = wrap(IconAlertCircle);
export const AlertTriangle = wrap(IconAlertTriangle);
export const Archive = wrap(IconArchive);
export const ArrowDown = wrap(IconArrowDown);
export const ArrowLeft = wrap(IconArrowLeft);
export const ArrowRight = wrap(IconArrowRight);
export const ArrowRightLeft = wrap(IconArrowsLeftRight);
export const ArrowUp = wrap(IconArrowUp);
export const ArrowUpDown = wrap(IconArrowsUpDown);
export const ArrowUpRight = wrap(IconArrowUpRight);
export const BarChart3 = wrap(IconChartBar);
export const Barcode = wrap(IconBarcode);
export const Bell = wrap(IconBell);
export const Box = wrap(IconBox);
export const Boxes = wrap(IconStack2);
export const Calendar = wrap(IconCalendar);
export const CalendarDays = wrap(IconCalendarEvent);
export const CalendarRange = wrap(IconCalendarTime);
export const Camera = wrap(IconCamera);
export const Check = wrap(IconCheck);
export const CheckCircle2 = wrap(IconCircleCheck);
export const ChevronRight = wrap(IconChevronRight);
export const ChevronLeft = wrap(IconChevronLeft);
export const ClipboardList = wrap(IconClipboardList);
export const Clock = wrap(IconClock);
export const Cloud = wrap(IconCloud);
export const Copy = wrap(IconCopy);
export const Cpu = wrap(IconCpu);
export const Database = wrap(IconDatabase);
export const DollarSign = wrap(IconCurrencyDollar);
export const Download = wrap(IconDownload);
export const ExternalLink = wrap(IconExternalLink);
export const Eye = wrap(IconEye);
export const EyeOff = wrap(IconEyeOff);
export const FileDown = wrap(IconFileDownload);
export const FileSpreadsheet = wrap(IconFileSpreadsheet);
export const FileText = wrap(IconFileText);
export const FileWarning = wrap(IconFileAlert);
export const FolderOpen = wrap(IconFolderOpen);
export const GitCompare = wrap(IconGitCompare);
export const Grid3X3 = wrap(IconGridDots);
export const Hash = wrap(IconHash);
export const History = wrap(IconHistory);
export const Home = wrap(IconHome);
export const Info = wrap(IconInfoCircle);
export const KeyRound = wrap(IconKey);
export const Laptop = wrap(IconDeviceLaptop);
export const Layers = wrap(IconStack);
export const Layers3 = wrap(IconStack);
export const LayoutDashboard = wrap(IconLayoutDashboard);
export const Link = wrap(IconLink);
export const List = wrap(IconList);
export const ListChecks = wrap(IconListCheck);
export const Loader2 = wrap(IconLoader2, 2);
export const Lock = wrap(IconLock);
export const LogOut = wrap(IconLogout);
export const Mail = wrap(IconMail);
export const MapPin = wrap(IconMapPin);
export const Maximize2 = wrap(IconMaximize);
export const MessageSquare = wrap(IconMessage);
export const Minimize2 = wrap(IconMinimize);
export const Minus = wrap(IconMinus);
export const Moon = wrap(IconMoon);
export const MoreHorizontal = wrap(IconDots);
export const MoreVertical = wrap(IconDotsVertical);
export const Package = wrap(IconPackage);
export const PackagePlus = wrap(IconPackageImport);
export const PackageX = wrap(IconPackageOff);
export const Palette = wrap(IconPalette);
export const Pencil = wrap(IconPencil);
export const PlayCircle = wrap(IconPlayerPlay);
export const Plus = wrap(IconPlus);
export const Power = wrap(IconPower);
export const QrCode = wrap(IconQrcode);
export const RefreshCw = wrap(IconRefresh);
export const RotateCcw = wrap(IconRotate);
export const Ruler = wrap(IconRuler);
export const Save = wrap(IconDeviceFloppy);
export const Scale = wrap(IconScale);
export const ScanBarcode = wrap(IconBarcode);
export const ScanLine = wrap(IconScan);
export const Search = wrap(IconSearch);
export const Settings = wrap(IconSettings);
export const Settings2 = wrap(IconAdjustments);
export const Shield = wrap(IconShield);
export const ShieldAlert = wrap(IconShieldExclamation);
export const ShieldCheck = wrap(IconShieldCheck);
export const Shirt = wrap(IconShirt);
export const Smartphone = wrap(IconDeviceMobile);
export const Sparkles = wrap(IconSparkles);
export const Sun = wrap(IconSun);
export const Table = wrap(IconTable);
export const Trash2 = wrap(IconTrash);
export const TreePine = wrap(IconTree);
export const TrendingDown = wrap(IconTrendingDown);
export const TrendingUp = wrap(IconTrendingUp);
export const Truck = wrap(IconTruck);
export const Unlock = wrap(IconLockOpen);
export const Upload = wrap(IconUpload);
export const User = wrap(IconUser);
export const Users = wrap(IconUsers);
export const Wand2 = wrap(IconWand);
export const Warehouse = wrap(IconBuildingWarehouse);
export const Wifi = wrap(IconWifi);
export const WifiOff = wrap(IconWifiOff);
export const X = wrap(IconX);
export const XCircle = wrap(IconCircleX);
export const Zap = wrap(IconBolt);
