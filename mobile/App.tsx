import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type Ref } from 'react'
import { AppState, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { WebView as RNWebView, type WebViewMessageEvent, type WebViewNavigation, type WebViewProps } from 'react-native-webview'
import type { HostEvent } from './src/generated/bridge-protocol'
import { OVERLAY_SOURCE } from './src/generated/overlay-bundle'
import { createHostController } from './src/host-controller'
import { createFillProxy, speakPort, speechPort } from './src/native'
import { isAllowedNavigation, normalizeUrl } from './src/url'

/**
 * react-native-webview 14.0.1 implements these methods with forwardRef + useImperativeHandle (verified in lib/WebView.android.js),
 * but its .d.ts types the component as a plain function component without a ref. This narrow type describes only what we use.
 */
interface WebViewHandle {
  goBack(): void
  goForward(): void
  injectJavaScript(script: string): void
}
const WebView = RNWebView as unknown as ComponentType<WebViewProps & { ref?: Ref<WebViewHandle> }>

/** Emulator default (Android maps the host machine to 10.0.2.2). Real devices need your deployed HTTPS address. */
// Release builds talk to the live server; the emulator address is for development only.
const DEFAULT_API_BASE = process.env.EXPO_PUBLIC_API_BASE || (__DEV__ ? 'http://10.0.2.2:3000' : 'https://www.awaaz.help')
/** Home screen shortcuts: pages of the Awaaz site, opened in the built-in browser. */
const SHORTCUTS = [
  { path: '/saathi', en: 'Not sure which service? Ask Saathi', hi: 'कौन सी सेवा चाहिए? साथी से पूछें' },
  { path: '/grievance', en: 'File a complaint by voice', hi: 'बोलकर शिकायत दर्ज करें' },
  { path: '/help', en: 'Help guides', hi: 'मदद गाइड' },
  { path: '/demo-form', en: 'Try the demo form', hi: 'डेमो फॉर्म आज़माएँ' },
] as const
const ARM_TIMEOUT_MS = 10 * 60 * 1000

/** Runs before page scripts: lets the overlay find the native bridge. */
const BEFORE_CONTENT_LOADED = `
  window.__AWAAZ_HOST__ = { postMessage: function (m) { window.ReactNativeWebView.postMessage(m); } };
  true;
`

const CLOSE_OVERLAY = `
  (function () { var r = document.getElementById('awaaz-root'); if (r) r.dispatchEvent(new CustomEvent('awaaz-close')); })();
  true;
`

export default function App() {
  return (
    <SafeAreaProvider>
      <Browser />
    </SafeAreaProvider>
  )
}

function Browser() {
  const webViewRef = useRef<WebViewHandle>(null)
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE)
  const apiBaseRef = useRef(apiBase)
  const [address, setAddress] = useState('')
  const [uri, setUri] = useState<string | null>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [armed, setArmed] = useState(false)
  const armedRef = useRef(false)
  const armTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [showSettings, setShowSettings] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    apiBaseRef.current = apiBase
  }, [apiBase])

  const send = useCallback((event: HostEvent) => {
    const payload = JSON.stringify(JSON.stringify(event))
    webViewRef.current?.injectJavaScript(`window.__awaazHostReceive && window.__awaazHostReceive(${payload}); true;`)
  }, [])

  const controller = useMemo(
    () =>
      createHostController({
        speech: speechPort,
        tts: speakPort,
        fill: createFillProxy(() => apiBaseRef.current),
        act: createFillProxy(() => apiBaseRef.current, '/api/act'),
        send,
        isArmed: () => armedRef.current,
      }),
    [send],
  )

  /** The microphone only works while armed, which only the native button can do. Page scripts cannot arm it. */
  const setAwaazOn = useCallback(
    (on: boolean) => {
      clearTimeout(armTimer.current)
      armedRef.current = on
      setArmed(on)
      if (on) armTimer.current = setTimeout(() => setAwaazOn(false), ARM_TIMEOUT_MS)
      else controller.disarm()
    },
    [controller],
  )

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') setAwaazOn(false)
    })
    return () => subscription.remove()
  }, [setAwaazOn])

  function go() {
    const next = normalizeUrl(address)
    if (!next) {
      setMessage('Enter a valid web address, for example https://example.gov.in')
      return
    }
    setMessage(null)
    setUri(next)
  }

  function openAwaaz() {
    if (!uri) {
      setMessage('Open a form page first, then tap Awaaz.')
      return
    }
    setMessage(null)
    // The overlay toggles when injected twice, so remove any open panel first to always get a fresh one.
    if (armedRef.current) webViewRef.current?.injectJavaScript(CLOSE_OVERLAY)
    setAwaazOn(true)
    webViewRef.current?.injectJavaScript(`${OVERLAY_SOURCE}\n;true;`)
  }

  function stopAwaaz() {
    setAwaazOn(false)
    webViewRef.current?.injectJavaScript(CLOSE_OVERLAY)
  }

  function onNavigationStateChange(nav: WebViewNavigation) {
    setCanGoBack(nav.canGoBack)
    setCanGoForward(nav.canGoForward)
    if (nav.url) setAddress(nav.url)
  }

  function onMessage(event: WebViewMessageEvent) {
    controller.handle(event.nativeEvent.data)
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.toolbar}>
        <ToolButton label="‹" disabled={!canGoBack} onPress={() => webViewRef.current?.goBack()} />
        <ToolButton label="›" disabled={!canGoForward} onPress={() => webViewRef.current?.goForward()} />
        <TextInput
          style={styles.address}
          value={address}
          onChangeText={setAddress}
          onSubmitEditing={go}
          placeholder="Type the service website address"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          accessibilityLabel="Web address"
        />
        <ToolButton label="Go" onPress={go} />
        <ToolButton label="⚙" onPress={() => setShowSettings((v) => !v)} />
      </View>

      {showSettings && (
        <View style={styles.settings}>
          <Text style={styles.label}>Awaaz server (HTTPS in production)</Text>
          <TextInput
            style={styles.address}
            value={apiBase}
            onChangeText={setApiBase}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            accessibilityLabel="Awaaz server address"
          />
          <Text style={styles.note}>Only your spoken answer and the form's field names are sent, and only when on-device rules cannot understand an answer.</Text>
        </View>
      )}

      {message && (
        <Text style={styles.error} accessibilityRole="alert">
          {message}
        </Text>
      )}

      {armed && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Awaaz is on. The microphone is used only while you answer.</Text>
          <Pressable onPress={stopAwaaz} accessibilityRole="button" style={styles.bannerButton}>
            <Text style={styles.bannerButtonText}>Stop</Text>
          </Pressable>
        </View>
      )}

      {uri ? (
        <WebView
          ref={webViewRef}
          source={{ uri }}
          style={styles.web}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['https://*', 'http://*']}
          setSupportMultipleWindows={false}
          injectedJavaScriptBeforeContentLoaded={BEFORE_CONTENT_LOADED}
          onShouldStartLoadWithRequest={(request) => isAllowedNavigation(request.url)}
          onLoadStart={() => setAwaazOn(false)}
          onNavigationStateChange={onNavigationStateChange}
          onMessage={onMessage}
        />
      ) : (
        <View style={styles.home}>
          <Text style={styles.title}>Awaaz · आवाज़</Text>
          <Text style={styles.lede}>
            Open any service form here, tap Awaaz, and answer by voice. Awaaz asks each question aloud and fills the form. You press Submit yourself.
          </Text>
          {SHORTCUTS.map((item) => (
            <Pressable
              key={item.path}
              style={styles.chip}
              accessibilityRole="button"
              accessibilityLabel={item.en}
              onPress={() => {
                setAddress(`${apiBase}${item.path}`)
                setUri(`${apiBase}${item.path}`)
              }}
            >
              <Text style={styles.chipText}>{item.en}</Text>
              <Text style={styles.chipHi}>{item.hi}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable style={styles.fab} onPress={openAwaaz} accessibilityRole="button" accessibilityLabel="Fill this form by voice">
        <Text style={styles.fabText}>🎤 Awaaz · आवाज़</Text>
      </Pressable>
    </SafeAreaView>
  )
}

function ToolButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.toolButton, disabled && styles.disabled]}
    >
      <Text style={styles.toolButtonText}>{label}</Text>
    </Pressable>
  )
}

