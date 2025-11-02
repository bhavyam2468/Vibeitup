import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';


interface CodeViewProps {
  code: string;
  language: 'html' | 'css' | 'javascript';
}

const CodeView: React.FC<CodeViewProps> = ({ code, language }) => {
  return (
    <div className="h-full bg-[#272822] text-sm font-mono">
      <SyntaxHighlighter 
        language={language} 
        style={okaidia}
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