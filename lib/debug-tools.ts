// Отладочные инструменты - только для консоли
import { simpleSearch } from './simple-search'
import { fixSettings } from './fix-settings'
import { createProfile } from './create-profile'
import { findMyProfile } from './find-my-profile'
import { fixRegistrationSettings } from './fix-registration'
import { saveUserInfo } from './save-userinfo'
import { testSaveSettings } from './test-save-settings'
import { restoreUserInfoAfterPartners } from './restore-userinfo-after-partners'
import { diagnoseProfileLoading } from './diagnose-profile-loading'
import { autoFixProfile } from './auto-fix-profile'
import { preserveUserInfoDuringReload } from './preserve-userinfo'
import { clearAllLocalStorage } from './clear-localstorage'

// Добавляем все функции в window для доступа из консоли
declare global {
  interface Window {
    simpleSearch: typeof simpleSearch
    fixSettings: typeof fixSettings
    createProfile: typeof createProfile
    findMyProfile: typeof findMyProfile
    fixRegistrationSettings: typeof fixRegistrationSettings
    saveUserInfo: typeof saveUserInfo
    testSaveSettings: typeof testSaveSettings
    restoreUserInfoAfterPartners: typeof restoreUserInfoAfterPartners
    diagnoseProfileLoading: typeof diagnoseProfileLoading
    autoFixProfile: typeof autoFixProfile
    preserveUserInfoDuringReload: typeof preserveUserInfoDuringReload
    clearAllLocalStorage: typeof clearAllLocalStorage
  }
}

// Только в браузере добавляем функции
if (typeof window !== 'undefined') {
  window.simpleSearch = simpleSearch
  window.fixSettings = fixSettings
  window.createProfile = createProfile
  window.findMyProfile = findMyProfile
  window.fixRegistrationSettings = fixRegistrationSettings
  window.saveUserInfo = saveUserInfo
  window.testSaveSettings = testSaveSettings
  window.restoreUserInfoAfterPartners = restoreUserInfoAfterPartners
  window.diagnoseProfileLoading = diagnoseProfileLoading
  window.autoFixProfile = autoFixProfile
  window.preserveUserInfoDuringReload = preserveUserInfoDuringReload
  window.clearAllLocalStorage = clearAllLocalStorage
}

console.log('🔧 Отладочные инструменты загружены. Доступные команды:')
console.log('  await simpleSearch() - найти данные в Firebase')
console.log('  await fixSettings() - исправить настройки')
console.log('  await createProfile() - создать профиль')
console.log('  await findMyProfile() - найти профиль')
console.log('  await fixRegistrationSettings() - восстановить настройки регистрации')
console.log('  await saveUserInfo() - сохранить userInfo')
console.log('  await testSaveSettings() - тестировать сохранение настроек')
console.log('  await restoreUserInfoAfterPartners() - восстановить userInfo после партнеров')
console.log('  await diagnoseProfileLoading() - диагностировать загрузку профиля')
console.log('  await autoFixProfile() - автоматически исправить профиль')
console.log('  await preserveUserInfoDuringReload() - сохранить userInfo при перезагрузке')
console.log('  await clearAllLocalStorage() - очистить весь localStorage')
