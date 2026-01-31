import { describe, it, expect } from 'vitest'
import { AgentOSClient, VERSION } from '../src/index'

describe('AgentOSClient', () => {
  it('should export VERSION constant', () => {
    expect(VERSION).toBe('0.1.0')
  })

  it('should instantiate AgentOSClient', () => {
    const client = new AgentOSClient()
    expect(client).toBeInstanceOf(AgentOSClient)
    expect(client.version).toBe('0.1.0')
  })
})
