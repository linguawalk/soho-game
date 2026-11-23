import test from 'node:test'
import assert from 'node:assert/strict'
import { create, advance, eventFor, migrate } from './daily.mjs'
import { start } from './engine.mjs'

const plan = { industry: 'retail', place: 'shared', channels: ['online', 'b2b'], tiers: ['regular', 'sale'],
  items: [{ id: 0, price: 19000, cost: 44.5, discount: 4, share: 50 }, { id: 1, price: 12000, cost: 45, discount: 15, share: 50 }],
  labor: 10, marketing: 16.5, handling: 1.5, rent: 90, tax: 9.25 }

test('복수 품목·채널·가격과 자유 비율로 30일을 정산한다', () => {
  let state = create('테스트', 'retail')
  assert.equal(new Set(Array.from({ length: 30 }, (_, i) => eventFor(1, i + 1).title)).size, 30)
  for (let i = 1; i <= 30; i++) {
    state = advance(state, plan, ['promotion', 'staff'], i === 1 ? [{ source: 'bank', amount: 200000 }, { source: 'government', amount: 300000 }] : [])
    if (i < 30) assert.equal(state.last, null)
  }
  assert.equal(state.day, 1)
  assert.equal(state.month, 2)
  assert.ok(state.last.regular > 0 && state.last.sale > 0)
  assert.ok(state.last.receivables > 0)
  assert.equal(state.last.rent, 153000)
  assert.equal(state.last.borrowed, 500000)
  assert.equal(state.last.cash, 3500000 + state.last.receipts + state.last.borrowed - state.last.out)
  assert.equal(state.last.cash + state.last.deposit + state.last.receivables, state.last.debt + state.last.loanBalance + state.last.equity)
  const firstReceivables = state.last.receivables
  for (let i = 1; i <= 30; i++) state = advance(state, { ...plan, rent: 0 }, [])
  assert.ok(state.last.receipts >= firstReceivables)
  assert.ok(state.last.principal > 0 && state.last.interest > 0)
  assert.equal(state.last.rent, 153000)
  assert.equal(state.last.cash + state.last.deposit + state.last.receivables, state.last.debt + state.last.loanBalance + state.last.equity)
})

test('복수 선택에서 비율을 검증하고 기존 저장을 변환한다', () => {
  const old = { ...start('retail', '기존 사업'), month: 4, stock: 5, stockValue: 40000 }
  const state = migrate(old)
  assert.equal(state.month, 4)
  assert.equal(state.day, 1)
  assert.equal(state.cash, old.cash + 40000)
  assert.throws(() => advance(state, { ...plan, marketing: 101 }, []), /비용 비율/)
  assert.throws(() => advance(state, { ...plan, channels: [] }, []), /하나 이상/)
})

test('생활소품의 사입·최소 제작·물류·재고와 가격별 수량을 계산한다', () => {
  const state = create('생활소품점', 'retail', 9000000)
  const basic = { ...plan, place: 'home', items: [plan.items[0]], channels: ['offline'] }
  const wholesale = advance(state, basic, [])
  assert.equal(wholesale.totals.cost, wholesale.today.units * 12000)
  assert.throws(() => advance(state, { ...basic, production: 999 }, []), /1,000/)
  const made = advance(state, { ...basic, production: 1000, logistics: 320000, wholesale: false }, [])
  assert.equal(made.totals.productionPaid, 7000000)
  assert.equal(made.totals.logistics, 320000)
  assert.equal(made.totals.cost, made.today.units * 7000)
  assert.equal(made.inventory[0].units, 1000 - made.today.units)
  assert.deepEqual(made.today.rows.map(row => row.price), [19000, 18240])
  assert.equal(made.today.rows.reduce((sum, row) => sum + row.units, 0), made.today.units)
})

test('채널별 직원 기준과 월별 비용, 연간 소득세를 정산한다', () => {
  const state = { ...create('생활소품점', 'retail', 50000000), month: 12, day: 29, annualIncome: 1000000 }
  const basic = { ...plan, place: 'home', items: [plan.items[0]], channels: ['online', 'offline'], vat: 10 }
  const alone = advance(state, basic, ['promotion'])
  const byChannel = channel => alone.today.rows.filter(row => row.channel === channel).reduce((sum, row) => sum + row.units, 0)
  assert.equal(byChannel('online'), 499)
  assert.equal(byChannel('offline'), 199)
  const team = { ...basic, team: { online: 1, offline: 1 } }
  const staffed = advance(state, team, ['promotion'])
  assert.ok(staffed.today.units > alone.today.units)
  assert.equal(staffed.totals.salary, 0)
  const closed = advance(staffed, team, ['promotion'])
  assert.equal(closed.last.salary, 5000000)
  assert.ok(closed.last.vat > 0 && closed.last.tax > 0 && closed.last.marketing > 0)
  assert.equal(closed.annualIncome, 0)
  assert.equal(closed.last.cash + closed.last.receivables + closed.last.deposit + closed.last.inventoryValue, closed.last.equity + closed.last.debt + closed.last.loanBalance)
  assert.equal(advance({ ...staffed, month: 11 }, team, []).last.tax, 0)
})
