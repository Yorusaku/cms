import { deepClone } from "@cms/utils";

export const DEFAULT_IMAGE_LINK = {
  clickType: 0,
  data: null,
};

export function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

export function toStringValue(
  value: unknown,
  fallback = "",
): string {
  return typeof value === "string" ? value : fallback;
}

export function toNumberValue(
  value: unknown,
  fallback: number,
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

export function toBooleanValue(
  value: unknown,
  fallback: boolean,
): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function toArrayValue<T>(
  value: unknown,
  mapper: (item: unknown, index: number) => T,
): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(mapper);
}

export function normalizeLinkValue(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "clickType" in (value as Record<string, unknown>)
  ) {
    return deepClone(value);
  }

  if (typeof value === "string" && value) {
    return {
      clickType: 1,
      data: { url: value },
    };
  }

  return deepClone(DEFAULT_IMAGE_LINK);
}

export function isVueModule(
  value: unknown,
): value is { default: unknown } {
  return !!value && typeof value === "object" && "default" in value;
}
