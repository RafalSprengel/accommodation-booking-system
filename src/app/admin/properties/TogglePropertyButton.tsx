"use client";

import { useTransition } from "react";
import Button from "@/app/_components/UI/Button/Button";
import { togglePropertyActive } from "@/actions/adminPropertyActions";

interface TogglePropertyButtonProps {
  id: string;
  isActive: boolean;
}

export default function TogglePropertyButton({ id, isActive }: TogglePropertyButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await togglePropertyActive(id, !isActive);
    });
  };

  return (
    <Button 
      type="button" 
      variant="secondary" 
      fullWidth 
      onClick={handleToggle}
      disabled={isPending}
    >
      {isPending ? "Zapisywanie..." : (isActive ? "🔘 Dezaktywuj" : "✅ Aktywuj")}
    </Button>
  );
}
