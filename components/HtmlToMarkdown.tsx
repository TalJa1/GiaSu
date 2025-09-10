import React, { useMemo } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

function htmlToMarkdown(html: string): string {
  if (!html) return '';
  let md = String(html);

  // Links
  md = md.replace(/<a\s+[^>]*href=(?:"|')([^"']+)(?:"|')[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Headings
  md = md.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, txt) => {
    return '\n' + '#'.repeat(Number(level)) + ' ' + txt + '\n';
  });

  // Strong / bold
  md = md.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**');

  // Emphasis / italic
  md = md.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*');

  // Paragraphs -> double newline
  md = md.replace(/<p[^>]*>/gi, '\n\n');
  md = md.replace(/<\/p>/gi, '\n\n');

  // Line breaks
  md = md.replace(/<br\s*\/?>(\s*)/gi, '\n\n');

  // Lists: li -> - item
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, txt) => `- ${txt}\n`);
  // remove ul/ol tags
  md = md.replace(/<\/?(?:ul|ol)[^>]*>/gi, '\n');

  // Remove any remaining tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode basic HTML entities
  md = md.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

  // Remove stray backslashes and lines that contain only a single slash/backslash
  md = md.replace(/\\+/g, '');
  md = md.replace(new RegExp('^[\\\\/]\\s*$', 'gm'), '');

  // Collapse multiple blank lines
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}

const HtmlToMarkdown: React.FC<{ html: string }> = ({ html }) => {
  const md = useMemo(() => htmlToMarkdown(html), [html]);
  return <MarkdownRenderer text={md} />;
};

export default HtmlToMarkdown;
