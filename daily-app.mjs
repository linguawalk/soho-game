import { industries, places } from './data.mjs'
import { products, channels, eventFor, create, migrate, advance, validatePlan } from './daily.mjs'

const $ = id => document.getElementById(id)
const key = 'soho-game.save'
const rates = { labor: '인건비율', marketing: '마케팅비율', handling: '추가 처리비율', rent: '월세 적용률', tax: '세율' }
const lenders = { bank: '은행', government: '정부' }
const defaults = { labor: 5, marketing: 8, handling: 0, rent: 100, tax: 10 }
const won = n => n.toLocaleString('ko-KR') + '원'
let state
let plan

function node(tag, text) {
  const el = document.createElement(tag)
  el.textContent = text
  return el
}

function checkbox(id, caption, checked) {
  const label = node('label', caption)
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.value = id
  input.checked = checked
  label.prepend(input, ' ')
  return label
}

function numberField(name, caption, value, min = 0, max = 100, step = 'any') {
  const label = node('label', caption)
  const input = document.createElement('input')
  Object.assign(input, { type: 'number', name, min, max, step, value })
  label.append(input)
  return label
}

function checks(container) {
  return Array.from(container.querySelectorAll('input:checked'), input => input.value)
}

function defaultPlan(industry, ids = [0]) {
  return { ...defaults, industry, place: state.place, channels: ['offline'], tiers: ['regular', 'sale'],
    items: ids.map(id => itemDefaults(industry, id)) }
}

function itemDefaults(industry, id) {
  const [, price, cost] = products[industry][id]
  return { id, price, cost, discount: 10, share: 40 }
}

function renderItems() {
  $('products').replaceChildren(...products[plan.industry].map(([name], id) => {
    const selected = plan.items.find(item => item.id === id)
    const item = selected || itemDefaults(plan.industry, id)
    const card = node('div', '')
    card.className = 'product'
    const fields = node('div', '')
    fields.className = 'fields'
    const costLabel = { retail: '사입비율', manufacturing: '제작비율', service: '서비스 제공 원가율' }
    fields.append(numberField('price', '정상가격 (원)', item.price, 100, 10000000, 1),
      numberField('cost', costLabel[plan.industry] + ' (%)', item.cost),
      numberField('discount', '세일 할인율 (%)', item.discount, 0, 99.99),
      numberField('share', '세일 판매 비중 (%)', item.share))
    const priceNote = node('small', '')
    priceNote.className = 'muted price-note'
    card.append(checkbox(id, name, Boolean(selected)), fields, priceNote)
    return card
  }))
  updatePrices()
}

function updatePrices() {
  for (const card of $('products').children) {
    const price = card.querySelector('[name=price]').valueAsNumber
    const discount = card.querySelector('[name=discount]').valueAsNumber
    card.querySelector('.price-note').textContent = Number.isFinite(price * discount)
      ? '세일가격 ' + won(price - Math.round(price * discount / 100)) + ' · 원가율 기준은 정상가격'
      : ''
  }
}

function readPlan() {
  return {
    industry: $('active-industry').value, place: $('place').value, channels: checks($('channels')), tiers: checks($('tiers')),
    items: Array.from($('products').children).filter(card => card.querySelector('input[type=checkbox]').checked).map(card => {
      const item = { id: Number(card.querySelector('input[type=checkbox]').value) }
      for (const name of ['price', 'cost', 'discount', 'share']) item[name] = card.querySelector('[name=' + name + ']').valueAsNumber
      return item
    }),
    ...Object.fromEntries(Object.keys(rates).map(id => [id, $('rates').querySelector('[name=' + id + ']').valueAsNumber])),
  }
}

function renderPlan() {
  $('active-industry').value = plan.industry
  $('place').value = plan.place
  $('place').disabled = state.day !== 1
  $('channels').replaceChildren(...Object.entries(channels).map(([id, [name]]) => checkbox(id, name, plan.channels.includes(id))))
  for (const input of $('tiers').querySelectorAll('input')) input.checked = plan.tiers.includes(input.value)
  $('rates').replaceChildren(...Object.entries(rates).map(([id, label]) => numberField(id, label + ' (%)', plan[id])))
  $('rates').querySelector('[name=rent]').disabled = state.day !== 1 || (state.month !== 1 && state.place === plan.place)
  $('funding').replaceChildren(...Object.entries(lenders).map(([id, label]) => {
    const field = numberField(id, label + ' 신청액 (원)', 0, 0, 5000000, 1)
    field.querySelector('input').disabled = state.loans.some(loan => loan.source === id)
    return field
  }))
  renderItems()
}

