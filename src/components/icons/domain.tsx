/**
 * Domain-specific icons — minimal, professional, low-detail.
 *
 * Design brief: one clear silhouette per icon, thin 1.25px stroke by default,
 * no secondary hatching, no interior busy-work. The icon should read at
 * 16px in the sidebar without visual noise.
 */
import { forwardRef, type SVGProps, type ForwardRefExoticComponent, type RefAttributes } from "react";

export interface DomainIconProps extends Omit<SVGProps<SVGSVGElement>, "ref" | "stroke"> {
  size?: number | string;
  stroke?: number | string;
  strokeWidth?: number | string;
  color?: string;
  fill?: string;
  fillOpacity?: number | string;
  absoluteStrokeWidth?: boolean;
}

type DomainIcon = ForwardRefExoticComponent<DomainIconProps & RefAttributes<SVGSVGElement>>;

function make(displayName: string, children: React.ReactNode, defaultStroke = 1.25): DomainIcon {
  const Icon = forwardRef<SVGSVGElement, DomainIconProps>((props, ref) => {
    const {
      size = 24,
      stroke,
      strokeWidth,
      fill,
      fillOpacity: _fo,
      absoluteStrokeWidth: _asw,
      color,
      className,
      ...rest
    } = props;
    const active = fill && fill !== "none";
    const sw = Number(stroke ?? strokeWidth ?? (active ? 1.9 : defaultStroke));
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color ?? "currentColor"}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...rest}
      >
        {children}
      </svg>
    );
  });
  Icon.displayName = displayName;
  return Icon;
}

// Fabric roll — cylinder, one inner line hinting the wound edge.
export const FabricRoll = make("FabricRoll", (
  <>
    <ellipse cx="12" cy="6" rx="7" ry="2.25" />
    <path d="M5 6v12c0 1.24 3.13 2.25 7 2.25s7-1.01 7-2.25V6" />
    <path d="M9 6.2v13.6" opacity="0.55" />
  </>
));

// Wood plank — simple bevelled board, no grain hatching.
export const WoodPlank = make("WoodPlank", (
  <>
    <path d="M3.5 8l4-2h13v10l-4 2h-13z" />
    <path d="M3.5 8h13m0-2v12" opacity="0.55" />
  </>
));

// Motor — cylinder with a single fin bar on top and shaft.
export const MotorCoil = make("MotorCoil", (
  <>
    <rect x="4" y="9" width="12" height="8" rx="1" />
    <path d="M6.5 9V6.5M10 9V6.5M13.5 9V6.5" />
    <path d="M16 13h5" />
  </>
));

// Warehouse rack — clean 2x2 shelf, no dot markers.
export const WarehouseRack = make("WarehouseRack", (
  <>
    <path d="M4 5v15M20 5v15M4 5h16" />
    <path d="M4 12.5h16" />
    <path d="M12 5v15" opacity="0.55" />
  </>
));

// Scan gun — cleaner pistol grip, no beam ticks.
export const ScanGun = make("ScanGun", (
  <>
    <path d="M3 8.5h10a2 2 0 0 1 2 2v2.5H3z" />
    <path d="M15 10l5-2v6l-5-2z" />
    <path d="M7 13v5h4v-5" />
  </>
));

// Hang tag — single hangtag, no QR grid inside.
export const LabelTag = make("LabelTag", (
  <>
    <path d="M3 11l8-8h7a2 2 0 0 1 2 2v7l-8 8a2 2 0 0 1-2.83 0l-6.17-6.17a2 2 0 0 1 0-2.83z" />
    <circle cx="15.5" cy="8.5" r="1.15" />
  </>
));

// Shipping truck — plain side profile.
export const ShippingTruck = make("ShippingTruck", (
  <>
    <path d="M2 7h12v10H2z" />
    <path d="M14 10.5h4l3 3v3.5h-7z" />
    <circle cx="6" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </>
));

// Deposit transfer — two slim shelves with a single arrow between.
export const DepositTransfer = make("DepositTransfer", (
  <>
    <path d="M3 6v14h4V6zM17 6v14h4V6z" />
    <path d="M8 12h8m0 0l-2-2m2 2l-2 2" />
  </>
));

// Product registry — clipboard, one horizontal line.
export const ProductRegistry = make("ProductRegistry", (
  <>
    <path d="M5 5h4V3.5h6V5h4v16H5z" />
    <path d="M9 3.5h6V6H9z" />
    <path d="M9 12h6M9 15.5h4" opacity="0.55" />
  </>
));

// Audit — shield with check.
export const AuditShield = make("AuditShield", (
  <>
    <path d="M12 3l8 3v6c0 4.4-3.4 7.6-8 9-4.6-1.4-8-4.6-8-9V6z" />
    <path d="M9 12l2.25 2.25L15.5 10" />
  </>
));

// Stock entry — arrow down into a tray.
export const StockEntry = make("StockEntry", (
  <>
    <path d="M12 3v10m0 0l-3-3m3 3l3-3" />
    <path d="M4 15h16v5H4z" />
  </>
));

// Reservation — tag with a small clock accent.
export const ReservationTag = make("ReservationTag", (
  <>
    <path d="M3 4h8l10 10-8 8L3 12z" />
    <circle cx="8" cy="8" r="1.15" />
    <circle cx="16.5" cy="16.5" r="2.8" />
  </>
));

// History — a single card with a clock.
export const HistoryStack = make("HistoryStack", (
  <>
    <path d="M5 5h12v14H5z" />
    <circle cx="15.5" cy="15.5" r="3.5" fill="var(--background, #fff)" />
    <path d="M15.5 13.5v2l1.4 1" />
  </>
));

// Dashboard — clean 2x2 tiles.
export const DashboardTiles = make("DashboardTiles", (
  <>
    <rect x="4" y="4" width="7" height="7" rx="1" />
    <rect x="13" y="4" width="7" height="7" rx="1" />
    <rect x="4" y="13" width="7" height="7" rx="1" />
    <rect x="13" y="13" width="7" height="7" rx="1" />
  </>
));

// Home — pitched roof over a slim base.
export const WarehouseHome = make("WarehouseHome", (
  <>
    <path d="M3 11l9-6.5 9 6.5v10H3z" />
    <path d="M10 21v-6h4v6" />
  </>
));
