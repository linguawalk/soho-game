import { industries, places } from './data.mjs'

export const products = {
  retail: [['생활소품', 19000, 46], ['문구 세트', 12000, 49], ['주방 소품', 24000, 52]],
  service: [['자전거 점검', 34000, 13], ['출장 정비', 52000, 19], ['자전거 세척', 22000, 16]],
  manufacturing: [['맞춤 안내판', 42000, 34], ['기념 명패', 33000, 38], ['전시 받침대', 55000, 42]],
}
export const channels = {
  offline: ['오프라인', 1.04, 2],
  online: ['온라인', 1.28, 9],
  b2b: ['B2B', 1.18, 3],
  visit: ['방문판매', 0.9, 5],
  other: ['기타', 0.84, 4],
}

export const lifestyle = { purchase: 12000, production: 7000, minimum: 1000, logistics: 300000 }
export const isLifestyleProduct = (industry, id) => industry === 'retail' && id === 0
export const purchaseDiscounts = [[1000, 10], [500, 5], [100, 3], [0, 0]]

export function unitCost(industry, item) {
  const [, price, percent] = products[industry][item.id]
  return item.unitCost ?? (industry === 'retail' && item.id === 0 ? lifestyle.purchase : Math.round(price * (item.cost ?? percent) / 100))
}

export function salePriceFor(item) {
  return item.salePrice ?? Math.max(1, item.price - portion(item.price, item.discount ?? 0))
}

export function purchaseQuote(price, quantity) {
  const [, discount] = purchaseDiscounts.find(([minimum]) => quantity >= minimum)
  return { price, quantity, discount, amount: portion(price * quantity, 100 - discount) }
}

export function earnings(r) {
  const revenue = r.regular + r.sale
  const gross = revenue - r.cost
  const selling = r.fees + r.rent + r.labor + r.marketing + (r.logistics || 0)
  const operating = gross - selling
  const beforeTax = operating - r.interest
  return { revenue, gross, selling, operating, beforeTax, net: beforeTax - r.tax }
}

export const staffing = { online: 500, offline: 200, salary: 2500000 }

const events = [
  ['신규 문의', '새 고객이 가격을 비교합니다. 할인 안내와 상품 소개를 함께 할 수 있습니다.', 1.15],
  ['인근 행사', '주변 행사로 고객이 늘어납니다. 할인과 추가 홍보를 검토하세요.', 1.35],
  ['조용한 영업일', '유입이 줄었습니다. 추가 홍보를 하거나 기존 운영을 유지할 수 있습니다.', 0.76],
  ['주문 집중', '주문이 한꺼번에 들어옵니다. 판매 기회를 늘리거나 처리 능력을 보강하세요.', 1.28],
  ['단골 추천', '기존 고객이 지인에게 소개했습니다. 상품 안내나 추가 홍보를 선택할 수 있습니다.', 1.19],
  ['경쟁점 판촉', '경쟁점이 행사를 열었습니다. 할인율과 할인 판매 비중을 검토하세요.', 0.86],
  ['단체 문의', '단체 고객이 견적을 요청했습니다. B2B를 포함하면 판매대금은 다음 달에 들어옵니다.', 1.24],
  ['원가 변동', '공급 여건이 바뀌었습니다. 원가율과 이번 달 영업 계획을 검토하세요.', 0.96],
  ['배송 지연', '배송 일정이 촉박합니다. 추가 지원으로 주문 처리 여력을 높일 수 있습니다.', 0.89],
  ['급여일 수요', '가격 비교를 마친 고객들의 구매 문의가 늘었습니다.', 1.32],
  ['주말 미리 주문', '고객들이 주말 수령에 앞서 주문합니다.', 1.16],
  ['비 오는 날', '현장 고객 발길이 줄고 구매 문의도 감소합니다.', 0.81],
  ['입소문을 탄 품목', '고객 커뮤니티에서 제품이나 서비스를 공유했습니다.', 1.33],
  ['월중 문의 둔화', '초순에 비해 신규 고객 유입이 줄었습니다.', 0.84],
  ['신규 거래처 탐색', '사업 고객들이 공급처 후보를 비교합니다.', 1.21],
  ['인근 상점 휴무', '근처 경쟁점의 휴무로 일부 문의가 이동했습니다.', 1.2],
  ['수령 일정 집중', '여러 고객이 비슷한 시간에 주문을 처리해 달라고 요청합니다.', 1.25],
  ['지역 소식지 소개', '지역 소식지에 소개되어 신규 문의가 늘었습니다.', 1.3],
  ['경쟁 상품 출시', '비슷한 품목이 출시되어 고객의 선택 폭이 넓어졌습니다.', 0.8],
  ['재구매 문의', '이전에 거래한 고객이 다시 가격과 가능 일정을 확인합니다.', 1.18],
  ['연휴 수요', '연휴를 앞두고 평소보다 일찍 주문이 들어옵니다.', 1.36],
  ['장기간 외출 감소', '주변 유동인구가 줄어 문의량이 감소했습니다.', 0.82],
  ['고객 후기 확산', '좋은 후기를 본 고객이 거래를 문의합니다.', 1.24],
  ['가격 비교 증가', '여러 공급처를 비교하는 고객이 많아졌습니다.', 0.92],
  ['업무 마감 전 문의', '기업 고객들의 주문 문의가 월말에 몰립니다.', 1.22],
  ['예약 여유', '갑작스러운 수요가 줄어 평소보다 처리 여유가 생깁니다.', 0.78],
  ['동네 공동 행사', '인근 점포들의 공동 행사로 지역 방문객이 늘었습니다.', 1.3],
  ['수령 마감 임박', '이번 달 안에 거래를 마치려는 고객이 늘었습니다.', 1.27],
  ['월말 지출 조정', '일부 고객이 구매를 다음 달로 미루고 있습니다.', 0.81],
  ['이달 마지막 영업일', '오늘 거래를 마치면 한 달 실적이 확정됩니다.', 1.08],
]