function list(rows) {
  const dl = node('dl', '')
  for (const [label, value] of rows) {
    const row = node('div', '')
    row.append(node('dt', label), node('dd', value))
    dl.append(row)
  }
  return dl
}

function report() {
  const r = state.last
  $('report-title').textContent = r ? r.month + '개월 차 실적' : '월말 실적'
  $('report').replaceChildren()
  if (!r) {
    $('report').append(node('p', '30일 차를 마감하면 첫 월간 실적이 표시됩니다.'))
    return
  }
  $('report').append(list([['매출', won(r.regular + r.sale)], ['당월 손익', won(r.profit)], ['월말 현금', won(r.cash)]]))
  const lines = rows => rows.map(([name, value]) => [name, won(value)])
  const sheets = [
    ['손익계산서', [['정상가 매출', r.regular], ['세일가 매출', r.sale], ['사입·제작·서비스 원가', r.cost], ['인건비', r.labor], ['마케팅', r.marketing], ['채널·처리 비용', r.fees], ['임대료', r.rent], ['이자', r.interest], ['세금', r.tax], ['당월 손익', r.profit]]],
    ['현금흐름표', [['월초 현금', r.cash - r.receipts - r.borrowed + r.out], ['영업 수입', r.receipts - r.depositIn], ['영업 지출', r.out - r.depositOut - r.principal], ['보증금 지급', r.depositOut], ['보증금 회수', r.depositIn], ['대출 입금', r.borrowed], ['원금 지급', r.principal], ['월말 현금', r.cash]]],
    ['대차대조표', [['현금', r.cash], ['미수금', r.receivables], ['보증금', r.deposit], ['총자산', r.cash + r.receivables + r.deposit], ['미지급 비용', r.debt], ['대출 잔액', r.loanBalance], ['자본', r.equity], ['부채 및 자본 합계', r.debt + r.loanBalance + r.equity]]],
    ['자본변동표', [['월초 자본', r.openingEquity], ['당월 손익', r.profit], ['월말 자본', r.equity]]],
  ]
  for (const [title, rows] of sheets) {
    const detail = node('details', '')
    detail.append(node('summary', title), list(lines(rows)))
    $('report').append(detail)
  }
}

function render() {
  $('intro').hidden = true
  $('game').hidden = false
  $('business').textContent = state.name + ' · ' + industries[state.industry].name
  const metrics = [['운영일', state.month + '개월 차 ' + state.day + '일'], ['가용 현금', won(state.cash)], ['미수금', won(state.due + state.receivables)], ['미지급 비용', won(state.debt)]]
  $('metrics').replaceChildren(...metrics.map(([label, value]) => {
    const card = node('div', '')
    card.className = 'metric'
    card.append(node('span', label), node('strong', value))
    return card
  }))
  const current = eventFor(state.month, state.day)
  $('event').textContent = current.title
  $('story').textContent = current.story
  $('advance').textContent = state.day === 30 ? '30일 차 마감 및 월간 정산' : '오늘 마감'
  $('today').replaceChildren(state.today ? list([['판매·처리 건수', state.today.units], ['정상가 매출', won(state.today.regular)], ['세일가 매출', won(state.today.sale)], ['영업 비용', won(state.today.expense)], ['새 미수금', won(state.today.accrued)], ['현금 변동', won(state.today.cashChange)]]) : node('p', '오늘을 마감하면 실적이 반영됩니다.'))
  renderPlan()
  for (const input of $('responses').querySelectorAll('input')) input.checked = false
  report()
}

function payload() {
  return { state, plan, responses: checks($('responses')) }
}

function save() {
  try {
    localStorage.setItem(key, JSON.stringify(payload()))
    $('status').textContent = '브라우저에 저장됨'
  } catch {
    $('status').textContent = '자동 저장에 실패했습니다. 저장 파일을 내려받을 수 있습니다.'
  }
}

