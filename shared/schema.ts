import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const validators = pgTable("validators", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  stake: integer("stake").notNull(),
  biometricDevice: text("biometric_device").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  reputation: real("reputation").default(100).notNull(),
  totalBlocks: integer("total_blocks").default(0).notNull(),
  missedBlocks: integer("missed_blocks").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  fitbitUserId: text("fitbit_user_id"),
  fitbitAccessToken: text("fitbit_access_token"),
  fitbitRefreshToken: text("fitbit_refresh_token"),
});

export const emotionalProofs = pgTable("emotional_proofs", {
  id: serial("id").primaryKey(),
  validatorAddress: text("validator_address").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  heartRate: integer("heart_rate").notNull(),
  hrv: real("hrv"),
  stressLevel: real("stress_level").notNull(),
  energyLevel: real("energy_level").notNull(),
  focusLevel: real("focus_level").notNull(),
  authenticityScore: real("authenticity_score").notNull(),
  biometricHash: text("biometric_hash").notNull(),
  signature: text("signature").notNull(),
  rawBiometricData: jsonb("raw_biometric_data"),
});

export const consensusBlocks = pgTable("consensus_blocks", {
  id: serial("id").primaryKey(),
  blockHeight: integer("block_height").notNull().unique(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  networkStress: real("network_stress").notNull(),
  networkEnergy: real("network_energy").notNull(),
  networkFocus: real("network_focus").notNull(),
  networkAuthenticity: real("network_authenticity").notNull(),
  agreementScore: real("agreement_score").notNull(),
  participatingValidators: integer("participating_validators").notNull(),
  totalStake: integer("total_stake").notNull(),
  consensusReached: boolean("consensus_reached").notNull(),
  validatorProofs: jsonb("validator_proofs"),
});

export const networkActivity = pgTable("network_activity", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  type: text("type").notNull(), // 'consensus', 'validator_join', 'biometric_sync', etc.
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
});

export const insertValidatorSchema = createInsertSchema(validators).omit({
  id: true,
  joinedAt: true,
  reputation: true,
  totalBlocks: true,
  missedBlocks: true,
  isActive: true,
});

export const insertEmotionalProofSchema = createInsertSchema(emotionalProofs).omit({
  id: true,
  timestamp: true,
});

export const insertConsensusBlockSchema = createInsertSchema(consensusBlocks).omit({
  id: true,
  timestamp: true,
});

export const insertNetworkActivitySchema = createInsertSchema(networkActivity).omit({
  id: true,
  timestamp: true,
});

export type Validator = typeof validators.$inferSelect;
export type InsertValidator = z.infer<typeof insertValidatorSchema>;
export type EmotionalProof = typeof emotionalProofs.$inferSelect;
export type InsertEmotionalProof = z.infer<typeof insertEmotionalProofSchema>;
export type ConsensusBlock = typeof consensusBlocks.$inferSelect;
export type InsertConsensusBlock = z.infer<typeof insertConsensusBlockSchema>;
export type NetworkActivity = typeof networkActivity.$inferSelect;
export type InsertNetworkActivity = z.infer<typeof insertNetworkActivitySchema>;
