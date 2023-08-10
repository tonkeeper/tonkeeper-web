import { BLOCKCHAIN_NAME } from './crypto';

export interface WalletFavorite {
    name: string;
    address: string;
}

export interface FavoriteSuggestion extends WalletFavorite {
    isFavorite: true;
}

export interface LatestSuggestion {
    isFavorite: false;
    address: string;
    timestamp: number;
    blockchain?: BLOCKCHAIN_NAME;
}

export type Suggestion = FavoriteSuggestion | LatestSuggestion;
