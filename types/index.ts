import { z } from 'zod';

// User types
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().optional(),
  favorites: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;

// Pet types
export const PetSpeciesSchema = z.enum(['cat', 'dog', 'bird', 'rabbit', 'other']);
export const PetSizeSchema = z.enum(['small', 'medium', 'large']);
export const PetSexSchema = z.enum(['male', 'female']);
export const PetStatusSchema = z.enum(['available', 'pending', 'adopted']);

export const PetSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  species: PetSpeciesSchema,
  name: z.string(),
  sex: PetSexSchema,
  ageMonths: z.number().min(0),
  size: PetSizeSchema,
  breed: z.string().optional(),
  city: z.string(),
  vaccinated: z.boolean().default(false),
  neutered: z.boolean().default(false),
  description: z.string(),
  photos: z.array(z.string()),
  videos: z.array(z.string()).default([]),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  tags: z.array(z.string()).default([]),
  status: PetStatusSchema.default('available'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Pet = z.infer<typeof PetSchema>;
export type PetSpecies = z.infer<typeof PetSpeciesSchema>;
export type PetSize = z.infer<typeof PetSizeSchema>;
export type PetSex = z.infer<typeof PetSexSchema>;
export type PetStatus = z.infer<typeof PetStatusSchema>;

// Map spot types
export const MapSpotTypeSchema = z.enum(['food', 'water', 'both', 'veterinary', 'shelter']);

export const MapSpotSchema = z.object({
  id: z.string(),
  creatorId: z.string(),
  type: MapSpotTypeSchema,
  title: z.string(),
  note: z.string().optional(),
  coords: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  photoURL: z.string().optional(),
  contributorsCount: z.number().default(0),
  lastUpdatedAt: z.date(),
  createdAt: z.date(),
});

export type MapSpot = z.infer<typeof MapSpotSchema>;
export type MapSpotType = z.infer<typeof MapSpotTypeSchema>;

// Message types
export const MessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  senderId: z.string(),
  text: z.string(),
  createdAt: z.date(),
  readBy: z.array(z.string()).default([]),
});

export type Message = z.infer<typeof MessageSchema>;

// Application types
export const ApplicationStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const ApplicationSchema = z.object({
  id: z.string(),
  petId: z.string(),
  applicantId: z.string(),
  message: z.string(),
  status: ApplicationStatusSchema.default('pending'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Application = z.infer<typeof ApplicationSchema>;
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;