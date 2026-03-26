# 🔐 Удаление пользователя из Firebase Authentication

## 📋 Проблема
Пользователь удаляется из Firestore, но остается в Firebase Authentication и может снова войти.

## 🛠️ Решения

### ✅ Способ 1: Firebase Console (Рекомендуется)

1. **Откройте Firebase Console**: https://console.firebase.google.com
2. **Выберите проект**: `newedvi`
3. **Перейдите в Authentication**: слева в меню
4. **Найдите пользователя**: `tikjan@gmail.com`
5. **Нажмите на пользователя** (три точки справа)
6. **Выберите "Delete account"**
7. **Подтвердите удаление**

### ✅ Способ 2: Firebase Admin SDK (Node.js)

Создайте файл `delete-user.js`:

```javascript
const admin = require('firebase-admin');

// Инициализация Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: 'newedvi',
    clientEmail: 'your-service-account@newedvi.iam.gserviceaccount.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n'
  })
});

const auth = admin.auth();

async function deleteUserByEmail(email) {
  try {
    // Находим пользователя по email
    const userRecord = await auth.getUserByEmail(email);
    console.log(`Найден пользователь: ${userRecord.uid}`);
    
    // Удаляем пользователя
    await auth.deleteUser(userRecord.uid);
    console.log(`✅ Пользователь ${email} удален из Authentication`);
    
    return { success: true, message: 'Пользователь удален' };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`❌ Пользователь ${email} не найден в Authentication`);
      return { success: false, message: 'Пользователь не найден' };
    } else {
      console.error(`❌ Ошибка удаления:`, error);
      return { success: false, message: error.message };
    }
  }
}

// Использование
deleteUserByEmail('tikjan@gmail.com')
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

Запустите:
```bash
node delete-user.js
```

### ✅ Способ 3: Cloud Function

Создайте Cloud Function `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.deleteAuthUser = functions.https.onCall(async (data, context) => {
  const { email } = data;
  
  // Проверка прав админа
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Требуются права админа');
  }
  
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().deleteUser(userRecord.uid);
    
    return { success: true, message: 'Пользователь удален из Authentication' };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

Вызов из клиента:
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const deleteAuthUser = httpsCallable(functions, 'deleteAuthUser');

const result = await deleteAuthUser({ email: 'tikjan@gmail.com' });
console.log(result.data);
```

## 🚀 Быстрое решение прямо сейчас

### Шаг 1: Удалите из Firestore (уже сделано)
```javascript
await deleteUserCompletelyEverywhere('tikjan@gmail.com')
```

### Шаг 2: Удалите из Firebase Console
1. https://console.firebase.google.com
2. Проект: `newedvi`
3. Authentication → Users
4. Найдите `tikjan@gmail.com`
5. Три точки → Delete account

### Шаг 3: Проверьте результат
Пользователь не сможет войти и увидит ошибку "auth/user-not-found".

## ⚠️ Важные замечания

- **Нельзя удалить текущего авторизованного пользователя** через клиентский код
- **Firebase Admin SDK** требует сервисный аккаунт и права
- **Cloud Functions** нужно развернуть в Firebase
- **Firebase Console** - самый простой и надежный способ

## 🎯 Рекомендация

Используйте **Firebase Console** для немедленного удаления пользователя из Authentication.

После удаления пользователь не сможет:
- Войти в систему
- Восстановить пароль
- Создать новый аккаунт с тем же email (если не настроено)
