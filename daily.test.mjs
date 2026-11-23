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
