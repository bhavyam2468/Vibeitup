import React, { useMemo, useRef } from 'react';

interface PreviewPanelProps {
  htmlCode: string;
  cssCode: string;
  jsCode: string;
}

const LIBRARY_INCLUDES = `
    <!-- Pico CSS for styling -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
    
    <!-- Animate.css for animations -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
    
    <!-- Lucide Icons -->
    <script defer src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    
    <!-- Chart.js for charts -->
    <script defer src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Day.js for date/time -->
    <script defer src="https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js"></script>
    
    <!-- Howler.js for audio -->
    <script defer src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js"></script>
    
    <!-- localForage for storage -->
    <script defer src="https://cdn.jsdelivr.net/npm/localforage@1/dist/localforage.min.js"></script>
`;

const PreviewPanel: React.FC<PreviewPanelProps> = ({ htmlCode, cssCode, jsCode }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcDoc = useMemo(() => {
    // Inject libraries into the head, followed by the user's styles
    const headWithLibsAndStyles = `${LIBRARY_INCLUDES}<style>${cssCode}</style></head>`;
    let processedHtml = htmlCode.replace('</head>', headWithLibsAndStyles);

    // Inject the user's script before the closing body tag
    const bodyWithScript = `<script>${jsCode}</script></body>`;
    processedHtml = processedHtml.replace('</body>', bodyWithScript);
    
    return processedHtml;
  }, [htmlCode, cssCode, jsCode]);

  const iframeStyle = {
        width: '100%',
        height: '100%',
        border: 'none',
    };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-black">
      <iframe
        ref={iframeRef}
        srcDoc={srcDoc}
        title="Live Preview"
        sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
        style={iframeStyle}
      />
    </div>
  );
};

export default PreviewPanel;