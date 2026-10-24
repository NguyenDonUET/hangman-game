import { CATEGORIES, type Catalog, type CategoryName, type Entry } from "./types";

const CATEGORY_NAMES: ReadonlySet<string> = new Set(CATEGORIES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEntry(value: unknown, category: CategoryName): Entry {
  if (!isRecord(value)) throw new Error(`A ${category} title must be an object.`);

  const { name, selected } = value;
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error(`A ${category} title needs a name.`);
  }
  if (typeof selected !== "boolean") {
    throw new Error(`"${name}" in ${category} needs a selected flag.`);
  }
  return { name, selected };
}

function isCompleteCatalog(value: Partial<Record<CategoryName, readonly Entry[]>>): value is Catalog {
  return CATEGORIES.every((category) => {
    const entries = value[category];
    return entries !== undefined && entries.length > 0;
  });
}

export function parseCatalog(data: unknown): Catalog {
  if (!isRecord(data) || !isRecord(data.categories)) {
    throw new Error("Catalog is missing categories.");
  }

  const categories = data.categories;
  for (const key of Object.keys(categories)) {
    if (!CATEGORY_NAMES.has(key)) throw new Error(`Unknown category "${key}".`);
  }

  const catalog: Partial<Record<CategoryName, readonly Entry[]>> = {};
  for (const category of CATEGORIES) {
    const entries = categories[category];
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error(`${category} needs at least one title.`);
    }

    const seen = new Set<string>();
    const parsed: Entry[] = [];
    for (const entry of entries) {
      const title = parseEntry(entry, category);
      if (seen.has(title.name)) throw new Error(`Duplicate title "${title.name}" in ${category}.`);
      seen.add(title.name);
      parsed.push(title);
    }
    catalog[category] = parsed;
  }

  if (!isCompleteCatalog(catalog)) throw new Error("Catalog is missing a category.");
  return catalog;
}
