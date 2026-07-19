/**
 * Domain-specific icons for the textile/warehouse ERP.
 *
 * Hand-drawn SVGs at 24x24, stroke-based (currentColor) so semantic tokens
 * work. Each accepts the same prop surface as the Tabler wrapper —
 * `size`, `stroke`/`strokeWidth`, `fill` (active state pattern), etc.
 *
 * These are the icons that make the product feel like *this* product and
 * not a generic dashboard: fabric roll, wood plank, motor with fins,
 * warehouse rack, scan gun, hangtag, shipping truck, deposit transfer.
 */
import { forwardRef, type SVGProps, type ForwardRefExoticComponent, type RefAttributes } from "react";

export interface DomainIconProps extends Omit<SVGProps<SVGSVGElement>, "ref" | "stroke"> {
  size?: number | string;
  stroke?: number | string;
  strokeWidth?: number | string;
  color?: string;
  /** Lucide active-state pattern → thicker stroke (matches Tabler wrapper). */
  fill?: string;
  fillOpacity?: number | string;
  absoluteStrokeWidth?: boolean;
}

type DomainIcon = ForwardRefExoticComponent<DomainIconProps & RefAttributes<SVGSVGElement>>;

function make(displayName: string, children: React.ReactNode, defaultStroke = 1.5): DomainIcon {
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
    const sw = Number(stroke ?? strokeWidth ?? (active ? 2.25 : defaultStroke));
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

// ── Fabric roll — tecido ─────────────────────────────────────────────────
// Cylindrical roll shown in 3/4 with an inner curl indicating the material
// is wound. Ellipse cap on top, side profile, and a small curl inside the
// mouth to read as "fabric" not just "cylinder".
export const FabricRoll = make(
  "FabricRoll",
  <>
    <ellipse cx="12" cy="5" rx="7.5" ry="2.5" />
    <path d="M4.5 5v14c0 1.38 3.36 2.5 7.5 2.5s7.5-1.12 7.5-2.5V5" />
    <path d="M8.5 5.2v13.6M15.5 5.2v18.6" transform="translate(0,-0.2)" />
    <path d="M9 8c1.2.6 4.8.6 6 0" opacity="0.55" />
    <path d="M9 14c1.2.6 4.8.6 6 0" opacity="0.55" />
  </>,
);

// ── Wood plank — madeira ─────────────────────────────────────────────────
// Isometric plank with two grain arcs inside. The corner bevel signals
// "cut lumber" rather than a generic rectangle.
export const WoodPlank = make(
  "WoodPlank",
  <>
    <path d="M3 7.5l4-2h14v11l-4 2H3z" />
    <path d="M3 7.5l14 0M17 5.5v13" />
    <path d="M7 10.5c2 1 2 4 0 5" opacity="0.7" />
    <path d="M12 10c2.5 1.2 2.5 4.8 0 6" opacity="0.7" />
  </>,
);

// ── Motor with cooling fins — motor ──────────────────────────────────────
// Cylindrical body, four fins on top (heat sink), shaft on the right.
// Reads as "electric motor" instantly.
export const MotorCoil = make(
  "MotorCoil",
  <>
    <rect x="4" y="8" width="13" height="9" rx="1" />
    <path d="M6 8V5.5M9 8V5.5M12 8V5.5M15 8V5.5" />
    <path d="M4 17v1.5h13V17" />
    <circle cx="10.5" cy="12.5" r="1.8" />
    <path d="M17 12.5h4" />
    <path d="M20 11.5v2" />
  </>,
);

// ── Warehouse rack — estoque/mapa ────────────────────────────────────────
// Two-tier shelving with cells. The dot inside two cells hints at "occupied
// positions" — the same visual language of the 2D map.
export const WarehouseRack = make(
  "WarehouseRack",
  <>
    <path d="M3 4v17M21 4v17M3 4h18" />
    <path d="M3 11h18M3 17h18" />
    <path d="M9 4v17M15 4v17" />
    <path d="M6 7.5h.01M12 14h.01" strokeWidth="2.5" />
  </>,
);

// ── Scan gun — conferência/bipagem ───────────────────────────────────────
// Pistol-grip barcode scanner with a beam. The trigger and beam make it
// unmistakable versus a generic "scan area" icon.
export const ScanGun = make(
  "ScanGun",
  <>
    <path d="M3 8h9a2 2 0 0 1 2 2v3H3z" />
    <path d="M14 10.5l5-2.5v7l-5-2.5z" />
    <path d="M7 13v5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5" />
    <path d="M19 8l2.5-1M19 15l2.5 1" opacity="0.7" />
    <path d="M20.5 11.5h1.5" opacity="0.7" />
  </>,
);

// ── Hang tag with QR — etiquetas ─────────────────────────────────────────
// Diagonal hangtag with eyelet and a tiny QR grid — signals "label to be
// printed", the etiquetas module's whole reason to exist.
export const LabelTag = make(
  "LabelTag",
  <>
    <path d="M3 11l8-8h7a2 2 0 0 1 2 2v7l-8 8a2 2 0 0 1-2.83 0l-6.17-6.17a2 2 0 0 1 0-2.83z" />
    <circle cx="15" cy="9" r="1.2" />
    <path d="M8 11h2v2H8zM11 11h1v1h-1zM8 14h1v1H8zM10 14h2v2h-2z" strokeWidth="0.8" />
  </>,
);

// ── Shipping truck — saída ───────────────────────────────────────────────
// Side profile with fabric roll silhouette inside the box body.
export const ShippingTruck = make(
  "ShippingTruck",
  <>
    <path d="M1 6h13v11H1z" />
    <path d="M14 10h4l3 3v4h-7z" />
    <circle cx="5.5" cy="18" r="1.8" />
    <circle cx="17" cy="18" r="1.8" />
    <path d="M4 10.5c2 0 2 4 0 4" opacity="0.6" />
    <path d="M8.5 10.5c2 0 2 4 0 4" opacity="0.6" />
  </>,
);

// ── Transfer between deposits — transferências ───────────────────────────
// Two shelves with bi-directional arrows between them. Reads as
// "movement between locations", not a generic left/right swap.
export const DepositTransfer = make(
  "DepositTransfer",
  <>
    <path d="M2 7v13h5V7zM17 7v13h5V7z" />
    <path d="M2 12h5M17 12h5" opacity="0.6" />
    <path d="M8 9.5h8m0 0l-2-2m2 2l-2 2" />
    <path d="M16 16H8m0 0l2 2m-2-2l2-2" />
  </>,
);

// ── Cadastros — clipboard with product silhouette ────────────────────────
// Clipboard with a small fabric roll indicated on the sheet.
export const ProductRegistry = make(
  "ProductRegistry",
  <>
    <path d="M5 5h4V3h6v2h4v16H5z" />
    <path d="M9 3h6v3H9z" />
    <ellipse cx="12" cy="12" rx="4" ry="1.3" />
    <path d="M8 12v5c0 .8 1.8 1.4 4 1.4s4-.6 4-1.4v-5" />
  </>,
);

// ── Audit — shield with checkmark and inspection lines ───────────────────
export const AuditShield = make(
  "AuditShield",
  <>
    <path d="M12 2.5l8 3v6.5c0 4.8-3.6 8-8 9.5-4.4-1.5-8-4.7-8-9.5V5.5z" />
    <path d="M8.5 12l2.5 2.5 4.5-5" />
  </>,
);

// ── Entradas — box being received into rack ─────────────────────────────
export const StockEntry = make(
  "StockEntry",
  <>
    <path d="M12 3v9m0 0l-3-3m3 3l3-3" />
    <path d="M3 14h18v7H3z" />
    <path d="M3 18h18" opacity="0.5" />
    <path d="M9 14v7M15 14v7" />
  </>,
);

// ── Reservas — tag with clock ────────────────────────────────────────────
export const ReservationTag = make(
  "ReservationTag",
  <>
    <path d="M3 3h8l10 10-8 8L3 11z" />
    <circle cx="7.5" cy="7.5" r="1.4" />
    <circle cx="16" cy="16" r="3.2" />
    <path d="M16 14v2l1.4 1" />
  </>,
);

// ── History — stacked cards with clock ───────────────────────────────────
export const HistoryStack = make(
  "HistoryStack",
  <>
    <path d="M7 6h11v13H7z" />
    <path d="M4 9h3M4 12h3M4 15h3" opacity="0.6" />
    <circle cx="12.5" cy="12.5" r="3.5" />
    <path d="M12.5 10.5V12.5L14 13.8" />
  </>,
);

// ── Dashboard — mixed tiles with chart ───────────────────────────────────
export const DashboardTiles = make(
  "DashboardTiles",
  <>
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="3" width="8" height="4" rx="1" />
    <rect x="13" y="9" width="8" height="6" rx="1" />
    <rect x="3" y="13" width="18" height="8" rx="1" />
    <path d="M6 18l3-3 3 2 5-4" opacity="0.7" />
  </>,
);

// ── Home — warehouse silhouette ──────────────────────────────────────────
export const WarehouseHome = make(
  "WarehouseHome",
  <>
    <path d="M3 10l9-6 9 6v11H3z" />
    <path d="M9 21v-7h6v7" />
    <path d="M9 14h6" opacity="0.5" />
  </>,
);
