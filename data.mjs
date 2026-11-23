export const industries = {
  retail: { name: '판매업', product: '생활소품', unitCost: 8500, price: 19000, capacity: 90, demand: 58, action: '사입 수량', initial: 45 },
  service: { name: '서비스업', product: '자전거 점검', unitCost: 4000, price: 34000, capacity: 32, demand: 24, action: '예약 접수 한도', initial: 22 },
  manufacturing: { name: '제조업', product: '맞춤 안내판', unitCost: 14000, price: 42000, capacity: 38, demand: 27, action: '생산 수량', initial: 24 },
}

export const channels = {
  direct: { name: '직접 주문', reach: 1, fee: 0, handling: 0 },
  platform: { name: '온라인 플랫폼', reach: 1.35, fee: 0.09, handling: 2400 },
  local: { name: '현장 접수', reach: 1.16, fee: 0.02, handling: 500 },
}

export const places = {
  home: { name: '자택 거점', deposit: 0, rent: 0, capacity: 0 },
  shared: { name: '공유 작업실', deposit: 250000, rent: 170000, capacity: 20 },
  shop: { name: '동네 점포', deposit: 1400000, rent: 390000, capacity: 48 },
}

export const events = {
  opening: { name: '첫 고객을 만나다', story: '이번 달부터 주문을 받을 수 있습니다. 가격과 물량을 정하고 첫 거래를 시작하세요.', demand: 1, supply: 1 },
  busy: { name: '지역 행사', story: '주말 지역 행사로 문의가 늘었습니다. 늘어난 수요를 얼마나 감당할 수 있을까요?', demand: 1.35, supply: 1 },
  supply: { name: '공급가 인상', story: '이번 달 소모품과 재료 단가가 올랐습니다. 기존 재고는 기존 장부가를 유지합니다.', demand: 1, supply: 1.24 },
  quiet: { name: '한산한 달', story: '시장 수요가 낮아졌습니다. 가격과 물량을 점검할 시기입니다.', demand: 0.76, supply: 1 },
  repeat: { name: '소개로 찾아온 고객', story: '지난달 거래를 마친 고객들이 주변에 사업을 소개했습니다.', demand: 1.22, supply: 1 },
}
