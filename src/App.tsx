import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Activity, BookOpen, ChartNoAxesCombined, Image, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, Tags, X, House } from 'lucide-react'
import { isSupabaseConfigured, requireSupabase, supabase } from './lib/supabase'
import type { Article, Banner, Category, Order, Product } from './types'
import { Homepage } from './Homepage'

type Section = 'dashboard' | 'homepage' | 'products' | 'categories' | 'banners' | 'articles' | 'orders'
const nav: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'homepage', label: 'Trang chủ', icon: House },
  { id: 'products', label: 'Sản phẩm', icon: Package },
  { id: 'categories', label: 'Danh mục', icon: Tags },
  { id: 'banners', label: 'Banner', icon: Image },
  { id: 'articles', label: 'Bài viết', icon: BookOpen },
  { id: 'orders', label: 'Đơn hàng', icon: ShoppingCart },
]
const sectionTitles: Record<Section, string> = { dashboard: 'Tổng quan', homepage: 'Trang chủ', products: 'Sản phẩm', categories: 'Danh mục', banners: 'Banner', articles: 'Bài viết', orders: 'Đơn hàng' }

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
  const { rows, loading, error, refresh } = useTable<Product>('products')
  const { rows: categories } = useTable<Category>('categories')
  const [search, setSearch] = useState(''), [modal, setModal] = useState(false), [edit, setEdit] = useState<Product | null>(null), [saving, setSaving] = useState(false), [message, setMessage] = useState('')
  const blank = { name:'', slug:'', description:'', price:'', compare_at_price:'', image_url:'', category_id:'', stock:'0', is_published:false }
  const [form, setForm] = useState(blank)
  function open(item?: Product) { setEdit(item ?? null); setForm(item ? { name:item.name, slug:item.slug, description:item.description ?? '', price:String(item.price), compare_at_price:item.compare_at_price == null ? '' : String(item.compare_at_price), image_url:item.image_url ?? '', category_id:item.category_id ?? '', stock:String(item.stock), is_published:item.is_published } : blank); setModal(true); setMessage('') }
  async function save(e: FormEvent) { e.preventDefault(); setSaving(true); setMessage(''); try { const payload = { name:form.name.trim(), slug:form.slug.trim() || slugify(form.name), description:form.description || null, price:Number(form.price), compare_at_price:form.compare_at_price ? Number(form.compare_at_price) : null, image_url:form.image_url || null, category_id:form.category_id || null, stock:Number(form.stock), is_published:form.is_published }; const q = requireSupabase().from('products'); const result = edit ? await q.update(payload).eq('id',edit.id) : await q.insert(payload); if(result.error) throw result.error; setModal(false); await refresh() } catch(e) { setMessage(e instanceof Error ? e.message : 'Lưu sản phẩm thất bại.') } finally { setSaving(false) } }
  async function remove(item: Product) { if (!confirm(`Xóa sản phẩm "${item.name}"?`)) return; const {error:e}=await requireSupabase().from('products').delete().eq('id',item.id); if(e) alert(e.message); else refresh() }
  const filtered = rows.filter(x => x.name.toLowerCase().includes(search.toLowerCase()))
  return <><PageHeading title="Sản phẩm" description="Tạo, chỉnh sửa giá, hình ảnh và trạng thái hiển thị." action={<button className="primary" onClick={()=>open()}><span>＋</span> Thêm sản phẩm</button>}/>
    <div className="toolbar"><div className="searchbox"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo tên sản phẩm…"/></div><span className="muted small">{rows.length} sản phẩm</span></div>
    {error && <div className="notice error">{error}</div>}
    <div className="content-card table-card"><div className="table-scroll"><table><thead><tr><th>SẢN PHẨM</th><th>GIÁ BÁN</th><th>TỒN KHO</th><th>TRẠNG THÁI</th><th className="align-right">THAO TÁC</th></tr></thead><tbody>
    {loading ? <tr><td colSpan={5} className="empty">Đang tải dữ liệu…</td></tr> : filtered.length===0 ? <tr><td colSpan={5} className="empty">Chưa có sản phẩm. Nhấn “Thêm sản phẩm” để bắt đầu.</td></tr> : filtered.map(x=><tr key={x.id}><td><div className="product-cell">{x.image_url ? <img src={x.image_url} alt=""/> : <div className="image-placeholder"><Package size={18}/></div>}<div><b>{x.name}</b><small>{x.slug}</small></div></div></td><td>{Number(x.price).toLocaleString('vi-VN')} đ</td><td>{x.stock}</td><td><span className={`pill ${x.is_published?'pill-green':'pill-gray'}`}>{x.is_published?'Đang hiển thị':'Bản nháp'}</span></td><td><div className="row-actions"><button className="text-btn" onClick={()=>open(x)}>Sửa</button><button className="text-btn danger-text" onClick={()=>remove(x)}>Xóa</button></div></td></tr>)}
    </tbody></table></div></div>
    {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><form className="modal" onSubmit={save}><div className="modal-head"><div><h2>{edit?'Chỉnh sửa sản phẩm':'Thêm sản phẩm'}</h2><p className="muted">Thông tin hiển thị trên website.</p></div><button type="button" className="icon-btn" onClick={()=>setModal(false)}><X size={19}/></button></div>
      <div className="form-grid"><label className="span-2">Tên sản phẩm *<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value,slug:form.slug || slugify(e.target.value)})}/></label><label>Slug<input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/></label><label>Danh mục<select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Chưa chọn</option>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>Giá bán (VNĐ) *<input required min="0" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label><label>Giá so sánh<input min="0" type="number" value={form.compare_at_price} onChange={e=>setForm({...form,compare_at_price:e.target.value})}/></label><label>Tồn kho<input min="0" type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label><label>URL hình ảnh<input type="url" placeholder="https://…" value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})}/></label><label className="span-2">Mô tả<textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label className="check-label span-2"><input type="checkbox" checked={form.is_published} onChange={e=>setForm({...form,is_published:e.target.checked})}/> Xuất bản lên website</label></div>
      {message&&<div className="notice error">{message}</div>}<div className="modal-actions"><button type="button" className="secondary" onClick={()=>setModal(false)}>Hủy</button><button className="primary" disabled={saving}>{saving?'Đang lưu…':'Lưu sản phẩm'}</button></div></form></div>}
  </>
}




