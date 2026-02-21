import React, { useRef } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';

interface RowSelectionPanelProps {
    // Props for event handlers can be added here later
}

const RowSelectionPanel: React.FC<RowSelectionPanelProps> = () => {
    const op = useRef<OverlayPanel>(null);

    return (
        <div style={{ marginBottom: '1rem', display: 'inline-block' }}>
            <Button type="button" icon="pi pi-chevron-down" label="Select Rows" onClick={(e) => op.current?.toggle(e)} style={{ marginRight: '0.5rem' }} />

            <OverlayPanel ref={op}>
                <div style={{ padding: '0.5rem' }}>
                    <div className="p-text-secondary" style={{ marginBottom: '1rem', display: 'block' }}>Select the number of rows:</div>
                    <div style={{ marginBottom: '1rem' }}>
                        <InputNumber placeholder="Number of rows" />
                    </div>
                    <Button label="Select" icon="pi pi-check" onClick={() => op.current?.hide()} />
                </div>
            </OverlayPanel>
        </div>
    );
};

export default RowSelectionPanel;