function restore(saved) {
  const prior = saved?.state
  if (![1, 2].includes(prior?.version) || !Object.hasOwn(products, prior.industry) || !Object.hasOwn(places, prior.place) || !Number.isSafeInteger(prior.cash) || typeof prior.name !== 'string') throw Error('유효한 SOHO Game 저장 파일을 선택하세요.')
  const next = migrate(prior)
  if (!Number.isInteger(next.month) || next.month < 1 || !Number.isInteger(next.day) || next.day < 1 || next.day > 30 || !Array.isArray(next.loans) || !next.totals) throw Error('저장한 날짜 또는 거래 내역을 읽을 수 없습니다.')
  if (saved.plan) validatePlan(saved.plan)
  state = next
  plan = saved.plan || defaultPlan(state.industry)
  if (prior.version === 1 && prior.channel === 'platform') plan.channels = ['online']
  render()
  const responses = Array.isArray(saved.responses) ? saved.responses : []
  for (const input of $('responses').querySelectorAll('input')) input.checked = responses.includes(input.value)
  save()
  $('status').textContent = prior.version === 1 ? '이전 저장을 일간 운영으로 전환했습니다.' : '저장한 사업을 불러왔습니다.'
}

for (const [id, industry] of Object.entries(industries)) {
  $('industry').add(new Option(industry.name, id))
  $('active-industry').add(new Option(industry.name, id))
}
for (const [id, place] of Object.entries(places)) $('place').add(new Option(place.name, id))
function opening() {
  $('opening-items').querySelector('.checks').replaceChildren(...products[$('industry').value].map(([name], id) => checkbox(id, name, id === 0)))
}
opening()
$('industry').addEventListener('change', opening)
$('start').addEventListener('submit', event => {
  event.preventDefault()
  const ids = checks($('opening-items')).map(Number)
  if (!ids.length) { $('error').textContent = '첫 품목을 하나 이상 선택하세요.'; return }
  state = create($('name').value.trim() || '나의 사업', $('industry').value)
  plan = defaultPlan(state.industry, ids)
  render()
  save()
  $('error').textContent = ''
})
$('active-industry').addEventListener('change', () => {
  const updated = readPlan()
  plan = { ...updated, items: [itemDefaults(updated.industry, 0)] }
  renderItems()
  save()
})
$('plan').addEventListener('input', event => {
  if (event.target === $('active-industry')) return
  if (event.target === $('place')) {
    $('rates').querySelector('[name=rent]').disabled = state.day !== 1 || (state.month !== 1 && state.place === $('place').value)
  }
  const draft = readPlan()
  updatePrices()
  try { validatePlan(draft); plan = draft; save() } catch { $('status').textContent = '유효한 선택이 입력되면 자동 저장됩니다.' }
})
$('responses').addEventListener('change', save)
$('plan').addEventListener('submit', event => {
  event.preventDefault()
  try {
    const updated = readPlan()
    const funding = Object.keys(lenders).flatMap(source => {
      const input = $('funding').querySelector('[name=' + source + ']')
      return !input.disabled && input.valueAsNumber ? [{ source, amount: input.valueAsNumber }] : []
    })
    state = advance(state, updated, checks($('responses')), funding)
    plan = updated
    render()
    save()
    $('error').textContent = ''
  } catch (error) { $('error').textContent = error.message }
})
$('export').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload(), null, 2)], { type: 'application/json' }))
  const link = node('a', '')
  link.href = url
  link.download = 'soho-game-save.json'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
})
$('import').addEventListener('change', async ({ target }) => {
  try {
    if (!target.files.length || (state && !window.confirm('현재 저장을 선택한 파일로 교체할까요?'))) return
    restore(JSON.parse(await target.files[0].text()))
    $('error').textContent = ''
  } catch (error) { $('error').textContent = error.message }
  finally { target.value = '' }
})
try {
  const data = localStorage.getItem(key)
  if (data) restore(JSON.parse(data))
} catch {
  $('error').textContent = '브라우저의 저장 데이터를 읽을 수 없습니다. 저장 파일이 있으면 불러올 수 있습니다.'
}