function Categories() {
  const { rows, loading, error, refresh } = useTable<Category>('categories')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
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
          sort_order: nextOrder
        })

      if (insertError) throw insertError

      setName('')
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
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
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
          slug: slugify(trimmedName)
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
                <th>SLUG</th>
                <th>TRẠNG THÁI</th>
                <th className="align-right">THAO TÁC</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="empty">Đang tải…</td>
                </tr>
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty">Chưa có danh mục.</td>
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
  return <><PageHeading title="Banner" description="Quản lý ảnh banner và vị trí hiển thị trên website."/><form className="content-card editor-card" onSubmit={add}><h3>Thêm banner</h3><div className="form-grid"><label>Tiêu đề *<input required value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Vị trí<select value={position} onChange={e=>setPosition(e.target.value)}><option value="home_hero">Trang chủ — Hero</option><option value="home_middle">Trang chủ — Giữa trang</option><option value="promotion">Khuyến mãi</option></select></label><label className="span-2">URL ảnh *<input required type="url" value={image} onChange={e=>setImage(e.target.value)} placeholder="https://…"/></label><label className="span-2">Link khi bấm (không bắt buộc)<input type="url" value={link} onChange={e=>setLink(e.target.value)} placeholder="https://…"/></label></div><button className="primary" disabled={busy}>{busy?'Đang lưu…':'Lưu banner'}</button></form>{error&&<div className="notice error">{error}</div>}<div className="banner-grid">{loading?<p>Đang tải banner…</p>:rows.length===0?<div className="content-card empty">Chưa có banner.</div>:rows.map(b=><div className="content-card banner-card" key={b.id}><img src={b.image_url} alt={b.title}/><div className="banner-body"><div><b>{b.title}</b><small>{b.position}</small></div><span className={`pill ${b.is_active?'pill-green':'pill-gray'}`}>{b.is_active?'Đang bật':'Đang tắt'}</span><div className="row-actions"><button className="text-btn" onClick={()=>toggle(b)}>{b.is_active?'Tắt':'Bật'}</button><button className="text-btn danger-text" onClick={()=>remove(b)}>Xóa</button></div></div></div>)}</div></>
}
function Articles() {
  const {rows,loading,error,refresh}=useTable<Article>('articles')
  const [title,setTitle]=useState(''),[excerpt,setExcerpt]=useState(''),[content,setContent]=useState(''),[image,setImage]=useState(''),[busy,setBusy]=useState(false)
  async function add(e:FormEvent){e.preventDefault();setBusy(true);try{const {error:e}=await requireSupabase().from('articles').insert({title,slug:slugify(title),excerpt:excerpt||null,content:content||null,image_url:image||null,is_published:false});if(e)throw e;setTitle('');setExcerpt('');setContent('');setImage('');await refresh()}catch(e){alert(e instanceof Error?e.message:'Không lưu được bài viết.')}finally{setBusy(false)}}
  async function toggle(a:Article){const {error:e}=await requireSupabase().from('articles').update({is_published:!a.is_published}).eq('id',a.id);if(e)alert(e.message);else refresh()}
  async function remove(a:Article){if(!confirm(`Xóa bài viết "${a.title}"?`))return;const {error:e}=await requireSupabase().from('articles').delete().eq('id',a.id);if(e)alert(e.message);else refresh()}
  return <><PageHeading title="Bài viết" description="Soạn nội dung tin tức và xuất bản lên website."/><form className="content-card editor-card" onSubmit={add}><h3>Tạo bài viết mới</h3><div className="form-grid"><label className="span-2">Tiêu đề *<input required value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="span-2">Mô tả ngắn<input value={excerpt} onChange={e=>setExcerpt(e.target.value)}/></label><label className="span-2">URL ảnh đại diện<input type="url" value={image} onChange={e=>setImage(e.target.value)} placeholder="https://…"/></label><label className="span-2">Nội dung<textarea rows={5} value={content} onChange={e=>setContent(e.target.value)} placeholder="Nhập nội dung bài viết…"/></label></div><button className="primary" disabled={busy}>{busy?'Đang lưu…':'Lưu bản nháp'}</button></form>{error&&<div className="notice error">{error}</div>}<div className="content-card table-card"><div className="table-scroll"><table><thead><tr><th>BÀI VIẾT</th><th>NGÀY TẠO</th><th>TRẠNG THÁI</th><th className="align-right">THAO TÁC</th></tr></thead><tbody>{loading?<tr><td colSpan={4} className="empty">Đang tải…</td></tr>:rows.length===0?<tr><td colSpan={4} className="empty">Chưa có bài viết.</td></tr>:rows.map(a=><tr key={a.id}><td><div className="product-cell">{a.image_url?<img src={a.image_url} alt=""/>:<div className="image-placeholder"><BookOpen size={18}/></div>}<div><b>{a.title}</b><small>{a.slug}</small></div></div></td><td>{a.created_at?new Date(a.created_at).toLocaleDateString('vi-VN'):'—'}</td><td><span className={`pill ${a.is_published?'pill-green':'pill-gray'}`}>{a.is_published?'Đã xuất bản':'Bản nháp'}</span></td><td><div className="row-actions"><button className="text-btn" onClick={()=>toggle(a)}>{a.is_published?'Ẩn bài':'Xuất bản'}</button><button className="text-btn danger-text" onClick={()=>remove(a)}>Xóa</button></div></td></tr>)}</tbody></table></div></div></>
}
function Orders() {
  const {rows,loading,error,refresh}=useTable<Order>('orders')
  const statusNames:Record<string,string>={pending:'Chờ xác nhận',confirmed:'Đã xác nhận',shipping:'Đang giao',completed:'Hoàn tất',cancelled:'Đã hủy'}
  async function update(o:Order,status:string){const {error:e}=await requireSupabase().from('orders').update({status}).eq('id',o.id);if(e)alert(e.message);else refresh()}
  return <><PageHeading title="Đơn hàng" description="Theo dõi đơn hàng từ website khách hàng."/><div className="toolbar"><span className="muted small">{rows.length} đơn hàng</span><button className="secondary" onClick={()=>void refresh()}>↻ Làm mới</button></div>{error&&<div className="notice error">{error}</div>}<div className="content-card table-card"><div className="table-scroll"><table><thead><tr><th>MÃ ĐƠN</th><th>KHÁCH HÀNG</th><th>TỔNG TIỀN</th><th>TRẠNG THÁI</th><th>NGÀY TẠO</th></tr></thead><tbody>{loading?<tr><td colSpan={5} className="empty">Đang tải…</td></tr>:rows.length===0?<tr><td colSpan={5} className="empty">Chưa có đơn hàng.</td></tr>:rows.map(o=><tr key={o.id}><td><b>#{o.id.slice(0,8).toUpperCase()}</b></td><td><b>{o.customer_name}</b><small>{o.customer_phone}</small></td><td>{Number(o.total).toLocaleString('vi-VN')} đ</td><td><select className="status-select" value={o.status} onChange={e=>update(o,e.target.value)}>{Object.entries(statusNames).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></td><td>{new Date(o.created_at).toLocaleString('vi-VN')}</td></tr>)}</tbody></table></div></div></>
}
export default App
