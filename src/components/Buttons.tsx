import type { ButtonHTMLAttributes } from "react";

type IconButtonProps = {
  label: string;
  icon: string;
  size?: "nav" | "play";
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function IconButton({ label, icon, size = "nav", className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={["icon-btn", size === "play" ? "icon-btn-play" : "icon-btn-nav", className]
        .filter(Boolean)
        .join(" ")}
      aria-label={label}
      {...props}
    >
      <img src={icon} alt="" />
    </button>
  );
}

type TextButtonProps = {
  variant?: "blue" | "pink";
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function TextButton({ variant = "blue", className, ...props }: TextButtonProps) {
  return (
    <button
      type="button"
      className={["btn", variant === "pink" ? "btn-pink" : "", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