const INK = '#1c2433'
const ACCENT = '#b8460f'

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#faf6ee' },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  toolButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: INK, paddingHorizontal: 8 },
  toolButtonText: { color: INK, fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.35 },
  address: { flex: 1, minHeight: 44, borderWidth: 1.5, borderColor: '#cfc6b2', borderRadius: 10, paddingHorizontal: 10, backgroundColor: '#fff', color: INK },
  settings: { paddingHorizontal: 8, paddingBottom: 8, gap: 6 },
  label: { fontWeight: '700', color: INK },
  note: { color: '#5b6475', fontSize: 13 },
  error: { color: '#a31515', fontWeight: '600', paddingHorizontal: 12, paddingBottom: 6 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fde8d8', paddingHorizontal: 12, paddingVertical: 6 },
  bannerText: { flex: 1, color: INK, fontSize: 14 },
  bannerButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: INK },
  bannerButtonText: { color: '#fff', fontWeight: '700' },
  web: { flex: 1 },
  home: { flex: 1, padding: 24, gap: 14, justifyContent: 'center' },
  title: { fontSize: 36, fontWeight: '800', color: INK },
  lede: { fontSize: 17, color: '#5b6475', lineHeight: 24 },
  chip: { alignSelf: 'stretch', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: ACCENT },
  chipText: { color: ACCENT, fontWeight: '700', fontSize: 16 },
  chipHi: { color: '#5b6475', fontSize: 14, marginTop: 2 },
  fab: { position: 'absolute', right: 14, bottom: 22, backgroundColor: ACCENT, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 28, elevation: 6 },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 16 },
})
