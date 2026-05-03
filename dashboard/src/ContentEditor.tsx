import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, Save, Plus, ChevronUp, ChevronDown, X,
  Heading1, AlignLeft, Code, Image, Table2, MousePointerClick,
  LayoutTemplate, ListCollapse, AlertCircle, Minus, FileCode, Star,
} from "lucide-react";
import { formatDate } from "./utils/formatDate";
import { slugify as transliterate } from "transliteration";

// @ts-ignore
import {
  Column, Row, Heading, HeadingLink, Text, Avatar, AvatarGroup,
  Media, Line, SmartLink, InlineCode, CodeBlock, List, ListItem,
  Accordion, AccordionGroup, Table, Feedback, Button as OUIButton,
  Card, Grid, Icon, Flex, Background, RevealFx,
} from "@once-ui-system/core";

const OColumn = Column as any; const ORow = Row as any; const OHeading = Heading as any;
const OHeadingLink = HeadingLink as any; const OText = Text as any; const OAvatar = Avatar as any;
const OAvatarGroup = AvatarGroup as any; const OMedia = Media as any; const OLine = Line as any;
const OSmartLink = SmartLink as any; const OInlineCode = InlineCode as any;
const OCodeBlock = CodeBlock as any; const OList = List as any; const OListItem = ListItem as any;
const OAccordion = Accordion as any; const OAccordionGroup = AccordionGroup as any;
const OTable = Table as any; const OFeedback = Feedback as any; const OButton = OUIButton as any;
const OCard = Card as any; const OGrid = Grid as any; const OIcon = Icon as any;
const OFlex = Flex as any; const OBackground = Background as any; const ORevealFx = RevealFx as any;

// ── Types ─────────────────────────────────────────────────────────────────────
type BlockType = 'heading' | 'text' | 'codeblock' | 'media' | 'table' | 'button' | 'card' | 'accordion' | 'feedback' | 'line' | 'icon' | 'raw';
type Block = { id: string; type: BlockType; content: Record<string, any> };

// ── Helpers ───────────────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).substring(2, 9);

function slugify(str: string): string {
  return transliterate(str.replace(/&/g, " and "), { lowercase: true, separator: "-" }).replace(/\-\-+/g, "-");
}
function createHeading(as: "h1"|"h2"|"h3"|"h4"|"h5"|"h6") {
  return ({ children, ...p }: any) => (
    <OHeadingLink marginTop="24" marginBottom="12" as={as} id={slugify(String(children ?? ""))} {...p}>{children}</OHeadingLink>
  );
}
function CustomLink({ href, children, ...p }: any) {
  if (href?.startsWith("/") || href?.startsWith("#")) return <OSmartLink href={href} {...p}>{children}</OSmartLink>;
  return <a href={href} target="_blank" rel="noopener noreferrer" {...p}>{children}</a>;
}
function createCodeBlock({ children, ...p }: any) {
  if (children?.props?.className) {
    const { className, children: code } = children.props;
    const language = className.replace("language-", "");
    return <OCodeBlock marginTop="8" marginBottom="16" codes={[{ code, language, label: language.charAt(0).toUpperCase() + language.slice(1) }]} copyButton {...p} />;
  }
  return <pre {...p}>{children}</pre>;
}

// ── MDX component map (identical to src/components/mdx.tsx) ──────────────────
const mdxComponents: Record<string, any> = {
  p:    ({ children }: any) => <OText style={{ lineHeight: "175%" }} variant="body-default-m" onBackground="neutral-medium" marginTop="8" marginBottom="12">{children}</OText>,
  h1: createHeading("h1"), h2: createHeading("h2"), h3: createHeading("h3"),
  h4: createHeading("h4"), h5: createHeading("h5"), h6: createHeading("h6"),
  img: ({ alt, src, ...p }: any) => <OMedia marginTop="8" marginBottom="16" enlarge radius="m" border="neutral-alpha-medium" alt={alt} src={src} unoptimized {...p} />,
  a:   CustomLink,
  code: ({ children }: any) => <OInlineCode>{children}</OInlineCode>,
  pre:  createCodeBlock,
  ul: ({ children }: any) => <OList as="ul">{children}</OList>,
  ol: ({ children }: any) => <OList as="ol">{children}</OList>,
  li: ({ children }: any) => <OListItem marginTop="4" marginBottom="8" style={{ lineHeight: "175%" }}>{children}</OListItem>,
  hr: () => <ORow fillWidth horizontal="center"><OLine maxWidth="40" /></ORow>,
  Heading: OHeading, Text: OText, CodeBlock: OCodeBlock, InlineCode: OInlineCode,
  Accordion: OAccordion, AccordionGroup: OAccordionGroup, Table: OTable,
  Feedback: OFeedback, Button: OButton, Card: OCard, Grid: OGrid,
  Row: ORow, Column: OColumn, Flex: OFlex, Icon: OIcon, Media: OMedia,
  SmartLink: OSmartLink, Line: OLine, List: OList, ListItem: OListItem, Avatar: OAvatar,
};

