import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import Stripe from "stripe";

const MONTHLY_PRICE_PENCE = 399;
const MONTHLY_STARTER_PACK_PENCE = 999;
const YEARLY_PRICE_PENCE = 3999;
const STRIPE_CURRENCY = "gbp";

const CATALOG = [
  {
    amountPence: MONTHLY_PRICE_PENCE,
    description: "Monthly Family+ access for one family account.",
    name: "Monthly Family+",
    recurringInterval: "month",
    slug: "monthly_family_plus",
  },
  {
    amountPence: MONTHLY_STARTER_PACK_PENCE,
    description: "Starter pack with 4 Boopers for your first family setup.",
    name: "Booper Starter Pack",
    slug: "monthly_family_plus_starter_pack",
  },
  {
    amountPence: YEARLY_PRICE_PENCE,
    description: "Yearly Family+ access and 4 included Boopers.",
    name: "Yearly Family+",
    recurringInterval: "year",
    slug: "yearly_family_plus",
  },
];

function loadEnvFile(filename) {
  const absolutePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(absolutePath)) {
    return;
  }

  const contents = fs.readFileSync(absolutePath, "utf8");
  for (const line of contents.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function doesPriceMatchConfig(price, config) {
  const recurringInterval = price.recurring?.interval ?? null;
  const expectedInterval = config.recurringInterval ?? null;

  return (
    price.active &&
    price.currency === STRIPE_CURRENCY &&
    price.type === (expectedInterval ? "recurring" : "one_time") &&
    price.unit_amount === config.amountPence &&
    recurringInterval === expectedInterval
  );
}

async function getOrCreateProduct(stripe, config) {
  const products = await stripe.products.list({
    limit: 100,
  });

  const existing = products.data.find(
    (product) => product.metadata?.goodkiddo_catalog_slug === config.slug,
  );

  if (existing) {
    if (
      existing.active &&
      existing.name === config.name &&
      existing.description === config.description
    ) {
      return existing;
    }

    return stripe.products.update(existing.id, {
      active: true,
      description: config.description,
      metadata: {
        ...existing.metadata,
        goodkiddo_catalog_slug: config.slug,
      },
      name: config.name,
    });
  }

  return stripe.products.create({
    active: true,
    description: config.description,
    metadata: {
      goodkiddo_catalog_slug: config.slug,
    },
    name: config.name,
  });
}

async function getOrCreatePrice(stripe, productId, config) {
  const prices = await stripe.prices.list({
    active: true,
    limit: 100,
    product: productId,
  });

  const existing = prices.data.find((price) =>
    doesPriceMatchConfig(price, config),
  );

  if (existing) {
    return existing;
  }

  return stripe.prices.create({
    currency: STRIPE_CURRENCY,
    metadata: {
      goodkiddo_catalog_slug: config.slug,
    },
    product: productId,
    recurring: config.recurringInterval
      ? {
          interval: config.recurringInterval,
        }
      : undefined,
    unit_amount: config.amountPence,
  });
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env.vercel.production");

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  const stripe = new Stripe(secretKey);
  console.log("Seeding Stripe catalog...");

  for (const config of CATALOG) {
    const product = await getOrCreateProduct(stripe, config);
    const price = await getOrCreatePrice(stripe, product.id, config);
    console.log(
      `${config.name}: product=${product.id} price=${price.id} ${config.recurringInterval ?? "one-time"}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
