import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, Image as ImageIcon, Package, Save, Tags, Upload, Plus, Trash2, Heart, Sparkles, ShieldCheck, Leaf, Brain, Activity, Droplets, Moon, Baby } from 'lucide-react'
import { requireSupabase } from './lib/supabase'
import type { Category, Product } from './types'

type ItemType = 'none' | 'category' | 'product'
type BenefitItem = { id: string; icon: string; title: string; description: string }
const benefitIcons = [
  { value: 'Heart', label: 'Trái tim', Icon: Heart },
  { value: 'Sparkles', label: 'Lấp lánh', Icon: Sparkles },
  { value: 'ShieldCheck', label: 'Khiên bảo vệ', Icon: ShieldCheck },
  { value: 'Leaf', label: 'Lá cây', Icon: Leaf },
  { value: 'Brain', label: 'Não bộ', Icon: Brain },
  { value: 'Activity', label: 'Sức khỏe', Icon: Activity },
  { value: 'Droplets', label: 'Giọt nước', Icon: Droplets },
  { value: 'Moon', label: 'Giấc ngủ', Icon: Moon },
  { value: 'Baby', label: 'Trẻ nhỏ', Icon: Baby },
]
function parseBenefitItems(value: string | null | undefined): BenefitItem[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item === 'object').map((item, index) => ({
      id: String(item.id ?? 'benefit-' + index), icon: String(item.icon ?? 'Heart'),
      title: String(item.title ?? ''), description: String(item.description ?? ''),
    }))
  } catch { /* Existing plain-text description is supported until converted. */ }
  return []
}
type HomepageSection = {
  id: string
  section_key: string
  title: string
  subtitle: string | null
  description: string | null
  image_url: string | null
  button_text: string | null
  button_url: string | null
  item_type: ItemType
  item_ids: string[]
  is_active: boolean
  sort_order: number
}

const sectionNames: Record<string, string> = {
  announcement: 'Thanh thông báo đầu trang',
  site_header: 'Logo và thông tin thương hiệu',
  hero: 'Banner chính (Hero)',
  trust_benefits: 'Các lợi ích cam kết',
  categories: 'Danh mục sản phẩm',
  featured_products: 'Sản phẩm nổi bật',
  gift_banner: 'Banner quà tặng cao cấp',
  best_sellers: 'Sản phẩm bán chạy nhất',
  benefits_stats: 'Lợi ích yến sào',
}

