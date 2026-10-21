import { formatCall, parseCall, toAsciiSuits } from '../../src/lib/calls.ts'

describe('calls', () => {
  it('formats bids with suit symbols', () => {
    expect(formatCall('2D')).toBe('2♦')
    expect(formatCall('1NT')).toBe('1NT')
    expect(formatCall('P')).toBe('Pass')
    expect(formatCall('PASS')).toBe('Pass')
    expect(formatCall('---')).toBe('—')
    expect(formatCall('??')).toBe('?')
  })

  it('gives screen readers a spoken label', () => {
    expect(parseCall('3H').label).toBe('3 紅心')
    expect(parseCall('X').label).toContain('賭倍')
  })

  it('normalises symbols to letters for search', () => {
    expect(toAsciiSuits('3♣ 迫叫，♥不fit')).toBe('3C 迫叫，H不fit')
  })
})
