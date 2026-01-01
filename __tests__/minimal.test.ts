describe('Vitest Setup', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test')
    expect(process.env.SESSION_SECRET).toBeDefined()
  })

  it('should have globals enabled', () => {
    expect(typeof describe).toBe('function')
    expect(typeof it).toBe('function')
    expect(typeof expect).toBe('function')
  })
})
