import React, { useState, useRef, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import type { InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import type { DataTablePageEvent, DataTableSelectionMultipleChangeEvent } from 'primereact/datatable';
import { useArtworks } from '../hooks/useArtworks';
import type { Artwork } from '../types';

const DEFAULT_ROWS = 12;

const ArtworkTable: React.FC = () => {
    // ── Pagination state (1-indexed for the API) ─────────────────────────────
    const [apiPage, setApiPage] = useState<number>(1);
    const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_ROWS);
    // PrimeReact paginator uses a 0-indexed "first" offset
    const [first, setFirst] = useState<number>(0);

    // ── Fetch data for the current page only ─────────────────────────────────
    const { artworks, totalRecords, loading, error } = useArtworks(apiPage, rowsPerPage);

    // ── Selection state: store IDs only — never full row objects ─────────────
    // selectedIds tracks ALL selected rows across every page.
    // We never prefetch other pages; this is populated lazily as user navigates.
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // pendingSelectCount: the number of rows the user wants selected globally.
    // When > 0, each page auto-selects however many rows fall within the range.
    const [pendingSelectCount, setPendingSelectCount] = useState<number>(0);

    // ── Overlay panel ref & input ─────────────────────────────────────────────
    const op = useRef<OverlayPanel>(null);
    const [inputCount, setInputCount] = useState<number | null>(null);

    // ── Derive selection for the current page from selectedIds ───────────────
    // This is a pure derivation — no API calls.
    const currentPageSelection: Artwork[] = artworks.filter((a) =>
        selectedIds.has(a.id)
    );

    // ── Auto-select rows on the current page when pendingSelectCount is set ──
    // Called after each page load via a derived effect-like approach (in render).
    // Strategy: rows 0..(pendingSelectCount-1) are "selected" globally.
    // For page P with rowsPerPage R, rows on this page have global indices
    // [(P-1)*R, P*R - 1]. We select those whose index < pendingSelectCount.
    const applyPendingSelectionToCurrentPage = useCallback(() => {
        if (pendingSelectCount <= 0 || artworks.length === 0) return;

        const pageStartIndex = (apiPage - 1) * rowsPerPage; // 0-based global index of first row on this page
        setSelectedIds((prev) => {
            const next = new Set(prev);
            artworks.forEach((artwork, localIndex) => {
                const globalIndex = pageStartIndex + localIndex;
                if (globalIndex < pendingSelectCount) {
                    next.add(artwork.id);
                }
                // Note: we do NOT remove IDs here — the user may have manually
                // deselected a row that falls within the range on a previous page.
                // Manual deselection is handled in onSelectionChange below.
            });
            return next;
        });
    }, [pendingSelectCount, artworks, apiPage, rowsPerPage]);

    // We use a ref to track the last artworks array we applied selection to,
    // so we only run applyPendingSelectionToCurrentPage once per page load.
    const lastAppliedArtworksRef = useRef<Artwork[]>([]);
    if (
        pendingSelectCount > 0 &&
        artworks.length > 0 &&
        artworks !== lastAppliedArtworksRef.current
    ) {
        lastAppliedArtworksRef.current = artworks;
        applyPendingSelectionToCurrentPage();
    }

    // ── Handlers ──────────────────────────────────────────────────────────────

    const onPage = (e: DataTablePageEvent) => {
        const newPage = Math.floor(e.first / e.rows) + 1;
        setFirst(e.first);
        setRowsPerPage(e.rows);
        setApiPage(newPage);
    };

    const onSelectionChange = (e: DataTableSelectionMultipleChangeEvent<Artwork[]>) => {
        const nowSelected = e.value as Artwork[];
        const nowSelectedIds = new Set(nowSelected.map((a) => a.id));

        setSelectedIds((prev) => {
            const next = new Set(prev);
            // Remove IDs that were on the current page but are now deselected
            artworks.forEach((a) => {
                if (nowSelectedIds.has(a.id)) {
                    next.add(a.id);
                } else {
                    next.delete(a.id);
                }
            });
            return next;
        });
    };

    const handleOverlaySelect = () => {
        if (!inputCount || inputCount <= 0) return;

        // IMPORTANT: We only set the count. We do NOT fetch any other pages.
        // The rows for other pages will be selected when the user navigates to them.
        const count = Math.min(inputCount, totalRecords);
        setPendingSelectCount(count);

        // Clear existing selection and re-seed from the current page
        const pageStartIndex = (apiPage - 1) * rowsPerPage;
        const newIds = new Set<number>();
        artworks.forEach((artwork, localIndex) => {
            const globalIndex = pageStartIndex + localIndex;
            if (globalIndex < count) {
                newIds.add(artwork.id);
            }
        });
        setSelectedIds(newIds);
        lastAppliedArtworksRef.current = artworks;

        op.current?.hide();
        setInputCount(null);
    };

    const handleClearSelection = () => {
        setSelectedIds(new Set());
        setPendingSelectCount(0);
        setInputCount(null);
    };

    // ── Header with overlay panel ─────────────────────────────────────────────
    const columnHeader = (
        <React.Fragment>
            <button
                className="p-button-icon-overlay-trigger"
                onClick={(e) => op.current?.toggle(e)}
                title="Custom row selection"
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--primary-color)',
                    padding: '0.25rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <i className="pi pi-chevron-down" style={{ fontSize: '0.85rem' }} />
            </button>
            <OverlayPanel ref={op} style={{ width: '260px' }}>
                <div style={{ padding: '0.25rem' }}>
                    <p style={{ marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem' }}>
                        Select rows across pages
                    </p>
                    <p style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--text-color-secondary)' }}>
                        Enter how many rows to select (starting from the first row). Rows on other pages are selected as you navigate to them.
                    </p>
                    <InputNumber
                        value={inputCount}
                        onValueChange={(e: InputNumberValueChangeEvent) => setInputCount(e.value ?? null)}
                        min={1}
                        max={totalRecords}
                        placeholder={`1 – ${totalRecords}`}
                        style={{ width: '100%', marginBottom: '0.75rem' }}
                        inputStyle={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                            label="Select"
                            icon="pi pi-check"
                            size="small"
                            onClick={handleOverlaySelect}
                            disabled={!inputCount || inputCount <= 0}
                            style={{ flex: 1 }}
                        />
                        <Button
                            label="Clear"
                            icon="pi pi-times"
                            size="small"
                            severity="secondary"
                            outlined
                            onClick={handleClearSelection}
                            style={{ flex: 1 }}
                        />
                    </div>
                </div>
            </OverlayPanel>
        </React.Fragment>
    );

    // ── Render ────────────────────────────────────────────────────────────────

    if (error) {
        return (
            <Message
                severity="error"
                text={`Failed to load artworks: ${error}`}
                style={{ width: '100%' }}
            />
        );
    }

    return (
        <div className="artwork-table-wrapper">
            {/* Selection summary bar */}
            {selectedIds.size > 0 && (
                <div className="selection-bar">
                    <span>
                        <i className="pi pi-check-circle" style={{ marginRight: '0.4rem', color: 'var(--primary-color)' }} />
                        {selectedIds.size} row{selectedIds.size !== 1 ? 's' : ''} selected
                        {pendingSelectCount > 0 && ` (${pendingSelectCount} requested — select remaining rows by navigating pages)`}
                    </span>
                    <Button
                        label="Clear all"
                        icon="pi pi-times"
                        size="small"
                        text
                        severity="secondary"
                        onClick={handleClearSelection}
                    />
                </div>
            )}

            <DataTable<Artwork[]>
                value={artworks}
                dataKey="id"
                lazy
                paginator
                first={first}
                rows={rowsPerPage}
                totalRecords={totalRecords}
                rowsPerPageOptions={[5, 10, 12, 25, 50]}
                onPage={onPage}
                loading={loading}
                loadingIcon={
                    <ProgressSpinner style={{ width: '2rem', height: '2rem' }} strokeWidth="4" />
                }
                selectionMode="multiple"
                selection={currentPageSelection}
                onSelectionChange={onSelectionChange}
                emptyMessage="No artworks found."
                stripedRows
                scrollable
                responsiveLayout="scroll"
                className="p-datatable-sm w-full"
                pt={{
                    paginator: {
                        root: {
                            className:
                                'flex justify-between items-center bg-transparent border-t border-[var(--surface-border)] px-4 py-3',
                        },
                    },
                }}
            >
                <Column
                    header={columnHeader}
                    selectionMode="multiple"
                    className="w-16 min-w-[4rem] px-2"
                />
                <Column field="title" header="Title" className="min-w-[14rem]" />
                <Column field="place_of_origin" header="Place of Origin" className="min-w-[10rem]" />
                <Column field="artist_display" header="Artist" className="min-w-[14rem]" />
                <Column field="inscriptions" header="Inscriptions" className="min-w-[10rem]" />
                <Column
                    field="date_start"
                    header="Date Start"
                    className="min-w-[8rem]"
                    pt={{
                        headerCell: { className: 'text-center' },
                        bodyCell: { className: 'text-center' },
                    }}
                />
                <Column
                    field="date_end"
                    header="Date End"
                    className="min-w-[8rem]"
                    pt={{
                        headerCell: { className: 'text-center' },
                        bodyCell: { className: 'text-center' },
                    }}
                />
            </DataTable>
        </div>
    );
};

export default ArtworkTable;
