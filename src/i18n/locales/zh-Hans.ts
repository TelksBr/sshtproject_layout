import type { TranslationSchema } from '../types';

export const zhHans: TranslationSchema = {
  languageSelector: { search: '搜索语言...', noResults: '未找到语言' },
  common: {
    paste: '粘贴',
    loading: '正在加载...', error: '错误', back: '返回', close: '关闭', cancel: '取消', confirm: '确认', save: '保存',
    active: '已启用', inUse: '使用中', all: '全部', other: '其他', categories: '类别', configs: '配置', online: '在线', offline: '离线',
  },
  header: {
    connected: '已连接', connecting: '正在连接...', stopping: '正在断开连接...', noNetwork: '无网络', auth: '正在验证...',
    authFailed: '验证失败', disconnected: '未连接', openMenu: '打开菜单', themeAuto: '自动', themeDark: '深色', themeLight: '浅色',
    themeAutoToast: '主题：自动 (SDK)', themeDarkToast: '主题：深色', themeLightToast: '主题：浅色',
  },
  serverSelector: {
    autoConnectTitle: '自动连接', allCategoriesSub: '所有类别', chooseConfig: '选择配置', noCategory: '无类别', updateConfigs: '更新配置',
    checkUser: '检查账户', airplaneMode: '飞行模式', filterByCountry: '按国家筛选', filtered: '（已筛选）',
    searchPlaceholder: '搜索配置或类别...', searchInCountryPlaceholder: '在{country}中搜索...', categoriesTitle: '类别', configsTitle: '配置',
    availableConfigsCount: '可用配置：{count}', currentConfig: '当前配置：', selectConfigPrompt: '选择一个配置以连接',
    noResultsTitle: '无结果', noResultsDesc: '未找到与“{query}”相关的类别或配置。', noCategoryForCountryTitle: '此国家暂无类别',
    noCategoryForCountryDesc: '未找到带有所选国旗的类别。', seeAllCountries: '查看所有国家 ({count})', noConfigsFoundTitle: '未找到配置',
    noConfigsFoundDesc: '需要稳定的互联网连接才能下载最新配置。', checkConnectionPrompt: '请检查网络连接后重试',
  },
  connectionForm: {
    connected: '断开连接', connecting: '正在连接...', disconnected: '连接', stopping: '正在停止...', cancel: '取消',
    credentialsAlreadySet: '此配置已设置登录凭据。', usernamePlaceholder: '用户名', passwordPlaceholder: '密码', uuidPlaceholder: 'UUID',
    showPassword: '显示密码', hidePassword: '隐藏密码', showUuid: '显示 UUID', hideUuid: '隐藏 UUID', uuidHelpTitle: '什么是 UUID？',
    uuidHelpDesc1: '这是您的 V2Ray 的唯一登录密钥。', uuidHelpDesc2: '购买后由机器人发送。', uuidHelpExample: '示例：',
    uuidHelpWarning: '复制时请勿添加多余空格。', authFailedError: '验证失败', noNetworkError: '无互联网连接', recordsButton: '日志', autoConnectButton: '自动连接',
  },
  networkStats: { title: '统计', download: '下载', upload: '上传', total: '总计：{total}' },
  sidebar: {
    quickActions: '快捷操作', notifications: '通知', myCredentials: '我的凭据', generateTest: '创建试用（电子邮件）', recoverLogin: '恢复账户',
    main: '主要功能', tutorials: '教程', servers: '服务器', checkUser: '检查账户', tools: '工具', autoTest: '自动测试', speedTest: '速度测试',
    hotspot: '热点', ipFinder: 'IP 查询', support: '支持', settings: '设置', customDns: '自定义 DNS', errorReport: '错误报告', battery: '电池',
    apnSettings: 'APN 设置', networkSettings: '网络设置', checkUpdates: '检查更新', activeBadge: '已启用', language: '语言', selectLanguage: '选择语言',
    terms: '条款', privacy: '隐私', clearData: '清除数据',
  },
  countryFilter: { filterByCountry: '按国家筛选', filtered: '（已筛选）', all: '全部', other: '其他', categoriesLabel: '类别', configsLabel: '配置' },
  autoConnect: {
    modalTitle: '筛选与登录', confirmTitle: '确认测试', regionFilter: '地区 / 国家', allRegions: '所有地区', categoriesFilter: '类别',
    allCategories: '所有类别', allCategoriesInRegion: '所有类别 ({region})', configTypeLabel: '配置类型', typeAll: '全部 (SSH + V2Ray)',
    typeSsh: 'SSH / Proxy', typeV2ray: 'V2Ray', configsToTest: '将测试 {count} 个配置', credentialsTitle: '登录凭据',
    noConfigsFound: '此地区未找到配置', regionLabel: '地区：',
  },
};
