import { industries, channels, places, events } from './data.mjs'
import { start, defaults, settle } from './engine.mjs'

const $ = id => document.getElementById(id)
const key = 'soho-game.save'
const form = $('decisions')
const field = name => form.elements.namedItem(name)
const won = value => value.toLocaleString('ko-KR') + '원'
let state
let storageError = ''

function element(tag, value, className) {
  const node = document.createElement(tag)
  node.textContent = value
  if (className) node.className = className
  return node
}

function readChoice() {
  return Object.fromEntries(['industry', 'channel', 'place', 'price', 'quantity'].map(name => {
    const input = field(name)
    return [name, input.type === 'number' ? input.valueAsNumber : input.value]
  }))
}

function fill(choice) {
  for (const [name, value] of Object.entries(choice)) field(name).value = value
}

function snapshot() {
  return { state, draft: readChoice() }
}

function save() {
  try {
    localStorage.setItem(key, JSON.stringify(snapshot()))
    $('status').textContent = '브라우저에 저장됨'
  } catch {
    $('status').textContent = '자동 저장에 실패했습니다. 저장 파일을 내보낼 수 있습니다.'
  }
}

function preview() {
  const choice = readChoice()
  $('quantity-label').textContent = industries[choice.industry].action
  try {
    const { last } = settle(state, choice)
    const transition = choice.industry !== state.industry ? ` · 기존 재고 처분 ${won(last.salvage)}` : ''
    $('estimate').textContent = `예상 판매·처리 ${last.sold}건 · 매입/생산 ${won(last.purchase)} · 월세 ${won(last.rent)} · 수수료·처리비 ${won(last.fees + last.handling)}${last.deposit ? ' · 보증금 ' + won(last.deposit) : ''}${transition}`
  } catch (error) {
    $('estimate').textContent = error.message
  }
}

function render(draft = defaults(state)) {
  $('intro').hidden = true
  $('game').hidden = false
  $('business').textContent = state.name + ' · ' + industries[state.industry].name
  const metrics = [['운영 월', state.month + '개월 차'], ['가용 현금', won(state.cash)], ['재고', state.stock + '개'], ['미납 비용', won(state.debt)]]
  $('metrics').replaceChildren(...metrics.map(([label, value]) => {
    const card = element('div', '', 'metric')
    card.append(element('span', label), element('strong', value))
    return card
  }))
  $('event').textContent = events[state.event].name
  $('story').textContent = events[state.event].story
  const report = $('report')
  report.replaceChildren(element('h2', state.last ? state.last.month + '개월 차 정산' : '월말 정산'))
  if (state.last) {
    const last = state.last
    const rows = [['매출', won(last.revenue)], ['이익', won(last.profit)], ['판매·완료', last.sold + '건'], ['충족하지 못한 수요', (last.demand - last.sold) + '건'], ['사입·생산 지출', won(last.purchase)], ['매출원가', won(last.costOfSales)], ['채널 수수료', won(last.fees)], ['포장·처리비', won(last.handling)], ['월세', won(last.rent)], ['보증금 지급 / 반환', won(last.deposit) + ' / ' + won(last.released)], ['재고 처분 수입', won(last.salvage)], ['다음 달 약정 월세', won(state.lease.rent)]]
    const list = document.createElement('dl')
    for (const [label, value] of rows) {
      const row = document.createElement('div')
      row.append(element('dt', label), element('dd', value))
      list.append(row)
    }
    report.append(list)
  } else {
    report.append(element('p', '이번 달을 마감하면 매출과 비용 내역을 확인할 수 있습니다.'))
  }
  fill(draft)
  preview()
}

function restore(payload) {
  const saved = payload?.state
  const draft = payload?.draft
  if (saved?.version !== 1 || typeof saved.name !== 'string' || !Object.hasOwn(industries, saved.industry) ||
      !Object.hasOwn(events, saved.event) || !Object.hasOwn(places, saved.place) || !Object.hasOwn(channels, saved.channel) ||
      ![saved.month, saved.cash, saved.stock, saved.stockValue, saved.debt, saved.lease?.rent, saved.lease?.deposit].every(value => Number.isSafeInteger(value) && value >= 0) ||
      saved.month < 1 || (saved.month > 1 && !saved.last) ||
      (saved.last && !['month', 'revenue', 'profit', 'sold', 'demand', 'purchase', 'costOfSales', 'fees', 'handling', 'rent', 'deposit', 'released', 'salvage'].every(key => Number.isSafeInteger(saved.last[key])))) {
    throw Error('지원되는 SOHO Game 저장 파일이 아닙니다.')
  }
  state = saved
  const clean = defaults(saved)
  for (const [name, options] of Object.entries({ industry: industries, channel: channels, place: places })) {
    if (Object.hasOwn(options, draft?.[name])) clean[name] = draft[name]
  }
  for (const name of ['price', 'quantity']) {
    if (Number.isFinite(draft?.[name])) clean[name] = draft[name]
  }
  render(clean)
}

for (const [name, options] of Object.entries({ industry: industries, channel: channels, place: places })) {
  for (const [id, option] of Object.entries(options)) field(name).add(new Option(option.name, id))
}
for (const [id, industry] of Object.entries(industries)) {
  const button = element('button', industry.name + ' · ' + industry.product)
  button.name = 'industry'
  button.value = id
  $('industries').append(button)
}
$('start').addEventListener('submit', event => {
  event.preventDefault()
  const industry = event.submitter?.value
  if (!Object.hasOwn(industries, industry)) return
  state = start(industry, event.currentTarget.elements.name.value.trim() || '나의 사업')
  render()
  save()
})
form.addEventListener('input', event => {
  if (event.target.name === 'industry') {
    const choice = readChoice()
    fill({ ...defaults(state, choice.industry), channel: choice.channel, place: choice.place })
  }
  $('error').textContent = ''
  preview()
  save()
})
form.addEventListener('submit', event => {
  event.preventDefault()
  try {
    const choice = readChoice()
    state = settle(state, choice)
    render(choice)
    save()
    $('error').textContent = ''
  } catch (error) {
    $('error').textContent = error.message
  }
})
$('export').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'soho-game-save.json'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
})
$('import').addEventListener('change', async event => {
  const input = event.target
  try {
    if (!input.files.length) return
    if (state && !window.confirm('현재 브라우저 저장을 선택한 파일로 교체할까요?')) return
    restore(JSON.parse(await input.files[0].text()))
    save()
    $('error').textContent = ''
  } catch (error) {
    $('error').textContent = error.message
  } finally {
    input.value = ''
  }
})
try {
  const saved = localStorage.getItem(key)
  if (saved) {
    restore(JSON.parse(saved))
    $('status').textContent = '저장한 사업을 불러왔습니다.'
  }
} catch {
  storageError = '브라우저 저장을 불러올 수 없습니다. 저장 파일이 있다면 불러올 수 있습니다.'
}
$('error').textContent = storageError
