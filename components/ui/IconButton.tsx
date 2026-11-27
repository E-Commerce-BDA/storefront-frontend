import { forwardRef } from "react";

/** Dumb IconButton — squarish 40px trigger; paint/state/motion live in .sf-iconbtn CSS. */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: React.ReactNode;
  size?: number;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, children, size = 40, className = "", style = {}, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={`sf-iconbtn ${className}`}
      style={{ width: size, height: size, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
});

export default IconButton;
