let highlighterPromise: Promise<any> | null = null;

export const getShikiHighlighter = async () => {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      // Dynamically import shiki at runtime to avoid bundler/TS issues when dependency
      // isn't installed or on SSR builds.
      const shiki = await import('shiki');
      const highlighter = await shiki.getHighlighter({ theme: 'nord' });
      return highlighter;
    })();
  }
  return highlighterPromise;
};

export const highlightCode = async (code: string, lang = 'javascript') => {
  try {
    const highlighter: any = await getShikiHighlighter();
    const html = highlighter.codeToHtml(code, { lang });
    return html;
  } catch (e) {
    console.error('Shiki highlight error', e);
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  }
};

const escapeHtml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
