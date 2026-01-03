import Image from "next/image";

// بيانات تجريبية لمحاكاة الأخبار
const FEATURED_POSTS = [
  {
    id: 1,
    title: "إنجاز تقني جديد: الذكاء الاصطناعي يغير مفهوم البرمجة في 2026",
    excerpt: "دراسات حديثة تؤكد أن المبرمجين الذين يستخدمون أدوات الذكاء الاصطناعي تضاعفت إنتاجيتهم...",
    image: "https://picsum.photos/800/500",
    category: "تقنية",
    date: "قبل ساعتين"
  },
  {
    id: 2,
    title: "انطلاق فعاليات مؤتمر الابتكار الرقمي في المنطقة",
    excerpt: "يشهد المؤتمر مشاركة واسعة من كبرى الشركات العالمية لمناقشة مستقبل الويب..",
    image: "https://picsum.photos/400/300",
    category: "اقتصاد",
    date: "قبل 5 ساعات"
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-right" dir="rtl">
      {/* Header - شريط التنقل */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-600">أخبارنا</h1>
          <nav className="hidden md:flex gap-6 font-medium">
            <a href="#" className="hover:text-red-600">الرئيسية</a>
            <a href="#" className="hover:text-red-600">سياسة</a>
            <a href="#" className="hover:text-red-600">تقنية</a>
            <a href="#" className="hover:text-red-600">رياضة</a>
          </nav>
        </div>
      </header>

      {/* Hero Section - الخبر الرئيسي */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* الخبر الكبير */}
          <div className="lg:col-span-2 relative group cursor-pointer overflow-hidden rounded-xl bg-white shadow-md">
            <Image 
              src={FEATURED_POSTS[0].image} 
              alt="Main News" 
              width={800}
              height={400}
              className="w-full h-[400px] object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black to-transparent p-6">
              <span className="bg-red-600 text-white px-3 py-1 rounded text-sm mb-2 inline-block">
                {FEATURED_POSTS[0].category}
              </span>
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight">
                {FEATURED_POSTS[0].title}
              </h2>
              <p className="text-gray-200 line-clamp-2">{FEATURED_POSTS[0].excerpt}</p>
            </div>
          </div>

          {/* الأخبار الجانبية */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold border-r-4 border-red-600 pr-3">الأكثر قراءة</h3>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded-md overflow-hidden relative">
                  <Image 
                    src={`https://picsum.photos/200/200?random=${i}`} 
                    alt={`Side news ${i}`}
                    fill
                    className="object-cover" 
                  />
                </div>
                <div className="flex flex-col justify-between">
                  <h4 className="font-bold text-sm hover:text-red-600 cursor-pointer line-clamp-2">
                    عنوان خبر جانبي سريع لملء المساحة وتجربة التصميم {i}
                  </h4>
                  <span className="text-xs text-gray-400">منذ {i} ساعات</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Grid News - شبكة الأخبار الأسفل */}
      <section className="container mx-auto px-4 py-8">
        <h3 className="text-2xl font-bold mb-6 border-b-2 border-gray-200 pb-2">آخر الأخبار</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100">
              <div className="h-48 bg-gray-200 relative">
                <Image 
                  src={`https://picsum.photos/400/300?random=${item + 10}`} 
                  alt={`News item ${item}`}
                  fill
                  className="object-cover" 
                />
              </div>
              <div className="p-4">
                <span className="text-red-600 text-xs font-bold mb-2 block">منوعات</span>
                <h4 className="font-bold mb-2 line-clamp-2">العنوان الإخباري هنا يظهر بهذا الشكل الجذاب والمنسق</h4>
                <p className="text-sm text-gray-500 line-clamp-3">تفاصيل الخبر القصيرة تظهر هنا لتجذب القارئ للمتابعة وقراءة المزيد من التفاصيل...</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}