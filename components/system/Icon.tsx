import * as React from "react";

export interface IconProps {
  /** Material Symbols Rounded ligature name, e.g. "home", "lock". */
  name: string;
  size?: number;
  /** Filled variant (used for active nav items). */
  fill?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

/** Material Symbols Rounded icon. Ported from the prototype's FeIcon. */
export function Icon({ name, size = 24, fill = false, style, className }: IconProps) {
  return (
    <span
      className={"fe-icon" + (fill ? " fe-icon--fill" : "") + (className ? " " + className : "")}
      aria-hidden="true"
      style={{ fontSize: size, ...style }}
    >
      {name}
    </span>
  );
}
