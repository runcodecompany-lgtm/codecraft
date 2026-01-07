'use client'
export const dynamic = 'force-dynamic';
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Heading1, 
  Heading2, 
  Heading3,
  List, 
  ListOrdered, 
  Quote, 
  Image as ImageIcon,
  Link as LinkIcon,
  Unlink,
  Minus,
  Code,
  Undo,
  Redo,
  Type,
  Loader2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Maximize
} from 'lucide-react'
import { uploadImage } from '@/lib/upload'
import { compressImage } from '@/lib/compress'
import { useRef, useCallback, useState } from 'react'

interface RichEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

import { Editor } from '@tiptap/react'

const MenuBar = ({ editor }: { editor: Editor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('أدخل الرابط (URL):', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const editImage = useCallback(() => {
    const { src, width, height, alt } = editor.getAttributes('image')
    const newWidth = window.prompt('العرض (مثلاً 100% أو 400px):', width || '100%')
    
    if (newWidth === null) return // cancelled

    const newHeight = window.prompt('الارتفاع (اختياري - اتركه فارغاً للضبط التلقائي):', height || '')
    const newAlt = window.prompt('وصف الصورة (Alt Text):', alt || '')

    editor.chain().focus().updateAttributes('image', { 
      width: newWidth, 
      height: newHeight || 'auto',
      alt: newAlt || null,
      title: newAlt || null
    }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploading(true)
      
      // 1. إنشاء رابط معاينة فوري
      const previewUrl = URL.createObjectURL(file)
      
      try {
        // 2. ضغط الصورة لتقليل حجمها وسرعة الرفع
        const compressedFile = await compressImage(file)
        
        // 3. الرفع للسيرفر
        const url = await uploadImage(compressedFile)
        
        if (url) {
          // 4. إدراج الصورة النهائية
          const altText = prompt('أدخل وصفاً للصورة (اختياري):', '')
          editor.chain().focus().setImage({ src: url, alt: altText || undefined, title: altText || undefined }).run()
        }
      } catch (error) {
        console.error('Upload failed:', error)
        alert('فشل رفع الصورة، يرجى المحاولة مرة أخرى')
      } finally {
        setIsUploading(false)
        URL.revokeObjectURL(previewUrl) // تنظيف الذاكرة
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const buttons = [
    {
      icon: <Bold className="w-4 h-4" />,
      title: 'عريض',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      icon: <Italic className="w-4 h-4" />,
      title: 'مائل',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
    },
    {
      icon: <UnderlineIcon className="w-4 h-4" />,
      title: 'تحته خط',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive('underline'),
    },
    {
      icon: <Heading1 className="w-4 h-4" />,
      title: 'عنوان 1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
    },
    {
      icon: <Heading2 className="w-4 h-4" />,
      title: 'عنوان 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
    },
    {
      icon: <Heading3 className="w-4 h-4" />,
      title: 'عنوان 3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive('heading', { level: 3 }),
    },
    {
      icon: <List className="w-4 h-4" />,
      title: 'قائمة نقطية',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
    },
    {
      icon: <ListOrdered className="w-4 h-4" />,
      title: 'قائمة رقمية',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
    },
    {
      icon: <Quote className="w-4 h-4" />,
      title: 'اقتباس',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive('blockquote'),
    },
    {
      icon: <Code className="w-4 h-4" />,
      title: 'كود',
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive('codeBlock'),
    },
  ]

  const alignmentButtons = [
    {
      icon: <AlignRight className="w-4 h-4" />,
      title: 'محاذاة لليمين',
      action: () => {
        if (editor.isActive('image')) {
          editor.chain().focus().updateAttributes('image', { align: 'right' }).run()
        } else {
          editor.chain().focus().setTextAlign('right').run()
        }
      },
      isActive: editor.isActive({ textAlign: 'right' }) || editor.isActive('image', { align: 'right' }),
    },
    {
      icon: <AlignCenter className="w-4 h-4" />,
      title: 'توسيط',
      action: () => {
        if (editor.isActive('image')) {
          editor.chain().focus().updateAttributes('image', { align: 'center' }).run()
        } else {
          editor.chain().focus().setTextAlign('center').run()
        }
      },
      isActive: editor.isActive({ textAlign: 'center' }) || editor.isActive('image', { align: 'center' }),
    },
    {
      icon: <AlignLeft className="w-4 h-4" />,
      title: 'محاذاة لليسار',
      action: () => {
        if (editor.isActive('image')) {
          editor.chain().focus().updateAttributes('image', { align: 'left' }).run()
        } else {
          editor.chain().focus().setTextAlign('left').run()
        }
      },
      isActive: editor.isActive({ textAlign: 'left' }) || editor.isActive('image', { align: 'left' }),
    },
    {
      icon: <AlignJustify className="w-4 h-4" />,
      title: 'ملء السطر',
      action: () => editor.chain().focus().setTextAlign('justify').run(),
      isActive: editor.isActive({ textAlign: 'justify' }),
    },
  ]

  return (
    <div className="sticky top-0 z-10 flex flex-wrap gap-0.5 p-1.5 bg-gray-50 border-b border-gray-200 rounded-t-lg items-center">
      {buttons.map((btn, i) => (
        <button
          key={i}
          type="button"
          onClick={btn.action}
          className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
            btn.isActive ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
          }`}
          title={btn.title}
        >
          {btn.icon}
        </button>
      ))}

      <div className="w-px h-6 bg-gray-300 mx-1.5" />

      {alignmentButtons.map((btn, i) => (
        <button
          key={i}
          type="button"
          onClick={btn.action}
          className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
            btn.isActive ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
          }`}
          title={btn.title}
        >
          {btn.icon}
        </button>
      ))}
      
      <div className="w-px h-6 bg-gray-300 mx-1.5" />

      <button
        type="button"
        onClick={setLink}
        className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
          editor.isActive('link') ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
        }`}
        title="إضافة رابط"
      >
        <LinkIcon className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        className="p-2 text-gray-600 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30"
        title="إلغاء الرابط"
      >
        <Unlink className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1.5" />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
          isUploading ? 'opacity-50 cursor-not-allowed' : 'text-gray-600'
        }`}
        title="إضافة صورة"
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        ) : (
          <ImageIcon className="w-4 h-4" />
        )}
      </button>

      <button
        type="button"
        onClick={editImage}
        disabled={!editor.isActive('image')}
        className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
          editor.isActive('image') ? 'text-blue-600' : 'text-gray-400 opacity-50'
        }`}
        title="تعديل الصورة (الحجم والوصف)"
      >
        <Maximize className="w-4 h-4" />
      </button>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="p-2 text-gray-600 rounded-md hover:bg-white hover:shadow-sm"
        title="فاصل أفقي"
      >
        <Minus className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1.5" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-2 text-gray-600 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30"
        title="تراجع"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-2 text-gray-600 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30"
        title="إعادة"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function RichEditor({ content, onChange, placeholder = 'ابدأ بكتابة تفاصيل الخبر هنا...' }: RichEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'right',
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: '100%',
              renderHTML: attributes => ({
                width: attributes.width,
              }),
            },
            height: {
              default: 'auto',
              renderHTML: attributes => ({
                height: attributes.height,
              }),
            },
            align: {
              default: 'center',
              renderHTML: attributes => {
                if (attributes.align === 'left') {
                  return { class: 'ml-0 mr-auto block' }
                }
                if (attributes.align === 'right') {
                  return { class: 'mr-0 ml-auto block' }
                }
                return { class: 'mx-auto block' }
              },
            },
          }
        },
      }).configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-6 shadow-md border border-gray-100 transition-all duration-200',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[400px] p-6 text-right',
        dir: 'rtl'
      },
    },
  })

  return (
    <div className="w-full border border-gray-200 rounded-lg bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all overflow-hidden">
      {editor && <MenuBar editor={editor} />}
      <div className="relative">
        <EditorContent editor={editor} />
      </div>
      
      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: right;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        .ProseMirror {
          min-height: 400px;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .prose a {
          color: #2563eb;
          text-decoration: underline;
        }
        .prose img {
          transition: transform 0.2s;
        }
        .prose img:hover {
          transform: scale(1.01);
        }
        .prose blockquote {
          border-right-width: 4px;
          border-right-color: #e5e7eb;
          border-left-width: 0;
          padding-right: 1.5rem;
          padding-left: 0;
          font-style: italic;
          color: #4b5563;
        }
      `}</style>
    </div>
  )
}