const BG_EFFECTS = {
  mask:     { cursor: false, x: 50, y: 0, radius: 100 },
  gradient: { display: false, opacity: 100, x: 50, y: 60, width: 100, height: 50, tilt: 0, colorStart: "accent-background-strong", colorEnd: "page-background" },
  dots:     { display: true, opacity: 40, size: "2", color: "brand-background-strong" },
  grid:     { display: false, opacity: 100, color: "neutral-alpha-medium", width: "0.25rem", height: "0.25rem" },
  lines:    { display: false, opacity: 100, color: "neutral-alpha-weak", size: "16", thickness: 1, angle: 45 },
};

// ── Block definitions ─────────────────────────────────────────────────────────
const BLOCK_DEFS: { type: BlockType; label: string; icon: React.ElementType; desc: string }[] = [
  { type: 'heading',   label: 'Heading',    icon: Heading1,       desc: 'H1–H6 section header' },
  { type: 'text',      label: 'Text',       icon: AlignLeft,      desc: 'Paragraph with Markdown' },
  { type: 'codeblock', label: 'Code Block', icon: Code,           desc: 'Fenced or CodeBlock component' },
  { type: 'media',     label: 'Image',      icon: Image,          desc: 'Photo or video embed' },
  { type: 'table',     label: 'Table',      icon: Table2,         desc: 'Data table component' },
  { type: 'button',    label: 'Button',     icon: MousePointerClick, desc: 'Call to action button' },
  { type: 'card',      label: 'Card',       icon: LayoutTemplate, desc: 'Content card component' },
  { type: 'accordion', label: 'Accordion',  icon: ListCollapse,   desc: 'Collapsible sections' },
  { type: 'feedback',  label: 'Feedback',   icon: AlertCircle,    desc: 'Info / warning / alert' },
  { type: 'line',      label: 'Divider',    icon: Minus,          desc: 'Horizontal rule (---)' },
  { type: 'icon',      label: 'Icon',       icon: Star,           desc: 'Once UI icon component' },
  { type: 'raw',       label: 'Raw MDX',    icon: FileCode,       desc: 'Custom JSX / component' },
];

const getDefaultContent = (type: BlockType): Record<string, any> => {
  switch (type) {
    case 'heading':   return { level: 'h2', text: '' };
    case 'text':      return { text: '' };
    case 'codeblock': return { language: 'tsx', code: '', highlight: '' };
    case 'media':     return { src: '', alt: '', aspectRatio: '16/9', radius: 'l' };
    case 'table':     return { headers: ['Column 1', 'Column 2'], rows: [['', '']] };
    case 'button':    return { label: 'Button', variant: 'primary', href: '', prefixIcon: '', suffixIcon: '', size: 'm' };
    case 'card':      return { title: 'Card Title', description: '', href: '' };
    case 'accordion': return { items: [{ title: 'Section', text: '' }] };
    case 'feedback':  return { variant: 'info', title: '', text: '' };
    case 'line':      return {};
    case 'icon':      return { name: 'github', size: 'm' };
    case 'raw':       return { text: '<Row gap="16" marginBottom="16">\n  \n</Row>' };
    default:          return {};
  }
};