export function eventFor(month, day) {
  const index = day === 30 ? 29 : (day - 1 + (month - 1) * 3) % 29
  const [title, story, demand] = events[index]
  return { title, story, demand }
}

const zero = () => ({ regular: 0, sale: 0, units: 0, cost: 0, labor: 0, marketing: 0, fees: 0, rent: 0, tax: 0, interest: 0, principal: 0, borrowed: 0, depositIn: 0, depositOut: 0, receipts: 0, out: 0 })

export function create(name, industry, cash = 3500000) {
  return { version: 2, name, industry, place: 'home', lease: 0, month: 1, day: 1, cash, equity: cash, receivables: 0, due: 0, debt: 0, loans: [], totals: zero(), last: null }
}

export function migrate(old) {
  if (old.version !== 1) return old
  const state = create(old.name, old.industry, old.cash)
  const inventoryRecovery = old.stockValue || 0
  return { ...state, place: old.place, lease: old.lease.rent, deposit: old.lease.deposit, cash: old.cash + inventoryRecovery,
    equity: old.cash + inventoryRecovery + old.lease.deposit - old.debt, debt: old.debt, month: old.month }
}

export function validatePlan(plan) {
  const catalog = products[plan.industry]
  if (!Object.hasOwn(products, plan.industry) || !Object.hasOwn(places, plan.place) || !plan.items.length || !plan.channels.length || !plan.tiers.length) throw Error('품목, 판매 방식과 가격 유형을 각각 하나 이상 선택하세요.')
  for (const item of plan.items) {
    if (!Number.isInteger(item.id) || !catalog[item.id] || !Number.isInteger(item.price) || item.price < 100 || item.price > 10000000) throw Error('품목별 정상가격을 100~10,000,000원으로 입력하세요.')
    if (!rate(item.share) || !Number.isSafeInteger(unitCost(plan.industry, item)) || unitCost(plan.industry, item) < 0 || unitCost(plan.industry, item) > 10000000 ||
        (plan.tiers.includes('sale') && (!Number.isSafeInteger(salePriceFor(item)) || salePriceFor(item) < 1 || salePriceFor(item) > item.price))) {
      throw Error('매입·원가 단가와 세일가격을 확인하세요. 세일가격은 1원 이상, 판매정가 이하여야 합니다.')
    }
  }
  if (![plan.labor, plan.marketing, plan.rent, plan.tax, plan.handling].every(rate)) throw Error('비용 비율은 0~100% 사이에서 입력하세요.')
  if (new Set(plan.items.map(item => item.id)).size !== plan.items.length ||
      new Set(plan.channels).size !== plan.channels.length || new Set(plan.tiers).size !== plan.tiers.length ||
      !plan.channels.every(id => Object.hasOwn(channels, id)) || !plan.tiers.every(id => ['regular', 'sale'].includes(id))) throw Error('품목, 채널 또는 가격 유형을 확인하세요.')
}
function rate(n) { return Number.isFinite(n) && n >= 0 && n <= 100 }
const portion = (amount, percent) => Math.round(amount * percent / 100)

