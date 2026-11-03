import type { TranslationSchema } from '../types';

export const zhHant: TranslationSchema = {
  languageSelector: { search: '搜尋語言...', noResults: '找不到語言' },
  common: {
    paste: '貼上',
    loading: '載入中...', error: '錯誤', back: '返回', close: '關閉', cancel: '取消', confirm: '確認', save: '儲存',
    active: '已啟用', inUse: '使用中', all: '全部', other: '其他', categories: '類別', configs: '設定', online: '線上', offline: '離線',
  },
  header: {
    connected: '已連線', connecting: '正在連線...', stopping: '正在中斷連線...', noNetwork: '無網路', auth: '正在驗證...',
    authFailed: '驗證失敗', disconnected: '未連線', openMenu: '開啟選單', themeAuto: '自動', themeDark: '深色', themeLight: '淺色',
    themeAutoToast: '佈景主題：自動 (SDK)', themeDarkToast: '佈景主題：深色', themeLightToast: '佈景主題：淺色',
  },
  serverSelector: {
    autoConnectTitle: '自動連線', allCategoriesSub: '所有類別', chooseConfig: '選擇設定', noCategory: '無類別', updateConfigs: '更新設定',
    checkUser: '檢查帳戶', airplaneMode: '飛航模式', filterByCountry: '依國家篩選', filtered: '（已篩選）',
    searchPlaceholder: '搜尋設定或類別...', searchInCountryPlaceholder: '在{country}中搜尋...', categoriesTitle: '類別', configsTitle: '設定',
    availableConfigsCount: '可用設定：{count}', currentConfig: '目前設定：', selectConfigPrompt: '選擇一個設定以連線',
    noResultsTitle: '沒有結果', noResultsDesc: '找不到與「{query}」相關的類別或設定。', noCategoryForCountryTitle: '此國家暫無類別',
    noCategoryForCountryDesc: '找不到帶有所選國旗的類別。', seeAllCountries: '查看所有國家 ({count})', noConfigsFoundTitle: '找不到設定',
    noConfigsFoundDesc: '需要穩定的網際網路連線才能下載最新設定。', checkConnectionPrompt: '請檢查網路連線後重試',
  },
  connectionForm: {
    connected: '中斷連線', connecting: '正在連線...', disconnected: '連線', stopping: '正在停止...', cancel: '取消',
    credentialsAlreadySet: '此設定已有登入憑證。', usernamePlaceholder: '使用者名稱', passwordPlaceholder: '密碼', uuidPlaceholder: 'UUID',
    showPassword: '顯示密碼', hidePassword: '隱藏密碼', showUuid: '顯示 UUID', hideUuid: '隱藏 UUID', uuidHelpTitle: '什麼是 UUID？',
    uuidHelpDesc1: '這是您的 V2Ray 的唯一登入金鑰。', uuidHelpDesc2: '購買後由機器人傳送。', uuidHelpExample: '範例：',
    uuidHelpWarning: '複製時請勿加入多餘空格。', authFailedError: '驗證失敗', noNetworkError: '無網際網路連線', recordsButton: '記錄', autoConnectButton: '自動連線',
  },
  networkStats: { title: '統計', download: '下載', upload: '上傳', total: '總計：{total}' },
  sidebar: {
    quickActions: '快捷操作', notifications: '通知', myCredentials: '我的憑證', generateTest: '建立試用（電子郵件）', recoverLogin: '復原帳戶',
    main: '主要功能', tutorials: '教學', servers: '伺服器', checkUser: '檢查帳戶', tools: '工具', autoTest: '自動測試', speedTest: '速度測試',
    hotspot: '熱點', ipFinder: 'IP 查詢', support: '支援', settings: '設定', customDns: '自訂 DNS', errorReport: '錯誤報告', battery: '電池',
    apnSettings: 'APN 設定', networkSettings: '網路設定', checkUpdates: '檢查更新', activeBadge: '已啟用', language: '語言', selectLanguage: '選擇語言',
    terms: '條款', privacy: '隱私', clearData: '清除資料',
  },
  countryFilter: { filterByCountry: '依國家篩選', filtered: '（已篩選）', all: '全部', other: '其他', categoriesLabel: '類別', configsLabel: '設定' },
  autoConnect: {
    modalTitle: '篩選與登入', confirmTitle: '確認測試', regionFilter: '地區 / 國家', allRegions: '所有地區', categoriesFilter: '類別',
    allCategories: '所有類別', allCategoriesInRegion: '所有類別 ({region})', configTypeLabel: '設定類型', typeAll: '全部 (SSH + V2Ray)',
    typeSsh: 'SSH / Proxy', typeV2ray: 'V2Ray', configsToTest: '將測試 {count} 個設定', credentialsTitle: '登入憑證',
    noConfigsFound: '此地區找不到設定', regionLabel: '地區：',
  },
};
