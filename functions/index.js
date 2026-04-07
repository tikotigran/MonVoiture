const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Инициализация Firebase Admin
admin.initializeApp();

// CORS middleware
const cors = require('cors')({origin: true});

// Удаление пользователя из Authentication
exports.deleteAuthUser = functions.https.onCall(async (data, context) => {
  // CORS обработка
  if (context.rawRequest.method === 'OPTIONS') {
    return { status: 200 };
  }

  const { email } = data;
  
  // Проверка что запрос от админа
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Требуется авторизация');
  }
  
  // Проверка что это админ (tikjan1983@gmail.com)
  if (context.auth.token.email !== 'tikjan1983@gmail.com') {
    throw new functions.https.HttpsError('permission-denied', 'Только администратор может удалять пользователей');
  }
  
  try {
    console.log(`Попытка удаления пользователя из Authentication: ${email}`);
    
    // Находим пользователя по email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`Найден пользователь: ${userRecord.uid}`);
    
    // Удаляем пользователя
    await admin.auth().deleteUser(userRecord.uid);
    console.log(`✅ Пользователь ${email} удален из Authentication`);
    
    return { 
      success: true, 
      message: `Пользователь ${email} удален из Authentication`,
      uid: userRecord.uid
    };
    
  } catch (error) {
    console.error(`❌ Ошибка удаления пользователя ${email}:`, error);
    
    if (error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError('not-found', `Пользователь ${email} не найден в Authentication`);
    } else {
      throw new functions.https.HttpsError('internal', `Ошибка удаления: ${error.message}`);
    }
  }
});

// Проверка существует ли пользователь в Authentication
exports.checkAuthUser = functions.https.onCall(async (data, context) => {
  // CORS обработка
  if (context.rawRequest.method === 'OPTIONS') {
    return { status: 200 };
  }

  const { email } = data;
  
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Требуется авторизация');
  }
  
  if (context.auth.token.email !== 'tikjan1983@gmail.com') {
    throw new functions.https.HttpsError('permission-denied', 'Только администратор может проверять пользователей');
  }
  
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    
    return { 
      success: true, 
      exists: true,
      uid: userRecord.uid,
      email: userRecord.email,
      createdAt: userRecord.metadata.creationTime,
      lastSignIn: userRecord.metadata.lastSignInTime
    };
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return { 
        success: true, 
        exists: false,
        message: 'Пользователь не найден в Authentication'
      };
    } else {
      throw new functions.https.HttpsError('internal', `Ошибка проверки: ${error.message}`);
    }
  }
});

// Получение списка всех пользователей в Authentication
exports.listAuthUsers = functions.https.onCall(async (data, context) => {
  // CORS обработка
  if (context.rawRequest.method === 'OPTIONS') {
    return { status: 200 };
  }

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Требуется авторизация');
  }
  
  if (context.auth.token.email !== 'tikjan1983@gmail.com') {
    throw new functions.https.HttpsError('permission-denied', 'Только администратор может просматривать пользователей');
  }
  
  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    const users = listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.metadata.creationTime,
      lastSignIn: user.metadata.lastSignInTime,
      disabled: user.disabled
    }));
    
    return { 
      success: true, 
      users: users,
      total: users.length
    };
    
  } catch (error) {
    throw new functions.https.HttpsError('internal', `Ошибка получения списка: ${error.message}`);
  }
});
