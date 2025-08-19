
import React, { useState, useEffect } from 'react';

interface TextFileViewerProps {
    url: string;
}

export function TextFileViewer({ url }: TextFileViewerProps) {
    const [content, setContent] = useState('');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        const fetchText = async () => {
            setStatus('loading');
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
                }
                const text = await response.text();
                setContent(text);
                setStatus('success');
            } catch (error) {
                console.error('Error fetching text file:', error);
                setContent(error instanceof Error ? error.message : 'An unknown error occurred.');
                setStatus('error');
            }
        };

        fetchText();
    }, [url]);

    return (
        <div className="text-file-viewer">
            {status === 'loading' && <p className="status-message">Loading content...</p>}
            {status === 'error' && <pre className="error-message">{content}</pre>}
            {status === 'success' && <pre>{content}</pre>}
        </div>
    );
}
