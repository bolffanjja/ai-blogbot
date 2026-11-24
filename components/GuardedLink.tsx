"use client";

// Obični Next.js <Link>, ali pre prelaska proverava da li sme da se ode sa stranice
// (generisanje u toku ili nesačuvane izmene).

import Link from "next/link";
import type { ComponentProps } from "react";
import { requestNavigation } from "@/lib/unsavedChanges";

export default function GuardedLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        const href = typeof props.href === "string" ? props.href : String(props.href);
        // Link na stranicu na kojoj smo već — ne zaustavljamo
        if (href !== window.location.pathname && !requestNavigation(href)) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    />
  );
}