// ── Serialization: Block → MDX string ────────────────────────────────────────
const serializeBlock = (b: Block): string => {
  const c = b.content;
  switch (b.type) {
    case 'heading': {
      const n = parseInt(c.level?.replace('h', '') || '2');
      return '#'.repeat(n) + ' ' + (c.text || '');
    }
    case 'text':
      return c.text || '';
    case 'codeblock': {
      if (c.highlight) {
        const codes = [{ code: c.code || '', language: c.language || 'tsx', label: (c.language || 'tsx').charAt(0).toUpperCase() + (c.language || 'tsx').slice(1) }];
        return `<CodeBlock highlight="${c.highlight}" codes={${JSON.stringify(codes)}} marginBottom="16" />`;
      }
      return '```' + (c.language || '') + '\n' + (c.code || '') + '\n```';
    }
    case 'media':
      return [`<Media`, `  src="${c.src || ''}"`, `  alt="${c.alt || ''}"`, `  aspectRatio="${c.aspectRatio || '16/9'}"`, `  radius="${c.radius || 'l'}"`, `  border="neutral-alpha-weak"`, `  marginBottom="16"`, `/>`].join('\n');
    case 'table': {
      const headers = (c.headers || ['Col']).map((h: string) => ({ content: h, key: h.toLowerCase().replace(/[^a-z0-9]/g, '_') }));
      return `<Table marginBottom="16" data={${JSON.stringify({ headers, rows: c.rows || [] })}} />`;
    }
    case 'button': {
      const attrs = [`variant="${c.variant || 'primary'}"`];
      if (c.size && c.size !== 'm') attrs.push(`size="${c.size}"`);
      if (c.href) attrs.push(`href="${c.href}"`);
      if (c.prefixIcon) attrs.push(`prefixIcon="${c.prefixIcon}"`);
      if (c.suffixIcon) attrs.push(`suffixIcon="${c.suffixIcon}"`);
      return `<Button ${attrs.join(' ')}>${c.label || 'Button'}</Button>`;
    }
    case 'card': {
      const attrs = ['padding="24"', 'radius="l"', 'border="neutral-alpha-weak"', 'direction="column"', 'gap="12"', 'marginBottom="16"'];
      if (c.href) attrs.push(`href="${c.href}"`);
      return [`<Card ${attrs.join(' ')}>`, `  <Text variant="heading-strong-m">${c.title || ''}</Text>`, `  <Text variant="body-default-s" onBackground="neutral-weak">${c.description || ''}</Text>`, `</Card>`].join('\n');
    }
    case 'accordion': {
      const items = (c.items || []).map((item: any) =>
        [`  <Accordion title="${(item.title || '').replace(/"/g, '&quot;')}">`, `    <Text variant="body-default-m" onBackground="neutral-medium">${item.text || ''}</Text>`, `  </Accordion>`].join('\n')
      ).join('\n');
      return `<AccordionGroup>\n${items}\n</AccordionGroup>`;
    }
    case 'feedback': {
      const body = (c.title ? `<strong>${c.title}</strong> ` : '') + (c.text || '');
      return `<Feedback variant="${c.variant || 'info'}" marginBottom="8">\n  <Text variant="body-default-m">${body}</Text>\n</Feedback>`;
    }
    case 'line':
      return '---';
    case 'icon':
      return `<Icon name="${c.name || 'github'}" size="${c.size || 'm'}" />`;
    case 'raw':
    default:
      return c.text || '';
  }
};

const serializeBlocksToMDX = (blocks: Block[]): string =>
  blocks.map(serializeBlock).filter(s => s.trim()).join('\n\n');

// ── Parse MDX → Blocks (basic, falls back to raw for complex components) ─────
const parseMDXToBlocks = (mdx: string): Block[] => {
  if (!mdx.trim()) return [{ id: genId(), type: 'text', content: { text: '' } }];
  const blocks: Block[] = [];
  const lines = mdx.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) { i++; continue; }

    // Heading
    const hm = t.match(/^(#{1,6})\s+(.*)$/);
    if (hm) {
      blocks.push({ id: genId(), type: 'heading', content: { level: `h${hm[1].length}`, text: hm[2] } });
      i++; continue;
    }
    // Divider
    if (t === '---') { blocks.push({ id: genId(), type: 'line', content: {} }); i++; continue; }

    // Fenced code block
    if (t.startsWith('```')) {
      const lang = t.replace(/^```/, '').trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '```') { codeLines.push(lines[i]); i++; }
      i++;
      blocks.push({ id: genId(), type: 'codeblock', content: { language: lang, code: codeLines.join('\n'), highlight: '' } });
      continue;
    }

    // JSX component
    if (/^<[A-Z]/.test(t)) {
      const rawLines: string[] = [line];
      if (!t.endsWith('/>') && !t.endsWith('>')) {
        i++;
        while (i < lines.length) {
          rawLines.push(lines[i]);
          const rt = lines[i].trim();
          if (rt === '/>' || /^<\/[A-Z]/.test(rt)) { i++; break; }
          i++;
        }
      } else { i++; }
      const raw = rawLines.join('\n');
      // Try to identify simple Media component
      if (/^<Media\b/.test(t)) {
        const sm = raw.match(/src="([^"]*)"/); const am = raw.match(/alt="([^"]*)"/);
        const arm = raw.match(/aspectRatio="([^"]*)"/); const rm = raw.match(/radius="([^"]*)"/);
        blocks.push({ id: genId(), type: 'media', content: { src: sm?.[1] || '', alt: am?.[1] || '', aspectRatio: arm?.[1] || '16/9', radius: rm?.[1] || 'l' } });
      } else {
        blocks.push({ id: genId(), type: 'raw', content: { text: raw } });
      }
      continue;
    }

    // Plain text — collect until empty line
    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '') { textLines.push(lines[i]); i++; }
    if (textLines.length) blocks.push({ id: genId(), type: 'text', content: { text: textLines.join('\n') } });
  }
  return blocks.length ? blocks : [{ id: genId(), type: 'text', content: { text: '' } }];
};

