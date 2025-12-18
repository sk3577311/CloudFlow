"use client";
import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonCard() {
  return (
    <div className="tf-card rounded-[22px] p-6 opacity-70">
      <Skeleton className="h-4 w-24 mb-3 bg-[#2a2c2f]" />
      <Skeleton className="h-8 w-20 bg-[#2a2c2f]" />
    </div>
  );
}
