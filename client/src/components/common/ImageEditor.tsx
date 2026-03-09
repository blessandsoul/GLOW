'use client';

import React, { useCallback } from 'react';
import ReactDOM from 'react-dom';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';

// Filerobot internally references global `React` and `ReactDOM` (legacy pattern).
// React 19 with automatic JSX runtime doesn't expose these globals, so we polyfill them.
if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).React = React;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).ReactDOM = ReactDOM;
}

// Dynamic import to avoid SSR issues with canvas/konva
const FilerobotImageEditor = dynamic(
    () => import('react-filerobot-image-editor').then((mod) => mod.default),
    { ssr: false },
);

export interface EditedImageData {
    name: string;
    extension: string;
    mimeType: string;
    fullName?: string;
    imageBase64?: string;
    imageCanvas?: HTMLCanvasElement;
    width?: number;
    height?: number;
}

interface ImageEditorProps {
    source: string;
    open: boolean;
    onClose: () => void;
    onSave: (editedImageObject: EditedImageData) => void;
}

// Use string literals instead of TABS/TOOLS enums to avoid static import of konva
const EDITOR_TABS = ['Adjust', 'Finetune', 'Filters', 'Annotate', 'Resize'] as const;
const DEFAULT_TAB = 'Adjust';
const DEFAULT_TOOL = 'Crop';

export function ImageEditor({ source, open, onClose, onSave }: ImageEditorProps): React.ReactElement | null {
    const handleSave = useCallback(
        (editedImageObject: EditedImageData) => {
            onSave(editedImageObject);
        },
        [onSave],
    );

    // Skip the "Save as" modal — directly trigger onSave with default settings
    const handleBeforeSave = useCallback(() => false as const, []);

    if (!open || typeof window === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-100 flex flex-col bg-background">
            <FilerobotImageEditor
                source={source}
                onBeforeSave={handleBeforeSave}
                onSave={handleSave}
                onClose={onClose}
                annotationsCommon={{
                    fill: '#7c3aed',
                    stroke: '#000000',
                    strokeWidth: 2,
                }}
                Text={{
                    text: 'Glow.GE',
                    fontSize: 24,
                    fontFamily: 'Arial',
                    fonts: ['Arial', 'Helvetica', 'Georgia', 'Times New Roman'],
                }}
                Rotate={{ angle: 90, componentType: 'slider' }}
                Crop={{
                    autoResize: true,
                    presetsItems: [
                        {
                            titleKey: 'square',
                            descriptionKey: '1:1',
                            ratio: 1,
                        },
                        {
                            titleKey: 'portrait',
                            descriptionKey: '3:4',
                            ratio: 3 / 4,
                        },
                        {
                            titleKey: 'story',
                            descriptionKey: '9:16',
                            ratio: 9 / 16,
                        },
                        {
                            titleKey: 'widescreen',
                            descriptionKey: '16:9',
                            ratio: 16 / 9,
                        },
                    ],
                    presetsFolders: [
                        {
                            titleKey: 'socialMedia',
                            groups: [
                                {
                                    titleKey: 'instagram',
                                    items: [
                                        {
                                            titleKey: 'post',
                                            width: 1080,
                                            height: 1080,
                                            descriptionKey: '1080x1080px',
                                        },
                                        {
                                            titleKey: 'story',
                                            width: 1080,
                                            height: 1920,
                                            descriptionKey: '1080x1920px',
                                        },
                                    ],
                                },
                                {
                                    titleKey: 'facebook',
                                    items: [
                                        {
                                            titleKey: 'coverPhoto',
                                            width: 820,
                                            height: 312,
                                            descriptionKey: '820x312px',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                }}
                tabsIds={EDITOR_TABS as unknown as []}
                defaultTabId={DEFAULT_TAB}
                defaultToolId={DEFAULT_TOOL}
                savingPixelRatio={4}
                previewPixelRatio={2}
                defaultSavedImageName={`glowge-edited-${Date.now()}`}
                defaultSavedImageQuality={0.92}
                defaultSavedImageType="png"
                closeAfterSave
            />
        </div>,
        document.body,
    );
}
