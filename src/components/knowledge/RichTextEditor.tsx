import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { Extension } from '@tiptap/core';
import { Button } from '@/components/ui/button';
import { 
  Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3,
  Undo, Redo, Quote, Underline as UnderlineIcon, FileText, Mic, Languages
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { forwardRef, useImperativeHandle } from 'react';

// Custom extension to handle fontSize
const FontSize = Extension.create({
  name: 'fontSize',
  
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
});

// Custom extension for page break
const PageBreak = Extension.create({
  name: 'pageBreak',

  addCommands() {
    return {
      insertPageBreak: () => ({ commands }: any) => {
        return commands.insertContent('<div class="page-break" style="page-break-after: always; border-top: 2px dashed #ccc; margin: 20px 0; padding: 10px 0; text-align: center; color: #999;" data-page-break="true">───── Page Break ─────</div>');
      },
    } as any;
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onContextMenu?: (event: React.MouseEvent) => void;
  onTranscribe?: () => void;
  onTranslate?: () => void;
  showTranscribeTranslate?: boolean;
}

export interface RichTextEditorHandle {
  getEditor: () => Editor | null;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  ({ content, onChange, placeholder, onContextMenu, onTranscribe, onTranslate, showTranscribeTranslate = false }, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      Underline,
      PageBreak,
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
  }));

  const setFontSize = (size: string) => {
    if (editor) {
      editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md">
      <div className="sticky top-0 z-10 border-b bg-white p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-accent' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-accent' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-accent' : ''}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <div className="h-6 w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <div className="h-6 w-px bg-border mx-1" />
        <Select onValueChange={setFontSize}>
          <SelectTrigger className="w-[100px] h-8">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12px">Small</SelectItem>
            <SelectItem value="16px">Normal</SelectItem>
            <SelectItem value="20px">Large</SelectItem>
            <SelectItem value="24px">X-Large</SelectItem>
          </SelectContent>
        </Select>
        <div className="h-6 w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-accent' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-accent' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-accent' : ''}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => (editor as any).chain().focus().insertPageBreak().run()}
            title="Insert Page Break"
          >
            <FileText className="h-4 w-4" />
          </Button>

          {showTranscribeTranslate && (
            <>
              <div className="w-px h-6 bg-border mx-1" />
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onTranscribe}
                title="Transcribe Audio"
                data-transcribe-button
              >
                <Mic className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onTranslate}
                title="Translate Text"
                data-translate-button
              >
                <Languages className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      <div onContextMenu={onContextMenu}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';
