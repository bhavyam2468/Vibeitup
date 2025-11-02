import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';


interface CodeViewProps {
  code: string;
  language: 'html' | 'css' | 'javascript';
}

const CodeView: React.FC<CodeViewProps> = ({ code, language }) => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const style = isDarkMode ? okaidia : prism;
  const bgColor = isDarkMode ? '#272822' : '#f5f2f0';

  return (
    <div className="h-full text-sm font-mono" style={{ backgroundColor: bgColor }}>
      <SyntaxHighlighter 
        language={language} 
        style={style}
        customStyle={{
          width: '100%',
          height: '100%',
          margin: 0,
          padding: '1rem',
          backgroundColor: 'transparent',
        }}
        codeTagProps={{
          style: {
            fontFamily: '"Space Grotesk", monospace',
          }
        }}
        showLineNumbers={true}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeView;