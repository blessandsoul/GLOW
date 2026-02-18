import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const ReferralStatsParamSchema = z.object({});

export type ReferralStatsParams = z.infer<typeof ReferralStatsParamSchema>;
