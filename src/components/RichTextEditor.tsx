'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

interface Props {
  content: string
  onChange: (html: string) => void
  onBlur?: () => void
  onSubmit?: () => void
  placeholder?: string
  autoFocus?: boolean
  minimal?: boolean
}

export function isEmptyHtml(html: string): boolean {
  return !html || html.replace(/<[^>]*>/g, '').trim() === ''
}

function ToolbarButton({ onClick, active, children, title }: {
  onClick: () => void
  active?: boolean
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`px-2 py-0.5 text-xs border transition-colors ${
        active
          ? 'border-void-muted text-void-text'
          : 'border-transparent text-void-dim hover:text-void-muted'
      }`}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({ content, onChange, onBlur, onSubmit, placeholder, autoFocus, minimal }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure(minimal ? { heading: false, blockquote: false, code: false, codeBlock: false, horizontalRule: false } : { heading: { levels: [1, 2] } }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'rte-link' },
      }),
      Placeholder.configure({ placeholder: placeholder ?? 'write something...' }),
    ],
    content: normalizeContent(content),
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: { class: 'rte-content outline-none' },
      handleKeyDown: (_view, e) => {
        if (onSubmit && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          onSubmit()
          return true
        }
        return false
      },
    },
    autofocus: autoFocus ? 'end' : false,
    immediatelyRender: false,
  })

  useEffect(() => {
    return () => { editor?.destroy() }
  }, [editor])

  function setLink() {
    if (!editor) return
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL:', prev ?? 'https://')
    if (url === null) return
    if (url.trim() === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url.trim() }).run()
  }

  if (!editor) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-0.5 flex-wrap border-b border-void-border pb-1.5">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <em>I</em>
        </ToolbarButton>
        {!minimal && (
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
            <s>S</s>
          </ToolbarButton>
        )}
        {!minimal && <span className="w-px h-3 bg-void-border mx-0.5" />}
        {!minimal && (
          <>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
              H1
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
              H2
            </ToolbarButton>
            <span className="w-px h-3 bg-void-border mx-0.5" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
              ul
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
              ol
            </ToolbarButton>
            <span className="w-px h-3 bg-void-border mx-0.5" />
          </>
        )}
        {minimal && <span className="w-px h-3 bg-void-border mx-0.5" />}
        <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Link">
          link
        </ToolbarButton>
        {editor.isActive('link') && (
          <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link">
            unlink
          </ToolbarButton>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

export function normalizeContent(content: string): string {
  if (!content) return ''
  if (/<[a-z][\s\S]*?>/i.test(content)) return content
  // convert legacy plain text — wrap paragraphs, preserve newlines
  return content.split(/\n\n+/).map(para =>
    `<p>${para.replace(/\n/g, '<br>')}</p>`
  ).join('')
}
