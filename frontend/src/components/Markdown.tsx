import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useStore } from '../store/useStore';

export const Markdown = ({ content }: { content: string }) => {
  const { agents, settings } = useStore();
  const html = marked.parse(content, { breaks: true, gfm: true }) as string;
  let sanitized = DOMPurify.sanitize(html);

  // Color Mentions
  sanitized = sanitized.replace(/@(\w[\w-]*)/gi, (match, name) => {
    const lowerName = name.toLowerCase();
    const isUser = lowerName === settings.username?.toLowerCase() || lowerName === 'user';
    const agent = agents[lowerName];
    const color = isUser ? 'var(--color-primary-400)' : (agent?.color || 'var(--color-primary-400)');
    
    return `<span class="mention font-black px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 uppercase tracking-widest text-[10px]" style="color: ${color};">${match}</span>`;
  });

  // Linkify paths (Windows & Unix)
  sanitized = sanitized.replace(/(?<!["=\/])([A-Z]):[\\\/][\w\-.\\ \/]+/g, (match) => {
    const escaped = match.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `<a class="file-link text-primary-400 hover:text-primary-300 underline cursor-pointer" data-path="${escaped}" title="Open in file manager">${match}</a>`;
  });
  
  sanitized = sanitized.replace(/(?<!["=\w])(\/(?:Users|home|tmp|opt|var|etc|usr)\/[\w\-.\/ ]+)/g, (match) => {
    const escaped = match.replace(/'/g, "\\'");
    return `<a class="file-link text-primary-400 hover:text-primary-300 underline cursor-pointer" data-path="${escaped}" title="Open in file manager">${match}</a>`;
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Attach click handlers for file links
    const fileLinks = containerRef.current.querySelectorAll('.file-link');
    fileLinks.forEach((link) => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const path = link.getAttribute('data-path');
            if (path) {
                try {
                    await fetch('/api/open-path', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'X-Session-Token': (window as any).__SESSION_TOKEN__ || ''
                        },
                        body: JSON.stringify({ path }),
                    });
                } catch (err) {
                    console.error('Failed to open path:', err);
                }
            }
        });
    });

    const preElements = containerRef.current.querySelectorAll('pre');
    preElements.forEach((pre) => {
      // Check if already processed
      if (pre.querySelector('.code-copy-btn')) return;

      const btn = document.createElement('button');
      btn.className = 'code-copy-btn absolute top-2 right-2 px-2 py-1 bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white/70 uppercase tracking-widest rounded-lg transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md';
      btn.textContent = 'Copy';
      
      // Make pre relative so absolute button positions correctly
      pre.style.position = 'relative';
      pre.classList.add('group');

      btn.onclick = async (e) => {
        e.stopPropagation();
        const codeElement = pre.querySelector('code');
        if (codeElement) {
          try {
            await navigator.clipboard.writeText(codeElement.innerText);
            btn.textContent = 'Copied!';
            btn.classList.add('text-primary-400');
            setTimeout(() => {
              btn.textContent = 'Copy';
              btn.classList.remove('text-primary-400');
            }, 2000);
          } catch (err) {
            console.error('Failed to copy', err);
          }
        }
      };
      
      pre.appendChild(btn);
    });
  }, [html]);

  return (
    <div 
      ref={containerRef}
      className="prose prose-invert prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};


