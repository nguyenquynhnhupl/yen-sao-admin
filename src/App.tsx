import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Activity, BookOpen, ChartNoAxesCombined, Image, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, Tags, X, House, Upload } from 'lucide-react'
import { isSupabaseConfigured, requireSupabase, supabase } from './lib/supabase'
import type { Article, Banner, Category, Order, Product } from './types'
import { Homepage } from './Homepage'

type Section = 'dashboard' | 'homepage' | 'products' | 'promotions' | 'categories' | 'banners' | 'articles' | 'orders'
const nav: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'homepage', label: 'Trang chủ', icon: House },
  { id: 'products', label: 'Sản phẩm', icon: Package },
  { id: 'promotions', label: 'Khuyến mãi', icon: Tags },
  { id: 'categories', label: 'Danh mục', icon: Tags },
  { id: 'banners', label: 'Banner', icon: Image },
  { id: 'articles', label: 'Bài viết', icon: BookOpen },
  { id: 'orders', label: 'Đơn hàng', icon: ShoppingCart },
]
const sectionTitles: Record<Section, string> = { dashboard: 'Tổng quan', homepage: 'Trang chủ', products: 'Sản phẩm', promotions: 'Khuyến mãi', categories: 'Danh mục', banners: 'Banner', articles: 'Bài viết', orders: 'Đơn hàng' }

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const client = requireSupabase()
      const { error: authError } = await client.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      const { data: userData } = await client.auth.getUser()
      const { data: admin } = await client.from('admin_users').select('user_id').eq('user_id', userData.user?.id).maybeSingle()
      if (!admin) { await client.auth.signOut(); throw new Error('Tài khoản chưa được cấp quyền Admin.') }
      onLogin()
    } catch (err) { setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.') }
    finally { setBusy(false) }
  }
  return <main className="login-wrap"><form className="login-card" onSubmit={submit}>
    <div className="brand-mark">YS</div><p className="eyebrow">YẾN SÀO • QUẢN TRỊ</p><h1>Chào mừng trở lại</h1><p className="muted">Đăng nhập để quản lý nội dung website.</p>
    {!isSupabaseConfigured && <div className="notice warning">Chưa cấu hình Supabase. Xem file README.md trước khi đăng nhập.</div>}
    <label>Email quản trị<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" /></label>
    <label>Mật khẩu<input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nhập mật khẩu" /></label>
    {error && <div className="notice error">{error}</div>}
    <button className="primary full" disabled={busy || !isSupabaseConfigured}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
    <p className="small muted center">Chỉ tài khoản đã được cấp quyền mới truy cập được CMS.</p>
  </form></main>
}

