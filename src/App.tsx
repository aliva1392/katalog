import React, { useEffect, useState } from 'react';
import { ChevronRight, Home, Globe, Package, Loader2, Settings, Plus, Trash2, X, QrCode, Lock, Unlock, LogOut, Key, ZoomIn } from 'lucide-react';
import { Category, Design, Variant, Language } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

// Static UI Translations
const dict = {
  title: { fa: 'منوی دیجیتال', ar: 'القائمة الرقمية', en: 'Digital Menu', tr: 'Dijital Menü' },
  adminPanelTitle: { fa: 'پنل مدیریت', ar: 'لوحة الإدارة', en: 'Admin Panel', tr: 'Yönetici Paneli' },
  categories: { fa: 'دسته‌بندی‌ها', ar: 'الفئات', en: 'Categories', tr: 'Kategoriler' },
  designs: { fa: 'طرح‌ها', ar: 'التصاميم', en: 'Designs', tr: 'Tasarımlar' },
  dimensions: { fa: 'ابعاد و موجودی', ar: 'الأبعاد والمخزون', en: 'Dimensions & Stock', tr: 'Boyutlar ve Stok' },
  stock: { fa: 'موجودی', ar: 'المخزون', en: 'Stock', tr: 'Stok' },
  piece: { fa: 'عدد', ar: 'قطعة', en: 'pcs', tr: 'adet' },
  addCategory: { fa: 'افزودن دسته‌بندی', ar: 'إضافة فئة', en: 'Add Category', tr: 'Kategori Ekle' },
  addDesign: { fa: 'افزودن طرح به این بخش', ar: 'إضافة تصميم', en: 'Add Design Here', tr: 'Buraya Tasarım Ekle' },
  addVariant: { fa: 'افزودن ابعاد جدید', ar: 'إضافة أبعاد جديدة', en: 'Add New Dimensions', tr: 'Yeni Boyut Ekle' },
  notFound: { fa: 'موردی یافت نشد.', ar: 'لا يوجد عناصر.', en: 'Nothing found.', tr: 'Bulunamadı.' },
  designsNotFound: { fa: 'طرحی یافت نشد.', ar: 'لا يوجد تصاميم.', en: 'No designs found.', tr: 'Tasarım bulunamadı.' },
  stockNotFound: { fa: 'موجودی یافت نشد.', ar: 'لا يوجد مخزون.', en: 'No stock found.', tr: 'Stok bulunamadı.' },
  deleteConfirm: { fa: 'آیا از حذف مطمئن هستید؟', ar: 'هل أنت متأكد من الحذف؟', en: 'Are you sure to delete?', tr: 'Silmek istediğinize emin misiniz?' },
  save: { fa: 'ذخیره', ar: 'حفظ', en: 'Save', tr: 'Kaydet' },
  nameFa: { fa: 'نام دسته‌بندی (به فارسی بنویسید، خودکار ترجمه می‌شود)', ar: 'الاسم', en: 'Name', tr: 'Adı' },
  sku: { fa: 'کد محصول (SKU)', ar: 'رمز المنتج (SKU)', en: 'Product Code (SKU)', tr: 'Ürün Kodu (SKU)' },
  image: { fa: 'تصویر طرح', ar: 'صورة التصميم', en: 'Design Image', tr: 'Tasarım Görseli' },
  sizeEx: { fa: 'ابعاد (مثال 100x200 cm)', ar: 'الأبعاد', en: 'Dimensions (ex 100x200)', tr: 'Boyutlar' },
  stockCount: { fa: 'تعداد موجودی', ar: 'كمية المخزون', en: 'Stock Count', tr: 'Stok Miktarı' },
  addItem: { fa: 'افزودن آیتم جدید', ar: 'إضافة عنصر جديد', en: 'Add New Item', tr: 'Yeni Öğe Ekle' },
  qrTitle: { fa: 'کد QR منوی مشتریان', ar: 'رمز الاستجابة السريعة للعملاء', en: 'Customer QR Code', tr: 'Müşteri QR Kodu' },
  qrDesc: { fa: 'این کد را برای مشتریان قرار دهید تا با اسکن آن منو را مشاهده کنند.', ar: 'امسح هذا الرمز للعملاء لعرض القائمة.', en: 'Show this QR code to customers to view the menu.', tr: 'Müşterilerinizin menüyü görmesi için bu QR kodunu okutmasını sağlayın.' },
  adminLogin: { fa: 'ورود به پنل مدیریت', ar: 'تسجيل دخول الإدارة', en: 'Admin Login', tr: 'Yönetici Girişi' },
  password: { fa: 'رمز عبور', ar: 'كلمة المرور', en: 'Password', tr: 'Şifre' },
  login: { fa: 'ورود', ar: 'دخول', en: 'Login', tr: 'Giriş' },
  wrongPassword: { fa: 'رمز عبور اشتباه است.', ar: 'كلمة المرور خاطئة.', en: 'Incorrect password.', tr: 'Yanlış şifre.' },
  logoutConfirm: { fa: 'آیا می‌خواهید از پنل مدیریت خارج شوید؟', ar: 'هل تريد تسجيل الخروج؟', en: 'Are you sure you want to logout?', tr: 'Çıkış yapmak istediğinize emin misiniz?' }
};

