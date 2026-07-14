import Link from "next/link";
import { Check, X } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { PasswordPolicySummary } from "../types";

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {met ? (
        <Check className="h-4 w-4 text-primary" aria-hidden />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" aria-hidden />
      )}
      <span className={met ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

export function PasswordPolicyCard({ policy }: { policy: PasswordPolicySummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Password policy</CardTitle>
        <CardDescription>Enforced whenever any user sets a new password.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          <Requirement met label={`At least ${policy.minPasswordLength} characters`} />
          <Requirement met={policy.requirePasswordUppercase} label="Uppercase letter required" />
          <Requirement met={policy.requirePasswordNumber} label="Number required" />
          <Requirement met={policy.requirePasswordSymbol} label="Symbol required" />
        </ul>
      </CardContent>
      <CardFooter>
        <Link href="/admin/settings" className="text-sm text-primary hover:underline">
          Edit in Settings
        </Link>
      </CardFooter>
    </Card>
  );
}
