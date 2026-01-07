/**
 * وظيفة لضغط الصور في المتصفح قبل الرفع
 */
export async function compressImage(file: File, maxWidth = 1000, quality = 0.7): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // الحفاظ على الأبعاد الأصلية إذا كانت أصغر من الحد الأقصى
        if (width > maxWidth) {
          height = (maxWidth / width) * height
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        // استخدام تنعيم عالي الجودة للصور
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height)
        }

        // التحويل لصيغة webp لتقليل الحجم بشكل كبير مع الحفاظ على الجودة
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // تغيير الامتداد إلى .webp
              const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp"
              const compressedFile = new File([blob], newFileName, {
                type: 'image/webp',
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Canvas to Blob failed'))
            }
          },
          'image/webp',
          quality
        )
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}
