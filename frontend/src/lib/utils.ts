import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const militaryTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatMilitaryTime(value: string) {
  if (!value) {
    return "--:--";
  }

  const isoDate = new Date(value);
  if (!Number.isNaN(isoDate.getTime()) && value.includes("T")) {
    return militaryTimeFormatter.format(isoDate);
  }

  const timeMatch = value.match(/^(\d{2}):(\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}`;
  }

  if (!Number.isNaN(isoDate.getTime())) {
    return militaryTimeFormatter.format(isoDate);
  }

  return value;
}

