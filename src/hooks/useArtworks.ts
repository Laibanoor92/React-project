import { useState, useEffect } from 'react';
import type { Artwork, ApiResponse } from '../types';

const FIELDS = 'id,title,place_of_origin,artist_display,inscriptions,date_start,date_end';
const BASE_URL = 'https://api.artic.edu/api/v1/artworks';

interface UseArtworksResult {
    artworks: Artwork[];
    totalRecords: number;
    loading: boolean;
    error: string | null;
}

export function useArtworks(page: number, rowsPerPage: number): UseArtworksResult {
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchArtworks = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `${BASE_URL}?page=${page}&limit=${rowsPerPage}&fields=${FIELDS}`
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json: ApiResponse = await res.json();
                if (!cancelled) {
                    setArtworks(json.data);
                    setTotalRecords(json.pagination.total);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchArtworks();
        return () => { cancelled = true; };
    }, [page, rowsPerPage]);

    return { artworks, totalRecords, loading, error };
}
