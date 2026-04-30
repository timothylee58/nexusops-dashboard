import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command.tsx";

export default function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to page or action…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem
            onSelect={() => {
              navigate("/");
              setOpen(false);
            }}
          >
            Dashboard
            <CommandShortcut>⌘1</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              navigate("/analytics");
              setOpen(false);
            }}
          >
            Analytics
          </CommandItem>
          <CommandItem
            onSelect={() => {
              navigate("/audit");
              setOpen(false);
            }}
          >
            Audit logs
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              window.dispatchEvent(new CustomEvent("nexus-open-send"));
              setOpen(false);
            }}
          >
            Send cross-border payment
          </CommandItem>
          <CommandItem
            onSelect={() => {
              const feed = document.querySelector<HTMLInputElement>(
                '[aria-label="Search transactions by reference id"]'
              );
              feed?.focus();
              setOpen(false);
            }}
          >
            Focus feed search field
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
