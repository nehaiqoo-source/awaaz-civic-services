import { mount } from '../../overlay/ui'
import { TransportError, type ActTransport, type Transport } from '../../overlay/transport'
import { ext } from './ext'
import { AWAAZ_ACT, AWAAZ_FILL, type ActMessage, type ActResponse, type FillMessage, type FillResponse } from './messages'

/** In the extension, API calls go through the background worker so the host page's CSP/CORS cannot block them. */
const transport: Transport = async (request) => {
  let response: FillResponse | undefined
  try {
    response = (await ext.runtime.sendMessage({ type: AWAAZ_FILL, request } satisfies FillMessage)) as FillResponse | undefined
  } catch {
    throw new TransportError('network')
  }
  if (!response || !response.ok) throw new TransportError(response && !response.ok ? response.error : 'network')
  return response.result
}

const actTransport: ActTransport = async (request) => {
  let response: ActResponse | undefined
  try {
    response = (await ext.runtime.sendMessage({ type: AWAAZ_ACT, request } satisfies ActMessage)) as ActResponse | undefined
  } catch {
    throw new TransportError('network')
  }
  if (!response || !response.ok) throw new TransportError(response && !response.ok ? response.error : 'network')
  return response.plan
}

window.__AWAAZ__ = { transport, actTransport }
mount(window)
