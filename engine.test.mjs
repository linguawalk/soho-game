import test from 'node:test'
import assert from 'node:assert/strict'
import { start, defaults, settle } from './engine.mjs'
import { industries, events } from './data.mjs'

test('모든 업종의 첫 달을 마감하고 다음 상황을 받는다', () => {
  for (const industry of Object.keys(industries)) {
    const first = start(industry, '테스트')
    const second = settle(first, defaults(first))
    assert.equal(second.month, 2)
    assert.ok(second.last.revenue > 0)
    assert.ok(events[second.event])
    assert.deepEqual(JSON.parse(JSON.stringify(second)), second)
  }
})

test('사입량이 현금과 재고에 반영된다', () => {
  const state = start('retail', '테스트')
  const small = settle(state, { ...defaults(state), quantity: 30 })
  const large = settle(state, { ...defaults(state), quantity: 100 })
  assert.notEqual(small.cash, large.cash)
  assert.ok(large.stock > small.stock)
})

test('임대료, 배송비와 업종 전환이 반영된다', () => {
  const state = start('retail', '테스트')
  const next = settle(state, { ...defaults(state), quantity: 100, channel: 'platform', place: 'shop' })
  assert.equal(next.last.rent, 390000)
  assert.ok(next.last.fees > 0)
  const changed = settle(next, { ...defaults(next, 'service'), place: 'home' })
  assert.equal(changed.last.released, 1400000)
  assert.ok(changed.last.salvage > 0)
  assert.equal(changed.stock, 0)
})

test('현금 부족으로 확정이 실패하면 원래 사업은 그대로다', () => {
  const state = start('retail', '테스트')
  assert.throws(() => settle(state, { ...defaults(state), quantity: 500 }), /현금/)
  assert.equal(state.month, 1)
})
