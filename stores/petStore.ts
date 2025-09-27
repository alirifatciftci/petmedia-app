import { create } from 'zustand';
import type { Pet, PetSpecies } from '../types';

interface PetFilters {
  species: PetSpecies | 'all';
  city: string;
  size: string;
  vaccinated: boolean | null;
  neutered: boolean | null;
}

interface PetState {
  pets: Pet[];
  favorites: string[];
  filters: PetFilters;
  searchQuery: string;
  isLoading: boolean;
  
  setPets: (pets: Pet[]) => void;
  addPet: (pet: Pet) => void;
  updatePet: (id: string, updates: Partial<Pet>) => void;
  removePet: (id: string) => void;
  toggleFavorite: (petId: string) => void;
  setFilters: (filters: Partial<PetFilters>) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  getFilteredPets: () => Pet[];
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  favorites: [],
  filters: {
    species: 'all',
    city: '',
    size: '',
    vaccinated: null,
    neutered: null,
  },
  searchQuery: '',
  isLoading: false,

  setPets: (pets) => set({ pets }),

  addPet: (pet) => 
    set((state) => ({ pets: [pet, ...state.pets] })),

  updatePet: (id, updates) =>
    set((state) => ({
      pets: state.pets.map((pet) => 
        pet.id === id ? { ...pet, ...updates } : pet
      ),
    })),

  removePet: (id) =>
    set((state) => ({
      pets: state.pets.filter((pet) => pet.id !== id),
    })),

  toggleFavorite: (petId) =>
    set((state) => {
      const isFavorite = state.favorites.includes(petId);
      return {
        favorites: isFavorite
          ? state.favorites.filter((id) => id !== petId)
          : [...state.favorites, petId],
      };
    }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setLoading: (isLoading) => set({ isLoading }),

  getFilteredPets: () => {
    const { pets, filters, searchQuery } = get();
    let filtered = pets;

    // Filter by species
    if (filters.species !== 'all') {
      filtered = filtered.filter((pet) => pet.species === filters.species);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pet) =>
          pet.name.toLowerCase().includes(query) ||
          pet.breed?.toLowerCase().includes(query) ||
          pet.city.toLowerCase().includes(query)
      );
    }

    // Additional filters
    if (filters.city) {
      filtered = filtered.filter((pet) => 
        pet.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.vaccinated !== null) {
      filtered = filtered.filter((pet) => pet.vaccinated === filters.vaccinated);
    }

    if (filters.neutered !== null) {
      filtered = filtered.filter((pet) => pet.neutered === filters.neutered);
    }

    return filtered;
  },
}));