export function Homepage() {
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [openPickerId, setOpenPickerId] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const client = requireSupabase()
      const [sectionResult, productResult, categoryResult] = await Promise.all([
        client.from('homepage_sections').select('*').order('sort_order', { ascending: true }),
        client.from('products').select('*').order('name', { ascending: true }),
        client.from('categories').select('*').order('sort_order', { ascending: true }),
      ])
      if (sectionResult.error) throw sectionResult.error
      if (productResult.error) throw productResult.error
      if (categoryResult.error) throw categoryResult.error
      setSections((sectionResult.data ?? []).map((row: any) => ({
        ...row,
        item_ids: Array.isArray(row.item_ids) ? row.item_ids : [],
      })) as HomepageSection[])
      setProducts((productResult.data ?? []) as Product[])
      setCategories((categoryResult.data ?? []) as Category[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được cấu hình trang chủ.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  function updateSection(id: string, patch: Partial<HomepageSection>) {
    setSections(current => current.map(section => section.id === id ? { ...section, ...patch } : section))
  }

  async function uploadSectionImage(section: HomepageSection, file?: File) {
    if (!file) return
    setError('')
    setNotice('')
    if (!file.type.startsWith('image/')) { setError('Vui lòng chọn tệp hình ảnh.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Ảnh vượt quá 5 MB. Vui lòng chọn ảnh nhỏ hơn.'); return }
    setUploadingId(section.id)
    try {
      const client = requireSupabase()
      const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      const path = `${section.section_key}/${Date.now()}.${extension}`
      const { error: uploadError } = await client.storage.from('homepage-images').upload(path, file, { contentType: file.type, upsert: false })
      if (uploadError) throw uploadError
      const { data } = client.storage.from('homepage-images').getPublicUrl(path)
      updateSection(section.id, { image_url: data.publicUrl })
      setNotice('Đã tải ảnh lên. Nhấn “Lưu khu vực” để lưu URL ảnh vào cấu hình.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được ảnh lên. Hãy kiểm tra cấu hình Storage.')
    } finally { setUploadingId(null) }
  }
  async function saveSection(section: HomepageSection) {
    setSavingId(section.id)
    setError('')
    setNotice('')
    try {
      const { error: saveError } = await requireSupabase()
        .from('homepage_sections')
        .update({
          title: section.title,
          subtitle: section.subtitle,
          description: section.description,
          image_url: section.image_url,
          button_text: section.button_text,
          button_url: section.button_url,
          item_ids: section.item_ids,
          is_active: section.is_active,
          sort_order: section.sort_order,
        })
        .eq('id', section.id)
      if (saveError) throw saveError
      setNotice(`Đã lưu “${sectionNames[section.section_key] ?? section.title}”.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được cấu hình.')
    } finally {
      setSavingId(null)
    }
  }

  async function moveSection(section: HomepageSection, direction: -1 | 1) {
    const ordered = sections.filter(item => !['announcement', 'site_header'].includes(item.section_key)).sort((a, b) => a.sort_order - b.sort_order)
    const index = ordered.findIndex(item => item.id === section.id)
    const targetIndex = index + direction
    if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return
    const next = [...ordered]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    const normalized = next.map((item, i) => ({ ...item, sort_order: i + 3 }))
    setSections(current => current.map(item => normalized.find(updated => updated.id === item.id) ?? item))
    setError('')
    try {
      const client = requireSupabase()
      const results = await Promise.all(normalized.map(item =>
        client.from('homepage_sections').update({ sort_order: item.sort_order }).eq('id', item.id)
      ))
      const failed = results.find(result => result.error)
      if (failed?.error) throw failed.error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được thứ tự khu vực.')
      await refresh()
    }
  }

  function updateBenefitItems(section: HomepageSection, items: BenefitItem[]) {
    updateSection(section.id, { description: JSON.stringify(items) })
  }

  function toggleItem(section: HomepageSection, id: string) {
    const exists = section.item_ids.includes(id)
    const item_ids = exists
      ? section.item_ids.filter(itemId => itemId !== id)
      : [...section.item_ids, id]
    updateSection(section.id, { item_ids })
  }

  return <>
    <div className="page-heading">
      <div>
        <p className="eyebrow">QUẢN LÝ NỘI DUNG</p>
        <h1>Trang chủ</h1>
        <p className="muted">Cấu hình các khu vực trang chủ. Danh mục và sản phẩm được chọn từ Master Data, không tạo bản sao.</p>
      </div>
      <button className="secondary" onClick={() => void refresh()}>↻ Làm mới</button>
    </div>

    <div className="welcome-banner homepage-intro">
      <div><span className="welcome-kicker">HOMEPAGE BUILDER</span><h2>Quản lý bố cục trang chủ</h2><p>Bật/tắt khu vực, chỉnh nội dung, chọn dữ liệu có sẵn và sắp xếp thứ tự hiển thị.</p></div>
      <ImageIcon size={58} strokeWidth={1.2}/>
    </div>

    {error && <div className="notice error">{error}</div>}
    {notice && <div className="notice success">{notice}</div>}
    {loading ? <div className="content-card empty">Đang tải cấu hình trang chủ…</div> : sections.length === 0 ? (
      <div className="content-card">
        <h3>Chưa có cấu hình Trang chủ</h3>
        <p className="muted">Hãy chạy migration <code>002_homepage_sections.sql</code> trong Supabase SQL Editor, sau đó nhấn Làm mới.</p>
      </div>
    ) : (
      <div className="homepage-sections">
        {sections.filter(section => !['announcement', 'site_header'].includes(section.section_key)).sort((a, b) => a.sort_order - b.sort_order).map((section, index, ordered) => {
          const itemList = section.item_type === 'category'
            ? categories.filter(item => item.is_active)
            : section.item_type === 'product'
              ? products.filter(item => item.is_published)
              : []
          const Icon = section.item_type === 'category' ? Tags : Package
          return <section className="content-card homepage-section" key={section.id}>
            <div className="homepage-section-head">
              <div className="homepage-section-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="homepage-section-title">
                <h3>{sectionNames[section.section_key] ?? section.title}</h3>
                <small>{section.section_key}</small>
              </div>
              <span className={`pill ${section.is_active ? 'pill-green' : 'pill-gray'}`}>{section.is_active ? 'Đang hiển thị' : 'Đang ẩn'}</span>
              <div className="homepage-order-actions">
                <button className="icon-btn" title="Di chuyển lên" disabled={index === 0} onClick={() => void moveSection(section, -1)}><ArrowUp size={17}/></button>
                <button className="icon-btn" title="Di chuyển xuống" disabled={index === ordered.length - 1} onClick={() => void moveSection(section, 1)}><ArrowDown size={17}/></button>
              </div>
            </div>

            <div className="form-grid homepage-form">
              <label>Tiêu đề<input value={section.title ?? ''} onChange={e => updateSection(section.id, { title: e.target.value })} placeholder="Tiêu đề khu vực"/></label>
              <label>Tiêu đề phụ<input value={section.subtitle ?? ''} onChange={e => updateSection(section.id, { subtitle: e.target.value })} placeholder="Tiêu đề phụ (nếu có)"/></label>
              {section.section_key === 'benefits_stats' ? <div className="span-2 benefit-items-editor">
                <div className="benefit-items-heading"><b>Nội dung / mô tả — Danh sách lợi ích</b><small className="muted">Mỗi item có icon, nội dung và mô tả riêng.</small></div>
                {parseBenefitItems(section.description).map((item, itemIndex, items) => {
                  const selectedIcon = benefitIcons.find(option => option.value === item.icon) ?? benefitIcons[0]
                  const BenefitIcon = selectedIcon.Icon
                  const patchItem = (patch: Partial<BenefitItem>) => updateBenefitItems(section, items.map((current, index) => index === itemIndex ? { ...current, ...patch } : current))
                  return <div className="benefit-item-card" key={item.id}>
                    <div className="benefit-item-card-head"><span className="benefit-item-number">Lợi ích {itemIndex + 1}</span><div className="benefit-item-actions">
                      <button type="button" className="icon-btn" title="Di chuyển lên" disabled={itemIndex === 0} onClick={() => updateBenefitItems(section, items.map((v, i) => i === itemIndex ? items[itemIndex - 1] : i === itemIndex - 1 ? items[itemIndex] : v))}><ArrowUp size={15}/></button>
                      <button type="button" className="icon-btn" title="Di chuyển xuống" disabled={itemIndex === items.length - 1} onClick={() => updateBenefitItems(section, items.map((v, i) => i === itemIndex ? items[itemIndex + 1] : i === itemIndex + 1 ? items[itemIndex] : v))}><ArrowDown size={15}/></button>
                      <button type="button" className="icon-btn danger" title="Xóa lợi ích" onClick={() => updateBenefitItems(section, items.filter((_, i) => i !== itemIndex))}><Trash2 size={15}/></button>
                    </div></div>
                    <div className="benefit-item-fields">
                      <label>Icon <span className="benefit-icon-preview"><BenefitIcon size={18}/></span><select value={item.icon} onChange={e => patchItem({ icon: e.target.value })}>{benefitIcons.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                      <label>Nội dung<input value={item.title} onChange={e => patchItem({ title: e.target.value })} placeholder="Ví dụ: Hỗ trợ sức khỏe"/></label>
                      <label className="span-2">Mô tả<textarea rows={2} value={item.description} onChange={e => patchItem({ description: e.target.value })} placeholder="Mô tả ngắn cho lợi ích này"/></label>
                    </div>
                  </div>
                })}
                <button type="button" className="secondary benefit-add-button" onClick={() => { const items = parseBenefitItems(section.description); updateBenefitItems(section, [...items, { id: 'benefit-' + Date.now(), icon: 'Heart', title: '', description: '' }]) }}><Plus size={15}/> Thêm lợi ích</button>
              </div> : <label className="span-2">Nội dung / mô tả<textarea rows={2} value={section.description ?? ''} onChange={e => updateSection(section.id, { description: e.target.value })} placeholder="Nội dung hiển thị trên website"/></label>}
              <label className="span-2">URL hình ảnh<input type="url" value={section.image_url ?? ''} onChange={e => updateSection(section.id, { image_url: e.target.value })} placeholder="https://…"/></label>
              <div className="span-2 homepage-image-upload">
                {section.image_url && <img className="homepage-image-preview" src={section.image_url} alt="Xem trước hình ảnh" onError={e => { e.currentTarget.style.display = 'none' }} />}
                <label className="secondary homepage-upload-button">
                  <Upload size={15}/>{uploadingId === section.id ? 'Đang tải ảnh…' : 'Tải ảnh từ máy tính'}
                  <input type="file" accept="image/*" disabled={uploadingId === section.id} onChange={e => { void uploadSectionImage(section, e.target.files?.[0]); e.currentTarget.value = '' }} />
                </label>
                <small className="muted">Có thể dán URL như trước hoặc chọn ảnh từ máy tính (tối đa 5 MB). Ảnh tải lên sẽ lưu trong Supabase Storage.</small>
              </div>
              <label>Nhãn nút<input value={section.button_text ?? ''} onChange={e => updateSection(section.id, { button_text: e.target.value })} placeholder="Ví dụ: Khám phá sản phẩm"/></label>
              <label>Liên kết nút<input value={section.button_url ?? ''} onChange={e => updateSection(section.id, { button_url: e.target.value })} placeholder="/products hoặc URL"/></label>
            </div>

            {section.item_type !== 'none' && <div className="homepage-item-picker">
              <div className="homepage-picker-title"><Icon size={17}/><b>{section.item_type === 'category' ? 'Danh mục đã thêm vào khu vực' : 'Sản phẩm đã thêm vào khu vực'}</b><span>{section.item_ids.length} đã chọn</span></div>
              {section.item_ids.length === 0 ? (
                <p className="muted">Chưa có {section.item_type === 'product' ? 'sản phẩm' : 'danh mục'} nào được thêm vào khu vực này.</p>
              ) : (
                <div className="homepage-item-list">
                  {itemList.filter(item => section.item_ids.includes(item.id)).map(item => <label className="homepage-item-option" key={item.id}>
                    <input type="checkbox" checked={true} aria-label={`Bỏ ${item.name} khỏi khu vực`} onChange={() => toggleItem(section, item.id)}/>
                    {'image_url' in item && item.image_url ? <img src={item.image_url} alt=""/> : <span className="homepage-item-placeholder"><Icon size={16}/></span>}
                    <span><b>{item.name}</b><small>{section.item_type === 'product' ? `${Number((item as Product).price).toLocaleString('vi-VN')} đ` : (item as Category).slug}</small></span>
                    <button type="button" className="icon-btn danger" title="Xóa khỏi khu vực" onClick={event => { event.preventDefault(); toggleItem(section, item.id) }}><Trash2 size={15}/></button>
                  </label>)}
                </div>
              )}
              <button type="button" className="secondary benefit-add-button" onClick={() => setOpenPickerId(current => current === section.id ? null : section.id)}>
                <Plus size={15}/>{openPickerId === section.id ? 'Đóng danh sách' : section.item_type === 'product' ? 'Thêm sản phẩm' : 'Thêm danh mục'}
              </button>
              {openPickerId === section.id && <div className="homepage-item-list homepage-item-master-list">
                {itemList.filter(item => !section.item_ids.includes(item.id)).length === 0 ? (
                  <p className="muted">{itemList.length === 0 ? 'Chưa có dữ liệu đang hoạt động/được xuất bản trong Master Data.' : 'Đã thêm tất cả dữ liệu phù hợp vào khu vực này.'}</p>
                ) : itemList.filter(item => !section.item_ids.includes(item.id)).map(item => <label className="homepage-item-option" key={item.id}>
                  <input type="checkbox" checked={false} onChange={() => toggleItem(section, item.id)}/>
                  {'image_url' in item && item.image_url ? <img src={item.image_url} alt=""/> : <span className="homepage-item-placeholder"><Icon size={16}/></span>}
                  <span><b>{item.name}</b><small>{section.item_type === 'product' ? `${Number((item as Product).price).toLocaleString('vi-VN')} đ` : (item as Category).slug}</small></span>
                </label>)}
              </div>}
            </div>}

            <div className="homepage-section-footer">
              <button className="secondary" onClick={() => updateSection(section.id, { is_active: !section.is_active })}>
                {section.is_active ? <><EyeOff size={15}/> Ẩn khu vực</> : <><Eye size={15}/> Hiện khu vực</>}
              </button>
              <button className="primary" disabled={savingId === section.id} onClick={() => void saveSection(section)}>
                <Save size={15}/>{savingId === section.id ? 'Đang lưu…' : 'Lưu khu vực'}
              </button>
            </div>
          </section>
        })}
      </div>
    )}
  </>
}
