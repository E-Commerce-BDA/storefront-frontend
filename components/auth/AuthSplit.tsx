import type { ReactNode } from "react";
import type { AuthMobile, PanelSide, SplitRatio } from "@/lib/auth/settings";

/**
 * Dumb AuthSplit — panel + form arrangement. Side/ratio/mobile arrive as
 * props and reach CSS only through data-* attrs. props → JSX only.
 */
export interface AuthSplitProps {
  panelSide?: PanelSide;
  ratio?: SplitRatio;
  mobile?: AuthMobile;
  panel: ReactNode;
  form: ReactNode;
  className?: string;
}

export default function AuthSplit({
  panelSide = "left",
  ratio = "50-50",
  mobile = "stacked",
  panel,
  form,
  className = "",
}: AuthSplitProps) {
  return (
    <div
      className={`sf-auth__split ${className}`}
      data-side={panelSide}
      data-ratio={ratio}
      data-mobile={mobile}
    >
      <div className="sf-auth__panel-wrap">{panel}</div>
      <div className="sf-auth__form-wrap">{form}</div>
    </div>
  );
}
