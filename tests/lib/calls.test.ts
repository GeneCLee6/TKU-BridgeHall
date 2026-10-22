import { formatCall, parseCall, splitCall, toAsciiSuits } from '../../src/lib/calls.ts'

describe('calls', () => {
  it('reads several calls written as one, the way the handouts do', () => {
    expect(formatCall('1H/S')).toBe('1♥/♠')
    expect(formatCall('3S/4C/D')).toBe('3♠/4♣/♦')
    expect(formatCall('2D/H/S')).toBe('2♦/♥/♠')
    expect(splitCall('1H/S').map((p) => p.label)).toEqual(['1 紅心', '1 黑桃'])
    expect(splitCall('2C')).toHaveLength(1)
  })

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
