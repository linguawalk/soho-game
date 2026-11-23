import { industries, channels, places, events } from './data.mjs'

export function start(industry, name) {
  if (!Object.hasOwn(industries, industry)) throw Error('업종을 선택하세요.')
  return { version: 1, name, industry, month: 1, cash: 3500000, stock: 0, stockValue: 0, debt: 0, place: 'home', lease: { rent: 0, deposit: 0 }, channel: 'direct', event: 'opening', last: null }
}

export function defaults(state, industry = state.industry) {
  return { industry, channel: state.channel, place: state.place, price: industries[industry].price, quantity: industries[industry].initial }
}

export function settle(state, choice) {
  const { industry, channel, place, price, quantity } = choice
  if (!Object.hasOwn(industries, industry) || !Object.hasOwn(channels, channel) || !Object.hasOwn(places, place)) throw Error('업종, 판매 방식과 사업장을 확인하세요.')
  if (!Number.isInteger(price) || price < 1000 || price > 1000000 || !Number.isInteger(quantity) || quantity < 0 || quantity > 500) throw Error('가격은 1,000~1,000,000원, 수량은 0~500 사이의 정수여야 합니다.')
  const business = industries[industry]
  const outlet = channels[channel]
  const venue = places[place]
  const event = events[state.event]
  const service = industry === 'service'
  const switching = industry !== state.industry
  const moving = place !== state.place
  const lease = moving ? { rent: venue.rent, deposit: venue.deposit } : state.lease
  const released = moving ? state.lease.deposit : 0
  const deposit = moving ? lease.deposit : 0
  const salvage = switching ? Math.round(state.stockValue / 2) : 0
  const stock = switching ? 0 : state.stock
  const capacity = business.capacity + venue.capacity
  if (industry !== 'retail' && quantity > capacity) throw Error('선택한 사업장에서 처리 가능한 수량은 ' + capacity + '건입니다.')
  const cost = Math.round(business.unitCost * event.supply)
  const purchase = service ? 0 : quantity * cost
  const available = state.cash + released + salvage
  if (purchase + deposit > available) throw Error('발주·생산비와 보증금을 지불할 현금이 부족합니다.')
  const demand = Math.round(business.demand * event.demand * outlet.reach * Math.min(2, (business.price / price) ** 1.2))
  const supplied = service ? quantity : stock + quantity
  const sold = Math.min(supplied, capacity, demand)
  const revenue = sold * price
  const goods = (switching ? 0 : state.stockValue) + purchase
  const costOfSales = service ? sold * cost : supplied ? Math.round(sold * goods / supplied) : 0
  const fees = Math.round(revenue * outlet.fee)
  const handling = sold * outlet.handling
  const arrears = state.debt + lease.rent + fees + handling + (service ? costOfSales : 0)
  const afterSales = available - deposit - purchase + revenue
  const debt = Math.max(0, arrears - afterSales)
  const profit = revenue - costOfSales - fees - handling - lease.rent - (switching ? state.stockValue - salvage : 0)
  const nextEvent = state.month % 3 === 0 ? 'quiet' : state.month % 2 === 0 ? 'supply' : sold > 0 && sold >= demand * 0.85 ? 'repeat' : 'busy'
  return { ...state, industry, channel, place, lease, cash: Math.max(0, afterSales - arrears), debt, stock: service ? 0 : supplied - sold,
    stockValue: service ? 0 : goods - costOfSales, month: state.month + 1, event: nextEvent,
    last: { month: state.month, demand, sold, revenue, profit, purchase, costOfSales, fees, handling, rent: lease.rent, deposit, released, salvage } }
}
