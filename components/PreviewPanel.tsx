import React, { useMemo, useRef, useEffect } from 'react';
import type { SnipOptions } from '../types';

declare const html2canvas: any;

interface PreviewPanelProps {
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  snipRequest: SnipOptions | null;
  onSnipComplete: (base64Image: string) => void;
  onSnipError: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ htmlCode, cssCode, jsCode, snipRequest, onSnipComplete, onSnipError }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcDoc = useMemo(() => {
    return `
      <html>
        <head>
          <style>${cssCode}</style>
        </head>
        <body>
          ${htmlCode}
          <script>${jsCode}</script>
        </body>
      </html>
    `;
  }, [htmlCode, cssCode, jsCode]);

  useEffect(() => {
    if (snipRequest && iframeRef.current) {
        const iframe = iframeRef.current;
        
        const capture = async () => {
            if (!iframe.contentWindow || !iframe.contentDocument) {
                console.error("Iframe content not accessible");
                onSnipError();
                return;
            }

            const iframeDoc = iframe.contentDocument;
            const body = iframeDoc.body;
            let elementToCapture: HTMLElement = body;

            // Apply scroll
            if (snipRequest.scrollPercent) {
                const scrollHeight = body.scrollHeight - body.clientHeight;
                body.scrollTop = (scrollHeight * snipRequest.scrollPercent) / 100;
                // Wait for scroll to apply
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Find selector
            if (snipRequest.selector) {
                const selected = iframeDoc.querySelector(snipRequest.selector);
                if (selected) {
                    elementToCapture = selected as HTMLElement;
                } else {
                    console.warn(`Selector "${snipRequest.selector}" not found in iframe.`);
                }
            }

            const canvas = await html2canvas(elementToCapture, {
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: -body.scrollTop,
                 ...(snipRequest.viewport && {
                    width: snipRequest.viewport.width,
                    height: snipRequest.viewport.height,
                    windowWidth: snipRequest.viewport.width,
                    windowHeight: snipRequest.viewport.height,
                }),
            });
            const base64Image = canvas.toDataURL('image/png').split(',')[1];
            onSnipComplete(base64Image);
        };

        const onLoad = () => {
            // A short timeout can help ensure all assets and styles are rendered
            setTimeout(() => {
                capture().catch(err => {
                    console.error("html2canvas capture failed:", err);
                    onSnipError();
                });
            }, 100);
            iframe.removeEventListener('load', onLoad);
        };
        
        iframe.addEventListener('load', onLoad);
        // If already loaded, trigger manually
        if (iframe.contentDocument?.readyState === 'complete') {
            onLoad();
        }

    }
  }, [snipRequest, onSnipComplete, onSnipError]);

  const iframeStyle = snipRequest?.viewport 
    ? { 
        width: `${snipRequest.viewport.width}px`, 
        height: `${snipRequest.viewport.height}px`,
        maxWidth: '100%',
        maxHeight: '100%',
        transition: 'all 0.3s ease-in-out',
        boxShadow: '0 0 15px rgba(0,0,0,0.5)',
        border: '1px solid #444'
      }
    : {
        width: '100%',
        height: '100%',
        border: 'none',
    }

  return (
    <div className="w-full h-full bg-white flex items-center justify-center">
      <iframe
        ref={iframeRef}
        srcDoc={srcDoc}
        title="Live Preview"
        sandbox="allow-scripts allow-modals allow-forms"
        style={iframeStyle}
      />
    </div>
  );
};

export default PreviewPanel;