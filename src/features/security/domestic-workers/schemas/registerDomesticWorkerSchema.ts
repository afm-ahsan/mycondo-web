import { z } from 'zod';
import { WORKER_TYPES } from '../lib/constants';

// Mirrors RegisterDomesticWorkerCommand (mycondo-api Features/Security/DomesticWorkers). No flat
// field here — assignment to a flat is a separate action (CreateDomesticWorkerAssignmentRequest),
// done after registration, not part of onboarding the person.
export const registerDomesticWorkerSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  phone: z.string().min(1, { message: 'Mobile number is required.' }).max(32),
  workerType: z.enum(WORKER_TYPES, { message: 'Worker type is required.' }),
  identityDocumentType: z.string().max(64).optional(),
  identityDocumentNumber: z.string().max(64).optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: z.string().max(32).optional(),
});

export type RegisterDomesticWorkerSchemaType = z.infer<typeof registerDomesticWorkerSchema>;
