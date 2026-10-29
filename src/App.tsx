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
  return <div className="app-shell">
    {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Đóng menu" />}
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><div className="brand-mark small-mark">YS</div><div><strong>YẾN SÀO</strong><span>ADMIN CMS</span></div><button className="icon-btn mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
      <p className="nav-caption">KHÔNG GIAN QUẢN TRỊ</p>
      <nav>{nav.map(item => { const Icon = item.icon; return <Link key={item.id} className={`nav-item ${current === item.id ? 'active' : ''}`} to={item.id === 'dashboard' ? '/' : `/${item.id}`}><Icon size={18}/><span>{item.label}</span></Link> })}</nav>
      <div className="sidebar-bottom"><div className="secure-note"><Activity size={16}/><span>Quản trị nội dung<br/><b>Kết nối Supabase</b></span></div><button className="nav-item logout" onClick={logout}><LogOut size={18}/>Đăng xuất</button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="icon-btn menu-toggle" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div><span className="breadcrumb">Admin CMS / </span><strong>{sectionTitles[current]}</strong></div><div className="topbar-right"><span className="status-dot"/><span>Quản trị viên</span><div className="avatar">A</div></div></header>
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

function PageHeading({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">QUẢN LÝ NỘI DUNG</p><h1>{title}</h1><p className="muted">{description}</p></div>{action}</div>
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
    {value && <img className="image-url-preview" src={value} alt="Xem trước ảnh" onError={e => { e.currentTarget.style.display = 'none' }} />}
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
  const [search, setSearch] = useState(''), [modal, setModal] = useState(false), [edit, setEdit] = useState<Product | null>(null), [saving, setSaving] = useState(false), [message, setMessage] = useState('')
  const blank = { name:'', slug:'', description:'', price:'', image_url:'', category_id:'', stock:'0', is_published:false, promotion_enabled:false, promotion_type:'percent', promotion_value:'', promotion_start_at:'', promotion_end_at:'', is_flash_deal:false, flash_deal_start_at:'', flash_deal_end_at:'' }
  const [form, setForm] = useState(blank)
  function toDateTimeLocal(value?: string | null) { if (!value) return ''; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16) }
  function open(item?: Product) {
    setEdit(item ?? null)
    setForm(item ? {
      name:item.name, slug:item.slug, description:item.description ?? '', price:String(item.price),
      image_url:item.image_url ?? '', category_id:item.category_id ?? '', stock:String(item.stock), is_published:item.is_published,
      promotion_enabled:Boolean(item.promotion_type && item.promotion_value != null),
      promotion_type:item.promotion_type ?? 'percent', promotion_value:item.promotion_value == null ? '' : String(item.promotion_value),
      promotion_start_at:toDateTimeLocal(item.promotion_start_at), promotion_end_at:toDateTimeLocal(item.promotion_end_at),
      is_flash_deal:Boolean(item.is_flash_deal), flash_deal_start_at:toDateTimeLocal(item.flash_deal_start_at), flash_deal_end_at:toDateTimeLocal(item.flash_deal_end_at)
    } : blank)
    setModal(true); setMessage('')
  }
  async function save(e: FormEvent) {
    e.preventDefault(); setSaving(true); setMessage('')
    try {
      if (form.promotion_enabled && (!form.promotion_value || Number(form.promotion_value) <= 0 || !form.promotion_start_at || !form.promotion_end_at || new Date(form.promotion_end_at) <= new Date(form.promotion_start_at))) throw new Error('Vui lòng nhập mức giảm và thời gian khuyến mãi hợp lệ.')
      if (form.is_flash_deal && (!form.flash_deal_start_at || !form.flash_deal_end_at || new Date(form.flash_deal_end_at) <= new Date(form.flash_deal_start_at))) throw new Error('Vui lòng nhập thời gian Flash Deal hợp lệ.')
      if (form.promotion_enabled && form.promotion_type === 'percent' && Number(form.promotion_value) > 100) throw new Error('Mức giảm theo phần trăm không được vượt quá 100%.')
      const payload = {
        name:form.name.trim(), slug:form.slug.trim() || slugify(form.name), description:form.description || null,
        price:Number(form.price), image_url:form.image_url || null, category_id:form.category_id || null,
        stock:Number(form.stock), is_published:form.is_published,
        promotion_type:form.promotion_enabled ? form.promotion_type : null,
        promotion_value:form.promotion_enabled ? Number(form.promotion_value) : null,
        promotion_start_at:form.promotion_enabled ? new Date(form.promotion_start_at).toISOString() : null,
        promotion_end_at:form.promotion_enabled ? new Date(form.promotion_end_at).toISOString() : null,
        is_flash_deal:form.is_flash_deal,
        flash_deal_start_at:form.is_flash_deal ? new Date(form.flash_deal_start_at).toISOString() : null,
        flash_deal_end_at:form.is_flash_deal ? new Date(form.flash_deal_end_at).toISOString() : null
      }
      const q = requireSupabase().from('products')
      const result = edit ? await q.update(payload).eq('id',edit.id) : await q.insert(payload)
      if(result.error) throw result.error
      setModal(false); await refresh()
    } catch(e) { setMessage(e instanceof Error ? e.message : 'Lưu sản phẩm thất bại.') }
    finally { setSaving(false) }
  }
  async function remove(item: Product) { if (!confirm(`Xóa sản phẩm "${item.name}"?`)) return; const {error:e}=await requireSupabase().from('products').delete().eq('id',item.id); if(e) alert(e.message); else refresh() }
  const filtered = rows.filter(x => x.name.toLowerCase().includes(search.toLowerCase()))
  return <><PageHeading title="Sản phẩm" description="Quản lý thông tin sản phẩm và chương trình khuyến mãi." action={<button className="primary" onClick={()=>navigate("/products/new")}><span>＋</span> Thêm sản phẩm</button>}/>
    <div className="toolbar"><div className="searchbox"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo tên sản phẩm…"/></div><span className="muted small">{rows.length} sản phẩm</span></div>
    {error && <div className="notice error">{error}</div>}
    <div className="content-card table-card"><div className="table-scroll"><table><thead><tr><th>SẢN PHẨM</th><th>GIÁ BÁN</th><th>KHUYẾN MÃI</th><th>TỒN KHO</th><th>TRẠNG THÁI</th><th className="align-right">THAO TÁC</th></tr></thead><tbody>
    {loading ? <tr><td colSpan={6} className="empty">Đang tải dữ liệu…</td></tr> : filtered.length===0 ? <tr><td colSpan={6} className="empty">Chưa có sản phẩm. Nhấn “Thêm sản phẩm” để bắt đầu.</td></tr> : filtered.map(x=><tr key={x.id}><td><div className="product-cell">{x.image_url ? <img src={x.image_url} alt=""/> : <div className="image-placeholder"><Package size={18}/></div>}<div><b>{x.name}</b><small>{x.slug}</small></div></div></td><td>{Number(x.price).toLocaleString('vi-VN')} đ</td><td>{x.promotion_type && x.promotion_value != null ? (x.promotion_type==='percent' ? `-${x.promotion_value}%` : `-${Number(x.promotion_value).toLocaleString('vi-VN')} đ`) : '—'}{x.is_flash_deal && <small>Flash Deal</small>}</td><td>{x.stock}</td><td><span className={`pill ${x.is_published?'pill-green':'pill-gray'}`}>{x.is_published?'Đang hiển thị':'Bản nháp'}</span></td><td><div className="row-actions"><button className="text-btn" onClick={()=>navigate("/products/" + x.id + "/edit")}>Chi tiết</button><button className="text-btn danger-text" onClick={()=>remove(x)}>Xóa</button></div></td></tr>)}
    </tbody></table></div></div>
    {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><form className="modal" onSubmit={save}><div className="modal-head"><div><h2>{edit?'Chỉnh sửa sản phẩm':'Thêm sản phẩm'}</h2><p className="muted">Thông tin cơ bản của sản phẩm.</p></div><button type="button" className="icon-btn" onClick={()=>setModal(false)}><X size={19}/></button></div>
      <div className="form-grid">
        <label className="span-2">Tên sản phẩm *<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value,slug:form.slug || slugify(e.target.value)})}/></label>
        <label>Slug<input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/></label>
        <label>Danh mục<select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Chưa chọn</option>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
        <label>Giá bán (VNĐ) *<input required min="0" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label>
        <label>Tồn kho<input min="0" type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label>
        <label className="span-2">Hình ảnh sản phẩm<ImageUrlInput value={form.image_url} onChange={value=>setForm({...form,image_url:value})}/></label>
        <label className="span-2">Mô tả<textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
        <label className="check-label span-2"><input type="checkbox" checked={form.is_published} onChange={e=>setForm({...form,is_published:e.target.checked})}/> Xuất bản lên website</label>
        <div className="span-2 notice"><b>Khuyến mãi được quản lý riêng.</b> Sau khi lưu sản phẩm, vào mục <Link to="/promotions">Khuyến mãi</Link> để tạo chương trình và cài đặt Flash Deal.</div>
      </div>
      {message&&<div className="notice error">{message}</div>}<div className="modal-actions"><button type="button" className="secondary" onClick={()=>setModal(false)}>Hủy</button><button className="primary" disabled={saving}>{saving?'Đang lưu…':'Lưu sản phẩm'}</button></div></form></div>}
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
  const [form, setForm] = useState({ name:'', slug:'', description:'', price:'', image_url:'', category_id:'', stock:'0', is_published:false })
  useEffect(() => {
    let active = true
    async function load() {
      if (!productId) return
      setLoading(true); setError('')
      try {
        const { data, error: e } = await requireSupabase().from('products').select('*').eq('id', productId).single()
        if (e) throw e
        if (active && data) setForm({ name:data.name ?? '', slug:data.slug ?? '', description:data.description ?? '', price:String(data.price ?? ''), image_url:data.image_url ?? '', category_id:data.category_id ?? '', stock:String(data.stock ?? 0), is_published:Boolean(data.is_published) })
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
      const payload = { name:form.name.trim(), slug:form.slug.trim() || slugify(form.name), description:form.description.trim() || null, price:Number(form.price), image_url:form.image_url.trim() || null, category_id:form.category_id || null, stock:Number(form.stock), is_published:form.is_published }
      const q = requireSupabase().from('products')
      const result = productId ? await q.update(payload).eq('id',productId) : await q.insert(payload)
      if (result.error) throw result.error
      navigate('/products')
    } catch (err) { setError(err instanceof Error ? err.message : 'Lưu sản phẩm thất bại.') }
    finally { setSaving(false) }
  }
  if (loading) return <div className="loading">Đang tải thông tin sản phẩm…</div>
  return <>
    <div className="editor-breadcrumb"><button className="text-btn" type="button" onClick={()=>navigate('/products')}>← Quay lại danh sách</button><span className="muted">/ {isEdit ? 'Chi tiết sản phẩm' : 'Thêm sản phẩm mới'}</span></div>
    <PageHeading title={isEdit ? 'Chi tiết sản phẩm' : 'Thêm sản phẩm mới'} description="Cập nhật thông tin sản phẩm hiển thị trên website." action={<span className={form.is_published ? 'pill pill-green' : 'pill pill-gray'}>{form.is_published ? 'Đang xuất bản' : 'Bản nháp'}</span>} />
    {error && <div className="notice error">{error}</div>}
    <form className="product-editor-layout" onSubmit={save}>
      <div className="product-editor-main">
        <section className="content-card editor-section"><div className="editor-section-heading"><span className="editor-step">01</span><div><h3>Thông tin cơ bản</h3><p className="muted">Tên sản phẩm và nội dung giới thiệu.</p></div></div>
          <label>Tên sản phẩm *<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value,slug:form.slug || slugify(e.target.value)})} placeholder="Ví dụ: Yến tinh chế nguyên tổ"/></label>
          <label>Slug URL<input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="yen-tinh-che-nguyen-to"/><small className="muted">Dùng trong đường dẫn sản phẩm.</small></label>
          <label>Mô tả sản phẩm<textarea rows={6} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Mô tả chất lượng, quy cách và cách sử dụng…"/></label>
        </section>
        <section className="content-card editor-section"><div className="editor-section-heading"><span className="editor-step">02</span><div><h3>Hình ảnh sản phẩm</h3><p className="muted">Tải ảnh lên hoặc dán đường dẫn hình ảnh.</p></div></div><ImageUrlInput value={form.image_url} onChange={value=>setForm({...form,image_url:value})}/></section>
      </div>
      <div className="product-editor-side">
        <section className="content-card editor-section"><div className="editor-section-heading"><span className="editor-step">03</span><div><h3>Giá và kho hàng</h3><p className="muted">Thông tin bán hàng.</p></div></div>
          <label>Giá bán (VNĐ) *<input required min="0" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="0"/></label>
          <label>Tồn kho<input required min="0" type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label>
          <label>Danh mục<select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Chưa chọn</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        </section>
        <section className="content-card editor-section"><div className="editor-section-heading"><span className="editor-step">04</span><div><h3>Trạng thái website</h3><p className="muted">Kiểm soát việc xuất bản.</p></div></div>
          <label className="publish-toggle"><span><b>Hiển thị sản phẩm</b><small className="muted">Cho phép khách hàng xem sản phẩm trên website.</small></span><input type="checkbox" checked={form.is_published} onChange={e=>setForm({...form,is_published:e.target.checked})}/></label>
          <div className="notice">Cài đặt giảm giá và Flash Deal được quản lý riêng tại trang <Link to="/promotions"><b>Khuyến mãi</b></Link>.</div>
        </section>
      </div>
      <div className="product-editor-footer"><button type="button" className="secondary" onClick={()=>navigate('/products')}>Hủy</button><button className="primary" disabled={saving}>{saving ? 'Đang lưu…' : isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm'}</button></div>
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
        <td><div className="product-cell">{p.image_url ? <img src={p.image_url} alt=""/> : <div className="image-placeholder"><Package size={18}/></div>}<div><b>{p.name}</b><small>{p.is_published ? 'Đang hiển thị trên website' : 'Bản nháp'}</small></div></div></td>
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