// ── Block Editor Card ─────────────────────────────────────────────────────────
const BlockCard = ({ block, index, total, onUpdate, onDelete, onMoveUp, onMoveDown }: {
  block: Block; index: number; total: number;
  onUpdate: (c: any) => void; onDelete: () => void;
  onMoveUp: () => void; onMoveDown: () => void;
}) => {
  const def = BLOCK_DEFS.find(d => d.type === block.type)!;
  const BlockIcon = def?.icon ?? FileCode;
  const c = block.content;
  const upd = (patch: any) => onUpdate({ ...c, ...patch });

  const renderFields = () => {
    switch (block.type) {
      case 'heading':
        return (
          <div className="space-y-2">
            <div className="flex gap-1 flex-wrap">
              {['h1','h2','h3','h4','h5','h6'].map(lvl => (
                <button key={lvl} onClick={() => upd({ level: lvl })}
                  className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded transition-colors ${c.level === lvl ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {lvl.toUpperCase()}
                </button>
              ))}
            </div>
            <Input value={c.text || ''} onChange={e => upd({ text: e.target.value })} placeholder="Heading text…" className="h-8 text-sm font-semibold" />
          </div>
        );

      case 'text':
        return (
          <Textarea value={c.text || ''} onChange={e => onUpdate({ text: e.target.value })}
            placeholder={"Paragraph text. Supports **bold**, *italic*, `code`, [link](url)…"}
            className="text-sm min-h-[80px] resize-y leading-relaxed" />
        );

      case 'codeblock':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input value={c.language || 'tsx'} onChange={e => upd({ language: e.target.value })}
                placeholder="Language" className="h-7 text-xs w-24 font-mono" />
              <Input value={c.highlight || ''} onChange={e => upd({ highlight: e.target.value })}
                placeholder="Highlight lines (e.g. 3-5)" className="h-7 text-xs flex-1" />
            </div>
            <Textarea value={c.code || ''} onChange={e => upd({ code: e.target.value })}
              placeholder="// Your code here…" className="font-mono text-xs min-h-[120px] resize-y" spellCheck={false} />
          </div>
        );

      case 'media':
        return (
          <div className="space-y-2">
            <Input value={c.src || ''} onChange={e => upd({ src: e.target.value })} placeholder="/images/photo.jpg" className="h-8 text-sm" />
            {c.src && <img src={c.src} alt={c.alt} className="w-full rounded object-cover max-h-32" onError={e => (e.currentTarget.style.display = 'none')} />}
            <div className="flex gap-2">
              <Input value={c.alt || ''} onChange={e => upd({ alt: e.target.value })} placeholder="Alt text" className="h-7 text-xs flex-1" />
              <Input value={c.aspectRatio || '16/9'} onChange={e => upd({ aspectRatio: e.target.value })} placeholder="16/9" className="h-7 text-xs w-16 font-mono" />
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="space-y-2">
            <div>
              <p className="text-[11px] text-gray-400 mb-1">Columns</p>
              <div className="flex flex-wrap gap-1.5">
                {(c.headers || []).map((h: string, i: number) => (
                  <div key={i} className="flex gap-1">
                    <Input value={h} onChange={e => { const nh = [...c.headers]; nh[i] = e.target.value; upd({ headers: nh }); }}
                      className="h-6 text-xs w-24 font-mono" />
                    <button onClick={() => { const nh = c.headers.filter((_: any, j: number) => j !== i); const nr = c.rows.map((r: string[]) => r.filter((_: any, j: number) => j !== i)); upd({ headers: nh, rows: nr }); }}
                      className="text-gray-300 hover:text-red-400 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button onClick={() => upd({ headers: [...(c.headers || []), `Col ${(c.headers || []).length + 1}`], rows: (c.rows || []).map((r: string[]) => [...r, '']) })}
                  className="text-xs text-violet-500 hover:text-violet-700 flex items-center gap-0.5">
                  <Plus className="h-3 w-3" /> Col
                </button>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-1">Rows</p>
              {(c.rows || []).map((row: string[], ri: number) => (
                <div key={ri} className="flex gap-1 mb-1 items-center">
                  {row.map((cell: string, ci: number) => (
                    <Input key={ci} value={cell} onChange={e => { const nr = c.rows.map((r: string[], i: number) => i === ri ? r.map((cl: string, j: number) => j === ci ? e.target.value : cl) : r); upd({ rows: nr }); }}
                      className="h-6 text-xs flex-1 font-mono" placeholder={(c.headers || [])[ci] || `Col ${ci + 1}`} />
                  ))}
                  <button onClick={() => upd({ rows: c.rows.filter((_: any, i: number) => i !== ri) })} className="text-gray-300 hover:text-red-400"><X className="h-3 w-3" /></button>
                </div>
              ))}
              <button onClick={() => upd({ rows: [...(c.rows || []), (c.headers || []).map(() => '')] })}
                className="text-xs text-violet-500 hover:text-violet-700 flex items-center gap-0.5 mt-1">
                <Plus className="h-3 w-3" /> Add row
              </button>
            </div>
          </div>
        );

      case 'button':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input value={c.label || ''} onChange={e => upd({ label: e.target.value })} placeholder="Button label" className="h-7 text-sm flex-1" />
              <Select value={c.variant || 'primary'} onValueChange={v => upd({ variant: v })}>
                <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['primary','secondary','tertiary','danger'].map(v => <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input value={c.href || ''} onChange={e => upd({ href: e.target.value })} placeholder="href (optional)" className="h-7 text-xs flex-1" />
              <Input value={c.prefixIcon || ''} onChange={e => upd({ prefixIcon: e.target.value })} placeholder="prefixIcon" className="h-7 text-xs w-24" />
            </div>
          </div>
        );

      case 'card':
        return (
          <div className="space-y-2">
            <Input value={c.title || ''} onChange={e => upd({ title: e.target.value })} placeholder="Card title" className="h-8 text-sm font-medium" />
            <Textarea value={c.description || ''} onChange={e => upd({ description: e.target.value })} placeholder="Card description…" className="text-xs min-h-[60px] resize-none" />
            <Input value={c.href || ''} onChange={e => upd({ href: e.target.value })} placeholder="Link href (optional)" className="h-7 text-xs" />
          </div>
        );

      case 'accordion':
        return (
          <div className="space-y-2">
            {(c.items || []).map((item: any, i: number) => (
              <div key={i} className="border border-gray-100 rounded-lg p-2 space-y-1.5 bg-gray-50/50 relative">
                <button onClick={() => { const n = [...c.items]; n.splice(i, 1); upd({ items: n }); }}
                  className="absolute top-1.5 right-1.5 text-gray-300 hover:text-red-400"><X className="h-3 w-3" /></button>
                <Input value={item.title || ''} onChange={e => { const n = [...c.items]; n[i] = { ...n[i], title: e.target.value }; upd({ items: n }); }}
                  placeholder="Section title" className="h-7 text-xs font-medium pr-6" />
                <Textarea value={item.text || ''} onChange={e => { const n = [...c.items]; n[i] = { ...n[i], text: e.target.value }; upd({ items: n }); }}
                  placeholder="Section content…" className="text-xs min-h-[60px] resize-none" />
              </div>
            ))}
            <button onClick={() => upd({ items: [...(c.items || []), { title: '', text: '' }] })}
              className="w-full text-xs text-violet-500 hover:text-violet-700 border border-dashed border-gray-200 rounded-lg py-1.5 flex items-center justify-center gap-1 transition-colors">
              <Plus className="h-3 w-3" /> Add section
            </button>
          </div>
        );

      case 'feedback':
        return (
          <div className="space-y-2">
            <Select value={c.variant || 'info'} onValueChange={v => upd({ variant: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['info','success','warning','danger'].map(v => <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input value={c.title || ''} onChange={e => upd({ title: e.target.value })} placeholder="Bold title (optional)" className="h-7 text-xs font-medium" />
            <Textarea value={c.text || ''} onChange={e => upd({ text: e.target.value })} placeholder="Message content…" className="text-xs min-h-[60px] resize-none" />
          </div>
        );

      case 'line':
        return <div className="flex items-center gap-2 py-1"><div className="flex-1 border-t border-gray-200" /><span className="text-[11px] text-gray-400">---</span><div className="flex-1 border-t border-gray-200" /></div>;

      case 'icon':
        return (
          <div className="flex gap-2">
            <Input value={c.name || 'github'} onChange={e => upd({ name: e.target.value })} placeholder="Icon name (e.g. github)" className="h-7 text-xs flex-1 font-mono" />
            <Select value={c.size || 'm'} onValueChange={v => upd({ size: v })}>
              <SelectTrigger className="h-7 text-xs w-16"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['xs','s','m','l','xl'].map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        );

      case 'raw':
      default:
        return (
          <Textarea value={c.text || ''} onChange={e => onUpdate({ text: e.target.value })}
            placeholder={"<Row gap=\"16\">\n  <Column>...</Column>\n</Row>"}
            className="font-mono text-xs min-h-[120px] resize-y" spellCheck={false} />
        );
    }
  };

  const variantColors: Record<BlockType, string> = {
    heading:   'bg-violet-50 text-violet-600',
    text:      'bg-blue-50 text-blue-600',
    codeblock: 'bg-gray-100 text-gray-600',
    media:     'bg-green-50 text-green-600',
    table:     'bg-orange-50 text-orange-600',
    button:    'bg-pink-50 text-pink-600',
    card:      'bg-indigo-50 text-indigo-600',
    accordion: 'bg-cyan-50 text-cyan-600',
    feedback:  'bg-amber-50 text-amber-600',
    line:      'bg-gray-50 text-gray-500',
    icon:      'bg-purple-50 text-purple-600',
    raw:       'bg-gray-100 text-gray-500',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Block header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50/80 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-md ${variantColors[block.type] || 'bg-gray-100 text-gray-500'}`}>
            <BlockIcon className="h-3 w-3" />
          </div>
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{def?.label ?? block.type}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={onMoveUp} disabled={index === 0}
            className="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-600 disabled:opacity-25 transition-colors">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1}
            className="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-600 disabled:opacity-25 transition-colors">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete}
            className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors ml-0.5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {/* Block fields */}
      <div className="p-3">{renderFields()}</div>
    </div>
  );
};

// ── Main ContentEditor ────────────────────────────────────────────────────────
const ContentEditor = () => {
  const { type: paramType, slug } = useParams<{ type?: string; slug?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = paramType || searchParams.get("type") || "posts";
  const isNew = !slug;
  const isProject = type === "projects";

  // Metadata
  const [title,        setTitle]        = useState("");
  const [summary,      setSummary]      = useState("");
  const [publishedAt,  setPublishedAt]  = useState(new Date().toISOString().split("T")[0]);
  const [extraMetaStr, setExtraMetaStr] = useState(isProject ? '{\n  "images": [],\n  "team": []\n}' : '{\n  "image": ""\n}');
  const [status,       setStatus]       = useState("");

  // Blocks
  const [blocks, setBlocks] = useState<Block[]>([
    { id: genId(), type: 'text', content: { text: '' } }
  ]);

  // Preview state
  const [CompiledMDX,    setCompiledMDX]    = useState<React.FC<any> | null>(null);
  const [compileError,   setCompileError]   = useState<string | null>(null);
  const [compileLoading, setCompileLoading] = useState(false);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  // Derived
  const parsedMeta    = useMemo(() => { try { return JSON.parse(extraMetaStr); } catch { return {}; } }, [extraMetaStr]);
  const featuredImage = isProject ? (Array.isArray(parsedMeta.images) ? parsedMeta.images[0] : "") ?? "" : (parsedMeta.image ?? "");
  const team: any[]   = Array.isArray(parsedMeta.team) ? parsedMeta.team : [];
  const mdxContent    = useMemo(() => serializeBlocksToMDX(blocks), [blocks]);

  // Load existing
  useEffect(() => {
    if (!isNew && slug) {
      fetch(`/api/${type}/${slug}`).then(r => r.json()).then(data => {
        const m = data.metadata || {};
        setTitle(m.title || ""); setSummary(m.summary || ""); setPublishedAt(m.publishedAt || "");
        const extra: any = { ...m }; delete extra.title; delete extra.summary; delete extra.publishedAt;
        setExtraMetaStr(JSON.stringify(extra, null, 2));
        setBlocks(parseMDXToBlocks(data.content || ""));
      }).catch(() => {});
    }
  }, [slug, type, isNew]);

  // Compile MDX for preview
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    cancelledRef.current = false;
    if (!mdxContent.trim()) { setCompiledMDX(null); setCompileError(null); return; }
    setCompileLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/compile-mdx", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: mdxContent }),
        });
        const data = await res.json();
        if (cancelledRef.current) return;
        if (data.error) { setCompileError(data.error); setCompiledMDX(null); setCompileLoading(false); return; }
        const fn = new Function(data.code);
        const result = fn.call(null, { Fragment: React.Fragment, jsx: React.createElement, jsxs: React.createElement });
        const Comp = result?.default;
        if (typeof Comp !== "function") throw new Error("No default export");
        setCompiledMDX(() => Comp); setCompileError(null);
      } catch (e: any) {
        if (!cancelledRef.current) setCompileError(e?.message ?? "Compile error");
      } finally {
        if (!cancelledRef.current) setCompileLoading(false);
      }
    }, 600);
    return () => { cancelledRef.current = true; if (timerRef.current) clearTimeout(timerRef.current); };
  }, [mdxContent]);

  // Block ops
  const addBlock = (type: BlockType) => setBlocks(bs => [...bs, { id: genId(), type, content: getDefaultContent(type) }]);
  const updateBlock = (id: string, content: any) => setBlocks(bs => bs.map(b => b.id === id ? { ...b, content } : b));
  const deleteBlock = (id: string) => setBlocks(bs => bs.filter(b => b.id !== id));
  const moveBlock   = (id: string, dir: 'up' | 'down') => setBlocks(bs => {
    const i = bs.findIndex(b => b.id === id);
    if ((dir === 'up' && i === 0) || (dir === 'down' && i === bs.length - 1)) return bs;
    const n = [...bs]; const ni = dir === 'up' ? i - 1 : i + 1;
    [n[i], n[ni]] = [n[ni], n[i]]; return n;
  });

  // Save
  const handleSave = async () => {
    try {
      setStatus("Saving…");
      let extra: any = {}; try { extra = JSON.parse(extraMetaStr); } catch {}
      const metadata = { title, summary, publishedAt, ...extra };
      const content  = serializeBlocksToMDX(blocks);
      const endpoint = isNew ? `/api/${type}` : `/api/${type}/${slug}`;
      const method   = isNew ? "POST" : "PUT";
      const payload: any = { metadata, content };
      if (isNew) {
        const g = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        if (!g) { setStatus("Error: Title is required"); return; }
        payload.slug = g;
      }
      const res = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        setStatus("Saved!");
        setTimeout(() => { setStatus(""); if (isNew) navigate("/admin"); }, 1200);
      } else {
        const err = await res.json(); setStatus(`Error: ${err.error}`);
      }
    } catch (e: any) { setStatus(`Error: ${e.message}`); }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="shrink-0 border-b bg-white z-10">
        <div className="flex items-center justify-between h-12 px-4">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-muted-foreground hover:text-foreground -ml-1 px-2">
                <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline text-xs">Dashboard</span>
              </Button>
            </Link>
            <div className="w-px h-4 bg-border" />
            <span className="text-xs text-muted-foreground font-medium">{isProject ? "Work Project" : "Blog Post"}</span>
            <span className="text-sm text-muted-foreground truncate max-w-[200px] hidden md:block">{title || "Untitled"}</span>
          </div>
          <div className="flex items-center gap-2">
            {compileLoading && <span className="text-xs text-muted-foreground animate-pulse">Compiling…</span>}
            {status && <span className={`text-xs font-medium ${status.startsWith("Error") ? "text-destructive" : "text-muted-foreground"}`}>{status}</span>}
            <Button size="sm" className="h-7 text-xs gap-1.5" onClick={handleSave}>
              <Save className="h-3.5 w-3.5" />{isNew ? "Publish" : "Update"}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Portfolio preview */}
        <div className="flex-1 overflow-y-auto relative">
          <ORevealFx fill position="absolute">
            <OBackground mask={BG_EFFECTS.mask} gradient={BG_EFFECTS.gradient} dots={BG_EFFECTS.dots} grid={BG_EFFECTS.grid} lines={BG_EFFECTS.lines} />
          </ORevealFx>
          <OFlex zIndex={1} fillWidth padding="l" horizontal="center" flex={1} style={{ position: "relative" }}>
            <div style={{ width: "100%", maxWidth: "960px", paddingTop: "32px", paddingBottom: "80px" }}>
              {isProject ? (
                <OColumn as="section" maxWidth="m" horizontal="center" gap="l">
                  <OColumn maxWidth="s" gap="16" horizontal="center" align="center">
                    <OSmartLink href="/work"><OText variant="label-strong-m">Projects</OText></OSmartLink>
                    <OText variant="body-default-xs" onBackground="neutral-weak" marginBottom="12">{publishedAt ? formatDate(publishedAt) : "—"}</OText>
                    <OHeading variant="display-strong-m">{title || <span style={{ opacity: 0.3 }}>Untitled Project</span>}</OHeading>
                  </OColumn>
                  <ORow marginBottom="32" horizontal="center">
                    <ORow gap="16" vertical="center">
                      {team.length > 0 ? <>
                        <OAvatarGroup reverse avatars={team.map((m: any) => ({ src: m.avatar || "/images/avatar.jpg" }))} size="s" />
                        <OText variant="label-default-m" onBackground="brand-weak">
                          {team.map((m: any, i: number) => <span key={i}>{i > 0 && <OText as="span" onBackground="neutral-weak">, </OText>}{m.name}</span>)}
                        </OText>
                      </> : <>
                        <OAvatar size="s" src="/images/avatar.jpg" />
                        <OText variant="label-default-m" onBackground="brand-weak">Ahmad Fadhilah Mappisara</OText>
                      </>}
                    </ORow>
                  </ORow>
                  {featuredImage && <OMedia priority aspectRatio="16/9" radius="m" alt={title || "image"} src={featuredImage} unoptimized />}
                  <OColumn style={{ margin: "auto" }} as="article" maxWidth="xs">
                    <ArticleContent CompiledMDX={CompiledMDX} compileError={compileError} mdxContent={mdxContent} />
                  </OColumn>
                </OColumn>
              ) : (
                <ORow fillWidth>
                  <ORow maxWidth={12} />
                  <ORow fillWidth horizontal="center">
                    <OColumn as="section" maxWidth="m" horizontal="center" gap="l" paddingTop="24">
                      <OColumn maxWidth="s" gap="16" horizontal="center" align="center">
                        <OSmartLink href="/blog"><OText variant="label-strong-m">Blog</OText></OSmartLink>
                        <OText variant="body-default-xs" onBackground="neutral-weak" marginBottom="12">{publishedAt ? formatDate(publishedAt) : "—"}</OText>
                        <OHeading variant="display-strong-m">{title || <span style={{ opacity: 0.3 }}>Untitled Post</span>}</OHeading>
                        {summary && <OText variant="body-default-l" onBackground="neutral-weak" align="center" style={{ fontStyle: "italic" }}>{summary}</OText>}
                      </OColumn>
                      <ORow marginBottom="32" horizontal="center">
                        <ORow gap="16" vertical="center">
                          <OAvatar size="s" src="/images/avatar.jpg" />
                          <OText variant="label-default-m" onBackground="brand-weak">Ahmad Fadhilah Mappisara</OText>
                        </ORow>
                      </ORow>
                      {featuredImage && <OMedia src={featuredImage} alt={title || "image"} aspectRatio="16/9" priority border="neutral-alpha-weak" radius="l" marginTop="12" marginBottom="8" unoptimized />}
                      <OColumn as="article" maxWidth="s">
                        <ArticleContent CompiledMDX={CompiledMDX} compileError={compileError} mdxContent={mdxContent} />
                      </OColumn>
                    </OColumn>
                  </ORow>
                </ORow>
              )}
            </div>
          </OFlex>
        </div>

        {/* RIGHT: Block editor panel */}
        <aside className="w-[380px] xl:w-[420px] shrink-0 border-l bg-[#f9fafb] overflow-y-auto flex flex-col">
          {/* Page Settings */}
          <div className="bg-white border-b px-4 py-3 space-y-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Page Settings</p>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Article title…" className="h-8 text-sm bg-white" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">{isProject ? "Summary" : "Excerpt / Summary"}</label>
              <Textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Brief description…" className="text-sm min-h-[60px] resize-none bg-white" />
            </div>
            <div className="flex gap-2">
              <div className="space-y-1 flex-1">
                <label className="text-xs text-gray-400">Publish Date</label>
                <Input type="date" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} className="h-8 text-sm bg-white" />
              </div>
              <div className="space-y-1 flex-1">
                <label className="text-xs text-gray-400">Slug</label>
                <Input value={slug || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "auto")} disabled className="h-8 text-sm bg-gray-50 text-gray-400" />
              </div>
            </div>
            {/* Advanced meta (images, team, etc.) */}
            <details>
              <summary className="text-[11px] text-gray-400 cursor-pointer select-none hover:text-gray-600">Advanced Metadata (JSON)</summary>
              <Textarea value={extraMetaStr} onChange={e => setExtraMetaStr(e.target.value)} className="font-mono text-xs min-h-[100px] resize-y bg-gray-50 mt-1.5" spellCheck={false} />
            </details>
          </div>

          {/* Content Blocks */}
          <div className="flex-1 px-3 py-3 space-y-2.5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Content Blocks</p>

            {blocks.map((block, index) => (
              <BlockCard
                key={block.id}
                block={block}
                index={index}
                total={blocks.length}
                onUpdate={(content) => updateBlock(block.id, content)}
                onDelete={() => deleteBlock(block.id)}
                onMoveUp={() => moveBlock(block.id, 'up')}
                onMoveDown={() => moveBlock(block.id, 'down')}
              />
            ))}

            {/* Add block button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-colors bg-white">
                  <Plus className="h-4 w-4" /> Add Content Block
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[28rem] p-2 grid grid-cols-2 gap-1 rounded-xl shadow-xl" align="start">
                {BLOCK_DEFS.map(def => (
                  <DropdownMenuItem key={def.type} onClick={() => addBlock(def.type)}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer">
                    <div className="p-1.5 bg-gray-100 rounded-md mt-0.5 shrink-0">
                      <def.icon className="h-3 w-3 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{def.label}</p>
                      <p className="text-[11px] text-gray-400">{def.desc}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>
      </div>
    </div>
  );
};

// ── Article content renderer ──────────────────────────────────────────────────
function ArticleContent({ CompiledMDX, compileError, mdxContent }: {
  CompiledMDX: React.FC<any> | null; compileError: string | null; mdxContent: string;
}) {
  if (!mdxContent.trim()) return <OText onBackground="neutral-weak" variant="body-default-m" style={{ opacity: 0.4 }}>Start adding blocks →</OText>;
  if (compileError) return <div className="text-destructive text-xs font-mono p-3 bg-destructive/10 border border-destructive/20 rounded whitespace-pre-wrap">{compileError}</div>;
  if (!CompiledMDX) return (
    <div className="space-y-3">
      <div className="h-4 bg-muted/60 rounded animate-pulse w-3/4" />
      <div className="h-4 bg-muted/40 rounded animate-pulse w-full" />
      <div className="h-4 bg-muted/40 rounded animate-pulse w-5/6" />
    </div>
  );
  return <CompiledMDX components={mdxComponents} />;
}

export default ContentEditor;