function MenuCore({ isAdminAccess }: { isAdminAccess: boolean }) {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [lang, setLang] = useState<Language>('fa');
  const [breadcrumb, setBreadcrumb] = useState<Category[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);

  const [editMode, setEditMode] = useState(isAdminAccess);
  const [showQrModal, setShowQrModal] = useState(false);
  const [modalState, setModalState] = useState<{ isOpen: boolean, type: 'category' | 'design' | 'variant' | 'password' | null }>({ isOpen: false, type: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, type: 'category'|'design'|'variant'|null, id: number|null }>({ isOpen: false, type: null, id: null });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Admin Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(!isAdminAccess);
  const [adminPass, setAdminPass] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [authError, setAuthError] = useState(false);

  const [catNameFa, setCatNameFa] = useState('');
  const [designSku, setDesignSku] = useState('');
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [variantSize, setVariantSize] = useState('');
  const [variantStock, setVariantStock] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const closeModal = () => {
    setModalState({ isOpen: false, type: null });
    setCatNameFa('');
    setDesignSku('');
    setDesignFile(null);
    setVariantSize('');
    setVariantStock('');
    setNewPassword('');
  };

  const loadData = () => {
    fetch(`/api/menu?t=${Date.now()}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
        setIsMutating(false);
      });
  };

  useEffect(() => {
    loadData();
    if (isAdminAccess) {
      const savedToken = localStorage.getItem('admin_token');
      if (savedToken) {
        setAdminToken(savedToken);
        // Verify token with server
        fetch('/api/verify-token', {
          headers: { 'authorization': `Bearer ${savedToken}` }
        })
        .then(res => {
          if (res.ok) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('admin_token');
            setAdminToken('');
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
          localStorage.removeItem('admin_token');
          setAdminToken('');
          setIsAuthenticated(false);
        });
      }
    }
  }, [isAdminAccess]);

  useEffect(() => {
    if (data.length > 0) {
      setBreadcrumb(prev => {
        if (prev.length === 0) return [];
        const synced = [];
        let currentLevel = data;
        for (const crumb of prev) {
          const match = currentLevel.find(c => c.id === crumb.id);
          if (match) {
            synced.push(match);
            currentLevel = match.children || [];
          } else {
            break;
          }
        }
        return synced;
      });
      
      if (selectedDesign) {
        let foundDesign: Design | null = null;
        const findDesign = (categories: Category[]) => {
          for (const c of categories) {
            const match = c.designs.find(d => d.id === selectedDesign.id);
            if (match) foundDesign = match;
            if (c.children.length) findDesign(c.children);
          }
        };
        findDesign(data);
        if (foundDesign) setSelectedDesign(foundDesign);
        else setSelectedDesign(null);
      }
    }
  }, [data, selectedDesign]);

  const handleSelectCategory = (category: Category) => {
    const level = category.layer_level;
    setBreadcrumb((prev) => {
      const newBreadcrumb = prev.filter((c) => c.layer_level < level);
      return [...newBreadcrumb, category];
    });
    setSelectedDesign(null);
  };

  const handleSelectDesign = (design: Design) => {
    setSelectedDesign(design);
  };

  const navigateToLevel = (index: number) => {
    setBreadcrumb((prev) => prev.slice(0, index + 1));
    setSelectedDesign(null);
  };

  const resetFlow = () => {
    setBreadcrumb([]);
    setSelectedDesign(null);
  };

  const currentLevelCategories = breadcrumb.length === 0 
    ? data 
    : breadcrumb[breadcrumb.length - 1].children;
    
  const currentCategory = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1] : null;
  const currentLevelDesigns = currentCategory ? currentCategory.designs : [];

  const getTranslatedName = (cat: Category) => {
    if (lang === 'fa') return cat.name_fa;
    if (lang === 'ar') return cat.name_ar;
    if (lang === 'en') return cat.name_en;
    if (lang === 'tr') return cat.name_tr;
    return cat.name_fa;
  };

  const handleLogin = async () => {
    setIsMutating(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPass })
      });
      const result = await res.json();
      setIsMutating(false);
      if (result.success) {
        setIsAuthenticated(true);
        setAuthError(false);
        setAdminToken(result.token);
        localStorage.setItem('admin_token', result.token);
      } else {
        setAuthError(true);
      }
    } catch (e) {
      setIsMutating(false);
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };
      img.onerror = () => resolve(file);
    });
  };

  const handleAddItem = async () => {
    if (modalState.type === 'password' && (!newPassword || newPassword.length < 4)) {
      alert('رمز عبور جدید باید حداقل 4 کاراکتر باشد.');
      return;
    }
    if (modalState.type === 'variant') {
      if (!variantSize || variantSize.trim() === '') {
        alert('ابعاد نمی‌تواند خالی باشد.');
        return;
      }
      const stock = Number(variantStock);
      if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
        alert('موجودی نامعتبر است. لطفاً یک عدد صحیح بزرگتر یا مساوی صفر وارد کنید.');
        return;
      }
    }
    
    if (modalState.type === 'design') {
      if (!designSku || designSku.trim() === '') {
        alert('کد محصول (SKU) نمی‌تواند خالی باشد.');
        return;
      }
    }
    
    setIsMutating(true);
    let res;
    
    try {
      if (modalState.type === 'category') {
        const parent_id = currentCategory ? currentCategory.id : null;
        const layer_level = currentCategory ? currentCategory.layer_level + 1 : 1;
        res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'authorization': `Bearer ${adminToken}` },
          body: JSON.stringify({ parent_id, layer_level, name_fa: catNameFa })
        });
        if (res.ok) setCatNameFa('');
      } else if (modalState.type === 'design') {
        if (!currentCategory) { setIsMutating(false); return; }
        const formData = new FormData();
        formData.append('category_id', currentCategory.id.toString());
        formData.append('sku_code', designSku);
        if (designFile) {
          const compressed = await compressImage(designFile);
          formData.append('image', compressed);
        }
        
        res = await fetch('/api/designs', { 
          method: 'POST', 
          headers: { 'authorization': `Bearer ${adminToken}` },
          body: formData 
        });
        if (res.ok) { setDesignSku(''); setDesignFile(null); }
      } else if (modalState.type === 'variant') {
        if (!selectedDesign) { setIsMutating(false); return; }
        res = await fetch('/api/variants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'authorization': `Bearer ${adminToken}` },
          body: JSON.stringify({ design_id: selectedDesign.id, size_dimensions: variantSize, stock_count: Number(variantStock) })
        });
        if (res.ok) { setVariantSize(''); setVariantStock(''); }
      } else if (modalState.type === 'password') {
        res = await fetch('/api/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'authorization': `Bearer ${adminToken}` },
          body: JSON.stringify({ newPassword })
        });
        if (res.ok) {
          setNewPassword('');
          alert('رمز عبور با موفقیت تغییر کرد.');
        }
      }
      
      if (res) {
        if (res.status === 401) {
          alert('نشست شما منقضی شده است یا رمز عبور تغییر کرده است. لطفاً دوباره وارد شوید.');
          setIsAuthenticated(false);
          setAdminToken('');
          localStorage.removeItem('admin_token');
          setIsMutating(false);
          closeModal();
          return;
        }
        
        const contentType = res.headers.get("content-type");
        if (res.status === 413) {
          alert('حجم عکس انتخاب شده بسیار زیاد است. لطفاً عکس کم‌حجم‌تری انتخاب کنید.');
          setIsMutating(false);
          return;
        }
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await res.json();
          if (!data.success) {
            alert(data.error || 'خطایی رخ داد.');
            setIsMutating(false);
            return; // Don't close modal if failed
          }
        } else if (!res.ok) {
          alert('خطای سرور: ' + res.status);
          setIsMutating(false);
          return;
        }
      }

      closeModal();
      loadData();
    } catch (err: any) {
      console.error("Error in handleAddItem:", err);
      alert('خطایی در ارتباط با سرور رخ داد.');
      setIsMutating(false);
    }
  };

  const confirmDelete = (type: 'category'|'design'|'variant', id: number) => {
    setDeleteConfirm({ isOpen: true, type, id });
  };

  const executeDelete = async () => {
    const { type, id } = deleteConfirm;
    if (!type || id === null) return;
    
    setIsMutating(true);
    setDeleteConfirm({ isOpen: false, type: null, id: null });
    
    try {
      const res = await fetch(`/api/${type === 'category' ? 'categories' : type === 'design' ? 'designs' : 'variants'}/${id}`, { 
        method: 'DELETE',
        headers: { 'authorization': `Bearer ${adminToken}` }
      });
      if (res.status === 401) {
        alert('نشست شما منقضی شده است یا رمز عبور تغییر کرده است. لطفاً دوباره وارد شوید.');
        setIsAuthenticated(false);
        setAdminToken('');
        localStorage.removeItem('admin_token');
        setIsMutating(false);
        return;
      }
      loadData();
    } catch(e) {
      setIsMutating(false);
    }
  };

  const changeLang = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLang(e.target.value as Language);
  };

  if (loading && data.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isRtl = lang === 'ar' || lang === 'fa';
  const qrUrl = window.location.origin; // Points to the customer view (root path)

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen bg-gray-50 flex flex-col font-sans ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl"
          >
            <div className="flex items-center gap-3 text-blue-600 mb-6 justify-center">
              <Lock className="w-8 h-8" />
              <h3 className="text-2xl font-bold text-gray-900">
                {dict.adminLogin[lang]}
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{dict.password[lang]}</label>
                <input 
                  type="password" 
                  value={adminPass} 
                  onChange={e => setAdminPass(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none text-left bg-gray-50 ${authError ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'}`} 
                  dir="ltr"
                  placeholder="••••••••" 
                />
                {authError && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{dict.wrongPassword[lang]}</p>
                )}
              </div>
              <button 
                onClick={handleLogin}
                disabled={isMutating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl mt-6 transition-colors shadow-md shadow-blue-200 flex items-center justify-center gap-2"
              >
                {isMutating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Unlock className="w-5 h-5" />}
                {dict.login[lang]}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col font-sans ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Mutating Overlay */}
      {isMutating && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-[1px] z-[200] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 drop-shadow-md" />
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            {isAdminAccess ? dict.adminPanelTitle[lang] : dict.title[lang]}
          </h1>
          <div className="flex items-center gap-2">
            {isAdminAccess && (
              <>
                <button
                  onClick={() => setShowQrModal(true)}
                  className="p-2 rounded-full transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100"
                  title="Show QR Code"
                >
                  <QrCode className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setModalState({ isOpen: true, type: 'password' })}
                  className="p-2 rounded-full transition-colors bg-purple-50 text-purple-600 hover:bg-purple-100"
                  title="تغییر رمز عبور"
                >
                  <Key className="w-5 h-5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full transition-colors bg-red-50 text-red-600 hover:bg-red-100"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
            <div className="relative flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
              <Globe className="w-4 h-4 text-gray-500" />
              <select 
                value={lang} 
                onChange={changeLang} 
                className="bg-transparent text-sm font-medium outline-none cursor-pointer appearance-none pl-1 pr-4"
              >
                <option value="fa">فارسی</option>
                <option value="ar">العربية</option>
                <option value="en">English</option>
                <option value="tr">Türkçe</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 pb-24 relative">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center flex-wrap gap-2 text-sm text-gray-600 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
          <button onClick={resetFlow} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
            <Home className="w-4 h-4" />
          </button>
          {breadcrumb.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight className={`w-4 h-4 text-gray-400 ${isRtl ? 'rotate-180' : ''}`} />
              <button
                onClick={() => navigateToLevel(idx)}
                className={`font-medium hover:text-blue-600 transition-colors ${idx === breadcrumb.length - 1 && !selectedDesign ? 'text-blue-600' : ''}`}
              >
                {getTranslatedName(crumb)}
              </button>
            </React.Fragment>
          ))}
          {selectedDesign && (
            <React.Fragment>
              <ChevronRight className={`w-4 h-4 text-gray-400 ${isRtl ? 'rotate-180' : ''}`} />
              <span className="font-medium text-blue-600 truncate max-w-[100px]" dir="ltr">
                {selectedDesign.sku_code}
              </span>
            </React.Fragment>
          )}
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDesign ? 'variants' : breadcrumb.length}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {!selectedDesign && (
              <div className="space-y-8">
                {/* Categories Section */}
                {(currentLevelCategories.length > 0 || editMode) && (
                  <div>
                    {currentLevelCategories.length > 0 && currentLevelDesigns.length > 0 && (
                      <h3 className="text-sm font-bold text-gray-500 mb-3 px-1">{dict.categories[lang]}</h3>
                    )}
                    <div className="grid grid-cols-1 gap-3">
                      {currentLevelCategories.map((cat) => (
                        <div key={cat.id} className="flex items-center gap-2 relative group">
                          <button
                            onClick={() => handleSelectCategory(cat)}
                            className="flex-1 flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-md transition-all"
                          >
                            <span className="text-lg font-semibold text-gray-800">
                              {getTranslatedName(cat)}
                            </span>
                            <ChevronRight className={`w-5 h-5 text-gray-400 ${isRtl ? 'rotate-180' : ''}`} />
                          </button>
                          {editMode && (
                            <button onClick={() => confirmDelete('category', cat.id)} className="p-4 text-red-500 hover:bg-red-50 rounded-xl border border-red-100 transition-all bg-white shadow-sm">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {editMode && (
                        <button 
                          onClick={() => setModalState({ isOpen: true, type: 'category' })}
                          className="flex items-center justify-center gap-2 p-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl text-blue-600 font-semibold hover:bg-blue-100 transition-colors mt-2"
                        >
                          <Plus className="w-5 h-5" />
                          {dict.addCategory[lang]}
                        </button>
                      )}
                      
                      {!editMode && currentLevelCategories.length === 0 && currentLevelDesigns.length === 0 && (
                        <div className="text-center p-8 text-gray-500 bg-white rounded-2xl border border-gray-100">
                          {dict.notFound[lang]}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Designs Gallery Section */}
                {(currentLevelDesigns.length > 0 || (editMode && currentCategory)) && (
                  <div>
                    {currentLevelCategories.length > 0 && currentLevelDesigns.length > 0 && (
                      <h3 className="text-sm font-bold text-gray-500 mb-3 px-1 mt-4">{dict.designs[lang]}</h3>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {currentLevelDesigns.map((design) => (
                        <div key={design.id} className="relative flex flex-col group">
                          <button
                            onClick={() => handleSelectDesign(design)}
                            className="flex-1 flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all text-right group"
                          >
                            <div className="relative aspect-square w-full bg-gray-100 overflow-hidden group/image">
                              <img
                                src={design.image_url}
                                alt={design.sku_code}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-500"
                              />
                              <div 
                                onClick={(e) => { e.stopPropagation(); setPreviewImage(design.image_url); }}
                                className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100 cursor-pointer"
                              >
                                <ZoomIn className="w-8 h-8 text-white drop-shadow-md" />
                              </div>
                            </div>
                            <div className="p-3">
                              <div className="text-xs text-gray-500 mb-1 font-mono">SKU</div>
                              <div className="font-bold text-gray-900 text-sm truncate" dir="ltr">{design.sku_code}</div>
                            </div>
                          </button>
                          {editMode && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); confirmDelete('design', design.id); }} 
                              className="absolute top-2 right-2 p-2 bg-white/90 text-red-500 hover:bg-red-500 hover:text-white rounded-xl shadow-sm transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {editMode && currentCategory && (
                        <button 
                          onClick={() => setModalState({ isOpen: true, type: 'design' })}
                          className="col-span-2 flex items-center justify-center gap-2 p-4 bg-purple-50 border-2 border-dashed border-purple-200 rounded-2xl text-purple-600 font-semibold hover:bg-purple-100 transition-colors mt-2"
                        >
                          <Plus className="w-5 h-5" />
                          {dict.addDesign[lang]}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Layer 6: Variants & Stock */}
            {selectedDesign && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                  <div className="aspect-[4/3] w-full bg-gray-100 relative group cursor-pointer" onClick={() => setPreviewImage(selectedDesign.image_url)}>
                    <img
                      src={selectedDesign.image_url}
                      alt={selectedDesign.sku_code}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ZoomIn className="w-10 h-10 text-white drop-shadow-md" />
                    </div>
                  </div>
                  <div className="p-5 flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2 font-mono" dir="ltr">{selectedDesign.sku_code}</h2>
                      <p className="text-gray-500 text-sm">
                        {breadcrumb.map(c => getTranslatedName(c)).join(' • ')}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">
                    {dict.dimensions[lang]}
                  </h3>
                  <div className="space-y-3">
                    {selectedDesign.variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Package className="w-5 h-5" />
                          </div>
                          <span className="font-semibold text-gray-900" dir="ltr">
                            {variant.size_dimensions}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-500 mb-0.5">
                              {dict.stock[lang]}
                            </span>
                            <span className={`font-bold ${variant.stock_count > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {variant.stock_count} {dict.piece[lang]}
                            </span>
                          </div>
                          {editMode && (
                            <button 
                              onClick={() => confirmDelete('variant', variant.id)} 
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {editMode && (
                      <button 
                        onClick={() => setModalState({ isOpen: true, type: 'variant' })}
                        className="w-full flex items-center justify-center gap-2 p-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl text-blue-600 font-semibold hover:bg-blue-100 transition-colors mt-2"
                      >
                        <Plus className="w-5 h-5" />
                        {dict.addVariant[lang]}
                      </button>
                    )}

                    {!editMode && selectedDesign.variants.length === 0 && (
                      <div className="text-center p-6 text-gray-500 bg-white rounded-2xl border border-gray-100">
                        {dict.stockNotFound[lang]}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* QR Code Modal for Admin */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl flex flex-col items-center text-center"
            >
              <div className="w-full flex justify-end mb-2">
                <button onClick={() => setShowQrModal(false)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {dict.qrTitle[lang]}
              </h3>
              <p className="text-sm text-gray-500 mb-8">
                {dict.qrDesc[lang]}
              </p>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 inline-block">
                <QRCodeSVG value={qrUrl} size={200} level="M" />
              </div>

              <div className="text-xs text-gray-400 bg-gray-50 w-full p-3 rounded-lg truncate select-all" dir="ltr">
                {qrUrl}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Items Modal */}
      <AnimatePresence>
        {modalState.isOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {dict.addItem[lang]}
                </h3>
                <button onClick={closeModal} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {modalState.type === 'category' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{dict.nameFa[lang]}</label>
                      <input type="text" value={catNameFa} onChange={e=>setCatNameFa(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" />
                    </div>
                  </>
                )}

                {modalState.type === 'design' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{dict.sku[lang]}</label>
                      <input type="text" value={designSku} onChange={e=>setDesignSku(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-left bg-gray-50" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{dict.image[lang]}</label>
                      <input type="file" accept="image/*" onChange={e=>setDesignFile(e.target.files?.[0] || null)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-left bg-gray-50 text-sm" dir="ltr" />
                    </div>
                  </>
                )}

                {modalState.type === 'variant' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{dict.sizeEx[lang]}</label>
                      <input type="text" value={variantSize} onChange={e=>setVariantSize(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-left bg-gray-50" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{dict.stockCount[lang]}</label>
                      <input type="number" min="0" value={variantStock} onChange={e=>setVariantStock(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-left bg-gray-50" dir="ltr" />
                    </div>
                  </>
                )}

                {modalState.type === 'password' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور جدید (حداقل 4 کاراکتر)</label>
                    <input type="text" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-left bg-gray-50" dir="ltr" placeholder="••••••••" />
                  </div>
                )}

                <button 
                  onClick={handleAddItem}
                  disabled={isMutating}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl mt-6 transition-colors shadow-md shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {isMutating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {dict.save[lang]}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {dict.deleteConfirm[lang]}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                این عملیات غیرقابل بازگشت است.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm({ isOpen: false, type: null, id: null })}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                >
                  انصراف
                </button>
                <button 
                  onClick={executeDelete}
                  disabled={isMutating}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-red-200 flex items-center justify-center gap-2"
                >
                  {isMutating ? <Loader2 className="w-5 h-5 animate-spin" /> : "حذف"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirm Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                <LogOut className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {dict.logoutConfirm[lang]}
              </h3>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                >
                  انصراف
                </button>
                <button 
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    setIsAuthenticated(false);
                    setAdminToken('');
                    localStorage.removeItem('admin_token');
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-red-200"
                >
                  خروج
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div 
            className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-4 backdrop-blur-md cursor-pointer"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-7xl max-h-[90vh] w-full flex items-center justify-center cursor-default"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setPreviewImage(null)}
                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm"
              >
                <X className="w-6 h-6" />
              </button>
              <img 
                src={previewImage} 
                alt="Preview" 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuCore isAdminAccess={false} />} />
        <Route path="/admin" element={<MenuCore isAdminAccess={true} />} />
      </Routes>
    </BrowserRouter>
  );
}
