import { onchainTable } from "ponder";

// ── Individual positions ────────────────────────────────────────────────────

export const position = onchainTable("position", (t) => ({
  nftId: t.bigint().primaryKey(),
  pool: t.hex().notNull(),
  holder: t.hex().notNull(),
  isLong: t.boolean().notNull(),
  lockedToken: t.hex().notNull(),
  lockedAmount: t.bigint().notNull(),
  usdcIn: t.bigint().notNull(),
  airUsdMinted: t.bigint().notNull(),
  airTokenMinted: t.bigint().notNull(),
  feesPaid: t.bigint().notNull(),
  openedAt: t.bigint().notNull(),
  deadline: t.bigint().notNull(),
  status: t.text().notNull(),             // "open" | "closed" | "expired"
  payout: t.bigint().notNull(),           // 0 while open
  closedAt: t.bigint().notNull(),         // 0 while open
}));

// ── LP ownership ────────────────────────────────────────────────────────────

export const lpOwnership = onchainTable("lp_ownership", (t) => ({
  nftId: t.bigint().primaryKey(),
  pool: t.hex().notNull(),
  owner: t.hex().notNull(),
}));

// ── Price snapshots ─────────────────────────────────────────────────────────

export const priceSnapshot = onchainTable("price_snapshot", (t) => ({
  id: t.text().primaryKey(),
  pool: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  backedAirToken: t.bigint().notNull(),
  backedAirUsd: t.bigint().notNull(),
  spotPrice: t.bigint().notNull(),
  longPrice: t.bigint().notNull(),
  shortPrice: t.bigint().notNull(),
  eventType: t.text().notNull(),
}));

// ── Pool metrics ────────────────────────────────────────────────────────────

export const poolMetrics = onchainTable("pool_metrics", (t) => ({
  address: t.hex().primaryKey(),
  positionVolume: t.bigint().notNull(),
  totalFees: t.bigint().notNull(),
  lpFees: t.bigint().notNull(),
  protocolFees: t.bigint().notNull(),
  longCount: t.integer().notNull(),
  shortCount: t.integer().notNull(),
  closeCount: t.integer().notNull(),
  totalPayout: t.bigint().notNull(),
  lastUpdated: t.bigint().notNull(),
}));

// ── Protocol-wide totals ────────────────────────────────────────────────────

export const protocolMetrics = onchainTable("protocol_metrics", (t) => ({
  id: t.text().primaryKey(),              // always "global"
  totalPositionVolume: t.bigint().notNull(),
  totalFees: t.bigint().notNull(),
  totalLpFees: t.bigint().notNull(),
  totalProtocolFees: t.bigint().notNull(),
  totalPositions: t.integer().notNull(),
  totalCloses: t.integer().notNull(),
  totalPayout: t.bigint().notNull(),
  poolCount: t.integer().notNull(),
  lastUpdated: t.bigint().notNull(),
}));

// ── User activity ───────────────────────────────────────────────────────────

export const userActivity = onchainTable("user_activity", (t) => ({
  address: t.hex().primaryKey(),
  firstSeen: t.bigint().notNull(),
  lastSeen: t.bigint().notNull(),
  longCount: t.integer().notNull(),
  shortCount: t.integer().notNull(),
  closeCount: t.integer().notNull(),
  totalVolume: t.bigint().notNull(),
  totalFeesPaid: t.bigint().notNull(),
  totalPayout: t.bigint().notNull(),
}));

// ── Daily snapshots ─────────────────────────────────────────────────────────

export const dailyMetrics = onchainTable("daily_metrics", (t) => ({
  id: t.text().primaryKey(),              // "{pool}-{dayTimestamp}" or "global-{dayTimestamp}"
  pool: t.hex().notNull(),                // "0x0" for global
  dayTimestamp: t.bigint().notNull(),
  volume: t.bigint().notNull(),
  fees: t.bigint().notNull(),
  lpFees: t.bigint().notNull(),
  positionCount: t.integer().notNull(),
  closeCount: t.integer().notNull(),
  uniqueUsers: t.integer().notNull(),
}));