function App() {
  const [session, setSession] = useState<boolean>(false)
  const [ready, setReady] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if (!supabase) { setReady(true); return }
    supabase.auth.getSession().then(({ data }) => { setSession(Boolean(data.session)); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(Boolean(s)))
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => { setMobileNav(false) }, [location.pathname])
  async function logout() { if (supabase) await supabase.auth.signOut(); setSession(false); navigate('/login') }
  if (!ready) return <div className="loading">Đang tải CMS…</div>
  if (!session) return <Routes><Route path="*" element={<Login onLogin={() => { setSession(true); navigate('/') }} />} /></Routes>
  const current = (nav.find(n => n.id === location.pathname.split('/')[1])?.id ?? 'dashboard') as Section
  const isProductDetail = location.pathname.startsWith('/products/') && location.pathname !== '/products/new'
  const isProductCreate = location.pathname === '/products/new'
  const isProductEditor = isProductDetail || isProductCreate
  return <div className="app-shell">
    {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Đóng menu" />}
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><div className="brand-mark small-mark">YS</div><div><strong>YẾN SÀO</strong><span>ADMIN CMS</span></div><button className="icon-btn mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
      <p className="nav-caption">KHÔNG GIAN QUẢN TRỊ</p>
      <nav>{nav.map(item => { const Icon = item.icon; return <Link key={item.id} className={`nav-item ${current === item.id ? 'active' : ''}`} to={item.id === 'dashboard' ? '/' : `/${item.id}`}><Icon size={18}/><span>{item.label}</span></Link> })}</nav>
      <div className="sidebar-bottom"><div className="secure-note"><Activity size={16}/><span>Quản trị nội dung<br/><b>Kết nối Supabase</b></span></div><button className="nav-item logout" onClick={logout}><LogOut size={18}/>Đăng xuất</button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="icon-btn menu-toggle" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div className="topbar-breadcrumb"><span className="breadcrumb">Admin CMS / </span>{isProductEditor ? <><Link to="/products" className="topbar-breadcrumb-link">Sản phẩm</Link><span className="breadcrumb-separator">/</span><strong>{isProductCreate ? 'Thêm sản phẩm mới' : 'Chi tiết sản phẩm'}</strong></> : <strong>{sectionTitles[current]}</strong>}</div><div className="topbar-right"><span className="status-dot"/><span>Quản trị viên</span><div className="avatar">A</div></div></header>
      <div className="page-content"><Routes>
        <Route path="/" element={<Dashboard/>}/>
        <Route path="/homepage" element={<Homepage/>}/>
        <Route path="/products" element={<Products/>}/>
        <Route path="/products/new" element={<ProductEditor/>}/>
        <Route path="/products/:productId/edit" element={<ProductEditor/>}/>
        <Route path="/promotions" element={<Promotions/>}/>
        <Route path="/categories" element={<Categories/>}/>
        <Route path="/banners" element={<Banners/>}/>
        <Route path="/articles" element={<Articles/>}/>
        <Route path="/orders" element={<Orders/>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes></div>
    </main>
  </div>
}

function PageHeading({ action }: { title: string; description: string; action?: React.ReactNode }) {
  if (!action) return null
  return <div className="page-heading page-heading-actions-only">{action}</div>
}

function ImageUrlInput({ value, onChange, placeholder = 'https://…', compact = false }: { value: string; onChange: (value: string) => void; placeholder?: string; compact?: boolean }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  async function upload(file?: File) {
    if (!file) return
    setUploadError('')
    if (!file.type.startsWith('image/')) { setUploadError('Vui lòng chọn tệp hình ảnh.'); return }
    if (file.size > 5 * 1024 * 1024) { setUploadError('Ảnh tối đa 5 MB.'); return }
    setUploading(true)
    try {
      const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      const path = `content/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`
      const client = requireSupabase()
      const { error } = await client.storage.from('homepage-images').upload(path, file, { contentType: file.type, upsert: false })
      if (error) throw error
      const { data } = client.storage.from('homepage-images').getPublicUrl(path)
      onChange(data.publicUrl)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Tải ảnh thất bại. Kiểm tra cấu hình Supabase Storage.')
    } finally { setUploading(false) }
  }
  return <div className={compact ? 'image-url-input compact-image-url-input' : 'image-url-input'}>
    <input type="url" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    <label className="secondary image-upload-control"><Upload size={14}/>{uploading ? 'Đang tải…' : 'Tải ảnh lên'}<input type="file" accept="image/*" disabled={uploading} onChange={e => { void upload(e.target.files?.[0]); e.currentTarget.value = '' }} /></label>
    {value && !compact && <img className="image-url-preview" src={value} alt="Xem trước ảnh" onError={e => { e.currentTarget.style.display = 'none' }} />}
    {uploadError && <small className="image-upload-error">{uploadError}</small>}
  </div>
}
function useTable<T>(table: string) {
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  async function refresh() {
    setLoading(true); setError('')
    try { const { data, error: e } = await requireSupabase().from(table).select('*').order('created_at', { ascending: false }); if (e) throw e; setRows((data ?? []) as T[]) }
    catch (e) { setError(e instanceof Error ? e.message : 'Không tải được dữ liệu.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void refresh() }, [table])
  return { rows, setRows, loading, error, refresh }
}
function Dashboard() {
  const p = useTable<Product>('products'), c = useTable<Category>('categories'), a = useTable<Article>('articles'), o = useTable<Order>('orders')
  const stats = [{ label: 'Sản phẩm', value: p.rows.length, icon: Package, note: `${p.rows.filter(x => x.is_published).length} đang hiển thị` }, { label: 'Danh mục', value: c.rows.length, icon: Tags, note: 'Danh mục sản phẩm' }, { label: 'Bài viết', value: a.rows.length, icon: BookOpen, note: `${a.rows.filter(x => x.is_published).length} đã xuất bản` }, { label: 'Đơn hàng', value: o.rows.length, icon: ShoppingCart, note: 'Tổng đơn hàng' }]
  return <><PageHeading title="Tổng quan" description="Theo dõi nhanh tình hình nội dung website yến sào."/><div className="welcome-banner"><div><span className="welcome-kicker">BẢNG ĐIỀU KHIỂN</span><h2>Chào mừng đến với Yến Sào CMS</h2><p>Quản lý nội dung website tập trung tại một nơi.</p></div><ChartNoAxesCombined size={76} strokeWidth={1.2}/></div>
    <div className="stats-grid">{stats.map(s => { const Icon = s.icon; return <div className="stat-card" key={s.label}><div className="stat-top"><span>{s.label}</span><div className="stat-icon"><Icon size={19}/></div></div><strong>{s.value}</strong><small>{s.note}</small></div> })}</div>
    <div className="content-card"><div className="card-heading"><div><h3>Bắt đầu quản lý</h3><p className="muted">Chọn khu vực cần cập nhật nội dung.</p></div></div><div className="quick-grid">{nav.slice(1).map(n => {const Icon=n.icon;return <Link to={`/${n.id}`} className="quick-link" key={n.id}><span className="quick-icon"><Icon size={19}/></span><span><b>{n.label}</b><small>Mở quản lý {n.label.toLowerCase()}</small></span><span className="arrow">↗</span></Link>})}</div></div>
    {(p.error || c.error || a.error || o.error) && <div className="notice warning">Một số dữ liệu chưa tải được. Hãy kiểm tra migration và quyền truy cập Supabase.</div>}
  </>
}
function slugify(s: string) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') }
function Products() {
  const navigate = useNavigate()
  const { rows, loading, error, refresh } = useTable<Product>('products')
  const { rows: categories } = useTable<Category>('categories')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [promotionFilter, setPromotionFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated')
  async function remove(item: Product) {
    if (!confirm(`Xóa sản phẩm "${item.name}"? Thao tác này không thể hoàn tác.`)) return
    const { error: e } = await requireSupabase().from('products').delete().eq('id', item.id)
    if (e) alert(e.message); else void refresh()
  }
  const now = Date.now()
  const isPromotionActive = (x: Product) => Boolean(x.promotion_type && x.promotion_value != null && (!x.promotion_start_at || new Date(x.promotion_start_at).getTime() <= now) && (!x.promotion_end_at || new Date(x.promotion_end_at).getTime() >= now))
  const filtered = rows.filter(x => {
    const q = search.trim().toLowerCase()
    const matchesSearch = !q || x.name.toLowerCase().includes(q) || (x.slug ?? '').toLowerCase().includes(q) || x.id.toLowerCase().includes(q)
    const matchesCategory = categoryFilter === 'all' || x.category_id === categoryFilter
    const matchesVisibility = visibilityFilter === 'all' || (visibilityFilter === 'visible' ? x.is_published : !x.is_published)
    const matchesPromotion = promotionFilter === 'all' || (promotionFilter === 'active' ? isPromotionActive(x) : promotionFilter === 'flash' ? Boolean(x.is_flash_deal) : !x.promotion_type && !x.is_flash_deal)
    return matchesSearch && matchesCategory && matchesVisibility && matchesPromotion
  }).sort((a, b) => sortBy === 'price-asc' ? Number(a.price) - Number(b.price) : sortBy === 'price-desc' ? Number(b.price) - Number(a.price) : sortBy === 'stock' ? Number(a.stock) - Number(b.stock) : sortBy === 'name' ? a.name.localeCompare(b.name, 'vi') : new Date((b as Product & { updated_at?: string }).updated_at ?? b.created_at ?? 0).getTime() - new Date((a as Product & { updated_at?: string }).updated_at ?? a.created_at ?? 0).getTime())
  const lowStock = rows.filter(x => Number(x.stock) > 0 && Number(x.stock) <= 5).length
  const outOfStock = rows.filter(x => Number(x.stock) <= 0).length
  const visibleCount = rows.filter(x => x.is_published).length
  function formatPrice(value: number | string) { return `${Number(value || 0).toLocaleString('vi-VN')}đ` }
  function promotionLabel(x: Product) {
    if (!x.promotion_type || x.promotion_value == null) return 'Chưa thiết lập'
    return x.promotion_type === 'percent' ? `Giảm ${x.promotion_value}%` : `Giảm ${formatPrice(x.promotion_value)}`
  }
  return <>
    <PageHeading title="Quản lý sản phẩm" description="Theo dõi sản phẩm, giá bán, tồn kho và trạng thái hiển thị trên website." action={<button className="primary" onClick={() => navigate('/products')} style={{display:'none'}}>Làm mới</button>}/>
    <div className="product-summary-grid">
      <div className="product-summary-card"><span>Tổng sản phẩm</span><strong>{rows.length}</strong><small>Tất cả sản phẩm trong hệ thống</small></div>
      <div className="product-summary-card"><span>Đang hiển thị</span><strong>{visibleCount}</strong><small>Được phép hiển thị trên website</small></div>
      <div className="product-summary-card"><span>Sắp hết hàng</span><strong>{lowStock}</strong><small>Còn từ 1–5 sản phẩm</small></div>
      <div className="product-summary-card"><span>Hết hàng</span><strong>{outOfStock}</strong><small>Cần kiểm tra tồn kho</small></div>
    </div>
    <div className="product-list-toolbar">
      <div className="product-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên, mã hoặc slug sản phẩm…"/>{search && <button className="text-btn" onClick={() => setSearch('')}>Xóa</button>}</div>
      <button className="primary" onClick={() => navigate('/products/new')}>＋ Thêm sản phẩm</button>
    </div>
    <div className="product-filter-row">
      <label>Danh mục<select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="all">Tất cả danh mục</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Hiển thị<select value={visibilityFilter} onChange={e => setVisibilityFilter(e.target.value)}><option value="all">Tất cả trạng thái</option><option value="visible">Đăng bán</option><option value="hidden">Nháp</option></select></label>
      <label>Khuyến mãi<select value={promotionFilter} onChange={e => setPromotionFilter(e.target.value)}><option value="all">Tất cả khuyến mãi</option><option value="active">Đang giảm giá</option><option value="flash">Flash Sale</option><option value="none">Không khuyến mãi</option></select></label>
      <label>Sắp xếp<select value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="updated">Mới cập nhật</option><option value="name">Tên A–Z</option><option value="price-asc">Giá tăng dần</option><option value="price-desc">Giá giảm dần</option><option value="stock">Tồn kho thấp</option></select></label>
      <span className="product-result-count">Hiển thị <b>{filtered.length}</b> / {rows.length} sản phẩm</span>
    </div>
    {error && <div className="notice error">{error}</div>}
    <div className="content-card table-card product-list-card"><div className="table-scroll"><table><thead><tr><th>SẢN PHẨM</th><th>GIÁ BÁN</th><th>KHUYẾN MÃI</th><th>TỒN KHO</th><th>HIỂN THỊ WEBSITE</th><th className="align-right">THAO TÁC</th></tr></thead><tbody>
      {loading ? <tr><td colSpan={6} className="empty">Đang tải danh sách sản phẩm…</td></tr> : filtered.length === 0 ? <tr><td colSpan={6} className="empty"><div className="product-empty-state"><Package size={28}/><b>{rows.length ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}</b><span>{rows.length ? 'Thử đổi từ khóa hoặc điều kiện lọc.' : 'Thêm sản phẩm đầu tiên để bắt đầu quản lý cửa hàng.'}</span>{rows.length > 0 ? <button className="secondary" onClick={() => {setSearch('');setCategoryFilter('all');setVisibilityFilter('all');setPromotionFilter('all');setSortBy('updated')}}>Xóa bộ lọc</button> : <button className="primary" onClick={() => navigate('/products/new')}>＋ Thêm sản phẩm</button>}</div></td></tr> : filtered.map(x => <tr key={x.id}>
        <td><div className="product-cell">{x.image_url ? <img src={x.image_url} alt="" onError={e => {e.currentTarget.style.display='none'}}/> : <div className="image-placeholder"><Package size={18}/></div>}<div><b>{x.name}</b><small>{x.slug || 'Chưa có slug'}</small><small>{categories.find(c => c.id === x.category_id)?.name ?? 'Chưa phân loại'}</small></div></div></td>
        <td><b className="product-price">{formatPrice(x.price)}</b></td>
        <td><span className={isPromotionActive(x) ? 'promotion-status active' : 'promotion-status'}>{promotionLabel(x)}</span>{x.is_flash_deal && <small className="flash-label">⚡ Flash Sale</small>}</td>
        <td><span className={Number(x.stock) <= 0 ? 'stock-status stock-out' : Number(x.stock) <= 5 ? 'stock-status stock-low' : 'stock-status'}>{Number(x.stock) <= 0 ? 'Hết hàng' : `Còn ${x.stock}`}</span></td>
        <td><span className={x.is_published ? 'visibility-status visible' : 'visibility-status hidden'}><span/>{x.is_published ? 'Đăng bán' : 'Nháp'}</span></td>
        <td><div className="row-actions"><button className="text-btn" onClick={() => navigate('/products/' + x.id + '/edit')}>Chỉnh sửa</button><button className="text-btn danger-text" onClick={() => remove(x)}>Xóa</button></div></td>
      </tr>)}
    </tbody></table></div></div>
  </>
}


function ProductEditor() {
  const navigate = useNavigate()
  const { productId } = useParams()
  const isEdit = Boolean(productId)
  const { rows: categories } = useTable<Category>('categories')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name:'', slug:'', description:'', price:'', image_url:'', gallery_urls:'', category_id:'', stock:'0', is_published:false })
  const [detailBlocks, setDetailBlocks] = useState<{ id: string; type: 'text' | 'image'; content: string }[]>([])
  useEffect(() => {
    let active = true
    async function load() {
      if (!productId) return
      setLoading(true); setError('')
      try {
        const { data, error: e } = await requireSupabase().from('products').select('*').eq('id', productId).single()
        if (e) throw e
        if (active && data) setForm({ name:data.name ?? '', slug:data.slug ?? '', description:data.description ?? '', price:String(data.price ?? ''), image_url:data.image_url ?? '', gallery_urls:Array.isArray(data.gallery_urls) ? data.gallery_urls.join('\n') : '', category_id:data.category_id ?? '', stock:String(data.stock ?? 0), is_published:Boolean(data.is_published) })
        if (active && data) setDetailBlocks(Array.isArray(data.detail_content) ? data.detail_content.map((block: { type?: string; content?: string }, index: number) => ({ id: `${Date.now()}-${index}`, type: block.type === 'image' ? 'image' : 'text', content: block.content ?? '' })) : [])
      } catch (err) { if (active) setError(err instanceof Error ? err.message : 'Không tải được sản phẩm.') }
      finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [productId])
  async function save(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (!form.name.trim()) throw new Error('Vui lòng nhập tên sản phẩm.')
      if (form.price === '' || Number(form.price) < 0) throw new Error('Giá bán không hợp lệ.')
      if (Number(form.stock) < 0) throw new Error('Tồn kho không được âm.')
      const payload = { name:form.name.trim(), slug:form.slug.trim() || slugify(form.name), description:form.description.trim() || null, detail_content:detailBlocks.filter(block => block.content.trim()).map(({type,content}) => ({type,content:content.trim()})), price:Number(form.price), image_url:form.image_url.trim() || null, gallery_urls:form.gallery_urls.split('\n').map(url=>url.trim()).filter(Boolean), category_id:form.category_id || null, stock:Number(form.stock), is_published:form.is_published }
      const q = requireSupabase().from('products')
      const result = productId ? await q.update(payload).eq('id',productId) : await q.insert(payload)
      if (result.error) throw result.error
      navigate('/products')
    } catch (err) { setError(err instanceof Error ? err.message : 'Lưu sản phẩm thất bại.') }
    finally { setSaving(false) }
  }
  if (loading) return <div className="loading">Đang tải thông tin sản phẩm…</div>
  return <>
    {error && <div className="notice error">{error}</div>}
    <form className="product-editor-layout" onSubmit={save}>
      <div className="product-editor-main">
        <section className="content-card editor-section"><div className="editor-section-heading"><span className="editor-step">01</span><div><h3>Thông tin cơ bản</h3><p className="muted">Tên sản phẩm và nội dung giới thiệu.</p></div></div>
          <label>Tên sản phẩm *<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value,slug:form.slug || slugify(e.target.value)})} placeholder="Ví dụ: Yến tinh chế nguyên tổ"/></label>
          <label>Slug URL<input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="yen-tinh-che-nguyen-to"/><small className="muted">Dùng trong đường dẫn sản phẩm.</small></label>
          <label>Mô tả sản phẩm<textarea rows={1} ref={el => { if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px` } }} value={form.description} onChange={e => { setForm({...form,description:e.target.value}); e.currentTarget.style.height = "auto"; e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px` }} placeholder="Mô tả chất lượng, quy cách và cách sử dụng…" style={{overflow:"hidden",resize:"none"}}/></label>
          <div className="detail-content-builder">
            <div className="detail-content-builder-heading"><div><b>Mô tả sản phẩm chi tiết</b><small className="muted">Thêm từng mục văn bản hoặc ảnh tải lên từ máy.</small></div><div className="detail-content-add-actions"><button type="button" className="secondary" onClick={()=>setDetailBlocks(prev=>[...prev,{id:Date.now().toString()+Math.random(),type:'text',content:''}])}>＋ Thêm văn bản</button><button type="button" className="secondary" onClick={()=>setDetailBlocks(prev=>[...prev,{id:Date.now().toString()+Math.random(),type:'image',content:''}])}>＋ Thêm ảnh</button></div></div>
            {detailBlocks.length===0 && <p className="detail-content-empty muted">Chưa có mục chi tiết. Chọn “Thêm văn bản” hoặc “Thêm ảnh”.</p>}
            {detailBlocks.map((block,index)=><div className="detail-content-block" key={block.id}>
              <div className="detail-content-block-top"><b>Mục {index+1} · {block.type==='text'?'Văn bản':'Hình ảnh'}</b><div className="row-actions"><button type="button" className="text-btn" disabled={index===0} onClick={()=>setDetailBlocks(prev=>{const next=[...prev];[next[index-1],next[index]]=[next[index],next[index-1]];return next})}>↑</button><button type="button" className="text-btn" disabled={index===detailBlocks.length-1} onClick={()=>setDetailBlocks(prev=>{const next=[...prev];[next[index+1],next[index]]=[next[index],next[index+1]];return next})}>↓</button><button type="button" className="text-btn danger-text" onClick={()=>setDetailBlocks(prev=>prev.filter(item=>item.id!==block.id))}>Xóa</button></div></div>
              {block.type==='text' ? <textarea rows={1} className="auto-grow-textarea" value={block.content} ref={el=>{if(el){el.style.height="auto";el.style.height=`${el.scrollHeight}px`}}} onChange={e=>{setDetailBlocks(prev=>prev.map(item=>item.id===block.id?{...item,content:e.target.value}:item));e.currentTarget.style.height="auto";e.currentTarget.style.height=`${e.currentTarget.scrollHeight}px`}} placeholder="Nhập nội dung chi tiết…"/> : <ImageUrlInput value={block.content} onChange={value=>setDetailBlocks(prev=>prev.map(item=>item.id===block.id?{...item,content:value}:item))} placeholder="Chọn ảnh từ máy hoặc nhập URL ảnh"/>}
            </div>)}
          </div>
        </section>
        <section className="content-card editor-section"><div className="editor-section-heading"><span className="editor-step">02</span><div><h3>Hình ảnh sản phẩm</h3><p className="muted">Chọn ảnh chính và thêm nhiều ảnh phụ cho thư viện sản phẩm.</p></div></div><div className="product-image-manager"><div className="product-image-field"><span className="product-image-label">Ảnh chính <small>BẮT BUỘC</small></span><div className="main-image-picker">{form.image_url ? <img className="main-product-image-preview" src={form.image_url} alt="Ảnh chính sản phẩm" onError={e=>{e.currentTarget.style.display="none"}}/> : <div className="main-image-placeholder"><Image size={28}/><strong>Chưa có ảnh chính</strong><span>JPG, PNG hoặc WEBP · tối đa 5 MB</span></div>}<ImageUrlInput compact value={form.image_url} onChange={value=>setForm({...form,image_url:value})} placeholder="Chọn ảnh chính từ máy"/></div></div><div className="product-image-field"><div className="product-image-heading"><span className="product-image-label">Thư viện ảnh phụ</span><small>{form.gallery_urls.split("\n").filter(url=>url.trim()).length} ảnh</small></div><div className="gallery-upload-list">{form.gallery_urls.split("\n").map((url,i)=>url.trim() ? <div className="gallery-upload-item" key={`${i}-${url}`}><img src={url.trim()} alt={`Ảnh phụ ${i+1}`} onError={e=>{e.currentTarget.style.display="none"}}/><span>Ảnh {i+1}</span><button type="button" className="gallery-remove-btn" aria-label={`Xóa ảnh phụ ${i+1}`} onClick={()=>setForm({...form,gallery_urls:form.gallery_urls.split("\n").filter((_,index)=>index!==i).join("\n")})}><X size={14}/></button></div> : null)}<div className="gallery-add-tile"><ImageUrlInput compact value="" onChange={value=>{if(value) setForm({...form,gallery_urls:[...form.gallery_urls.split("\n").map(url=>url.trim()).filter(Boolean),value].join("\n")})}} placeholder="Thêm ảnh"/></div></div><small className="muted">Tải ảnh lên để thêm vào thư viện. Không cần nhập đường dẫn.</small></div></div></section>
      </div>
      <div className="product-editor-side">
        <section className="content-card editor-section"><div className="editor-section-heading"><span className="editor-step">03</span><div><h3>Giá và kho hàng</h3><p className="muted">Thông tin bán hàng.</p></div></div>
          <label>Giá bán (VNĐ) *<input required min="0" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="0"/></label>
          <label>Tồn kho<input required min="0" type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label>
          <label>Danh mục<select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Chưa chọn</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        </section>
        <section className="content-card editor-section"><div className="editor-section-heading"><span className="editor-step">04</span><div><h3>Trạng thái website</h3><p className="muted">Kiểm soát việc xuất bản.</p></div></div>
          <div className="publish-status-options"><label className={`publish-status-option ${!form.is_published ? 'selected' : ''}`}><input type="radio" name="publish-status" checked={!form.is_published} onChange={()=>setForm({...form,is_published:false})}/><span className="publish-status-copy"><span className="publish-status-title"><b>Nháp</b><em>Chưa xuất bản</em></span><small>Sản phẩm chỉ được lưu trong CMS, khách hàng chưa thể xem trên website.</small></span></label><label className={`publish-status-option ${form.is_published ? 'selected' : ''}`}><input type="radio" name="publish-status" checked={form.is_published} onChange={()=>setForm({...form,is_published:true})}/><span className="publish-status-copy"><span className="publish-status-title"><b>Đăng bán</b><em>Hiển thị công khai</em></span><small>Sản phẩm được hiển thị trên website để khách hàng xem và đặt mua.</small></span></label></div><div className="promotion-hint"><span className="promotion-hint-mark">i</span><p>Giảm giá và Flash Deal được cài đặt riêng trong mục <Link to="/promotions"><b>Khuyến mãi</b></Link>.</p></div>
        </section>
      </div>
      <div className="product-editor-footer"><button type="button" className="secondary" onClick={()=>navigate('/products')}>Hủy</button><button className="primary" disabled={saving}>{saving ? 'Đang lưu…' : form.is_published ? (isEdit ? 'Lưu và cập nhật website' : 'Tạo và đăng bán') : 'Lưu nháp'}</button></div>
    </form>
  </>
}

function Promotions() {
  const { rows, loading, error, refresh } = useTable<Product>('products')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Product | null>(null)
  const [enabled, setEnabled] = useState(true)
  const [type, setType] = useState<'percent' | 'amount'>('percent')
  const [value, setValue] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [flash, setFlash] = useState(false)
  const [flashStart, setFlashStart] = useState('')
  const [flashEnd, setFlashEnd] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  function localDate(value?: string | null) {
    if (!value) return ''
    const d = new Date(value)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }
  function openPromotion(p: Product) {
    setSelected(p)
    setEnabled(Boolean(p.promotion_type && p.promotion_value != null))
    setType(p.promotion_type ?? 'percent')
    setValue(p.promotion_value == null ? '' : String(p.promotion_value))
    setStart(localDate(p.promotion_start_at))
    setEnd(localDate(p.promotion_end_at))
    setFlash(Boolean(p.is_flash_deal))
    setFlashStart(localDate(p.flash_deal_start_at))
    setFlashEnd(localDate(p.flash_deal_end_at))
    setMessage('')
  }
  async function savePromotion(e: FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSaving(true); setMessage('')
    try {
      if (enabled && (!value || Number(value) <= 0 || !start || !end || new Date(end) <= new Date(start))) throw new Error('Nhập mức giảm và thời gian khuyến mãi hợp lệ.')
      if (enabled && type === 'percent' && Number(value) > 100) throw new Error('Phần trăm giảm không được vượt quá 100%.')
      if (flash && (!enabled || !flashStart || !flashEnd || new Date(flashEnd) <= new Date(flashStart))) throw new Error('Flash Deal cần có khuyến mãi và khung giờ hợp lệ.')
      const { error: updateError } = await requireSupabase().from('products').update({
        promotion_type: enabled ? type : null,
        promotion_value: enabled ? Number(value) : null,
        promotion_start_at: enabled ? new Date(start).toISOString() : null,
        promotion_end_at: enabled ? new Date(end).toISOString() : null,
        is_flash_deal: enabled && flash,
        flash_deal_start_at: enabled && flash ? new Date(flashStart).toISOString() : null,
        flash_deal_end_at: enabled && flash ? new Date(flashEnd).toISOString() : null
      }).eq('id', selected.id)
      if (updateError) throw updateError
      setSelected(null); await refresh()
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Không lưu được khuyến mãi.') }
    finally { setSaving(false) }
  }
  const filtered = rows.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const activeCount = rows.filter(p => p.promotion_type && p.promotion_value != null).length
  return <>
    <PageHeading title="Khuyến mãi" description="Tạo và quản lý ưu đãi theo từng sản phẩm, tách biệt với thông tin sản phẩm." action={<span className="pill pill-green">{activeCount} sản phẩm có khuyến mãi</span>} />
    <div className="toolbar"><div className="searchbox"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm sản phẩm để tạo khuyến mãi…"/></div><span className="muted small">{filtered.length} sản phẩm</span></div>
    {error && <div className="notice error">{error}</div>}
    <div className="content-card table-card"><div className="table-scroll"><table><thead><tr><th>SẢN PHẨM</th><th>GIÁ GỐC</th><th>MỨC GIẢM</th><th>THỜI GIAN ÁP DỤNG</th><th>VỊ TRÍ HIỂN THỊ</th><th className="align-right">THAO TÁC</th></tr></thead><tbody>
      {loading ? <tr><td colSpan={6} className="empty">Đang tải dữ liệu…</td></tr> : filtered.length === 0 ? <tr><td colSpan={6} className="empty">Chưa có sản phẩm.</td></tr> : filtered.map(p => <tr key={p.id}>
        <td><div className="product-cell">{p.image_url ? <img src={p.image_url} alt=""/> : <div className="image-placeholder"><Package size={18}/></div>}<div><b>{p.name}</b><small>{p.is_published ? 'Đăng bán' : 'Nháp'}</small></div></div></td>
        <td>{Number(p.price).toLocaleString('vi-VN')} đ</td>
        <td>{p.promotion_type && p.promotion_value != null ? <b>{p.promotion_type === 'percent' ? '-' + p.promotion_value + '%' : '-' + Number(p.promotion_value).toLocaleString('vi-VN') + ' đ'}</b> : <span className="muted">Chưa thiết lập</span>}</td>
        <td>{p.promotion_start_at && p.promotion_end_at ? <><small>{new Date(p.promotion_start_at).toLocaleString('vi-VN')}</small><small>đến {new Date(p.promotion_end_at).toLocaleString('vi-VN')}</small></> : '—'}</td>
        <td>{p.is_flash_deal ? <span className="pill pill-green">Flash Deal</span> : p.promotion_type ? <span className="pill pill-gray">Khuyến mãi thường</span> : '—'}</td>
        <td><div className="row-actions"><button className="text-btn" onClick={() => openPromotion(p)}>{p.promotion_type ? 'Chỉnh sửa' : '＋ Tạo khuyến mãi'}</button></div></td>
      </tr>)}
    </tbody></table></div></div>
    {selected && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><form className="modal" onSubmit={savePromotion}>
      <div className="modal-head"><div><p className="eyebrow">THIẾT LẬP ƯU ĐÃI</p><h2>{selected.name}</h2><p className="muted">Giá gốc: {Number(selected.price).toLocaleString('vi-VN')} đ</p></div><button type="button" className="icon-btn" onClick={()=>setSelected(null)}><X size={19}/></button></div>
      <div className="form-grid">
        <label className="check-label span-2"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Bật khuyến mãi cho sản phẩm này</label>
        {enabled && <>
          <label>Hình thức giảm giá<select value={type} onChange={e=>setType(e.target.value as 'percent'|'amount')}><option value="percent">Giảm theo phần trăm (%)</option><option value="amount">Giảm số tiền (VNĐ)</option></select></label>
          <label>{type === 'percent' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'}<input required min="1" max={type === 'percent' ? 100 : undefined} type="number" value={value} onChange={e=>setValue(e.target.value)}/></label>
          <label>Bắt đầu khuyến mãi<input required type="datetime-local" value={start} onChange={e=>setStart(e.target.value)}/></label>
          <label>Kết thúc khuyến mãi<input required type="datetime-local" min={start || undefined} value={end} onChange={e=>setEnd(e.target.value)}/></label>
          <label className="check-label span-2"><input type="checkbox" checked={flash} onChange={e=>setFlash(e.target.checked)}/> Đưa sản phẩm vào khu vực Flash Deal</label>
          {flash && <>
            <label>Flash Deal bắt đầu<input required type="datetime-local" value={flashStart} onChange={e=>setFlashStart(e.target.value)}/></label>
            <label>Flash Deal kết thúc<input required type="datetime-local" min={flashStart || undefined} value={flashEnd} onChange={e=>setFlashEnd(e.target.value)}/></label>
            <p className="muted small span-2">Flash Deal chỉ quyết định việc hiển thị trong khu vực Flash Deal và có thời gian riêng.</p>
          </>}
        </>}
      </div>
      {message && <div className="notice error">{message}</div>}
      <div className="modal-actions"><button type="button" className="secondary" onClick={()=>setSelected(null)}>Hủy</button><button className="primary" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu khuyến mãi'}</button></div>
    </form></div>}
  </>
}


function Categories() {
  const { rows, loading, error, refresh } = useTable<Category>('categories')
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const sortedRows = [...rows].sort(
    (a, b) =>
      (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) ||
      a.name.localeCompare(b.name, 'vi')
  )

  async function add(e: FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    setBusy(true)
    try {
      const nextOrder =
        rows.length > 0
          ? Math.max(...rows.map(c => Number(c.sort_order) || 0)) + 1
          : 1

      const { error: insertError } = await requireSupabase()
        .from('categories')
        .insert({
          name: trimmedName,
          slug: slugify(trimmedName),
          is_active: true,
          image_url: imageUrl.trim() || null,
          sort_order: nextOrder
        })

      if (insertError) throw insertError

      setName('')
      setImageUrl('')
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không lưu được danh mục.')
    } finally {
      setBusy(false)
    }
  }

  function startEdit(c: Category) {
    setEditingId(c.id)
    setEditName(c.name)
    setEditImageUrl(c.image_url ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditImageUrl('')
  }

  async function saveEdit(c: Category) {
    const trimmedName = editName.trim()

    if (!trimmedName) {
      alert('Vui lòng nhập tên danh mục.')
      return
    }

    setBusy(true)
    try {
      const { error: updateError } = await requireSupabase()
        .from('categories')
        .update({
          name: trimmedName,
          slug: slugify(trimmedName),
          image_url: editImageUrl.trim() || null
        })
        .eq('id', c.id)

      if (updateError) throw updateError

      cancelEdit()
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không cập nhật được danh mục.')
    } finally {
      setBusy(false)
    }
  }

  async function reorder(draggedId: string, targetId: string) {
    if (
      draggedId === targetId ||
      busy ||
      editingId !== null
    ) return

    const newRows = [...sortedRows]
    const fromIndex = newRows.findIndex(c => c.id === draggedId)
    const toIndex = newRows.findIndex(c => c.id === targetId)

    if (fromIndex < 0 || toIndex < 0) return

    const [moved] = newRows.splice(fromIndex, 1)
    newRows.splice(toIndex, 0, moved)

    setBusy(true)
    try {
      const supabase = requireSupabase()
      const results = await Promise.all(
        newRows.map((c, index) =>
          supabase
            .from('categories')
            .update({ sort_order: index + 1 })
            .eq('id', c.id)
        )
      )

      const failed = results.find(result => result.error)
      if (failed?.error) throw failed.error

      await refresh()
    } catch (err) {
      alert(
        err instanceof Error
          ? `Không lưu được thứ tự: ${err.message}`
          : 'Không lưu được thứ tự danh mục.'
      )
      await refresh()
    } finally {
      setBusy(false)
      setDraggingId(null)
    }
  }

  async function toggle(c: Category) {
    setBusy(true)
    try {
      const { error: updateError } = await requireSupabase()
        .from('categories')
        .update({ is_active: !c.is_active })
        .eq('id', c.id)

      if (updateError) throw updateError
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không cập nhật được trạng thái.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(c: Category) {
    if (!confirm(`Xóa danh mục "${c.name}"?`)) return

    setBusy(true)
    try {
      const { error: deleteError } = await requireSupabase()
        .from('categories')
        .delete()
        .eq('id', c.id)

      if (deleteError) throw deleteError
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không xóa được danh mục.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeading
        title="Danh mục"
        description="Kéo thả danh mục để thay đổi thứ tự hiển thị."
      />

      <form className="inline-create content-card" onSubmit={add}>
        <label>
          Tên danh mục mới
          <input
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ví dụ: Yến chưng sẵn"
          />
        </label>
        <label>
          Ảnh danh mục
          <ImageUrlInput value={imageUrl} onChange={setImageUrl} placeholder="Dán URL hoặc tải ảnh từ máy" />
        </label>

        <button className="primary" disabled={busy}>
          {busy ? 'Đang xử lý…' : '＋ Thêm danh mục'}
        </button>
      </form>

      {error && <div className="notice error">{error}</div>}

      <div className="content-card table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>THỨ TỰ</th>
                <th>TÊN DANH MỤC</th>
                <th>ẢNH</th>
                <th>SLUG</th>
                <th>TRẠNG THÁI</th>
                <th className="align-right">THAO TÁC</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="empty">Đang tải…</td>
                </tr>
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">Chưa có danh mục.</td>
                </tr>
              ) : (
                sortedRows.map((c, index) => (
                  <tr
                    key={c.id}
                    draggable={!busy && editingId === null}
                    onDragStart={e => {
                      if (busy || editingId !== null) {
                        e.preventDefault()
                        return
                      }

                      setDraggingId(c.id)
                      e.dataTransfer.effectAllowed = 'move'
                      e.dataTransfer.setData('text/plain', c.id)
                    }}
                    onDragOver={e => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={e => {
                      e.preventDefault()
                      const id = e.dataTransfer.getData('text/plain') || draggingId
                      if (id) void reorder(id, c.id)
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    style={{
                      cursor: busy || editingId !== null ? 'default' : 'grab',
                      opacity: draggingId === c.id ? 0.45 : 1
                    }}
                  >
                    <td>
                      <span title="Kéo dòng này để đổi thứ tự">
                        ⠿ {index + 1}
                      </span>
                    </td>

                    <td>
                      {editingId === c.id ? (
                        <input
                          required
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <b>{c.name}</b>
                      )}
                    </td>

                    <td>{editingId === c.id ? <ImageUrlInput compact value={editImageUrl} onChange={setEditImageUrl} placeholder="URL ảnh danh mục" /> : c.image_url ? <img src={c.image_url} alt={c.name} style={{width:48,height:40,objectFit:'cover',borderRadius:8}} /> : <span className="muted">Chưa có ảnh</span>}</td>
                    <td className="muted">{c.slug}</td>

                    <td>
                      <span
                        className={`pill ${
                          c.is_active ? 'pill-green' : 'pill-gray'
                        }`}
                      >
                        {c.is_active ? 'Đang hoạt động' : 'Đã ẩn'}
                      </span>
                    </td>

                    <td>
                      <div className="row-actions">
                        {editingId === c.id ? (
                          <>
                            <button
                              type="button"
                              className="text-btn"
                              disabled={busy}
                              onClick={() => saveEdit(c)}
                            >
                              {busy ? 'Đang lưu…' : 'Lưu'}
                            </button>
                            <button
                              type="button"
                              className="text-btn"
                              disabled={busy}
                              onClick={cancelEdit}
                            >
                              Hủy
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="text-btn"
                              disabled={busy}
                              onClick={() => startEdit(c)}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="text-btn"
                              disabled={busy}
                              onClick={() => toggle(c)}
                            >
                              {c.is_active ? 'Ẩn' : 'Hiện'}
                            </button>
                            <button
                              type="button"
                              className="text-btn danger-text"
                              disabled={busy}
                              onClick={() => remove(c)}
                            >
                              Xóa
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}






function Banners() {
  const {rows,loading,error,refresh}=useTable<Banner>('banners')
  const [title,setTitle]=useState(''),[image,setImage]=useState(''),[link,setLink]=useState(''),[position,setPosition]=useState('home_hero'),[busy,setBusy]=useState(false)
  async function add(e:FormEvent){e.preventDefault();setBusy(true);try{const {error:e}=await requireSupabase().from('banners').insert({title,image_url:image,link_url:link||null,position,is_active:true});if(e)throw e;setTitle('');setImage('');setLink('');await refresh()}catch(e){alert(e instanceof Error?e.message:'Không lưu được banner.')}finally{setBusy(false)}}
  async function toggle(b:Banner){const {error:e}=await requireSupabase().from('banners').update({is_active:!b.is_active}).eq('id',b.id);if(e)alert(e.message);else refresh()}
  async function remove(b:Banner){if(!confirm(`Xóa banner "${b.title}"?`))return;const {error:e}=await requireSupabase().from('banners').delete().eq('id',b.id);if(e)alert(e.message);else refresh()}
  return <><PageHeading title="Banner" description="Quản lý ảnh banner và vị trí hiển thị trên website."/><form className="content-card editor-card" onSubmit={add}><h3>Thêm banner</h3><div className="form-grid"><label>Tiêu đề *<input required value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Vị trí<select value={position} onChange={e=>setPosition(e.target.value)}><option value="home_hero">Trang chủ — Hero</option><option value="home_middle">Trang chủ — Giữa trang</option><option value="promotion">Khuyến mãi</option></select></label><label className="span-2">Ảnh banner *<ImageUrlInput value={image} onChange={setImage} placeholder="Dán URL hoặc tải ảnh từ máy" /></label><label className="span-2">Link khi bấm (không bắt buộc)<input type="url" value={link} onChange={e=>setLink(e.target.value)} placeholder="https://…"/></label></div><button className="primary" disabled={busy}>{busy?'Đang lưu…':'Lưu banner'}</button></form>{error&&<div className="notice error">{error}</div>}<div className="banner-grid">{loading?<p>Đang tải banner…</p>:rows.length===0?<div className="content-card empty">Chưa có banner.</div>:rows.map(b=><div className="content-card banner-card" key={b.id}><img src={b.image_url} alt={b.title}/><div className="banner-body"><div><b>{b.title}</b><small>{b.position}</small></div><span className={`pill ${b.is_active?'pill-green':'pill-gray'}`}>{b.is_active?'Đang bật':'Đang tắt'}</span><div className="row-actions"><button className="text-btn" onClick={()=>toggle(b)}>{b.is_active?'Tắt':'Bật'}</button><button className="text-btn danger-text" onClick={()=>remove(b)}>Xóa</button></div></div></div>)}</div></>
}
function Articles() {
  const {rows,loading,error,refresh}=useTable<Article>('articles')
  const [title,setTitle]=useState(''),[excerpt,setExcerpt]=useState(''),[content,setContent]=useState(''),[image,setImage]=useState(''),[busy,setBusy]=useState(false)
  async function add(e:FormEvent){e.preventDefault();setBusy(true);try{const {error:e}=await requireSupabase().from('articles').insert({title,slug:slugify(title),excerpt:excerpt||null,content:content||null,image_url:image||null,is_published:false});if(e)throw e;setTitle('');setExcerpt('');setContent('');setImage('');await refresh()}catch(e){alert(e instanceof Error?e.message:'Không lưu được bài viết.')}finally{setBusy(false)}}
  async function toggle(a:Article){const {error:e}=await requireSupabase().from('articles').update({is_published:!a.is_published}).eq('id',a.id);if(e)alert(e.message);else refresh()}
  async function remove(a:Article){if(!confirm(`Xóa bài viết "${a.title}"?`))return;const {error:e}=await requireSupabase().from('articles').delete().eq('id',a.id);if(e)alert(e.message);else refresh()}
  return <><PageHeading title="Bài viết" description="Soạn nội dung tin tức và xuất bản lên website."/><form className="content-card editor-card" onSubmit={add}><h3>Tạo bài viết mới</h3><div className="form-grid"><label className="span-2">Tiêu đề *<input required value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="span-2">Mô tả ngắn<input value={excerpt} onChange={e=>setExcerpt(e.target.value)}/></label><label className="span-2">Ảnh đại diện bài viết<ImageUrlInput value={image} onChange={setImage} placeholder="Dán URL hoặc tải ảnh từ máy" /></label><label className="span-2">Nội dung<textarea rows={5} value={content} onChange={e=>setContent(e.target.value)} placeholder="Nhập nội dung bài viết…"/></label></div><button className="primary" disabled={busy}>{busy?'Đang lưu…':'Lưu bản nháp'}</button></form>{error&&<div className="notice error">{error}</div>}<div className="content-card table-card"><div className="table-scroll"><table><thead><tr><th>BÀI VIẾT</th><th>NGÀY TẠO</th><th>TRẠNG THÁI</th><th className="align-right">THAO TÁC</th></tr></thead><tbody>{loading?<tr><td colSpan={4} className="empty">Đang tải…</td></tr>:rows.length===0?<tr><td colSpan={4} className="empty">Chưa có bài viết.</td></tr>:rows.map(a=><tr key={a.id}><td><div className="product-cell">{a.image_url?<img src={a.image_url} alt=""/>:<div className="image-placeholder"><BookOpen size={18}/></div>}<div><b>{a.title}</b><small>{a.slug}</small></div></div></td><td>{a.created_at?new Date(a.created_at).toLocaleDateString('vi-VN'):'—'}</td><td><span className={`pill ${a.is_published?'pill-green':'pill-gray'}`}>{a.is_published?'Đã xuất bản':'Bản nháp'}</span></td><td><div className="row-actions"><button className="text-btn" onClick={()=>toggle(a)}>{a.is_published?'Ẩn bài':'Xuất bản'}</button><button className="text-btn danger-text" onClick={()=>remove(a)}>Xóa</button></div></td></tr>)}</tbody></table></div></div></>
}
function Orders() {
  const {rows,loading,error,refresh}=useTable<Order>('orders')
  const statusNames:Record<string,string>={pending:'Chờ xác nhận',confirmed:'Đã xác nhận',shipping:'Đang giao',completed:'Hoàn tất',cancelled:'Đã hủy'}
  async function update(o:Order,status:string){const {error:e}=await requireSupabase().from('orders').update({status}).eq('id',o.id);if(e)alert(e.message);else refresh()}
  return <><PageHeading title="Đơn hàng" description="Theo dõi đơn hàng từ website khách hàng."/><div className="toolbar"><span className="muted small">{rows.length} đơn hàng</span><button className="secondary" onClick={()=>void refresh()}>↻ Làm mới</button></div>{error&&<div className="notice error">{error}</div>}<div className="content-card table-card"><div className="table-scroll"><table><thead><tr><th>MÃ ĐƠN</th><th>KHÁCH HÀNG</th><th>TỔNG TIỀN</th><th>TRẠNG THÁI</th><th>NGÀY TẠO</th></tr></thead><tbody>{loading?<tr><td colSpan={5} className="empty">Đang tải…</td></tr>:rows.length===0?<tr><td colSpan={5} className="empty">Chưa có đơn hàng.</td></tr>:rows.map(o=><tr key={o.id}><td><b>#{o.id.slice(0,8).toUpperCase()}</b></td><td><b>{o.customer_name}</b><small>{o.customer_phone}</small></td><td>{Number(o.total).toLocaleString('vi-VN')} đ</td><td><select className="status-select" value={o.status} onChange={e=>update(o,e.target.value)}>{Object.entries(statusNames).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></td><td>{new Date(o.created_at).toLocaleString('vi-VN')}</td></tr>)}</tbody></table></div></div></>
}
export default App
