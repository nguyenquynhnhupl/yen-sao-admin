import { useEffect, useState, useRef, type FormEvent } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Activity, BookOpen, ChartNoAxesCombined, Image, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, Tags, X, House, Upload, Bold, Italic, Underline, List, ListOrdered, Search, GripVertical, Eye, EyeOff, Pencil, Trash2, Plus, FolderOpen, Check } from 'lucide-react'
import { isSupabaseConfigured, requireSupabase, supabase } from './lib/supabase'
import type { Article, Banner, Category, Order, Product } from './types'
import { Homepage } from './Homepage'

const QUICK_INFO_LABELS = ['Nhóm', 'Loại', 'Khối lượng', 'Bộ sản phẩm', 'Đặc trưng', 'Mùi', 'Bảo quản'] as const

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
      <label>Hiển thị<select value={visibilityFilter} onChange={e => setVisibilityFilter(e.target.value)}><option value="all">Tất cả trạng thái</option><option value="visible">Đăng bán</option><option value="hidden">Nháp (ẩn)</option></select></label>
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


function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)
  useEffect(() => { if (editorRef.current && !initialized.current) { editorRef.current.innerHTML = value || ''; initialized.current = true } }, [value])
  function run(command: string, arg?: string) { editorRef.current?.focus(); document.execCommand(command, false, arg); if (editorRef.current) onChange(editorRef.current.innerHTML) }
  return <div style={{border:'1px solid #e5d9c9',borderRadius:10,overflow:'hidden',background:'#fff'}}>
    <div style={{display:'flex',flexWrap:'wrap',gap:6,padding:8,borderBottom:'1px solid #eee4d8',background:'#fbf7f0'}}>
      <button type="button" className="secondary" title="In đậm" onClick={()=>run('bold')}><Bold size={16}/></button>
      <button type="button" className="secondary" title="In nghiêng" onClick={()=>run('italic')}><Italic size={16}/></button>
      <button type="button" className="secondary" title="Gạch chân" onClick={()=>run('underline')}><Underline size={16}/></button>
      <button type="button" className="secondary" title="Danh sách" onClick={()=>run('insertUnorderedList')}><List size={16}/></button>
      <button type="button" className="secondary" title="Danh sách đánh số" onClick={()=>run('insertOrderedList')}><ListOrdered size={16}/></button>
      <button type="button" className="secondary" onClick={()=>run('formatBlock','h3')}>H3</button>
      <button type="button" className="secondary" onClick={()=>run('formatBlock','p')}>¶</button>
      <button type="button" className="secondary" onClick={()=>run('removeFormat')}>Tx</button>
    </div>
    <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={e=>onChange(e.currentTarget.innerHTML)} onBlur={e=>onChange(e.currentTarget.innerHTML)} style={{minHeight:160,padding:14,outline:'none',lineHeight:1.8,color:'#514638'}} />
    <div style={{padding:'7px 12px',borderTop:'1px solid #f0e8de',fontSize:12,color:'#8b7b65'}}>Có thể chèn emoji/icon trực tiếp như ✨ 🌿 ✓ •</div>
  </div>
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
  const [quickInfo, setQuickInfo] = useState<{ id: string; label: string; value: string }[]>([])
  const [quickInfoSources, setQuickInfoSources] = useState<{ id: string; name: string; quick_info: { label?: string; value?: string }[] }[]>([])
  const [quickInfoSourceId, setQuickInfoSourceId] = useState('')
  const [quickInfoOptions, setQuickInfoOptions] = useState<{id:string; label:string; value:string}[]>([])
  const [quickInfoOptionStatus, setQuickInfoOptionStatus] = useState('')
  useEffect(() => { let active = true; void requireSupabase().from('product_quick_info_options').select('id,label,value').order('label').then(({data,error}) => { if(active && !error) setQuickInfoOptions(data ?? []) }); return () => { active = false } }, [])
  useEffect(() => { let active = true; void requireSupabase().from('products').select('id,name,quick_info').order('name').then(({data,error}) => { if (active && !error) setQuickInfoSources((data ?? []).filter((p: any) => p.id !== productId && Array.isArray(p.quick_info) && p.quick_info.length).map((p: any) => ({id:p.id,name:p.name,quick_info:p.quick_info}))) }); return () => { active = false } }, [productId])
  useEffect(() => {
    let active = true
    async function load() {
      if (!productId) return
      setLoading(true); setError('')
      try {
        const { data, error: e } = await requireSupabase().from('products').select('*').eq('id', productId).single()
        if (e) throw e
        if (active && data) setForm({ name:data.name ?? '', slug:data.slug ?? '', description:data.description ?? '', price:String(data.price ?? ''), image_url:data.image_url ?? '', gallery_urls:Array.isArray(data.gallery_urls) ? data.gallery_urls.join('\n') : '', category_id:data.category_id ?? '', stock:String(data.stock ?? 0), is_published:Boolean(data.is_published) })
        if (active && data) { setDetailBlocks(Array.isArray(data.detail_content) ? data.detail_content.map((block: { type?: string; content?: string }, index: number) => ({ id: `${Date.now()}-${index}`, type: block.type === 'image' ? 'image' : 'text', content: block.content ?? '' })) : []); setQuickInfo(Array.isArray(data.quick_info) ? data.quick_info.map((item: { label?: string; value?: string }, index: number) => ({ id: `${Date.now()}-qi-${index}`, label: item.label ?? '', value: item.value ?? '' })) : []) }
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
      const payload = { name:form.name.trim(), slug:form.slug.trim() || slugify(form.name), description:form.description.trim() || null, detail_content:detailBlocks.filter(block => block.content.trim()).map(({type,content}) => ({type,content:content.trim()})), quick_info:quickInfo.filter(item => item.label.trim() || item.value.trim()).map(({label,value}) => ({label:label.trim(),value:value.trim()})), price:Number(form.price), image_url:form.image_url.trim() || null, gallery_urls:form.gallery_urls.split('\n').map(url=>url.trim()).filter(Boolean), category_id:form.category_id || null, stock:Number(form.stock), is_published:form.is_published }
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
          <label>Mô tả ngắn<textarea rows={1} ref={el => { if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px` } }} value={form.description} onChange={e => { setForm({...form,description:e.target.value}); e.currentTarget.style.height = "auto"; e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px` }} placeholder="Mô tả chất lượng, quy cách và cách sử dụng…" style={{overflow:"hidden",resize:"none"}}/></label>
          <div className="quick-info-builder">
            <div className="detail-content-builder-heading quick-info-heading"><div><b>Thông tin nhanh</b><small className="muted">Chọn tiêu đề và nhập nội dung cho sản phẩm.</small></div><button type="button" className="secondary" onClick={()=>setQuickInfo(prev=>[...prev,{id:Date.now().toString()+Math.random(),label:'',value:''}])}>＋ Thêm dòng</button></div>{quickInfoOptionStatus && <div className="quick-info-feedback" role="status"><span className="quick-info-feedback-dot"></span>{quickInfoOptionStatus}<button type="button" aria-label="Đóng thông báo" onClick={()=>setQuickInfoOptionStatus('')}>×</button></div>}
            {quickInfo.length===0 ? <p className="detail-content-empty muted">Chưa có thông tin nhanh. Nhấn “Thêm dòng” để bắt đầu.</p> : <div style={{overflowX:"auto",marginTop:8,border:"1px solid #eadfd2",borderRadius:10}}><table style={{width:"100%",borderCollapse:"collapse",background:"#fffdf9"}}><thead><tr style={{background:"#f7f0e8",textAlign:"left"}}><th style={{padding:"9px 12px",fontSize:12,color:"#705844",fontWeight:600}}>NHÓM / TIÊU ĐỀ</th><th style={{padding:"9px 12px",fontSize:12,color:"#705844",fontWeight:600}}>NỘI DUNG</th><th style={{padding:"9px 12px",fontSize:12,color:"#705844",fontWeight:600,width:110}}>SẮP XẾP</th></tr></thead><tbody>{quickInfo.map((item,index)=><tr key={item.id} style={{borderTop:"1px solid #eadfd2"}}><td style={{padding:"7px 10px",minWidth:160}}><select aria-label={"Nhóm tiêu đề dòng "+(index+1)} value={item.label} onChange={e=>setQuickInfo(prev=>prev.map(x=>x.id===item.id?{...x,label:e.target.value}:x))} style={{width:"100%",margin:0}}><option value="">Chọn tiêu đề</option>{QUICK_INFO_LABELS.map(label=><option key={label} value={label}>{label}</option>)}</select></td><td style={{padding:"7px 10px",minWidth:220}}><textarea aria-label={"Nội dung dòng "+(index+1)} rows={1} value={item.value} onChange={e=>setQuickInfo(prev=>prev.map(x=>x.id===item.id?{...x,value:e.target.value}:x))} placeholder={item.label?`Nhập nội dung cho ${item.label}…`:"Nhập nội dung…"} style={{width:"100%",margin:0,minHeight:36,resize:"vertical"}} /></td><td style={{padding:"7px 10px",whiteSpace:"nowrap"}}><div className="row-actions" style={{gap:4}}><button type="button" className="text-btn" disabled={index===0} title="Di chuyển lên" aria-label={"Di chuyển dòng "+(index+1)+" lên"} onClick={()=>setQuickInfo(prev=>{const next=[...prev];[next[index-1],next[index]]=[next[index],next[index-1]];return next})}>↑</button><button type="button" className="text-btn" disabled={index===quickInfo.length-1} title="Di chuyển xuống" aria-label={"Di chuyển dòng "+(index+1)+" xuống"} onClick={()=>setQuickInfo(prev=>{const next=[...prev];[next[index],next[index+1]]=[next[index+1],next[index]];return next})}>↓</button><button type="button" className="text-btn danger-text" onClick={()=>setQuickInfo(prev=>prev.filter(x=>x.id!==item.id))}>Xóa</button></div></td></tr>)}</tbody></table></div>}
          </div>
          <div className="detail-content-builder">
            <div className="detail-content-builder-heading"><div><b>Mô tả sản phẩm chi tiết</b><small className="muted">Thêm từng mục văn bản hoặc ảnh tải lên từ máy.</small></div><div className="detail-content-add-actions"><button type="button" className="secondary" onClick={()=>setDetailBlocks(prev=>[...prev,{id:Date.now().toString()+Math.random(),type:'text',content:''}])}>＋ Thêm văn bản</button><button type="button" className="secondary" onClick={()=>setDetailBlocks(prev=>[...prev,{id:Date.now().toString()+Math.random(),type:'image',content:''}])}>＋ Thêm ảnh</button></div></div>
            {detailBlocks.length===0 && <p className="detail-content-empty muted">Chưa có mục chi tiết. Chọn “Thêm văn bản” hoặc “Thêm ảnh”.</p>}
            {detailBlocks.map((block,index)=><div className="detail-content-block" key={block.id}>
              <div className="detail-content-block-top"><b>Mục {index+1} · {block.type==='text'?'Văn bản':'Hình ảnh'}</b><div className="row-actions"><button type="button" className="text-btn" disabled={index===0} onClick={()=>setDetailBlocks(prev=>{const next=[...prev];[next[index-1],next[index]]=[next[index],next[index-1]];return next})}>↑</button><button type="button" className="text-btn" disabled={index===detailBlocks.length-1} onClick={()=>setDetailBlocks(prev=>{const next=[...prev];[next[index+1],next[index]]=[next[index],next[index+1]];return next})}>↓</button><button type="button" className="text-btn danger-text" onClick={()=>setDetailBlocks(prev=>prev.filter(item=>item.id!==block.id))}>Xóa</button></div></div>
              {block.type==='text' ? <RichTextEditor value={block.content} onChange={value=>setDetailBlocks(prev=>prev.map(item=>item.id===block.id?{...item,content:value}:item))}/> : <ImageUrlInput value={block.content} onChange={value=>setDetailBlocks(prev=>prev.map(item=>item.id===block.id?{...item,content:value}:item))} placeholder="Chọn ảnh từ máy hoặc nhập URL ảnh"/>}
            </div>)}
          </div>
        </section>
        <section className="content-card editor-section"><div className="editor-section-heading"><span className="editor-step">03</span><div><h3>Hình ảnh sản phẩm</h3><p className="muted">Chọn ảnh chính và thêm nhiều ảnh phụ cho thư viện sản phẩm.</p></div></div><div className="product-image-manager"><div className="product-image-field"><span className="product-image-label">Ảnh chính <small>BẮT BUỘC</small></span><div className="main-image-picker">{form.image_url ? <img className="main-product-image-preview" src={form.image_url} alt="Ảnh chính sản phẩm" onError={e=>{e.currentTarget.style.display="none"}}/> : <div className="main-image-placeholder"><Image size={28}/><strong>Chưa có ảnh chính</strong><span>JPG, PNG hoặc WEBP · tối đa 5 MB</span></div>}<ImageUrlInput compact value={form.image_url} onChange={value=>setForm({...form,image_url:value})} placeholder="Chọn ảnh chính từ máy"/></div></div><div className="product-image-field"><div className="product-image-heading"><span className="product-image-label">Thư viện ảnh phụ</span><small>{form.gallery_urls.split("\n").filter(url=>url.trim()).length} ảnh</small></div><div className="gallery-upload-list">{form.gallery_urls.split("\n").map((url,i)=>url.trim() ? <div className="gallery-upload-item" key={`${i}-${url}`}><img src={url.trim()} alt={`Ảnh phụ ${i+1}`} onError={e=>{e.currentTarget.style.display="none"}}/><span>Ảnh {i+1}</span><button type="button" className="gallery-remove-btn" aria-label={`Xóa ảnh phụ ${i+1}`} onClick={()=>setForm({...form,gallery_urls:form.gallery_urls.split("\n").filter((_,index)=>index!==i).join("\n")})}><X size={14}/></button></div> : null)}<div className="gallery-add-tile"><ImageUrlInput compact value="" onChange={value=>{if(value) setForm({...form,gallery_urls:[...form.gallery_urls.split("\n").map(url=>url.trim()).filter(Boolean),value].join("\n")})}} placeholder="Thêm ảnh"/></div></div><small className="muted">Tải ảnh lên để thêm vào thư viện. Không cần nhập đường dẫn.</small></div></div></section>
      </div>
      <div className="product-editor-side">
        <section className="content-card editor-section"><div className="editor-section-heading"><span className="editor-step">02</span><div><h3>Giá và kho hàng</h3><p className="muted">Thông tin bán hàng.</p></div></div>
          <label>Giá bán (VNĐ) *<input required min="0" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="0"/></label>
          <label>Tồn kho<input required min="0" type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label>
          <label>Danh mục<select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Chưa chọn</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        </section>
        <section className="content-card editor-section"><div className="editor-section-heading"><span className="editor-step">04</span><div><h3>Trạng thái website</h3><p className="muted">Kiểm soát việc xuất bản.</p></div></div>
          <div className="publish-status-options"><label className={`publish-status-option ${!form.is_published ? 'selected' : ''}`}><input type="radio" name="publish-status" checked={!form.is_published} onChange={()=>setForm({...form,is_published:false})}/><span className="publish-status-copy"><span className="publish-status-title"><b>Nháp (ẩn)</b><em>Chưa xuất bản</em></span><small>Sản phẩm chỉ được lưu trong CMS, khách hàng chưa thể xem trên website.</small></span></label><label className={`publish-status-option ${form.is_published ? 'selected' : ''}`}><input type="radio" name="publish-status" checked={form.is_published} onChange={()=>setForm({...form,is_published:true})}/><span className="publish-status-copy"><span className="publish-status-title"><b>Đăng bán</b><em>Hiển thị công khai</em></span><small>Sản phẩm được hiển thị trên website để khách hàng xem và đặt mua.</small></span></label></div><div className="promotion-hint"><span className="promotion-hint-mark">i</span><p>Giảm giá và Flash Deal được cài đặt riêng trong mục <Link to="/promotions"><b>Khuyến mãi</b></Link>.</p></div>
        </section>
      </div>
      <div className="product-editor-footer"><button type="button" className="secondary" onClick={()=>navigate('/products')}>Hủy</button><button className="primary" disabled={saving}>{saving ? 'Đang lưu…' : form.is_published ? (isEdit ? 'Lưu và cập nhật website' : 'Tạo và đăng bán') : 'Lưu nháp'}</button></div>
    </form>
  </>
}

type PromotionTimeSlot = { start: string; end: string; promotion_type: 'percent' | 'amount'; promotion_value: number }
type PromotionProgram = {
  id: string; name: string; description: string | null; promotion_type: 'percent' | 'amount';
  promotion_value: number; start_at: string; end_at: string; daily_start_time: string | null; daily_end_time: string | null; daily_time_slots?: Array<string | PromotionTimeSlot> | null; is_flash_deal: boolean;
  flash_start_at: string | null; flash_end_at: string | null; campaign_type?: 'regular' | 'special'; is_active: boolean; created_at?: string;
}
function TimePicker24({ value, onChange }: { value: string; onChange: (nextValue: string) => void }) {
  const [open, setOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const handleOutsideClick = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])
  const [hour = '00', minute = '00'] = value.split(':')
  const hourOptions = Array.from({length:24},(_,i)=>String(i).padStart(2,'0'))
  const minuteOptions = Array.from({length:60},(_,i)=>String(i).padStart(2,'0'))
  return <div ref={pickerRef} style={{position:'relative'}}>
    <button type="button" className="secondary" style={{width:'100%',textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'center'}} onClick={()=>setOpen(v=>!v)}>
      <span style={{fontVariantNumeric:'tabular-nums',fontWeight:600}}>{value.replace(':',' : ')}</span><span aria-hidden="true">▾</span>
    </button>
    {open&&<div style={{position:'absolute',zIndex:30,top:'calc(100% + 6px)',left:0,width:150,padding:8,background:'#fff',border:'1px solid #e5e0d8',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,.12)'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
        <select aria-label="Giờ" size={5} value={hour} onChange={e=>onChange(e.target.value+':'+minute)} style={{width:'100%',height:128,overflowY:'auto',textAlign:'center'}}>{hourOptions.map(h=><option key={h} value={h}>{h}</option>)}</select>
        <select aria-label="Phút" size={5} value={minute} onChange={e=>onChange(hour+':'+e.target.value)} style={{width:'100%',height:128,overflowY:'auto',textAlign:'center'}}>{minuteOptions.map(m=><option key={m} value={m}>{m}</option>)}</select>
      </div>
    </div>}
  </div>
}
function Promotions() {
  const { rows: programs, loading, error, refresh } = useTable<PromotionProgram>('promotions')
  const { rows: products } = useTable<Product>('products')
  const [search,setSearch]=useState(''), [creating,setCreating]=useState(false), [editingId,setEditingId]=useState<string|null>(null)
  const [productCounts,setProductCounts]=useState<Record<string,number>>({})
  const [selected,setSelected]=useState<PromotionProgram|null>(null)
  const [assigned,setAssigned]=useState<Product[]>([]), [assignedIds,setAssignedIds]=useState<string[]>([])
  const [productProgramMap,setProductProgramMap]=useState<Record<string,Array<{name:string;start_at:string;end_at:string}>>>({}), [picked,setPicked]=useState<string[]>([])
  const [showPicker,setShowPicker]=useState(false), [productSearch,setProductSearch]=useState('')
  const [name,setName]=useState(''), [description,setDescription]=useState('')
  const [type,setType]=useState<'percent'|'amount'>('percent'), [value,setValue]=useState(''), [campaignType,setCampaignType]=useState<'regular'|'special'>('regular')
  const [start,setStart]=useState(''), [end,setEnd]=useState(''), [dailySlots,setDailySlots]=useState<PromotionTimeSlot[]>([{start:'07:00',end:'10:00',promotion_type:'percent',promotion_value:10},{start:'12:00',end:'13:00',promotion_type:'percent',promotion_value:10},{start:'17:00',end:'18:00',promotion_type:'percent',promotion_value:10}])
  const [busy,setBusy]=useState(false), [message,setMessage]=useState('')
  useEffect(()=>{let cancelled=false;requireSupabase().from('promotion_products').select('promotion_id').then(({data,error:e})=>{if(cancelled)return;if(e){console.error(e.message);return}const next:Record<string,number>={};(data??[]).forEach((row:{promotion_id:string})=>{next[row.promotion_id]=(next[row.promotion_id]??0)+1});setProductCounts(next)});return()=>{cancelled=true}},[programs])
  function reset(){setName('');setDescription('');setType('percent');setValue('');setCampaignType('regular');setStart('');setEnd('');setDailySlots([{start:'07:00',end:'10:00',promotion_type:'percent',promotion_value:10},{start:'12:00',end:'13:00',promotion_type:'percent',promotion_value:10},{start:'17:00',end:'18:00',promotion_type:'percent',promotion_value:10}]);setMessage('');setEditingId(null)}
  function toLocalDateTime(value:string|null|undefined){
    if(!value)return ''
    const date=new Date(value)
    if(Number.isNaN(date.getTime()))return ''
    const local=new Date(date.getTime()-date.getTimezoneOffset()*60000)
    return local.toISOString().slice(0,16)
  }
  function editProgram(p:PromotionProgram){
    setEditingId(p.id);setCreating(true);setMessage('')
    setName(p.name);setDescription(p.description??'')
    setType(p.promotion_type);setValue(String(p.promotion_value));setCampaignType(p.campaign_type ?? 'regular')
    setStart(p.start_at?.slice(0,10) ?? '');setEnd(p.end_at?.slice(0,10) ?? '')
    const savedSlots = Array.isArray(p.daily_time_slots) && p.daily_time_slots.length ? p.daily_time_slots : [`${(p.daily_start_time ?? '07:00').slice(0,5)}-${(p.daily_end_time ?? '10:00').slice(0,5)}`]
    setDailySlots(savedSlots.map((item) => { if (typeof item === 'string') { const [s,e] = item.split('-'); return {start:s ?? '07:00',end:e ?? '10:00',promotion_type:p.promotion_type,promotion_value:Number(p.promotion_value)} } return {start:item.start,end:item.end,promotion_type:item.promotion_type ?? p.promotion_type,promotion_value:Number(item.promotion_value ?? p.promotion_value)} }))
  }
  function discountLabel(p:PromotionProgram){return p.promotion_type==='percent'?'-'+p.promotion_value+'%':'-'+Number(p.promotion_value).toLocaleString('vi-VN')+' đ'}
  async function openProgram(p:PromotionProgram){
    setSelected(p);setMessage('');setPicked([]);setProductSearch('')
    try{
      const client=requireSupabase()
      const {data,error:e}=await client.from('promotion_products').select('product_id').eq('promotion_id',p.id)
      if(e)throw e
      const ids=(data??[]).map((x:{product_id:string})=>x.product_id);setAssignedIds(ids)
      const {data:ps,error:pe}=ids.length?await client.from('products').select('*').in('id',ids):{data:[],error:null}
      if(pe)throw pe
      setAssigned((ps??[]) as Product[])
      const {data:all,error:ae}=await client.from('promotion_products').select('product_id,promotion_id')
      if(ae)throw ae
      const links=(all??[]) as Array<{product_id:string;promotion_id:string}>
      const otherPromotionIds=[...new Set(links.filter(x=>x.promotion_id!==p.id).map(x=>x.promotion_id))]
      const {data:otherPrograms,error:oe}=otherPromotionIds.length
        ? await client.from('promotions').select('id,name,start_at,end_at,campaign_type,is_active').in('id',otherPromotionIds)
        : {data:[],error:null}
      if(oe)throw oe
      const map:Record<string,Array<{name:string;start_at:string;end_at:string;campaign_type?:'regular'|'special';is_active?:boolean}>>={}
      for(const link of links.filter(x=>x.promotion_id!==p.id)){
        const program=(otherPrograms??[]).find((x:{id:string})=>x.id===link.promotion_id) as {id:string;name:string;start_at:string;end_at:string;campaign_type?:'regular'|'special';is_active?:boolean}|undefined
        if(program)(map[link.product_id]??=[]).push({name:program.name,start_at:program.start_at,end_at:program.end_at,campaign_type:program.campaign_type,is_active:program.is_active})
      }
      setProductProgramMap(map)
    }catch(err){setMessage(err instanceof Error?err.message:'Không tải được sản phẩm trong chương trình.')}
  }
  async function createProgram(e:FormEvent){
    e.preventDefault();setBusy(true);setMessage('')
    try{
      if(!name.trim())throw new Error('Vui lòng nhập tên chương trình.')
      const normalizedSlots = dailySlots.map(slot => ({...slot})).sort((a,b) => a.start.localeCompare(b.start))
      const parsedSlots = normalizedSlots.map(slot => ({...slot,startMinutes:Number(slot.start.slice(0,2))*60+Number(slot.start.slice(3,5)),endMinutes:Number(slot.end.slice(0,2))*60+Number(slot.end.slice(3,5))}))
      if(!start||!end||end<start||!parsedSlots.length||parsedSlots.some(item=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.end)||item.endMinutes<=item.startMinutes||!Number.isFinite(item.promotion_value)||item.promotion_value<=0||(item.promotion_type==='percent'&&item.promotion_value>100))||parsedSlots.some((item,index)=>index>0&&item.startMinutes<parsedSlots[index-1].endMinutes))throw new Error('Vui lòng kiểm tra ngày áp dụng, giờ và mức giảm của từng khung. Các khung giờ không được trùng hoặc chồng lấn.')
      const firstSlot=normalizedSlots[0]
      const payload={
        name:name.trim(),description:description.trim()||null,campaign_type:campaignType,promotion_type:firstSlot.promotion_type,promotion_value:firstSlot.promotion_value,
        start_at:new Date(`${start}T00:00:00`).toISOString(),end_at:new Date(`${end}T23:59:59`).toISOString(),daily_start_time:firstSlot.start,daily_end_time:normalizedSlots[normalizedSlots.length-1].end,daily_time_slots:normalizedSlots,is_flash_deal:true,
        flash_start_at:new Date(`${start}T00:00:00`).toISOString(),flash_end_at:new Date(`${end}T23:59:59`).toISOString()
      }
      const query=editingId
        ? await requireSupabase().from('promotions').update(payload).eq('id',editingId)
        : await requireSupabase().from('promotions').insert({...payload,is_active:true})
      if(query.error)throw query.error
      setCreating(false);reset();await refresh()
    }catch(err){setMessage(err instanceof Error?err.message:'Không tạo được chương trình.')}
    finally{setBusy(false)}
  }
  function overlaps(aStart:string,aEnd:string,bStart:string,bEnd:string){
    return new Date(aStart).getTime()<=new Date(bEnd).getTime() && new Date(bStart).getTime()<=new Date(aEnd).getTime()
  }
  async function addProducts(){
    if(!selected||!picked.length)return
    setBusy(true);setMessage('')
    try{
      const client=requireSupabase()
      const {error:e}=await client.from('promotion_products').insert(picked.map(product_id=>({promotion_id:selected.id,product_id})))
      if(e)throw e
      setShowPicker(false);setPicked([]);setProductCounts(old=>({...old,[selected.id]:(old[selected.id]??0)+picked.length}));await openProgram(selected)
    }catch(err){setMessage(err instanceof Error?err.message:'Không thêm được sản phẩm.')}
    finally{setBusy(false)}
  }
  async function removeProduct(p:Product){
    if(!selected||!confirm('Gỡ sản phẩm khỏi chương trình khuyến mãi?'))return
    const {error:e}=await requireSupabase().from('promotion_products').delete().eq('promotion_id',selected.id).eq('product_id',p.id)
    if(e)setMessage(e.message);else{setProductCounts(old=>({...old,[selected.id]:Math.max(0,(old[selected.id]??1)-1)}));await openProgram(selected)}
  }
  async function toggleProgram(p:PromotionProgram){
    setBusy(true)
    try{
      const {error:e}=await requireSupabase().from('promotions').update({is_active:!p.is_active}).eq('id',p.id)
      if(e)throw e
      await refresh()
    }catch(err){alert(err instanceof Error?err.message:'Không cập nhật được trạng thái chương trình.')}
    finally{setBusy(false)}
  }
  async function deleteProgram(p:PromotionProgram){
    if(!confirm('Xóa chương trình "'+p.name+'" và các sản phẩm liên kết?'))return
    const {error:e}=await requireSupabase().from('promotions').delete().eq('id',p.id)
    if(e)alert(e.message);else{if(selected?.id===p.id)setSelected(null);void refresh()}
  }
  const filtered=programs.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()))
  const available=products.filter(p=>p.is_published&&!assignedIds.includes(p.id)&&p.name.toLowerCase().includes(productSearch.toLowerCase()))
  const quickSlots = [{label:'Buổi sáng',start:'07:00',end:'10:00'},{label:'Buổi trưa',start:'12:00',end:'13:00'},{label:'Buổi chiều',start:'17:00',end:'18:00'},{label:'Buổi tối',start:'21:00',end:'22:00'}]
  function updateDailySlot(index: number, patch: Partial<PromotionTimeSlot>) { setDailySlots(old => old.map((slot,i)=>i===index?{...slot,...patch}:slot)) }
  return <>
    <div className="page-heading"><div><h1>Khuyến mãi</h1><p className="muted">Tạo chương trình, thiết lập mức giảm theo từng khung giờ rồi thêm sản phẩm áp dụng.</p></div><button className="primary" onClick={()=>{reset();setCreating(true)}}><Plus size={15}/> Tạo chương trình</button></div>
    <div className="toolbar"><div className="searchbox"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm chương trình khuyến mãi…"/></div><span className="muted small">{programs.length} chương trình</span></div>
    {error&&<div className="notice error">{error}</div>}
    <div className="content-card table-card"><div className="table-scroll"><table><thead><tr><th>TÊN CHƯƠNG TRÌNH</th><th>THỜI GIAN ÁP DỤNG</th><th>SẢN PHẨM</th><th>TRẠNG THÁI</th><th className="align-right">THAO TÁC</th></tr></thead><tbody>
      {loading?<tr><td colSpan={5} className="empty">Đang tải chương trình…</td></tr>:filtered.length===0?<tr><td colSpan={5} className="empty">Chưa có chương trình khuyến mãi.</td></tr>:filtered.map(p=><tr key={p.id}>
        <td><b>{p.name}</b><small>{p.campaign_type==='special'?'✨ Ngày sale đặc biệt':'Khuyến mãi thường'}</small>{p.is_flash_deal&&<small>⚡ Flash Sale</small>}</td>
        <td><small>{new Date(p.start_at).toLocaleDateString('vi-VN')} – {new Date(p.end_at).toLocaleDateString('vi-VN')}</small><small>{(p.daily_time_slots?.length ? p.daily_time_slots : [`${(p.daily_start_time ?? '07:00').slice(0,5)}-${(p.daily_end_time ?? '10:00').slice(0,5)}`]).map(slot => { if (typeof slot === 'string') return slot; const startTime = slot.start ?? ''; const endTime = slot.end ?? ''; return startTime && endTime ? `${startTime.slice(0,5)}-${endTime.slice(0,5)}` : ''; }).filter(Boolean).join(' · ')} hằng ngày</small></td><td>{productCounts[p.id]??0} sản phẩm</td>
        <td><span className={'pill '+(p.is_active?'pill-green':'pill-gray')}>{p.is_active?'Đang bật':'Đang tắt'}</span></td>
        <td><div className="row-actions"><button className="text-btn" onClick={()=>editProgram(p)}>Chỉnh sửa</button><button className="text-btn" onClick={()=>void openProgram(p)}>Quản lý sản phẩm</button><button className="text-btn" onClick={()=>void toggleProgram(p)}>{p.is_active?'Tắt':'Bật'}</button><button className="text-btn danger-text" onClick={()=>void deleteProgram(p)}>Xóa</button></div></td>
      </tr>)}
    </tbody></table></div></div>
    {creating&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setCreating(false)}}><form className="modal" onSubmit={createProgram}>
      <div className="modal-head"><div><p className="eyebrow">CHƯƠNG TRÌNH ƯU ĐÃI</p><h2>{editingId?'Chỉnh sửa chương trình':'Tạo khuyến mãi mới'}</h2><p className="muted">Mỗi khung giờ có mức giảm riêng, áp dụng cho các sản phẩm được thêm vào chương trình.</p></div><button type="button" className="icon-btn" onClick={()=>{setCreating(false);reset()}}><X size={19}/></button></div>
      <div className="form-grid">
        <label className="span-2">Tên chương trình *<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Ví dụ: Sale cuối năm"/></label>
        <label className="span-2">Mô tả<input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Thông tin ngắn về chương trình"/></label>
        <label className="span-2">Loại chương trình<select value={campaignType} onChange={e=>setCampaignType(e.target.value as 'regular'|'special')}><option value="regular">Khuyến mãi thường / theo tháng</option><option value="special">Ngày sale đặc biệt (ưu tiên cao nhất)</option></select><small className="muted">Ngày sale đặc biệt có thể trùng lịch với chương trình thường và sẽ thay thế mức giảm trong thời gian diễn ra, không cộng dồn.</small></label>
        <label>Ngày bắt đầu<input required type="date" value={start} onChange={e=>setStart(e.target.value)}/></label>
        <label>Ngày kết thúc<input required type="date" min={start||undefined} value={end} onChange={e=>setEnd(e.target.value)}/></label>
        <div className="span-2">
          <b>Khung giờ Flash Sale hằng ngày</b>
          <p className="muted small">Mỗi khung giờ có thể thiết lập hình thức và mức giảm khác nhau. Các khung giờ lặp lại mỗi ngày trong thời gian chương trình.</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,margin:'10px 0 14px'}}>
            {quickSlots.map(preset=><button key={preset.start} type="button" className="secondary" disabled={dailySlots.some(slot=>slot.start===preset.start&&slot.end===preset.end)} onClick={()=>setDailySlots(old=>[...old,{start:preset.start,end:preset.end,promotion_type:type,promotion_value:Number(value)||10}].sort((a,b)=>a.start.localeCompare(b.start)))}>{preset.label} · {preset.start}-{preset.end}</button>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:10,marginBottom:12}}>
            {dailySlots.map((slot,index)=><div key={index} style={{border:'1px solid #e5e0d8',borderRadius:10,padding:12,background:'#fff'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:10}}>
                <b>Khung giờ {index+1}</b>
                <button type="button" className="text-btn danger-text" disabled={dailySlots.length===1} onClick={()=>setDailySlots(old=>old.filter((_,i)=>i!==index))}>Xóa khung</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <label>Giờ bắt đầu<TimePicker24 value={slot.start} onChange={v=>updateDailySlot(index,{start:v})}/></label>
                <label>Giờ kết thúc<TimePicker24 value={slot.end} onChange={v=>updateDailySlot(index,{end:v})}/></label>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:10}}>
                <label>Hình thức giảm<select value={slot.promotion_type} onChange={e=>updateDailySlot(index,{promotion_type:e.target.value as 'percent'|'amount'})}><option value="percent">Giảm theo %</option><option value="amount">Giảm số tiền (VNĐ)</option></select></label>
                <label>{slot.promotion_type==='percent'?'Mức giảm (%)':'Mức giảm (VNĐ)'}<input type="number" min="1" max={slot.promotion_type==='percent'?100:undefined} value={slot.promotion_value} onChange={e=>updateDailySlot(index,{promotion_value:Number(e.target.value)})}/></label>
              </div>
            </div>)}
          </div>
          <button type="button" className="secondary" onClick={()=>setDailySlots(old=>[...old,{start:'19:00',end:'20:00',promotion_type:type,promotion_value:Number(value)||10}].sort((a,b)=>a.start.localeCompare(b.start)))}>＋ Thêm khung giờ khác</button>
          <p className="muted small" style={{marginTop:8}}>Ví dụ: 07:00–10:00 (buổi sáng), 12:00–13:00 (buổi trưa). Mỗi khung giờ không được trùng hoặc chồng lấn.</p>
        </div>
      </div>
      {message&&<div className="notice error">{message}</div>}
      <div className="modal-actions"><button type="button" className="secondary" onClick={()=>{setCreating(false);reset()}}>Hủy</button><button className="primary" disabled={busy}>{busy?'Đang lưu…':editingId?'Lưu thay đổi':'Tạo chương trình'}</button></div>
    </form></div>}
    {selected&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget){setSelected(null);setShowPicker(false)}}}><section className="modal">
      <div className="modal-head"><div><p className="eyebrow">QUẢN LÝ CHƯƠNG TRÌNH</p><h2>{selected.name}</h2><p className="muted">Mức giảm được cấu hình riêng theo từng khung giờ · {new Date(selected.start_at).toLocaleDateString('vi-VN')} – {new Date(selected.end_at).toLocaleDateString('vi-VN')}</p></div><button type="button" className="icon-btn" onClick={()=>setSelected(null)}><X size={19}/></button></div>
      <div className="card-heading"><div><h3>Sản phẩm tham gia ({assigned.length})</h3><p className="muted">Mỗi sản phẩm áp dụng mức giảm của khung giờ đang diễn ra.</p></div><button className="primary" onClick={()=>{setShowPicker(true);setPicked([])}}><Plus size={14}/> Thêm sản phẩm</button></div>
      {message&&<div className="notice error">{message}</div>}
      <div className="table-scroll"><table><thead><tr><th>SẢN PHẨM</th><th>GIÁ GỐC</th><th>GIÁ SAU GIẢM</th><th></th></tr></thead><tbody>
        {assigned.length===0?<tr><td colSpan={4} className="empty">Chưa có sản phẩm. Nhấn “Thêm sản phẩm” để chọn.</td></tr>:assigned.map(p=>{const price=Number(p.price);const off=selected.promotion_type==='percent'?price*selected.promotion_value/100:selected.promotion_value;return <tr key={p.id}><td><div className="product-cell">{p.image_url?<img src={p.image_url} alt=""/>:<div className="image-placeholder"><Package size={18}/></div>}<b>{p.name}</b></div></td><td>{price.toLocaleString('vi-VN')} đ</td><td><b>{Math.max(0,price-off).toLocaleString('vi-VN')} đ</b></td><td><button className="text-btn danger-text" onClick={()=>void removeProduct(p)}>Gỡ</button></td></tr>})}
      </tbody></table></div>
      {showPicker&&<div className="promotion-picker"><div className="toolbar"><div className="searchbox"><Search size={15}/><input value={productSearch} onChange={e=>setProductSearch(e.target.value)} placeholder="Tìm sản phẩm…"/></div><span className="muted small">{picked.length} đã chọn</span></div>
        <div className="promotion-picker-list">{available.map(p=><label key={p.id} className="promotion-picker-item"><input type="checkbox" checked={picked.includes(p.id)} onChange={e=>setPicked(old=>e.target.checked?[...old,p.id]:old.filter(id=>id!==p.id))}/>{p.image_url?<img src={p.image_url} alt=""/>:<div className="image-placeholder"><Package size={16}/></div>}<span><b>{p.name}</b><small>{Number(p.price).toLocaleString('vi-VN')} đ</small></span></label>)}{available.length===0&&<p className="empty">Không còn sản phẩm phù hợp để thêm.</p>}</div>
        <div className="modal-actions"><button className="secondary" onClick={()=>setShowPicker(false)}>Hủy</button><button className="primary" disabled={!picked.length||busy} onClick={()=>void addProducts()}>{busy?'Đang thêm…':'Thêm '+picked.length+' sản phẩm'}</button></div>
      </div>}
      <div className="modal-actions"><button className="secondary" onClick={()=>setSelected(null)}>Đóng</button></div>
    </section></div>}
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
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'hidden'>('all')

  const sortedRows = [...rows].sort(
    (a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || a.name.localeCompare(b.name, 'vi')
  )
  const filteredRows = sortedRows.filter(c => {
    const q = search.trim().toLocaleLowerCase('vi')
    const matchesSearch = !q || c.name.toLocaleLowerCase('vi').includes(q) || (c.slug ?? '').toLowerCase().includes(q)
    const matchesFilter = filter === 'all' || (filter === 'active' ? c.is_active : !c.is_active)
    return matchesSearch && matchesFilter
  })
  const activeCount = rows.filter(c => c.is_active).length
  const hiddenCount = rows.length - activeCount

  async function add(e: FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    setBusy(true)
    try {
      const nextOrder = rows.length > 0 ? Math.max(...rows.map(c => Number(c.sort_order) || 0)) + 1 : 1
      const { error: insertError } = await requireSupabase().from('categories').insert({
        name: trimmedName, slug: slugify(trimmedName), is_active: true,
        image_url: imageUrl.trim() || null, sort_order: nextOrder
      })
      if (insertError) throw insertError
      setName('')
      setImageUrl('')
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không lưu được danh mục.')
    } finally { setBusy(false) }
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
    if (!trimmedName) { alert('Vui lòng nhập tên danh mục.'); return }
    setBusy(true)
    try {
      const { error: updateError } = await requireSupabase().from('categories')
        .update({ name: trimmedName, slug: slugify(trimmedName), image_url: editImageUrl.trim() || null }).eq('id', c.id)
      if (updateError) throw updateError
      cancelEdit()
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không cập nhật được danh mục.')
    } finally { setBusy(false) }
  }
  async function reorder(draggedId: string, targetId: string) {
    if (draggedId === targetId || busy || editingId !== null) return
    const newRows = [...sortedRows]
    const fromIndex = newRows.findIndex(c => c.id === draggedId)
    const toIndex = newRows.findIndex(c => c.id === targetId)
    if (fromIndex < 0 || toIndex < 0) return
    const [moved] = newRows.splice(fromIndex, 1)
    newRows.splice(toIndex, 0, moved)
    setBusy(true)
    try {
      const client = requireSupabase()
      const results = await Promise.all(newRows.map((c, index) =>
        client.from('categories').update({ sort_order: index + 1 }).eq('id', c.id)
      ))
      const failed = results.find(result => result.error)
      if (failed?.error) throw failed.error
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? `Không lưu được thứ tự: ${err.message}` : 'Không lưu được thứ tự danh mục.')
      await refresh()
    } finally { setBusy(false); setDraggingId(null) }
  }
  async function toggle(c: Category) {
    setBusy(true)
    try {
      const { error: updateError } = await requireSupabase().from('categories').update({ is_active: !c.is_active }).eq('id', c.id)
      if (updateError) throw updateError
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không cập nhật được trạng thái.')
    } finally { setBusy(false) }
  }
  async function remove(c: Category) {
    if (!confirm(`Xóa danh mục "${c.name}"? Nếu đang có sản phẩm thuộc danh mục này, hệ thống có thể từ chối thao tác.`)) return
    setBusy(true)
    try {
      const { error: deleteError } = await requireSupabase().from('categories').delete().eq('id', c.id)
      if (deleteError) throw deleteError
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không xóa được danh mục.')
    } finally { setBusy(false) }
  }

  return <section className="category-page">
    <div className="category-stats">
      <div className="category-stat-card"><span className="category-stat-icon"><FolderOpen size={17}/></span><div><small>Tổng danh mục</small><strong>{rows.length}</strong></div></div>
      <div className="category-stat-card"><span className="category-stat-icon is-live"><Eye size={17}/></span><div><small>Đang hiển thị</small><strong>{activeCount}</strong></div></div>
      <div className="category-stat-card"><span className="category-stat-icon is-muted"><EyeOff size={17}/></span><div><small>Đang ẩn</small><strong>{hiddenCount}</strong></div></div>
    </div>

    <div className="category-workspace">
      <form className="category-create-card" onSubmit={add}>
        <div className="category-section-heading">
          <span className="category-heading-icon"><Plus size={18}/></span>
          <div><h2>Thêm danh mục mới</h2><p>Tạo một nhóm sản phẩm cho cửa hàng.</p></div>
        </div>
        <label className="category-field">Tên danh mục <em>*</em>
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Yến tinh chế nguyên tổ"/>
        </label>
        <label className="category-field">Ảnh đại diện <span className="category-optional">Không bắt buộc</span>
          <ImageUrlInput compact value={imageUrl} onChange={setImageUrl} placeholder="Dán URL hoặc tải ảnh từ máy"/>
        </label>
        <div className="category-create-footer"><span>Slug sẽ được tạo tự động từ tên danh mục.</span><button className="primary category-add-btn" disabled={busy || !name.trim()}><Plus size={15}/>{busy ? 'Đang lưu…' : 'Thêm danh mục'}</button></div>
      </form>

      <div className="category-list-panel">
        <div className="category-list-heading">
          <div><span className="category-eyebrow">PRODUCT TAXONOMY</span><h2>Danh sách danh mục <span>{rows.length}</span></h2><p>Kéo thả để thay đổi thứ tự hiển thị trên website.</p></div>
          <div className="category-sort-hint"><GripVertical size={16}/> Kéo để sắp xếp</div>
        </div>
        <div className="category-toolbar">
          <div className="category-search"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên danh mục hoặc slug…"/>{search && <button type="button" onClick={() => setSearch('')} aria-label="Xóa tìm kiếm"><X size={15}/></button>}</div>
          <div className="category-filters">
            <button type="button" className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>Tất cả <b>{rows.length}</b></button>
            <button type="button" className={filter === 'active' ? 'selected' : ''} onClick={() => setFilter('active')}>Đang hiện</button>
            <button type="button" className={filter === 'hidden' ? 'selected' : ''} onClick={() => setFilter('hidden')}>Đang ẩn</button>
          </div>
        </div>
        {error && <div className="notice error">{error}</div>}
        {loading ? <div className="category-empty"><span className="category-loader"/><b>Đang tải danh mục</b><small>Đang đồng bộ dữ liệu từ cửa hàng…</small></div> :
          filteredRows.length === 0 ? <div className="category-empty"><FolderOpen size={30}/><b>{rows.length ? 'Không tìm thấy danh mục phù hợp' : 'Chưa có danh mục nào'}</b><small>{rows.length ? 'Thử từ khóa khác hoặc thay đổi bộ lọc.' : 'Tạo danh mục đầu tiên để bắt đầu sắp xếp cửa hàng.'}</small>{(search || filter !== 'all') && <button type="button" className="secondary" onClick={() => {setSearch('');setFilter('all')}}>Xóa bộ lọc</button>}</div> :
          <div className="category-items">{filteredRows.map(c => {
            const index = sortedRows.findIndex(item => item.id === c.id)
            const isEditing = editingId === c.id
            return <article key={c.id} className={`category-item ${draggingId === c.id ? 'is-dragging' : ''} ${isEditing ? 'is-editing' : ''}`}
              draggable={!busy && editingId === null && filter === 'all' && !search}
              onDragStart={e => { if (busy || editingId !== null || filter !== 'all' || search) { e.preventDefault(); return }; setDraggingId(c.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', c.id) }}
              onDragOver={e => {e.preventDefault();e.dataTransfer.dropEffect='move'}}
              onDrop={e => {e.preventDefault();const id=e.dataTransfer.getData('text/plain') || draggingId;if(id) void reorder(id,c.id)}}
              onDragEnd={() => setDraggingId(null)}>
              <div className="category-order"><GripVertical size={17}/><span>{String(index + 1).padStart(2,'0')}</span></div>
              <div className="category-thumb">{c.image_url ? <img src={c.image_url} alt={c.name} onError={e => {e.currentTarget.style.display='none'}}/> : <Tags size={21}/>}</div>
              <div className="category-main">
                {isEditing ? <div className="category-edit-fields"><input autoFocus required value={editName} onChange={e => setEditName(e.target.value)} aria-label="Tên danh mục"/><ImageUrlInput compact value={editImageUrl} onChange={setEditImageUrl} placeholder="URL ảnh danh mục"/></div> :
                  <><strong>{c.name}</strong><span className="category-slug">{c.slug}</span></>}
              </div>
              <span className={`category-status ${c.is_active ? 'active' : 'hidden'}`}><i/>{c.is_active ? 'Đang hiển thị' : 'Đang ẩn'}</span>
              <div className="category-actions">
                {isEditing ? <>
                  <button type="button" className="category-action save" disabled={busy || !editName.trim()} onClick={() => saveEdit(c)} title="Lưu thay đổi"><Check size={16}/><span>Lưu</span></button>
                  <button type="button" className="category-action" disabled={busy} onClick={cancelEdit} title="Hủy"><X size={16}/></button>
                </> : <>
                  <button type="button" className="category-action" disabled={busy || editingId !== null} onClick={() => startEdit(c)} title="Chỉnh sửa"><Pencil size={16}/></button>
                  <button type="button" className="category-action" disabled={busy || editingId !== null} onClick={() => toggle(c)} title={c.is_active ? 'Ẩn danh mục' : 'Hiện danh mục'}>{c.is_active ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                  <button type="button" className="category-action delete" disabled={busy || editingId !== null} onClick={() => remove(c)} title="Xóa danh mục"><Trash2 size={16}/></button>
                </>}
              </div>
            </article>
          })}</div>}
        <div className="category-list-footer"><span>Đang hiển thị <b>{filteredRows.length}</b> / {rows.length} danh mục</span><span><span className="category-footer-dot"/> Dữ liệu được lưu trực tiếp trên Supabase</span></div>
      </div>
    </div>
  </section>
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