export function advance(state, plan, decisions, funding = []) {
  validatePlan(plan)
  if (!Array.isArray(decisions) || !decisions.every(id => ['promotion', 'staff', 'offer'].includes(id)) || new Set(decisions).size !== decisions.length) throw Error('오늘의 대응을 확인하세요.')
  let { cash, due, receivables, debt } = state
  const inventory = (state.inventory || []).map(lot => ({ ...lot }))
  const quantity = plan.production ?? 0
  const lifestyleActive = plan.industry === 'retail' && plan.items.some(item => item.id === 0)
  const logistics = plan.logistics ?? lifestyle.logistics
  const vatRate = plan.vat ?? 0
  const team = plan.team || { online: 0, offline: 0 }
  if (!rate(vatRate) || ![team.online, team.offline].every(n => Number.isInteger(n) && n >= 0 && n <= 20)) throw Error('부가세율과 채널별 직원 수를 확인하세요.')
  if (!Number.isInteger(quantity) || quantity < 0 || (quantity > 0 && (!lifestyleActive || quantity < lifestyle.minimum || quantity > 100000 ||
      !Number.isSafeInteger(logistics) || logistics < 0))) throw Error('생활소품 직접 제작은 1,000~100,000개부터 가능하며 물류비를 입력해야 합니다.')
  let deposit = state.deposit || 0
  let lease = state.lease
  const totals = { ...state.totals }
  for (const key of ['productionPaid', 'logistics', 'vat', 'salary', 'deferredMarketing', 'deferredLabor', 'regularUnits', 'saleUnits']) totals[key] ??= 0
  const monthlyTeam = { online: 0, offline: 0, ...state.monthlyTeam }
  for (const channel of ['online', 'offline']) monthlyTeam[channel] = Math.max(monthlyTeam[channel], team[channel])
  const salesRows = { ...state.salesRows }
  const purchaseRows = [...(state.purchaseRows || [])]
  const loans = state.loans.map(loan => ({ ...loan }))
  const openingCash = cash
  if (state.day === 1 && plan.place !== state.place) {
    const nextDeposit = places[plan.place].deposit
    const change = nextDeposit - deposit
    cash -= change
    if (change > 0) { totals.out += change; totals.depositOut += change }
    else { totals.receipts -= change; totals.depositIn -= change }
    deposit = nextDeposit
  }
  if (plan.place !== state.place && state.day !== 1) throw Error('사업장 변경은 매월 1일에 확정할 수 있습니다.')
  if (state.day === 1 && (plan.place !== state.place || state.month === 1)) lease = portion(places[plan.place].rent, plan.rent)
  for (const { source, amount } of funding) {
    if (!Object.hasOwn({ bank: 1, government: 1 }, source) || loans.some(loan => loan.source === source) ||
        !Number.isInteger(amount) || amount < 10000 || amount > 5000000) throw Error('신청액은 기관별 1만~500만 원이며 기존 대출을 상환하면 다시 신청할 수 있습니다.')
    loans.push({ source, balance: amount, installment: Math.ceil(amount / (source === 'bank' ? 6 : 12)), begins: state.month + 1 })
    cash += amount
    totals.borrowed += amount
  }
  if (state.day === 1 && due) {
    cash += due
    totals.receipts += due
    due = 0
  }
  if (cash < 0) throw Error('보증금을 낼 현금이 부족합니다. 사업장을 유지하거나 대출을 선택하세요.')

  if (quantity) {
    const productionPaid = lifestyle.production * quantity
    if (cash < productionPaid + logistics) throw Error('제작비와 물류비를 지불할 현금이 부족합니다. 제작을 보류하거나 대출을 선택하세요.')
    inventory.push({ units: quantity, cost: lifestyle.production })
    cash -= productionPaid + logistics
    totals.out += productionPaid + logistics
    totals.productionPaid += productionPaid
    totals.logistics += logistics
  }
  const event = eventFor(state.month, state.day)
  const promotion = decisions.includes('promotion')
  const support = decisions.includes('staff')
  const offer = decisions.includes('offer')
  const { capacity, demand } = industries[plan.industry]
  const totalDemand = Math.round(demand / 17 * event.demand * (promotion ? 1 + plan.marketing / 100 : 1) * (offer ? 1.18 : 1))
  const channelUnits = {}
  const todayRows = []
  let cashCosts = 0
  const purchases = new Map()
  let remaining = (lifestyleActive ? 2000 : 0) + Math.max(0, Math.round((capacity + places[plan.place].capacity) / 15 * (support ? 1 + plan.labor / 100 : 1)))
  const combinations = plan.items.flatMap(item => plan.channels.map(channel => ({ item, channel })))
  const offset = (state.day - 1) % combinations.length
  const rotated = combinations.slice(offset).concat(combinations.slice(0, offset))
  const reach = combinations.reduce((sum, entry) => sum + channels[entry.channel][1], 0)
  const spread = totalDemand / reach
  let accrued = 0
  let immediate = 0
  let expenses = 0
  const today = { units: 0, regular: 0, sale: 0 }
  let target = 0
  let allotted = 0
  for (const { item, channel } of rotated) {
    target += spread * channels[channel][1]
    const allocation = Math.round(target) - allotted
    allotted += allocation
    if (!remaining) continue
    const saleOnly = !plan.tiers.includes('regular')
    const saleShare = saleOnly ? 100 : plan.tiers.includes('sale') ? item.share : 0
    const salePrice = salePriceFor(item)
    const currentPrice = item.price * (1 - saleShare / 100) + salePrice * saleShare / 100
    const growth = isLifestyleProduct(plan.industry, item.id)
      ? Math.min(1300, Math.max(0, (state.month - 2) * 93)) * event.demand * channels[channel][1]
      : 0
    const requested = Math.round((allocation + growth) * Math.min(2, (products[plan.industry][item.id][1] / currentPrice) ** 0.8))
    const trackStaff = channel === 'online' || channel === 'offline'
    const used = channelUnits[channel] || 0
    const available = trackStaff ? staffing[channel] * (team[channel] + 1) - 1 - used : Infinity
    const isLifestyle = lifestyleActive && item.id === 0
    const stocked = isLifestyle ? inventory.reduce((sum, lot) => sum + lot.units, 0) : 0
    const units = Math.min(remaining, requested, available, isLifestyle && plan.wholesale === false ? stocked : Infinity)
    channelUnits[channel] = used + units
    if (!units) continue
    const runningSales = state.totals.units + state.month - 1
    const sales = Math.min(units, Math.floor((runningSales + today.units + units) * saleShare / 100) - Math.floor((runningSales + today.units) * saleShare / 100))
    const regular = (units - sales) * item.price
    const sale = sales * salePrice
    const revenue = regular + sale
    let cost = unitCost(plan.industry, item) * units
    let cashCost = cost
    let purchased = plan.industry === 'retail' ? units : 0
    if (isLifestyle) {
      let unfilled = units
      while (unfilled && inventory.length) {
        const lot = inventory[0]
        const drawn = Math.min(unfilled, lot.units)
        lot.units -= drawn
        unfilled -= drawn
        if (!lot.units) inventory.shift()
      }
      purchased = unfilled
      cost = (units - unfilled) * lifestyle.production
      cashCost = 0
    } else if (purchased) {
      cost = 0
      cashCost = 0
    }
    if (purchased) purchases.set(item.id, (purchases.get(item.id) || 0) + purchased)
    for (const [tier, unitPrice, count] of [['regular', item.price, units - sales], ['sale', salePrice, sales]]) {
      if (!count) continue
      const product = products[plan.industry][item.id][0]
      const discount = tier === 'sale' ? Math.round((1 - unitPrice / item.price) * 10000) / 100 : 0
      const key = [product, channel, tier, unitPrice, discount].join('|')
      const row = { product, channel, tier, price: unitPrice, discount, units: count }
      todayRows.push(row)
      salesRows[key] = { ...row, units: (salesRows[key]?.units || 0) + count }
    }
    totals.regularUnits += units - sales
    totals.saleUnits += sales
    const vat = portion(revenue, vatRate)
    totals.vat += vat
    const fees = portion(revenue, channels[channel][2] + plan.handling)
    if (channel === 'b2b') accrued += revenue + vat
    else immediate += revenue + vat
    expenses += cost + fees
    cashCosts += cashCost + fees
    totals.regular += regular
    totals.sale += sale
    totals.cost += cost
    totals.fees += fees
    totals.units += units
    today.units += units
    today.regular += regular
    today.sale += sale
    remaining -= units
  }
  const todayPurchases = []
  for (const [id, count] of purchases) {
    const item = plan.items.find(entry => entry.id === id)
    const quote = purchaseQuote(unitCost(plan.industry, item), count)
    const row = { ...quote, product: products[plan.industry][id][0], day: state.day }
    todayPurchases.push(row)
    purchaseRows.push(row)
    totals.cost += quote.amount
    cashCosts += quote.amount
    expenses += quote.amount
  }
  const revenue = today.regular + today.sale
  const labor = support ? portion(revenue, plan.labor) : 0
  const marketing = promotion ? portion(revenue, plan.marketing) : 0
  totals.labor += labor
  totals.marketing += marketing
  totals.deferredMarketing += marketing
  totals.deferredLabor += labor
  cash += immediate
  receivables += accrued
  totals.receipts += immediate

  function pay(amount) {
    const paid = Math.min(cash, amount)
    cash -= paid
    totals.out += paid
    return amount - paid
  }

  debt = pay(debt + cashCosts)
  const next = { ...state, industry: plan.industry, place: plan.place, lease, deposit, cash, debt, due, receivables, loans, totals, inventory, monthlyTeam, salesRows, purchaseRows, day: state.day + 1,
    today: { ...today, rows: todayRows, purchases: todayPurchases, expense: expenses, accrued, cashChange: cash - openingCash } }
  if (state.day !== 30) return next
  totals.rent = lease
  totals.salary = (monthlyTeam.online + monthlyTeam.offline) * staffing.salary
  totals.labor += totals.salary
  debt += pay(totals.rent + totals.salary + totals.deferredMarketing + totals.deferredLabor + totals.vat)
  for (const loan of loans) {
    if (state.month < loan.begins) continue
    const interest = portion(loan.balance, loan.source === 'bank' ? 1 : 0.45)
    totals.interest += interest
    debt += pay(interest)
    const requested = Math.min(loan.balance, loan.installment)
    const principal = requested - pay(requested)
    totals.principal += principal
    loan.balance -= principal
  }
  const preTax = earnings(totals).beforeTax
  const annualIncome = (state.annualIncome || 0) + preTax
  const yearEnd = state.month % 12 === 0
  totals.tax = yearEnd ? portion(Math.max(annualIncome, 0), plan.tax) : 0
  debt += pay(totals.tax)
  const profit = preTax - totals.tax
  const loanBalance = loans.reduce((sum, loan) => sum + loan.balance, 0)
  const equity = state.equity + profit
  return { ...next, month: state.month + 1, day: 1, cash, debt, due: due + receivables, receivables: 0, equity,
    loans: loans.filter(loan => loan.balance), totals: zero(), monthlyTeam: {}, salesRows: {}, purchaseRows: [], annualIncome: yearEnd ? 0 : annualIncome,
    last: { ...totals, yearEnd, annualIncome, inventoryValue: inventory.reduce((sum, lot) => sum + lot.units * lot.cost, 0), salesRows: Object.values(salesRows), purchases: purchaseRows, month: state.month, profit, cash, deposit, receivables: due + receivables, debt, loanBalance, equity, openingEquity: state.equity } }
}
