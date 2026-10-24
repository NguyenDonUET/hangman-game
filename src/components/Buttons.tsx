import type { ComponentPropsWithRef } from "react";
import { classNames } from "./classNames";

type IconButtonProps = {
  label: string;
  icon: string;
  size?: "nav" | "play";
} & Omit<ComponentPropsWithRef<"button">, "type" | "aria-label" | "children">;

export function IconButton({ label, icon, size = "nav", className, ref, ...props }: IconButtonProps) {
  return (
    <button
      {...props}
      ref={ref}
      type="button"
      className={classNames("icon-btn", size === "play" ? "icon-btn-play" : "icon-btn-nav", className)}
      aria-label={label}
    >
      <img src={icon} alt="" />
    </button>
  );
}

type TextButtonProps = {
  variant?: "blue" | "pink";
} & Omit<ComponentPropsWithRef<"button">, "type">;

export function TextButton({ variant = "blue", className, ref, ...props }: TextButtonProps) {
  return (
    <button
      {...props}
      ref={ref}
      type="button"
      className={classNames("btn", variant === "pink" && "btn-pink", className)}
    />
  );
}
